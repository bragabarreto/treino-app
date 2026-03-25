import { AppProvider, useApp } from "./context/AppContext";
import Nav from "./components/Nav";
import TreinosPage from "./pages/TreinosPage";
import PersonalPage from "./pages/PersonalPage";
import CalendarioPage from "./pages/CalendarioPage";
import ExerciciosPage from "./pages/ExerciciosPage";
import RotinaPage from "./pages/RotinaPage";
import DayModal from "./components/calendar/DayModal";
import ExerciseModal from "./components/exercise/ExerciseModal";
import FeedbackModal from "./components/workout/FeedbackModal";
import UpdatePanel from "./components/workout/UpdatePanel";
import AddExerciseModal from "./components/exercise/AddExerciseModal";

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,900&display=swap');

  :root {
    --bg:    #07070d;
    --s1:    #0f0f18;
    --s2:    #131320;
    --s3:    #1a1a2a;
    --bd1:   #1c1c2e;
    --bd2:   #26263a;
    --t1:    #eeeef8;
    --t2:    #a8a8c0;
    --t3:    #5a5a72;
    --t4:    #2e2e46;
  }

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes fadeIn   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer  { 0%{ background-position:-200% center; } 100%{ background-position:200% center; } }
  @keyframes glowPulse{ 0%,100%{ opacity:1; } 50%{ opacity:.55; } }
  @keyframes donePop  { 0%{ transform:scale(1); } 45%{ transform:scale(1.3); } 100%{ transform:scale(1); } }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html { background: var(--bg); }
  input, textarea { font-family: 'DM Sans', sans-serif; }

  ::-webkit-scrollbar       { width: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--bd2); border-radius: 2px; }
  ::-webkit-scrollbar-track { background: transparent; }

  .nav-btn       { transition: color .2s, background .2s; }
  .ex-card       { transition: background .15s, border-color .2s; }
  .workout-block { transition: none; }
  .done-btn      { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
  .done-btn:active { transform: scale(.85); }

  .ex-img-wrap:hover .ex-img-hover { opacity: 1 !important; }
  .ex-img-wrap:hover img:first-child { opacity: 0; }

  input:focus, textarea:focus { outline: none; }
`;

function AppShell() {
  const {
    page,
    detailEx, setDetailEx, exDb, userImages, userVideos, updateEx, deleteEx, saveImages, saveVideo,
    showFeedbackModal, setShowFeedbackModal, setShowUpdate,
    showUpdate, allTreinos, setAllTreinos, monthFeedback, setMonthFeedback, setExDb,
    showAddEx, setShowAddEx,
  } = useApp();

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh",color:"var(--t1)",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{globalCss}</style>
      <Nav />
      <div style={{maxWidth:900,margin:"0 auto",padding:"18px 14px 96px"}}>
        {page==="treinos"    && <TreinosPage />}
        {page==="personal"   && <PersonalPage />}
        {page==="calendario" && <CalendarioPage />}
        {page==="exercicios" && <ExerciciosPage />}
        {page==="rotina"     && <RotinaPage />}
      </div>

      <DayModal />

      {detailEx && (
        <ExerciseModal
          exId={detailEx} db={exDb} userImages={userImages} userVideos={userVideos}
          onClose={()=>setDetailEx(null)} onUpdateEx={updateEx} onSaveImages={saveImages}
          onSaveVideo={saveVideo} onDeleteEx={deleteEx}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal
          onSubmit={(fb) => {
            const now = new Date();
            const key = `${now.getFullYear()}-${now.getMonth()}`;
            setMonthFeedback(p => ({...p, [key]: {...fb, submittedAt: Date.now()}}));
            setShowFeedbackModal(false);
            setShowUpdate({feedback: fb});
          }}
          onSkip={() => { setShowFeedbackModal(false); setShowUpdate({feedback: null}); }}
        />
      )}

      {showUpdate && (
        <UpdatePanel
          onClose={()=>setShowUpdate(false)}
          feedbackData={showUpdate?.feedback}
          currentTreinos={allTreinos}
          exDb={exDb}
          onApply={(newTreinos) => {
            const now = new Date();
            const key = `${now.getFullYear()}-${now.getMonth()}`;
            setAllTreinos(p => ({...p, A: newTreinos.A, B: newTreinos.B}));
            setMonthFeedback(p => ({...p, [key]: {...(p[key]||{}), applied: true}}));
            setExDb(prev => {
              const updated = {...prev};
              ["A","B"].forEach(t => {
                (newTreinos[t]?.blocos || []).forEach(bl => {
                  (bl.exercises || []).forEach(ex => {
                    if (ex.id && !updated[ex.id]) {
                      updated[ex.id] = {
                        name: ex.id.replace(/-/g," ").replace(/\b\w/g, c=>c.toUpperCase()),
                        muscles: [], category: "Geral", equipment: "",
                        description: "", steps: [], tips: [],
                      };
                    }
                  });
                });
              });
              return updated;
            });
          }}
        />
      )}

      {showAddEx && (
        <AddExerciseModal
          onSave={(id, data) => updateEx(id, data)}
          onClose={()=>setShowAddEx(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
