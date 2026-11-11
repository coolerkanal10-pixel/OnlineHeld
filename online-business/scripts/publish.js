// Publishing Engine: startet Server, prüft alle 30min auf neue Abonnenten,
// published Artikel automatisch und meldet Status.
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.join(__dirname, '..');

console.log('═══════════════════════════════════════');
console.log('  🚀 SKALIERBAR PUBLISHING ENGINE');
console.log('═══════════════════════════════════════');
console.log(`Start: ${new Date().toISOString()}`);
console.log(`Site: ${ROOT}/site`);
console.log(`Data: ${ROOT}/data`);
console.log('');

// 1. Starte Server
const server = spawn('node', [path.join(ROOT, 'scripts', 'server.js')], {
  stdio: 'inherit', cwd: ROOT
});

// 2. Warte bis Server läuft, dann prüfe Abonnenten
setTimeout(() => {
  const { processNewSubscribers } = require(path.join(ROOT, 'automation', 'welcome.js'));
  processNewSubscribers();

  // Alle 30 Minuten prüfen
  setInterval(() => {
    console.log('\n⏰ Check für neue Abonnenten...');
    processNewSubscribers();
  }, 30 * 60 * 1000);

  console.log('\n✅ Publishing Engine läuft. Server läuft auf Port 3000.');
  console.log('📊 Status: http://localhost:3000/api/stats');
}, 2000);

server.on('exit', (code) => {
  console.log(`Server beendet mit Code ${code}`);
  process.exit(code);
});