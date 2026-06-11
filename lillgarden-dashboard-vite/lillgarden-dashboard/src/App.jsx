import React, { useState, useMemo } from "react";
import {
  ComposedChart, Bar, Line, LineChart, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import {
  Settings, LayoutGrid, TrendingUp, Scale, Save, Trash2, Plus,
} from "lucide-react";
import { RR, BR, DRIFT, SEED_PERIODS, DEFAULT_SETTINGS } from "./data.js";
import { useLocalStorage } from "./useLocalStorage.js";
import PasswordGate from "./PasswordGate.jsx";

/* ---------- design tokens ---------- */
const T = {
  bg: "#F5F6F4", ink: "#172233", inkSoft: "#46566A", faint: "#8593A2",
  line: "#E3E6E3", surface: "#FFFFFF", green: "#2E6F5E", greenSoft: "#E8F0EC",
  clay: "#B4533C", claySoft: "#F4E7E2", blue: "#3E5C76", gold: "#B8893B",
};

/* ---------- helpers ---------- */
const kr = (n) => (n == null || isNaN(n) ? "–" :
  new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(Math.round(n)) + " kr");
const krShort = (n) => {
  if (n == null || isNaN(n)) return "–";
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toLocaleString("sv-SE", { maximumFractionDigits: 1 }) + " mkr";
  if (a >= 1e3) return Math.round(n / 1e3).toLocaleString("sv-SE") + " tkr";
  return Math.round(n).toLocaleString("sv-SE");
};
const pct = (n) => (n == null || isNaN(n) ? "–" : (n * 100).toLocaleString("sv-SE", { maximumFractionDigits: 1 }) + " %");
const num = (v) => { const x = parseFloat(String(v).replace(/\s/g, "").replace(",", ".")); return isNaN(x) ? 0 : x; };

/* ============================================================ */
function Dashboard() {
  const [tab, setTab] = useState("oversikt");
  const [settings, setSettings] = useLocalStorage("brf_lillgarden_settings", DEFAULT_SETTINGS);
  const [periods, setPeriods] = useLocalStorage("brf_lillgarden_periods", SEED_PERIODS);

  const sorted = useMemo(() => [...periods].sort((a, b) => a.date.localeCompare(b.date)), [periods]);
  const latest = sorted[sorted.length - 1];
  const boyta = num(settings.boyta);

  const resultOf = (p) => RR.reduce((s, a) => s + (a.s === "in" ? num(p.rr[a.k]) : -num(p.rr[a.k])), 0);
  const driftOf = (p) => DRIFT.reduce((s, k) => s + num(p.rr[k]), 0);
  const assetsOf = (p) => num(p.br.byggnader_mark) + num(p.br.fordringar) + num(p.br.kassa_bank);
  const soliditetOf = (p) => (assetsOf(p) ? num(p.br.eget_kapital) / assetsOf(p) : null);

  if (!latest) {
    return (
      <div style={{ background: T.bg, color: T.ink, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}
        className="flex items-center justify-center p-6">
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14 }} className="p-6 text-center max-w-md">
          <p style={{ fontSize: 15, fontWeight: 600 }}>Ingen data ännu</p>
          <p style={{ color: T.inkSoft, fontSize: 13, marginTop: 6 }}>Gå till "Data &amp; perioder" och lägg till ert första kvartal.</p>
          <button onClick={() => setTab("data")} className="mt-4 px-4 py-2 rounded-lg" style={{ background: T.green, color: "#fff", fontSize: 14, fontWeight: 600 }}>
            Gå till Data &amp; perioder
          </button>
        </div>
      </div>
    );
  }

  const yearLatest = sorted.filter((p) => p.year === latest.year);
  const ackYear = yearLatest.reduce((s, p) => s + resultOf(p), 0);

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: `1px solid ${T.line}`, background: T.surface }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-end justify-between flex-wrap gap-3">
          <div>
            <div style={{ color: T.green, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em" }}>EKONOMISK UPPFÖLJNING · KVARTAL</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{settings.namn}</h1>
          </div>
          <div className="flex gap-5 text-right">
            <Meta label="Senaste period" value={latest.label} />
            <Meta label="Boyta" value={boyta ? `${boyta.toLocaleString("sv-SE")} m²` : "ange"} />
            <Meta label="Perioder" value={sorted.length} />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex gap-1 overflow-x-auto">
            {[["oversikt", "Översikt", LayoutGrid], ["rr", "Resultaträkning", TrendingUp],
              ["br", "Balansräkning", Scale], ["data", "Data & perioder", Settings]].map(([id, lbl, Icon]) => (
              <button key={id} onClick={() => setTab(id)} className="flex items-center gap-2 px-4 py-3 whitespace-nowrap"
                style={{ fontSize: 14, fontWeight: 600, color: tab === id ? T.ink : T.faint,
                  borderBottom: `2px solid ${tab === id ? T.green : "transparent"}` }}>
                <Icon size={15} /> {lbl}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6">
        {tab === "oversikt" && (
          <Overview {...{ sorted, latest, boyta, resultOf, driftOf, soliditetOf, ackYear }} />
        )}
        {tab === "rr" && <RRTable {...{ sorted, resultOf, driftOf, boyta }} />}
        {tab === "br" && <BRTable {...{ sorted, assetsOf, soliditetOf, boyta }} />}
        {tab === "data" && <DataTab {...{ sorted, settings, setSettings, periods, setPeriods }} />}
      </main>

      <footer style={{ color: T.faint, fontSize: 12 }} className="max-w-6xl mx-auto px-5 pb-10">
        Per-kvm och årstakt beräknas på kvartal × 4. Eget kapital är beräknat som tillgångar minus skulder per kvartal
        (inkl. periodens resultat) så att balansen alltid stämmer och soliditeten blir jämförbar mellan kvartal.
        Data sparas lokalt i din webbläsare.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PasswordGate>
      <Dashboard />
    </PasswordGate>
  );
}

/* ---------- shared ---------- */
function Meta({ label, value }) {
  return (<div>
    <div style={{ color: T.faint, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
    <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
  </div>);
}
function KpiTile({ label, value, sub, accent, sign }) {
  const c = sign === undefined ? T.ink : sign >= 0 ? T.green : T.clay;
  return (<div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, borderLeft: `3px solid ${accent}` }} className="px-4 py-3">
    <div style={{ color: T.faint, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
    <div style={{ fontSize: 21, fontWeight: 700, color: c, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ color: T.inkSoft, fontSize: 12, marginTop: 2 }}>{sub}</div>}
  </div>);
}
function Card({ title, hint, children }) {
  return (<div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14 }} className="p-4">
    <div className="flex items-baseline justify-between mb-3 gap-3">
      <h3 style={{ fontSize: 14, fontWeight: 600 }}>{title}</h3>
      {hint && <span style={{ color: T.faint, fontSize: 11 }}>{hint}</span>}
    </div>{children}
  </div>);
}
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (<div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 12 }} className="px-3 py-2 shadow-sm">
    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
    {payload.map((p) => <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {kr(p.value)}</div>)}
  </div>);
}

/* ---------- Overview ---------- */
function Overview({ sorted, latest, boyta, resultOf, driftOf, soliditetOf, ackYear }) {
  const series = sorted.map((p) => ({
    label: p.label, resultat: resultOf(p), likviditet: num(p.br.kassa_bank),
    lan: num(p.br.fastighetslan), drift: driftOf(p), ranta: num(p.rr.rantekostnader),
  }));
  const driftKvm = boyta ? (driftOf(latest) * 4) / boyta : null;
  const skuldKvm = boyta ? num(latest.br.fastighetslan) / boyta : null;
  const avgiftKvm = boyta ? (num(latest.rr.arsavgifter) * 4) / boyta : null;

  return (<div className="space-y-5">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiTile label={`Resultat ${latest.label}`} value={krShort(resultOf(latest))} accent={resultOf(latest) >= 0 ? T.green : T.clay} sign={resultOf(latest)} />
      <KpiTile label={`Resultat ${latest.year} (ack.)`} value={krShort(ackYear)} accent={ackYear >= 0 ? T.green : T.clay} sign={ackYear} />
      <KpiTile label="Likviditet (kassa)" value={krShort(num(latest.br.kassa_bank))} accent={T.blue} />
      <KpiTile label="Fastighetslån" value={krShort(num(latest.br.fastighetslan))} accent={T.gold} />
      <KpiTile label="Skuld / m²" value={skuldKvm != null ? kr(skuldKvm) : "ange boyta"} sub="fastighetslån" accent={T.gold} />
      <KpiTile label="Soliditet" value={pct(soliditetOf(latest))} accent={T.green} />
    </div>
    {driftKvm != null && (
      <div style={{ background: T.greenSoft, border: `1px solid ${T.line}`, borderRadius: 10, color: T.ink, fontSize: 13 }} className="px-4 py-2">
        Driftskostnad i årstakt: <strong>{kr(driftKvm)}/m²</strong> · Årsavgift i årstakt: <strong>{kr(avgiftKvm)}/m²</strong>
      </div>
    )}

    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Resultat per kvartal" hint="grön = överskott · röd = underskott">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={series} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="resultat" name="Resultat" radius={[3, 3, 0, 0]}>
              {series.map((d, i) => <Cell key={i} fill={d.resultat >= 0 ? T.green : T.clay} />)}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Likviditet & fastighetslån" hint="över tid">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <YAxis yAxisId="r" orientation="right" tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="l" dataKey="likviditet" name="Likviditet" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="r" dataKey="lan" name="Fastighetslån" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Driftskostnader per kvartal" hint="säsongsvariation">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={series} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="drift" name="Driftskostnader" radius={[3, 3, 0, 0]} fill={T.blue} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Räntekostnad per kvartal" hint="lägre är bättre">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={series} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="ranta" name="Räntekostnad" radius={[3, 3, 0, 0]} fill={T.gold} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
  </div>);
}

/* ---------- RR comparison table ---------- */
function RRTable({ sorted, resultOf, driftOf, boyta }) {
  const groups = [...new Set(RR.map((a) => a.g))];
  const cell = { padding: "7px 10px", fontSize: 13, textAlign: "right" };
  const head = { ...cell, color: T.faint, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${T.line}` };
  const groupSum = (g, p) => RR.filter((a) => a.g === g).reduce((s, a) => s + (a.s === "in" ? num(p.rr[a.k]) : -num(p.rr[a.k])), 0);

  return (<Card title="Resultaträkning – jämförelse över tid" hint="belopp per period">
    <div className="overflow-x-auto">
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
        <thead><tr>
          <th style={{ ...head, textAlign: "left" }}>Kategori</th>
          {sorted.map((p) => <th key={p.id} style={head}>{p.label}</th>)}
        </tr></thead>
        <tbody>
          {groups.map((g) => (
            <React.Fragment key={g}>
              <tr><td colSpan={sorted.length + 1} style={{ padding: "12px 10px 4px", fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: "0.05em" }}>{g.toUpperCase()}</td></tr>
              {RR.filter((a) => a.g === g).map((a) => (
                <tr key={a.k} style={{ borderBottom: `1px solid ${T.bg}` }}>
                  <td style={{ padding: "7px 10px", fontSize: 13 }}>{a.l}</td>
                  {sorted.map((p) => <td key={p.id} style={cell}>{kr(a.s === "in" ? num(p.rr[a.k]) : -num(p.rr[a.k]))}</td>)}
                </tr>
              ))}
              <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                <td style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600, color: T.inkSoft }}>Summa {g.toLowerCase()}</td>
                {sorted.map((p) => <td key={p.id} style={{ ...cell, fontWeight: 600, color: T.inkSoft }}>{kr(groupSum(g, p))}</td>)}
              </tr>
            </React.Fragment>
          ))}
          <tr style={{ borderTop: `2px solid ${T.ink}` }}>
            <td style={{ padding: "10px", fontWeight: 700 }}>Periodens resultat</td>
            {sorted.map((p) => { const r = resultOf(p); return <td key={p.id} style={{ ...cell, fontWeight: 700, color: r >= 0 ? T.green : T.clay }}>{kr(r)}</td>; })}
          </tr>
          {boyta > 0 && (
            <tr><td style={{ padding: "8px 10px", fontSize: 12, color: T.faint }}>Driftskostnad/m² (årstakt)</td>
              {sorted.map((p) => <td key={p.id} style={{ ...cell, fontSize: 12, color: T.faint }}>{kr((driftOf(p) * 4) / boyta)}</td>)}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>);
}

/* ---------- BR comparison table ---------- */
function BRTable({ sorted, assetsOf, soliditetOf, boyta }) {
  const groups = [...new Set(BR.map((b) => b.g))];
  const cell = { padding: "7px 10px", fontSize: 13, textAlign: "right" };
  const head = { ...cell, color: T.faint, fontSize: 11, fontWeight: 600, borderBottom: `1px solid ${T.line}` };
  const latest = sorted[sorted.length - 1];

  return (<div className="space-y-5">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiTile label="Soliditet" value={pct(soliditetOf(latest))} accent={T.green} />
      <KpiTile label="Eget kapital" value={krShort(num(latest.br.eget_kapital))} accent={T.green} />
      <KpiTile label="Fastighetslån" value={krShort(num(latest.br.fastighetslan))} accent={T.gold} />
      <KpiTile label="Skuld / m²" value={boyta ? kr(num(latest.br.fastighetslan) / boyta) : "ange boyta"} accent={T.gold} />
    </div>
    <Card title="Balansräkning – jämförelse över tid" hint="utgående balans per period">
      <div className="overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
          <thead><tr>
            <th style={{ ...head, textAlign: "left" }}>Post</th>
            {sorted.map((p) => <th key={p.id} style={head}>{p.label}</th>)}
          </tr></thead>
          <tbody>
            {groups.map((g) => (
              <React.Fragment key={g}>
                <tr><td colSpan={sorted.length + 1} style={{ padding: "12px 10px 4px", fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: "0.05em" }}>{g.toUpperCase()}</td></tr>
                {BR.filter((b) => b.g === g).map((b) => (
                  <tr key={b.k} style={{ borderBottom: `1px solid ${T.bg}` }}>
                    <td style={{ padding: "7px 10px", fontSize: 13 }}>{b.l}</td>
                    {sorted.map((p) => <td key={p.id} style={cell}>{kr(num(p.br[b.k]))}</td>)}
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr style={{ borderTop: `2px solid ${T.ink}` }}>
              <td style={{ padding: "10px", fontWeight: 700 }}>Soliditet</td>
              {sorted.map((p) => <td key={p.id} style={{ ...cell, fontWeight: 700, color: T.green }}>{pct(soliditetOf(p))}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>);
}

/* ---------- Data & periods ---------- */
function DataTab({ sorted, settings, setSettings, periods, setPeriods }) {
  const [sForm, setSForm] = useState({ namn: settings.namn, boyta: settings.boyta || "" });
  const [sel, setSel] = useState(sorted.length ? sorted[sorted.length - 1].id : "new");
  const [toast, setToast] = useState("");
  const blank = () => ({ id: "", label: "", year: new Date().getFullYear(), q: 1, date: "",
    rr: Object.fromEntries(RR.map((a) => [a.k, ""])), br: Object.fromEntries(BR.map((b) => [b.k, ""])) });
  const [form, setForm] = useState(() => {
    if (sel === "new") return blank();
    const p = sorted.find((x) => x.id === sel);
    return p ? { ...p, rr: { ...Object.fromEntries(RR.map((a) => [a.k, ""])), ...p.rr },
      br: { ...Object.fromEntries(BR.map((b) => [b.k, ""])), ...p.br } } : blank();
  });

  const selectPeriod = (id) => {
    setSel(id);
    if (id === "new") { setForm(blank()); return; }
    const p = sorted.find((x) => x.id === id);
    if (p) setForm({ ...p, rr: { ...Object.fromEntries(RR.map((a) => [a.k, ""])), ...p.rr },
      br: { ...Object.fromEntries(BR.map((b) => [b.k, ""])), ...p.br } });
  };

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 1800); };
  const inp = { width: "100%", border: `1px solid ${T.line}`, borderRadius: 7, padding: "7px 9px", fontSize: 13, background: "#fff" };
  const lbl = { fontSize: 12, color: T.inkSoft, marginBottom: 3, display: "block" };
  const btn = { background: T.green, color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6 };

  const savePeriod = () => {
    const y = parseInt(form.year, 10), q = parseInt(form.q, 10);
    const id = form.id || `${y}-Q${q}`;
    const date = form.date || `${y}-${String(q * 3).padStart(2, "0")}-${q === 1 || q === 2 || q === 4 ? "31" : "30"}`;
    const label = form.label || `Q${q} ${y}`;
    const rr = {}; RR.forEach((a) => { rr[a.k] = num(form.rr[a.k]); });
    const br = {}; BR.forEach((b) => { br[b.k] = num(form.br[b.k]); });
    const next = [...periods.filter((p) => p.id !== id), { id, label, year: y, q, date, rr, br }];
    setPeriods(next); selectPeriod(id); flash(`${label} sparad`);
  };
  const delPeriod = () => {
    if (sel === "new") return;
    setPeriods(periods.filter((p) => p.id !== sel));
    selectPeriod("new"); flash("Period borttagen");
  };
  const saveSettings = () => {
    setSettings({ namn: sForm.namn, boyta: num(sForm.boyta) });
    flash("Inställningar sparade");
  };

  return (<div className="space-y-5">
    {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", padding: "9px 16px", borderRadius: 10, fontSize: 13, zIndex: 50 }}>{toast}</div>}

    <Card title="Inställningar">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label style={lbl}>Föreningens namn</label>
          <input style={inp} value={sForm.namn} onChange={(e) => setSForm({ ...sForm, namn: e.target.value })} /></div>
        <div><label style={lbl}>Boyta (m²) – tänder per-kvm-talen</label>
          <input style={inp} inputMode="numeric" placeholder="ex. 2132" value={sForm.boyta} onChange={(e) => setSForm({ ...sForm, boyta: e.target.value })} /></div>
      </div>
      <button onClick={saveSettings} style={{ ...btn, marginTop: 14 }}><Save size={15} />Spara inställningar</button>
    </Card>

    <Card title="Perioder" hint={
      <select value={sel} onChange={(e) => selectPeriod(e.target.value)} style={{ border: `1px solid ${T.line}`, borderRadius: 6, padding: "3px 6px", fontSize: 12 }}>
        {sorted.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        <option value="new">+ Ny period</option>
      </select>}>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div><label style={lbl}>Etikett</label><input style={inp} placeholder="Q3 2026" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
        <div><label style={lbl}>År</label><input style={inp} inputMode="numeric" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
        <div><label style={lbl}>Kvartal</label>
          <select style={inp} value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })}>{[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}</select></div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.green, letterSpacing: "0.05em", margin: "2px 0 8px" }}>RESULTATRÄKNING</div>
      {[...new Set(RR.map((a) => a.g))].map((g) => (
        <div key={g} className="mb-4">
          <div style={{ fontSize: 11, color: T.faint, fontWeight: 600, marginBottom: 6 }}>{g}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {RR.filter((a) => a.g === g).map((a) => (
              <div key={a.k}><label style={lbl}>{a.l}</label>
                <input style={inp} inputMode="numeric" placeholder="0" value={form.rr[a.k] ?? ""} onChange={(e) => setForm({ ...form, rr: { ...form.rr, [a.k]: e.target.value } })} /></div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 12, fontWeight: 700, color: T.green, letterSpacing: "0.05em", margin: "8px 0" }}>BALANSRÄKNING (utgående balans)</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        {BR.map((b) => (
          <div key={b.k}><label style={lbl}>{b.l}</label>
            <input style={inp} inputMode="numeric" placeholder="0" value={form.br[b.k] ?? ""} onChange={(e) => setForm({ ...form, br: { ...form.br, [b.k]: e.target.value } })} /></div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: T.faint, marginBottom: 10 }}>Ange kostnader och skulder som positiva tal. Eget kapital = tillgångar − lån − övriga skulder (då stämmer balansen).</p>
      <div className="flex gap-2">
        <button onClick={savePeriod} style={btn}><Plus size={15} />Spara period</button>
        {sel !== "new" && <button onClick={delPeriod} style={{ ...btn, background: T.claySoft, color: T.clay }}><Trash2 size={15} />Ta bort</button>}
      </div>
    </Card>
  </div>);
}
