export const NOSE_STICKERS = [
  ['none', '无贴纸'],
  ['mountain', '山峰'],
  ['snowflake', '雪花'],
  ['fox', '雪狐'],
] as const;

export type NoseSticker = typeof NOSE_STICKERS[number][0];
type Point = [number, number];

export function stickerPaths(sticker: Exclude<NoseSticker, 'none'>): Point[][] {
  switch (sticker) {
    case 'mountain':
      return [
        [[-1, 0.65], [-0.33, -0.48], [-0.10, -0.18], [0.27, -0.79], [1, 0.65], [-1, 0.65]],
        [[0.04, -0.41], [0.20, -0.25], [0.31, -0.42], [0.48, -0.38]],
      ];
    case 'fox':
      return [
        [[0, 0.83], [-0.86, 0.13], [-0.93, -0.82], [-0.35, -0.35], [0.35, -0.35], [0.93, -0.82], [0.86, 0.13], [0, 0.83]],
        [[-0.79, 0.12], [-0.42, 0.11], [-0.11, 0.53], [0.11, 0.53], [0.42, 0.11], [0.79, 0.12]],
        [[-0.48, -0.04], [-0.29, 0.02]],
        [[0.29, 0.02], [0.48, -0.04]],
      ];
    case 'snowflake':
      return Array.from({ length: 6 }, (_, i): Point[][] => {
        const angle = i * Math.PI / 3;
        const rotate = (x: number, y: number): Point => [
          x * Math.cos(angle) - y * Math.sin(angle),
          x * Math.sin(angle) + y * Math.cos(angle),
        ];
        return [
          [[0, 0], rotate(0, 1)],
          [rotate(-0.25, 0.78), rotate(0, 0.51), rotate(0.25, 0.78)],
        ];
      }).flat();
  }
}

export const NOSE_NAME_LIMIT = 'Christopher'.length;

export function normalizeNoseName(value: string): string {
  return value.replace(/[^a-z]/gi, '').slice(0, NOSE_NAME_LIMIT);
}

// Single-stroke capitals on a 3 × 4 grid. Each space starts a new stroke.
const LETTERS: Record<string, string> = {
  A: '041034 0222', B: '040020312202 0222332404', C: '301000041434', D: '04002031332404',
  E: '30000434 0222', F: '040030 0222', G: '3010000414343222', H: '0004 3034 0232',
  I: '0030 2024 0434', J: '3033140403', K: '0004 300234', L: '000434',
  M: '0400123034', N: '04003430', O: '001030340400', P: '040020312202',
  Q: '0030340400 2234', R: '040020312202 1234', S: '300002323404', T: '0030 2024',
  U: '0004143430', V: '001430', W: '0004123430', X: '0034 3004',
  Y: '002230 2224', Z: '00300434',
};

export function noseNamePaths(value: string): Point[][] {
  const name = normalizeNoseName(value).toUpperCase();
  return [...name].flatMap((letter, index) =>
    LETTERS[letter].trim().split(' ').map((stroke) => {
      const points: Point[] = [];
      for (let i = 0; i < stroke.length; i += 2) {
        const point: Point = [index * 4.5 + Number(stroke[i]) - ((name.length - 1) * 4.5 + 3) / 2, Number(stroke[i + 1]) - 2];
        const last = points[points.length - 1];
        if (!last || point[0] !== last[0] || point[1] !== last[1]) points.push(point);
      }
      return points;
    }),
  );
}
