require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
(async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || '';
  if (password.length < 12 || password.startsWith('ChangeThis')) {
    console.error('Bitte in .env ein eigenes ADMIN_PASSWORD mit mindestens 12 Zeichen setzen.'); process.exit(1);
  }
  const db = await mysql.createConnection({
    host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306),
    user:process.env.DB_USER, password:process.env.DB_PASSWORD, database:process.env.DB_NAME
  });
  const hash = await bcrypt.hash(password,12);
  await db.execute(
    'INSERT INTO users (username,password_hash,role) VALUES (?,?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role=VALUES(role)',
    [username,hash,'admin']
  );
  console.log(`Admin '${username}' erstellt/aktualisiert. Passwort nur lokal in .env hinterlegt.`);
  await db.end();
})().catch(e => { console.error(e); process.exit(1); });
