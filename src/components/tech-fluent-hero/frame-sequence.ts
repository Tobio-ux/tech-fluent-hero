/**
 * Draws the spinning-chair frames on a <canvas>, reading them from a few
 * sprite sheets (transparent WebP). Each sheet holds cols × rows frames, left
 * to right, top to bottom:
 *
 *   sheets/lg-0.webp = frames 0–19, lg-1 = 20–39, lg-2 = 40–59, lg-3 = 60–78
 *   (sm-0 … sm-3: the same frames, smaller)
 *
 *   const seq = createFrameSequence(canvas, SHEETS, { lastFrame: 78 });
 *   seq.show(42);    // draws frame 42 (or the nearest frame whose sheet has loaded)
 *   seq.destroy();   // stops drawing and observing (call on unmount)
 *
 * The sheet with the first frame loads first; until a sheet arrives, the
 * nearest loaded frame is shown instead.
 */

export type SheetManifest = {
  /** URL folder that holds the sheets, e.g. "/tech-fluent-hero/sheets". */
  base: string;
  /** Number of frames across all sheets (frames 0 … count-1). */
  count: number;
  cols: number;
  rows: number;
  /** Size of one frame in each set. */
  sets: { lg: { width: number; height: number }; sm: { width: number; height: number } };
};

export type FrameSequence = {
  readonly last: number;
  readonly set: "lg" | "sm";
  show(frame: number): void;
  destroy(): void;
};

type Options = {
  lastFrame?: number;
  onProgress?: (loadedSheets: number, totalSheets: number) => void;
};

export function createFrameSequence(
  canvas: HTMLCanvasElement,
  M: SheetManifest,
  opts: Options = {},
): FrameSequence {
  const ctx = canvas.getContext("2d");
  const LAST = Math.max(0, Math.min(M.count - 1, opts.lastFrame ?? M.count - 1));
  const PER = M.cols * M.rows;
  const SHEETS = Math.floor(LAST / PER) + 1; // sheets after the last frame aren't loaded
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Small frames on Save-Data or when the canvas is small, large ones otherwise.
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const saveData = Boolean(connection?.saveData);
  const neededWidth = canvas.getBoundingClientRect().width * dpr;
  const set: "lg" | "sm" = saveData || neededWidth <= M.sets.sm.width * 1.1 ? "sm" : "lg";

  const sheets: (HTMLImageElement | undefined)[] = new Array(SHEETS);
  let current = 0;
  let drawnKey = "";
  let destroyed = false;
  let loaded = 0;

  // Load the first sheet before the others so the opening frame shows quickly.
  const loadSheet = (s: number) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      if (s === 0) (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
      img.onload = () => {
        if (!destroyed) {
          sheets[s] = img;
          loaded += 1;
          opts.onProgress?.(loaded, SHEETS);
          draw();
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = `${M.base}/${set}-${s}.webp`;
    });
  void loadSheet(0).then(() => {
    for (let s = 1; s < SHEETS && !destroyed; s += 1) void loadSheet(s);
  });

  const sheetOf = (i: number) => Math.floor(i / PER);

  /** Nearest frame to i whose sheet has loaded, or -1. */
  function nearestLoaded(i: number) {
    if (sheets[sheetOf(i)]) return i;
    for (let d = 1; d <= LAST; d += 1) {
      if (i - d >= 0 && sheets[sheetOf(i - d)]) return i - d;
      if (i + d <= LAST && sheets[sheetOf(i + d)]) return i + d;
    }
    return -1;
  }

  function draw(force = false) {
    if (!ctx || destroyed) return;
    const f = nearestLoaded(current);
    if (f < 0) return;
    const key = `${f}`;
    if (key === drawnKey && !force) return;
    const img = sheets[sheetOf(f)] as HTMLImageElement;
    const cell = f % PER;
    const w = img.naturalWidth / M.cols;
    const h = img.naturalHeight / M.rows;
    const sx = (cell % M.cols) * w;
    const sy = Math.floor(cell / M.cols) * h;
    drawnKey = key;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, w, h, 0, 0, canvas.width, canvas.height);
  }

  function fit() {
    if (!ctx || destroyed) return;
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingQuality = "high";
    draw(true);
  }

  const ro = new ResizeObserver(fit);
  ro.observe(canvas);
  fit();

  return {
    last: LAST,
    set,
    show(frame: number) {
      current = Math.max(0, Math.min(LAST, Math.round(frame)));
      draw();
    },
    destroy() {
      destroyed = true;
      ro.disconnect();
      sheets.length = 0;
      drawnKey = "";
    },
  };
}
