import { BOARD_PATTERNS, type WorkshopPattern } from './boardPatterns';
import { NOSE_STICKERS, normalizeNoseName, type NoseSticker } from './noseStickers';

export interface GearStyle {
  gear: 'board' | 'skis';
  pattern: WorkshopPattern;
  colors: { top: string; base: string; pat: string; pat2: string; acc: string };
  tailColors: Partial<Record<'top' | 'base', string>>;
  noseSticker: NoseSticker;
  noseStickerColor: string;
  noseName: string;
}

export const MAX_DESIGN_BYTES = 8192;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid gear design.');
  return value as Record<string, unknown>;
}

function color(value: unknown): string {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error('Invalid design color.');
  return value;
}

export function parseGearDesign(text: string): GearStyle {
  if (text.length > MAX_DESIGN_BYTES) throw new Error('Gear design file is too large.');
  const file = record(JSON.parse(text));
  if (file.format !== 'hemu-ski-gear' || file.version !== 1) throw new Error('Unsupported gear design format.');
  const s = record(file.style);
  if (s.gear !== 'board' && s.gear !== 'skis') throw new Error('Unknown gear type.');
  const pattern = BOARD_PATTERNS.find(([id]) => id === s.pattern);
  const sticker = NOSE_STICKERS.find(([id]) => id === s.noseSticker);
  if (!pattern || !sticker || typeof s.noseName !== 'string' || normalizeNoseName(s.noseName) !== s.noseName) {
    throw new Error('Invalid gear graphics.');
  }
  const c = record(s.colors);
  const tails = record(s.tailColors);
  return {
    gear: s.gear,
    pattern: pattern[0],
    colors: { top: color(c.top), base: color(c.base), pat: color(c.pat), pat2: color(c.pat2), acc: color(c.acc) },
    tailColors: {
      top: tails.top === undefined ? undefined : color(tails.top),
      base: tails.base === undefined ? undefined : color(tails.base),
    },
    noseSticker: sticker[0],
    noseStickerColor: color(s.noseStickerColor),
    noseName: s.noseName,
  };
}

export function serializeGearDesign(s: GearStyle): string {
  const { gear, pattern, colors, tailColors, noseSticker, noseStickerColor, noseName } = s;
  return JSON.stringify({
    format: 'hemu-ski-gear', version: 1,
    style: { gear, pattern, colors, tailColors, noseSticker, noseStickerColor, noseName },
  }, null, 2);
}

export function boardOptions(s: GearStyle) {
  const c = s.colors;
  return {
    topsheetColor: c.top, baseColor: c.base,
    topsheetTailColor: s.tailColors.top, baseTailColor: s.tailColors.base,
    noseSticker: s.noseSticker, noseStickerColor: s.noseStickerColor, noseName: s.noseName,
    pattern: s.pattern, patternColor: c.pat, patternColor2: c.pat2,
    basePattern: s.pattern === 'none' ? 'none' as const : 'lengthStripes' as const,
    basePatternColor: c.top,
  };
}

export function skiOptions(s: GearStyle) {
  const c = s.colors;
  return {
    topsheetColor: c.top === '#f2f2f0' ? '#2f5d8a' : c.top,
    topsheetTailColor: s.tailColors.top, baseTailColor: s.tailColors.base,
    baseColor: c.base, stripeColor: c.pat,
    accentColor: c.pat2 === '#17171a' ? '#f2a7b9' : c.pat2,
  };
}
