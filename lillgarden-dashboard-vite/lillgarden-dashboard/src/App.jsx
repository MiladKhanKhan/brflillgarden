import React, { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, Bar, Line, LineChart, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ErrorBar,
} from "recharts";
import {
  Settings, LayoutGrid, TrendingUp, Scale, Save, Trash2, Plus, Lightbulb, ChevronRight,
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
  const [focusChart, setFocusChart] = useState(null);
  const [settings, setSettings] = useLocalStorage("brf_lillgarden_settings", DEFAULT_SETTINGS);
  const [periods, setPeriods] = useLocalStorage("brf_lillgarden_periods", SEED_PERIODS);

  const sorted = useMemo(() => [...periods].sort((a, b) => a.date.localeCompare(b.date)), [periods]);
  const latest = sorted[sorted.length - 1];
  const boyta = num(settings.boyta);

  const resultOf = (p) => RR.reduce((s, a) => s + (a.s === "in" ? num(p.rr[a.k]) : -num(p.rr[a.k])), 0);
  const driftOf = (p) => DRIFT.reduce((s, k) => s + num(p.rr[k]), 0);
  const assetsOf = (p) => num(p.br.byggnader_mark) + num(p.br.fordringar) + num(p.br.kassa_bank);
  const soliditetOf = (p) => (assetsOf(p) ? num(p.br.eget_kapital) / assetsOf(p) : null);

  // Klick på KPI-bricka: byt till rätt flik och scrolla till grafen
  const goToChart = (chartTab, anchorId) => {
    setTab(chartTab);
    setFocusChart(anchorId);
  };
  useEffect(() => {
    if (!focusChart) return;
    const t = setTimeout(() => {
      const el = document.getElementById(focusChart);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.transition = "box-shadow .3s";
        el.style.boxShadow = `0 0 0 2px ${T.green}`;
        setTimeout(() => { el.style.boxShadow = "none"; }, 1400);
      }
      setFocusChart(null);
    }, 80);
    return () => clearTimeout(t);
  }, [focusChart, tab]);

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
            {[["oversikt", "Översikt", LayoutGrid], ["insikter", "Insikter", Lightbulb], ["rr", "Resultaträkning", TrendingUp],
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
          <Overview {...{ sorted, latest, boyta, resultOf, driftOf, soliditetOf, ackYear, goToChart }} />
        )}
        {tab === "insikter" && <Insikter {...{ sorted, latest, boyta, resultOf, driftOf, soliditetOf, focusChart }} />}
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
function KpiTile({ label, value, sub, accent, sign, onClick }) {
  const c = sign === undefined ? T.ink : sign >= 0 ? T.green : T.clay;
  const [hover, setHover] = useState(false);
  return (<div onClick={onClick}
    onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{
      background: T.surface, border: `1px solid ${hover && onClick ? accent : T.line}`,
      borderRadius: 12, borderLeft: `3px solid ${accent}`,
      cursor: onClick ? "pointer" : "default",
      transition: "border-color .12s, transform .12s",
      transform: hover && onClick ? "translateY(-1px)" : "none",
    }} className="px-4 py-3">
    <div className="flex items-center justify-between">
      <div style={{ color: T.faint, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      {onClick && <ChevronRight size={13} style={{ color: hover ? accent : T.line }} />}
    </div>
    <div style={{ fontSize: 21, fontWeight: 700, color: c, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ color: T.inkSoft, fontSize: 12, marginTop: 2 }}>{sub}</div>}
  </div>);
}
function Card({ title, hint, children, id }) {
  return (<div id={id} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14 }} className="p-4">
    <div className="flex items-baseline justify-between mb-3 gap-3">
      <h3 style={{ fontSize: 14, fontWeight: 600 }}>{title}</h3>
      {hint && <span style={{ color: T.faint, fontSize: 11 }}>{hint}</span>}
    </div>{children}
  </div>);
}
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (<div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 12 }} className="px-3 py-2 shadow-sm">
    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
    {payload.filter((p) => !Array.isArray(p.value) && p.value != null).map((p) => (
      <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {kr(p.value)}</div>
    ))}
    {row?.isYtd && (
      <div style={{ color: T.faint, marginTop: 4, fontStyle: "italic" }}>Faktiskt utfall hittills i år</div>
    )}
    {row?.isForecast && row?.spann && (
      <div style={{ color: T.faint, marginTop: 4 }}>
        Prognos · spann: {kr(row.spann.worst)} – {kr(row.spann.best)}
      </div>
    )}
    {row?.isForecast && !row?.spann && (
      <div style={{ color: T.faint, marginTop: 4, fontStyle: "italic" }}>Helårsprognos</div>
    )}
  </div>);
}

/* ---------- expandable "Vad ingår?" explanation ---------- */
function Explainer({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}
      style={{ marginTop: 10, borderTop: `1px solid ${T.line}`, paddingTop: 8 }}>
      <summary style={{ cursor: "pointer", fontSize: 11, color: T.faint, fontWeight: 600, listStyle: "none", letterSpacing: "0.05em" }}>
        {open ? "DÖLJ" : "VAD INGÅR?"}
      </summary>
      <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 6, lineHeight: 1.5 }}>{children}</div>
    </details>
  );
}

/* ---------- period/year toggle ---------- */
function ViewToggle({ value, onChange }) {
  const opt = (v, l) => (
    <button onClick={() => onChange(v)}
      style={{
        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
        background: value === v ? T.green : "transparent",
        color: value === v ? "#fff" : T.faint,
        border: `1px solid ${value === v ? T.green : T.line}`,
      }}>{l}</button>
  );
  return <div className="flex gap-1">{opt("y", "År")}{opt("q", "Kvartal")}</div>;
}

/* ---------- Overview ---------- */
function Overview({ sorted, latest, boyta, resultOf, driftOf, soliditetOf, ackYear, goToChart }) {
  const [vResult, setVResult] = useState("y");
  const [vLikv, setVLikv] = useState("y");
  const [vLan, setVLan] = useState("y");
  const [vDrift, setVDrift] = useState("y");
  const [vRanta, setVRanta] = useState("y");
  const [vAvgift, setVAvgift] = useState("y");

  // quarterly series
  const quarterly = useMemo(() => {
    return sorted.map((p) => ({
      label: p.label, year: p.year, q: p.q,
      resultat: resultOf(p),
      likviditet: num(p.br.kassa_bank), lan: num(p.br.fastighetslan),
      drift: driftOf(p), ranta: num(p.rr.rantekostnader),
      arsavgift: num(p.rr.arsavgifter),
    }));
  }, [sorted]);

  // yearly aggregated series with accumulated (running total across years)
  const yearly = useMemo(() => {
    const years = [...new Set(sorted.map((p) => p.year))];
    let running = 0;
    return years.map((y) => {
      const qs = sorted.filter((p) => p.year === y);
      const last = qs[qs.length - 1];
      const sum = (fn) => qs.reduce((s, p) => s + fn(p), 0);
      const res = sum(resultOf);
      running += res;
      return {
        label: String(y), year: y, nQ: qs.length,
        resultat: res, ackumulerat: running,
        likviditet: num(last.br.kassa_bank), lan: num(last.br.fastighetslan),
        drift: sum(driftOf), ranta: sum((p) => num(p.rr.rantekostnader)),
        arsavgift: sum((p) => num(p.rr.arsavgifter)),
      };
    });
  }, [sorted]);

  /* ---- Säsongsbaserad prognos (metod 2) för innevarande, ofullständigt år ----
     Princip: för varje kvartal som saknas, använd samma kvartal föregående år
     som mall, men justera kända poster (årsavgift, ränta, avskrivningar) till
     årets faktiska nivå. Tillämpas på resultat, drift och ränta.
     Dessutom: om ett kvartal i innevarande år har 0 i räntekostnad men det
     finns "upplupna räntekostnader" i balansräkningen, behandla det som om
     räntan vore bokförd – det är bara en periodiseringseffekt. */
  const forecastData = useMemo(() => {
    const curYear = latest.year;
    const curQs = sorted.filter((p) => p.year === curYear);
    if (curQs.length >= 4 || curQs.length === 0) return null;

    // Verklig kvartalsränta: senaste nollskilda värdet i år, annars föreg. års snitt
    const rantaVals = curQs.map((p) => num(p.rr.rantekostnader)).filter((v) => v > 0);
    const prevYearQs = sorted.filter((p) => p.year === curYear - 1);
    const rantaQ = rantaVals.length
      ? rantaVals[rantaVals.length - 1]
      : prevYearQs.reduce((s, p) => s + num(p.rr.rantekostnader), 0) / (prevYearQs.length || 1);

    const adjResultOf = (p) => {
      if (num(p.rr.rantekostnader) > 0) return resultOf(p);
      return resultOf(p) - rantaQ;
    };
    const adjRantaOf = (p) => (num(p.rr.rantekostnader) > 0 ? num(p.rr.rantekostnader) : rantaQ);

    const ytdRes = curQs.reduce((s, p) => s + adjResultOf(p), 0);
    const ytdDrift = curQs.reduce((s, p) => s + driftOf(p), 0);
    const ytdRanta = curQs.reduce((s, p) => s + adjRantaOf(p), 0);

    const ytdAvgift = curQs.reduce((s, p) => s + num(p.rr.arsavgifter), 0);

    const arsavgQ = num(latest.rr.arsavgifter);
    const avskrQ = 144273;
    const curYearNum = curYear;
    const ytdLabel = `${curYearNum}`;

    const missingQs = [1, 2, 3, 4].filter((q) => !curQs.some((p) => p.q === q));
    let base = ytdRes, best = ytdRes, worst = ytdRes;
    let driftBase = ytdDrift, driftBest = ytdDrift, driftWorst = ytdDrift;
    let rantaBase = ytdRanta;

    for (const q of missingQs) {
      const candidates = sorted.filter((p) => p.q === q && p.year < curYear);
      if (!candidates.length) {
        const rate = ytdRes / curQs.length;
        base += rate; best += rate; worst += rate;
        driftBase += ytdDrift / curQs.length;
        driftBest += ytdDrift / curQs.length;
        driftWorst += ytdDrift / curQs.length;
        rantaBase += rantaQ;
        continue;
      }
      const tmpl = candidates[candidates.length - 1];
      const adjRR = { ...tmpl.rr, arsavgifter: arsavgQ, rantekostnader: rantaQ, avskrivningar: avskrQ };
      const adjResult = RR.reduce((s, a) => s + (a.s === "in" ? num(adjRR[a.k]) : -num(adjRR[a.k])), 0);
      const tmplDrift = DRIFT.reduce((s, k) => s + num(adjRR[k]), 0);
      const drifts = candidates.map(driftOf);
      const minDrift = Math.min(...drifts), maxDrift = Math.max(...drifts);
      base += adjResult;
      best += adjResult + (tmplDrift - minDrift);
      worst += adjResult - (maxDrift - tmplDrift);
      driftBase += tmplDrift;
      driftBest += minDrift;
      driftWorst += maxDrift;
      rantaBase += rantaQ;
    }

    return {
      curYear,
      ytdRow: {
        label: ytdLabel, isYtd: true,
        resultat: ytdRes, drift: ytdDrift, ranta: ytdRanta, arsavgift: ytdAvgift,
        likviditet: num(latest.br.kassa_bank), lan: num(latest.br.fastighetslan),
      },
      forecastRow: {
        label: "Prognos", isForecast: true,
        resultat: base, err: [base - worst, best - base], spann: { best, worst },
        drift: driftBase,
        driftErr: [driftBase - driftBest, driftWorst - driftBase],
        driftSpann: { best: driftBest, worst: driftWorst },
        ranta: rantaBase,
        arsavgift: arsavgQ * 4,
        likviditet: num(latest.br.kassa_bank), lan: num(latest.br.fastighetslan),
      },
    };
  }, [sorted, latest]);

  // I årsvyn: visa tidigare år som vanligt, plus två staplar för innevarande år
  // (YTD och prognos) sida vid sida.
  const buildYearSeries = (extraFields = []) => {
    if (!forecastData) return yearly;
    const completed = yearly.slice(0, -1);
    const ytd = forecastData.ytdRow;
    const fc = forecastData.forecastRow;
    const prevAccum = completed.length ? completed[completed.length - 1].ackumulerat : 0;
    return [
      ...completed,
      // YTD: ingen ackumulerat-punkt så linjen hoppar inte fram och tillbaka
      { ...ytd, ackumulerat: null },
      { ...fc, ackumulerat: prevAccum + fc.resultat },
    ];
  };

  // utan prognos-stapel: tidigare år + innevarande år (senaste utfall)
  const buildYearSeriesNoForecast = () => {
    if (!forecastData) return yearly;
    const completed = yearly.slice(0, -1);
    const ytd = forecastData.ytdRow;
    return [...completed, { ...ytd, ackumulerat: null }];
  };

  const resultSeries = vResult === "q" ? quarterly : buildYearSeries();
  const likvSeries = vLikv === "q" ? quarterly : yearly;
  const lanSeries = vLan === "q" ? quarterly : yearly;
  const driftSeries = vDrift === "q" ? quarterly : buildYearSeries().map(r =>
    r.isForecast ? { ...r, err: r.driftErr, spann: r.driftSpann } : r
  );
  const rantaSeries = vRanta === "q" ? quarterly : buildYearSeriesNoForecast();

  // Årsavgift i kr/m² i årstakt
  // - Kvartal: (kvartalsavgift × 4) / boyta
  // - Helår (komplett): årssumma / boyta
  // - YTD: (ytd × 4 / antal kvartal) / boyta = annualiserat
  const avgiftSeries = useMemo(() => {
    if (!boyta) return [];
    if (vAvgift === "q") {
      return quarterly.map((d) => ({ ...d, avgiftKvm: (d.arsavgift * 4) / boyta }));
    }
    const ys = buildYearSeriesNoForecast();
    return ys.map((d) => {
      if (d.isYtd && forecastData) {
        const nQ = sorted.filter((p) => p.year === forecastData.curYear).length;
        return { ...d, avgiftKvm: (d.arsavgift * 4 / nQ) / boyta };
      }
      return { ...d, avgiftKvm: d.arsavgift / boyta };
    });
  }, [vAvgift, quarterly, yearly, forecastData, boyta, sorted]);

  const driftKvm = boyta ? (driftOf(latest) * 4) / boyta : null;
  const skuldKvm = boyta ? num(latest.br.fastighetslan) / boyta : null;
  const avgiftKvm = boyta ? (num(latest.rr.arsavgifter) * 4) / boyta : null;

  return (<div className="space-y-5">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiTile label={`Resultat ${latest.label}`} value={krShort(resultOf(latest))} accent={resultOf(latest) >= 0 ? T.green : T.clay} sign={resultOf(latest)} onClick={() => goToChart("oversikt", "chart-resultat")} />
      <KpiTile label={`Resultat ${latest.year} (ack.)`} value={krShort(ackYear)} accent={ackYear >= 0 ? T.green : T.clay} sign={ackYear} onClick={() => goToChart("oversikt", "chart-resultat")} />
      <KpiTile label="Likviditet (kassa)" value={krShort(num(latest.br.kassa_bank))} accent={T.blue} onClick={() => goToChart("oversikt", "chart-likviditet")} />
      <KpiTile label="Fastighetslån" value={krShort(num(latest.br.fastighetslan))} accent={T.gold} onClick={() => goToChart("oversikt", "chart-lan")} />
      <KpiTile label="Skuld / m²" value={skuldKvm != null ? kr(skuldKvm) : "ange boyta"} sub="se skala →" accent={T.gold} onClick={() => goToChart("insikter", "chart-skuldkvm")} />
      <KpiTile label="Soliditet" value={pct(soliditetOf(latest))} accent={T.green} onClick={() => goToChart("insikter", "chart-skuldkvm")} />
    </div>
    {driftKvm != null && (
      <div style={{ background: T.greenSoft, border: `1px solid ${T.line}`, borderRadius: 10, color: T.ink, fontSize: 13 }} className="px-4 py-2">
        Driftskostnad i årstakt: <strong>{kr(driftKvm)}/m²</strong> · Årsavgift i årstakt: <strong>{kr(avgiftKvm)}/m²</strong>
      </div>
    )}

    <div className="grid lg:grid-cols-2 gap-5">
      <Card id="chart-resultat" title="Resultat" hint={<ViewToggle value={vResult} onChange={setVResult} />}>
        <p style={{ fontSize: 11, color: T.faint, marginTop: -6, marginBottom: 6 }}>
          {vResult === "q"
            ? "resultat per kvartal · grön = överskott, röd = underskott"
            : "helår · 2026 = utfall hittills, Prognos = helårsuppskattning · felstapel = osäkerhetsspann"}
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={resultSeries} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="resultat" name={vResult === "q" ? "Resultat" : "Helårsresultat"} radius={[3, 3, 0, 0]}>
              {resultSeries.map((d, i) => {
                const fill = d.resultat >= 0 ? T.green : T.clay;
                const opacity = d.isForecast ? 0.45 : d.isYtd ? 0.75 : 1;
                return <Cell key={i} fill={fill} fillOpacity={opacity} />;
              })}
              {vResult === "y" && <ErrorBar dataKey="err" width={8} strokeWidth={2} stroke={T.ink} />}
            </Bar>
            {vResult === "y" && <Line dataKey="ackumulerat" name="Ackumulerat" stroke={T.ink} strokeWidth={2} dot={{ r: 3 }} />}
          </ComposedChart>
        </ResponsiveContainer>
        <Explainer>
          <strong>Resultat</strong> = totala intäkter minus totala kostnader för perioden. För BRF Lillgården består det av:
          <ul style={{ marginTop: 4, paddingLeft: 18, listStyle: "disc" }}>
            <li><strong>Intäkter:</strong> årsavgifter, debiterad el och vatten till medlemmar, p-platsavgifter, pantsättnings- och överlåtelseavgifter.</li>
            <li><strong>Driftskostnader:</strong> el, vatten, avfall, försäkring, bredband, skötsel &amp; underhåll (se egen graf nedan).</li>
            <li><strong>Förvaltning &amp; admin:</strong> förvaltningsarvode, revision, bankkostnader, övrig administration.</li>
            <li><strong>Personal:</strong> löner och arbetsgivaravgifter (förekommer främst Q2).</li>
            <li><strong>Avskrivningar:</strong> ~144 tkr/kvartal, deterministisk bokföringspost för byggnaden.</li>
            <li><strong>Räntekostnad:</strong> egen graf nedan.</li>
          </ul>
        </Explainer>
      </Card>

      <Card id="chart-likviditet" title="Likviditet" hint={<ViewToggle value={vLikv} onChange={setVLikv} />}>
        <p style={{ fontSize: 11, color: T.faint, marginTop: -6, marginBottom: 6 }}>kassa & bank, utgående saldo per period</p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={likvSeries} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="likviditet" name="Likviditet" fill={T.blue} radius={[3, 3, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
        <Explainer>
          <strong>Likviditet</strong> = saldot på föreningens bankkonton vid periodens slut. Hos er ligger pengarna huvudsakligen på SEB-kontot (1930). Beloppet visar hur mycket kontanta medel föreningen har att röra sig med – för löpande betalningar, oförutsedda reparationer och buffert mot ränteuppgångar. Det är inte samma sak som föreningens resultat: ett bra resultat kan finnas på papperet (t.ex. via avskrivningar som inte är kassaflöde) utan att likviditeten ökar lika mycket.
        </Explainer>
      </Card>

      <Card id="chart-lan" title="Fastighetslån" hint={<ViewToggle value={vLan} onChange={setVLan} />}>
        <p style={{ fontSize: 11, color: T.faint, marginTop: -6, marginBottom: 6 }}>utgående skuld per period</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lanSeries} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} domain={["auto", "auto"]} />
            <Tooltip content={<ChartTip />} />
            <Line dataKey="lan" name="Fastighetslån" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <Explainer>
          <strong>Fastighetslån</strong> = den totala skulden till kreditinstitut vid periodens slut, dvs. lånen som finansierar byggnaden. Sedan 2025 har Lillgården två lån, båda hos Stadshypotek:
          <ul style={{ marginTop: 4, paddingLeft: 18, listStyle: "disc" }}>
            <li>Lån 17-332848-461366: 16 000 000 kr (amorteringsfritt under perioden som visas).</li>
            <li>Lån 17-332848-461369: ca 7,87 mkr (amorteras med ~62 500 kr per kvartal, dvs. 250 tkr/år).</li>
          </ul>
          Den löpande nedgången i grafen är alltså amorteringen av det mindre lånet. Det är den här siffran som ligger till grund för nyckeltalet <em>skuld per kvadratmeter</em>, det enskilt viktigaste hälsomåttet för en BRF.
        </Explainer>
      </Card>

      <Card title="Driftskostnader" hint={<ViewToggle value={vDrift} onChange={setVDrift} />}>
        <p style={{ fontSize: 11, color: T.faint, marginTop: -6, marginBottom: 6 }}>
          {vDrift === "q" ? "säsongsvariation per kvartal" : "helår · 2026 = utfall hittills, Prognos = helårsuppskattning · felstapel = osäkerhetsspann"}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={driftSeries} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="drift" name="Driftskostnader" radius={[3, 3, 0, 0]}>
              {driftSeries.map((d, i) => {
                const opacity = d.isForecast ? 0.45 : d.isYtd ? 0.75 : 1;
                return <Cell key={i} fill={T.blue} fillOpacity={opacity} />;
              })}
              {vDrift === "y" && <ErrorBar dataKey="err" width={8} strokeWidth={2} stroke={T.ink} />}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        <Explainer>
          <strong>Driftskostnader</strong> är de löpande kostnaderna för att driva fastigheten. I dashboarden ingår sex poster, motsvarande BAS-kontona 4xxx:
          <ul style={{ marginTop: 4, paddingLeft: 18, listStyle: "disc" }}>
            <li><strong>Fastighetsel</strong> (konto 4611) – den i särklass största posten, varierar kraftigt med säsong.</li>
            <li><strong>Vatten</strong> (4630) – relativt stabil, runt 12–13 tkr per kvartal.</li>
            <li><strong>Avfall &amp; renhållning</strong> (4640) – fast taxa via kommunen.</li>
            <li><strong>Fastighetsförsäkring</strong> (4710) – bokförs delvis ojämnt över året.</li>
            <li><strong>Bredband</strong> (4762) – fast månadsabonnemang.</li>
            <li><strong>Skötsel &amp; underhåll</strong> (4513, 4549, 4570, 4571) – serviceavtal, utemiljö, besiktningar och löpande underhåll.</li>
          </ul>
          Ingår <strong>inte</strong> här: avskrivningar, räntekostnader, förvaltnings- och revisionsarvoden, personalkostnader – dessa redovisas separat.
        </Explainer>
      </Card>

      <Card title="Räntekostnad" hint={<ViewToggle value={vRanta} onChange={setVRanta} />}>
        <p style={{ fontSize: 11, color: T.faint, marginTop: -6, marginBottom: 6 }}>
          {vRanta === "q" ? "lägre är bättre · 0-kvartal = upplupen ränta i balansräkningen" : "helår · 2026 visar utfall hittills (justerat för upplupen ränta)"}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={rantaSeries} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={krShort} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="ranta" name="Räntekostnad" radius={[3, 3, 0, 0]}>
              {rantaSeries.map((d, i) => {
                const opacity = d.isForecast ? 0.45 : d.isYtd ? 0.75 : 1;
                return <Cell key={i} fill={T.gold} fillOpacity={opacity} />;
              })}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        <Explainer>
          <strong>Räntekostnad</strong> = den ränta föreningen betalar till sina långivare på fastighetslånen (BAS-konto 8415, "räntekostnader för andra skulder till kreditinstitut"). Det är en separat post från själva amorteringen – amorteringen minskar lånet (syns i grafen ovan), räntan är en löpande kostnad som påverkar resultatet.
          <p style={{ marginTop: 6 }}>
            Ingår även <strong>upplupna räntekostnader</strong>: även när ett kvartal visar 0 i bokförd ränta (t.ex. Q2 2026) räknar dashboarden med periodens verkliga räntebelastning, eftersom obetald ränta då ligger som en upplupen kostnad i balansräkningen (konto 2960). Det är en periodiseringseffekt – inte att räntan försvann.
          </p>
          <p style={{ marginTop: 6 }}>
            Räntan har sjunkit kraftigt de senaste två åren från ~270 tkr/kvartal under 2023–2024 till ~149 tkr/kvartal under 2026, både genom amortering och lägre marknadsränta.
          </p>
        </Explainer>
      </Card>

      <Card title="Årsavgift" hint={<ViewToggle value={vAvgift} onChange={setVAvgift} />}>
        <p style={{ fontSize: 11, color: T.faint, marginTop: -6, marginBottom: 6 }}>
          {boyta
            ? (vAvgift === "q"
                ? "kvartalets avgift annualiserad och uttryckt per kvadratmeter"
                : "helår per kvadratmeter · 2026 visar nivån hittills, annualiserad")
            : "ange boyta under Data & perioder för att räkna fram kr/m²"}
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={avgiftSeries} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => kr(v)} tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} width={70} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="avgiftKvm" name="Årsavgift kr/m²" radius={[3, 3, 0, 0]}>
              {avgiftSeries.map((d, i) => {
                const opacity = d.isForecast ? 0.45 : d.isYtd ? 0.75 : 1;
                return <Cell key={i} fill={T.green} fillOpacity={opacity} />;
              })}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        <Explainer>
          <strong>Årsavgift kr/m²</strong> är ett centralt nyckeltal för att jämföra BRF:er med varandra: hur mycket medlemmarna betalar per kvadratmeter och år. Måttet räknas i <em>årstakt</em>, dvs. för enskilda kvartal multipliceras kvartalsavgiften med fyra, och YTD-stapeln annualiseras (faktiskt hittills × 4/antal kvartal).
          <p style={{ marginTop: 6 }}>
            Hos Lillgården låg avgiften på ~756 kr/m² under 2023, höjdes till ~787 kr/m² 2024, och har sedan dess sjunkit i takt med lägre räntekostnader – till ~637 kr/m² 2025 och en prognostiserad nivå på ~547 kr/m² för 2026. För jämförelse: snittet bland svenska BRF:er ligger normalt på 500–800 kr/m², och &gt;1 000 kr/m² betraktas som högt.
          </p>
        </Explainer>
      </Card>
    </div>
  </div>);
}

/* ---------- Skuld/m² skala (gauge) ---------- */
function SkuldGauge({ value, boyta, lan }) {
  // Zoner enligt branschtumregler (kr/m² totalyta)
  const max = 18000;
  const zones = [
    { to: 5000, color: "#2E6F5E", label: "Låg / bra" },
    { to: 10000, color: "#B8893B", label: "Måttlig" },
    { to: 15000, color: "#C9762F", label: "Hög" },
    { to: max, color: "#B4533C", label: "Riskfylld" },
  ];
  const W = 700, H = 96, pad = 16, barY = 46, barH = 26;
  const x = (v) => pad + (Math.min(v, max) / max) * (W - 2 * pad);
  const markerX = x(value);
  const curZone = zones.find((z) => value <= z.to) || zones[zones.length - 1];

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 520 }}>
          {/* zonsegment */}
          {zones.map((z, i) => {
            const from = i === 0 ? 0 : zones[i - 1].to;
            return (
              <g key={i}>
                <rect x={x(from)} y={barY} width={x(z.to) - x(from)} height={barH} fill={z.color} fillOpacity={0.85}
                  rx={i === 0 ? 5 : 0} />
                <text x={(x(from) + x(z.to)) / 2} y={barY + barH + 15} textAnchor="middle"
                  fontSize="10.5" fill={T.inkSoft} fontWeight="600">{z.label}</text>
                <text x={x(z.to)} y={barY - 6} textAnchor="middle" fontSize="9.5" fill={T.faint}>
                  {Math.round(z.to / 1000)}k
                </text>
              </g>
            );
          })}
          {/* nuvarande värde-markör */}
          <g transform={`translate(${markerX},0)`}>
            <line x1="0" y1={barY - 4} x2="0" y2={barY + barH + 4} stroke={T.ink} strokeWidth="2.5" />
            <polygon points="0,38 -6,28 6,28" fill={T.ink} />
            <rect x="-42" y="6" width="84" height="20" rx="5" fill={T.ink} />
            <text x="0" y="20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{kr(value)}</text>
          </g>
        </svg>
      </div>
      <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4 }}>
        Lillgården ligger på <strong style={{ color: curZone.color }}>{kr(value)}/m²</strong> ({curZone.label.toLowerCase()}) –
        {" "}{kr(lan)} i fastighetslån fördelat på {boyta.toLocaleString("sv-SE")} m².
      </div>
    </div>
  );
}


function Insikter({ sorted, latest, boyta, resultOf, driftOf, soliditetOf, focusChart }) {
  const prior = sorted.slice(0, -1);
  const sameQ = prior.filter((p) => p.q === latest.q);
  const prevQ = sorted[sorted.length - 2];

  // Avvikelser per RR-rad: jämför senaste kvartalet mot referens
  // (snitt av samma kvartal tidigare år; faller tillbaka på snitt av alla tidigare kvartal)
  // Avskrivningar och räntekostnader exkluderas – de styrs av periodisering/bokföringstidpunkt
  // snarare än verksamheten, och hanteras separat under rekommendationer.
  const flows = RR.filter((a) => a.k !== "avskrivningar" && a.k !== "rantekostnader" && a.k !== "ranteintakter");
  const deviations = flows.map((a) => {
    const now = num(latest.rr[a.k]);
    const ref = sameQ.length
      ? sameQ.reduce((s, p) => s + num(p.rr[a.k]), 0) / sameQ.length
      : (prior.length ? prior.reduce((s, p) => s + num(p.rr[a.k]), 0) / prior.length : 0);
    const diff = now - ref;
    const relevantBase = Math.max(Math.abs(ref), 5000); // ignorera mikroposter
    const pctChange = ref !== 0 ? diff / Math.abs(ref) : (now !== 0 ? 1 : 0);
    return { ...a, now, ref, diff, pctChange, relevantBase };
  });

  // Filtrera: väsentlig storlek (>15 tkr absolut) OCH stor relativ ändring (>25%)
  const flagged = deviations
    .filter((d) => Math.abs(d.diff) > 15000 && Math.abs(d.pctChange) > 0.25 && d.relevantBase >= 5000)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  // För avvikelse: är ökningen bra eller dålig? Intäkt upp = bra, kostnad upp = dålig.
  const isGood = (d) => (d.s === "in" ? d.diff > 0 : d.diff < 0);

  // ---- Rekommendationer (regelbaserade) ----
  const recs = [];
  const soliditet = soliditetOf(latest);
  const likviditet = num(latest.br.kassa_bank);
  const lan = num(latest.br.fastighetslan);
  const ranta = num(latest.rr.rantekostnader);
  const upplupenRanta = ranta === 0; // 0 bokförd = sannolikt upplupen
  const driftYtdQ = driftOf(latest);
  const skuldKvm = boyta ? lan / boyta : null;

  if (upplupenRanta) {
    recs.push({
      tone: "warn",
      title: "Räntekostnaden är inte bokförd detta kvartal",
      body: "Kvartalet visar 0 kr i räntekostnad, men räntan ligger sannolikt upplupen i balansräkningen (konto 2960). Det får resultatet att se ~149 tkr bättre ut än det faktiskt är. Räkna med den verkliga räntan när ni bedömer kvartalets resultat, och stäm av att den bokförs ikapp nästa period.",
    });
  }
  if (latest.q === 1 && resultOf(latest) < 0) {
    recs.push({
      tone: "info",
      title: "Negativt Q1 är normalt – inte ett varningstecken",
      body: "Q1 går nästan alltid back i en BRF på grund av vinterns el- och uppvärmningskostnader plus full kvartalsränta. Underskottet brukar tas igen under Q2–Q3. Undvik att dra slutsatser om helåret utifrån Q1 ensamt.",
    });
  }
  // Likviditetsbuffert i förhållande till kvartalets kassakostnader
  // (exkl. avskrivningar som inte är kassaflöde; ränta räknas till verklig nivå)
  const rantaQreal = ranta > 0 ? ranta : (() => {
    const h = sorted.map((p) => num(p.rr.rantekostnader)).filter((v) => v > 0);
    return h.length ? h[h.length - 1] : 0;
  })();
  const kvartalskostnad = RR
    .filter((a) => a.s === "out" && a.k !== "avskrivningar" && a.k !== "rantekostnader")
    .reduce((s, a) => s + num(latest.rr[a.k]), 0) + rantaQreal;
  const monthsBuffer = kvartalskostnad ? (likviditet / (kvartalskostnad / 3)) : null;
  if (monthsBuffer != null && monthsBuffer < 3) {
    recs.push({
      tone: "warn",
      title: "Tunn likviditetsbuffert",
      body: `Kassan (${kr(likviditet)}) motsvarar ungefär ${monthsBuffer.toFixed(1)} månaders kostnader. En vanlig tumregel är minst 2–3 månader plus buffert för planerat underhåll. Se över om kommande underhåll kräver att likviditeten byggs upp.`,
    });
  } else if (monthsBuffer != null) {
    recs.push({
      tone: "good",
      title: "God likviditet",
      body: `Kassan (${kr(likviditet)}) räcker till ungefär ${monthsBuffer.toFixed(1)} månaders löpande kostnader, vilket ger en sund buffert mot oförutsedda utgifter och ränteuppgångar.`,
    });
  }
  if (soliditet != null && soliditet >= 0.6) {
    recs.push({
      tone: "good",
      title: `Stark soliditet (${pct(soliditet)})`,
      body: "Föreningen har en låg belåning i förhållande till tillgångarna. Det ger god motståndskraft, men innebär också att ni har utrymme att antingen amortera mindre och hålla avgiften låg, eller fortsätta amortera för att minska räntekänsligheten – ett strategiskt vägval för styrelsen.",
    });
  } else if (soliditet != null && soliditet < 0.3) {
    recs.push({
      tone: "warn",
      title: `Låg soliditet (${pct(soliditet)})`,
      body: "Hög belåning i förhållande till tillgångarna gör föreningen känslig för ränteuppgångar. Överväg en amorteringsplan och var försiktig med avgiftssänkningar.",
    });
  }
  if (skuldKvm != null) {
    const lvl = skuldKvm > 15000 ? "hög" : skuldKvm > 8000 ? "måttlig" : "låg";
    recs.push({
      tone: skuldKvm > 15000 ? "warn" : "info",
      title: `Skuldsättning per m²: ${kr(skuldKvm)} (${lvl})`,
      body: skuldKvm > 15000
        ? "Skuld per kvadratmeter över ~15 000 kr räknas som hög och innebär betydande räntekänslighet. Amortering bör prioriteras."
        : "Skuld per kvadratmeter är det viktigaste jämförelsemåttet mellan föreningar. Er nivå är hanterbar; fortsätt följa utvecklingen i takt med amorteringen.",
    });
  }
  // Räntetrend
  const rantaHistory = sorted.map((p) => num(p.rr.rantekostnader)).filter((v) => v > 0);
  if (rantaHistory.length >= 4) {
    const early = rantaHistory.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const lateVals = rantaHistory.slice(-2);
    const late = lateVals.reduce((a, b) => a + b, 0) / 2;
    if (late < early * 0.7) {
      recs.push({
        tone: "good",
        title: "Räntekostnaden trendar tydligt nedåt",
        body: "Räntekostnaden per kvartal har minskat väsentligt över tid, både genom amortering och lägre marknadsränta. Det frigör utrymme i ekonomin – men planera för att räntan kan vända upp igen vid omsättning av lånen.",
      });
    }
  }

  const toneStyle = {
    warn: { bg: T.claySoft, border: T.clay, label: "ATT BEVAKA" },
    good: { bg: T.greenSoft, border: T.green, label: "STYRKA" },
    info: { bg: "#EEF1F5", border: T.blue, label: "ATT NOTERA" },
  };

  return (<div className="space-y-5">
    {boyta > 0 && (
      <Card id="chart-skuldkvm" title="Skuldsättning per m² – var ni ligger"
        hint="branschtumregler för totalyta">
        <SkuldGauge value={lan / boyta} boyta={boyta} lan={lan} />
        <div style={{ marginTop: 14, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: T.faint, fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>UTVECKLING ÖVER TID</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={sorted.map((p) => ({ label: p.label, skuldKvm: num(p.br.fastighetslan) / boyta }))}
              margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid stroke={T.line} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.faint }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tickFormatter={krShort} tick={{ fontSize: 10, fill: T.faint }} axisLine={false} tickLine={false} width={48} domain={["auto", "auto"]} />
              <Tooltip content={<ChartTip />} />
              <Line dataKey="skuldKvm" name="Skuld/m²" stroke={T.gold} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <Explainer>
          <strong>Skuld per m²</strong> (lån delat på totalyta) är det viktigaste jämförelsemåttet mellan BRF:er och blev obligatoriskt i årsredovisningen från 2023. Vedertagna tumregler: under 5 000 kr/m² = låg/bra, 5 000–10 000 = måttlig, 10 000–15 000 = hög, över 15 000 = riskfylld. En hög siffra är inte automatiskt dålig – den måste vägas mot fastighetens skick och kommande underhåll. En nybildad förening eller en som nyss bytt stammar/tak/fönster kan motivera högre belåning. Lillgården amorterar aktivt (~250 tkr/år), så talet sjunker stadigt över tid.
        </Explainer>
      </Card>
    )}
    <Card title={`Avvikelser i resultaträkningen – ${latest.label}`}
      hint={sameQ.length ? `jämfört med samma kvartal tidigare år` : `jämfört med tidigare kvartal`}>
      {flagged.length === 0 ? (
        <p style={{ color: T.inkSoft, fontSize: 14 }}>Inga väsentliga avvikelser detta kvartal – posterna ligger i linje med tidigare perioder.</p>
      ) : (
        <div className="space-y-2">
          {flagged.map((d) => {
            const good = isGood(d);
            return (
              <div key={d.k} className="flex items-start justify-between gap-3"
                style={{ padding: "10px 12px", borderRadius: 10, background: good ? T.greenSoft : T.claySoft, border: `1px solid ${T.line}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{d.l}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                    {kr(d.now)} detta kvartal mot referens {kr(d.ref)}
                  </div>
                </div>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: good ? T.green : T.clay }}>
                    {d.diff >= 0 ? "+" : ""}{kr(d.diff)}
                  </div>
                  <div style={{ fontSize: 11, color: T.faint }}>
                    {d.pctChange >= 0 ? "+" : ""}{Math.round(d.pctChange * 100)}%
                  </div>
                </div>
              </div>
            );
          })}
          <p style={{ fontSize: 11, color: T.faint, marginTop: 6 }}>
            Grönt = gynnsam avvikelse (högre intäkt eller lägre kostnad), rött = ogynnsam. Endast poster som avviker med mer än 15 tkr och 25 % visas.
          </p>
        </div>
      )}
    </Card>

    <Card title="Rekommendationer för perioden">
      <div className="space-y-3">
        {recs.map((r, i) => {
          const ts = toneStyle[r.tone];
          return (
            <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: ts.bg, borderLeft: `3px solid ${ts.border}` }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: ts.border, marginBottom: 3 }}>{ts.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{r.title}</div>
              <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{r.body}</div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: T.faint, marginTop: 12 }}>
        Rekommendationerna genereras automatiskt utifrån periodens nyckeltal och är ett stöd för styrelsediskussion – inte finansiell rådgivning. Stäm alltid av mot förvaltarens underlag.
      </p>
    </Card>
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
