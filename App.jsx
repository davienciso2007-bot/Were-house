import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Boxes, Truck, Warehouse, Radio, Trophy, PackagePlus, ArrowUpDown, Route, MapPin, Play, RotateCcw, Flag, Copy, Wifi, WifiOff, ClipboardList, Zap, Users, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = URL && KEY ? createClient(URL, KEY) : null;
const LOCATIONS = ['A1','A2','B1','B2'];
const PRODUCTS = [{sku:'PAPEL-A4',name:'Papel sulfite A4',icon:'📦'},{sku:'PECAS',name:'Peças de reposição',icon:'⚙️'},{sku:'LIMPEZA',name:'Material de limpeza',icon:'🧴'}];
const PHASES = [
  {id:'receiving',name:'WMS • Recebimento',sub:'Registre os materiais e escolha onde guardar',icon:PackagePlus},
  {id:'rotation',name:'PEPS / UEPS • Expedição',sub:'Retire os lotes respeitando a ordem escolhida',icon:ArrowUpDown},
  {id:'crossdock',name:'Cross-docking • Carga urgente',sub:'Separe por destino e encaminhe à expedição',icon:Zap},
  {id:'transit',name:'Transit point • Distribuição',sub:'Agrupe por região e transfira para o veículo certo',icon:Route}
];
const VEHICLES = {Norte:'VAN-01',Sul:'VAN-02',Leste:'VAN-03',Oeste:'VAN-04'};

function App(){
  const [screen,setScreen]=useState('home');
  const [mode,setMode]=useState('team');
  const [roomCode,setRoomCode]=useState('');
  const [teamName,setTeamName]=useState('');
  const [room,setRoom]=useState(null);
  const [teams,setTeams]=useState([]);
  const [teamId,setTeamId]=useState(null);
  const [hostToken,setHostToken]=useState(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [connected,setConnected]=useState(false);
  const [sku,setSku]=useState('PAPEL-A4');
  const [location,setLocation]=useState('A1');
  const [lotId,setLotId]=useState('');
  const [method,setMethod]=useState('PEPS');
  const [destination,setDestination]=useState('Norte');
  const [vehicle,setVehicle]=useState('VAN-01');
  const [lastResult,setLastResult]=useState('');

  const myTeam=teams.find(t=>t.id===teamId);
  const ranked=useMemo(()=>[...teams].sort((a,b)=>b.score-a.score),[teams]);
  const phase=PHASES.find(p=>p.id===room?.phase)||PHASES[0];
  const isSetup=screen==='home';

  async function refresh(code){
    if(!supabase||!code)return;
    const {data:r}=await supabase.from('warehouse_rooms').select('*').eq('code',code).maybeSingle();
    if(r){setRoom(r);const {data:t}=await supabase.from('warehouse_teams').select('*').eq('room_id',r.id).order('created_at');setTeams(t||[]);}
  }
  useEffect(()=>{
    if(!room?.id||!supabase)return;
    const ch=supabase.channel('room-'+room.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'warehouse_rooms',filter:`id=eq.${room.id}`},p=>setRoom(p.new))
      .on('postgres_changes',{event:'*',schema:'public',table:'warehouse_teams',filter:`room_id=eq.${room.id}`},()=>refresh(room.code))
      .subscribe(s=>setConnected(s==='SUBSCRIBED'));
    return()=>{supabase.removeChannel(ch)};
  },[room?.id]);
  useEffect(()=>{if(room?.code){const i=setInterval(()=>refresh(room.code),5000);return()=>clearInterval(i)}},[room?.code]);

  async function createRoom(){
    if(!supabase){setNotice('Configure as credenciais do Supabase para habilitar o multiplayer online.');return;}
    setBusy(true);setNotice('');
    const {data,error}=await supabase.rpc('warehouse_create_room');
    setBusy(false);
    if(error){setNotice(error.message);return;}
    setRoomCode(data.code);setHostToken(data.host_token);setRoom(data.room);setMode('host');setScreen('host');
    await refresh(data.code);
  }
  async function joinRoom(){
    if(!supabase){setNotice('Configure as credenciais do Supabase para habilitar o multiplayer online.');return;}
    if(!roomCode.trim()||!teamName.trim()){setNotice('Informe o código da sala e o nome da equipe.');return;}
    setBusy(true);setNotice('');
    const {data,error}=await supabase.rpc('warehouse_join_room',{p_code:roomCode.trim().toUpperCase(),p_team_name:teamName.trim()});
    setBusy(false);
    if(error){setNotice(error.message);return;}
    setTeamId(data.team_id);setRoomCode(roomCode.trim().toUpperCase());await refresh(roomCode.trim().toUpperCase());setMode('team');setScreen('game');
  }
  async function hostControl(action){
    setBusy(true);const {data,error}=await supabase.rpc('warehouse_host_control',{p_code:room.code,p_token:hostToken,p_action:action});setBusy(false);
    if(error){setNotice(error.message);return;} if(data?.message)setNotice(data.message); await refresh(room.code);
  }
  async function act(payload){
    if(!myTeam)return;
    setBusy(true);setNotice('');
    const {data,error}=await supabase.rpc('warehouse_action',{p_code:room.code,p_team_id:teamId,p_action:payload});
    setBusy(false);
    if(error){setNotice(error.message);return;}
    setLastResult(data.message||'Operação registrada.');setNotice(data.message||'Operação registrada.');await refresh(room.code);
  }
  function copyCode(){navigator.clipboard?.writeText(room?.code||roomCode);setNotice('Código copiado!');}

  if(!supabase)return <div className="setup-screen"><div className="setup-card"><div className="brand"><Warehouse/><span>WAREHOUSE</span></div><div className="eyebrow">CAOS NO ESTOQUE • MULTIPLAYER</div><h1>Seu armazém está<br/><em>quase aberto.</em></h1><p>O jogo está pronto para conectar equipes pela internet. Falta configurar o projeto gratuito do Supabase.</p><div className="setup-steps"><b>1.</b> Crie um projeto em <a href="https://supabase.com/dashboard" target="_blank">supabase.com</a>.<b>2.</b> Execute o arquivo <code>supabase.sql</code> no SQL Editor.<b>3.</b> Copie a URL e a chave anon para um arquivo <code>.env</code>.</div><div className="notice">Não existe multiplayer local de fachada: sem essas credenciais, o jogo não simula uma sala online.</div><p className="muted">Consulte o README incluído no pacote para publicar gratuitamente.</p></div></div>;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Warehouse size={19}/></div><div><strong>WAREHOUSE</strong><small>CAOS NO ESTOQUE</small></div></div><div className="top-status"><span className="live-dot"/> {room?.status==='playing'?'OPERAÇÃO ATIVA':room?.status==='finished'?'PARTIDA ENCERRADA':'AGUARDANDO'}</div><div className="connection">{connected?<Wifi size={16}/>:<WifiOff size={16}/>} <span>{connected?'ONLINE':'CONECTANDO'}</span></div></header>
    {screen==='home'&&<main className="home-grid"><section className="hero"><div className="eyebrow">SIMULADOR DE OPERAÇÕES LOGÍSTICAS</div><h1>O estoque saiu<br/>do <em>controle.</em></h1><p>Organize. Movimente. Distribua. Supere as outras equipes e transforme o caos em eficiência.</p><div className="hero-stats"><span><Boxes/> 4 operações</span><span><Users/> Multiplayer</span><span><Trophy/> Ranking ao vivo</span></div><div className="hero-art"><div className="shelf shelf-a"><i>📦</i><i>📦</i><i>⚙️</i><i>📦</i></div><div className="forklift">🚜</div><div className="truck-art">🚚</div><div className="floor-line"/></div></section><section className="entry-panel"><div className="panel-kicker">CENTRAL DE OPERAÇÕES</div><h2>Entrar na partida</h2><p className="muted">Cada equipe usa seu próprio celular.</p><label>CÓDIGO DA SALA</label><input className="code-input" value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} placeholder="Ex.: W7K9Q" maxLength={5}/><label>NOME DA EQUIPE</label><input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Ex.: Os Estrategistas" maxLength={24}/><button className="primary-btn" onClick={joinRoom} disabled={busy}>{busy?'CONECTANDO...':'ENTRAR NO ARMAZÉM'} <ChevronRight size={18}/></button><div className="split"><span/>OU<span/></div><button className="secondary-btn" onClick={createRoom} disabled={busy}><Play size={16}/> CRIAR SALA DO APRESENTADOR</button>{notice&&<div className="notice">{notice}</div>}<div className="entry-foot"><span><Radio size={14}/> SALAS ONLINE</span><span>ANDROID • iOS • DESKTOP</span></div></section></main>}

    {screen==='host'&&<main className="dashboard"><div className="dash-heading"><div><div className="eyebrow">PAINEL DO APRESENTADOR</div><h1>Centro de comando<span className="orange">.</span></h1><p className="muted">Gerencie a partida e acompanhe todas as equipes.</p></div><div className="room-code" onClick={copyCode}><small>CÓDIGO DA SALA</small><strong>{room?.code}</strong><span><Copy size={13}/> COPIAR</span></div></div><div className="host-layout"><section className="host-main"><div className="phase-card"><div className="phase-icon"><phase.icon size={26}/></div><div><small>FASE ATUAL • RODADA {room?.round||0}</small><h2>{phase.name}</h2><p>{phase.sub}</p></div><span className={`status-pill ${room?.status}`}>{room?.status==='playing'?'EM ANDAMENTO':room?.status==='finished'?'FINALIZADA':'LOBBY'}</span></div><div className="control-card"><div className="card-title"><ClipboardList/><h3>Controles da partida</h3></div><div className="control-actions">{room?.status==='waiting'&&<button className="primary-btn" onClick={()=>hostControl('start')} disabled={busy}><Play size={17}/> INICIAR PARTIDA</button>}{room?.status==='playing'&&<button className="primary-btn" onClick={()=>hostControl('next')} disabled={busy}>PRÓXIMA OPERAÇÃO <ChevronRight size={17}/></button>}{room?.status==='playing'&&<button className="danger-btn" onClick={()=>hostControl('finish')} disabled={busy}><Flag size={16}/> FINALIZAR</button>}{room?.status==='finished'&&<button className="primary-btn" onClick={()=>hostControl('reset')} disabled={busy}><RotateCcw size={17}/> REINICIAR PARTIDA</button>}</div><p className="muted small">Avançar a operação libera a próxima mecânica para todas as equipes ao mesmo tempo.</p></div><div className="screen-card"><div className="card-title"><Trophy/><h3>Ranking ao vivo</h3><span className="live-label">● AO VIVO</span></div><Leaderboard teams={ranked}/></div></section><aside className="host-side"><div className="side-card"><div className="card-title"><Users/><h3>Equipes conectadas</h3></div><div className="big-number">{teams.length}<small> equipes</small></div>{teams.map(t=><div className="team-line" key={t.id}><span className="team-dot"/>{t.name}<b>{t.score} XP</b></div>)}{!teams.length&&<p className="muted">Aguardando equipes entrarem...</p>}</div><div className="side-card invite-card"><div className="invite-icon"><Radio/></div><h3>Convide a turma</h3><p>Compartilhe o código e peça para cada equipe acessar o link do jogo.</p><button className="secondary-btn" onClick={copyCode}><Copy size={15}/> COPIAR CÓDIGO</button></div>{notice&&<div className="notice">{notice}</div>}</aside></div></main>}

    {screen==='game'&&<main className="game-layout"><div className="game-heading"><div><div className="eyebrow">SUA EQUIPE • {room?.code}</div><h1>{myTeam?.name||teamName}<span className="orange">.</span></h1><p className="muted">Gerencie sua operação e supere a concorrência.</p></div><div className="score-box"><small>PONTUAÇÃO</small><strong>{myTeam?.score||0}<i> XP</i></strong></div></div>{room?.status==='waiting'?<div className="waiting-card"><div className="pulse-box"><Warehouse size={34}/></div><h2>Equipe posicionada.</h2><p>O apresentador vai iniciar a operação. Prepare sua estratégia!</p><div className="waiting-teams"><Users size={16}/> {teams.length} equipes na sala</div></div>:room?.status==='finished'?<div className="waiting-card"><Trophy size={48} className="gold"/><h2>Operação encerrada!</h2><p>Confira a classificação final da sala.</p><Leaderboard teams={ranked}/></div>:<><div className="phase-banner"><div className="phase-icon"><phase.icon size={24}/></div><div><small>OPERAÇÃO {PHASES.findIndex(p=>p.id===room?.phase)+1}/4 • RODADA {room?.round}</small><h2>{phase.name}</h2><p>{phase.sub}</p></div></div><section className="workbench"><div className="workbench-top"><span>ÁREA DE OPERAÇÃO</span><span className="live-label">● SINCRONIZADO</span></div>
      {room?.phase==='receiving'&&<div className="operation"><div className="operation-illustration">📦<span>🚜</span></div><h3>Recebimento de mercadorias</h3><p>Um caminhão chegou. Registre a entrada, controle a quantidade e indique a posição. O WMS também apoia a localização dos materiais e a separação e conferência dos pedidos.</p><div className="form-grid"><div><label>PRODUTO RECEBIDO</label><select value={sku} onChange={e=>setSku(e.target.value)}>{PRODUCTS.map(p=><option value={p.sku} key={p.sku}>{p.name}</option>)}</select></div><div><label>LOCALIZAÇÃO</label><select value={location} onChange={e=>setLocation(e.target.value)}>{LOCATIONS.map(l=><option key={l}>{l}</option>)}</select></div></div><button className="primary-btn" onClick={()=>act({type:'receive',sku,location})} disabled={busy}><PackagePlus size={17}/> REGISTRAR ENTRADA (+5 UN.)</button><button className="secondary-btn" onClick={()=>act({type:'pick',sku,location})} disabled={busy}><ClipboardList size={16}/> SEPARAR E CONFERIR 1 UNIDADE</button><Inventory team={myTeam}/></div>}
      {room?.phase==='rotation'&&<div className="operation"><div className="operation-illustration">📦<span>↗️</span></div><h3>Separação e saída de produtos</h3><p>Escolha o método de movimentação e o lote que será separado. O sistema confere a data de entrada e aplica a ordem correta.</p><div className="method-switch"><button className={method==='PEPS'?'selected':''} onClick={()=>setMethod('PEPS')}><b>PEPS</b><small>Primeiro que entra,<br/>primeiro que sai</small></button><button className={method==='UEPS'?'selected':''} onClick={()=>setMethod('UEPS')}><b>UEPS</b><small>Último que entra,<br/>primeiro que sai</small></button></div><label>LOTE PARA SEPARAÇÃO</label><select value={lotId} onChange={e=>setLotId(e.target.value)}><option value="">Selecione um lote</option>{(myTeam?.state?.inventory||[]).map(l=><option value={l.id} key={l.id}>{l.sku} • {l.location} • Entrada {l.sequence}</option>)}</select><button className="primary-btn" onClick={()=>act({type:'dispatch',method,lot_id:lotId})} disabled={busy||!lotId}><ArrowUpDown size={17}/> CONFIRMAR SAÍDA {method}</button><div className="concept-note">Atenção: conforme o material, o UEPS tem restrições e não é aceito pelo CPC 16 para atribuição de custos nas demonstrações contábeis. Aqui ele é usado apenas como regra operacional ilustrativa, quando aplicável.</div><Inventory team={myTeam}/></div>}
      {room?.phase==='crossdock'&&<div className="operation"><div className="operation-illustration">🚚<span>⚡</span></div><h3>Carga urgente na doca</h3><p>As caixas chegaram ao centro de distribuição. Separe conforme o destino e encaminhe diretamente para expedição, com pouca ou nenhuma armazenagem prolongada. A operação busca agilidade, economia de espaço e rapidez nas entregas.</p><div className="cargo-ticket"><div><small>CARGA RECEBIDA</small><b>LOTE EXPRESSO #{(room?.round||1)*27}</b></div><div className="cargo-dest"><MapPin/><strong>{room?.scenario?.crossdock_destination||'Sul'}</strong><small>DESTINO</small></div></div><label>PARA QUAL DESTINO VAI ENCAMINHAR?</label><select value={destination} onChange={e=>setDestination(e.target.value)}>{['Norte','Sul','Leste','Oeste'].map(x=><option key={x}>{x}</option>)}</select><button className="primary-btn" onClick={()=>act({type:'crossdock',destination})} disabled={busy}><Zap size={17}/> SEPARAR E ENCAMINHAR</button></div>}
      {room?.phase==='transit'&&<div className="operation"><div className="operation-illustration">🏭<span>🚛</span></div><h3>Organização do transit point</h3><p>As mercadorias chegaram ao ponto de passagem. Organize por região e transfira a carga para o veículo responsável pela próxima etapa.</p><div className="cargo-ticket"><div><small>REGIÃO DA CARGA</small><b>{room?.scenario?.transit_region||'Norte'}</b></div><div className="cargo-dest"><Route/><strong>TRANSFERÊNCIA</strong><small>VEÍCULO CERTO</small></div></div><label>VEÍCULO PARA TRANSFERÊNCIA</label><select value={vehicle} onChange={e=>setVehicle(e.target.value)}>{Object.values(VEHICLES).map(v=><option key={v}>{v}</option>)}</select><button className="primary-btn" onClick={()=>act({type:'transit',vehicle})} disabled={busy}><Truck size={17}/> TRANSFERIR CARGA</button></div>}
      {notice&&<div className="result-note"><CheckCircle2 size={17}/>{notice}</div>}
      </section><aside className="game-sidebar"><div className="side-card"><div className="card-title"><Trophy/><h3>Classificação</h3></div><Leaderboard teams={ranked}/></div><div className="side-card"><div className="card-title"><ClipboardList/><h3>Seu estoque WMS</h3></div><Inventory team={myTeam}/></div><div className="side-card"><div className="card-title"><Users/><h3>Equipes na disputa</h3></div><div className="big-number">{teams.length}<small> concorrentes</small></div></div></aside></>}
    </main>}
    <footer className="footer"><span>WAREHOUSE // SIMULADOR DE GESTÃO DE ARMAZENAGEM</span><span>ESTRATÉGIA • CONTROLE • DISTRIBUIÇÃO</span></footer>
  </div>;
}
function Leaderboard({teams}){return <div className="leaderboard">{teams.slice(0,8).map((t,i)=><div className={`rank-row ${i===0?'first':''}`} key={t.id}><span className="rank-num">{String(i+1).padStart(2,'0')}</span><span className="rank-name">{t.name}</span><b>{t.score} <small>XP</small></b></div>)}{!teams.length&&<p className="muted">Nenhuma equipe ainda.</p>}</div>}
function Inventory({team}){const inv=team?.state?.inventory||[];return <div className="inventory-list">{inv.length?inv.map(l=><div className="inventory-row" key={l.id}><span>📦</span><div><b>{l.sku}</b><small>{l.location} • Entrada {l.sequence}</small></div><strong>{l.qty} un.</strong></div>):<p className="muted small">Nenhum material registrado nesta operação.</p>}</div>}

export default App;
