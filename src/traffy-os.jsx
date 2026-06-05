import { useState, useEffect, useRef, useCallback } from "react";

// ── STORAGE ────────────────────────────────────────────────────────────────
function useStore(key, init) {
  const [v, sv] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : (typeof init === "function" ? init() : init); }
    catch { return typeof init === "function" ? init() : init; }
  });
  const set = useCallback((val) => {
    const next = typeof val === "function" ? val(v) : val;
    sv(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [v]);
  return [v, set];
}

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = n => Math.round(n || 0);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── DEFAULT CONFIG (fully editable) ────────────────────────────────────────
const DEFAULT_CONFIG = {
  name: "User",
  weight: 81, height: 180, age: 25,
  startBF: 30, goalBF: 18,
  targetWeight: 70,
  targetCal: 1650, targetProtein: 160, targetCarbs: 130, targetFat: 55,
  bodyType: "Kapha",
  diet: "Vegetarian (fish ok, no eggs, no meat)",
  program: "PPL 11-Week Cut",
  startDate: "2025-05-05",
  weekSchedule: ["Push", "Pull", "Legs", "Cardio+Abs", "Push", "Pull", "Rest"],
  gutFoods: {
    green: ["Protein Milk", "Emmer Wheat Chapati", "Paneer", "Moong Dal", "Masoor Dal", "Low Fat Curd", "Spinach", "Brown Rice", "Banana", "Almonds"],
    yellow: ["Protein Soy Curd", "Whey Protein", "Chickpeas", "Tofu", "Regular Wheat Chapati", "Oats"],
    red: ["Rajma", "Maida", "Cold Food", "Late Night Eating"],
  },
  workoutPlan: {
    Push: [
      { name: "Incline DB Press", warmup: ["7.5kg×10", "10kg×5", "12.5kg×2"], sets: 4, working: "15kg × 7-8", backoff: "12.5kg × 10", progression: "Hit 3×10 → move to 17.5kg" },
      { name: "Machine Chest Press", warmup: ["1 light set"], sets: 4, working: "8-12 reps", progression: "Last set near failure → add weight at 4×12" },
      { name: "Shoulder Press", warmup: ["Light set"], sets: 4, working: "10kg each × 10", progression: "Move up when Set 1 hits 12 clean" },
      { name: "Lateral Raise", warmup: [], sets: 4, working: "5-7.5kg STRICT", note: "⚠️ No swinging. Ego lift = wasted set.", progression: "Only up when zero swing" },
      { name: "Tricep Pushdown", warmup: [], sets: 4, working: "10-15 reps", progression: "Add weight when all 4 sets hit 15" },
      { name: "Face Pull", warmup: [], sets: 3, working: "15-20 reps light", note: "Posture — never skip", progression: "Keep light, control over weight" },
    ],
    Pull: [
      { name: "Lat Pulldown", warmup: ["20kg×10", "25kg×5"], sets: 4, working: "35kg × 10", backoff: "30kg burnout", note: "⚠️ Don't rush 40kg. Pull from lats.", progression: "3×10 clean → try 37.5kg" },
      { name: "Cable Row", warmup: [], sets: 4, working: "40kg × 10", backoff: "Lighter burnout", progression: "All 3 sets hit 10 → add weight" },
      { name: "Face Pull", warmup: [], sets: 4, working: "12-15 reps", progression: "Control > weight always" },
      { name: "Hammer Curl", warmup: [], sets: 3, working: "10kg × 10", progression: "12.5kg ONLY when form is completely clean" },
      { name: "Bicep Curl", warmup: [], sets: 3, working: "10-12 reps", progression: "Standard — add weight at 12 clean" },
      { name: "Dead Hang", warmup: [], sets: 3, working: "30-60 seconds", note: "Posture + spine decompression", progression: "Add 5s each week" },
    ],
    Legs: [
      { name: "Leg Press", warmup: ["60kg×10", "80kg×5"], sets: 4, working: "100kg × 10", backoff: "80kg burnout", progression: "All 3 sets hit 10 → move to 110kg" },
      { name: "Romanian Deadlift", warmup: [], sets: 3, working: "10kg × 12", note: "Feel hamstring stretch. Controlled.", progression: "Form stable → 12.5kg" },
      { name: "Goblet Squat", warmup: [], sets: 3, working: "10-12 reps", progression: "Add weight when 12 feels easy" },
      { name: "Calf Raise", warmup: [], sets: 5, working: "15-20 reps full range", progression: "All 5 sets hit 20 → add weight" },
      { name: "Ab Wheel / Plank", warmup: [], sets: 3, working: "10 reps / 45s", progression: "Add reps or seconds weekly" },
    ],
    "Cardio+Abs": [
      { name: "Incline Walk", warmup: [], sets: 1, working: "45 min · 10-12% · 5.5-6 km/h", note: "Non-negotiable. Do even on rest days.", progression: "→ 14% when 12% feels easy" },
      { name: "Plank", warmup: [], sets: 3, working: "45 seconds", progression: "Add 5s each week" },
      { name: "Dead Bug", warmup: [], sets: 3, working: "10 each side", progression: "Add reps weekly" },
      { name: "Hollow Body Hold", warmup: [], sets: 3, working: "25 seconds", progression: "Add time weekly" },
      { name: "Wall Angels", warmup: [], sets: 2, working: "10 reps", note: "Posture — arms flat against wall throughout" },
    ],
    Rest: [],
  },
};

// ── FOOD PRESETS ────────────────────────────────────────────────────────────
const FOOD_DB = [
  { name: "Protein Milk (pack)", cal: 180, p: 25, c: 14, f: 3 },
  { name: "Emmer Wheat Chapati", cal: 80, p: 3, c: 15, f: 1 },
  { name: "Paneer (100g)", cal: 265, p: 18, c: 3, f: 20 },
  { name: "Moong Dal (1 cup)", cal: 150, p: 10, c: 24, f: 2 },
  { name: "Masoor Dal (1 cup)", cal: 230, p: 18, c: 40, f: 1 },
  { name: "Protein Soy Curd (150g)", cal: 110, p: 14, c: 6, f: 3 },
  { name: "Low Fat Curd (100g)", cal: 60, p: 4, c: 6, f: 2 },
  { name: "Rajma (1 cup)", cal: 225, p: 15, c: 40, f: 1 },
  { name: "Chickpeas (1 cup)", cal: 270, p: 15, c: 45, f: 4 },
  { name: "Paneer Bhurji (150g)", cal: 280, p: 22, c: 5, f: 19 },
  { name: "Whey Protein (1 scoop)", cal: 120, p: 25, c: 3, f: 2 },
  { name: "Oats (50g)", cal: 190, p: 7, c: 32, f: 4 },
  { name: "Brown Rice (1 cup)", cal: 215, p: 5, c: 45, f: 2 },
  { name: "Regular Wheat Chapati", cal: 80, p: 3, c: 16, f: 1 },
  { name: "Tofu (100g)", cal: 76, p: 8, c: 2, f: 4 },
  { name: "Spinach (1 cup)", cal: 23, p: 3, c: 4, f: 0 },
  { name: "Banana", cal: 105, p: 1, c: 27, f: 0 },
  { name: "Apple", cal: 95, p: 0, c: 25, f: 0 },
  { name: "Almonds (30g)", cal: 173, p: 6, c: 6, f: 15 },
  { name: "Moong Dal Chilla (1)", cal: 120, p: 7, c: 16, f: 3 },
];

// ── DESIGN ─────────────────────────────────────────────────────────────────
const T = {
  bg: "#070709", s1: "#0d0d10", s2: "#131318", border: "#1f2028",
  accent: "#7c6dfa", accentDim: "#4a3fa0", accentGlow: "#7c6dfa18",
  green: "#4ade98", red: "#f87171", blue: "#60a5fa", orange: "#fb923c",
  gold: "#fbbf24", text: "#e8e4f0", muted: "#4a4a5a", sub: "#8a8aa0",
  push: "#f87171", pull: "#60a5fa", legs: "#4ade98", cardio: "#fbbf24",
};

// ── UI PRIMITIVES ───────────────────────────────────────────────────────────
const Card = ({ children, style = {}, accent }) => (
  <div style={{ background: T.s1, border: `1px solid ${accent ? accent + "44" : T.border}`, borderRadius: 18, padding: 16, boxShadow: accent ? `0 0 24px ${accent}12` : "none", ...style }}>{children}</div>
);

const Lbl = ({ children, color }) => (
  <div style={{ fontFamily: "monospace", fontSize: "0.58rem", letterSpacing: "0.12em", color: color || T.muted, textTransform: "uppercase", marginBottom: 5 }}>{children}</div>
);

const Ring = ({ value, max, size = 68, stroke = 6, color, children }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = clamp(value / (max || 1), 0, 1);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
};

const Bar = ({ value, max, color, h = 5 }) => (
  <div style={{ height: h, background: T.border, borderRadius: h, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${clamp((value || 0) / (max || 1) * 100, 0, 100)}%`, background: color, borderRadius: h, transition: "width 0.5s" }} />
  </div>
);

const Inp = ({ style, ...props }) => (
  <input style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 12px", color: T.text, fontFamily: "monospace", fontSize: "0.8rem", outline: "none", width: "100%", ...style }} {...props} />
);

const Btn = ({ children, onClick, color, outline, style = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: "10px 16px", borderRadius: 11, border: `1px solid ${outline ? color : "transparent"}`, background: outline ? "transparent" : (color || T.accent), color: outline ? color : "#07070a", fontFamily: "monospace", fontWeight: 700, fontSize: "0.75rem", cursor: disabled ? "default" : "pointer", letterSpacing: "0.06em", opacity: disabled ? 0.5 : 1, ...style }}>{children}</button>
);

// ── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dash", icon: "⬡", label: "HOME" },
  { id: "diet", icon: "◉", label: "DIET" },
  { id: "gym", icon: "◆", label: "GYM" },
  { id: "body", icon: "◎", label: "BODY" },
  { id: "gut", icon: "◇", label: "GUT" },
  { id: "traffy", icon: "✦", label: "TRAFFY" },
];

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function Dashboard({ allData, config, setTab }) {
  const { diet, metrics, workout, gut, sleep: slp } = allData;
  const d = todayStr();
  const foods = diet[d] || [];
  const totals = foods.reduce((a, f) => ({ cal: a.cal + f.cal, p: a.p + f.p }), { cal: 0, p: 0 });
  const todayWorkout = workout[d];
  const todayGut = gut[d] || {};
  const todaySleep = slp[d] || {};
  const todayMetrics = metrics[d] || {};
  const dayIdx = (new Date().getDay() + 6) % 7;
  const scheduled = config.weekSchedule[dayIdx] || "Rest";
  const wCol = { Push: T.push, Pull: T.pull, Legs: T.legs, "Cardio+Abs": T.cardio }[scheduled] || T.muted;

  const last7 = [...Array(7)].map((_, i) => { const dt = new Date(); dt.setDate(dt.getDate() - i); return dt.toISOString().split("T")[0]; }).reverse();
  const gymDays = last7.filter(dt => workout[dt]).length;
  const proteinDays = last7.filter(dt => (diet[dt] || []).reduce((a, f) => a + f.p, 0) >= config.targetProtein * 0.85).length;
  const start = new Date(config.startDate);
  const weekNum = Math.min(11, Math.max(1, Math.ceil((new Date() - start) / (7 * 86400000))));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: T.muted, letterSpacing: "0.14em", marginBottom: 5 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }).toUpperCase()}
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", color: T.text, lineHeight: 1, letterSpacing: "0.04em" }}>
            WEEK <span style={{ color: T.accent }}>{weekNum}</span> / 11
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: T.muted, marginTop: 3 }}>{config.program}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Lbl>TODAY</Lbl>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: wCol }}>{scheduled}</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: todayWorkout ? T.green : T.muted, marginTop: 2 }}>{todayWorkout ? "✓ LOGGED" : "PENDING"}</div>
        </div>
      </div>

      {/* Macro rings */}
      <Card accent={T.accent} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Ring value={totals.cal} max={config.targetCal} size={74} stroke={6} color={totals.cal > config.targetCal ? T.red : T.accent}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: T.text }}>{fmt(totals.cal)}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.42rem", color: T.muted }}>KCAL</div>
            </div>
          </Ring>
          <Ring value={totals.p} max={config.targetProtein} size={74} stroke={6} color={T.green}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: T.text }}>{fmt(totals.p)}g</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.42rem", color: T.muted }}>PROTEIN</div>
            </div>
          </Ring>
          <div style={{ flex: 1 }}>
            {[["Calories", totals.cal, config.targetCal, T.accent], ["Protein", totals.p, config.targetProtein, T.green]].map(([l, v, t, c]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: T.muted }}>{l}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: v > t ? T.red : T.sub }}>{fmt(t - v)} left</span>
                </div>
                <Bar value={v} max={t} color={v > t ? T.red : c} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Vitals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 12 }}>
        {[
          { l: "BLOAT", v: todayGut.bloat ? `${todayGut.bloat}/10` : "—", c: todayGut.bloat >= 7 ? T.red : todayGut.bloat >= 4 ? T.orange : T.green },
          { l: "ENERGY", v: todayGut.energy ? `${todayGut.energy}/10` : "—", c: T.blue },
          { l: "SLEEP", v: todaySleep.hours ? `${todaySleep.hours}h` : "—", c: T.sub },
          { l: "PUFFY", v: todayMetrics.puffiness ? `${todayMetrics.puffiness}/5` : "—", c: todayMetrics.puffiness >= 4 ? T.red : T.muted },
        ].map(s => (
          <Card key={s.l} style={{ padding: "10px 8px", textAlign: "center" }}>
            <Lbl>{s.l}</Lbl>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", color: s.c }}>{s.v}</div>
          </Card>
        ))}
      </div>

      {/* 7-day heatmap */}
      <Card style={{ marginBottom: 12 }}>
        <Lbl>7-DAY CONSISTENCY</Lbl>
        <div style={{ display: "flex", gap: 5, marginTop: 8, marginBottom: 12 }}>
          {last7.map((dt, i) => {
            const g = !!workout[dt];
            const p = (diet[dt] || []).reduce((a, f) => a + f.p, 0) >= config.targetProtein * 0.85;
            const score = (g ? 1 : 0) + (p ? 1 : 0) + ((diet[dt] || []).length > 0 ? 1 : 0);
            const col = score === 3 ? T.accent : score === 2 ? T.green : score === 1 ? T.orange : T.border;
            return (
              <div key={dt} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", aspectRatio: "1", borderRadius: 5, background: col, opacity: dt === d ? 1 : 0.65 }} />
                <span style={{ fontFamily: "monospace", fontSize: "0.48rem", color: T.muted }}>{"MTWTFSS"[i]}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[["GYM", gymDays, T.push], ["PROTEIN", proteinDays, T.green], ["GOAL BF%", config.goalBF + "%", T.accent]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: c }}>{v}{typeof v === "number" ? <span style={{ fontSize: "0.7rem", color: T.muted }}>/7</span> : ""}</div>
              <Lbl>{l}</Lbl>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[["◉ Log Food", "diet", T.green], ["◆ Log Workout", "gym", T.push], ["◎ Body Check", "body", T.blue], ["✦ Ask Traffy", "traffy", T.accent]].map(([l, t, c]) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: c, fontFamily: "monospace", fontSize: "0.72rem", letterSpacing: "0.04em" }}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DIET LOG
// ══════════════════════════════════════════════════════════════════════════
function DietLog({ diet, setDiet, config }) {
  const [date, setDate] = useState(todayStr());
  const [mode, setMode] = useState("preset");
  const [search, setSearch] = useState("");
  const [manual, setManual] = useState({ name: "", cal: "", p: "", c: "", f: "" });
  const foods = diet[date] || [];
  const totals = foods.reduce((a, f) => ({ cal: a.cal + f.cal, p: a.p + f.p, c: a.c + f.c, fat: a.fat + (f.fat || 0) }), { cal: 0, p: 0, c: 0, fat: 0 });

  const getGutTag = (name) => {
    if (config.gutFoods.green.some(g => name.toLowerCase().includes(g.toLowerCase()))) return { tag: "🟢", color: T.green };
    if (config.gutFoods.red.some(g => name.toLowerCase().includes(g.toLowerCase()))) return { tag: "🔴", color: T.red };
    return { tag: "🟡", color: T.gold };
  };

  const add = (food) => setDiet(p => ({ ...p, [date]: [...(p[date] || []), { ...food, id: Date.now() }] }));
  const remove = (id) => setDiet(p => ({ ...p, [date]: (p[date] || []).filter(f => f.id !== id) }));
  const addManual = () => {
    if (!manual.name || !manual.cal) return;
    add({ name: manual.name, cal: +manual.cal, p: +manual.p || 0, c: +manual.c || 0, fat: +manual.f || 0 });
    setManual({ name: "", cal: "", p: "", c: "", f: "" });
  };

  const filtered = FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: T.text, letterSpacing: "0.04em", marginBottom: 14 }}>DIET LOG</div>
      <Inp type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "auto", marginBottom: 14 }} />

      <Card accent={T.green} style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center", gap: 6 }}>
          {[["KCAL", totals.cal, config.targetCal, T.accent], ["PROT", totals.p, config.targetProtein, T.green], ["CARB", totals.c, config.targetCarbs, T.blue], ["FAT", totals.fat, config.targetFat, T.orange]].map(([l, v, t, c]) => (
            <div key={l}>
              <Lbl>{l}</Lbl>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", color: v >= t ? c : T.text }}>{fmt(v)}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.52rem", color: T.muted }}>/{t}</div>
              <Bar value={v} max={t} color={c} h={3} />
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["preset", "manual"].map(m => (
          <Btn key={m} onClick={() => setMode(m)} color={T.accent} outline={mode !== m} style={{ flex: 1 }}>
            {m === "preset" ? "📋 PRESET" : "✏️ MANUAL"}
          </Btn>
        ))}
      </div>

      {mode === "preset" && (
        <>
          <Inp placeholder="Search foods…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 10 }} />
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map((f, i) => {
              const gut = getGutTag(f.name);
              return (
                <div key={i} onClick={() => add(f)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.s2, border: `1px solid ${T.border}`, borderRadius: 11, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = gut.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div>
                    <div style={{ fontSize: "0.82rem", color: T.text }}>{gut.tag} {f.name}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: T.muted }}>P:{f.p}g C:{f.c}g F:{f.f}g</div>
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: T.accent }}>{f.cal} <span style={{ fontSize: "0.55rem", color: T.muted }}>kcal</span></div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {mode === "manual" && (
        <Card>
          <div style={{ display: "grid", gap: 8 }}>
            <Inp placeholder="Food name" value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[["cal", "kcal"], ["p", "prot g"], ["c", "carb g"], ["f", "fat g"]].map(([k, ph]) => (
                <Inp key={k} placeholder={ph} type="number" value={manual[k]} onChange={e => setManual(p => ({ ...p, [k]: e.target.value }))} style={{ textAlign: "center", padding: "8px 4px" }} />
              ))}
            </div>
            <Btn onClick={addManual} color={T.green} style={{ width: "100%" }}>+ ADD FOOD</Btn>
          </div>
        </Card>
      )}

      {foods.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Lbl>LOGGED</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {foods.map(f => {
              const gut = getGutTag(f.name);
              return (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", background: T.s2, border: `1px solid ${T.border}`, borderRadius: 11 }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: T.text }}>{gut.tag} {f.name}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: T.muted }}>{f.p}g P · {f.c}g C · {f.fat || f.f || 0}g F</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: T.accent, fontSize: "0.95rem" }}>{f.cal}</span>
                    <button onClick={() => remove(f.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// GYM LOG (full PPL plan)
// ══════════════════════════════════════════════════════════════════════════
function GymLog({ workout, setWorkout, config }) {
  const [date, setDate] = useState(todayStr());
  const dayIdx = (new Date(date).getDay() + 6) % 7;
  const [type, setType] = useState(config.weekSchedule[dayIdx] || "Push");
  const [duration, setDuration] = useState("");
  const [sets, setSets] = useState({});
  const [notes, setNotes] = useState("");
  const [openEx, setOpenEx] = useState(null);
  const existing = workout[date];
  const plan = config.workoutPlan[type] || [];
  const tCol = { Push: T.push, Pull: T.pull, Legs: T.legs, "Cardio+Abs": T.gold, Rest: T.muted };

  const upd = (ex, si, field, val) => setSets(p => ({ ...p, [ex]: { ...(p[ex] || {}), [si]: { ...(p[ex]?.[si] || {}), [field]: val } } }));
  const save = () => {
    setWorkout(p => ({ ...p, [date]: { type, duration: +duration || 0, sets, notes, date } }));
    alert("Workout saved! 💪");
  };

  const sInp = { background: "#0a0a0d", border: `1px solid ${T.border}`, borderRadius: 6, padding: "7px 5px", color: T.text, fontFamily: "monospace", fontSize: "0.72rem", width: "100%", outline: "none", textAlign: "center" };

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: T.text, letterSpacing: "0.04em", marginBottom: 14 }}>GYM LOG</div>
      <Inp type="date" value={date} onChange={e => { setDate(e.target.value); setType(config.weekSchedule[(new Date(e.target.value).getDay() + 6) % 7] || "Push"); }} style={{ width: "auto", marginBottom: 12 }} />

      {existing && (
        <div style={{ background: "#0a150a", border: `1px solid ${T.green}44`, borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: T.green }}>✓ {existing.type} LOGGED · {existing.duration} MIN</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.keys(config.workoutPlan).map(t => (
          <button key={t} onClick={() => setType(t)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${type === t ? tCol[t] : T.border}`, background: type === t ? tCol[t] + "22" : "transparent", color: type === t ? tCol[t] : T.muted, fontFamily: "monospace", fontSize: "0.64rem", cursor: "pointer" }}>{t}</button>
        ))}
      </div>

      <Inp placeholder="Duration (minutes)" type="number" value={duration} onChange={e => setDuration(e.target.value)} style={{ marginBottom: 12 }} />

      {type !== "Rest" && plan.map((ex, ei) => (
        <Card key={ex.name} style={{ marginBottom: 10 }}>
          <button onClick={() => setOpenEx(openEx === ei ? null : ei)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 0 }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: T.text }}>{ex.name}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: tCol[type], marginTop: 2 }}>{ex.working}</div>
              {ex.note && <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: T.orange, marginTop: 2 }}>{ex.note}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: T.muted }}>{ex.sets}×</span>
              <span style={{ color: T.muted, fontSize: "0.9rem" }}>{openEx === ei ? "−" : "+"}</span>
            </div>
          </button>

          {openEx === ei && (
            <div style={{ marginTop: 12 }}>
              {ex.warmup?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: T.muted }}>WARMUP:</span>
                  {ex.warmup.map((w, wi) => <span key={wi} style={{ fontFamily: "monospace", fontSize: "0.62rem", color: T.sub, background: T.s2, padding: "2px 8px", borderRadius: 4 }}>{w}</span>)}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "20px 1fr 1fr", gap: 5, alignItems: "center", marginBottom: 8 }}>
                <div /><div style={{ fontFamily: "monospace", fontSize: "0.56rem", color: T.muted, textAlign: "center" }}>KG</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.56rem", color: T.muted, textAlign: "center" }}>REPS</div>
                {[...Array(ex.sets)].map((_, si) => (
                  <>
                    <span key={`l${si}`} style={{ fontFamily: "monospace", fontSize: "0.58rem", color: T.muted }}>S{si + 1}</span>
                    <input key={`w${si}`} placeholder="—" value={sets[ex.name]?.[si]?.weight || ""} onChange={e => upd(ex.name, si, "weight", e.target.value)} style={sInp} />
                    <input key={`r${si}`} placeholder="—" value={sets[ex.name]?.[si]?.reps || ""} onChange={e => upd(ex.name, si, "reps", e.target.value)} style={sInp} />
                  </>
                ))}
              </div>
              {ex.backoff && <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: T.muted, marginBottom: 6 }}>Backoff: {ex.backoff}</div>}
              <div style={{ borderLeft: `2px solid ${T.accentDim}`, paddingLeft: 8 }}>
                <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: T.accent }}>→ {ex.progression}</div>
              </div>
            </div>
          )}
        </Card>
      ))}

      {type === "Rest" && (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🛌</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", color: T.muted }}>REST DAY</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: T.muted, marginTop: 6 }}>Do your 45 min incline walk though.</div>
        </Card>
      )}

      <textarea placeholder="How it felt, PRs, energy level…" value={notes} onChange={e => setNotes(e.target.value)}
        style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 11, padding: "10px 12px", color: T.text, fontFamily: "monospace", fontSize: "0.78rem", width: "100%", outline: "none", minHeight: 64, resize: "vertical", marginTop: 12, marginBottom: 12 }} />

      <Btn onClick={save} color={T.accent} style={{ width: "100%", padding: 14 }}>SAVE WORKOUT</Btn>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// BODY + GUT + SLEEP
// ══════════════════════════════════════════════════════════════════════════
function BodyGut({ metrics, setMetrics, gut, setGut, skin, setSkin, sleep: slp, setSleep }) {
  const [date, setDate] = useState(todayStr());
  const [panel, setPanel] = useState("body");
  const me = metrics[date] || {};
  const ge = gut[date] || {};
  const ske = skin[date] || {};
  const sle = slp[date] || {};
  const setM = (k, v) => setMetrics(p => ({ ...p, [date]: { ...(p[date] || {}), [k]: v } }));
  const setG = (k, v) => setGut(p => ({ ...p, [date]: { ...(p[date] || {}), [k]: v } }));
  const setSk = (k, v) => setSkin(p => ({ ...p, [date]: { ...(p[date] || {}), [k]: v } }));
  const setSl = (k, v) => setSleep(p => ({ ...p, [date]: { ...(p[date] || {}), [k]: v } }));

  const ScoreRow = ({ label, value, onSet, lo = 1, hi = 10, color }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <Lbl>{label}</Lbl>
        {value && <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color }}>{value}/{hi}</span>}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {[...Array(hi - lo + 1)].map((_, i) => { const n = lo + i; return (
          <button key={n} onClick={() => onSet(n)} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: `1px solid ${value === n ? color : T.border}`, background: value === n ? color + "22" : "transparent", color: value === n ? color : T.muted, fontFamily: "monospace", fontSize: "0.68rem", cursor: "pointer" }}>{n}</button>
        ); })}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: T.text, letterSpacing: "0.04em", marginBottom: 14 }}>BODY & GUT</div>
      <Inp type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "auto", marginBottom: 14 }} />

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["body", "gut", "sleep"].map(p => (
          <Btn key={p} onClick={() => setPanel(p)} color={T.accent} outline={panel !== p} style={{ flex: 1 }}>{p.toUpperCase()}</Btn>
        ))}
      </div>

      {panel === "body" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[["Weight (kg)", "weight", "81.0"], ["Waist Fasted (cm)", "waistFasted", "94"], ["Waist Evening (cm)", "waistEvening", "106"], ["Neck (cm)", "neck", "42"]].map(([l, k, ph]) => (
              <Card key={k} style={{ padding: 12 }}>
                <Lbl>{l}</Lbl>
                <Inp type="number" placeholder={ph} value={me[k] || ""} onChange={e => setM(k, +e.target.value)} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", padding: "5px 8px" }} />
              </Card>
            ))}
          </div>
          {me.waistFasted && me.waistEvening && (
            <Card accent={T.orange} style={{ textAlign: "center", marginBottom: 12 }}>
              <Lbl color={T.orange}>BLOAT DELTA</Lbl>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", color: T.orange }}>+{fmt(me.waistEvening - me.waistFasted)}cm</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: T.muted }}>fasted → evening</div>
            </Card>
          )}
          <Card>
            <Lbl>FACE PUFFINESS</Lbl>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setM("puffiness", n)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${me.puffiness === n ? T.orange : T.border}`, background: me.puffiness === n ? T.orange + "22" : T.s2, color: me.puffiness === n ? T.orange : T.muted, fontFamily: "monospace", fontSize: "0.8rem", cursor: "pointer" }}>{n}</button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.52rem", color: T.muted }}>SHARP</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.52rem", color: T.muted }}>PUFFY</span>
            </div>
          </Card>
        </div>
      )}

      {panel === "gut" && (
        <Card>
          <ScoreRow label="BLOAT (1=none, 10=severe)" value={ge.bloat} onSet={v => setG("bloat", v)} color={T.orange} />
          <ScoreRow label="ENERGY" value={ge.energy} onSet={v => setG("energy", v)} color={T.green} />
          <ScoreRow label="DIGESTION QUALITY" value={ge.digestion} onSet={v => setG("digestion", v)} color={T.blue} />
          <Lbl>SKIN</Lbl>
          <ScoreRow label="SKIN QUALITY" value={ske.rating} onSet={v => setSk("rating", v)} color={T.blue} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {["Acne", "Oily", "Dry", "Glowing", "Dull", "Clear"].map(tag => (
              <button key={tag} onClick={() => { const t = ske.tags || []; setSk("tags", t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]); }} style={{ padding: "5px 10px", borderRadius: 20, border: `1px solid ${(ske.tags || []).includes(tag) ? T.blue : T.border}`, background: (ske.tags || []).includes(tag) ? T.blue + "22" : "transparent", color: (ske.tags || []).includes(tag) ? T.blue : T.muted, fontFamily: "monospace", fontSize: "0.62rem", cursor: "pointer" }}>{tag}</button>
            ))}
          </div>
          <Lbl>GUT NOTES</Lbl>
          <textarea value={ge.notes || ""} onChange={e => setG("notes", e.target.value)} placeholder="Food reactions, symptoms, timing…" style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 12px", color: T.text, fontFamily: "monospace", fontSize: "0.78rem", width: "100%", outline: "none", minHeight: 64, resize: "vertical" }} />
        </Card>
      )}

      {panel === "sleep" && (
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[["HOURS SLEPT", "hours", "7.5"], ["QUALITY (1-10)", "quality", "7"]].map(([l, k, ph]) => (
              <div key={k}>
                <Lbl>{l}</Lbl>
                <Inp type="number" placeholder={ph} value={sle[k] || ""} onChange={e => setSl(k, +e.target.value)} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem" }} />
              </div>
            ))}
          </div>
          <ScoreRow label="MORNING ENERGY" value={sle.morningEnergy} onSet={v => setSl("morningEnergy", v)} color={T.gold} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Woke groggy", "Slept well", "Late sleep", "Good energy", "Vivid dreams", "Restless"].map(tag => (
              <button key={tag} onClick={() => { const t = sle.tags || []; setSl("tags", t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]); }} style={{ padding: "5px 10px", borderRadius: 20, border: `1px solid ${(sle.tags || []).includes(tag) ? T.gold : T.border}`, background: (sle.tags || []).includes(tag) ? T.gold + "22" : "transparent", color: (sle.tags || []).includes(tag) ? T.gold : T.muted, fontFamily: "monospace", fontSize: "0.62rem", cursor: "pointer" }}>{tag}</button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SETTINGS PANEL
// ══════════════════════════════════════════════════════════════════════════
function Settings({ config, setConfig, onClose }) {
  const [local, setLocal] = useState(config);
  const upd = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#070709ee", zIndex: 100, overflowY: "auto", padding: "24px 16px 80px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: T.text }}>SETTINGS</div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", color: T.muted, cursor: "pointer", fontFamily: "monospace", fontSize: "0.7rem" }}>CANCEL</button>
        </div>

        {/* Goals */}
        <Card style={{ marginBottom: 12 }}>
          <Lbl color={T.accent}>BODY GOALS</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {[["Target Weight (kg)", "targetWeight"], ["Goal Body Fat %", "goalBF"], ["Current Weight (kg)", "weight"], ["Current BF % (est)", "startBF"]].map(([l, k]) => (
              <div key={k}><Lbl>{l}</Lbl><Inp type="number" value={local[k] || ""} onChange={e => upd(k, +e.target.value)} /></div>
            ))}
          </div>
        </Card>

        {/* Macros */}
        <Card style={{ marginBottom: 12 }}>
          <Lbl color={T.green}>DAILY TARGETS</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {[["Calories", "targetCal"], ["Protein (g)", "targetProtein"], ["Carbs (g)", "targetCarbs"], ["Fat (g)", "targetFat"]].map(([l, k]) => (
              <div key={k}><Lbl>{l}</Lbl><Inp type="number" value={local[k] || ""} onChange={e => upd(k, +e.target.value)} /></div>
            ))}
          </div>
        </Card>

        {/* Week schedule */}
        <Card style={{ marginBottom: 12 }}>
          <Lbl color={T.push}>WEEK SCHEDULE</Lbl>
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: T.muted, width: 28 }}>{day}</span>
                <select value={local.weekSchedule[i]} onChange={e => { const s = [...local.weekSchedule]; s[i] = e.target.value; upd("weekSchedule", s); }} style={{ flex: 1, background: T.s2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 10px", color: T.text, fontFamily: "monospace", fontSize: "0.72rem", outline: "none" }}>
                  {["Push", "Pull", "Legs", "Cardio+Abs", "Rest"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Card>

        {/* Gut foods */}
        <Card style={{ marginBottom: 16 }}>
          <Lbl color={T.orange}>GUT SENSITIVITY FOODS</Lbl>
          {[["green", "🟢 Safe Foods", T.green], ["yellow", "🟡 Uncertain", T.gold], ["red", "🔴 Avoid", T.red]].map(([k, label, color]) => (
            <div key={k} style={{ marginTop: 12 }}>
              <Lbl color={color}>{label}</Lbl>
              <textarea value={(local.gutFoods[k] || []).join(", ")} onChange={e => upd("gutFoods", { ...local.gutFoods, [k]: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                style={{ background: T.s2, border: `1px solid ${color}44`, borderRadius: 8, padding: "8px 10px", color: T.text, fontFamily: "monospace", fontSize: "0.7rem", width: "100%", outline: "none", minHeight: 52, resize: "vertical" }} />
              <div style={{ fontFamily: "monospace", fontSize: "0.55rem", color: T.muted, marginTop: 3 }}>comma-separated</div>
            </div>
          ))}
        </Card>

        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={onClose} color={T.muted} outline style={{ flex: 1 }}>CANCEL</Btn>
          <Btn onClick={() => { setConfig(local); onClose(); }} color={T.accent} style={{ flex: 2 }}>SAVE CHANGES</Btn>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TRAFFY AI
// ══════════════════════════════════════════════════════════════════════════
function Traffy({ allData, config, setConfig }) {
  const [messages, setMessages] = useStore("traffy_chat_v1", [
    { role: "assistant", content: "Hey, I'm Traffy — your personal transformation intelligence. I know everything about your plan, your data, and your patterns.\n\nI can answer questions, analyse your logs, AND directly update your plan. Try:\n• \"Change my calorie goal to 1700\"\n• \"Mark rajma as red gut food\"\n• \"Move Friday to Pull instead of Push\"\n• \"What's causing my bloat?\"\n• \"Am I on track this week?\"" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Rule-based offline alerts
  useEffect(() => {
    const d = todayStr();
    const newAlerts = [];
    const last7 = [...Array(7)].map((_, i) => { const dt = new Date(); dt.setDate(dt.getDate() - i); return dt.toISOString().split("T")[0]; });
    const avgProtein = last7.reduce((a, dt) => a + (allData.diet[dt] || []).reduce((b, f) => b + f.p, 0), 0) / 7;
    const gymDays = last7.filter(dt => allData.workout[dt]).length;
    const avgBloat = last7.reduce((a, dt) => a + (allData.gut[dt]?.bloat || 0), 0) / 7;
    const todayFoods = allData.diet[d] || [];
    const todayProtein = todayFoods.reduce((a, f) => a + f.p, 0);
    const todayCal = todayFoods.reduce((a, f) => a + f.cal, 0);

    if (avgProtein < config.targetProtein * 0.8 && avgProtein > 0) newAlerts.push({ type: "warn", icon: "⚠️", title: "Protein Gap", body: `7-day avg ${fmt(avgProtein)}g vs ${config.targetProtein}g target. This is your biggest blocker.` });
    if (gymDays < 4) newAlerts.push({ type: "warn", icon: "⚠️", title: "Gym Consistency", body: `Only ${gymDays}/7 days this week. Below 4 days breaks your PPL cycle.` });
    if (avgBloat >= 6 && avgBloat > 0) newAlerts.push({ type: "warn", icon: "🔍", title: "Chronic Bloat", body: `Avg bloat ${avgBloat.toFixed(1)}/10. Check gut log to find pattern foods.` });
    if (todayProtein < config.targetProtein * 0.5 && new Date().getHours() >= 15 && todayFoods.length > 0) newAlerts.push({ type: "warn", icon: "⚡", title: "Protein Behind Today", body: `Only ${fmt(todayProtein)}g by ${new Date().getHours()}:00. Need ${config.targetProtein - fmt(todayProtein)}g more before 7:30pm.` });
    if (todayCal > config.targetCal * 1.1 && todayFoods.length > 0) newAlerts.push({ type: "warn", icon: "🔴", title: "Over Calories", body: `${fmt(todayCal)} kcal vs ${config.targetCal} target. Deficit broken today.` });
    if (gymDays >= 6) newAlerts.push({ type: "good", icon: "✅", title: "Gym Consistency", body: `${gymDays}/7 days this week. Excellent — keep this up.` });

    setAlerts(newAlerts);
  }, [allData, config]);

  const buildSystem = () => {
    const d = todayStr();
    const last7 = [...Array(7)].map((_, i) => { const dt = new Date(); dt.setDate(dt.getDate() - i); return dt.toISOString().split("T")[0]; }).reverse();
    const foods = allData.diet[d] || [];
    const totals = foods.reduce((a, f) => ({ cal: a.cal + f.cal, p: a.p + f.p }), { cal: 0, p: 0 });
    const avgProtein = last7.reduce((a, dt) => a + (allData.diet[dt] || []).reduce((b, f) => b + f.p, 0), 0) / 7;
    const gymDays = last7.filter(dt => allData.workout[dt]).length;
    const avgBloat = last7.reduce((a, dt) => a + (allData.gut[dt]?.bloat || 0), 0) / 7;
    const todayGut = allData.gut[d] || {};
    const todaySleep = allData.sleep[d] || {};
    const todayMetrics = allData.metrics[d] || {};

    return `You are TRAFFY — an intelligent, direct, data-driven personal transformation AI coach embedded in a fitness OS app.

USER CONFIG (LIVE — you can update these):
- Weight: ${config.weight}kg | Height: ${config.height}cm | Age: ${config.age}
- Body type: Kapha (Ayurvedic) — slow digestion, water retention prone
- Start BF: ${config.startBF}% → Goal: ${config.goalBF}% (target weight: ${config.targetWeight}kg)
- Diet: ${config.diet}
- Program: ${config.program}
- Daily targets: ${config.targetCal} kcal | ${config.targetProtein}g protein | ${config.targetCarbs}g carbs | ${config.targetFat}g fat
- Week schedule: ${config.weekSchedule.join(", ")} (Mon–Sun)
- 🟢 Gut-safe foods: ${config.gutFoods.green.join(", ")}
- 🟡 Uncertain foods: ${config.gutFoods.yellow?.join(", ") || "none"}
- 🔴 Avoid foods: ${config.gutFoods.red.join(", ")}

TODAY (${d}):
- Calories: ${fmt(totals.cal)}/${config.targetCal} | Protein: ${fmt(totals.p)}/${config.targetProtein}g
- Foods: ${foods.map(f => f.name).join(", ") || "nothing logged yet"}
- Workout: ${allData.workout[d] ? allData.workout[d].type + " " + allData.workout[d].duration + "min" : "not logged"}
- Bloat: ${todayGut.bloat || "—"}/10 | Energy: ${todayGut.energy || "—"}/10
- Waist fasted: ${todayMetrics.waistFasted || "—"}cm | Evening: ${todayMetrics.waistEvening || "—"}cm
- Face puffiness: ${todayMetrics.puffiness || "—"}/5
- Sleep: ${todaySleep.hours || "—"}h quality ${todaySleep.quality || "—"}/10

7-DAY SUMMARY:
- Avg protein: ${fmt(avgProtein)}g/day
- Gym days: ${gymDays}/7
- Avg bloat: ${avgBloat.toFixed(1)}/10

KEY CONTEXT (always remember):
- Fasted waist 94-99cm vs evening 105-108cm = massive bloat (not just fat)
- Emmer wheat works well for digestion; modern wheat causes issues
- Kapha needs warm food, biggest meal at lunch, nothing after 7:30pm
- Ginger + rock salt + lemon before meals stimulates Kapha digestion
- Soy products suspected bloat trigger — testing ongoing
- Protein has been consistently undereaten — biggest gap to close

CRITICAL — CONFIG EDITING CAPABILITY:
When the user asks you to change any setting (calories, protein, schedule, gut food list, body goals, etc.), you MUST respond with a JSON block at the end of your message in this exact format so the app can apply the change:

\`\`\`config_update
{
  "field": "targetCal",
  "value": 1700,
  "message": "Updated your daily calorie target to 1700 kcal"
}
\`\`\`

For gut foods:
\`\`\`config_update
{
  "field": "gutFoods.red",
  "value": ["Rajma", "Maida", "Cold Food", "Late Night Eating", "Soy Curd"],
  "message": "Added Soy Curd to your red/avoid list"
}
\`\`\`

For week schedule (array of 7):
\`\`\`config_update
{
  "field": "weekSchedule",
  "value": ["Push","Pull","Legs","Cardio+Abs","Push","Pull","Rest"],
  "message": "Updated your weekly schedule"
}
\`\`\`

Supported fields: targetCal, targetProtein, targetCarbs, targetFat, targetWeight, goalBF, weight, gutFoods.green, gutFoods.yellow, gutFoods.red, weekSchedule, program

RESPONSE STYLE:
- Direct, data-specific, no fluff
- Use their actual numbers always
- Mobile-formatted (short paragraphs, bullet points)
- Max 180 words unless they ask for detail
- Be proactive — if you see a problem in their data, call it out`;
  };

  const applyConfigUpdate = (text) => {
    const match = text.match(/```config_update\n([\s\S]*?)```/);
    if (!match) return text;
    try {
      const update = JSON.parse(match[1]);
      setConfig(prev => {
        const next = { ...prev };
        if (update.field.includes(".")) {
          const [parent, child] = update.field.split(".");
          next[parent] = { ...next[parent], [child]: update.value };
        } else {
          next[update.field] = update.value;
        }
        return next;
      });
      return text.replace(/```config_update[\s\S]*?```/, `\n✅ **Config updated:** ${update.message}`);
    } catch { return text; }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    const reply = await callClaude(buildSystem(), newMsgs.map(m => ({ role: m.role, content: m.content })));
    const processed = applyConfigUpdate(reply);
    setMessages(prev => [...prev, { role: "assistant", content: processed }]);
    setLoading(false);
  };

  const getBriefing = async () => {
    setBriefingLoading(true);
    const reply = await callClaude(buildSystem(), [{ role: "user", content: "Generate my morning briefing with: 1) Yesterday's data summary 2) Today's exact plan (what to eat, what workout) 3) One critical thing to fix 4) A detected pattern from my logs. Be specific with numbers." }]);
    setBriefing(reply);
    setBriefingLoading(false);
  };

  const quick = ["Am I on track?", "What's causing my bloat?", "What should I eat now?", "Ready to increase lat pulldown?", "Change calories to 1700", "Mark soy curd as red food", "Weekly summary"];
  const aCol = { warn: T.orange, good: T.green, info: T.blue };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 160px)" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: T.accent, letterSpacing: "0.04em", lineHeight: 1 }}>TRAFFY</div>
        <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: T.muted, letterSpacing: "0.1em" }}>AI COACH · PATTERN DETECTION · CONFIG EDITOR</div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: T.s1, border: `1px solid ${aCol[a.type] || T.blue}33`, borderLeft: `3px solid ${aCol[a.type] || T.blue}`, borderRadius: "0 12px 12px 0", padding: "10px 14px" }}>
              <span style={{ fontSize: "0.85rem", marginTop: 1 }}>{a.icon}</span>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: aCol[a.type], marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: "0.74rem", color: T.sub, lineHeight: 1.5 }}>{a.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Morning briefing */}
      {!briefing ? (
        <button onClick={getBriefing} disabled={briefingLoading} style={{ background: T.accentGlow, border: `1px solid ${T.accent}55`, borderRadius: 14, padding: 14, color: briefingLoading ? T.muted : T.accent, fontFamily: "monospace", fontSize: "0.78rem", cursor: "pointer", letterSpacing: "0.06em", marginBottom: 14, width: "100%" }}>
          {briefingLoading ? "GENERATING BRIEFING…" : "✦ MORNING BRIEFING"}
        </button>
      ) : (
        <Card accent={T.accent} style={{ marginBottom: 14 }}>
          <Lbl color={T.accent}>✦ MORNING BRIEFING</Lbl>
          <div style={{ fontSize: "0.8rem", color: T.text, lineHeight: 1.75, whiteSpace: "pre-wrap", marginTop: 6 }}>{briefing}</div>
          <button onClick={() => { setBriefing(null); }} style={{ marginTop: 10, background: "none", border: `1px solid ${T.border}`, borderRadius: 7, padding: "4px 12px", color: T.muted, fontFamily: "monospace", fontSize: "0.6rem", cursor: "pointer" }}>REFRESH</button>
        </Card>
      )}

      {/* Quick prompts */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {quick.map(q => (
          <button key={q} onClick={() => setInput(q)} style={{ padding: "5px 10px", borderRadius: 20, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontFamily: "monospace", fontSize: "0.58rem", cursor: "pointer" }}>{q}</button>
        ))}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 12, minHeight: 180 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "88%", padding: "11px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? T.accentGlow : T.s1, border: `1px solid ${m.role === "user" ? T.accent + "44" : T.border}`, fontSize: "0.8rem", color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "11px 16px", borderRadius: "16px 16px 16px 4px", background: T.s1, border: `1px solid ${T.border}`, display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: `tp 0.8s ${i * 0.15}s ease-in-out infinite alternate` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask Traffy anything…" style={{ flex: 1, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 14px", color: T.text, fontFamily: "monospace", fontSize: "0.78rem", outline: "none" }} />
        <button onClick={send} disabled={loading} style={{ padding: "11px 18px", background: loading ? T.muted : T.accent, color: "#07070a", borderRadius: 12, border: "none", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", cursor: loading ? "default" : "pointer" }}>→</button>
      </div>
      <style>{`@keyframes tp{from{opacity:.2;transform:translateY(2px)}to{opacity:1;transform:translateY(-2px)}}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dash");
  const [config, setConfig] = useStore("traffy_config_v2", DEFAULT_CONFIG);
  const [diet, setDiet] = useStore("traffy_diet_v2", {});
  const [metrics, setMetrics] = useStore("traffy_metrics_v2", {});
  const [workout, setWorkout] = useStore("traffy_workout_v2", {});
  const [gut, setGut] = useStore("traffy_gut_v2", {});
  const [skin, setSkin] = useStore("traffy_skin_v2", {});
  const [sleep, setSleep] = useStore("traffy_sleep_v2", {});
  const [showSettings, setShowSettings] = useState(false);
  const allData = { diet, metrics, workout, gut, skin, sleep };

  const callClaude = async (system, messages) => {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages }),
      });
      const data = await res.json();
      return data.content?.[0]?.text || "No response.";
    } catch { return "Connection error. Try again."; }
  };

  // Patch callClaude into Traffy via window (simple bridge)
  useEffect(() => { window._callClaude = callClaude; }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Outfit', sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder,textarea::placeholder{color:#2e303a;}
        ::-webkit-scrollbar{width:2px;} ::-webkit-scrollbar-thumb{background:#1f2028;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.3);}
        select option{background:#131318;}
        button:active{transform:scale(0.97);}
      `}</style>

      {showSettings && <Settings config={config} setConfig={setConfig} onClose={() => setShowSettings(false)} />}

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, background: T.bg + "ee", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 50 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: T.accent, letterSpacing: "0.1em" }}>TRAFFY OS</div>
        <button onClick={() => setShowSettings(true)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", color: T.muted, cursor: "pointer", fontFamily: "monospace", fontSize: "0.62rem", letterSpacing: "0.06em" }}>⚙ SETTINGS</button>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px 100px" }}>
        {tab === "dash" && <Dashboard allData={allData} config={config} setTab={setTab} />}
        {tab === "diet" && <DietLog diet={diet} setDiet={setDiet} config={config} />}
        {tab === "gym" && <GymLog workout={workout} setWorkout={setWorkout} config={config} />}
        {tab === "body" && <BodyGut metrics={metrics} setMetrics={setMetrics} gut={gut} setGut={setGut} skin={skin} setSkin={setSkin} sleep={sleep} setSleep={setSleep} />}
        {tab === "gut" && <BodyGut metrics={metrics} setMetrics={setMetrics} gut={gut} setGut={setGut} skin={skin} setSkin={setSkin} sleep={sleep} setSleep={setSleep} />}
        {tab === "traffy" && <Traffy allData={allData} config={config} setConfig={setConfig} />}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#09090cee", backdropFilter: "blur(16px)", borderTop: `1px solid ${T.border}`, padding: "10px 4px 18px", display: "flex", justifyContent: "space-around", zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id === "gut" ? "body" : t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", minWidth: 44 }}>
            <span style={{ fontSize: "1rem", color: tab === t.id ? T.accent : T.text, opacity: tab === t.id ? 1 : 0.28, transition: "all 0.15s" }}>{t.icon}</span>
            <span style={{ fontFamily: "monospace", fontSize: "0.5rem", letterSpacing: "0.08em", color: tab === t.id ? T.accent : T.muted, transition: "color 0.15s" }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 14, height: 2, background: T.accent, borderRadius: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
