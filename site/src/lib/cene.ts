// Jedini izvor cena u repou je src/data/cenovnik.json. Svaki drugi data fajl
// nosi samo "ref", pa se cena razresava ovde. Ako ref promasi, build pada.

import cenovnik from '../data/cenovnik.json';
import prices from '../data/prices.json';
import priceChips from '../data/price-chips.json';
import usluge from '../data/usluge.json';

export type Cena = { iznos: string; jedinica: string; c: string };

// "3.200" + "/ sat" -> "3.200 / sat". Prazna jedinica ne ostavlja razmak.
const spoji = (iznos: string, jedinica: string) => `${iznos} ${jedinica}`.trim();

const mapa = new Map<string, Cena>();
for (const g of cenovnik.groups) {
  for (const s of g.stavke) {
    if (mapa.has(s.id)) {
      throw new Error(`Cenovnik: id "${s.id}" postoji dva puta u cenovnik.json. Svaka stavka mora imati jedinstven id.`);
    }
    mapa.set(s.id, { iznos: s.iznos, jedinica: s.jedinica, c: spoji(s.iznos, s.jedinica) });
  }
}

export function cena(id: string): Cena {
  const nadjena = mapa.get(id);
  if (!nadjena) {
    throw new Error(
      `Cenovnik: ne postoji stavka sa id "${id}". Proverite polje "ref" u data fajlovima i polje "id" u cenovnik.json.`
    );
  }
  return nadjena;
}

// Cenovnik za prikaz: polje "c" se izvodi, ne cuva se u JSON-u.
export const grupe = cenovnik.groups.map((g) => ({
  ...g,
  stavke: g.stavke.map((s) => ({ ...s, c: cena(s.id).c })),
}));

export const napomena = cenovnik.note;

// Passthrough za kalkulator. Vrednosti su vec proverene assertion-om ispod.
export const estimator = cenovnik.estimator;
export const rates = cenovnik.estimator.rates;

// ---- Assertion 1: svaki "ref" u svakom data fajlu mora da se razresi ----

function skupiRefove(vrednost: unknown, putanja: string, nadjeni: [string, string][]) {
  if (Array.isArray(vrednost)) {
    vrednost.forEach((stavka, i) => skupiRefove(stavka, `${putanja}[${i}]`, nadjeni));
    return;
  }
  if (vrednost && typeof vrednost === 'object') {
    for (const [kljuc, unutra] of Object.entries(vrednost)) {
      if (kljuc === 'ref' && typeof unutra === 'string') nadjeni.push([unutra, `${putanja}.ref`]);
      else skupiRefove(unutra, `${putanja}.${kljuc}`, nadjeni);
    }
  }
}

const refovi: [string, string][] = [];
skupiRefove(prices, 'prices.json', refovi);
skupiRefove(priceChips, 'price-chips.json', refovi);
skupiRefove(usluge, 'usluge.json', refovi);

for (const [ref, putanja] of refovi) {
  if (!mapa.has(ref)) {
    throw new Error(
      `Cenovnik: ${putanja} pokazuje na id "${ref}", a takva stavka ne postoji u cenovnik.json. Postojeci id-jevi: ${[...mapa.keys()].join(', ')}.`
    );
  }
}

// ---- Assertion 2 i 3: estimator.rates mora biti broj i mora se poklapati ----

// Svaki kljuc u estimator.rates je vezan za tacno jednu stavku cenovnika.
const stavkaZaRate: Record<string, string> = {
  aktPoMestu: 'akt-o-proceni-rizika',
  pravilnikBzr: 'pravilnik-bzr',
  pravilnikLzo: 'pravilnik-lzo',
  pravilaZop: 'pravila-zop',
  obukaPoRadniku: 'obuka-bzr-zop-visina',
  pausalOsnovni: 'pausal-osnovni',
  pausalPro: 'pausal-pro',
};

// "od 8.200" -> 8200, "4.000–7.000" -> 4000. Kalkulator uvek racuna sa donjom granicom.
const donjaGranica = (iznos: string) => Number(iznos.replace(/^od\s+/i, '').split('–')[0].replace(/\./g, ''));

for (const [kljuc, vrednost] of Object.entries(rates) as [string, unknown][]) {
  if (typeof vrednost !== 'number' || !Number.isFinite(vrednost)) {
    throw new Error(
      `Cenovnik: estimator.rates.${kljuc} mora biti broj bez navodnika, na primer 12000, a upisano je ${JSON.stringify(vrednost)}. Sa stringom kalkulator prikazuje NaN.`
    );
  }
  const id = stavkaZaRate[kljuc];
  if (!id) {
    throw new Error(
      `Cenovnik: estimator.rates.${kljuc} nema uparenu stavku cenovnika. Dodajte kljuc u stavkaZaRate u src/lib/cene.ts.`
    );
  }
  const granica = donjaGranica(cena(id).iznos);
  if (vrednost !== granica) {
    throw new Error(
      `Cenovnik: estimator.rates.${kljuc} je ${vrednost}, a stavka "${id}" ima iznos "${cena(id).iznos}", cija je donja granica ${granica}. Uskladite kalkulator i cenovnik.`
    );
  }
}
