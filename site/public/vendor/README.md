# vendor

Kopije tudjih biblioteka. Stoje ovde umesto na CDN-u iz dva razloga:

- **bezbednost** - `unpkg.com` i `cdn.jsdelivr.net` su izvrsavali svoj kod na
  nasem sajtu. Ko drzi CDN, drzi i sadrzaj stranice. Kopija sece taj rizik.
- **brzina** - ista veza koja vec sluzi stranicu sluzi i skriptu, bez novog
  DNS-a i TLS-a ka dva strana domena. Sazete gradnje su uz to upola lakse.

Nijedan fajl nije rucno menjan. Ako ti treba izmena, ne diraj ove fajlove nego
je napravi u kodu koji ih uvozi.

## Sta je odakle

| fajl | verzija | izvor |
| --- | --- | --- |
| `three.esm.js` | three 0.184.0 | `https://cdn.jsdelivr.net/npm/three@0.184.0/+esm` |
| `gsap.esm.js` | gsap 3.13.0 | `https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm` |
| `gsap-inertia.esm.js` | gsap 3.13.0 | `https://cdn.jsdelivr.net/npm/gsap@3.13.0/InertiaPlugin.js/+esm` |

Sve tri gradnje su samostalne: ne uvoze nista dalje. To se mora proveriti posle
svake nadogradnje, jer nesazeta gradnja three-a uvozi jos i `three.core.js`, pa
bi kopiranje samo jednog fajla tiho polomilo pocetnu stranu.

## Nadogradnja

```sh
cd site
curl -sL "https://cdn.jsdelivr.net/npm/three@<verzija>/+esm" -o public/vendor/three.esm.js
# provera da gradnja nista ne uvozi spolja:
grep -oE "from *['\"][^'\"]*['\"]" public/vendor/three.esm.js | sort -u
```

Ako `grep` isprazni, gradnja je samostalna. Ako izbaci putanju, i taj fajl mora
ovde, a uvoz u `refinery-scene.js` da se poklopi. Posle nadogradnje otvori
pocetnu stranu i `/cenovnik` i proveri da nema greske u konzoli.
