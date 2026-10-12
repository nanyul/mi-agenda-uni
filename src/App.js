import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import 'react-big-calendar/lib/css/react-big-calendar.css'; 

const localizer = momentLocalizer(moment);

const paletaColores = [
  '#E8E8FA', '#FFECEF', '#E3F6F5', '#E1F0FF', '#FFF4E6', '#F0E6FF', '#E8F8F5', '#FFF9E6'
];

const colorTextoPrincipal = '#5A5A89'; 

const cssPersonalizado = `
@keyframes gradientBg {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.fondo-animado {
  background: linear-gradient(-45deg, #FADCFE, #C7F3F6, #E6E6FA, #D4F0F0, #FFD1DC);
  background-size: 400% 400%;
  animation: gradientBg 12s ease infinite;
}
.rbc-toolbar button { 
  color: ${colorTextoPrincipal} !important; border-color: rgba(255,255,255,0.5) !important; border-radius: 8px !important; margin-right: 4px; background-color: rgba(255, 255, 255, 0.6) !important; font-weight: 600;
}
.rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background-color: #8C8CB8 !important; color: white !important; }
.rbc-toolbar button:hover { background-color: rgba(255,255,255,0.9) !important; color: ${colorTextoPrincipal} !important; }
.rbc-header { padding: 10px 0; font-weight: 700; color: ${colorTextoPrincipal}; border-bottom: 1px solid rgba(255,255,255,0.3); }
.rbc-month-view, .rbc-agenda-view, .rbc-time-view { background: rgba(255, 255, 255, 0.4); border-radius: 12px; border: 1px solid rgba(255,255,255,0.5); }
.rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.3); }
.rbc-month-row { border-top: 1px solid rgba(255,255,255,0.3); }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(140, 140, 184, 0.4); border-radius: 10px; }
.glass-panel { background: rgba(255, 255, 255, 0.35); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 8px 32px 0 rgba(140, 140, 184, 0.1); }
`;

function App() {
  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const [materias, setMaterias] = useState(() => {
    const guardado = localStorage.getItem('agenda_materias_v17');
    if (guardado) return JSON.parse(guardado);
    return [
      { id: 'mat-1', nombre: 'Ingeniería de Software', color: '#E8E8FA', notas: [], tableros: [{ id: 'tab-1', titulo: '📅 Tareas Semanales', color: '#FFF4E6', checklist: [{ id: 't-1', texto: 'Definir arquitectura en React', completada: false }] }] }
    ];
  });

  const [eventos, setEventos] = useState(() => {
    const guardado = localStorage.getItem('agenda_eventos_v17');
    return guardado ? JSON.parse(guardado).map(ev => ({ ...ev, start: new Date(ev.start), end: new Date(ev.end) })) : [];
  });

  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [nuevaMateria, setNuevaMateria] = useState("");
  const [colorMateria, setColorMateria] = useState(paletaColores[0]);
  const [nuevoTablero, setNuevoTablero] = useState({}); 
  const [colorNuevoTablero, setColorNuevoTablero] = useState({}); 
  const [nuevasTareas, setNuevasTareas] = useState({}); 
  const [editandoTarea, setEditandoTarea] = useState({ materiaId: null, tableroId: null, tareaId: null, texto: '' });
  
  const [nuevaNotaMateria, setNuevaNotaMateria] = useState({});
  const [editandoNotaMateria, setEditandoNotaMateria] = useState({ materiaId: null, notaId: null, texto: '' });

  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState('month');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null); 
  const [nuevoEvento, setNuevoEvento] = useState({ title: '', desc: '', color: '#8C8CB8', start: null, end: null });

  const [modalConfirmacion, setModalConfirmacion] = useState({ abierto: false, mensaje: '', accion: null });

  useEffect(() => { localStorage.setItem('agenda_materias_v17', JSON.stringify(materias)); }, [materias]);
  useEffect(() => { localStorage.setItem('agenda_eventos_v17', JSON.stringify(eventos)); }, [eventos]);

  // EVENTOS DEL CALENDARIO
  const handleSelectSlot = ({ start, end }) => { setNuevoEvento({ title: '', desc: '', color: '#8C8CB8', start, end }); setModalAbierto(true); };
  const guardarEvento = (e) => {
    e.preventDefault();
    if (nuevoEvento.title.trim()) setEventos([...eventos, { id: Date.now(), title: nuevoEvento.title, desc: nuevoEvento.desc, color: nuevoEvento.color, start: nuevoEvento.start, end: nuevoEvento.end }]);
    setModalAbierto(false);
  };
  const handleSelectEvent = (evento) => setEventoSeleccionado(evento);

  // GESTIÓN DE MATERIAS
  const agregarMateria = (e) => {
    e.preventDefault();
    if (!nuevaMateria.trim()) return;
    setMaterias([...materias, { id: `mat-${Date.now()}`, nombre: nuevaMateria, color: colorMateria, tableros: [], notas: [] }]);
    setNuevaMateria("");
  };
  
  const confirmarEliminarMateria = (materiaId) => {
    setModalConfirmacion({
      abierto: true,
      mensaje: "¿Estás seguro de que deseas eliminar esta materia con todas sus tareas y notas?",
      accion: () => {
        setMaterias(prev => prev.filter(m => m.id !== materiaId));
        if (vistaActiva === materiaId) setVistaActiva('dashboard');
      }
    });
  };

  // GESTIÓN DE NOTAS (TIPO COMENTARIOS)
  const agregarNotaMateria = (e, materiaId) => {
    e.preventDefault();
    const texto = nuevaNotaMateria[materiaId];
    if (!texto?.trim()) return;
    
    setMaterias(materias.map(m => m.id === materiaId ? {
      ...m, notas: [...(m.notas || []), { id: `nota-${Date.now()}`, texto: texto, fecha: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) }]
    } : m));
    setNuevaNotaMateria({ ...nuevaNotaMateria, [materiaId]: "" });
  };

  const confirmarEliminarNota = (materiaId, notaId) => {
    setModalConfirmacion({
      abierto: true,
      mensaje: "¿Estás seguro de eliminar este apunte / comentario?",
      accion: () => setMaterias(prev => prev.map(m => m.id === materiaId ? { ...m, notas: m.notas.filter(n => n.id !== notaId) } : m))
    });
  };

  const guardarEdicionNota = (materiaId, notaId) => {
    if (!editandoNotaMateria.texto.trim()) return;
    setMaterias(materias.map(m => m.id === materiaId ? {
      ...m, notas: m.notas.map(n => n.id === notaId ? { ...n, texto: editandoNotaMateria.texto } : n)
    } : m));
    setEditandoNotaMateria({ materiaId: null, notaId: null, texto: '' });
  };

  // GESTIÓN DE TABLEROS Y TAREAS
  const agregarTablero = (e, materiaId) => {
    e.preventDefault();
    const titulo = nuevoTablero[materiaId];
    if (!titulo?.trim()) return;
    const colorSeleccionado = colorNuevoTablero[materiaId] || paletaColores[0];
    setMaterias(materias.map(m => m.id === materiaId ? { ...m, tableros: [...m.tableros, { id: `tab-${Date.now()}`, titulo: titulo, color: colorSeleccionado, checklist: [] }] } : m));
    setNuevoTablero({ ...nuevoTablero, [materiaId]: "" });
  };

  const confirmarEliminarTablero = (materiaId, tableroId) => {
    setModalConfirmacion({
      abierto: true,
      mensaje: "¿Estás seguro de eliminar esta sección entera con todas sus tareas?",
      accion: () => setMaterias(prev => prev.map(m => m.id === materiaId ? { ...m, tableros: m.tableros.filter(tab => tab.id !== tableroId) } : m))
    });
  };

  const agregarTarea = (e, materiaId, tableroId) => {
    e.preventDefault();
    const texto = nuevasTareas[tableroId];
    if (!texto?.trim()) return;
    setMaterias(materias.map(m => m.id === materiaId ? {
      ...m, tableros: m.tableros.map(tab => tab.id === tableroId ? { ...tab, checklist: [...tab.checklist, { id: `t-${Date.now()}`, texto: texto, completada: false }] } : tab)
    } : m));
    setNuevasTareas({ ...nuevasTareas, [tableroId]: "" });
  };

  const toggleTarea = (materiaId, tableroId, tareaId) => {
    setMaterias(materias.map(m => m.id === materiaId ? {
      ...m, tableros: m.tableros.map(tab => tab.id === tableroId ? { ...tab, checklist: tab.checklist.map(t => t.id === tareaId ? { ...t, completada: !t.completada } : t) } : tab)
    } : m));
  };

  const eliminarTarea = (materiaId, tableroId, tareaId) => {
    setMaterias(materias.map(m => m.id === materiaId ? {
      ...m, tableros: m.tableros.map(tab => tab.id === tableroId ? { ...tab, checklist: tab.checklist.filter(t => t.id !== tareaId) } : tab)
    } : m));
  };

  const guardarEdicion = (materiaId, tableroId, tareaId) => {
    setMaterias(materias.map(m => m.id === materiaId ? {
      ...m, tableros: m.tableros.map(tab => tab.id === tableroId ? { ...tab, checklist: tab.checklist.map(t => t.id === tareaId ? { ...t, texto: editandoTarea.texto } : t) } : tab)
    } : m));
    setEditandoTarea({ materiaId: null, tableroId: null, tareaId: null, texto: '' });
  };

  const renderChecklist = (materia, tableroIdFallback, checklist) => {
    const tareasFiltradas = checklist.filter(t => t.texto.toLowerCase().includes(textoBusqueda.toLowerCase()));
    
    return (
      <ul className="space-y-3 mb-4 overflow-y-auto flex-grow custom-scrollbar pr-1 z-10 relative">
        <AnimatePresence>
          {tareasFiltradas.map(tarea => {
            const currentTableroId = tarea.tableroId || tableroIdFallback;
            
            return (
              <motion.li 
                layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={tarea.id} 
                className="flex items-start gap-3 group bg-white bg-opacity-60 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-white border-opacity-60 hover:border-[#8C8CB8] transition-colors"
              >
                <input type="checkbox" checked={tarea.completada} onChange={() => toggleTarea(materia.id, currentTableroId, tarea.id)} className="mt-1 w-5 h-5 rounded-full cursor-pointer accent-[#8C8CB8]" />
                
                {editandoTarea.tareaId === tarea.id ? (
                  <input type="text" className="flex-1 bg-transparent border-b-2 border-[#8C8CB8] outline-none text-sm font-bold text-[#5A5A89]" value={editandoTarea.texto} onChange={(e) => setEditandoTarea({ ...editandoTarea, texto: e.target.value })} onBlur={() => guardarEdicion(materia.id, currentTableroId, tarea.id)} onKeyDown={(e) => e.key === 'Enter' && guardarEdicion(materia.id, currentTableroId, tarea.id)} autoFocus />
                ) : (
                  <span onDoubleClick={() => setEditandoTarea({ materiaId: materia.id, tableroId: currentTableroId, tareaId: tarea.id, texto: tarea.texto })} className={`flex-1 text-sm font-semibold cursor-text text-[#5A5A89] ${tarea.completada ? 'line-through opacity-40' : ''}`}>
                    {tarea.texto}
                  </span>
                )}
                
                <button onClick={() => eliminarTarea(materia.id, currentTableroId, tarea.id)} className="opacity-0 group-hover:opacity-100 text-[#8C8CB8] hover:text-red-400 transition-colors p-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {tareasFiltradas.length === 0 && <p className="text-xs text-center opacity-60 mt-4 font-bold text-[#5A5A89]">Sin tareas que coincidan ✨</p>}
      </ul>
    );
  };

  return (
    <>
      <style>{cssPersonalizado}</style>
      
      <div className="flex h-screen overflow-hidden text-[#5A5A89] relative fondo-animado">
        <Particles
          id="tsparticles" init={particlesInit}
          options={{
            fullScreen: { enable: false }, background: { color: { value: "transparent" } }, fpsLimit: 60,
            particles: { 
              color: { value: ["#ffffff", "#E0BBE4", "#D4F0F0"] }, 
              move: { direction: "top", enable: true, outModes: { default: "out" }, random: true, speed: 0.8, straight: false }, 
              number: { density: { enable: true, area: 800 }, value: 80 }, 
              opacity: { value: 0.8, random: true }, 
              shape: { type: "circle" }, 
              size: { value: { min: 2, max: 7 }, random: true } 
            },
            interactivity: { 
              events: {
                onHover: { enable: true, mode: "repulse" },
                onClick: { enable: true, mode: "push" } 
              },
              modes: {
                repulse: { distance: 100, duration: 0.4 },
                push: { quantity: 4 }
              }
            }
          }}
          className="absolute inset-0 z-0"
        />

        {/* SIDEBAR */}
        <aside className="w-64 glass-panel flex-col justify-between hidden lg:flex border-r border-white z-10 pointer-events-auto">
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 mb-10 px-2 mt-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8C8CB8] to-[#B8AEE3] rounded-xl shadow-md flex items-center justify-center text-white font-extrabold text-lg">P</div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#5A5A89]">Mi Planner</h1>
            </div>
            
            <nav className="space-y-3 font-bold text-[#8C8CB8]">
              <button onClick={() => setVistaActiva('dashboard')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${vistaActiva === 'dashboard' ? 'bg-white bg-opacity-70 shadow-sm text-[#5A5A89]' : 'hover:bg-white hover:bg-opacity-40 text-[#8C8CB8]'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={vistaActiva === 'dashboard' ? '#5A5A89' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Dashboard
              </button>
              
              <div className="pt-6 pb-2 px-2">
                <p className="text-[11px] uppercase tracking-widest text-[#8C8CB8] font-extrabold opacity-60">Mis Materias</p>
              </div>
              
              {materias.map(m => (
                <button key={m.id} onClick={() => setVistaActiva(m.id)} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${vistaActiva === m.id ? 'bg-white bg-opacity-70 shadow-sm text-[#5A5A89] scale-105' : 'hover:bg-white hover:bg-opacity-40 text-[#8C8CB8]'}`}>
                  <span className="w-4 h-4 rounded-lg shadow-inner border border-black border-opacity-5" style={{ backgroundColor: m.color }}></span>
                  <span className="truncate text-left text-sm font-semibold">{m.nombre}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative z-10 pointer-events-auto">
          
          <header className="flex justify-between items-center mb-10 glass-panel p-6 rounded-[2rem] sticky top-0 z-20">
            <div>
              <h2 className="text-3xl font-extrabold text-[#5A5A89] drop-shadow-sm">
                {vistaActiva === 'dashboard' ? 'Bienvenido de nuevo ^_~' : materias.find(m => m.id === vistaActiva)?.nombre}
              </h2>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <svg className="absolute left-4 top-3 text-[#8C8CB8] w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" placeholder="Buscar tareas..." className="bg-white bg-opacity-70 border-2 border-transparent pl-12 pr-5 py-3 rounded-2xl outline-none text-sm w-72 focus:bg-white focus:border-[#E8E8FA] text-[#5A5A89] shadow-sm transition-all font-semibold" value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} />
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {/* DASHBOARD GENERAL */}
            {vistaActiva === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                
                <div className="glass-panel p-8 rounded-[2rem] mb-10">
                  <div className="h-[450px]">
                    <Calendar
                      localizer={localizer} events={eventos} startAccessor="start" endAccessor="end" selectable
                      onSelectSlot={handleSelectSlot} onSelectEvent={handleSelectEvent}
                      date={fechaActual} onNavigate={setFechaActual} view={vistaCalendario} onView={setVistaCalendario}
                      messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
                      eventPropGetter={(event) => ({ style: { backgroundColor: event.color || '#8C8CB8', color: '#5A5A89', fontWeight: '700', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.4)', padding: '4px 8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' } })}
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 glass-panel p-5 rounded-3xl">
                  <h3 className="text-xl font-extrabold text-[#5A5A89] ml-2">Resumen de Materias</h3>
                  <form onSubmit={agregarMateria} className="flex flex-wrap items-center gap-3 bg-white bg-opacity-60 p-2 rounded-2xl shadow-sm border border-white border-opacity-40">
                    <input type="text" placeholder="Nueva materia..." className="px-4 py-2 text-sm rounded-xl bg-transparent border-none outline-none focus:ring-0 w-48 text-[#5A5A89] font-semibold" value={nuevaMateria} onChange={(e) => setNuevaMateria(e.target.value)} />
                    <div className="flex gap-1 border-l-2 pl-3 border-[rgba(255,255,255,0.4)]">
                      {paletaColores.slice(0, 6).map(color => (
                        <button key={color} type="button" onClick={() => setColorMateria(color)} className={`w-7 h-7 rounded-lg transition-transform border border-black border-opacity-5 ${colorMateria === color ? 'scale-110 ring-2 ring-[#8C8CB8] ring-offset-1' : 'hover:scale-110'}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <button type="submit" className="bg-[#5A5A89] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md ml-2 hover:bg-[#8C8CB8] transition-colors"> Crear </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
                  {materias.map(materia => {
                    const todasLasTareas = materia.tableros.flatMap(tab => tab.checklist.map(t => ({ ...t, tableroId: tab.id })));
                    const progreso = todasLasTareas.length === 0 ? 0 : Math.round((todasLasTareas.filter(t => t.completada).length / todasLasTareas.length) * 100);

                    return (
                      <motion.div whileHover={{ y: -5 }} key={materia.id} className="p-7 rounded-[2rem] flex flex-col h-[400px] border border-white border-opacity-60 relative overflow-hidden group/card" style={{ backgroundColor: materia.color, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-40 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                          <h3 className="font-extrabold text-2xl leading-tight w-3/4 text-[#5A5A89] cursor-pointer hover:underline" onClick={() => setVistaActiva(materia.id)}>
                            {materia.nombre}
                          </h3>
                          <div className="flex gap-2">
                            <span className="bg-white bg-opacity-80 px-3 py-1.5 rounded-xl text-sm font-extrabold shadow-sm text-[#5A5A89]">{progreso}%</span>
                            <button onClick={() => confirmarEliminarMateria(materia.id)} className="bg-white bg-opacity-50 text-[#8C8CB8] hover:text-red-500 hover:bg-white p-2 rounded-xl shadow-sm transition-all opacity-0 group-hover/card:opacity-100 flex items-center justify-center">
                               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-2 z-10">
                          <p className="text-xs font-bold opacity-70 text-[#5A5A89]">Últimas tareas globales:</p>
                        </div>

                        {renderChecklist(materia, null, todasLasTareas)}
                        
                        <button onClick={() => setVistaActiva(materia.id)} className="mt-auto w-full py-4 text-sm rounded-2xl bg-white bg-opacity-70 font-extrabold shadow-sm hover:bg-opacity-100 transition-all text-[#5A5A89] relative z-10 border border-white">
                          Abrir Espacio ➔
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* VISTA ESPECÍFICA DE MATERIA */}
            {vistaActiva !== 'dashboard' && materias.find(m => m.id === vistaActiva) && (
              <motion.div key="materia" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="flex flex-col h-full relative z-10">
                {(() => {
                  const materiaActual = materias.find(m => m.id === vistaActiva);

                  return (
                    <div className="flex flex-col xl:flex-row gap-8 items-start pb-6">
                      
                      {/* LADO IZQUIERDO: TABLEROS DE TAREAS */}
                      <div className="flex-1 w-full flex flex-col p-8 rounded-[2rem] border border-white border-opacity-60 relative overflow-hidden" style={{ backgroundColor: materiaActual.color, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' }}>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-40 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
                          {materiaActual.tableros.map(tablero => {
                            const tareasTablero = tablero.checklist;
                            const progresoTablero = tareasTablero.length === 0 ? 0 : Math.round((tareasTablero.filter(t => t.completada).length / tareasTablero.length) * 100);

                            return (
                              <motion.div whileHover={{ y: -4 }} key={tablero.id} className="p-6 rounded-[2rem] shadow-sm border border-white border-opacity-70 flex flex-col max-h-[480px] group/tablero" style={{ backgroundColor: tablero.color || 'rgba(255,255,255,0.5)' }}>
                                <div className="mb-5 pb-4 border-b-2 border-[#5A5A89] border-opacity-10">
                                  <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-extrabold text-xl text-[#5A5A89] truncate pr-2">{tablero.titulo}</h4>
                                    <div className="flex gap-2 items-center">
                                      <span className="text-sm font-extrabold text-[#5A5A89] bg-white bg-opacity-60 px-2.5 py-1 rounded-xl shadow-sm">{progresoTablero}%</span>
                                      <button onClick={() => confirmarEliminarTablero(materiaActual.id, tablero.id)} className="bg-white bg-opacity-40 text-[#8C8CB8] hover:text-red-500 p-2 rounded-xl transition-all opacity-0 group-hover/tablero:opacity-100 flex items-center justify-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="w-full bg-white bg-opacity-50 rounded-full h-2.5 shadow-inner border border-white border-opacity-40">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${progresoTablero}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className="bg-[#8C8CB8] h-full rounded-full"></motion.div>
                                  </div>
                                </div>
                                
                                {renderChecklist(materiaActual, tablero.id, tablero.checklist)}

                                <form onSubmit={(e) => agregarTarea(e, materiaActual.id, tablero.id)} className="mt-auto pt-4">
                                  <input type="text" placeholder="+ Añadir tarea..." className="w-full px-5 py-3 text-sm rounded-xl bg-white bg-opacity-70 border border-white outline-none shadow-sm focus:ring-2 focus:ring-[#8C8CB8] transition-all font-bold text-[#5A5A89]" value={nuevasTareas[tablero.id] || ""} onChange={(e) => setNuevasTareas({ ...nuevasTareas, [tablero.id]: e.target.value })} />
                                </form>
                              </motion.div>
                            );
                          })}

                          <div className="glass-panel p-6 rounded-[2rem] border-2 border-dashed border-[#8C8CB8] border-opacity-30 flex flex-col justify-center items-center h-full min-h-[200px] hover:bg-white hover:bg-opacity-50 transition-colors shadow-sm">
                             <form onSubmit={(e) => agregarTablero(e, materiaActual.id)} className="w-full text-center">
                                <input 
                                  type="text" placeholder="Título de la Sección" 
                                  className="w-full px-5 py-3 text-base rounded-xl bg-white bg-opacity-80 border-none outline-none focus:ring-2 focus:ring-[#8C8CB8] transition-all font-extrabold text-center mb-4 text-[#5A5A89] shadow-inner" 
                                  value={nuevoTablero[materiaActual.id] || ""} onChange={(e) => setNuevoTablero({ ...nuevoTablero, [materiaActual.id]: e.target.value })} 
                                />
                                <div className="flex justify-center gap-2 mb-6 flex-wrap">
                                  {paletaColores.map(color => (
                                    <button 
                                      key={color} type="button" onClick={() => setColorNuevoTablero({ ...colorNuevoTablero, [materiaActual.id]: color })}
                                      className={`w-6 h-6 rounded-lg transition-transform shadow-sm border border-black border-opacity-5 ${colorNuevoTablero[materiaActual.id] === color ? 'scale-110 ring-2 ring-[#8C8CB8] ring-offset-1' : 'hover:scale-110'}`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                                <button type="submit" className="text-sm font-extrabold flex items-center justify-center gap-2 mx-auto bg-[#5A5A89] text-white px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform">
                                  + Añadir Tablero
                                </button>
                             </form>
                          </div>
                        </div>
                      </div>

                      {/* LADO DERECHO: PANEL DE NOTAS Y COMENTARIOS */}
                      <div className="w-full xl:w-[400px] glass-panel p-7 rounded-[2rem] flex flex-col h-[650px] sticky top-6 z-10 border-2 border-white border-opacity-70">
                        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#5A5A89] border-opacity-10 pb-4">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8C8CB8]"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                           <h4 className="font-extrabold text-2xl text-[#5A5A89]">Notas</h4>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2 mb-4">
                           <AnimatePresence>
                             {materiaActual.notas?.map(nota => (
                               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={nota.id} className="bg-white bg-opacity-70 p-4 rounded-2xl shadow-sm border border-white group/nota relative">
                                 {editandoNotaMateria.notaId === nota.id ? (
                                    <textarea className="w-full bg-transparent border-b-2 border-[#8C8CB8] outline-none text-sm font-semibold text-[#5A5A89] resize-none h-20 custom-scrollbar" autoFocus value={editandoNotaMateria.texto} onChange={e => setEditandoNotaMateria({...editandoNotaMateria, texto: e.target.value})} onBlur={() => guardarEdicionNota(materiaActual.id, nota.id)} />
                                 ) : (
                                    <>
                                      <p className="text-sm font-semibold text-[#5A5A89] whitespace-pre-wrap pr-12">{nota.texto}</p>
                                      <span className="text-[10px] font-bold text-[#8C8CB8] opacity-70 mt-3 block">{nota.fecha}</span>
                                    </>
                                 )}
                                 
                                 <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover/nota:opacity-100 transition-opacity">
                                    <button onClick={() => setEditandoNotaMateria({materiaId: materiaActual.id, notaId: nota.id, texto: nota.texto})} className="text-[#8C8CB8] hover:text-[#5A5A89] bg-white bg-opacity-80 p-2 rounded-lg shadow-sm flex items-center justify-center">
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button onClick={() => confirmarEliminarNota(materiaActual.id, nota.id)} className="text-[#8C8CB8] hover:text-red-500 bg-white bg-opacity-80 p-2 rounded-lg shadow-sm flex items-center justify-center">
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                 </div>
                               </motion.div>
                             ))}
                             {(!materiaActual.notas || materiaActual.notas.length === 0) && (
                                <p className="text-sm text-center font-bold text-[#8C8CB8] opacity-60 mt-10">Aún no hay apuntes aquí. Escribe algo importante abajo 👇</p>
                             )}
                           </AnimatePresence>
                        </div>

                        <form onSubmit={(e) => agregarNotaMateria(e, materiaActual.id)} className="mt-auto pt-4 border-t border-[#5A5A89] border-opacity-10 flex flex-col gap-3">
                          <textarea 
                            placeholder="Añade apuntes o comentarios..." 
                            className="w-full px-4 py-3 text-sm rounded-xl bg-white bg-opacity-70 border border-white outline-none shadow-sm focus:ring-2 focus:ring-[#8C8CB8] transition-all font-semibold text-[#5A5A89] resize-none h-20 custom-scrollbar" 
                            value={nuevaNotaMateria[materiaActual.id] || ""} 
                            onChange={(e) => setNuevaNotaMateria({ ...nuevaNotaMateria, [materiaActual.id]: e.target.value })}
                          />
                          <button type="submit" className="w-full bg-[#5A5A89] text-white py-2.5 rounded-xl text-sm font-extrabold shadow-md hover:bg-[#8C8CB8] transition-colors flex justify-center items-center gap-2">
                            Publicar Nota
                          </button>
                        </form>
                      </div>

                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* NUEVO: FOOTER */}
          <footer className="mt-12 mb-2 text-center relative z-10">
            <div className="glass-panel inline-block px-8 py-3 rounded-2xl shadow-sm border border-white border-opacity-60">
              <p className="text-sm font-extrabold text-[#8C8CB8]">
                Desarrollado con 💙 por{' '}
                <a href="https://github.com/nanyul" target="_blank" rel="noopener noreferrer" className="text-[#5A5A89] hover:text-[#FF6B6B] transition-colors hover:underline">
                  Yuliana Norori
                </a>
              </p>
            </div>
          </footer>

        </main>

        {/* --- MODALES CON GLASSMORPHISM (Transparencia hermosa) --- */}

        {/* MODAL NUEVO EVENTO CALENDARIO */}
        <AnimatePresence>
          {modalAbierto && (
            <div className="fixed inset-0 bg-[#5A5A89] bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 pointer-events-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-panel p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-white">
                <h2 className="text-3xl font-extrabold mb-6 text-[#5A5A89]">Nuevo Evento</h2>
                <form onSubmit={guardarEvento}>
                  <label className="block text-sm font-bold text-[#8C8CB8] mb-2 ml-1">Título</label>
                  <input type="text" autoFocus className="w-full px-5 py-4 rounded-2xl bg-white bg-opacity-80 border-none mb-5 outline-none focus:bg-white focus:ring-2 focus:ring-[#8C8CB8] shadow-sm text-[#5A5A89] font-semibold transition-all" value={nuevoEvento.title} onChange={(e) => setNuevoEvento({...nuevoEvento, title: e.target.value})} />
                  
                  <label className="block text-sm font-bold text-[#8C8CB8] mb-2 ml-1">Detalles</label>
                  <textarea className="w-full px-5 py-4 rounded-2xl bg-white bg-opacity-80 border-none mb-6 outline-none focus:bg-white focus:ring-2 focus:ring-[#8C8CB8] resize-none h-28 shadow-sm text-[#5A5A89] font-semibold transition-all" value={nuevoEvento.desc} onChange={(e) => setNuevoEvento({...nuevoEvento, desc: e.target.value})} />
                  
                  <label className="block text-sm font-bold text-[#8C8CB8] mb-3 ml-1">Etiqueta Visual</label>
                  <div className="flex gap-3 mb-8 flex-wrap">
                    {paletaColores.slice(0,7).map(color => (
                      <button key={color} type="button" onClick={() => setNuevoEvento({...nuevoEvento, color})} className={`w-10 h-10 rounded-xl shadow-sm border border-black border-opacity-5 ${nuevoEvento.color === color ? 'scale-110 ring-2 ring-[#8C8CB8] ring-offset-2' : 'hover:scale-110'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setModalAbierto(false)} className="px-6 py-3 rounded-xl font-bold text-[#8C8CB8] hover:bg-white hover:bg-opacity-50 transition-colors">Cancelar</button>
                    <button type="submit" className="bg-[#5A5A89] text-white px-8 py-3 rounded-xl font-extrabold shadow-md hover:bg-[#8C8CB8] transition-all">Guardar</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL DETALLES DEL EVENTO */}
        <AnimatePresence>
          {eventoSeleccionado && (
            <div className="fixed inset-0 bg-[#5A5A89] bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 pointer-events-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white" style={{ backgroundColor: eventoSeleccionado.color || 'rgba(255,255,255,0.8)' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-5 h-5 rounded-full shadow-inner border border-black border-opacity-10 bg-white"></div>
                  <h2 className="text-3xl font-extrabold text-[#5A5A89]">{eventoSeleccionado.title}</h2>
                </div>
                
                <div className="bg-white bg-opacity-60 p-5 rounded-2xl shadow-sm mb-8 min-h-[100px] border border-white">
                  <p className="text-[#5A5A89] font-bold whitespace-pre-wrap">
                    {eventoSeleccionado.desc ? eventoSeleccionado.desc : <span className="italic opacity-60">Sin detalles adicionales...</span>}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => setEventoSeleccionado(null)} className="bg-white text-[#5A5A89] px-8 py-3 rounded-xl font-extrabold shadow-sm hover:scale-105 transition-transform">
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* NUEVO: MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        <AnimatePresence>
          {modalConfirmacion.abierto && (
            <div className="fixed inset-0 bg-[#5A5A89] bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-[100] pointer-events-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-panel p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white text-center">
                <div className="w-16 h-16 bg-white bg-opacity-60 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </div>
                <h3 className="text-xl font-extrabold mb-8 text-[#5A5A89] leading-relaxed">{modalConfirmacion.mensaje}</h3>
                <div className="flex justify-center gap-4">
                  <button onClick={() => setModalConfirmacion({ abierto: false, mensaje: '', accion: null })} className="px-6 py-3 rounded-xl font-bold text-[#8C8CB8] hover:bg-white hover:bg-opacity-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => { modalConfirmacion.accion(); setModalConfirmacion({ abierto: false, mensaje: '', accion: null }); }} className="bg-[#FF6B6B] text-white px-6 py-3 rounded-xl font-extrabold shadow-md hover:scale-105 transition-transform">
                    Sí, eliminar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}

export default App;