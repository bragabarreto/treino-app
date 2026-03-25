import { useApp } from "../context/AppContext";

const navs = [
  {id:"treinos",   icon:"🏋️", l:"Treinos",    color:"#3b82f6"},
  {id:"personal",  icon:"👨‍💼", l:"Personal",   color:"#a855f7"},
  {id:"calendario",icon:"📅", l:"Calendário", color:"#22c55e"},
  {id:"exercicios",icon:"📖", l:"Exercícios", color:"#f59e0b"},
  {id:"rotina",    icon:"📋", l:"Rotina",     color:"#ec4899"},
];

export default function Nav() {
  const { page, setPage } = useApp();
  return (
    <nav style={{
      display:"flex",
      background:"rgba(7,7,13,.97)",
      borderBottom:"1px solid var(--bd1)",
      padding:"0 2px",
      overflowX:"auto",
      position:"sticky",top:0,zIndex:50,
      backdropFilter:"blur(24px)",
      WebkitBackdropFilter:"blur(24px)",
    }}>
      {navs.map(n => {
        const active = page === n.id;
        return (
          <button key={n.id} onClick={()=>setPage(n.id)} className="nav-btn"
            style={{
              flex:1, minWidth:58, padding:"10px 4px 11px",
              background: active ? `${n.color}12` : "none",
              border:"none",
              borderBottom:`2px solid ${active ? n.color : "transparent"}`,
              borderRadius:0,
              color: active ? n.color : "var(--t3)",
              fontSize:".51rem", fontWeight:900, letterSpacing:".7px",
              textTransform:"uppercase", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              position:"relative",
            }}>
            <span style={{
              fontSize:".92rem",
              filter: active ? `drop-shadow(0 0 5px ${n.color}99)` : "none",
              transition:"filter .25s",
            }}>{n.icon}</span>
            {n.l}
            {active && (
              <div style={{
                position:"absolute", bottom:-1, left:"20%", right:"20%",
                height:2,
                background:`linear-gradient(90deg,transparent,${n.color},transparent)`,
                borderRadius:2,
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
