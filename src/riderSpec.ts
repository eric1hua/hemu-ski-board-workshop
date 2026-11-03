// The game's rider, as measured from hemu-ski's own code (2026-11-03).
// Every asset in this workshop is sized from these numbers — not from
// real-world averages — so the gear fits the characters who will wear it.
//
// Sources (hemu-ski repo):
//   - src/player/rider-model.js: the two riders are sized alike by trunk
//     (Hips->Head = 0.591 m); whole-model heights incl. hat/ears land at
//     ~1.80 m (female, specced) and ~1.87 m (male, computed from his scale).
//   - src/player/rider.js (#buildCharacter): the chunky snowboard boot is a
//     0.17 x 0.16 x 0.33 m box with straps; stance (foot centres) ~0.52 m;
//     the classic binding sole plate is 0.18 x 0.35 m, highback 0.26 m.
//   - src/player/rider-skis.js: ski-boot sole runs ~0.17 m each way from the
//     binding centre (0.34 m sole); boot sole stands SKI.sole = 0.035 m above
//     the ski on the binding; feet are STANCE 0.125 m out from the middle.
//
// Sizing rules used (researched 2026-11-03, see README for sources):
//   - Snowboard: length ~= height x 0.88 (chin-to-nose rule); powder boards
//     size UP toward/above nose level. Riders ~1.75-1.85 -> 1.60 m powder
//     board, which is also the game's fixed rule: height - 0.10 at 1.70.
//   - Skis (all-mountain): beginner height - 12.5, intermediate - 2.5,
//     advanced + 5 (REI/evo offsets). For ~1.75 m riders the intermediate
//     band is 1.65-1.78 -> 1.70 m. (The in-game placeholder ski is 1.40 m,
//     far under chart; the workshop ski supersedes it.)

export const RIDER = {
  /** Hips->Head trunk length both riders share, m. */
  trunk: 0.591,
  /** Snowboard boot outer size, m: [width, height, length]. */
  boardBoot: { width: 0.17, height: 0.17, length: 0.33 },
  /** Snowboard stance: distance between foot centres, m. */
  boardStance: 0.52,
  /** Ski boot sole length, m (0.17 each way from binding centre). */
  skiBootSole: 0.34,
  /** Ski boot sole height above the ski (binding stack), m. */
  skiStack: 0.035,
  /** Each ski sits this far out from the body's middle, m. */
  skiStance: 0.125,
} as const;

/** Fixed snowboard length for the game, m. Anchored on the female rider
 *  (1.80 - 0.10), user decision 2026-11-03. */
export const SNOWBOARD_LENGTH = 1.7;
/** Fixed ski length for the game, m. */
export const SKI_LENGTH = 1.7;
