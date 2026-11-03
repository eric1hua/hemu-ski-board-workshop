import React from 'react';
import type { GradientSurface, Pattern, UIState } from '../types';
import { SPECS } from '../types';

import { NOSE_NAME_LIMIT, NOSE_STICKERS, normalizeNoseName, type NoseSticker } from '../../noseStickers';
import { BOARD_PATTERNS } from '../../boardPatterns';

const COLOR_ROWS: Array<[keyof UIState['colors'], string]> = [
  ['top', '板面颜色'], ['base', '板底颜色'], ['pat', '图案颜色'], ['pat2', '图案副色'], ['acc', '固定器点缀'],
];

export function ControlPanel(props: {
  state: UIState;
  tris: number;
  version: string;
  onChange: (patch: Partial<UIState>) => void;
  onTailColor: (surface: GradientSurface, value?: string) => void;
  onColor: (key: keyof UIState['colors'], value: string) => void;
}) {
  const s = props.state;
  const showStraps = s.gear === 'board' && s.view !== 'solo';
  return (
    <div id="panel">
      <h2>款式面板</h2>
      {COLOR_ROWS.map(([key, label]) => (
        <React.Fragment key={key}>
          <div className="row">
            <label htmlFor={`c-${key}`}>{label}{(key === 'top' || key === 'base') && s.tailColors[key] ? '（板头）' : ''}</label>
            <input type="color" id={`c-${key}`} value={s.colors[key]} onInput={(e) => props.onColor(key, e.currentTarget.value)} />
          </div>
          {(key === 'top' || key === 'base') && (
            <div className="row">
              <input type="checkbox" id={`gradient-${key}`} checked={!!s.tailColors[key]}
                onChange={(e) => props.onTailColor(key, e.target.checked ? '#2580d9' : undefined)} />
              <label htmlFor={`gradient-${key}`}>{key === 'top' ? '板面渐变' : '板底渐变'}</label>
              {s.tailColors[key] && (
                <input type="color" aria-label={key === 'top' ? '板面板尾颜色' : '板底板尾颜色'}
                  value={s.tailColors[key]} onInput={(e) => props.onTailColor(key, e.currentTarget.value)} />
              )}
            </div>
          )}
        </React.Fragment>
      ))}
      <div className="row">
        <label htmlFor="pattern">花纹图案</label>
        <select id="pattern" value={s.pattern} onChange={(e) => props.onChange({ pattern: e.target.value as Pattern })}>
          {BOARD_PATTERNS.map(([p, label]) => <option key={p} value={p}>{label}</option>)}
        </select>
      </div>
      {s.gear === 'board' && (
        <>
          <div className="row">
            <label htmlFor="nose-sticker">板头贴纸</label>
            <select id="nose-sticker" value={s.noseSticker}
              onChange={(e) => props.onChange({ noseSticker: e.target.value as NoseSticker, view: 'solo', showBase: false })}>
              {NOSE_STICKERS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          {s.noseSticker !== 'none' && (
            <>
            <div className="row">
              <label htmlFor="nose-name">贴纸署名</label>
              <input id="nose-name" type="text" value={s.noseName} maxLength={NOSE_NAME_LIMIT}
                size={11} placeholder="英文名" autoComplete="off" spellCheck={false}
                onChange={(e) => props.onChange({ noseName: normalizeNoseName(e.currentTarget.value), view: 'solo', showBase: false })} />
            </div>
            <div className="row">
              <label htmlFor="sticker-color">贴纸颜色</label>
              <input id="sticker-color" type="color" value={s.noseStickerColor}
                onInput={(e) => props.onChange({ noseStickerColor: e.currentTarget.value, view: 'solo', showBase: false })} />
            </div>
            </>
          )}
        </>
      )}
      <h3>审查选项</h3>
      {s.view === 'solo' && (
        <div className="row">
          <input type="checkbox" id="show-base" checked={s.showBase} onChange={(e) => props.onChange({ showBase: e.target.checked })} />
          <label htmlFor="show-base">查看板底</label>
        </div>
      )}
      <div className="row">
        <input type="checkbox" id="spin" checked={s.spin} onChange={(e) => props.onChange({ spin: e.target.checked })} />
        <label htmlFor="spin">自动旋转（360°）</label>
      </div>
      <div className="row">
        <input type="checkbox" id="boot" checked={s.boot} onChange={(e) => props.onChange({ boot: e.target.checked })} />
        <label htmlFor="boot">靴子占位</label>
      </div>
      {showStraps && (
        <div id="straprow">
          <div className="row">
            <input type="checkbox" id="ankle" checked={s.ankle} onChange={(e) => props.onChange({ ankle: e.target.checked })} />
            <label htmlFor="ankle">踝带 strap-ankle</label>
          </div>
          <div className="row">
            <input type="checkbox" id="toe" checked={s.toe} onChange={(e) => props.onChange({ toe: e.target.checked })} />
            <label htmlFor="toe">趾带 strap-toe</label>
          </div>
          <div className="row">
            <input type="checkbox" id="detach" checked={s.detach} onChange={(e) => props.onChange({ detach: e.target.checked })} />
            <label htmlFor="detach">拆开绑带（抬起分离）</label>
          </div>
        </div>
      )}
      <div id="spec">{SPECS[`${s.view}_${s.gear}`] || ''}</div>
      <div id="stat-inline">三角面 {props.tris.toLocaleString()} · 贴图 0 · Workshop {props.version}</div>
    </div>
  );
}
