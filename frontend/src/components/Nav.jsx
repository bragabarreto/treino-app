import { useApp } from "../context/AppContext";

const navs = [
  {id:"treinos",  icon:"🏋️", l:"Treinos",   color:"#3b82f6"},
  {id:"personal", icon:"👨‍💼", l:"Personal",  color:"#a855f7"},
  {id:"calendario",icon:"📅",l:"Calendário",color:"#22c55e"},
  {id:"exercicios",icon:"📖",l:"Exercícios",color:"#f59e0b"},
  {id:"rotina",   icon:"📋", l:"Rotina",    color:"#ec4899"},
];

export default function Nav() {
  const { page, setPage } = useApp();
  return (
    <nav style={{display:"flex",gap:4,background:"#0d0d14",borderBottom:"1px solid #1e1e2c",padding:"0 12px",overflowX:"auto",position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)"}}>
      {navs.map(n => (
        <button key={n.id} onClick={()=>setPage(n.id)} className="nav-btn"
          style={{flex:1,minWidth:62,padding:"12px 14px",background:"none",border:"none",
            borderBottom:page===n.id?`2px solid ${n.color}`:"2px solid transparent",
            borderRadius:0,color:page===n.id?"#f0f0f8":"#6b7280",fontSize:".56rem",
            fontWeight:900,letterSpacing:".5px",textTransform:"uppercase",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <span style={{fontSize:"1rem"}}>{n.icon}</span>{n.l}
        </button>
      ))}
    </nav>
  );
}
