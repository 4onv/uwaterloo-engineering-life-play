# Artwork and fonts

Five project-owned background images were generated with OpenAI's built-in image generator on November 17, 2026. They are committed in `public/art/` and included in the browser build. They are artistic campus interpretations rather than photographs or geographic reconstructions.

The shared prompt direction was: a detailed 16:9 side-on pixel-art environment for a University of Waterloo engineering life simulation; crisp fine pixels, atmospheric navy/teal shadows, warm amber lighting, a dark-haired engineering student wearing a grey hoodie in the left third, and a quieter right third for the game menu. No HUD, buttons, website frame, or overlay text.

| File | Scene-specific prompt |
| --- | --- |
| `e7-sunset.png` | E7 study lab with floor-to-ceiling windows, engineering buildings, autumn trees, sunset, student at a computer, books, coffee, a robot model, and Waterloo pennant. |
| `dc-library.png` | Davis Centre library at blue hour, angular windows, winter campus, book stacks, warm desk lamps, and student studying with headphones. |
| `plaza-sunset.png` | University Plaza with Lazeez and cafés, student patio tables, engineering hoodies, autumn maple leaves, and a foreground Canada goose. |
| `residence-night.png` | Waterloo student residence at night, bed, computer, robot project, plants, rainy window, campus lights, and a Waterloo pennant. |
| `coop-office.png` | A California engineering co-op office at golden hour, student and mentor, dual monitors, electronics prototype, palms, distant hills, plants, and oak desks. |

The canvas renderer adds crossfades, a walking character during travel, action feedback, animated rain and snow, falling leaves, a moving Plaza goose, monitor activity, coffee steam, dust motes, and time-of-term tinting. Reduced motion disables animated overlays. The game remains a menu-driven life sim rather than a character-movement platformer.

**Pixelify Sans** and **IBM Plex Sans** are loaded from the installed `@fontsource` packages and bundled into the build, so the game does not contact a font CDN at runtime. Their licences are in the corresponding packages under `node_modules/@fontsource/*/LICENSE`.
