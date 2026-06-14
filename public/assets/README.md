# agent-town art assets

Runtime pixel-art for the town renderer. Committed (not gitignored) because they
are required for the app to run, are tiny (~15 KB total), and are CC0.

## Source & license
- **Kenney "Tiny Town"** (v1.1) — https://kenney.nl/assets/tiny-town
- License: **CC0 1.0** (public domain, no attribution required). See `KENNEY_LICENSE.txt`.

## Files
| File | Source | Shape | Notes |
|------|--------|-------|-------|
| `tilemap.png` | Tiny Town `Tilemap/tilemap_packed.png` | 192×176, 12×11 grid of 16×16 tiles, **no spacing** | Loaded as a Phaser spritesheet (`frameWidth/Height: 16`). Tile index = `row*12 + col`. |
| `character.png` | Tiny Town tile **104** | 16×16 | Single-frame worker sprite (a villager figure). |
| `grass.png` | Tiny Town tile **0** | 16×16 | Tiled across the ground via `TileSprite`. |
| `KENNEY_LICENSE.txt` | Tiny Town `License.txt` | — | CC0 license text. |

## Tile indices used (see `src/web/assets.ts`)
- **House facades** (door + windows): `84`, `88`
- **Roofs**: red `52`, `64`, `65`; blue `49`, `50`
- **Ground**: grass `0`
- **Worker**: `104`

## Swapping packs
Change `ASSETS` / `HOUSE_STYLES` in `src/web/assets.ts` and drop replacement PNGs
here. The loader falls back to primitive shapes (colored rectangles + circles) if
any texture is missing, so the app still runs with no art present.
