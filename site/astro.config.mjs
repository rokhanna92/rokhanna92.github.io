// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Prava adresa sajta. Odavde se racunaju kanonske adrese, mapa sajta i
  // kartice za deljenje, pa mora da bude tacna i apsolutna.
  // Dok se DNS ne prebaci, sajt jos stoji na rokhanna92.github.io: kada domen
  // proradi, dodaj i site/public/CNAME sa "previngpro.rs" i to je sve.
  site: 'https://previngpro.rs',
});
