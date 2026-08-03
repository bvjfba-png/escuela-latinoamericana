#!/usr/bin/env node
/**
 * Generates llms.txt and llms-full.txt from site HTML.
 * Run after editing index.html or pago.html: node scripts/generate-llms.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://gestalt-latam.com';
const CONTACT = 'gestalt.escuela.latinoamerica@gmail.com';

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function attr(html, name) {
  const re = new RegExp(`${name}="([^"]*)"`, 's');
  const m = html.match(re);
  return m ? m[1] : '';
}

function extractPairs(html) {
  const pairs = [];
  const re = /data-es="([^"]*)"[^>]*data-ru="([^"]*)"|data-ru="([^"]*)"[^>]*data-es="([^"]*)"/gs;
  let m;
  while ((m = re.exec(html)) !== null) {
    const es = stripHtml(m[1] ?? m[4] ?? '');
    const ru = stripHtml(m[2] ?? m[3] ?? '');
    if (es || ru) pairs.push({ es, ru });
  }
  return pairs;
}

function extractSchedule(html, dayId) {
  const panelRe = new RegExp(`id="${dayId}"[^>]*>([\\s\\S]*?)</div>\\s*</div>\\s*<div id="`, 'i');
  const altRe = new RegExp(`id="${dayId}"[^>]*>([\\s\\S]*?)</div>\\s*</div>\\s*</div>`, 'i');
  const panel = (html.match(panelRe) || html.match(altRe))?.[1] || '';
  const rows = [];
  const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
  let row;
  while ((row = rowRe.exec(panel)) !== null) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1]);
    if (!cells.length) continue;
    const time = stripHtml(cells[0].replace(/<[^>]+>/g, ''));
    const rest = cells.slice(1).map(c => {
      const es = attr(c, 'data-es') || stripHtml(c);
      const ru = attr(c, 'data-ru');
      return { es: stripHtml(es), ru: stripHtml(ru) };
    });
    if (time || rest.some(r => r.es)) rows.push({ time, cells: rest });
  }
  return rows;
}

function extractAttr(block, name) {
  const re = new RegExp(`${name}="((?:[^"&]|&quot;|&amp;|&lt;|&gt;)*)"`, 's');
  return block.match(re)?.[1] || '';
}

function extractSpeakers(html, sectionId) {
  const sectionRe = new RegExp(`id="${sectionId}"[\\s\\S]*?id="${sectionId}-contenido"[\\s\\S]*?</section>`, 'i');
  const section = html.match(sectionRe)?.[0] || '';
  const cards = [...section.matchAll(/class="speaker-card[\s\S]*?(?=class="speaker-card|$)/g)];
  return cards.map(card => {
    const block = card[0];
    const nameEl = block.match(/speaker-name[^>]*>/)?.[0] || block;
    const bioEl = block.match(/speaker-bio[^>]*>/)?.[0] || block;
    return {
      name: { es: extractAttr(nameEl, 'data-es'), ru: extractAttr(nameEl, 'data-ru') },
      bio: {
        es: stripHtml(extractAttr(bioEl, 'data-es')),
        ru: stripHtml(extractAttr(bioEl, 'data-ru')),
      },
    };
  }).filter(s => s.name.es || s.bio.es);
}

function extractFaq(html) {
  const faqSection = html.match(/id="faq"[\s\S]*?<\/section>/i)?.[0] || '';
  const items = [...faqSection.matchAll(/class="faq-item">([\s\S]*?)<\/div>\s*<\/div>/g)];
  return items.map(item => {
    const block = item[1];
    const qEs = block.match(/faq-question[^>]*data-es="([^"]*)"/)?.[1] || '';
    const qRu = block.match(/faq-question[^>]*data-ru="([^"]*)"/)?.[1] || '';
    const aEs = block.match(/faq-answer[\s\S]*?data-es="([^"]*)"/)?.[1] || '';
    const aRu = block.match(/faq-answer[\s\S]*?data-ru="([^"]*)"/)?.[1] || '';
    return { q: { es: qEs, ru: qRu }, a: { es: stripHtml(aEs), ru: stripHtml(aRu) } };
  }).filter(x => x.q.es);
}

function langBlock(label, es, ru) {
  if (!es && !ru) return '';
  let out = `### ${label}\n\n`;
  if (es) out += `**ES:** ${es}\n\n`;
  if (ru) out += `**RU:** ${ru}\n\n`;
  return out;
}

function buildFull(indexHtml, pagoHtml) {
  const day1 = extractSchedule(indexHtml, 'day1');
  const day2 = extractSchedule(indexHtml, 'day2');
  const organizers = extractSpeakers(indexHtml, 'organizadores');
  const speakers = extractSpeakers(indexHtml, 'expositores');
  const faq = extractFaq(indexHtml);

  let doc = `# Escuela Latina de Terapia Gestalt — Full site content for AI agents

> Bilingual (ES/RU) international Gestalt therapy conference
> "Donde Dos Mundos se Encuentran" / "Где два мира встречаются"
> October 2–3, 2026 · Montevideo, Uruguay
> Website: ${SITE}
> Contact: ${CONTACT}
> Registration & payment: ${SITE}/pago.html

Last generated: ${new Date().toISOString().slice(0, 10)}

---

## Event summary

${langBlock('Title', 'Donde Dos Mundos se Encuentran — Encuentro internacional de terapia gestalt', 'Где два мира встречаются — Международная гештальт-конференция')}

${langBlock('Subtitle', 'Diálogo entre Europa del Este y Latinoamérica', 'Диалог между Восточной Европой и Латинской Америкой')}

${langBlock('Dates & place', '2—3 de octubre, 2026 • Montevideo, Uruguay', '2—3 октября 2026 • Монтевидео, Уругвай')}

${langBlock('Concept intro', 'Esta primera conferencia bilingüe se crea como un espacio de encuentro entre terapeutas Gestalt y psicólogos de Latinoamérica, Europa del Este y el espacio rusoparlante.', 'Эта первая двуязычная конференция создаётся как пространство встречи между гештальт-терапевтами и психологами из Латинской Америки, Восточной Европы и русскоязычного пространства.')}

${langBlock('Concept bullet 1', 'Un espacio para el diálogo profesional vivo: práctica clínica, formación, supervisión, trabajo con grupos y los desafíos actuales de la terapia Gestalt.', 'Пространство для живого профессионального диалога: клиническая практика, обучение, супервизия, работа с группами и современные вызовы гештальт-терапии.')}

${langBlock('Concept bullet 2', 'Dos días de charlas plenarias, mesas redondas y talleres prácticos en salas paralelas, en formato bilingüe.', 'Два дня пленарных выступлений, круглых столов и практических мастерских в параллельных залах, в двуязычном формате.')}

${langBlock('Concept bullet 3', 'Dirigida a psicólogos/as, psicoterapeutas, terapeutas Gestalt, estudiantes, supervisores/as y profesionales del trabajo clínico relacional, fenomenológico y de campo.', 'Для психологов, психотерапевтов, гештальт-терапевтов, студентов, супервизоров и специалистов, которым интересна реляционная, феноменологическая и полевая клиническая работа.')}

## Participation roles

${langBlock('Expositor / Speaker', 'Comparte tu enfoque clínico, una investigación o un caso de trabajo en una charla plenaria o presentación temática.', 'Поделитесь своим клиническим подходом, исследованием или случаем из практики в пленарном докладе или тематическом выступлении.')}

${langBlock('Taller / Masterclass', 'Propón un espacio práctico y experiencial: una técnica, un ejercicio o una vivencia que el grupo pueda explorar contigo.', 'Предложите практическое пространство опыта: технику, упражнение или процесс, который группа может исследовать вместе с вами.')}

${langBlock('Participante / Participant', 'Súmate como oyente y participa de charlas, talleres y espacios de intercambio clínico entre las dos comunidades.', 'Присоединяйтесь как слушатель и участвуйте в выступлениях, мастер-классах и пространствах клинического обмена между двумя сообществами.')}

---

## Schedule — Day 1 (October 2)

`;

  for (const row of day1) {
    doc += `### ${row.time}\n\n`;
    for (const cell of row.cells) {
      if (cell.es) doc += `- **ES:** ${cell.es}\n`;
      if (cell.ru) doc += `- **RU:** ${cell.ru}\n`;
    }
    doc += '\n';
  }

  doc += `## Schedule — Day 2 (October 3)\n\n`;
  for (const row of day2) {
    doc += `### ${row.time}\n\n`;
    for (const cell of row.cells) {
      if (cell.es) doc += `- **ES:** ${cell.es}\n`;
      if (cell.ru) doc += `- **RU:** ${cell.ru}\n`;
    }
    doc += '\n';
  }

  doc += `## Organizers\n\n`;
  for (const s of organizers) {
    doc += `### ${s.name.es || s.name.ru}\n\n`;
    doc += langBlock('Bio', s.bio.es, s.bio.ru);
  }

  doc += `## Speakers\n\n`;
  for (const s of speakers) {
    doc += `### ${s.name.es || s.name.ru}\n\n`;
    doc += langBlock('Bio', s.bio.es, s.bio.ru);
  }

  doc += `## Venue — Crystal Tower Hotel\n\n`;
  doc += langBlock('Address', 'Aquiles R. Lanza 1323, esq. 18 de Julio, Montevideo', 'Aquiles R. Lanza 1323, угол с 18 de Julio, Монтевидео');
  doc += langBlock('Airport', '≈ 25 min en auto desde el Aeropuerto Internacional de Carrasco', '≈ 25 минут на машине от международного аэропорта Карраско');
  doc += langBlock('Hotel note', 'Tarifas especiales para participantes de la conferencia', 'Специальные тарифы для участников конференции');

  doc += `## Pricing (USD)\n\n`;
  doc += `- **Early Bird:** $120 — until July 15, 2026\n`;
  doc += `- **Standard:** $160 — July 16 – August 31, 2026\n`;
  doc += `- **Last call:** $190 — September 1–30, 2026\n`;
  doc += `- **AGU members:** 20% discount (contact ${CONTACT})\n\n`;

  doc += `## Payment methods\n\n`;
  doc += `- PayPal (USD): https://paypal.me/LubavaKV/160 — enter amount per current tier\n`;
  doc += `- RUB (SBP): https://l-kv.com/1montevideo\n`;
  doc += `- Mercado Pago: https://mpago.la/1sgjuwZ — enter amount per current tier\n`;
  doc += `- Payment proof email: ${CONTACT}\n\n`;

  doc += `## Registration flow\n\n`;
  doc += `1. Fill form at ${SITE}/pago.html#registro\n`;
  doc += `2. Choose role(s): expositor, taller/masterclass, participante\n`;
  doc += `3. Select preferred payment method\n`;
  doc += `4. After registration, choose tier and pay\n\n`;

  doc += `## FAQ\n\n`;
  for (const item of faq) {
    doc += `### Q (ES): ${item.q.es}\n\n`;
    if (item.q.ru) doc += `**RU:** ${item.q.ru}\n\n`;
    doc += langBlock('Answer', item.a.es, item.a.ru);
  }

  return doc;
}

function buildIndex() {
  return `# Escuela Latina de Terapia Gestalt

> International bilingual Gestalt therapy conference in Montevideo, Uruguay (ES + RU).
> October 2–3, 2026 · Crystal Tower Hotel · Contact: ${CONTACT}

This file helps AI agents and crawlers find structured information about the conference.
For complete bilingual content (schedule, speakers, FAQ, pricing, registration), read llms-full.txt.

## Key pages

- [Home](${SITE}/): concept, program, organizers, speakers, venue, pricing, FAQ
- [Registration & payment](${SITE}/pago.html): registration form, tiers, payment links
- [Full content for agents](${SITE}/llms-full.txt): complete ES/RU text extracted from the site

## Quick facts

- **Event:** Donde Dos Mundos se Encuentran / Где два мира встречаются
- **Dates:** 2–3 October 2026
- **City:** Montevideo, Uruguay
- **Venue:** Crystal Tower Hotel, Aquiles R. Lanza 1323
- **Languages:** Spanish & Russian with interpretation
- **Format:** In-person, 3 parallel rooms
- **Price:** $120 / $160 / $190 USD (early bird → last call)
- **Register:** ${SITE}/pago.html#registro
- **Email:** ${CONTACT}

## Optional

- [Sitemap](${SITE}/sitemap.xml)
`;
}

const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');
const pagoHtml = readFileSync(join(ROOT, 'pago.html'), 'utf8');

writeFileSync(join(ROOT, 'llms.txt'), buildIndex(), 'utf8');
writeFileSync(join(ROOT, 'llms-full.txt'), buildFull(indexHtml, pagoHtml), 'utf8');

console.log('Generated llms.txt and llms-full.txt');
