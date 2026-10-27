import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://elitenetworks.net',
  output: 'static',
  adapter: vercel(),
});
