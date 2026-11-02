import React from 'react';
import type { Pattern, UIState } from '../types';
import { SPECS } from '../types';

const PATTERNS: Array<[Pattern, string]> = [
  ['none', '纯色'], ['lengthStripes', '纵条纹'], ['diagonal', '斜纹'],
  ['chevrons', '箭头纹'], ['split', '头尾分色'], ['blocks', '格纹'],
];
const COLOR_ROWS: Array<[keyof UIState['colors'], string]> = [
  ['top', '板面颜色'], ['base', '板底颜色'], ['pat', '图案颜色'], ['pat2', '图案副色'], ['acc', '固定器点缀'],
];

export function ControlPanel(props: {
  state: UIState;
  tris: number;
  version: string;
  onChange: (patch: Partial<UIState>) => void;
  onColor: (key: keyof UIState['colors'], value: string) => void;
}) {
  const s = props.state;
  const showStraps = s.gear === 'board' && s.view !== 'solo';
  return (
    <div id="panel">
      <h2>款式面板</h2>
      {COLOR_ROWS.map(([key, label]) => (
        <div className="row" key={key}>
          <label htmlFor={`c-${key}`}>{label}</label>
          <input type="color" id={`c-${key}`} value={s.colors[key]} onChange={(e) => props.onColor(key, e.target.value)} />
        </div>
      ))}
      <div className="row">
        <label htmlFor="pattern">花纹图案</label>
        <select id="pattern" value={s.pattern} onChange={(e) => props.onChange({ pattern: e.target.value as Pattern })}>
          {PATTERNS.map(([p, label]) => <option key={p} value={p}>{label}</option>)}
        </select>
      </div>
      <h3>审查选项</h3>
      <div className="row">
        <input type="checkbox" id="spin" checked={s.spin} onChange={(e) => props.onChange({ spin: e.target.checked })} />
        <label htmlFor="spin">自动旋转（360°）</label>
      </div>
      <div className="row">
        <input type="checkbox" id="boot" checked={s.boot} onChange={(e) => props.onChange({ boot: e.target.checked })} />
        <label htmlFor="boot">靴子占位（固定器视图）</label>
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
