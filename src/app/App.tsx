import React, { useEffect, useRef, useState } from 'react';
import type { Gear, UIState } from './types';
import { stateFromURL } from './types';
import { SceneManager } from '../scene/SceneManager';
import { Toolbar } from './components/Toolbar';
import { ControlPanel } from './components/ControlPanel';

export const VERSION = 'v25';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const [state, setState] = useState<UIState>(() => stateFromURL(new URLSearchParams(location.search)));
  const [tris, setTris] = useState(0);

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;
    const mgr = new SceneManager(canvasRef.current);
    mgr.onStats = setTris;
    sceneRef.current = mgr;
  }, []);

  useEffect(() => { sceneRef.current?.setState(state); }, [state]);

  const patch = (p: Partial<UIState>) => setState((s) => ({ ...s, ...p }));
  const setColor = (key: keyof UIState['colors'], value: string) =>
    setState((s) => ({ ...s, colors: { ...s.colors, [key]: value } }));
  const setGear = (gear: Gear) => setState((s) => {
    // sensible default topsheet per gear (white board / blue skis)
    const colors = { ...s.colors };
    if (gear === 'skis' && colors.top === '#f2f2f0') colors.top = '#2f5d8a';
    if (gear === 'board' && colors.top === '#2f5d8a') colors.top = '#f2f2f0';
    return { ...s, gear, colors };
  });

  return (
    <>
      <canvas id="c" ref={canvasRef} />
      <Toolbar gear={state.gear} view={state.view} onGear={setGear} onView={(view) => patch({ view })} />
      <ControlPanel state={state} tris={tris} version={VERSION} onChange={patch} onColor={setColor} />
      <div id="hint">拖动旋转 · 滚轮缩放 · 右键平移</div>
    </>
  );
}
