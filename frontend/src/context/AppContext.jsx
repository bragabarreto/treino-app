import { createContext, useContext, useState, useEffect, useRef } from "react";
import { LS } from "../lib/storage";
import { callAI, testAPIConnection, saveUserDataToCloud, loadUserDataFromCloud } from "../lib/api";
import { EXERCISE_DB_DEFAULT } from "../data/exerciseDatabase";
import { ALL_TREINOS } from "../data/defaultTreinos";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [page, setPage] = useState("treinos");
  const [tab, setTab] = useState("A");
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [calM, setCalM] = useState(new Date().getMonth());

  // Persistent user data — initialize from LS, merge with defaults
  const [marks, setMarks] = useState(() => LS.get("tm7-marks", {}));
  const [logs, setLogs] = useState(() => LS.get("tm7-logs", {}));
  const [exDb, setExDb] = useState(() => {
    const saved = LS.get("tm7-exdb", null);
    return saved ? { ...EXERCISE_DB_DEFAULT, ...saved } : EXERCISE_DB_DEFAULT;
  });
  const [userImages, setUserImages] = useState(() => LS.get("tm7-imgs", {}));
  const [userVideos, setUserVideos] = useState(() => LS.get("tm7-videos", {}));
  const [allTreinos, setAllTreinos] = useState(() => {
    const saved = LS.get("tm7-treinos", null);
    return saved ? { ...ALL_TREINOS, ...saved } : ALL_TREINOS;
  });
  const [monthFeedback, setMonthFeedback] = useState(() => LS.get("tm7-feedback", {}));
  const [rotina, setRotina] = useState(() => LS.get("tm7-rotina", {
    0:[{t:"m",a:[]},{t:"t",a:[]},{t:"n",a:[]}],
    1:[{t:"m",a:[]},{t:"t",a:["🏋️ Treino A Avulso"]},{t:"n",a:["🏐 Vôlei de Praia"]}],
    2:[{t:"m",a:["🏋️ Personal"]},{t:"t",a:["🧘 Pilates"]},{t:"n",a:[]}],
    3:[{t:"m",a:[]},{t:"t",a:["🏋️ Treino B Avulso"]},{t:"n",a:["🏐 Vôlei de Praia"]}],
    4:[{t:"m",a:["🚴 Bicicleta"]},{t:"t",a:["🧘 Pilates"]},{t:"n",a:[]}],
    5:[{t:"m",a:["🏋️ Personal"]},{t:"t",a:[]},{t:"n",a:[]}],
    6:[{t:"m",a:["🚴 Bicicleta"]},{t:"t",a:[]},{t:"n",a:[]}],
  }));
  const [plogs, setPlogs] = useState(() => LS.get("tm7-plogs", []));

  // UI-only state
  const [detailEx, setDetailEx] = useState(null);
  const [dayModal, setDayModal] = useState(null);
  const [dayOpts, setDayOpts] = useState({A:false,B:false,PA:false,PB:false,miss:false});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [showAddEx, setShowAddEx] = useState(false);
  const [addRT, setAddRT] = useState(null);
  const [addRI, setAddRI] = useState("");
  const [pInput, setPInput] = useState("");
  const [pType, setPType] = useState("text");
  const [fotoData, setFotoData] = useState(null);
  const [pLoading, setPLoading] = useState(false);
  const [pResult, setPResult] = useState("");
  const [apiStatus, setApiStatus] = useState(null);
  const [apiMsg, setApiMsg] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle");
  const fileRef = useRef();

  // ── Cloud load on mount ──────────────────────────────────────────────────
  useEffect(() => {
    loadUserDataFromCloud().then(cloudData => {
      if (!cloudData) return;
      if (cloudData.exdb) setExDb(p => ({ ...EXERCISE_DB_DEFAULT, ...cloudData.exdb, ...p }));
      if (cloudData.treinos) setAllTreinos(p => ({ ...ALL_TREINOS, ...cloudData.treinos, ...p }));
      if (cloudData.rotina) setRotina(p => cloudData.rotina);
      if (cloudData.plogs) setPlogs(p => p.length ? p : cloudData.plogs);
      if (cloudData.feedback) setMonthFeedback(p => ({ ...cloudData.feedback, ...p }));
      if (cloudData.videos) setUserVideos(p => ({ ...cloudData.videos, ...p }));
      if (cloudData.logs) setLogs(p => ({ ...cloudData.logs, ...p }));
      if (cloudData.imgs) setUserImages(p => ({ ...cloudData.imgs, ...p }));
    }).catch(() => {});
  }, []);

  // ── Calendar cloud sync ──────────────────────────────────────────────────
  useEffect(() => {
    setSyncStatus("syncing");
    fetch("/api/calendar")
      .then(r => r.json())
      .then(d => {
        if (d.marks && Object.keys(d.marks).length > 0) {
          setMarks(prev => ({ ...prev, ...d.marks }));
        }
        setSyncStatus(d.offline ? "offline" : "synced");
      })
      .catch(() => setSyncStatus("offline"));
  }, []);

  // ── LocalStorage persistence ─────────────────────────────────────────────
  useEffect(() => LS.set("tm7-marks", marks), [marks]);
  useEffect(() => { LS.set("tm7-logs", logs); saveUserDataToCloud("logs", logs).catch(()=>{}); }, [logs]);
  useEffect(() => { LS.set("tm7-exdb", exDb); saveUserDataToCloud("exdb", exDb).catch(()=>{}); }, [exDb]);
  // userImages: agora sincroniza com nuvem (Cloudinary URLs são pequenas)
  useEffect(() => { LS.set("tm7-imgs", userImages); saveUserDataToCloud("imgs", userImages).catch(()=>{}); }, [userImages]);
  useEffect(() => { LS.set("tm7-videos", userVideos); saveUserDataToCloud("videos", userVideos).catch(()=>{}); }, [userVideos]);
  useEffect(() => { if (allTreinos) { LS.set("tm7-treinos", allTreinos); saveUserDataToCloud("treinos", allTreinos).catch(()=>{}); } }, [allTreinos]);
  useEffect(() => { if (monthFeedback) { LS.set("tm7-feedback", monthFeedback); saveUserDataToCloud("feedback", monthFeedback).catch(()=>{}); } }, [monthFeedback]);
  useEffect(() => { LS.set("tm7-rotina", rotina); saveUserDataToCloud("rotina", rotina).catch(()=>{}); }, [rotina]);
  useEffect(() => { LS.set("tm7-plogs", plogs); saveUserDataToCloud("plogs", plogs).catch(()=>{}); }, [plogs]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  function updateEx(id, data) { setExDb(p => ({ ...p, [id]: data })); }
  function deleteEx(id) { setExDb(p => { const n = { ...p }; delete n[id]; return n; }); }
  function updateLog(k, v) { setLogs(p => ({ ...p, [k]: v })); }
  function saveImages(exId, imgs) { setUserImages(p => ({ ...p, [exId]: imgs })); }
  function saveVideo(exId, url) { setUserVideos(p => ({ ...p, [exId]: url })); }

  async function runAPITest() {
    setApiStatus("testing");
    try {
      const r = await testAPIConnection();
      setApiStatus("ok"); setApiMsg(r);
    } catch(e) {
      setApiStatus("error"); setApiMsg(e.message);
    }
  }

  async function saveMarkToCloud(dateKey, markArray) {
    try {
      await fetch("/api/calendar/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey, marks: markArray })
      });
    } catch {}
  }

  function getStats() {
    const days = new Date(calY, calM + 1, 0).getDate();
    let posAvulso = 0, feitosAvulso = 0, feitosPersonal = 0;
    for (let d = 1; d <= days; d++) {
      const dow = new Date(calY, calM, d).getDay();
      const mk = marks[`${calY}-${calM}-${d}`] || [];
      if (dow === 1 || dow === 3) posAvulso++;
      if (mk.includes("A") || mk.includes("B")) feitosAvulso++;
      if (mk.includes("PA") || mk.includes("PB")) feitosPersonal++;
    }
    const pct = posAvulso > 0 ? Math.round(feitosAvulso / posAvulso * 100) : 0;
    return { posAvulso, feitosAvulso, feitosPersonal, feitosTotal: feitosAvulso + feitosPersonal, pct };
  }

  function dayStyle(mk) {
    if (!mk?.length) return { bg: "#1a1a24", bd: "transparent" };
    if (mk.includes("miss")) return { bg: "rgba(239,68,68,.1)", bd: "#ef4444" };
    if ((mk.includes("PA") || mk.includes("PB")) && (mk.includes("A") || mk.includes("B"))) return { bg: "rgba(249,115,22,.2)", bd: "#f97316" };
    if (mk.includes("PA") || mk.includes("PB")) return { bg: "rgba(168,85,247,.2)", bd: "#a855f7" };
    if (mk.includes("A") && mk.includes("B")) return { bg: "rgba(251,191,36,.2)", bd: "#fbbf24" };
    if (mk.includes("A")) return { bg: "rgba(59,130,246,.25)", bd: "#3b82f6" };
    if (mk.includes("B")) return { bg: "rgba(34,197,94,.25)", bd: "#22c55e" };
    return { bg: "#1a1a24", bd: "transparent" };
  }

  function getAvulsoEligibility() {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isEndOfMonth = now.getDate() >= daysInMonth - 3;
    let possible = 0, completed = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(y, m, d).getDay();
      if (dow === 1 || dow === 3) {
        possible++;
        const mk = marks?.[`${y}-${m}-${d}`] || [];
        if (mk.includes("A") || mk.includes("B")) completed++;
      }
    }
    const pct = possible > 0 ? (completed / possible) : 0;
    const feedbackKey = `${y}-${m}`;
    const alreadyUpdated = monthFeedback?.[feedbackKey]?.applied;
    return { eligible: isEndOfMonth && pct > 0.5 && !alreadyUpdated, pct, completed, possible };
  }

  async function savePersonalLog() {
    const content = pType === "text" ? pInput.trim() : (fotoData ? "[FOTO] " : "") + pInput.trim();
    if (!content && !fotoData) { alert("Adicione conteúdo."); return; }
    setPLoading(true); setPResult("");
    try {
      const txt = await callAI([{ role: "user", content: `Analise este treino do personal e responda em português: grupos musculares por bloco, exercícios principais, e recomendação de grupos para os treinos avulsos (segunda e quarta) evitando sobreposição.\n\nTreino:\n${content}` }]);
      setPlogs(p => [{ id: Date.now(), date: new Date().toLocaleDateString("pt-BR"), type: pType, content: content.slice(0, 500), analysis: txt, foto: pType === "foto" ? fotoData : null }, ...p]);
      setPResult("✅ Salvo!\n\n" + txt); setPInput(""); setFotoData(null);
    } catch(e) {
      setPlogs(p => [{ id: Date.now(), date: new Date().toLocaleDateString("pt-BR"), type: pType, content, analysis: "", foto: pType === "foto" ? fotoData : null }, ...p]);
      setPResult("Salvo (sem análise: " + e.message + ")");
    }
    setPLoading(false);
  }

  const value = {
    // Navigation
    page, setPage, tab, setTab,
    // Calendar
    calY, setCalY, calM, setCalM, marks, setMarks, syncStatus, saveMarkToCloud, getStats, dayStyle,
    dayModal, setDayModal, dayOpts, setDayOpts,
    // Workout data
    logs, updateLog, exDb, updateEx, deleteEx,
    userImages, saveImages, userVideos, saveVideo,
    allTreinos, setAllTreinos,
    monthFeedback, setMonthFeedback,
    showFeedbackModal, setShowFeedbackModal,
    showUpdate, setShowUpdate,
    getAvulsoEligibility,
    // Exercise search
    searchQ, setSearchQ, showAddEx, setShowAddEx,
    detailEx, setDetailEx,
    // Rotina
    rotina, setRotina, addRT, setAddRT, addRI, setAddRI,
    // Personal log
    plogs, setPlogs, pInput, setPInput, pType, setPType,
    fotoData, setFotoData, pLoading, pResult, fileRef,
    savePersonalLog,
    // API
    apiStatus, apiMsg, runAPITest,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
