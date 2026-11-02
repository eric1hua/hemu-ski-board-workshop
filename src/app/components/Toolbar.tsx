import React from 'react';
import type { Gear, View } from '../types';

const GEARS: Array<[Gear, string]> = [['board', '单板 Snowboard'], ['skis', '双板 Skis']];
const VIEWS: Array<[View, string]> = [['solo', '单独审查 360°'], ['binding', '固定器'], ['wear', '穿戴视图'], ['glide', '原地滑行']];

export function Toolbar(props: {
  gear: Gear; view: View;
  onGear: (g: Gear) => void; onView: (v: View) => void;
}) {
  return (
    <>
      <div className="bar" id="gearbar">
        {GEARS.map(([g, label]) => (
          <button key={g} className={props.gear === g ? 'on' : ''} onClick={() => props.onGear(g)}>{label}</button>
        ))}
      </div>
      <div className="bar" id="viewbar">
        {VIEWS.map(([v, label]) => (
          <button key={v} className={props.view === v ? 'on' : ''} onClick={() => props.onView(v)}>{label}</button>
        ))}
      </div>
    </>
  );
}
