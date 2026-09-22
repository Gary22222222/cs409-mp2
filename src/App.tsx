import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { getCatalogue, getPokemon, displayName, number, type Pokemon } from './api';

const types = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'fairy'];
type Sort = 'id' | 'name' | 'height' | 'weight';

function Artwork({ pokemon, large = false }: { pokemon: Pokemon; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const source = pokemon.sprites.other['official-artwork'].front_default ?? pokemon.sprites.front_default;
  return source && !failed
    ? <img src={source} alt={displayName(pokemon.name)} loading={large ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
    : <span className="missing-art" role="img" aria-label={`${pokemon.name}: image unavailable`}>◇<small>Image unavailable</small></span>;
}

function Badges({ pokemon }: { pokemon: Pokemon }) {
  return <span className="badges">{pokemon.types.map(({ type }) => <span key={type.name} className={`badge type-${type.name}`}>{type.name}</span>)}</span>;
}

function Status({ error, retry }: { error: boolean; retry: () => void }) {
  return <div className="status" role={error ? 'alert' : 'status'}>
    <span className="status-symbol">{error ? '↻' : '◌'}</span>
    <h2>{error ? 'The trail is a little quiet.' : 'Opening the field guide…'}</h2>
    <p>{error ? 'We couldn’t reach PokéAPI. Check your connection and try again.' : 'Collecting Pokémon data from PokéAPI. The first visit may take a moment.'}</p>
    {error && <button className="primary-button" onClick={retry}>Try again</button>}
  </div>;
}

function Explorer({ mode }: { mode: 'gallery' | 'list' }) {
  const [items, setItems] = useState<Pokemon[]>([]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const selected = (params.get('types') ?? '').split(',').filter((type) => types.includes(type));
  const sortValue = params.get('sort') ?? 'id';
  const sort: Sort = ['id', 'name', 'height', 'weight'].includes(sortValue) ? sortValue as Sort : 'id';
  const descending = params.get('order') === 'desc';

  useEffect(() => {
    let active = true;
    setError(false);
    getCatalogue().then((data) => { if (active) setItems(data); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase().replace(/^#/, '');
    return items.filter((item) => (item.name.includes(search) || String(item.id).padStart(3, '0').includes(search))
      && (!selected.length || item.types.some(({ type }) => selected.includes(type.name))))
      .sort((a, b) => {
        const diff = sort === 'name' ? a.name.localeCompare(b.name) : a[sort] - b[sort];
        return (diff || a.id - b.id) * (descending ? -1 : 1);
      });
  }, [items, query, selected.join(','), sort, descending]);
  const back = `/${mode}${params.size ? `?${params}` : ''}`;
  const navigation = { ids: visible.map((item) => item.id), back };

  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">THE ORIGINAL 151 · GENERATION I</p>
        <h1>A little curiosity.<br /><em>A whole world to discover.</em></h1>
        <p>Your field guide to the Pokémon of Kanto.<br className="desktop-break" /> Find a familiar face, or meet a new favorite.</p>
        <div className="hero-note"><span className="live-dot" /> 151 Pokémon. Endless discoveries.</div>
      </div>
      <div className="hero-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" />
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" alt="" />
        <span className="specimen-label">BULBASAUR <span>No. 001</span></span>
        <span className="art-caption">FIELD NOTES / KANTO REGION</span>
      </div>
    </section>
    <section className="explore" aria-labelledby="explore-title">
      <div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2 id="explore-title">Explore the Pokédex<span>.</span></h2></div>
        <div className="view-switch" aria-label="View mode">
          <NavLink to={`/gallery?${params}`} className={mode === 'gallery' ? 'selected' : ''}>▦ Gallery</NavLink>
          <NavLink to={`/list?${params}`} className={mode === 'list' ? 'selected' : ''}>☷ List</NavLink>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-wrap"><span aria-hidden="true">⌕</span><input aria-label="Search Pokémon" type="search" placeholder="Search by name or number…" value={query} onChange={(event) => update('q', event.target.value)} /></div>
        <label className="sort-control">Sort by <select aria-label="Sort property" value={sort} onChange={(event) => update('sort', event.target.value)}><option value="id">Pokédex number</option><option value="name">Name</option><option value="height">Height</option><option value="weight">Weight</option></select></label>
        <button className="order-button" onClick={() => update('order', descending ? 'asc' : 'desc')} aria-label={`Sort ${descending ? 'ascending' : 'descending'}`}>{descending ? '↓ Descending' : '↑ Ascending'}</button>
      </div>
      <div className="filter-area"><span className="filter-label">FILTER BY TYPE</span><div className="filters">
        <button className={!selected.length ? 'filter active' : 'filter'} aria-pressed={!selected.length} onClick={() => update('types', '')}>All types</button>
        {types.map((type) => <button key={type} aria-pressed={selected.includes(type)} className={`filter ${selected.includes(type) ? 'active' : ''}`} onClick={() => update('types', selected.includes(type) ? selected.filter((value) => value !== type).join(',') : [...selected, type].join(','))}><span className={`type-dot type-${type}`} />{type}</button>)}
      </div></div>
      {!items.length ? <Status error={error} retry={() => setAttempt((value) => value + 1)} /> : <>
        <div className="result-line"><p role="status">Showing <strong>{visible.length}</strong> of 151 Pokémon{selected.length > 1 ? ' · matching any selected type' : ''}</p><span>KANTO REGION ↗</span></div>
        {!visible.length ? <div className="status"><h3>No Pokémon on this trail.</h3><p>Try another name, number, or type.</p><button className="primary-button" onClick={() => setParams({})}>Clear all filters</button></div>
          : mode === 'gallery' ? <div className="card-grid">{visible.map((pokemon) => <Link key={pokemon.id} to={`/pokemon/${pokemon.id}`} state={navigation} className={`pokemon-card surface-${pokemon.types[0].type.name}`}>
            <div className="card-image"><span className="card-number">{number(pokemon.id)}</span><span className="card-arrow" aria-hidden="true">↗</span><Artwork pokemon={pokemon} /></div>
            <div className="card-info"><h3>{displayName(pokemon.name)}</h3><Badges pokemon={pokemon} /></div>
          </Link>)}</div>
          : <div className="pokemon-list"><div className="list-labels" aria-hidden="true"><span>POKÉMON</span><span>TYPE</span><span>HEIGHT</span><span>WEIGHT</span><span /></div>{visible.map((pokemon) => <Link key={pokemon.id} to={`/pokemon/${pokemon.id}`} state={navigation} className="pokemon-row"><div className="row-name"><span className="row-number">{number(pokemon.id)}</span><Artwork pokemon={pokemon} /><h3>{displayName(pokemon.name)}</h3></div><Badges pokemon={pokemon} /><span className="measurement">{pokemon.height / 10} m</span><span className="measurement">{pokemon.weight / 10} kg</span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}</div>}
      </>}
    </section>
  </>;
}

function Detail() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  const valid = Number.isInteger(id) && id >= 1 && id <= 151;
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const location = useLocation();
  const state = location.state as { ids?: number[]; back?: string } | null;
  const ids = state?.ids?.includes(id) ? state.ids : Array.from({ length: 151 }, (_, i) => i + 1);
  const index = ids.indexOf(id);
  const previous = ids[(index - 1 + ids.length) % ids.length];
  const next = ids[(index + 1) % ids.length];
  useEffect(() => {
    let active = true;
    setPokemon(null); setError(false);
    if (valid) getPokemon(id).then((data) => { if (active) setPokemon(data); }).catch(() => { if (active) setError(true); });
    window.scrollTo(0, 0);
    return () => { active = false; };
  }, [id, valid, attempt]);
  if (!valid) return <NotFound />;
  return <section className="detail-page"><Link className="back-link" to={state?.back ?? '/gallery'}>← Back to collection</Link>
    {!pokemon ? <Status error={error} retry={() => setAttempt((value) => value + 1)} /> : <>
      <div className="detail-grid"><div className={`detail-art surface-${pokemon.types[0].type.name}`}><span className="eyebrow">KANTO FIELD GUIDE</span><Artwork key={id} pokemon={pokemon} large /><span className="detail-art-number">{number(id)}</span></div>
        <div className="detail-copy"><p className="eyebrow">GENERATION I / {number(id)}</p><h1>{displayName(pokemon.name)}</h1><Badges pokemon={pokemon} />
          <p className="detail-intro">Meet {displayName(pokemon.name)}, a {pokemon.types.map(({ type }) => type.name).join(' / ')}-type Pokémon from the original Kanto collection.</p>
          <dl className="facts"><div><dt>Height</dt><dd>{pokemon.height / 10}<small> m</small></dd></div><div><dt>Weight</dt><dd>{pokemon.weight / 10}<small> kg</small></dd></div><div><dt>Base experience</dt><dd>{pokemon.base_experience ?? '—'}</dd></div></dl>
          <h2 className="small-heading">Abilities</h2><div className="abilities">{pokemon.abilities.map(({ ability, is_hidden }) => <span key={ability.name}>{displayName(ability.name)}{is_hidden && <small>Hidden</small>}</span>)}</div>
          <div className="stats-heading"><h2 className="small-heading">Base stats</h2><span>Total {pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0)}</span></div>
          <div className="stats">{pokemon.stats.map(({ stat, base_stat }) => <div className="stat" key={stat.name}><label htmlFor={`stat-${stat.name}`}>{displayName(stat.name)}</label><strong>{base_stat}</strong><progress id={`stat-${stat.name}`} max={255} value={base_stat}>{base_stat}</progress></div>)}</div>
        </div>
      </div>
      <nav className="detail-navigation" aria-label="Pokémon navigation"><Link to={`/pokemon/${previous}`} state={state}>← Previous <span>{number(previous)}</span></Link><span>{index + 1} / {ids.length}<small>in this collection</small></span><Link to={`/pokemon/${next}`} state={state}>Next → <span>{number(next)}</span></Link></nav>
    </>}
  </section>;
}

function NotFound() {
  return <div className="status"><p className="eyebrow">OFF THE MAP / 404</p><h1>This Pokémon hasn’t been discovered here.</h1><p>This field guide covers Kanto Pokémon #001–#151.</p><Link className="primary-button" to="/gallery">Explore the collection</Link></div>;
}

export default function App() {
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><Link className="brand" to="/gallery"><span className="brand-mark" aria-hidden="true">◒</span><span>kanto<small>THE POKÉMON FIELD GUIDE</small></span></Link><nav aria-label="Main navigation"><NavLink to="/gallery">Discover</NavLink><NavLink to="/list">Pokédex</NavLink></nav><span className="edition">VOL. 01 <span> / </span> KANTO</span></header>
    <main id="main"><Routes><Route path="/" element={<Navigate to="/gallery" replace />} /><Route path="/gallery" element={<Explorer mode="gallery" />} /><Route path="/list" element={<Explorer mode="list" />} /><Route path="/pokemon/:id" element={<Detail />} /><Route path="*" element={<NotFound />} /></Routes></main>
    <footer><Link className="footer-brand" to="/gallery">kanto<span> A field guide for the curious.</span></Link><p>Data & artwork from <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">PokéAPI ↗</a><span> · </span>Made for CS 409</p><small>Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc. Educational fan project.</small></footer>
  </>;
}
