import axios from 'axios';

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: { type: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  stats: { base_stat: number; stat: { name: string } }[];
  sprites: { front_default: string | null; other: { 'official-artwork': { front_default: string | null } } };
}

const api = axios.create({ baseURL: 'https://pokeapi.co/api/v2/', timeout: 20000 });
const cache = new Map<number, Pokemon>();
const pending = new Map<number, Promise<Pokemon>>();
const CACHE_KEY = 'kanto-pokemon-v1';

try {
  const stored = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
  if (stored && Date.now() - stored.time < 86400000 && Array.isArray(stored.items)) {
    for (const item of stored.items) {
      if (Number.isInteger(item.id) && typeof item.name === 'string' && Array.isArray(item.types)
        && Array.isArray(item.stats) && Array.isArray(item.abilities) && item.sprites?.other) cache.set(item.id, item);
    }
  }
} catch { /* Storage may be unavailable or contain an older schema. */ }

export function getPokemon(id: number): Promise<Pokemon> {
  const cached = cache.get(id);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(id);
  if (existing) return existing;
  const request = api.get<Pokemon>(`pokemon/${id}`).then(({ data }) => {
    cache.set(id, data);
    return data;
  }).finally(() => pending.delete(id));
  pending.set(id, request);
  return request;
}

let catalogue: Promise<Pokemon[]> | undefined;
export function getCatalogue(): Promise<Pokemon[]> {
  if (catalogue) return catalogue;
  catalogue = (async () => {
    const items: Pokemon[] = [];
    let nextId = 1;
    // Keep network pressure bounded, including on retry after a partial failure.
    const workers = await Promise.allSettled(Array.from({ length: 8 }, async () => {
      while (nextId <= 151) items.push(await getPokemon(nextId++));
    }));
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), items: [...cache.values()] }));
    } catch { /* In-memory caching still works if browser storage is full. */ }
    if (workers.some((worker) => worker.status === 'rejected')) throw new Error('Unable to load the complete field guide.');
    return items.sort((a, b) => a.id - b.id);
  })().catch((error) => { catalogue = undefined; throw error; });
  return catalogue;
}

export const displayName = (name: string) => name.replaceAll('-', ' ');
export const number = (id: number) => `#${String(id).padStart(3, '0')}`;
