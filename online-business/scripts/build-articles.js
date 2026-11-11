// Generates article HTML pages from markdown files in ../content
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const OUT_DIR = path.join(__dirname, '..', 'site', 'artikel');

// Map filename -> { slug, title }
const map = {
  '01-wie-startet-man-online-geschaeft.md': { slug: '01-wie-startet-man-online-geschaeft', title: 'Wie startet man ein Online-Geschäft mit weniger als 50$?', desc: 'Von 0$ auf ein Online-Geschäft in 7 Tagen — mit weniger als 50$ Startbudget.' },
  '02-die-groessten-fehler.md': { slug: '02-die-groessten-fehler', title: 'Die 5 größten Fehler bei der Geschäftsaufbau im Jahr 2026', desc: 'Warum die meisten Online-Geschäfte scheitern — und wie du die 5 häufigsten Fehler vermeidest.' },
  '03-passives-einkommen.md': { slug: '03-passives-einkommen', title: 'Passives Einkommen: Realistische Erwartungen vs. Mythen', desc: 'Passives Einkommen ist kein Mythos — aber auch kein Wundermittel. Die Realität.' },
  '04-email-marketing.md': { slug: '04-email-marketing', title: 'E-Mail-Marketing: Warum deine Liste dein wertvollstes Asset ist', desc: 'E-Mails sind dein eigener Grund. Warum die Liste wichtiger ist als Social-Media-Follower.' },
  '05-digitale-produkte.md': { slug: '05-digitale-produkte', title: 'Digitale Produkte: Warum sie die beste Margin haben', desc: 'Einmal erstellen, unendlich verkaufen. Digitale Produkte haben die besten Margen.' },
  '06-email-liste-30-tage.md': { slug: '06-email-liste-30-tage', title: 'Wie man eine E-Mail-Liste in 30 Tagen auf 1000 Abonnenten aufbaut', desc: 'Der 30-Tage-Plan: Von 0 auf 1.000 E-Mail-Abonnenten — Tag für Tag.' },
  '07-umsatz-vs-gewinn.md': { slug: '07-umsatz-vs-gewinn', title: 'Der Unterschied zwischen Umsatz und Gewinn — und warum das wichtig ist', desc: 'Mehr Umsatz heißt nicht mehr Geld. Der Unterschied, der über dein Geschäft entscheidet.' },
  '08-skalierung.md': { slug: '08-skalierung', title: 'Skalierung: Wenn dein erstes Geschäft läuft, was machst du dann?', desc: 'Mehr Einnahmen ohne proportional mehr Aufwand — die 3 Skalierungs-Strategien.' },
  '09-content-marketing-anfaenger.md': { slug: '09-content-marketing-anfaenger', title: 'Content-Marketing für Anfänger: Der einfachste Weg zu Traffic', desc: 'Content-Marketing ist kein Rätsel. Die 3 Formeln, die funktionieren.' },
  '10-7-tage-challenge.md': { slug: '10-7-tage-challenge', title: 'Die 7-Tage-Challenge: Von 0$ auf dein erstes Online-Einkommen', desc: '7 Tage, 7 Aufgaben. Der Plan, der dich vom Start bis zum ersten Produkt bringt.' },
};

// Very small markdown -> HTML converter (headings, paragraphs, lists, bold, links)
function mdToHtml(md) {
  const lines = md.split('\n');
  let html = '';
  let inUl = false, inOl = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      continue;
    }
    // Skip the frontmatter/title line
    if (t.startsWith('# ')) { continue; }
    const m = t.match(/^(#{1,3})\s+(.*)/);
    if (m) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      const level = m[1].length;
      const text = inline(m[2]);
      if (level === 1) html += `<h1>${text}</h1>`;
      else if (level === 2) html += `<h2>${text}</h2>`;
      else html += `<h3>${text}</h3>`;
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${inline(t.replace(/^[-*]\s+/, ''))}</li>`;
      continue;
    }
    if (/^\d+\.\s+/.test(t)) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${inline(t.replace(/^\d+\.\s+/, ''))}</li>`;
      continue;
    }
    // Table row (header | | |)
    if (/^\|/.test(t) && /^\|[\s\-:|]+\|$/.test(t)) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
      continue; // skip separator
    }
    if (/^\|/.test(t)) {
      const cells = t.split('|').map(c => c.trim()).filter(Boolean);
      html += `<p><strong>${cells.join(' · ')}</strong></p>`;
      continue;
    }
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
    html += `<p>${inline(t)}</p>`;
  }
  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';
  return html;
}

function inline(text) {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
  // Links
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  // Checkmarks (✓ already raw)
  return text;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const [file, info] of Object.entries(map)) {
  const src = path.join(CONTENT_DIR, file);
  if (!fs.existsSync(src)) { console.warn('Missing:', file); continue; }
  const md = fs.readFileSync(src, 'utf8');
  const body = mdToHtml(md);
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${info.title} | Skalierbar</title>
  <meta name="description" content="${info.desc}">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <header>
    <div class="container">
      <div class="logo">Skalier<span>bar</span></div>
      <nav>
        <a href="../index.html">Start</a>
        <a href="../blog.html">Blog</a>
        <a href="../produkt.html">Produkt</a>
      </nav>
    </div>
  </header>

  <section class="hero" style="padding:60px 0;">
    <div class="container">
      <h1 style="font-size:38px;">${info.title}</h1>
      <p style="color:var(--muted); margin-top:20px;">${info.desc}</p>
    </div>
  </section>

  <article class="container" style="padding:40px 0; max-width:760px;">
    ${body}
    <div style="margin-top:40px; padding:20px; background:var(--card); border:1px solid var(--border); border-radius:12px;">
      <h3>Kostenloses Starter-Kit</h3>
      <p>Tritt der E-Mail-Liste bei und erhalte das 7-Tage-Challenge Starter-Kit als PDF.</p>
      <form id="artSubscribe" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;">
        <input type="email" placeholder="deine@email.de" required style="flex:1; min-width:240px; padding:12px; background:var(--bg2); border:1px solid var(--border); border-radius:8px; color:#fff;">
        <button type="submit" style="padding:12px 24px; background:var(--accent); border:none; border-radius:8px; color:#fff; cursor:pointer;">Starter-Kit</button>
      </form>
      <div id="msg" style="margin-top:16px; min-height:24px;"></div>
    </div>
  </article>

  <footer>
    <div class="container"><p>© 2026 Skalierbar — <a href="../index.html">Start</a> | <a href="../blog.html">Blog</a> | <a href="../produkt.html">Produkt</a></p></div>
  </footer>

  <script>
    document.getElementById('artSubscribe').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const input = form.querySelector('input');
      const email = input.value.trim();
      const msg = document.getElementById('msg');
      if (!email || !/^.+@.+\\..+$/.test(email)) {
        msg.innerHTML = '<span style="color:#ff6b6b;">Gültige E-Mail-Adresse eingeben</span>';
        return;
      }
      msg.innerHTML = 'Wird gesendet...';
      try {
        const res = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: \`email=\${encodeURIComponent(email)}&source=article&leadMagnet=7-tage-challenge\`
        });
        const data = await res.json();
        if (res.ok) {
          msg.innerHTML = '<span style="color:#2ecc71;">✓ Erfolgreich angemeldet! Check dein E-Mail-Postfach für das Starter-Kit.</span>';
          input.disabled = true;
        } else {
          msg.innerHTML = '<span style="color:#ff6b6b;">✗ ' + (data.error || 'Fehler') + '</span>';
        }
      } catch {
        msg.innerHTML = '<span style="color:#ff6b6b;">✗ Netzwerkfehler</span>';
      }
    });
  </script>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT_DIR, info.slug + '.html'), html, 'utf8');
  count++;
}

console.log(`✅ ${count} Artikel-Seiten generiert nach site/artikel/`);
