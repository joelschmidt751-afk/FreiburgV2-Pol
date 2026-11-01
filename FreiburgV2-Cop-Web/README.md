# FreiburgV2 Cop-Web

Eigenständiges Startprojekt für ein FiveM-RP-Webportal mit Tablet-Ansicht, Express-API, MySQL und ESX-Legacy-Bridge.

## Voraussetzungen
- Node.js 20 oder neuer
- MySQL 8 / MariaDB
- Git
- FiveM-Server mit ESX Legacy und `oxmysql`

## 1. Website lokal starten
1. Entpacke das Projekt.
2. Kopiere `.env.example` nach `.env` und trage Datenbankdaten sowie einen langen zufälligen `SESSION_SECRET` ein.
3. Lege die Datenbank an und importiere `database/schema.sql`.
4. Im Projektordner:
   ```bash
   npm install
   npm run create-admin
   npm start
   ```
5. Öffne `http://localhost:3000`. Der Admin wird mit den Zugangsdaten aus `.env` erstellt.

## 2. GitHub
1. Erstelle auf GitHub ein **privates** Repository, z. B. `FreiburgV2-Cop-Web`.
2. Kopiere den Projektinhalt hinein. `.env` darf niemals hochgeladen werden; sie ist durch `.gitignore` ausgeschlossen.
3. Alternativ lokal:
   ```bash
   git init
   git add .
   git commit -m "Initial FreiburgV2 Cop-Web"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/FreiburgV2-Cop-Web.git
   git push -u origin main
   ```
   Ersetze `DEIN-NAME` durch deinen GitHub-Nutzernamen.

GitHub hostet den Node.js-Server nicht automatisch. Für eine öffentliche Website brauchst du einen Node-fähigen Host, HTTPS und eine erreichbare MySQL-Datenbank. Setze dort dieselben Umgebungsvariablen wie in `.env`.

## 3. FiveM-Resource
1. Kopiere `fivem/freiburg_copweb` nach `server-data/resources/[local]/freiburg_copweb`.
2. Setze in `server.cfg`:
   ```cfg
   ensure oxmysql
   ensure es_extended
   setr freiburg_copweb_api_url "https://DEINE-DOMAIN.example"
   setr freiburg_copweb_api_key "HIER-DENSELBEN-LANGEN-ZUFALLSSCHLUESSEL-WIE-IN-DER-WEB-UMGEBUNG"
   ensure freiburg_copweb
   ```
3. Konfiguriere auf dem Webserver `FIVEM_API_KEY` mit demselben Schlüssel.
4. Die Resource kann ESX-Spielerstatus an die API melden. Die API ist absichtlich nur serverseitig erreichbar und benötigt einen API-Schlüssel.

## Sicherheit und Grenzen
- Dieses Repository ist ein funktionsfähiges **Grundgerüst**, keine zertifizierte Behörden- oder Echtweltakte.
- Nur fiktive RP-Daten verwenden. Keine echten Bürger-, Gesundheits- oder Polizeidaten eintragen.
- Für öffentliche Bereitstellung HTTPS, Firewall, regelmäßige Updates, Backups und Datenschutz-/Impressumsseiten ergänzen.
- Die initiale Registrierung weist neue Konten nur die Rolle `citizen` zu. Rollenänderungen sind Admin-Aufgabe.
- Keine API-Schlüssel im Browser, in GitHub oder in Client-Skripten hinterlegen.
