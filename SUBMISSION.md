# Kanto — MP2 implementation & submission guide

The original assignment is preserved in `README.md`.

## Run locally

Requires Node.js 20 or newer (the project is compatible with Node 20.12).

```sh
npm ci
npm run dev
```

Open http://localhost:5173/cs409-mp2/ .

```sh
npm run build
npm run preview
```

## Scope and behavior

- Uses **live PokéAPI data for the original 151 Kanto Pokémon**; this is an intentional collection boundary, not the full National Pokédex.
- `/gallery`: official artwork, name/number search, multi-select type filters. Multiple selected types match **any** selected type.
- `/list`: live search by name or number, sorting by number/name/height/weight, each ascending or descending. The same filters also work here.
- `/pokemon/25`: individually addressable detail page with types, height, weight, experience, abilities, and base stats.
- Previous/next wrap through the current filtered/sorted results when opened from the collection. A direct URL uses the full 151-item order. With only one result, both controls point to that same result. Back to collection preserves search, filters, and sort.
- Axios requests have timeouts, at most eight catalogue workers, shared in-flight requests, memory caching, and a 24-hour browser cache. Failed loads show a retry action; missing images have an explicit fallback. Normal runtime does not silently substitute mock data.
- Responsive CSS, keyboard focus states, labeled inputs, semantic sections, and a skip link. No inline styles, inline scripts, or layout tables.

## Validation

```sh
npx playwright install chromium
npm test
npm run build
```

Browser tests use deterministic mocked API responses to verify search, all four sorts and directions, type filtering, both entry paths into details, previous/next wrapping, preserved collection state, direct URLs, refresh, invalid routes, error recovery, and mobile overflow. Mock responses exist only in tests. Live API access should also be checked before recording the demo.

Latest local verification (September 22, 2026): production build passed; **5/5 Playwright tests passed**; live browser integration loaded all **151** API records, displayed Pikachu details and official artwork, and reported **zero JavaScript runtime errors**. Desktop and mobile screenshots were inspected. To repeat the live check with the dev server running, use `node scripts/live-check.mjs`; screenshots are written to the ignored `test-results/` directory.

| README requirement | Implementation / verification |
| --- | --- |
| Relevant API items in list | 151 live Kanto Pokémon; live integration passed |
| Search filters as you type | Name and number, case insensitive; browser test passed |
| At least two sorting properties | Number, name, height, weight; all four tested |
| Ascending and descending | Both directions tested for each property |
| Gallery of item media | Official artwork; real image decoding verified |
| Gallery attribute filtering | Multi-select type buttons; filtering tested |
| List → detail | Browser test passed |
| Gallery → detail | Browser test passed |
| Detailed attributes | Types, measurements, experience, abilities, stats |
| Previous and next | Filtered/sorted order, wraparound, direct URL order tested |
| React Router + TypeScript + Axios | Used throughout; TypeScript build passed |
| Design | Responsive field-guide theme; desktop/mobile visual review complete |
| No inline styles/scripts or layout tables | Source inspected; external module entry only |
| Deployment | Build/base/route entries prepared; remote deployment still pending |
| Video, chat log, survey, grading form | Student submission steps remain |

## GitHub Pages

- Vite base: `/cs409-mp2/` (matches this repository, rather than the README's example `/mp2/`).
- BrowserRouter basename: `import.meta.env.BASE_URL`.
- Existing `.github/workflows/deploy.yml` is preserved. `package-lock.json` must be included in the commit because CI uses `npm ci`.
- Build copies the SPA entry into `gallery/`, `list/`, and all 151 `pokemon/<id>/` directories. GitHub Pages can serve direct detail URLs and refreshes without inline redirect scripts. `404.html` provides an application-level not-found view for other routes.
- In GitHub Settings → Pages → Build and deployment, select **GitHub Actions**, then commit and push to `main`.
- Expected deployment URL: https://Gary22222222.github.io/cs409-mp2/ . This URL is a deployment target, not a claim that deployment is already complete.

## References and attribution

Implementation code was generated with OpenAI Codex for this assignment. Do not represent it as unaided work. No external app implementation was copied.

- PokéAPI API schema, data, official artwork: https://pokeapi.co/docs/v2/ and https://github.com/PokeAPI/sprites
- React Router routing and basename: https://reactrouter.com/start/declarative/routing and https://reactrouter.com/api/declarative-routers/BrowserRouter
- Vite GitHub Pages deployment reference: https://vite.dev/guide/static-deploy
- Google Fonts: DM Sans and Playfair Display, loaded from https://fonts.google.com/ with system-font fallbacks.
- Pokémon names and images belong to their respective rights holders. This is an educational fan project.

## Final submission tasks for the student

1. Review and understand the implementation, then verify the deployed site after pushing.
2. Record a demo **under 3 minutes** showing the deployed URL, live search, two sorting properties in both directions, gallery filters, both detail entry points, and previous/next.
3. Upload the video to Google Drive and share it with `uiuc.web.programming@gmail.com`.
4. **Export and submit the full Codex chat log with the source code**, as required by the README LLM policy. This file is not a replacement for the actual chat log.
5. Fill out the LLM-experience survey questions and submit the grading form linked in README.

The video, survey responses, and final course submission require the student's own participation.
