// src/riderSpec.ts
var RIDER = {
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
  skiStance: 0.125
};
var SNOWBOARD_LENGTH = 1.6;
var SKI_LENGTH = 1.7;
export {
  RIDER,
  SKI_LENGTH,
  SNOWBOARD_LENGTH
};
