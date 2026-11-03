// Shared UI state for the workshop review page. React owns this state;
// SceneManager (three.js) consumes it. Keeping the shape in one place is
// what makes the page modular: components never touch three.js, the scene
// never touches the DOM.

export type Gear = 'board' | 'skis';
export type View = 'solo' | 'binding' | 'wear' | 'glide';
export type Pattern = 'none' | 'lengthStripes' | 'diagonal' | 'chevrons' | 'split' | 'blocks';

export interface UIState {
  gear: Gear;
  view: View;
  pattern: Pattern;
  colors: { top: string; base: string; pat: string; pat2: string; acc: string };
  spin: boolean;
  boot: boolean;
  ankle: boolean;
  toe: boolean;
  detach: boolean;
}

export const DEFAULT_STATE: UIState = {
  gear: 'board',
  view: 'solo',
  pattern: 'none',
  colors: { top: '#f2f2f0', base: '#d82f2a', pat: '#d82f2a', pat2: '#17171a', acc: '#c9ccd1' },
  spin: true,
  boot: false,
  ankle: true,
  toe: true,
  detach: false,
};

/** Initial state from URL params (shareable links + screenshot QA). */
export function stateFromURL(q: URLSearchParams): UIState {
  const s: UIState = { ...DEFAULT_STATE, colors: { ...DEFAULT_STATE.colors } };
  const gear = q.get('gear'); if (gear === 'board' || gear === 'skis') s.gear = gear;
  const view = q.get('view'); if (view === 'solo' || view === 'binding' || view === 'wear' || view === 'glide') s.view = view;
  const pat = q.get('pattern'); if (pat) s.pattern = pat as Pattern;
  const map: Record<string, keyof UIState['colors']> = { ctop: 'top', cbase: 'base', cpat: 'pat', cpat2: 'pat2', cacc: 'acc' };
  for (const [param, key] of Object.entries(map)) { const v = q.get(param); if (v) s.colors[key] = v; }
  if (q.get('spin') === '0') s.spin = false;
  if (q.get('boot') === '1') s.boot = true;
  if (q.get('detach') === '1') s.detach = true;
  return s;
}

export const SPECS: Record<string, string> = {
  solo_board: '燕尾粉雪单板\n长 1700 · 头 352 / 腰 293 / 尾 308 mm\n面板可换色/换图案，零贴图',
  solo_skis: '全山双板（一对）\n长 1700 · 132 / 105 / 118 mm · 站距 250',
  binding_board: '单板固定器（单只）\n适配游戏靴 170×330 · 内宽 190\n踝带/趾带独立可拆（右侧开关）',
  binding_skis: '双板固定器（单只）\n适配鞋底 340 · 站高 35 · 刹车宽 145',
  wear_board: '穿戴：hemu-ski 女性角色原模型 + 单板\n按游戏 1.80 身高 · IK 站上固定器\n站距 544 · 前 +15° / 后 −9°',
  wear_skis: '穿戴：人物 + 双板 + 固定器\n双脚平行 · 鞋头朝板头',
  glide_board: '原地滑行：单板压刃摇摆\n人物关节 + 整板滚转 + 地面速度线',
  glide_skis: '原地滑行：双板平行滑行\n膝踝弹簧 + 身体微摆 + 速度线',
};
