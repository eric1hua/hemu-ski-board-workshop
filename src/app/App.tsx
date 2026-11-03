import React, { useEffect, useRef, useState } from 'react';
import type { Gear, GradientSurface, UIState } from './types';
import { stateFromURL } from './types';
import { MAX_DESIGN_BYTES, parseGearDesign, serializeGearDesign } from '../gearDesign';
import { SceneManager } from '../scene/SceneManager';
import { Toolbar } from './components/Toolbar';
import { ControlPanel } from './components/ControlPanel';

export const VERSION = 'v33';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const [state, setState] = useState<UIState>(() => stateFromURL(new URLSearchParams(location.search)));
  const [tris, setTris] = useState(0);
  const [fileStatus, setFileStatus] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;
    const mgr = new SceneManager(canvasRef.current);
    mgr.onStats = setTris;
    sceneRef.current = mgr;
  }, []);

  useEffect(() => { sceneRef.current?.setState(state); }, [state]);

  const patch = (p: Partial<UIState>) => setState((s) => ({ ...s, ...p }));
  const setColor = (key: keyof UIState['colors'], value: string) =>
    setState((s) => ({
      ...s,
      ...(key === 'base' ? { view: 'solo' as const, showBase: true } : {}),
      ...(key === 'top' && s.tailColors.top && s.showBase ? { showBase: false } : {}),
      colors: { ...s.colors, [key]: value },
    }));
  const setTailColor = (surface: GradientSurface, value?: string) =>
    setState((s) => ({
      ...s,
      view: 'solo',
      showBase: surface === 'base',
      tailColors: { ...s.tailColors, [surface]: value },
    }));
  const setGear = (gear: Gear) => setState((s) => {
    // sensible default topsheet per gear (white board / blue skis)
    const colors = { ...s.colors };
    if (gear === 'skis' && colors.top === '#f2f2f0') colors.top = '#2f5d8a';
    if (gear === 'board' && colors.top === '#2f5d8a') colors.top = '#f2f2f0';
    return { ...s, gear, colors };
  });

  const saveDesign = () => {
    const data = serializeGearDesign(state);
    try {
      parseGearDesign(data);
    } catch {
      setFileStatus('配色数据无效，请重新选择颜色。');
      return;
    }
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const download = document.createElement('a');
    download.href = url;
    download.download = `hemu-ski-${state.gear}.json`;
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFileStatus('已发起下载。可在游戏的 Outfit & gear 中导入。');
  };

  const loadDesign = async (file: File) => {
    try {
      if (file.size > MAX_DESIGN_BYTES) throw new Error('File too large.');
      const style = parseGearDesign(await file.text());
      patch({ ...style, view: 'solo', showBase: false });
      setFileStatus('已打开定制方案。');
    } catch {
      setFileStatus('无法打开这份 Hemu Ski 定制文件。');
    }
  };

  return (
    <>
      <canvas id="c" ref={canvasRef} />
      <Toolbar gear={state.gear} view={state.view} onGear={setGear} onView={(view) => patch({ view, showBase: false })} />
      <ControlPanel state={state} tris={tris} version={VERSION} onChange={patch} onColor={setColor} onTailColor={setTailColor}>
        <div className="row">
          <button type="button" onClick={saveDesign}>保存定制</button>
          <button type="button" onClick={() => fileInput.current?.click()}>打开定制</button>
          <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) void loadDesign(file);
          }} />
        </div>
        {fileStatus && <div role="status">{fileStatus}</div>}
      </ControlPanel>
      <div id="hint">拖动旋转 · 滚轮缩放 · 右键平移</div>
    </>
  );
}
