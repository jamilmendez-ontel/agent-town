// Central asset manifest so swapping art packs touches one file.
// Art: Kenney "Tiny Town" (CC0, www.kenney.nl). Packed tilesheet is 12 columns
// of 16x16 tiles; a tile index maps to (row*12 + col).
export const ASSETS = {
  tiles: { key: 'tiles', url: '/assets/tilemap.png', frameWidth: 16, frameHeight: 16 },
  character: { key: 'character', url: '/assets/character.png', frameWidth: 16, frameHeight: 16 },
  grass: { key: 'grass', url: '/assets/grass.png' },
}

// House style = [roof tile index, body/facade tile index] into the packed sheet.
// Chosen by inspecting the sheet: 84/88 are door+window facades; 49/50 blue
// roofs, 52/64/65 red roofs.
export const HOUSE_STYLES: ReadonlyArray<readonly [number, number]> = [
  [65, 84], // red shingle roof + door & windows
  [49, 88], // blue roof + door
  [52, 84], // red roof with trim + door & windows
  [50, 88], // blue roof + door
  [64, 88], // red shingle + door
]

// Deterministic style per building index (stable across reloads).
export function houseStyle(i: number): readonly [number, number] {
  return HOUSE_STYLES[i % HOUSE_STYLES.length]
}
