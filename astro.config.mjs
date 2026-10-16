import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://better-life-guide.pages.dev',
  integrations: [sitemap()],
});