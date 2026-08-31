// Formular za upit, isti na pocetnoj i na strani Kontakt.
//
// Sajt stoji na GitHub Pages, dakle bez servera koji bi primio POST. Do sada je
// dugme samo sakrivalo formu i ispisivalo "Primili smo vas upit", a nijedan upit
// nije nigde stizao. Sada se od popunjenih polja sastavlja mejl i otvara se
// posetiocev program za postu, pa posetilac sam pritisne "posalji".
//
// Zato panel posle klika ne sme da tvrdi da je upit primljen: on kaze da je mejl
// otvoren i ostavlja telefon za slucaj da se nista nije otvorilo.

// Adresa primaoca stoji u data-prima na #pp-form, da bi ostala u firma.json.
const REDOVI = [
  ['ime', 'Ime i prezime'],
  ['firma', 'Naziv firme'],
  ['kontakt', 'Telefon ili imejl'],
  ['zaposleni', 'Broj zaposlenih'],
  ['delatnost', 'Delatnost'],
];

// mailto se prenosi kroz adresnu liniju, a operativni sistemi je seku negde oko
// 2000 znakova. Poruka je jedino polje bez gornje granice, pa se ona skracuje,
// a ne ceo mejl.
const NAJVISE_PORUKA = 1200;

const form = document.getElementById('pp-form');
const dugme = document.getElementById('pp-submit');
const saglasnost = document.getElementById('pp-consent');
const upozorenje = document.getElementById('pp-need-consent');
const panel = document.getElementById('pp-sent');

if (form && dugme) {
  const polje = (ime) => form.querySelector(`[data-pp="${ime}"]`);
  const vrednost = (ime) => (polje(ime)?.value ?? '').trim();

  saglasnost?.addEventListener('change', () => {
    if (upozorenje) upozorenje.hidden = true;
  });

  dugme.addEventListener('click', () => {
    if (!saglasnost?.checked) {
      if (upozorenje) upozorenje.hidden = false;
      upozorenje?.scrollIntoView({ block: 'nearest' });
      return;
    }

    const redovi = REDOVI.map(([ime, naziv]) => `${naziv}: ${vrednost(ime) || '-'}`);

    let poruka = vrednost('poruka');
    if (poruka.length > NAJVISE_PORUKA) poruka = poruka.slice(0, NAJVISE_PORUKA) + '...';
    if (poruka) redovi.push('', 'Poruka:', poruka);

    const firma = vrednost('firma');
    const naslov = firma ? `Upit sa sajta - ${firma}` : 'Upit sa sajta';
    const prima = form.dataset.prima || '';

    // encodeURIComponent, ne encodeURI: ovaj drugi ostavlja & i # nedirnute, pa
    // bi naziv firme sa "&" presekao mejl na pola.
    window.location.href =
      `mailto:${prima}?subject=${encodeURIComponent(naslov)}&body=${encodeURIComponent(redovi.join('\n'))}`;

    form.hidden = true;
    if (panel) panel.hidden = false;
  });
}
