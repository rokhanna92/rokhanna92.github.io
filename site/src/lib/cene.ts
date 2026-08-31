// Jedini izvor cena u repou je src/data/cenovnik.json. Svaki drugi data fajl
// nosi samo "ref", pa se cena razresava ovde. Ako ref promasi, build pada.

import cenovnik from '../data/cenovnik.json';
import prices from '../data/prices.json';
import priceChips from '../data/price-chips.json';
import usluge from '../data/usluge.json';

export type Cena = { iznos: string; jedinica: string; naziv: string; opis: string; c: string };

// Pages CMS ne upisuje prazna neobavezna polja, nego ih izostavi iz fajla.
// Zato se svako takvo polje ovde svede na prazan string pre upotrebe, inace
// bi sablon ispisao rec "undefined" na sajtu.
type Stavka = { id: string; n: string; d?: string; iznos: string; jedinica?: string };
const tekst = (v: string | undefined) => v ?? '';

// "3.200" + "/ sat" -> "3.200 / sat". Prazna jedinica ne ostavlja razmak.
const spoji = (iznos: string, jedinica: string) => `${iznos} ${jedinica}`.trim();

const mapa = new Map<string, Cena>();
for (const g of cenovnik.groups) {
  for (const s of g.stavke as Stavka[]) {
    // Urednik koji doda stavku kroz CMS dobija prazan id, jer je polje zakljucano.
    // Bolje da build stane nego da stavka tiho ostane bez veze sa ostatkom sajta.
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) {
      throw new Error(
        `Cenovnik: stavka "${s.n}" u grupi "${g.naziv}" ima id "${s.id}", koji nije dozvoljen. Id pise programer, malim slovima sa crticama, na primer "sat-savetnika".`
      );
    }
    if (mapa.has(s.id)) {
      throw new Error(`Cenovnik: id "${s.id}" postoji dva puta u cenovnik.json. Svaka stavka mora imati jedinstven id.`);
    }
    const jedinica = tekst(s.jedinica);
    mapa.set(s.id, {
      iznos: s.iznos,
      jedinica,
      naziv: s.n,
      opis: tekst(s.d),
      c: spoji(s.iznos, jedinica),
    });
  }
}

// Tripwire za celu klasu greske od koje je nastao ovaj tekst: neobavezno polje
// koje CMS izostavi, pa ga sablon slepi u string. Jednom je vec objavljeno
// "4.000–7.000 undefined" na cenovniku.
for (const [id, c] of mapa) {
  for (const [polje, vrednost] of Object.entries(c)) {
    if (vrednost.includes('undefined')) {
      throw new Error(
        `Cenovnik: stavka "${id}" ima "undefined" u polju ${polje} ("${vrednost}"). Neko neobavezno polje nedostaje u cenovnik.json, a kod ga slepljuje u tekst.`
      );
    }
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

// Red koji nosi svoj "label" ga zadrzava, jer se ponegde namerno razlikuje od
// cenovnika ("Akt o proceni rizika, po radnom mestu" prema "Akt o proceni
// rizika"). Gde razlike nema, label se brise iz podataka i uzima se naziv iz
// cenovnika, da isti tekst ne stoji na dva mesta.
export const labelReda = (row: { ref?: string; label?: string }) =>
  row.label ?? (row.ref ? cena(row.ref).naziv : '');

// Cenovnik za prikaz: polje "c" se izvodi, ne cuva se u JSON-u. Iznos i jedinica
// se iznose i odvojeno, da tabela moze da ih prelomi u dva reda na telefonu.
export const grupe = cenovnik.groups.map((g) => ({
  ...g,
  stavke: g.stavke.map((s) => {
    const c = cena(s.id);
    return { ...s, c: c.c, iznos: c.iznos, jedinica: c.jedinica };
  }),
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

// ---- Assertion 2: kalkulator mora zadrzati sve svoje delove ----

// .pages.yml izlaze samo estimator.rates. Ostalo cuva settings.content.merge.
// Ako taj prekidac ikad otpadne, Pages CMS brise nenavedene kljuceve, pa ovde
// pada build sa jasnom porukom umesto sa TypeError-om duboko u strani.
for (const kljuc of ['defaults', 'limits', 'rates', 'labels', 'pausalOpts', 'checkboxes'] as const) {
  if (cenovnik.estimator[kljuc] === undefined) {
    throw new Error(
      `Cenovnik: kalkulatoru nedostaje estimator.${kljuc} u cenovnik.json. Najverovatnije je iz .pages.yml ispao settings.content.merge: true, pa je CMS obrisao polja koja ne prikazuje.`
    );
  }
}

// ---- Assertion 3 i 4: estimator.rates mora biti broj i mora se poklapati ----

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
