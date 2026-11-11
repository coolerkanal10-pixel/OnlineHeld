// Quick start - run this to start the server
console.log(`
══════════════════════════════════════════════
    SKALIERBAR - QUICK START
══════════════════════════════════════════════

Du willst den Server starten? Einfach:

    node scripts/publish.js

Das startet:
  → Webserver auf http://localhost:3000
  → API /api/subscribe (E-Mail-Eintrag)
  → API /api/stats (Abonnenten-Statistik)
  → 30-Minuten-Check für neue Abonnenten
  → 3-Tage-Email-Serie für jeden neuen Abonnenten

══════════════════════════════════════════════

Nützliche URLs:
  Site:     http://localhost:3000/
  Blog:     http://localhost:3000/blog.html
  Produkt:  http://localhost:3000/produkt.html
  Stats:    http://localhost:3000/api/stats

Testen (neues Terminal):
  curl -X POST http://localhost:3000/api/subscribe -d "email=test@example.com"

══════════════════════════════════════════════

Struktur:
  content/        - 10 Markdown-Artikel
  site/           - HTML + CSS (ready to deploy)
  scripts/        - Server, Build, Publish
  automation/     - E-Mail-Automation
  data/           - JSON Storage (subscribers, leads, sent)

══════════════════════════════════════════════
`);

// If run directly, start the server
if (require.main === module) {
  require('./publish.js');
}