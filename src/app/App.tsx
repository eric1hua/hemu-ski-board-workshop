import React, { useEffect, useRef, useState } from 'react';
import type { Gear, GradientSurface, UIState } from './types';
import { DEFAULT_STATE, stateFromURL } from './types';
import { MAX_DESIGN_BYTES, parseGearDesign, serializeGearDesign, type GearStyle } from '../gearDesign';
import { SceneManager } from '../scene/SceneManager';
import { Toolbar } from './components/Toolbar';
import { ControlPanel } from './components/ControlPanel';

export const VERSION = 'v35';

type Preview = Omit<UIState, keyof GearStyle>;

function initialWorkshop() {
  const { view, spin, boot, showBase, ankle, toe, detach, ...style } =
    stateFromURL(new URLSearchParams(location.search));
  const designs: Record<Gear, GearStyle> = {
    board: { ...DEFAULT_STATE, gear: 'board' },
    skis: {
      ...DEFAULT_STATE,
      gear: 'skis',
      colors: { ...DEFAULT_STATE.colors, top: '#2f5d8a', pat2: '#f2a7b9' },
    },
  };
  designs[style.gear] = style;
  return {
    gear: style.gear, designs, linked: false,
    preview: { view, spin, boot, showBase, ankle, toe, detach } as Preview,
  };
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const [workshop, setWorkshop] = useState(initialWorkshop);
  const { gear, designs, linked, preview } = workshop;
  const style = designs[gear];
  const [tris, setTris] = useState(0);
  const [fileStatus, setFileStatus] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;
    const mgr = new SceneManager(canvasRef.current);
    mgr.onStats = setTris;
    sceneRef.current = mgr;
  }, []);

  useEffect(() => { sceneRef.current?.setState({ ...style, ...preview }); }, [style, preview]);

  const patchPreview = (patch: Partial<Preview>) =>
    setWorkshop((s) => ({ ...s, preview: { ...s.preview, ...patch } }));

  const editStyle = (edit: (style: GearStyle) => GearStyle, nextPreview: Partial<Preview> = {}, shared = false) =>
    setWorkshop((s) => {
      const other = s.gear === 'board' ? 'skis' : 'board';
      const designs = { ...s.designs, [s.gear]: edit(s.designs[s.gear]) };
      if (shared && s.linked) designs[other] = edit(s.designs[other]);
      return { ...s, designs, preview: { ...s.preview, ...nextPreview } };
    });

  const setColor = (key: keyof GearStyle['colors'], value: string) =>
    editStyle(
      (style) => ({ ...style, colors: { ...style.colors, [key]: value } }),
      key === 'base' ? { view: 'solo', showBase: true } : key === 'top' && style.tailColors.top ? { showBase: false } : {},
      true,
    );

  const setTailColor = (surface: GradientSurface, value?: string) =>
    editStyle(
      (style) => ({ ...style, tailColors: { ...style.tailColors, [surface]: value } }),
      { view: 'solo', showBase: surface === 'base' },
      true,
    );

  const saveDesign = () => {
    const data = serializeGearDesign(style);
    try {
      parseGearDesign(data);
    } catch {
      setFileStatus('配色数据无效，请重新选择颜色。');
      return;
    }
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const download = document.createElement('a');
    download.href = url;
    download.download = `hemu-ski-${gear}.json`;
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFileStatus('已发起下载。可在游戏的 Outfit & gear 中导入。');
  };

  const loadDesign = async (file: File) => {
    try {
      if (file.size > MAX_DESIGN_BYTES) throw new Error('File too large.');
      const style = parseGearDesign(await file.text());
      setWorkshop((s) => ({
        ...s,
        gear: style.gear,
        designs: { ...s.designs, [style.gear]: style },
        preview: { ...s.preview, view: 'solo', showBase: false },
      }));
      setFileStatus('已打开定制方案。');
    } catch {
      setFileStatus('无法打开这份 Hemu Ski 定制文件。');
    }
  };

  return (
    <>
      <canvas id="c" ref={canvasRef} />
      <Toolbar gear={gear} view={preview.view}
        onGear={(gear) => setWorkshop((s) => ({ ...s, gear }))}
        onView={(view) => patchPreview({ view, showBase: false })} />
      <ControlPanel state={{ ...style, ...preview }} tris={tris} version={VERSION}
        linked={linked} onLinkedChange={(linked) => setWorkshop((s) => ({ ...s, linked }))}
        onChange={patchPreview}
        onStyleChange={(patch, nextPreview) => editStyle((style) => ({ ...style, ...patch }), nextPreview)}
        onColor={setColor} onTailColor={setTailColor}>
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
