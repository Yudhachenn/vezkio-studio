
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clapperboard, Play, Pause, RotateCcw, Download,
  Sparkles, Film, Smartphone, Monitor, Square,
  ShieldCheck, WandSparkles, X, CheckCircle2
} from "lucide-react";
import "./MotionStudio.css";

type Item = {
  id: string;
  kind: "rect" | "circle" | "text" | "image";
  name: string;
  x: number; y: number; w: number; h: number;
  fill: string; rotation: number;
  text?: string; fontSize?: number; src?: string;
};

type Project = {
  name: string;
  width: number;
  height: number;
  bg: string;
  items: Item[];
};

type Motion = "rise" | "pop" | "slide" | "spin" | "fade" | "none";
type Format = "original" | "vertical" | "landscape" | "square";
type Overrides = Record<string, Motion>;
type Delays = Record<string, number>;

const motions: { id: Motion; name: string; sub: string }[] = [
  { id: "rise", name: "Rise", sub: "Smooth entrance" },
  { id: "pop", name: "Pop", sub: "Spring feeling" },
  { id: "slide", name: "Slide", sub: "Side reveal" },
  { id: "spin", name: "Spin", sub: "Soft rotation" },
  { id: "fade", name: "Fade", sub: "Minimal" },
  { id: "none", name: "Static", sub: "No entrance" }
];

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const ease = (v: number) =>
  1 - Math.pow(1 - clamp(v, 0, 1), 3);

// FORMAT MORPH ENGINE
function reframe(project: Project, format: Format): Project {
  if (format === "original") return project;

  const sizes = {
    vertical: [1080, 1920],
    landscape: [1920, 1080],
    square: [1080, 1080]
  };

  const [width, height] = sizes[format];

  if (project.width === width && project.height === height) {
    return project;
  }

  const sx = width / project.width;
  const sy = height / project.height;
  const fontScale = Math.min(sx, sy);

  return {
    ...project,
    width,
    height,
    items: project.items.map(item => ({
      ...item,
      x: Math.round(item.x * sx),
      y: Math.round(item.y * sy),
      w: Math.max(1, Math.round(item.w * sx)),
      h: Math.max(1, Math.round(item.h * sy)),
      fontSize: item.fontSize === undefined
        ? undefined
        : Math.round(item.fontSize * fontScale)
    }))
  };
}

// CANVAS TEXT RENDERER
function drawText(ctx: CanvasRenderingContext2D, item: Item) {
  const font = item.fontSize ?? 40;

  ctx.font = `bold ${font}px Arial, sans-serif`;
  ctx.fillStyle = item.fill;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const lineHeight = font * 1.13;
  let y = 0;

  for (const paragraph of (item.text ?? "").split("\n")) {
    let line = "";

    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;

      if (line && ctx.measureText(candidate).width > item.w) {
        ctx.fillText(line, 0, y);
        y += lineHeight;
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) ctx.fillText(line, 0, y);
    y += lineHeight;

    if (y > item.h) break;
  }
}

// MOTION RENDER ENGINE
function drawScene(
  canvas: HTMLCanvasElement,
  project: Project,
  t: number,
  duration: number,
  motion: Motion,
  overrides: Overrides,
  delays: Delays,
  stagger: number,
  entrance: number,
  images: Map<string, HTMLImageElement>,
  guides: boolean
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(
    canvas.width / project.width,
    canvas.height / project.height
  );

  ctx.fillStyle = project.bg;
  ctx.fillRect(0, 0, project.width, project.height);

  project.items.forEach((item, index) => {
    const chosen = overrides[item.id] ?? motion;

    const delay = delays[item.id] ??
      Math.min(duration - 0.1, index * stagger);

    const progress = chosen === "none"
      ? 1
      : ease((t - delay) / entrance);

    if (progress <= 0) return;

    const missing = 1 - progress;

    let tx = 0;
    let ty = 0;
    let scale = 1;
    let rotate = 0;
    let alpha = progress;

    if (chosen === "rise") ty = missing * 52;
    if (chosen === "slide") tx = missing * -110;
    if (chosen === "pop") scale = 0.65 + 0.35 * progress;
    if (chosen === "spin") rotate = missing * -22;
    if (chosen === "none") alpha = 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.translate(
      item.x + item.w / 2 + tx,
      item.y + item.h / 2 + ty
    );

    ctx.rotate((item.rotation + rotate) * Math.PI / 180);
    ctx.scale(scale, scale);
    ctx.translate(-item.w / 2, -item.h / 2);

    if (item.kind === "rect") {
      ctx.fillStyle = item.fill;
      ctx.beginPath();
      ctx.roundRect(
        0, 0, item.w, item.h,
        Math.min(18, item.w / 6, item.h / 6)
      );
      ctx.fill();
    } else if (item.kind === "circle") {
      ctx.fillStyle = item.fill;
      ctx.beginPath();
      ctx.ellipse(
        item.w / 2, item.h / 2,
        item.w / 2, item.h / 2,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    } else if (item.kind === "image") {
      const image = item.src
        ? images.get(item.src)
        : undefined;

      if (image?.complete && image.naturalWidth) {
        ctx.drawImage(image, 0, 0, item.w, item.h);
      }
    } else {
      ctx.beginPath();
      ctx.rect(0, 0, item.w, item.h);
      ctx.clip();
      drawText(ctx, item);
    }

    ctx.restore();
  });

  // Preview guides never appear in exported video.
  if (guides && project.height > project.width) {
    const h = project.height;
    const w = project.width;

    ctx.fillStyle = "rgba(255,60,130,.16)";
    ctx.fillRect(0, 0, w, h * 0.13);
    ctx.fillRect(0, h * 0.80, w, h * 0.20);
    ctx.fillRect(w * 0.88, 0, w * 0.12, h);

    ctx.setLineDash([12, 9]);
    ctx.lineWidth = Math.max(2, w / 450);
    ctx.strokeStyle = "rgba(255,130,170,.85)";
    ctx.strokeRect(
      w * 0.05,
      h * 0.13,
      w * 0.83,
      h * 0.67
    );
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export default function MotionStudio({
  open, onClose, project, onApply
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  onApply: (project: Project) => void;
}) {
  const [format, setFormat] = useState<Format>("original");
  const [motion, setMotion] = useState<Motion>("rise");
  const [overrides, setOverrides] = useState<Overrides>({});
  const [delays, setDelays] = useState<Delays>({});

  const [stagger, setStagger] = useState(0.16);
  const [entrance, setEntrance] = useState(0.8);
  const [duration, setDuration] = useState(5);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [safe, setSafe] = useState(false);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordingRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recFrameRef = useRef<number | null>(null);
  const timelineRef = useRef(0);
  const startRef = useRef(0);

  const images = useRef(new Map<string, HTMLImageElement>());
  const [imageRevision, setImageRevision] = useState(0);

  const composition = useMemo(
    () => reframe(project, format),
    [project, format]
  );

  useEffect(() => {
    if (!open) return;

    for (const item of composition.items) {
      if (!item.src || images.current.has(item.src)) continue;

      const img = new Image();
      images.current.set(item.src, img);

      img.onload = () => setImageRevision(n => n + 1);
      img.src = item.src;
    }
  }, [composition, open]);

  // Preview runs outside React's render loop.
  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = Math.min(
      1,
      720 / Math.max(composition.width, composition.height)
    );

    const width = Math.max(
      1, Math.round(composition.width * scale)
    );

    const height = Math.max(
      1, Math.round(composition.height * scale)
    );

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    if (!playing) {
      drawScene(
        canvas, composition, timelineRef.current,
        duration, motion, overrides, delays,
        stagger, entrance, images.current, safe
      );
      return;
    }

    startRef.current =
      performance.now() - timelineRef.current * 1000;

    let frame = 0;
    let lastUpdate = 0;

    const tick = (now: number) => {
      const t = ((now - startRef.current) / 1000) % duration;

      timelineRef.current = t;

      drawScene(
        canvas, composition, t, duration,
        motion, overrides, delays, stagger,
        entrance, images.current, safe
      );

      if (now - lastUpdate > 100) {
        setTime(t);
        lastUpdate = now;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [
    open, playing, composition, duration, motion,
    overrides, delays, stagger, entrance, safe,
    imageRevision
  ]);

  useEffect(() => {
    if (!open || playing) return;

    const canvas = canvasRef.current;

    if (canvas) {
      drawScene(
        canvas, composition, timelineRef.current,
        duration, motion, overrides, delays,
        stagger, entrance, images.current, safe
      );
    }
  }, [
    time, open, playing, composition, duration,
    motion, overrides, delays, stagger,
    entrance, safe, imageRevision
  ]);

  useEffect(() => () => {
    if (recFrameRef.current !== null) {
      cancelAnimationFrame(recFrameRef.current);
    }

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  const jump = (v: number) => {
    setPlaying(false);
    timelineRef.current = v;
    setTime(v);
  };

  const resetTimeline = () => {
    jump(0);
    setOverrides({});
    setDelays({});
    setMotion("rise");
    setStagger(0.16);
    setEntrance(0.8);
  };

  const saveFrame = () => {
    const canvas = document.createElement("canvas");

    canvas.width = composition.width;
    canvas.height = composition.height;

    drawScene(
      canvas, composition, timelineRef.current,
      duration, motion, overrides, delays,
      stagger, entrance, images.current, false
    );

    const link = document.createElement("a");
    link.download = `${project.name || "VEZKIO"}-frame.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    setStatus("PNG frame dibuat. Periksa folder Downloads.");
  };

  const recordWebm = () => {
    if (recordingRef.current) return;

    if (
      typeof MediaRecorder === "undefined" ||
      typeof HTMLCanvasElement.prototype.captureStream !== "function"
    ) {
      setStatus(
        "Perekaman tidak didukung di runtime ini. Coba versi web Chrome/Edge."
      );
      return;
    }

    const mime = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
    ].find(type => MediaRecorder.isTypeSupported(type));

    if (!mime) {
      setStatus(
        "WebM tidak didukung di runtime ini. Coba versi web Chrome/Edge."
      );
      return;
    }

    setPlaying(false);

    const canvas = document.createElement("canvas");
    canvas.width = composition.width;
    canvas.height = composition.height;

    const stream = canvas.captureStream(30);
    const chunks: BlobPart[] = [];

    let recorder: MediaRecorder;

    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 4_000_000
      });
    } catch {
      stream.getTracks().forEach(track => track.stop());
      setStatus("Encoder video tidak bisa dijalankan di perangkat ini.");
      return;
    }

    recorderRef.current = recorder;
    recordingRef.current = true;

    setRecording(true);
    setStatus(
      "Sedang merekam secara real-time; biarkan jendela tetap aktif."
    );

    recorder.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data);
    };

    recorder.onerror = () => {
      setStatus("Terjadi kesalahan saat merekam video.");
    };

    recorder.onstop = () => {
      if (recFrameRef.current !== null) {
        cancelAnimationFrame(recFrameRef.current);
      }

      stream.getTracks().forEach(track => track.stop());
      recordingRef.current = false;
      recorderRef.current = null;
      setRecording(false);

      const blob = new Blob(chunks, {
        type: recorder.mimeType || mime
      });

      if (!blob.size) {
        setStatus("Tidak ada frame video yang berhasil direkam.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${project.name || "VEZKIO"}-motion.webm`;

      document.body.append(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 15000);
      setStatus("WebM selesai dibuat. Periksa folder Downloads.");
    };

    drawScene(
      canvas, composition, 0, duration,
      motion, overrides, delays, stagger,
      entrance, images.current, false
    );

    try {
      recorder.start(100);
    } catch {
      stream.getTracks().forEach(track => track.stop());
      recordingRef.current = false;
      setRecording(false);
      setStatus("MediaRecorder gagal memulai.");
      return;
    }

    const started = performance.now();

    const tick = (now: number) => {
      const t = Math.min(
        duration,
        (now - started) / 1000
      );

      drawScene(
        canvas, composition, t, duration,
        motion, overrides, delays, stagger,
        entrance, images.current, false
      );

      if (t >= duration) {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      } else {
        recFrameRef.current = requestAnimationFrame(tick);
      }
    };

    recFrameRef.current = requestAnimationFrame(tick);
  };

  if (!open) return null;

  return (
    <div className="motion-backdrop">
      <section
        className="motion-window"
        role="dialog"
        aria-modal="true"
        aria-label="VEZKIO Motion Studio"
      >
        <header className="motion-top">
          <div className="motion-brand">
            <span><Clapperboard size={23} /></span>
            <div>
              <small>VEZKIO / CREATIVE ENGINE</small>
              <h2>Motion DNA <em>Studio</em></h2>
            </div>
          </div>

          <button
            className="motion-icon"
            title="Close"
            disabled={recording}
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </header>

        <div className="motion-content">
          <aside className="motion-settings">
            <div className="motion-section-title">
              <WandSparkles size={17} /> MOTION PRESETS
            </div>

            <div className="motion-preset-grid">
              {motions.map(m => (
                <button
                  key={m.id}
                  className={motion === m.id ? "active" : ""}
                  onClick={() => {
                    setMotion(m.id);
                    setOverrides({});
                    jump(0);
                  }}
                >
                  <Sparkles size={16} />
                  <strong>{m.name}</strong>
                  <small>{m.sub}</small>
                </button>
              ))}
            </div>

            <div className="motion-section-title">
              <Film size={17} /> ANIMATION CONTROLS
            </div>

            <label className="motion-setting">
              Video duration <b>{duration}s</b>
              <input
                type="range" min="3" max="12" step="1"
                value={duration}
                onChange={e => {
                  setDuration(+e.target.value);
                  jump(0);
                }}
              />
            </label>

            <label className="motion-setting">
              Layer stagger <b>{stagger.toFixed(2)}s</b>
              <input
                type="range" min="0" max="0.5" step="0.02"
                value={stagger}
                onChange={e => setStagger(+e.target.value)}
              />
            </label>

            <label className="motion-setting">
              Entrance speed <b>{entrance.toFixed(1)}s</b>
              <input
                type="range" min="0.2" max="1.8" step="0.1"
                value={entrance}
                onChange={e => setEntrance(+e.target.value)}
              />
            </label>

            <button
              className="motion-secondary"
              onClick={resetTimeline}
            >
              <RotateCcw size={15} /> Reset motion
            </button>

            <div className="motion-section-title">
              <Smartphone size={17} /> FORMAT MORPH
            </div>

            <div className="motion-formats">
              {([
                ["original", "Original", <ShieldCheck size={16} />],
                ["vertical", "9:16", <Smartphone size={16} />],
                ["square", "1:1", <Square size={16} />],
                ["landscape", "16:9", <Monitor size={16} />]
              ] as const).map(([id, name, icon]) => (
                <button
                  key={id}
                  className={format === id ? "active" : ""}
                  onClick={() => {
                    setFormat(id);
                    jump(0);
                  }}
                >
                  {icon}{name}
                </button>
              ))}
            </div>

            <button
              className="motion-secondary"
              disabled={format === "original"}
              onClick={() => {
                onApply(composition);
                setFormat("original");
                setStatus(
                  "Ukuran desain diterapkan ke editor. Gunakan Undo bila perlu."
                );
              }}
            >
              <CheckCircle2 size={15} />
              Apply format to editor
            </button>

            <p className="motion-note">
              Format Morph memakai perhitungan posisi
              proporsional, bukan AI. Periksa ulang
              komposisi setelah diubah.
            </p>
          </aside>

          <main className="motion-stage-area">
            <div className="motion-stage-heading">
              <div>
                <b>LIVE STAGE</b>
                <span>
                  {composition.width} × {composition.height} · Canvas 2D
                </span>
              </div>

              <label>
                <input
                  type="checkbox"
                  checked={safe}
                  onChange={e => setSafe(e.target.checked)}
                />
                Safe zones
              </label>
            </div>

            <div className="motion-preview-shell">
              <canvas
                ref={canvasRef}
                className="motion-preview"
                aria-label="Animated design preview"
              />
            </div>

            <div className="motion-player">
              <button onClick={() => setPlaying(!playing)}>
                {playing
                  ? <Pause size={18} />
                  : <Play size={18} />}
              </button>

              <span>{time.toFixed(1)}s</span>

              <input
                type="range" min="0"
                max={duration} step="0.01"
                value={time}
                onChange={e => jump(+e.target.value)}
              />

              <span>{duration.toFixed(1)}s</span>
            </div>

            <div className="motion-section-title">
              <Film size={16} />
              LAYER TIMELINE
              <small>Drag starts · Choose movement</small>
            </div>

            <div className="motion-tracks">
              {composition.items.length === 0 && (
                <p>Tambahkan layer ke canvas terlebih dahulu.</p>
              )}

              {composition.items.map((i, idx) => (
                <div className="motion-track" key={i.id}>
                  <span title={i.name}>{i.name}</span>

                  <select
                    aria-label={`Animation for ${i.name}`}
                    value={overrides[i.id] ?? "inherit"}
                    onChange={e => setOverrides(s =>
                      e.target.value === "inherit"
                        ? Object.fromEntries(
                            Object.entries(s).filter(
                              ([key]) => key !== i.id
                            )
                          )
                        : {
                            ...s,
                            [i.id]: e.target.value as Motion
                          }
                    )}
                  >
                    <option value="inherit">Auto</option>
                    {motions.map(m => (
                      <option value={m.id} key={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="range"
                    aria-label={`Start delay for ${i.name}`}
                    min="0"
                    max={Math.max(0.1, duration - 0.2)}
                    step="0.1"
                    value={
                      delays[i.id] ??
                      Math.min(duration - 0.1, idx * stagger)
                    }
                    onChange={e => {
                      setDelays(s => ({
                        ...s,
                        [i.id]: +e.target.value
                      }));
                      jump(0);
                    }}
                  />

                  <b>
                    {(
                      delays[i.id] ??
                      Math.min(duration - 0.1, idx * stagger)
                    ).toFixed(1)}s
                  </b>
                </div>
              ))}
            </div>

            <div className="motion-export">
              <button
                className="motion-secondary"
                onClick={saveFrame}
              >
                <Download size={16} />
                Export this frame · PNG
              </button>

              <button
                className="motion-primary"
                disabled={recording}
                onClick={recordWebm}
              >
                <Film size={17} />
                {recording ? "Recording…" : "Record video · WebM"}
              </button>
            </div>

            <p className="motion-message">
              {status ||
                "Offline · No API key · No subscription. Video recorded in real time at up to 30 FPS when supported."}
            </p>
          </main>
        </div>
      </section>
    </div>
  );
}
