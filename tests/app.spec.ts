import { expect, test, type Page } from '@playwright/test';

async function mockApi(page: Page) {
  await page.route('https://pokeapi.co/api/v2/pokemon/*', async (route) => {
    const id = Number(route.request().url().split('/').pop());
    const names: Record<number, string> = { 1: 'bulbasaur', 2: 'ivysaur', 3: 'venusaur', 4: 'charmander', 25: 'pikachu', 151: 'mew' };
    await route.fulfill({ json: {
      id, name: names[id] ?? `pokemon-${String(id).padStart(3, '0')}`, height: id + 2, weight: 160 - id, base_experience: 64,
      types: [{ type: { name: id <= 3 ? 'grass' : id === 4 ? 'fire' : 'normal' } }],
      abilities: [{ ability: { name: 'overgrow' }, is_hidden: false }],
      stats: [{ base_stat: 45, stat: { name: 'hp' } }, { base_stat: 65, stat: { name: 'special-attack' } }],
      sprites: { front_default: null, other: { 'official-artwork': { front_default: null } } },
    } });
  });
}

test.beforeEach(async ({ page }) => { await mockApi(page); });

test('live search, empty state, and sorting by multiple properties in both orders', async ({ page }) => {
  await page.goto('list');
  const rows = page.locator('.pokemon-row');
  await expect(rows).toHaveCount(151);
  await page.getByRole('searchbox').fill('BULBA');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('bulbasaur');
  await page.getByRole('searchbox').fill('#025');
  await expect(rows.first()).toContainText('pikachu');
  await page.getByRole('searchbox').fill('no-such-pokemon');
  await expect(page.getByText('No Pokémon on this trail.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  for (const [sort, first, last] of [['id', 'bulbasaur', 'mew'], ['name', 'bulbasaur', 'venusaur'], ['height', 'bulbasaur', 'mew'], ['weight', 'mew', 'bulbasaur']]) {
    await page.getByLabel('Sort property').selectOption(sort);
    await expect(rows.first()).toContainText(first);
    await page.getByRole('button', { name: 'Sort descending' }).click();
    await expect(rows.first()).toContainText(last);
    await page.getByRole('button', { name: 'Sort ascending' }).click();
  }
});

test('gallery multi-filter, detail, filtered previous/next and preserved return state', async ({ page }) => {
  await page.goto('gallery');
  await expect(page.locator('.pokemon-card')).toHaveCount(151);
  await page.getByRole('button', { name: 'grass', exact: true }).click();
  await expect(page.locator('.pokemon-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'fire', exact: true }).click();
  await expect(page.locator('.pokemon-card')).toHaveCount(4);
  await page.locator('.pokemon-card').first().click();
  await expect(page).toHaveURL(/pokemon\/1$/);
  await expect(page.getByRole('heading', { name: 'bulbasaur', exact: true })).toBeVisible();
  await expect(page.getByText('overgrow', { exact: true })).toBeVisible();
  await expect(page.getByText('Base stats', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Previous/ }).click();
  await expect(page.getByRole('heading', { name: 'charmander', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/pokemon\/1$/);
  await page.getByRole('link', { name: 'Back to collection' }).click();
  await expect(page.locator('.pokemon-card')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'grass', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('list opens details; direct detail URL and refresh work; invalid routes are handled', async ({ page }) => {
  await page.goto('list?q=pikachu');
  await page.locator('.pokemon-row').click();
  await expect(page).toHaveURL(/pokemon\/25$/);
  await expect(page.getByRole('heading', { name: 'pikachu', exact: true })).toBeVisible();
  await page.goto('pokemon/151');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'mew', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Next/ }).click();
  await expect(page.getByRole('heading', { name: 'bulbasaur', exact: true })).toBeVisible();
  await page.goto('pokemon/999');
  await expect(page.getByText('This Pokémon hasn’t been discovered here.')).toBeVisible();
  await page.goto('unknown');
  await expect(page.getByText('OFF THE MAP / 404')).toBeVisible();
});

test('network errors have a working retry', async ({ page }) => {
  await page.unroute('https://pokeapi.co/api/v2/pokemon/*');
  await page.route('https://pokeapi.co/api/v2/pokemon/*', (route) => route.abort());
  await page.goto('gallery');
  await expect(page.getByRole('alert')).toContainText('We couldn’t reach PokéAPI');
  await page.unroute('https://pokeapi.co/api/v2/pokemon/*');
  await mockApi(page);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.pokemon-card')).toHaveCount(151);
});

test('mobile gallery and detail fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('gallery');
  await expect(page.locator('.pokemon-card')).toHaveCount(151);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.pokemon-card').first().click();
  await expect(page.getByRole('heading', { name: 'bulbasaur', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
