import type { APIRoute } from 'astro';

// Mapa sajta se pravi pri gradnji, bez ijedne nove zavisnosti. Astro sam nadje
// sve .astro strane, pa nova strana ulazi u mapu bez diranja ovog fajla.
// 404 se izostavlja: ona nosi noindex i nema sta da trazi u mapi.
const strane = import.meta.glob('./**/*.astro');

const putanja = (kljuc: string) =>
  kljuc
    .replace(/^\.\//, '/')
    .replace(/\.astro$/, '')
    .replace(/\/index$/, '/');

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('sitemap: astro.config.mjs mora imati "site".');
  }

  const adrese = Object.keys(strane)
    .map(putanja)
    .filter((p) => p !== '/404')
    // Pocetna prva, ostalo azbucno, da mapa bude ista pri svakoj gradnji.
    .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
    .map((p) => new URL(p.endsWith('/') ? p : `${p}/`, site).href);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${adrese.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
