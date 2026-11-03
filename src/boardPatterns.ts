export const BOARD_PATTERNS = [
  ['none', '纯色'],
  ['lengthStripes', '纵条纹'],
  ['alpenglow', '日照金山'],
  ['contours', '等高线'],
  ['slalom', '粉雪回转'],
  ['ridgeline', '山脊剪影'],
  ['fault', '冰川裂隙'],
  ['wind', '风刻雪纹'],
  ['tracks', '雪狐足迹'],
  ['crystal', '冰晶徽记'],
  ['comet', '彗星雪线'],
] as const;

export type WorkshopPattern = typeof BOARD_PATTERNS[number][0];
export type Band = (t: number) => [number, number] | null;
type Ink = { ink: 1 | 2; band: Band };

function ribbon(start: number, end: number, center: (u: number) => number, width: (u: number) => number): Band {
  return (t) => {
    if (t < start || t > end) return null;
    const u = (t - start) / (end - start);
    const x = center(u), w = width(u);
    return [x - w, x + w];
  };
}

function oval(x: number, t: number, width: number, height: number): Band {
  return ribbon(t - height, t + height, () => x, (u) => width * Math.sqrt(1 - (2 * u - 1) ** 2));
}

function facet(t0: number, t1: number, x0: number, x1: number, width: number): Band {
  return ribbon(t0, t1, (u) => x0 + (x1 - x0) * u, (u) => width * (1 - u));
}

export function designBands(pattern: string): Ink[] {
  switch (pattern) {
    case 'alpenglow':
      return [
        { ink: 1, band: oval(0, 0.23, 0.105, 0.062) },
        { ink: 2, band: facet(0.31, 0.365, 0.015, -0.02, 0.12) },
        { ink: 2, band: facet(0.325, 0.39, 0.03, -0.015, 0.08) },
        { ink: 2, band: facet(0.35, 0.41, 0.05, 0.005, 0.042) },
      ];
    case 'contours':
      return [1, 0.78, 0.56, 0.34].flatMap((scale, i) =>
        [-1, 1].map((side): Ink => ({
          ink: i % 2 === 0 ? 1 : 2,
          band: ribbon(0.49 - 0.32 * scale, 0.49 + 0.32 * scale,
            (u) => -0.07 + 0.10 * Math.sin(Math.PI * u) + side * 0.13 * scale * Math.sin(Math.PI * u),
            (u) => 0.006 * Math.sin(Math.PI * u)),
        })),
      );
    case 'slalom':
      return [
        { ink: 1, band: ribbon(0.10, 0.93, (u) => 0.115 * Math.sin(3.5 * Math.PI * u), (u) => 0.036 * Math.sin(Math.PI * u)) },
        { ink: 2, band: ribbon(0.13, 0.89, (u) => 0.11 * Math.sin(3.25 * Math.PI * u) - 0.057, (u) => 0.007 * Math.sin(Math.PI * u)) },
      ];
    case 'ridgeline':
      return [
        { ink: 1, band: facet(0.19, 0.57, -0.145, 0.175, 0.038) },
        { ink: 1, band: facet(0.31, 0.72, -0.16, 0.155, 0.058) },
        { ink: 2, band: facet(0.49, 0.78, -0.15, 0.12, 0.037) },
        { ink: 2, band: facet(0.62, 0.92, -0.14, 0.10, 0.025) },
      ];
    case 'fault':
      return [
        { ink: 1, band: ribbon(0.10, 0.92, (u) => u < 0.45 ? -0.14 + 0.58 * u : 0.121 - 0.36 * (u - 0.45), (u) => 0.038 * Math.sin(Math.PI * u)) },
        { ink: 2, band: facet(0.44, 0.69, 0.108, 0.175, 0.012) },
        { ink: 2, band: facet(0.34, 0.48, -0.13, 0.06, 0.018) },
        { ink: 2, band: facet(0.66, 0.86, 0.04, 0.15, 0.013) },
      ];
    case 'wind':
      return Array.from({ length: 6 }, (_, i): Ink => ({
        ink: i % 3 === 0 ? 2 : 1,
        band: ribbon(0.16 + i * 0.08, 0.48 + i * 0.08,
          (u) => -0.15 + 0.30 * u, (u) => 0.017 * Math.sin(Math.PI * u) ** 2),
      }));
    case 'tracks':
      return Array.from({ length: 5 }, (_, i) => {
        const x = (i % 2 ? 1 : -1) * 0.062, t = 0.19 + i * 0.146;
        return [
          { ink: 1 as const, band: oval(x, t + 0.018, 0.037, 0.020) },
          { ink: 2 as const, band: oval(x - 0.034, t - 0.011, 0.013, 0.011) },
          { ink: 2 as const, band: oval(x, t - 0.019, 0.014, 0.011) },
          { ink: 2 as const, band: oval(x + 0.034, t - 0.011, 0.013, 0.011) },
        ];
      }).flat();
    case 'crystal':
      return [
        { ink: 1, band: ribbon(0.13, 0.43, () => 0, (u) => 0.105 * (1 - Math.abs(2 * u - 1))) },
        { ink: 2, band: ribbon(0.18, 0.38, () => 0.008, (u) => 0.041 * (1 - Math.abs(2 * u - 1))) },
        ...[0.51, 0.62, 0.73].map((t, i): Ink => ({
          ink: i === 1 ? 2 : 1,
          band: ribbon(t - 0.03, t + 0.03, () => 0, (u) => 0.033 * (1 - Math.abs(2 * u - 1))),
        })),
      ];
    case 'comet':
      return [
        { ink: 1, band: oval(-0.065, 0.22, 0.060, 0.042) },
        { ink: 1, band: ribbon(0.23, 0.89, (u) => -0.065 + 0.22 * Math.sin(u * 2.3), (u) => 0.050 * (1 - u) ** 2) },
        { ink: 2, band: ribbon(0.32, 0.94, (u) => -0.08 + 0.19 * Math.sin(u * 2.4), (u) => 0.013 * (1 - u)) },
      ];
    default:
      return [];
  }
}
