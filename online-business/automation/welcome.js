// E-Mail-Automation: Willkommens-E-Mail + 3-Tage-Email-Serie
// In der Praxis: Dieses Skript liest neue Abonnenten und schreibt die E-Mails.
// Hier integrierst du deinen E-Mail-Service (ConvertKit/Mailchimp) über API.

const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', 'data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const SENT_FILE = path.join(DATA_DIR, 'sent.json');

function readJSON(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } }
function writeJSON(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf8'); }

// Willkommens-E-Mail Text
const WELCOME = (name) => `Hallo ${name || 'du'},

willkommen im Starter-Kit! 🎉

Du hast dich für den 7-Tage-Challenge Plan angemeldet. Das ist der erste Schritt zu deinem Online-Geschäft.

Was du jetzt bekommst:
→ 7-Tage-Challenge Plan (PDF)
→ Die 5 größten Fehler-Checklist
→ Content-Plan Template
→ E-Mail-Plan Template
→ Gewinn-Tracker Vorlage

Dein erster Schritt: Lege heute deine Domain an. Das kostet 10-15$/Jahr. Das ist deine einzige echte Investition.

Ich schreibe dir in den nächsten Tagen noch 2 E-Mails mit konkreten Tipps.

Bis bald,
Dein Skalierbar-Team`;

const DAY2 = (name) => `Hallo ${name || 'du'},

Tag 2 der Challenge: Deine E-Mail-Liste.

Eine E-Mail-Liste ist dein wertvollstes Asset. Warum?
- Du besitzt die Liste (Social Media kann gesperrt werden)
- E-Mails haben höhere Aufmerksamkeit als Social Posts
- Du kannst direkt verkaufen

Deine Aufgabe heute:
1. Lege eine E-Mail-Liste an (free Plan bei ConvertKit oder Mailchimp)
2. Erstelle einen Lead-Magneten (ein 10-seitiges PDF)
3. Baue eine einfache Landungsseite

Tipp: Der Lead-Magnet muss ein echtes Problem lösen. Nicht "Tipps für Online Business", sondern "Die 5 größten Fehler, die Anfänger machen".

Morgen schreibe ich dir, wie du Content erstellst, der konvertiert.`;

const DAY3 = (name) => `Hallo ${name || 'du'},

Tag 3: Dein erstes digitales Produkt.

Du hast Content, eine Liste, eine Landungsseite. Jetzt brauchst du ein Produkt.

Ein digitales Produkt hat 100% Margin. Einmal erstellen, unendlich verkaufen.

Die einfachsten Produktarten für Anfänger:
1. PDF-Guide (7-27$) — 10-20 Seiten
2. Mini-Kurs (27-97$) — 3-5 Module
3. Vorlagen (9-49$) — Excel, Canva, E-Mail
4. Membership (9-29$/Monat) — monatliche Einnahmen

Deine Aufgabe: Erstelle dein erstes Produkt heute. Es muss nicht perfekt sein. Es muss existieren.

Ein 10-seitiges PDF für 7$ ist ein besseres Produkt als ein perfektes Produkt, das nie fertig wird.

Wenn du das Starter-Kit (27$) haben willst, gibt es hier: [Produktseite]

Viel Erfolg,
Dein Skalierbar-Team`;

// Main: Process new subscribers
function processNewSubscribers() {
  const subscribers = readJSON(SUBSCRIBERS_FILE);
  const sent = readJSON(SENT_FILE);
  const sentEmails = new Set(sent.map(s => s.email));

  const newOnes = subscribers.filter(s => !sentEmails.has(s.email));
  if (newOnes.length === 0) {
    console.log('Keine neuen Abonnenten.');
    return 0;
  }

  console.log(`\n📧 Verarbeite ${newOnes.length} neue Abonnenten...`);

  for (const sub of newOnes) {
    const name = (sub.email || '').split('@')[0];
    const emails = [
      { type: 'welcome', subject: 'Willkommen im Starter-Kit 🎉', body: WELCOME(name) },
      { type: 'day2', subject: 'Tag 2: Deine E-Mail-Liste', body: DAY2(name) },
      { type: 'day3', subject: 'Tag 3: Dein erstes digitales Produkt', body: DAY3(name) },
    ];

    for (const e of emails) {
      console.log(`\n--- ${e.type.toUpperCase()} an ${sub.email} ---`);
      console.log(`Betreff: ${e.subject}`);
      console.log(e.body.substring(0, 120) + '...');
      // Hier würde die API-Calls folgen:
      // await emailService.send({ to: sub.email, subject: e.subject, body: e.body });
    }

    sent.push({ email: sub.email, sentAt: new Date().toISOString(), series: ['welcome', 'day2', 'day3'] });
  }

  writeJSON(SENT_FILE, sent);
  console.log(`\n✅ ${newOnes.length} Abonnenten verarbeitet.`);
  return newOnes.length;
}

// CLI
if (require.main === module) {
  processNewSubscribers();
}

module.exports = { processNewSubscribers };