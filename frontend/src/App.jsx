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
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700;900&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0;transform:translateY(5px); } to { opacity:1;transform:translateY(0); } }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  input, textarea { font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #1e1e2c; border-radius: 2px; }
  .nav-btn { transition: color .2s, border-color .2s; }
  .ex-card { transition: background .15s; }
  .workout-block { transition: none; }
  .ex-img-wrap:hover .ex-img-hover { opacity: 1 !important; }
  .ex-img-wrap:hover img:first-child { opacity: 0; }
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
    <div style={{background:"#0a0a0f",minHeight:"100vh",color:"#f0f0f8",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{globalCss}</style>
      <Nav />
      <div style={{maxWidth:900,margin:"0 auto",padding:"16px 14px 90px"}}>
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
