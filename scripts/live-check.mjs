import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Optional integration check: requires the dev server and a network connection.
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/cs409-mp2/gallery', { waitUntil: 'domcontentloaded' });
  await page.locator('.pokemon-card').last().waitFor({ timeout: 120000 });
  const count = await page.locator('.pokemon-card').count();
  if (count !== 151) throw new Error(`Expected 151 live items, got ${count}`);
  await page.locator('.pokemon-card img').first().evaluate((img) => img.decode());
  await page.screenshot({ path: 'test-results/live-desktop.png' });
  await page.getByRole('searchbox').fill('pikachu');
  await page.locator('.pokemon-card').click();
  await page.getByRole('heading', { name: 'pikachu', exact: true }).waitFor();
  await page.locator('.detail-art img').evaluate((img) => img.decode());
  await page.screenshot({ path: 'test-results/live-detail.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/live-mobile-detail.png', fullPage: true });
  await page.goto('http://127.0.0.1:5173/cs409-mp2/gallery');
  await page.locator('.pokemon-card').last().waitFor();
  await page.screenshot({ path: 'test-results/live-mobile.png' });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ livePokemon: count, detail: 'pikachu', runtimeErrors: errors, screenshots: 'test-results/live-*.png' }));
} finally {
  await browser.close();
}
