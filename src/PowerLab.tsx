
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BookmarkPlus, Check,
  ChevronRight, Clock3, Eye, FlaskConical,
  RotateCcw, ShieldCheck, Sparkles,
  WandSparkles, X, Zap
} from "lucide-react";
import "./PowerLab.css";

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

type Palette = {
  id: string;
  name: string;
  style: string;
  bg: string;
  card: string;
  accent: string;
  headline: string;
  detail: string;
  circle: string;
};

type Capsule = {
  id: string;
  name: string;
  savedAt: string;
  project: Project;
};

type Issue = {
  id: string | null;
  title: string;
  detail: string;
  severity: "warn" | "tip";
};

const KEY = "vezkio:lab:capsules:v1";

const palettes: Palette[] = [
  {
    id: "nebula", name: "Nebula",
    style: "Dreamlike / premium",
    bg: "#e9e7f5", card: "#392a78",
    accent: "#f9b383", headline: "#ffffff",
    detail: "#f2eaff", circle: "#ee8ad6"
  },
  {
    id: "matcha", name: "Matcha Rush",
    style: "Fresh / playful",
    bg: "#e8efdc", card: "#143f36",
    accent: "#d6f27d", headline: "#ffffff",
    detail: "#e1ffd6", circle: "#a1dba1"
  },
  {
    id: "studio", name: "Paper Club",
    style: "Editorial / bold",
    bg: "#f6efe1", card: "#21232a",
    accent: "#fbbf24", headline: "#ffffff",
    detail: "#ebe7e1", circle: "#fd795c"
  },
  {
    id: "solar", name: "Solar Pop",
    style: "Optimistic / energetic",
    bg: "#fff0e0", card: "#a42b53",
    accent: "#ffc656", headline: "#ffffff",
    detail: "#ffe9d5", circle: "#e886a0"
  }
];

const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));

const cloneProject = (p: Project): Project => ({
  ...p,
  items: p.items.map(i => ({ ...i }))
});

// DESIGN DNA ENGINE
function remix(
  p: Project,
  palette: Palette,
  energy: number
): Project {
  let shapeNum = 0;

  const items = p.items.map((item, index) => {
    if (item.kind === "image") return { ...item };

    if (item.kind === "text") {
      const font = item.fontSize ?? 36;

      return {
        ...item,
        fill: font >= 48
          ? palette.headline
          : font >= 28
            ? palette.detail
            : palette.accent
      };
    }

    const first = shapeNum++ === 0;
    const isRect = item.kind === "rect";

    const float = !first && energy > 40
      ? Math.round((energy - 40) / 8 * Math.sin(index * 2.7))
      : 0;

    return {
      ...item,
      fill: first && isRect
        ? palette.card
        : item.kind === "circle"
          ? palette.circle
          : palette.accent,
      rotation: item.rotation + (first ? 0 : float)
    };
  });

  return { ...p, bg: palette.bg, items };
}

// READABILITY ENGINE
function hexRgb(input: string): [number, number, number] | null {
  const h = input.trim().replace(/^#/, "");
  if (!/^[\da-fA-F]{6}$/.test(h)) return null;

  return [0, 2, 4].map(k =>
    parseInt(h.slice(k, k + 2), 16)
  ) as [number, number, number];
}

function luminance(hex: string): number | null {
  const rgb = hexRgb(hex);
  if (!rgb) return null;

  const linear = rgb.map(n => {
    const v = n / 255;
    return v <= 0.04045
      ? v / 12.92
      : ((v + 0.055) / 1.055) ** 2.4;
  });

  return (
    0.2126 * linear[0] +
    0.7152 * linear[1] +
    0.0722 * linear[2]
  );
}

function contrast(a: string, b: string): number | null {
  const x = luminance(a);
  const y = luminance(b);

  return x === null || y === null
    ? null
    : (Math.max(x, y) + 0.05) /
      (Math.min(x, y) + 0.05);
}

function backgroundAt(
  p: Project,
  index: number,
  item: Item
): string {
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2;

  for (let j = index - 1; j >= 0; j--) {
    const q = p.items[j];

    if (
      q.kind === "rect" &&
      q.rotation === 0 &&
      cx >= q.x &&
      cy >= q.y &&
      cx <= q.x + q.w &&
      cy <= q.y + q.h
    ) {
      return q.fill;
    }
  }

  return p.bg;
}

function analyze(p: Project) {
  const issues: Issue[] = [];
  const texts = p.items.filter(i => i.kind === "text");

  const colors = new Set(
    p.items
      .filter(i => i.kind !== "image")
      .map(i => i.fill.toLowerCase())
  );

  let weak = 0;

  p.items.forEach((item, index) => {
    if (item.kind !== "text") return;

    const size = item.fontSize ?? 36;
    const ratio = contrast(
      item.fill,
      backgroundAt(p, index, item)
    );

    const target = size >= 40 ? 3 : 4.5;

    if (ratio !== null && ratio < target) {
      weak++;

      issues.push({
        id: item.id,
        severity: "warn",
        title: `Kontras rendah: ${item.name}`,
        detail: `${ratio.toFixed(1)}:1 pada perkiraan latar. Target ${target}:1.`
      });
    }

    if (size * 160 / p.width < 6.5) {
      issues.push({
        id: item.id,
        severity: "tip",
        title: "Sulit dibaca sebagai thumbnail",
        detail: `${item.name} mengecil pada preview 160px.`
      });
    }
  });

  if (!texts.length) {
    issues.push({
      id: null,
      severity: "tip",
      title: "Belum ada pesan utama",
      detail: "Tambahkan headline agar desain punya fokus."
    });
  }

  if (!texts.some(i => (i.fontSize ?? 0) >= 40)) {
    issues.push({
      id: null,
      severity: "tip",
      title: "Hierarki teks belum kuat",
      detail: "Pertimbangkan headline lebih besar."
    });
  }

  if (colors.size > 7) {
    issues.push({
      id: null,
      severity: "tip",
      title: "Warna agak ramai",
      detail: `Terdapat ${colors.size} warna elemen. Coba ringkas palet.`
    });
  }

  const score = clamp(
    100 - weak * 18 -
    issues.filter(i => i.severity === "tip").length * 7,
    0,
    100
  );

  return {
    issues,
    score,
    textCount: texts.length,
    paletteCount: colors.size
  };
}

// LIGHTWEIGHT LIVE PREVIEW
function Miniature({
  project,
  label
}: {
  project: Project;
  label?: string;
}) {
  return (
    <div className="lab-mini-wrap">
      <div
        className="lab-mini"
        style={{
          aspectRatio: `${project.width} / ${project.height}`,
          background: project.bg
        }}
      >
        {project.items.slice(0, 150).map(item => (
          <div
            key={item.id}
            className="lab-mini-item"
            style={{
              left: `${item.x / project.width * 100}%`,
              top: `${item.y / project.height * 100}%`,
              width: `${item.w / project.width * 100}%`,
              height: `${item.h / project.height * 100}%`,
              transform: `rotate(${item.rotation}deg)`,
              background:
                item.kind === "text" || item.kind === "image"
                  ? "transparent" : item.fill,
              borderRadius:
                item.kind === "circle" ? "50%"
                  : item.kind === "rect" ? "8%" : 0,
              color: item.fill,
              fontSize:
                `${(item.fontSize ?? 30) / project.width * 100}cqw`,
              lineHeight: 1.09,
              fontWeight: 750,
              whiteSpace: "pre-wrap",
              overflow: "hidden"
            }}
          >
            {item.kind === "text"
              ? item.text
              : item.kind === "image" && item.src
                ? <img src={item.src} alt="" />
                : null}
          </div>
        ))}
      </div>
      {label && <small>{label}</small>}
    </div>
  );
}

export default function PowerLab({
  open,
  onClose,
  project,
  onApply,
  onSelect
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  onApply: (p: Project) => void;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<
    "dna" | "lens" | "capsules"
  >("dna");

  const [energy, setEnergy] = useState(35);
  const [picked, setPicked] = useState(palettes[0].id);
  const [capsuleTitle, setCapsuleTitle] = useState("");
  const [notice, setNotice] = useState("");

  const [capsules, setCapsules] = useState<Capsule[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v.slice(0, 8) : [];
    } catch {
      return [];
    }
  });

  const palette =
    palettes.find(p => p.id === picked) ?? palettes[0];

  const preview = useMemo(
    () => remix(project, palette, energy),
    [project, palette, energy]
  );

  const audit = useMemo(
    () => analyze(project),
    [project]
  );

  useEffect(() => {
    if (!open) return;

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onClose]);

  const saveCapsule = () => {
    const entry: Capsule = {
      id: `${Date.now()}-${Math.random()}`,
      name:
        capsuleTitle.trim() ||
        `Snapshot ${capsules.length + 1}`,
      savedAt: new Date().toLocaleString("id-ID"),
      project: cloneProject(project)
    };

    const next = [entry, ...capsules].slice(0, 8);

    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setCapsules(next);
      setCapsuleTitle("");
      setNotice("Time Capsule tersimpan di perangkat ini.");
    } catch {
      setNotice(
        "Penyimpanan penuh. Ekspor JSON untuk backup."
      );
    }
  };

  const deleteCapsule = (id: string) => {
    const next = capsules.filter(c => c.id !== id);

    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setCapsules(next);
    } catch {
      setNotice("Gagal memperbarui penyimpanan.");
    }
  };

  const rescue = () => {
    let changed = 0;

    const items = project.items.map((item, index) => {
      if (item.kind !== "text") return { ...item };

      const bg = backgroundAt(project, index, item);
      const ratio = contrast(item.fill, bg);
      const size = item.fontSize ?? 36;
      const target = size >= 40 ? 3 : 4.5;

      const fill = ratio !== null && ratio < target
        ? (contrast("#ffffff", bg) ?? 0) >
          (contrast("#111827", bg) ?? 0)
            ? "#ffffff" : "#111827"
        : item.fill;

      const newSize = size < 18 ? 18 : size;

      if (fill !== item.fill || newSize !== size) {
        changed++;
      }

      return { ...item, fill, fontSize: newSize };
    });

    if (changed) {
      onApply({ ...project, items });
      setNotice(
        `${changed} teks diperbaiki. Undo tersedia.`
      );
    } else {
      setNotice(
        "Tidak ada perbaikan otomatis yang diperlukan."
      );
    }
  };

  if (!open) return null;

  return (
    <div
      className="lab-overlay"
      role="presentation"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="lab-panel"
        role="dialog"
        aria-modal="true"
        aria-label="VEZKIO experimental lab"
      >
        <header className="lab-header">
          <div className="lab-brand">
            <div className="lab-brand-icon">
              <FlaskConical size={22} />
            </div>

            <div>
              <small>EXPERIMENTAL CREATIVE ENGINE</small>
              <h2>VEZKIO <em>LAB</em></h2>
            </div>
          </div>

          <button
            className="lab-iconbtn"
            title="Close lab"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <nav className="lab-tabs">
          <button
            className={tab === "dna" ? "active" : ""}
            onClick={() => setTab("dna")}
          >
            <WandSparkles size={15} />
            Design DNA
          </button>

          <button
            className={tab === "lens" ? "active" : ""}
            onClick={() => setTab("lens")}
          >
            <Eye size={15} />
            Story Lens
          </button>

          <button
            className={tab === "capsules" ? "active" : ""}
            onClick={() => setTab("capsules")}
          >
            <Clock3 size={15} />
            Capsules
          </button>
        </nav>

        <div className="lab-scroll">
          {tab === "dna" && (
            <>
              <div className="lab-hero">
                <div className="lab-chip">
                  <Sparkles size={12} />
                  CREATIVE EXPERIMENT 01
                </div>

                <h3>
                  One design.
                  <br />
                  <span>Four personalities.</span>
                </h3>

                <p>
                  Ubah atmosfer seluruh desain tanpa
                  mengganti tulisan atau foto.
                  Pilih DNA visual, preview,
                  lalu terapkan.
                </p>
              </div>

              <div className="lab-subhead">
                <span>PILIH DESIGN DNA</span>
                <span>4 SIGNATURE STYLES</span>
              </div>

              <div className="lab-palette-grid">
                {palettes.map(p => (
                  <button
                    key={p.id}
                    className={`lab-palette ${
                      p.id === picked ? "selected" : ""
                    }`}
                    onClick={() => setPicked(p.id)}
                  >
                    <span
                      className="lab-palette-art"
                      style={{ background: p.bg }}
                    >
                      <i style={{ background: p.card }} />
                      <b style={{ background: p.circle }} />
                      <u style={{ background: p.accent }} />
                    </span>

                    <span className="lab-palette-meta">
                      <strong>{p.name}</strong>
                      <small>{p.style}</small>
                    </span>

                    {p.id === picked && (
                      <span className="lab-tick">
                        <Check size={13} />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="lab-control">
                <div>
                  <strong>Energy</strong>
                  <span>{energy}%</span>
                </div>

                <input
                  aria-label="Energy"
                  type="range"
                  min="0"
                  max="100"
                  value={energy}
                  onChange={e =>
                    setEnergy(+e.target.value)
                  }
                />

                <small>
                  Energy tinggi memberi sedikit rotasi
                  pada elemen dekoratif.
                </small>
              </div>

              <div className="lab-subhead">
                <span>LIVE PREVIEW</span>
                <span>
                  {project.width} × {project.height} px
                </span>
              </div>

              <div className="lab-preview">
                <Miniature
                  project={preview}
                  label={`${palette.name} • Visual DNA`}
                />

                <div className="lab-preview-notes">
                  <Zap size={16} />
                  <span>
                    Preview adalah perkiraan.
                    Gambar asli dan posisi teks dipertahankan.
                  </span>
                </div>
              </div>

              <button
                className="lab-cta"
                onClick={() => {
                  onApply(preview);
                  setNotice(
                    "Design DNA diterapkan — gunakan Undo jika perlu."
                  );
                }}
              >
                <WandSparkles size={17} />
                Terapkan Design DNA
                <ArrowRight size={17} />
              </button>
            </>
          )}

          {tab === "lens" && (
            <>
              <div className="lab-hero lens">
                <div className="lab-chip">
                  <Activity size={12} />
                  EXPERIMENT 02 / AUDIT
                </div>

                <h3>
                  Will they
                  <br />
                  <span>stop scrolling?</span>
                </h3>

                <p>
                  Simulasi tampilan desain saat diperkecil.
                  Analisis memakai aturan heuristik,
                  bukan AI atau pelacak mata sungguhan.
                </p>
              </div>

              <div className="lab-score">
                <div
                  className="lab-score-ring"
                  style={{
                    background: `conic-gradient(
                      #ad93ff ${audit.score}%,
                      #373349 0
                    )`
                  }}
                >
                  <div>
                    <b>{audit.score}</b>
                    <small>/ 100</small>
                  </div>
                </div>

                <div>
                  <strong>Readability signal</strong>
                  <span>
                    {audit.issues.length} catatan ·{" "}
                    {audit.textCount} teks ·{" "}
                    {audit.paletteCount} warna
                  </span>
                  <p>
                    Penilaian perkiraan untuk review awal,
                    bukan jaminan desain efektif.
                  </p>
                </div>
              </div>

              <div className="lab-subhead">
                <span>STORY LENS</span>
                <span>SIMULASI UKURAN</span>
              </div>

              <div className="lab-lenses">
                <div>
                  <Miniature
                    project={project}
                    label="Feed"
                  />
                </div>

                <div>
                  <Miniature
                    project={project}
                    label="Thumbnail"
                  />
                </div>

                <div>
                  <Miniature
                    project={project}
                    label="Tiny"
                  />
                </div>
              </div>

              <div className="lab-subhead">
                <span>DESIGN SIGNALS</span>
                <span>
                  {audit.issues.length} NOTES
                </span>
              </div>

              {audit.issues.length === 0 ? (
                <div className="lab-clean">
                  <ShieldCheck size={20} />
                  Tidak ada masalah terdeteksi
                  oleh pemeriksaan sederhana.
                </div>
              ) : (
                <div className="lab-issues">
                  {audit.issues.map((issue, k) => (
                    <button
                      key={k}
                      disabled={!issue.id}
                      onClick={() => {
                        if (issue.id) {
                          onSelect(issue.id);
                          onClose();
                        }
                      }}
                    >
                      <span
                        className={`lab-issue-dot ${
                          issue.severity
                        }`}
                      />

                      <span>
                        <b>{issue.title}</b>
                        <small>{issue.detail}</small>
                      </span>

                      {issue.id && (
                        <ChevronRight size={15} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                className="lab-cta"
                onClick={rescue}
              >
                <ShieldCheck size={17} />
                One-click Readability Rescue
                <ArrowRight size={17} />
              </button>

              <p className="lab-disclaimer">
                Kontras diestimasi dari kotak di bawah
                titik tengah teks. Belum mendeteksi
                gradien, transparansi, foto, rotasi,
                atau overlay kompleks.
              </p>
            </>
          )}

          {tab === "capsules" && (
            <>
              <div className="lab-hero capsule">
                <div className="lab-chip">
                  <Clock3 size={12} />
                  EXPERIMENT 03 / MEMORY
                </div>

                <h3>
                  Save a moment.
                  <br />
                  <span>Explore fearlessly.</span>
                </h3>

                <p>
                  Simpan versi kreatif sebelum bereksperimen.
                  Pulihkan kapan pun dan terus
                  kembangkan idemu.
                </p>
              </div>

              <div className="lab-capsule-create">
                <label htmlFor="capsuleName">
                  NAMA MOMEN
                </label>

                <input
                  id="capsuleName"
                  maxLength={45}
                  placeholder="Misal: Sebelum ganti warna"
                  value={capsuleTitle}
                  onChange={e =>
                    setCapsuleTitle(e.target.value)
                  }
                />

                <button
                  className="lab-cta"
                  onClick={saveCapsule}
                >
                  <BookmarkPlus size={17} />
                  Simpan Time Capsule
                  <ArrowRight size={17} />
                </button>
              </div>

              <div className="lab-subhead">
                <span>SAVED MOMENTS</span>
                <span>{capsules.length}/8</span>
              </div>

              {capsules.length === 0 ? (
                <div className="lab-nothing">
                  <Clock3 size={30} />
                  <strong>Belum ada Time Capsule</strong>
                  <span>
                    Simpan versi pertama desainmu di atas.
                  </span>
                </div>
              ) : (
                <div className="lab-capsules">
                  {capsules.map(c => (
                    <article key={c.id}>
                      <div className="lab-capsule-preview">
                        <Miniature project={c.project} />
                      </div>

                      <div className="lab-capsule-info">
                        <strong>{c.name}</strong>
                        <small>{c.savedAt}</small>

                        <div>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Pulihkan ${c.name}? Desain saat ini akan berubah dan bisa di-Undo.`
                                )
                              ) {
                                onApply(
                                  cloneProject(c.project)
                                );
                                setNotice(
                                  "Time Capsule dipulihkan."
                                );
                              }
                            }}
                          >
                            <RotateCcw size={13} />
                            Restore
                          </button>

                          <button
                            className="lab-remove"
                            title="Delete snapshot"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Hapus Time Capsule ini?"
                                )
                              ) {
                                deleteCapsule(c.id);
                              }
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <p className="lab-disclaimer">
                Snapshot disimpan dalam localStorage
                perangkat ini, bukan cloud.
                Maksimal delapan snapshot.
                Jika data browser dihapus atau
                kapasitas penuh, data bisa hilang.
                Gunakan Save project JSON
                sebagai backup.
              </p>
            </>
          )}
        </div>

        <footer className="lab-footer">
          <span>
            <span className="lab-status-dot" />
            OFFLINE-READY EXPERIMENTS
          </span>
          <span>LAB v0.2</span>
        </footer>

        {notice && (
          <div
            className="lab-toast"
            role="status"
            onClick={() => setNotice("")}
          >
            <Check size={15} />
            {notice}
            <X size={14} />
          </div>
        )}
      </section>
    </div>
  );
}
