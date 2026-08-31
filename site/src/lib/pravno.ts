// Jedini izvor pravnih tekstova u repou je src/data/pravno.json. Svaki dokument
// odatle mora da ima svoju stranu u src/pages sa istim imenom, jer podnozje i
// unakrsni linkovi na dnu pravnih strana vode na "/" + id.

import pravnoPodaci from '../data/pravno.json';

// ---- Assertion: svaki dokument mora imati svoju .astro stranu ----

// Spisak se drzi rucno, namerno. Prva verzija je strane nabrajala preko
// import.meta.glob('../pages/*.astro') i to je radilo, ali je uvuklo svaku
// stranu u graf ovog modula, pa je Vite u svaku stranu ubacio <style is:global>
// svih ostalih strana. Posto ovaj modul koristi i podnozje, koje stoji svuda,
// poslednje body pravilo je pobedjivalo na celom sajtu i pravne strane su se
// crtale tamnom paletom. Obican niz nema taj trosak.
const STRANE = ['odricanje-od-odgovornosti', 'politika-privatnosti', 'uslovi-koriscenja'];

for (const d of pravnoPodaci.dokumenti) {
  if (!STRANE.includes(d.id)) {
    throw new Error(
      `Pravno: dokument "${d.id}" iz pravno.json nema svoju stranu. Napravite src/pages/${d.id}.astro sa <PravnaStrana id="${d.id}" /> i dodajte "${d.id}" u niz STRANE u src/lib/pravno.ts.`
    );
  }
}

for (const ime of STRANE) {
  if (!pravnoPodaci.dokumenti.some((d) => d.id === ime)) {
    throw new Error(
      `Pravno: u nizu STRANE u src/lib/pravno.ts stoji "${ime}", a takvog dokumenta nema u pravno.json. Strana bi ostala prazna.`
    );
  }
}

export const dokumenti = pravnoPodaci.dokumenti;
export const azurirano = pravnoPodaci.azurirano;

// ---- Link na politiku privatnosti uz kvadratic za saglasnost ----

// Tekst uz kvadratic pominje Politiku privatnosti, a taj pomen treba da bude
// link: posetilac koji daje pristanak mora da moze da procita na sta pristaje.
// Tekst je jedno polje u index.json i menja ga urednik kroz CMS, pa se link ne
// moze zapisati u sam tekst. Zato se recenica ovde deli oko fraze.
//
// Ako urednik prepravi recenicu tako da fraze vise nema, vraca se ceo tekst bez
// linka. Podnozje na svakoj strani ionako vodi do sve tri pravne strane.

const FRAZA = 'Politikom privatnosti';
const ID_POLITIKE = 'politika-privatnosti';

if (!dokumenti.some((d) => d.id === ID_POLITIKE)) {
  throw new Error(
    `Pravno: u pravno.json nema dokumenta sa id "${ID_POLITIKE}", a na njega pokazuje link uz saglasnost na formularu.`
  );
}

export const putanjaPolitike = `/${ID_POLITIKE}`;

export function deliSaglasnost(tekst: string) {
  const i = tekst.indexOf(FRAZA);
  if (i < 0) return { pre: tekst, veza: '', posle: '' };
  return { pre: tekst.slice(0, i), veza: FRAZA, posle: tekst.slice(i + FRAZA.length) };
}
