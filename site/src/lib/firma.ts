// Jedini izvor podataka o firmi u repou je src/data/firma.json. Telefon je pre
// ovoga stajao na osam mesta. Proza koja pominje adresu u padezu ostaje proza.

import podaci from '../data/firma.json';

const obavezna = [
  'telefon',
  'telefonHref',
  'ulica',
  'naselje',
  'grad',
  'radnoVreme',
  'pravnoIme',
  'sifraDelatnosti',
] as const;

for (const polje of obavezna) {
  const vrednost = podaci[polje] as unknown;
  if (typeof vrednost !== 'string' || vrednost.trim() === '') {
    throw new Error(
      `Firma: polje "${polje}" u firma.json mora biti popunjen tekst, a upisano je ${JSON.stringify(vrednost)}.`
    );
  }
}

if (!Array.isArray(podaci.imejlovi) || podaci.imejlovi.length === 0) {
  throw new Error('Firma: firma.json mora imati bar jedan imejl u polju "imejlovi".');
}

for (const imejl of podaci.imejlovi) {
  if (typeof imejl !== 'string' || !imejl.includes('@')) {
    throw new Error(`Firma: "${imejl}" nije ispravan imejl u polju "imejlovi" u firma.json.`);
  }
}

if (!podaci.telefonHref.startsWith('tel:')) {
  throw new Error(
    `Firma: polje "telefonHref" mora poceti sa "tel:", a upisano je "${podaci.telefonHref}". Bez toga dugme za pozivanje ne radi na telefonu.`
  );
}

export const firma = {
  ...podaci,
  // Ulica i naselje idu zajedno na sva tri mesta, grad se dodaje razlicito.
  adresa: `${podaci.ulica}, ${podaci.naselje}`,
  // Prvi imejl je onaj koji ide sam, kada za drugi nema mesta.
  imejl: podaci.imejlovi[0],
};
