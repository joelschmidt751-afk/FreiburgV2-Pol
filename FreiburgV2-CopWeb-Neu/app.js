const $ = (s) => document.querySelector(s);
const authCard = $('#authCard');
const authTitle = $('#authTitle');
const authSubmit = $('#authSubmit');
const switchAuth = $('#switchAuth');
const confirmPassword = $('#confirmPassword');
const formMessage = $('#formMessage');
const authForm = $('#authForm');
const toast = $('#toast');
let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  authCard.classList.toggle('register-mode', mode === 'register');
  authTitle.textContent = mode === 'register' ? 'Konto erstellen' : 'Anmeldung';
  authSubmit.textContent = mode === 'register' ? '＋ Konto erstellen' : '→ Jetzt einloggen';
  switchAuth.textContent = mode === 'register' ? '← Ich habe bereits ein Konto' : '♟+ Noch kein Konto? Registrieren';
  $('#confirmPassword').required = mode === 'register';
  $('#password').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  formMessage.textContent = '';
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3800);
}
document.querySelectorAll('[data-open-auth]').forEach(btn => btn.addEventListener('click', () => {
  setAuthMode(btn.dataset.openAuth);
  $('#authCard').scrollIntoView({behavior:'smooth', block:'center'});
  $('#username').focus({preventScroll:true});
}));
switchAuth.addEventListener('click', () => setAuthMode(authMode === 'login' ? 'register' : 'login'));
authForm.addEventListener('submit', event => {
  event.preventDefault();
  const username = $('#username').value.trim();
  const password = $('#password').value;
  if (username.length < 3) { formMessage.textContent = 'Der Benutzername muss mindestens 3 Zeichen haben.'; return; }
  if (password.length < 6) { formMessage.textContent = 'Das Passwort muss mindestens 6 Zeichen haben.'; return; }
  if (authMode === 'register' && password !== confirmPassword.value) { formMessage.textContent = 'Die Passwörter stimmen nicht überein.'; return; }
  formMessage.textContent = authMode === 'register'
    ? 'Die Oberfläche funktioniert. Für echte Konten muss ein sicherer Server angeschlossen werden.'
    : 'Demo-Modus: Die Anmeldung ist noch nicht mit einem Server verbunden.';
  showToast(authMode === 'register' ? 'Registrierungsoberfläche getestet – noch kein echtes Konto erstellt.' : 'Dies ist eine Demo. Es wurde kein Login ausgeführt.');
});
$('#mobileToggle').addEventListener('click', () => $('#mainNav').classList.toggle('open'));
document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => {
  $('#mainNav').classList.remove('open');
  document.querySelectorAll('#mainNav a').forEach(link => link.classList.toggle('active', link === a));
}));
$('[data-contact]').addEventListener('click', () => showToast('Trage im Projekt deine offiziellen Discord- oder Kontaktlinks ein.'));
$('#year').textContent = new Date().getFullYear();
