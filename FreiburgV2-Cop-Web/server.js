require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const required = ['SESSION_SECRET','DB_HOST','DB_USER','DB_PASSWORD','DB_NAME','FIVEM_API_KEY'];
for (const key of required) if (!process.env[key] || process.env[key].startsWith('CHANGE_ME')) {
  console.warn(`WARNUNG: ${key} fehlt oder muss geändert werden.`);
}
const pool = mysql.createPool({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10,
  charset: 'utf8mb4'
});
const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({limit:'32kb'}));
app.use(express.urlencoded({extended:false, limit:'16kb'}));
app.use(rateLimit({windowMs: 15*60*1000, limit: 250, standardHeaders: true, legacyHeaders: false}));
const sessionStore = new MySQLStore({}, pool);
app.use(session({
  name: 'fv2.sid', secret: process.env.SESSION_SECRET || 'development-only-change-me',
  store: sessionStore, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8*60*60*1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

const rolePermissions = {
  admin: ['portal:view','tablet:view','reports:read','reports:create','users:manage','dispatch:view'],
  police: ['portal:view','tablet:view','reports:read','reports:create','dispatch:view'],
  ems: ['portal:view','tablet:view','reports:read','reports:create','dispatch:view'],
  fire: ['portal:view','tablet:view','reports:read','reports:create','dispatch:view'],
  citizen: ['portal:view']
};
function hasPermission(user, permission) {
  return !!user && (rolePermissions[user.role] || []).includes(permission);
}
function auth(req,res,next) {
  if (!req.session.user) return res.status(401).json({error:'Bitte anmelden.'});
  next();
}
function permit(permission) {
  return (req,res,next) => hasPermission(req.session.user, permission)
    ? next() : res.status(403).json({error:'Keine Berechtigung.'});
}
function apiKey(req,res,next) {
  const provided = req.get('x-freiburg-api-key');
  if (!provided || !process.env.FIVEM_API_KEY || provided !== process.env.FIVEM_API_KEY)
    return res.status(401).json({error:'Ungültiger API-Schlüssel.'});
  next();
}
app.get('/api/me', (req,res) => res.json({user:req.session.user || null}));
app.post('/api/register', async (req,res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username) || password.length < 12)
    return res.status(400).json({error:'Benutzername: 3–32 Zeichen (Buchstaben/Zahlen/_/-). Passwort: mindestens 12 Zeichen.'});
  try {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute('INSERT INTO users (username,password_hash,role) VALUES (?,?,?)', [username,hash,'citizen']);
    req.session.user = {id:result.insertId, username, role:'citizen'};
    res.status(201).json({user:req.session.user});
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({error:'Dieser Benutzername ist bereits vergeben.'});
    console.error(e); res.status(500).json({error:'Registrierung fehlgeschlagen.'});
  }
});
app.post('/api/login', async (req,res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  try {
    const [rows] = await pool.execute('SELECT id,username,password_hash,role FROM users WHERE username=? LIMIT 1',[username]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash)))
      return res.status(401).json({error:'Anmeldedaten ungültig.'});
    req.session.regenerate(err => {
      if (err) return res.status(500).json({error:'Sitzung konnte nicht gestartet werden.'});
      req.session.user = {id:rows[0].id, username:rows[0].username, role:rows[0].role};
      req.session.save(() => res.json({user:req.session.user}));
    });
  } catch(e) { console.error(e); res.status(500).json({error:'Anmeldung fehlgeschlagen.'}); }
});
app.post('/api/logout', (req,res) => req.session.destroy(() => {
  res.clearCookie('fv2.sid'); res.json({ok:true});
}));
app.get('/api/reports', auth, permit('reports:read'), async (req,res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT r.id,r.title,r.body,r.category,r.created_at,u.username AS author FROM reports r JOIN users u ON u.id=r.created_by ORDER BY r.created_at DESC LIMIT 100');
    res.json({reports:rows});
  } catch(e) { console.error(e); res.status(500).json({error:'Berichte konnten nicht geladen werden.'}); }
});
app.post('/api/reports', auth, permit('reports:create'), async (req,res) => {
  const title = String(req.body.title || '').trim().slice(0,120);
  const body = String(req.body.body || '').trim().slice(0,5000);
  const category = ['incident','patrol','medical','fire','other'].includes(req.body.category) ? req.body.category : 'other';
  if (title.length < 3 || body.length < 3) return res.status(400).json({error:'Titel und Bericht müssen mindestens 3 Zeichen lang sein.'});
  try {
    const [r] = await pool.execute('INSERT INTO reports (title,body,category,created_by) VALUES (?,?,?,?)',[title,body,category,req.session.user.id]);
    res.status(201).json({id:r.insertId});
  } catch(e) { console.error(e); res.status(500).json({error:'Bericht konnte nicht gespeichert werden.'}); }
});
app.get('/api/admin/users', auth, permit('users:manage'), async (req,res) => {
  const [rows] = await pool.execute('SELECT id,username,role,created_at FROM users ORDER BY id DESC LIMIT 200');
  res.json({users:rows});
});
app.patch('/api/admin/users/:id/role', auth, permit('users:manage'), async (req,res) => {
  const role = String(req.body.role || '');
  if (!['admin','police','ems','fire','citizen'].includes(role)) return res.status(400).json({error:'Ungültige Rolle.'});
  if (Number(req.params.id) === Number(req.session.user.id) && role !== 'admin')
    return res.status(400).json({error:'Die eigene Admin-Rolle kann hier nicht geändert werden.'});
  await pool.execute('UPDATE users SET role=? WHERE id=?',[role,req.params.id]);
  res.json({ok:true});
});
// Endpoint called only by the FiveM server resource. Never call this from browser code.
app.post('/api/fivem/event', apiKey, async (req,res) => {
  const eventType = String(req.body.type || '').slice(0,60);
  if (!/^[a-zA-Z0-9_.-]{1,60}$/.test(eventType)) return res.status(400).json({error:'Ungültiger Ereignistyp.'});
  const payload = JSON.stringify(req.body.payload || {});
  await pool.execute('INSERT INTO fivem_events (event_type,payload) VALUES (?,?)',[eventType,payload]);
  res.status(202).json({ok:true});
});
app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`FreiburgV2 Cop-Web läuft auf Port ${port}`));
