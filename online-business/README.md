# Skalierbar: Online Business Starter Kit

Dein Online-Geschäft auf Weg zu 200$/Tag. Von null auf ein funktionierendes Business, Tag für Tag.

## Was hier ist

- **content/** – 10 Fachartikel, jeweils 800-1.200 Wörter.
- **site/** – Vollständige Website mit:
  - Index (Lead-Magnet Formular)
  - Blog (alle Artikel, Tags, abdeckend die 10 Grundfragen)
  - Artikel-Seiten (vollständige Artikel, mit Lead-Magnet CTA)
  - Produktseite (der 27$-Starter-Kit)
  - CSS (Design-System, Dunkelmodus, Responsive)
- **scripts/** – Publishing & Automation:
  - server.js – Express-ähnlich, Subscribes/Stats API
  - publish.js – Startet Server, 30min-Intervall für neue Abonnenten
  - build-articles.js – Generiert HTML-Seiten von Markdown
  - start.js – Kurze Anleitung zum Start
- **automation/** – E-Mail-Serie:
  - welcome.js – 3-Tage-Email-Serie für neue Abonnenten
- **data/** – JSON-Speicher (subscribers.json, leads.json, sent.json)
- **automation/sent.json** – Logge gesendete E-Mails

## Wie man das Live startet

```bash
cd online-business
# Du musst Node auf deinem Rechner installiert haben (25.2.1+)
node scripts/publish.js
```

Server: http://localhost:3000
Stats: http://localhost:3000/api/stats

## Wie das funktioniert

1. **Besucher** besuchen die Website, geben ihre E-Mail-Adresse ein → `/api/subscribe`
2. **Abonnent** erscheint in data/subscribers.json
3. **Automation** verarbeitet neue Abonnenten (Willkommens-Serie)
4. **Automatisch** Prüfung alle 30 Minuten

## Die Philosophie

- **Realistische Erwartungen:** 0$ → 200$/Tag braucht Geduld.
- **Content zuerst:** Biete wertvolle Artikel an, die Traffic bringen.
- **E-Mail-Liste:** Dein eigenes Asset, keine Social-Media-Konten.
- **Einmal Produkt erstellen, unendlich verkaufen:** Digitale Produkte haben 100% Margin.
- **Automatisieren:** Baue Systeme, die für dich arbeiten.

## Nächste Schritte (für dich)

1. Starte den Server (`node scripts/publish.js`) – bleib an diesem Terminal.
2. Teile die Website mit Freunden/Famile.
3. Schreibe immer neue Artikel — das ist das Wachstum.
4. Teste das Produkt-Verkaufssystem (füge Zahlungen hinzu).
5. Wiederhole die Schritte alle paar Tage.

Wenn du fertig bist, komm zurück für:
- Webhook integration für Echtzeit-E-Mails
- Einfache Zahlungsabwicklung für das Produkt
- SEO-Optimierung für alle 10 Artikel

Das ist die Grundlage für ein Online-Geschäft, das auf 200$/Tag skaliert. Alles ist bereit — starte, teste und iteriere.