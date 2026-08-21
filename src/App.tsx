import { useEffect, useMemo, useState } from "react";

type Role = "professional" | "cdm" | "supervisor" | "warehouse";
type Queue = "Programadas" | "Enviadas" | "Em espera" | "Histórico";
type Modal = "actions" | "materialTrip" | "observation" | "media" | "materialRequest" | "team" | "signature" | null;

type Order = {
  id: string;
  title: string;
  unit: string;
  path: string;
  priority: "P1" | "P2" | "P3";
  queue: Exclude<Queue, "Histórico">;
  state: string;
  summary: string;
  progress: number;
  scheduled?: string;
  reason?: string;
};

type HistoryItem = {
  id: string;
  date: string;
  time: string;
  service: string;
  unit: string;
  location: string;
  result: string;
  responsible: string;
};

type WarehouseRequest = {
  id: string;
  om: string;
  item: string;
  qty: string;
  professional: string;
  unit: string;
  state: "Pendente" | "Separando" | "Pronto" | "Sem estoque";
  age: string;
};

const orders: Order[] = [
  { id: "10482", title: "Banheiro masculino", unit: "Unidade Centro", path: "Bloco F · 9º andar · Banheiro público masculino", priority: "P1", queue: "Enviadas", state: "Manutenção", summary: "Sifão disponível · 2 dependências", progress: 48 },
  { id: "10491", title: "Vazamento na cozinha", unit: "Unidade Infantil", path: "Bloco A · Cozinha", priority: "P2", queue: "Enviadas", state: "Nova", summary: "1 atividade pendente", progress: 0 },
  { id: "10504", title: "Torneira sem pressão", unit: "Unidade de Saúde", path: "Térreo · Consultório 3", priority: "P3", queue: "Enviadas", state: "Retomada necessária", summary: "Material retirado às 09:02", progress: 60 },
  { id: "10488", title: "Revisão preventiva", unit: "Centro Administrativo", path: "Casa de máquinas", priority: "P3", queue: "Programadas", state: "Programada", summary: "Preventiva trimestral", progress: 0, scheduled: "Amanhã · 08:00" },
  { id: "10511", title: "Inspeção de bebedouros", unit: "Unidade Escolar Norte", path: "Pátio · 4 equipamentos", priority: "P3", queue: "Programadas", state: "Programada", summary: "Roteiro preventivo", progress: 0, scheduled: "25 ago · 09:30" },
  { id: "10470", title: "Vaso sanitário solto", unit: "Unidade Infantil Leste", path: "Bloco C · Banheiro infantil", priority: "P2", queue: "Em espera", state: "Aguardando outra oficina", summary: "Alvenaria · OM 10502", progress: 35, reason: "Base aguardando cura" },
  { id: "10476", title: "Registro geral travado", unit: "Unidade Escolar Oeste", path: "Área externa", priority: "P2", queue: "Em espera", state: "Aguardando material", summary: "Compra PC-1847", progress: 20, reason: "Sem estoque" },
];

const initialHistory: HistoryItem[] = [
  { id: "10398", date: "20/08/2026", time: "14:37", service: "Hidráulica", unit: "Unidade Centro", location: "Bloco F · 9º andar · Banheiro masculino", result: "Substituição do sifão e teste sem vazamento", responsible: "Profissional A · matrícula protegida" },
  { id: "10372", date: "19/08/2026", time: "11:12", service: "Hidráulica", unit: "Unidade Centro", location: "Bloco A · 10º andar · Banheiro público", result: "Reparo no registro e liberação do local", responsible: "Profissional A · matrícula protegida" },
  { id: "10291", date: "18/08/2026", time: "16:08", service: "Hidráulica", unit: "Unidade de Saúde", location: "Térreo · Sala técnica", result: "Desobstrução e limpeza da tubulação", responsible: "Profissional A · matrícula protegida" },
];

const cdmExceptions = [
  { id: "10496", kind: "OM sem profissional", title: "Portão lateral emperrado", unit: "Unidade Escolar Sul", age: "há 18 min", owner: "CDM", tone: "danger", detail: "O profissional padrão da unidade está de férias. É necessário decidir quem assume a OM.", action: "Designar profissional" },
  { id: "10490", kind: "Necessidade de outro setor", title: "Base do vaso quebrada", unit: "Unidade Centro", age: "há 31 min", owner: "CDM", tone: "warning", detail: "O profissional responsável registrou que não há condição de nova fixação sem serviço de alvenaria.", action: "Criar OM vinculada" },
  { id: "10473", kind: "Solução provisória", title: "Torneira do laboratório", unit: "Unidade Escolar Norte", age: "vence hoje", owner: "Encarregado", tone: "purple", detail: "O local segue operacional, mas o reparo definitivo continua pendente.", action: "Encaminhar avaliação" },
  { id: "10514", kind: "Assinatura recusada", title: "Quadro elétrico aquecendo", unit: "Unidade de Saúde", age: "há 42 min", owner: "CDM", tone: "danger", detail: "A unidade recusou a validação do serviço e registrou uma observação.", action: "Analisar devolução" },
];

const initialWarehouse: WarehouseRequest[] = [
  { id: "MAT-2481", om: "10482", item: "Sifão universal", qty: "1 un.", professional: "Profissional A", unit: "Unidade Centro", state: "Separando", age: "há 14 min" },
  { id: "MAT-2484", om: "10491", item: "Reparo para registro 3/4", qty: "2 un.", professional: "Profissional C", unit: "Unidade Infantil", state: "Pendente", age: "há 6 min" },
  { id: "FER-0712", om: "10504", item: "Furadeira de impacto", qty: "1 un.", professional: "Profissional D", unit: "Unidade de Saúde", state: "Pendente", age: "há 3 min" },
];

const roleMeta = {
  professional: { name: "Profissional A", subtitle: "Profissional · matrícula protegida", initials: "PA" },
  cdm: { name: "Operadora CDM", subtitle: "CDM operacional", initials: "CD" },
  supervisor: { name: "Encarregado do setor", subtitle: "Encarregado · Hidráulica", initials: "ES" },
  warehouse: { name: "Operador de almoxarifado", subtitle: "Almoxarifado", initials: "OA" },
};

const professionalQueues: Queue[] = ["Programadas", "Enviadas", "Em espera", "Histórico"];
const cdmSections = ["Solicitações", "Em andamento", "Em espera", "Exceções", "Concluídas"];
const supervisorSections = ["Equipe", "OMs", "Em espera", "Materiais do setor", "Alertas"];
const warehouseSections = ["Pendentes", "Separando", "Prontos", "Sem estoque"];

function formatTimer(total: number) {
  const hours = Math.floor(total / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function StateBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`state-badge ${tone}`}>{children}</span>;
}

export default function Home() {
  const [role, setRole] = useState<Role>("professional");
  const [queue, setQueue] = useState<Queue>("Enviadas");
  const [selectedOrder, setSelectedOrder] = useState("10482");
  const [openSections, setOpenSections] = useState<string[]>(["localização", "solicitação", "material", "hh"]);
  const [modal, setModal] = useState<Modal>(null);
  const [traveler, setTraveler] = useState<"Ajudante" | "Profissional" | "Os dois">("Ajudante");
  const [helperTrip, setHelperTrip] = useState(false);
  const [workPaused, setWorkPaused] = useState(false);
  const [materialReleased, setMaterialReleased] = useState(false);
  const [offline, setOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [elapsed, setElapsed] = useState(2533);
  const [toast, setToast] = useState<string | null>(null);
  const [timeline, setTimeline] = useState([
    "08:34 · Manutenção iniciada pelo Profissional A e Ajudante B",
    "08:27 · Primeiro atendimento registrado",
    "08:22 · Chegada ao local",
    "08:00 · Deslocamento iniciado",
  ]);
  const [observations, setObservations] = useState(["09:42 · Base do vaso quebrada. Necessário serviço de alvenaria."]);
  const [observationDraft, setObservationDraft] = useState("");
  const [media, setMedia] = useState(["Foto · 09:21", "Foto · 09:38", "Vídeo · 09:42", "Foto · 10:17"]);
  const [closureText, setClosureText] = useState("");
  const [hasPending, setHasPending] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureId, setSignatureId] = useState("");
  const [signed, setSigned] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(initialHistory);
  const [historySelected, setHistorySelected] = useState<string | null>(null);
  const [cdmSection, setCdmSection] = useState("Exceções");
  const [selectedException, setSelectedException] = useState("10496");
  const [resolvedExceptions, setResolvedExceptions] = useState<string[]>([]);
  const [supervisorSection, setSupervisorSection] = useState("Equipe");
  const [warehouseSection, setWarehouseSection] = useState("Pendentes");
  const [warehouseRequests, setWarehouseRequests] = useState<WarehouseRequest[]>(initialWarehouse);
  const [selectedRequest, setSelectedRequest] = useState("MAT-2481");

  useEffect(() => {
    if (workPaused || completed) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [workPaused, completed]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeOrder = orders.find((item) => item.id === selectedOrder) ?? orders[0];
  const activeException = cdmExceptions.find((item) => item.id === selectedException) ?? cdmExceptions[0];
  const activeRequest = warehouseRequests.find((item) => item.id === selectedRequest) ?? warehouseRequests[0];
  const visibleOrders = useMemo(() => orders.filter((item) => item.queue === queue && !(completed && item.id === "10482")), [queue, completed]);

  function notify(message: string) {
    setToast(message);
  }

  function recordEvent(message: string) {
    const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    setTimeline((items) => [`${time} · ${message}${offline ? " · aguardando conexão" : ""}`, ...items]);
    if (offline) setPendingSync((value) => value + 1);
  }

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    setModal(null);
    setHistorySelected(null);
    notify(nextRole === "professional" ? "Visão do profissional aberta" : nextRole === "cdm" ? "Visão geral do CDM aberta" : nextRole === "supervisor" ? "Visão da equipe de Hidráulica aberta" : "Fila do almoxarifado aberta");
  }

  function changeQueue(nextQueue: Queue) {
    setQueue(nextQueue);
    setHistorySelected(null);
    const first = orders.find((item) => item.queue === nextQueue && !(completed && item.id === "10482"));
    if (first) setSelectedOrder(first.id);
  }

  function toggleConnection() {
    if (offline) {
      const count = pendingSync;
      setOffline(false);
      setPendingSync(0);
      notify(count ? `${count} registros sincronizados com sucesso` : "Conexão restabelecida");
    } else {
      setOffline(true);
      notify("Modo offline ativado. As ações continuam disponíveis.");
    }
  }

  function toggleSection(section: string) {
    setOpenSections((items) => items.includes(section) ? items.filter((item) => item !== section) : [...items, section]);
  }

  function beginMaterialTrip() {
    setHelperTrip(true);
    if (traveler === "Os dois") setWorkPaused(true);
    recordEvent(`${traveler} iniciou deslocamento para retirar material`);
    setModal(null);
    notify(traveler === "Ajudante" ? "O Ajudante B saiu para retirar material. O Profissional A continua em manutenção." : traveler === "Os dois" ? "A manutenção foi pausada enquanto a equipe se desloca." : "O Profissional A saiu para retirar material. O Ajudante B permanece no local.");
  }

  function finishMaterialTrip() {
    setHelperTrip(false);
    setWorkPaused(false);
    recordEvent("O Ajudante B retornou e reintegrou-se à manutenção");
    notify("Retorno registrado. O homem-hora foi separado automaticamente.");
  }

  function addObservation() {
    if (!observationDraft.trim()) return;
    const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    setObservations((items) => [`${time} · ${observationDraft.trim()}`, ...items]);
    recordEvent("Observação adicionada");
    setObservationDraft("");
    setModal(null);
    notify("Observação adicionada ao histórico da OM.");
  }

  function finishWorkOrder() {
    if (!signatureName || !signatureId || !signed) return;
    const completedItem: HistoryItem = { id: "10482", date: "20/08/2026", time: "15:08", service: "Hidráulica", unit: "Unidade Centro", location: "Bloco F · 9º andar · Banheiro masculino", result: closureText || "Serviço executado e validado pela unidade", responsible: "Profissional A · matrícula protegida" };
    setHistoryItems((items) => items.some((item) => item.id === "10482") ? items : [completedItem, ...items]);
    setCompleted(true);
    setModal(null);
    setQueue("Histórico");
    setHistorySelected("10482");
    recordEvent("OM concluída após validação e assinatura");
    notify("OM concluída e movida para o seu Histórico pessoal.");
  }

  function updateWarehouse(state: WarehouseRequest["state"]) {
    setWarehouseRequests((items) => items.map((item) => item.id === activeRequest.id ? { ...item, state } : item));
    if (activeRequest.id === "MAT-2481" && state === "Pronto") {
      setMaterialReleased(true);
      notify("Material liberado. O profissional responsável recebeu a notificação e a atividade está executável.");
    } else {
      notify(state === "Sem estoque" ? "A atividade foi bloqueada e encaminhada para análise de compra." : `Solicitação marcada como ${state.toLowerCase()}.`);
    }
  }

  const mainState = helperTrip ? (traveler === "Ajudante" ? "Manutenção · ajudante em deslocamento" : "Deslocamento para material") : workPaused ? "Manutenção pausada" : materialReleased ? "Manutenção · material disponível" : "Manutenção em execução";
  const user = roleMeta[role];

  return (
    <main className={`app-shell role-${role}`}>
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">M</span><span>Manut</span></div>

        {role === "professional" && <SideNav items={professionalQueues} active={queue} onChange={(item) => changeQueue(item as Queue)} counts={{ Programadas: 2, Enviadas: completed ? 2 : 3, "Em espera": 2 }} />}
        {role === "cdm" && <SideNav items={cdmSections} active={cdmSection} onChange={setCdmSection} counts={{ Solicitações: 8, Exceções: cdmExceptions.length - resolvedExceptions.length }} />}
        {role === "supervisor" && <SideNav items={supervisorSections} active={supervisorSection} onChange={setSupervisorSection} counts={{ Alertas: 5, "Em espera": 9 }} />}
        {role === "warehouse" && <SideNav items={warehouseSections} active={warehouseSection} onChange={setWarehouseSection} counts={{ Pendentes: 2 }} />}

        <div className="sidebar-note"><span>CONCEITO DE PRODUTO</span><p>Automatizar comunicação e estados sem substituir a decisão humana.</p></div>
        <div className="sidebar-user"><span className="avatar">{user.initials}</span><span><strong>{user.name}</strong><small>{user.subtitle}</small></span></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="welcome"><p className="eyebrow">PROTÓTIPO INTERATIVO · DADOS FICTÍCIOS</p><h1>{role === "professional" ? "Bom dia, Profissional A" : role === "cdm" ? "Fluxo geral da operação" : role === "supervisor" ? "Hidráulica sob controle" : "Fila de atendimento"}</h1></div>
          <div className="top-actions">
            <div className="role-switch" aria-label="Alternar perfil">
              <button className={role === "professional" ? "active" : ""} onClick={() => changeRole("professional")}>Profissional</button>
              <button className={role === "cdm" ? "active" : ""} onClick={() => changeRole("cdm")}>CDM</button>
              <button className={role === "supervisor" ? "active" : ""} onClick={() => changeRole("supervisor")}>Encarregado</button>
              <button className={role === "warehouse" ? "active" : ""} onClick={() => changeRole("warehouse")}>Almox.</button>
            </div>
            <button className={`sync-pill ${offline ? "offline" : ""}`} onClick={toggleConnection}><span className="sync-dot" /><span>{offline ? `${pendingSync} aguardando conexão` : "Tudo sincronizado"}</span></button>
          </div>
        </header>

        {role === "professional" && (
          <>
            <div className="mobile-tabs">{professionalQueues.map((item) => <button key={item} className={queue === item ? "active" : ""} onClick={() => changeQueue(item)}>{item}{item !== "Histórico" && <b>{item === "Programadas" ? 2 : item === "Enviadas" ? (completed ? 2 : 3) : 2}</b>}</button>)}</div>
            {queue === "Histórico" ? (
              <ProfessionalHistory items={historyItems} selected={historySelected} setSelected={setHistorySelected} />
            ) : (
              <>
                <QueueIntro queue={queue} offline={offline} toggleConnection={toggleConnection} />
                <div className="professional-layout">
                  <OrderList orders={visibleOrders} selected={selectedOrder} setSelected={setSelectedOrder} queue={queue} />
                  <ProfessionalOrder
                    order={activeOrder}
                    openSections={openSections}
                    toggleSection={toggleSection}
                    state={mainState}
                    elapsed={elapsed}
                    helperTrip={helperTrip}
                    workPaused={workPaused}
                    materialReleased={materialReleased}
                    timeline={timeline}
                    observations={observations}
                    media={media}
                    closureText={closureText}
                    setClosureText={setClosureText}
                    hasPending={hasPending}
                    setHasPending={setHasPending}
                    setModal={setModal}
                    finishMaterialTrip={finishMaterialTrip}
                    releaseMaterial={() => { setMaterialReleased(true); recordEvent("Almoxarifado marcou o sifão como pronto para retirada"); notify("Sifão pronto para retirada. A atividade está liberada."); }}
                    resume={() => { setWorkPaused(false); recordEvent("Manutenção retomada"); notify("Manutenção retomada. O tempo voltou a ser calculado."); }}
                    notify={notify}
                  />
                </div>
              </>
            )}
          </>
        )}

        {role === "cdm" && <CdmView section={cdmSection} selected={selectedException} setSelected={setSelectedException} active={activeException} resolved={resolvedExceptions} resolve={() => { setResolvedExceptions((items) => [...items, activeException.id]); notify(`${activeException.action}: decisão registrada no histórico.`); }} notify={notify} />}
        {role === "supervisor" && <SupervisorView section={supervisorSection} notify={notify} />}
        {role === "warehouse" && <WarehouseView section={warehouseSection} requests={warehouseRequests} selected={selectedRequest} setSelected={setSelectedRequest} active={activeRequest} update={updateWarehouse} />}

        <footer className="portfolio-footer"><span>MANUT · CONCEITO DE PRODUTO</span><p>Demonstração de portfólio com dados 100% fictícios e identidades protegidas.</p></footer>
      </section>

      <nav className="mobile-bottom-nav" aria-label="Perfis da demonstração">
        <button className={role === "professional" ? "active" : ""} onClick={() => changeRole("professional")}><span>P</span>Profissional</button>
        <button className={role === "cdm" ? "active" : ""} onClick={() => changeRole("cdm")}><span>C</span>CDM</button>
        <button className={role === "supervisor" ? "active" : ""} onClick={() => changeRole("supervisor")}><span>E</span>Encarregado</button>
        <button className={role === "warehouse" ? "active" : ""} onClick={() => changeRole("warehouse")}><span>M</span>Almox.</button>
      </nav>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setModal(null); }}>
          <section className="action-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="close-button" onClick={() => setModal(null)} aria-label="Fechar">×</button>

            {modal === "actions" && <><span className="section-kicker">OM 10482 · AGORA</span><h2 id="modal-title">O que aconteceu?</h2><p className="modal-intro">A hora e a equipe serão registradas automaticamente.</p><div className="action-options"><button onClick={() => setModal("materialTrip")}><b className="option-icon material">M</b><span><strong>Retirar material</strong><small>O material existe e alguém precisa buscá-lo</small></span><i>→</i></button><button onClick={() => { setWorkPaused(!workPaused); recordEvent(workPaused ? "Manutenção retomada" : "Manutenção pausada"); setModal(null); notify(workPaused ? "Manutenção retomada." : "Pausa registrada no homem-hora."); }}><b className="option-icon pause">II</b><span><strong>{workPaused ? "Retomar manutenção" : "Pausar manutenção"}</strong><small>Atualiza o intervalo de trabalho da equipe</small></span><i>→</i></button><button onClick={() => { recordEvent("Primeira atividade concluída"); setModal(null); notify("Atividade concluída. As demais continuam independentes."); }}><b className="option-icon done">✓</b><span><strong>Concluir atividade</strong><small>Finaliza apenas o trabalho selecionado</small></span><i>→</i></button><button onClick={() => { recordEvent("NOK registrado e pendência criada"); setModal(null); notify("NOK encaminhado como nova pendência."); }}><b className="option-icon nok">!</b><span><strong>Registrar NOK</strong><small>Cria uma atividade ou dependência</small></span><i>→</i></button></div></>}

            {modal === "materialTrip" && <><button className="back-link" onClick={() => setModal("actions")}>← Voltar</button><span className="section-kicker">RETIRADA DE MATERIAL</span><h2 id="modal-title">Quem irá buscar?</h2><p className="modal-intro">O sistema separa o homem-hora de cada pessoa.</p><div className="choice-grid">{(["Ajudante", "Profissional", "Os dois"] as const).map((item) => <button key={item} className={traveler === item ? "selected" : ""} onClick={() => setTraveler(item)}><span>{item === "Ajudante" ? "AB" : item === "Profissional" ? "PA" : "2"}</span><strong>{item}</strong><small>{item === "Ajudante" ? "Profissional A continua em manutenção" : item === "Profissional" ? "Ajudante B permanece no local" : "A manutenção será pausada"}</small></button>)}</div><div className="impact-note"><span>i</span><p>{traveler === "Ajudante" ? "O Ajudante B entra em deslocamento e o Profissional A continua apontado na manutenção." : traveler === "Os dois" ? "Os dois entram em deslocamento e a manutenção é pausada." : "O Profissional A entra em deslocamento; o Ajudante B continua apenas como ajudante da OM."}</p></div><button className="wide-primary" onClick={beginMaterialTrip}>Iniciar deslocamento <span>→</span></button></>}

            {modal === "observation" && <><span className="section-kicker">REGISTRO DURANTE O SERVIÇO</span><h2 id="modal-title">Nova observação</h2><p className="modal-intro">Isto não encerra a OM e fica separado do fechamento.</p><label className="field-label" htmlFor="observation">Observação</label><textarea id="observation" value={observationDraft} onChange={(event) => setObservationDraft(event.target.value)} placeholder="Ex.: Não existe condição de realizar nova fixação sem alvenaria." /><button className="wide-primary" disabled={!observationDraft.trim()} onClick={addObservation}>Adicionar observação <span>→</span></button></>}

            {modal === "media" && <><span className="section-kicker">GALERIA LIVRE</span><h2 id="modal-title">Adicionar mídia</h2><p className="modal-intro">Não é necessário classificar como antes, durante ou depois.</p><div className="media-actions"><button onClick={() => { setMedia((items) => [...items, "Foto · agora"]); setModal(null); notify("Foto adicionada à galeria."); }}>+ Foto</button><button onClick={() => { setMedia((items) => [...items, "Vídeo · agora"]); setModal(null); notify("Vídeo adicionado à galeria."); }}>+ Vídeo</button><button onClick={() => { setMedia((items) => [...items, "Foto da galeria · agora"]); setModal(null); notify("Arquivo selecionado da galeria."); }}>+ Galeria</button></div><p className="modal-footnote">Em preventiva com resultado NOK, a foto do problema continua obrigatória.</p></>}

            {modal === "materialRequest" && <><span className="section-kicker">MATERIAL</span><h2 id="modal-title">Preciso de material</h2><p className="modal-intro">O sistema verificará materiais do setor, com profissionais e no almoxarifado antes da compra.</p><label className="field-label" htmlFor="material">Item ou descrição</label><input id="material" className="text-input" defaultValue="Sifão universal" /><label className="field-label" htmlFor="quantity">Quantidade</label><input id="quantity" className="text-input" defaultValue="1" /><button className="wide-primary" onClick={() => { recordEvent("Material solicitado: Sifão universal · 1 un."); setModal(null); notify("Solicitação enviada ao almoxarifado."); }}>Verificar disponibilidade <span>→</span></button></>}

            {modal === "team" && <><span className="section-kicker">EQUIPE TEMPORÁRIA DA OM</span><h2 id="modal-title">Equipe</h2><p className="modal-intro">A OM pertence ao Profissional A. O Ajudante B participa somente desta ordem.</p><div className="team-list"><div><span className="avatar large">PA</span><p><small>RESPONSÁVEL</small><strong>Profissional A</strong><span>Matrícula protegida</span></p></div><div><span className="avatar large alt">AB</span><p><small>AJUDANTE</small><strong>Ajudante B</strong><span>Matrícula protegida</span></p><button>×</button></div></div><button className="outline-wide" onClick={() => notify("Busca demonstrativa disponível por nome ou matrícula.")}>+ Adicionar ajudante</button></>}

            {modal === "signature" && <><span className="section-kicker">VALIDAÇÃO DO SERVIÇO</span><h2 id="modal-title">Assinatura da unidade</h2><p className="modal-intro">Após confirmar, a OM será concluída e entrará no Histórico pessoal do profissional responsável.</p><div className="signature-fields"><label>Nome<input value={signatureName} onChange={(event) => setSignatureName(event.target.value)} placeholder="Nome demonstrativo" /></label><label>Matrícula<input value={signatureId} onChange={(event) => setSignatureId(event.target.value)} placeholder="Identificação demonstrativa" /></label></div><button className={`signature-pad ${signed ? "signed" : ""}`} onClick={() => setSigned(true)}>{signed ? <><span className="signature-script">Validado</span><small>Toque para refazer</small></> : <><strong>Assinatura / rúbrica</strong><small>Toque e assine nesta área</small></>}</button><button className="wide-primary" disabled={!signatureName || !signatureId || !signed} onClick={finishWorkOrder}>Confirmar e concluir OM <span>→</span></button></>}
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><span>✓</span><p>{toast}</p><button onClick={() => setToast(null)}>×</button></div>}
    </main>
  );
}

function SideNav({ items, active, onChange, counts = {} }: { items: string[]; active: string; onChange: (item: string) => void; counts?: Record<string, number> }) {
  return <nav>{items.map((item, index) => <button key={item} className={`nav-item ${active === item ? "active" : ""}`} onClick={() => onChange(item)}><span className="nav-glyph">{String(index + 1).padStart(2, "0")}</span>{item}{counts[item] !== undefined && <b>{counts[item]}</b>}</button>)}</nav>;
}

function QueueIntro({ queue, offline, toggleConnection }: { queue: Queue; offline: boolean; toggleConnection: () => void }) {
  return <section className="context-strip"><div><span className={`context-dot ${queue === "Em espera" ? "waiting" : ""}`} /><div><strong>{queue === "Enviadas" ? "Pode ser executado agora" : queue === "Programadas" ? "Planejado para depois" : "Bloqueado por condição externa"}</strong><small>{queue === "Enviadas" ? "Estados diferentes, mas sempre com uma próxima ação possível." : queue === "Programadas" ? "O sistema libera a OM na data programada." : "Quando a dependência for resolvida, a OM volta automaticamente."}</small></div></div><button className="text-button" onClick={toggleConnection}>{offline ? "Voltar online" : "Simular modo offline"}</button></section>;
}

function OrderList({ orders: items, selected, setSelected, queue }: { orders: Order[]; selected: string; setSelected: (id: string) => void; queue: Queue }) {
  return <section className="order-list"><div className="list-heading"><div><span className="section-kicker">MINHA FILA</span><h2>{queue}</h2></div><span>{items.length} ordens</span></div>{items.map((order) => <button key={order.id} className={`order-card ${selected === order.id ? "selected" : ""}`} onClick={() => setSelected(order.id)}><div className="order-meta"><span className={`priority ${order.priority.toLowerCase()}`}>{order.priority}</span><span className="mono">OM {order.id}</span></div><h3>{order.title}</h3><p>{order.unit} · {order.path}</p>{order.reason && <div className="reason-line"><span />{order.reason}</div>}<div className="progress-line"><span style={{ width: `${order.progress}%` }} /></div><footer><span>{order.scheduled ?? order.summary}</span><strong>{order.state}</strong></footer></button>)}{!items.length && <div className="empty-state"><span>✓</span><strong>Nenhuma ordem nesta fila</strong><p>O sistema atualiza esta lista automaticamente.</p></div>}</section>;
}

function ProfessionalOrder(props: {
  order: Order;
  openSections: string[];
  toggleSection: (section: string) => void;
  state: string;
  elapsed: number;
  helperTrip: boolean;
  workPaused: boolean;
  materialReleased: boolean;
  timeline: string[];
  observations: string[];
  media: string[];
  closureText: string;
  setClosureText: (value: string) => void;
  hasPending: boolean;
  setHasPending: (value: boolean) => void;
  setModal: (modal: Modal) => void;
  finishMaterialTrip: () => void;
  releaseMaterial: () => void;
  resume: () => void;
  notify: (message: string) => void;
}) {
  const { order, openSections, toggleSection, state, elapsed, helperTrip, workPaused, materialReleased, timeline, observations, media, closureText, setClosureText, hasPending, setHasPending, setModal, finishMaterialTrip, releaseMaterial, resume, notify } = props;
  const isMain = order.id === "10482";
  return <article className="work-order">
    <header className="work-order-head"><div><button className="back-mobile">← Minha fila</button><span className="breadcrumb mono">OM {order.id} · HIDRÁULICA</span><h2>{order.title}</h2><p>{order.unit} · {order.path}</p></div><div><StateBadge tone={order.priority === "P1" ? "danger" : "neutral"}>{order.priority === "P1" ? "Urgente" : "Normal"}</StateBadge><button className="more-button">•••</button></div></header>
    <div className={`live-state ${order.queue === "Em espera" ? "waiting" : ""}`}><span className="pulse" /><div><small>ESTADO ATUAL</small><strong>{isMain ? state : order.state}</strong><span>{isMain ? "Horários e homem-hora são calculados pelas ações." : order.reason || "A próxima ação está disponível."}</span></div>{isMain && <><b className="timer">{formatTimer(elapsed)}</b><button onClick={() => helperTrip ? finishMaterialTrip() : workPaused ? resume() : setModal("actions")}>{helperTrip ? "Registrar retorno" : workPaused ? "Retomar" : "Registrar ação"}</button></>}</div>
    <div className="accordion-stack">
      <Accordion id="localização" title="Localização" summary={`${order.unit} › ${order.path}`} open={openSections.includes("localização")} toggle={toggleSection}>
        <div className="fact-grid"><Fact label="Unidade" value={order.unit} /><Fact label="Prédio / Bloco" value={isMain ? "Bloco F" : "Bloco principal"} /><Fact label="Andar" value={isMain ? "9º andar" : "Térreo"} /><Fact label="Local" value={order.title} /></div>
      </Accordion>
      <Accordion id="solicitação" title="Solicitação" summary="Solicitante da unidade · vazamento na pia" open={openSections.includes("solicitação")} toggle={toggleSection}>
        <div className="request-details"><div className="request-person"><Fact label="Solicitante" value="Solicitante da unidade" /><Fact label="Matrícula" value="Protegida" /><Fact label="Ponto de encontro" value="Sala administrativa" /><Fact label="Horário" value="08:00 às 15:00" /></div><blockquote>“Solicito manutenção na pia do banheiro, pois está apresentando vazamento.”</blockquote><div className="attachment-row"><button onClick={() => notify("Foto da solicitação aberta.")}><span>F</span>Foto 1</button><button onClick={() => notify("Foto da solicitação aberta.")}><span>F</span>Foto 2</button><button onClick={() => notify("Vídeo da solicitação aberto.")}><span>V</span>Vídeo</button></div></div>
      </Accordion>
      <Accordion id="material" title="Material" summary={materialReleased ? "Sifão universal · pronto para retirada" : "1 item separando · 1 aguardando compra"} open={openSections.includes("material")} toggle={toggleSection}>
        <div className="section-toolbar"><p>Consulte, solicite ou registre material já disponível no setor.</p><button onClick={() => setModal("materialRequest")}>+ Preciso de material</button></div><div className="resource-list"><div><span className="resource-icon">M</span><p><strong>Sifão universal</strong><small>Quantidade 1 · Almoxarifado</small></p><StateBadge tone={materialReleased ? "success" : "warning"}>{materialReleased ? "Pronto para retirada" : "Separando"}</StateBadge><button onClick={materialReleased ? () => setModal("materialTrip") : releaseMaterial}>{materialReleased ? "Retirar" : "Simular liberação"}</button></div><div><span className="resource-icon">M</span><p><strong>Torneira modelo X</strong><small>Quantidade 1 · Requisição PC-1847</small></p><StateBadge tone="warning">Aguardando compra</StateBadge></div><div><span className="resource-icon sector">S</span><p><strong>Fita veda rosca</strong><small>Origem: materiais do setor · sem requisição</small></p><StateBadge tone="success">Utilizado</StateBadge></div></div>
      </Accordion>
      <Accordion id="ferramentas" title="Ferramentas" summary="Furadeira 04 retirada pelo Ajudante B" open={openSections.includes("ferramentas")} toggle={toggleSection}>
        <div className="resource-list"><div><span className="resource-icon tool">F</span><p><strong>Furadeira 04</strong><small>Retirada pelo Ajudante B · matrícula protegida · 09:32</small></p><StateBadge tone="running">Com a equipe</StateBadge></div><div><span className="resource-icon tool">M</span><p><strong>Martelete 02</strong><small>Com o Profissional A · matrícula protegida</small></p><StateBadge>Em uso</StateBadge></div></div><button className="outline-button" onClick={() => notify("Consulta de ferramentas do almoxarifado aberta.")}>Consultar almoxarifado</button>
      </Accordion>
      <Accordion id="mídia" title="Fotos e vídeos" summary={`${media.length} arquivos · galeria livre`} open={openSections.includes("mídia")} toggle={toggleSection}>
        <div className="section-toolbar"><p>Legenda opcional. Sem obrigação de classificar antes, durante ou depois.</p><button onClick={() => setModal("media")}>+ Adicionar mídia</button></div><div className="media-grid">{media.map((item, index) => <button key={`${item}-${index}`} onClick={() => notify(`${item} aberto.`)}><span>{item.startsWith("Vídeo") ? "▶" : "▣"}</span><small>{item}</small></button>)}</div><p className="section-note">Em preventiva com NOK, a foto do problema é obrigatória.</p>
      </Accordion>
      <Accordion id="hh" title="Homem-hora" summary={`${state} · ${formatTimer(elapsed)}`} open={openSections.includes("hh")} toggle={toggleSection}>
        <div className="hh-head"><div><span className="section-kicker">20/08/2026</span><strong>Apontamento automático</strong></div><button onClick={() => notify("A correção preservará o evento original.")}>Corrigir apontamento</button></div><div className="timeline">{timeline.map((event, index) => <div key={`${event}-${index}`}><i className={index === 0 ? "latest" : ""} /><p>{event}</p></div>)}</div><div className="inline-actions"><button onClick={() => setModal("actions")}>Registrar ação</button>{helperTrip && <button onClick={finishMaterialTrip}>Registrar retorno do ajudante</button>}</div>
      </Accordion>
      <Accordion id="equipe" title="Equipe" summary="Profissional A responsável · Ajudante B" open={openSections.includes("equipe")} toggle={toggleSection}>
        <div className="team-inline"><div><span className="avatar">PA</span><p><small>PROFISSIONAL RESPONSÁVEL</small><strong>Profissional A</strong><span>Matrícula protegida</span></p></div><div><span className="avatar alt">AB</span><p><small>AJUDANTE</small><strong>Ajudante B</strong><span>Matrícula protegida</span></p></div></div><button className="outline-button" onClick={() => setModal("team")}>+ Adicionar ajudante</button>
      </Accordion>
      <Accordion id="observações" title="Observações" summary={`${observations.length} registros durante o serviço`} open={openSections.includes("observações")} toggle={toggleSection}>
        <div className="observation-list">{observations.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</div><button className="outline-button" onClick={() => setModal("observation")}>+ Nova observação</button>
      </Accordion>
      <Accordion id="fechamento" title="Fechamento" summary="Descrever serviço e validar com a unidade" open={openSections.includes("fechamento")} toggle={toggleSection}>
        <label className="field-label" htmlFor="closure">Descreva o serviço realizado</label><textarea id="closure" className="closure-textarea" value={closureText} onChange={(event) => setClosureText(event.target.value)} placeholder="Ex.: Foi realizada a substituição do sifão, limpeza da conexão e teste de funcionamento." /><div className="pending-choice"><span>Há alguma pendência?</span><button className={!hasPending ? "selected" : ""} onClick={() => setHasPending(false)}>Não</button><button className={hasPending ? "selected warning" : ""} onClick={() => setHasPending(true)}>Sim</button></div>{hasPending && <div className="pending-warning">A pendência continuará aberta após a validação. O local pode ser marcado como operacional sem encerrar o reparo definitivo.</div>}<button className="finish-button" disabled={!closureText.trim()} onClick={() => setModal("signature")}>Finalizar fechamento <span>→</span></button>
      </Accordion>
    </div>
  </article>;
}

function Accordion({ id, title, summary, open, toggle, children }: { id: string; title: string; summary: string; open: boolean; toggle: (id: string) => void; children: React.ReactNode }) {
  return <section className={`accordion ${open ? "open" : ""}`}><button className="accordion-head" aria-expanded={open} onClick={() => toggle(id)}><span>{open ? "−" : "+"}</span><div><strong>{title}</strong><small>{summary}</small></div><i>{open ? "⌃" : "⌄"}</i></button>{open && <div className="accordion-body">{children}</div>}</section>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="fact"><small>{label}</small><strong>{value}</strong></div>;
}

function ProfessionalHistory({ items, selected, setSelected }: { items: HistoryItem[]; selected: string | null; setSelected: (id: string | null) => void }) {
  const [query, setQuery] = useState("");
  const filtered = items.filter((item) => `${item.id} ${item.unit} ${item.location} ${item.service}`.toLowerCase().includes(query.toLowerCase()));
  const record = items.find((item) => item.id === selected);
  if (record) return <HistoryConsultation item={record} back={() => setSelected(null)} />;
  return <section className="personal-history"><header className="history-header"><div><span className="section-kicker">HISTÓRICO PESSOAL</span><h2>OMs em que você foi o responsável</h2><p>Participações apenas como ajudante não aparecem nesta lista.</p></div><div className="history-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar OM, unidade ou local" /><button>Período</button><button>Serviço</button></div></header><div className="history-table">{filtered.map((item) => <button key={item.id} className="history-record" onClick={() => setSelected(item.id)}><span className="history-date"><strong>{item.date}</strong><small className="mono">{item.time}</small></span><span><small className="mono">OM {item.id} · {item.service}</small><strong>{item.unit}</strong><span>{item.location}</span></span><span className="history-result"><StateBadge tone="success">Concluída</StateBadge><small>{item.result}</small></span><i>Consulta →</i></button>)}{!filtered.length && <div className="empty-state"><span>⌕</span><strong>Nenhuma OM encontrada</strong><p>Tente outro número, unidade ou local.</p></div>}</div><p className="history-scope-note"><span>i</span> Este histórico é pessoal: mostra somente OMs em que o usuário foi o profissional responsável designado.</p></section>;
}

function HistoryConsultation({ item, back }: { item: HistoryItem; back: () => void }) {
  return <section className="consultation"><header><button onClick={back}>← Voltar ao Histórico</button><StateBadge tone="success">Modo consulta · Concluída</StateBadge></header><div className="consultation-title"><span className="section-kicker mono">OM {item.id} · {item.service}</span><h2>{item.unit}</h2><p>{item.location}</p></div><div className="consultation-grid"><div><span className="section-kicker">RESPONSABILIDADE</span><strong>{item.responsible}</strong><small>Responsável designado da OM</small></div><div><span className="section-kicker">CONCLUSÃO</span><strong>{item.date} · {item.time}</strong><small>Validada por solicitante da unidade · identificação protegida</small></div></div><div className="readonly-stack"><section><span>Localização</span><p>{item.unit} › {item.location}</p></section><section><span>Serviço realizado</span><p>{item.result}. Equipamento liberado para uso, sem vazamento.</p></section><section><span>Homem-hora</span><p>08:00 deslocamento · 08:22 chegada · 08:34 manutenção · {item.time} conclusão</p></section><section><span>Equipe</span><p>Profissional A — responsável · Ajudante B — apoio temporário</p></section><section><span>Materiais</span><p>Sifão universal — 1 un. · Origem: almoxarifado</p></section></div><p className="readonly-note">Esta OM está encerrada. As informações podem ser consultadas, mas não alteradas.</p></section>;
}

function CdmView({ section, selected, setSelected, active, resolved, resolve, notify }: { section: string; selected: string; setSelected: (id: string) => void; active: typeof cdmExceptions[number]; resolved: string[]; resolve: () => void; notify: (message: string) => void }) {
  if (section === "Solicitações") return <><PageSummary kicker="CDM · SOLICITAÇÕES" title="8 aguardando análise" description="Pedidos das unidades chegam aqui antes de virar OM." action="+ Nova solicitação" onAction={() => notify("Nova solicitação aberta.")} /><div className="split-layout"><section className="control-list"><ListHeader title="Novas solicitações" /><button className="control-row selected"><span className="exception-icon warning">S</span><span><small className="mono">SOL 5218 · HÁ 12 MIN</small><strong>Pia com vazamento</strong><i>Unidade Centro · Bloco F · 9º andar</i></span><StateBadge tone="warning">2 fotos · 1 vídeo</StateBadge></button><button className="control-row"><span className="exception-icon">S</span><span><small className="mono">SOL 5219 · HÁ 8 MIN</small><strong>Fechadura da secretaria</strong><i>Unidade Infantil · Secretaria</i></span><StateBadge>Nova</StateBadge></button></section><article className="inspection-panel"><span className="section-kicker mono">SOL 5218</span><h2>Pia com vazamento</h2><p className="inspection-subtitle">Solicitante da unidade · identificação protegida</p><div className="request-card"><strong>“Solicito manutenção na pia do banheiro, pois está apresentando vazamento.”</strong><small>Ponto de encontro: Sala administrativa · 08:00 às 15:00</small></div><div className="form-grid"><label>Setor<select defaultValue="Hidráulica"><option>Hidráulica</option></select></label><label>Profissional<select defaultValue="Profissional A"><option>Profissional A · padrão da unidade</option></select></label><label>Prioridade<select defaultValue="Normal"><option>Normal</option><option>Urgente</option></select></label></div><button className="wide-primary" onClick={() => notify("OM criada e enviada ao profissional responsável.")}>Criar OM <span>→</span></button></article></div></>;
  if (section === "Exceções") {
    const open = cdmExceptions.filter((item) => !resolved.includes(item.id));
    return <><PageSummary kicker="CDM · EXCEÇÕES" title={`${open.length} situações pedem decisão`} description="O restante da operação segue sem vigilância manual." metrics={["08 Solicitações", "26 Em andamento", "14 Em espera", `${open.length} Exceções`]} /><div className="split-layout"><section className="control-list"><ListHeader title="Exceções abertas" />{open.map((item) => <button key={item.id} className={`control-row ${selected === item.id ? "selected" : ""}`} onClick={() => setSelected(item.id)}><span className={`exception-icon ${item.tone}`}>!</span><span><small className="mono">OM {item.id} · {item.age}</small><strong>{item.kind}</strong><i>{item.title} · {item.unit}</i></span><b>{item.owner} →</b></button>)}</section><article className="inspection-panel"><span className={`exception-icon ${active.tone}`}>!</span><span className="section-kicker mono">OM {active.id}</span><h2>{active.kind}</h2><p className="inspection-subtitle">{active.title} · {active.unit}</p><div className="why-card"><span className="section-kicker">POR QUE ESTÁ AQUI</span><p>{active.detail}</p></div><div className="decision-note"><strong>Próximo passo sugerido</strong><p>{active.action}. O sistema não toma essa decisão pelo CDM.</p></div><button className="wide-primary" onClick={resolve}>{active.action} <span>→</span></button></article></div></>;
  }
  const label = section === "Em andamento" ? "26 OMs ativas" : section === "Em espera" ? "14 OMs bloqueadas" : "184 OMs concluídas";
  return <><PageSummary kicker={`CDM · ${section.toUpperCase()}`} title={label} description={section === "Concluídas" ? "Histórico geral dentro do escopo do CDM." : "Cartões mostram o essencial sem exigir abrir cada OM."} /><section className="generic-table"><div className="table-head"><span>ORDEM / LOCAL</span><span>SETOR / PROFISSIONAL</span><span>ESTADO</span><span>ÚLTIMO EVENTO</span></div>{orders.slice(0, 5).map((order) => <button key={order.id} onClick={() => notify(`OM ${order.id} aberta.`)}><span><b className="mono">OM {order.id}</b><small>{order.unit} · {order.path}</small></span><span>Hidráulica<small>Profissional A</small></span><span><StateBadge tone={order.queue === "Em espera" ? "warning" : "running"}>{order.state}</StateBadge></span><span>{order.queue === "Em espera" ? order.reason : "10:32 · Manutenção iniciada"}<i>→</i></span></button>)}</section></>;
}

function SupervisorView({ section, notify }: { section: string; notify: (message: string) => void }) {
  const people = [{ initials: "PA", name: "Profissional A", status: "Ativo", sent: 3, waiting: 5, scheduled: 2 }, { initials: "PB", name: "Profissional B", status: "Férias até 25/08", sent: 0, waiting: 1, scheduled: 0 }, { initials: "PC", name: "Profissional C", status: "Ativa", sent: 4, waiting: 2, scheduled: 1 }];
  if (section === "Equipe") return <><PageSummary kicker="ENCARREGADO · HIDRÁULICA" title="Equipe e disponibilidade" description="Acompanhe carga e disponibilidade sem redistribuir serviços automaticamente." /><div className="team-cards">{people.map((person) => <article key={person.name}><header><span className="avatar">{person.initials}</span><div><h3>{person.name}</h3><StateBadge tone={person.status === "Ativo" || person.status === "Ativa" ? "success" : "warning"}>{person.status}</StateBadge></div></header><div className="team-counts"><span><b>{person.sent}</b>Enviadas</span><span><b>{person.waiting}</b>Em espera</span><span><b>{person.scheduled}</b>Programadas</span></div><button onClick={() => notify(`${person.name}: OMs abertas.`)}>Ver OMs <span>→</span></button></article>)}</div></>;
  if (section === "Materiais do setor") return <><PageSummary kicker="ENCARREGADO · MATERIAIS DO SETOR" title="Itens disponíveis na operação" description="Materiais recuperados ou reutilizáveis que o profissional pode consultar e utilizar." action="+ Adicionar item" onAction={() => notify("Cadastro rápido de item aberto.")} /><section className="sector-materials">{[{ item: "Sifão universal", qty: 2, origin: "Sobras de manutenção" }, { item: "Torneira recuperada modelo X", qty: 1, origin: "Recuperada na OM 10218" }, { item: "Tubo de ligação", qty: 3, origin: "Material do setor" }].map((material) => <article key={material.item}><span className="resource-icon sector">S</span><div><strong>{material.item}</strong><small>{material.origin}</small></div><b>{material.qty} un.</b><button onClick={() => notify(`${material.item}: movimentação aberta.`)}>Gerenciar</button></article>)}</section></>;
  if (section === "Alertas") return <><PageSummary kicker="ENCARREGADO · ALERTAS" title="5 situações merecem atenção" description="O encarregado acompanha a operação interna do setor sem vigiar cada OM." /><section className="alert-list">{["Profissional A possui 7 OMs liberadas hoje", "OM 10482 aguarda material há 15 dias", "Solicitante recusou assinatura da OM 10473", "Emergência registrada pelo Profissional B", "Solução provisória aguardando avaliação"].map((alert, index) => <button key={alert} onClick={() => notify("Alerta aberto com contexto da OM.")}><span className={index < 2 ? "danger" : "warning"}>!</span><strong>{alert}</strong><i>Ver contexto →</i></button>)}</section></>;
  if (section === "Em espera") return <><PageSummary kicker="ENCARREGADO · EM ESPERA" title="9 OMs bloqueadas na Hidráulica" description="Entenda por que a equipe está acumulando serviço." /><div className="waiting-groups"><article><h3>Profissional A · 5 OMs</h3><p><span>2</span> aguardando material</p><p><span>1</span> aguardando ferramenta</p><p><span>1</span> aguardando outra oficina</p><p><span>1</span> aguardando assinatura</p></article><article><h3>Profissional C · 3 OMs</h3><p><span>2</span> aguardando material</p><p><span>1</span> aguardando aprovação</p></article><article><h3>Profissional B · 1 OM</h3><p><span>1</span> aguardando retorno de férias</p></article></div></>;
  return <><PageSummary kicker="ENCARREGADO · OMS" title="Todas as OMs da Hidráulica" description="Filtros por profissional, unidade, estado, prioridade e período." /><section className="generic-table"><div className="table-head"><span>OM / LOCAL</span><span>PROFISSIONAL</span><span>ESTADO</span><span>PRIORIDADE</span></div>{orders.slice(0, 6).map((order, index) => <button key={order.id}><span><b className="mono">OM {order.id}</b><small>{order.unit} · {order.path}</small></span><span>{index % 2 ? "Profissional C" : "Profissional A"}<small>Hidráulica</small></span><span><StateBadge tone={order.queue === "Em espera" ? "warning" : "running"}>{order.state}</StateBadge></span><span>{order.priority}<i>→</i></span></button>)}</section></>;
}

function WarehouseView({ section, requests, selected, setSelected, active, update }: { section: string; requests: WarehouseRequest[]; selected: string; setSelected: (id: string) => void; active: WarehouseRequest; update: (state: WarehouseRequest["state"]) => void }) {
  const visible = requests.filter((item) => section === "Pendentes" ? item.state === "Pendente" || item.state === "Separando" : section === "Prontos" ? item.state === "Pronto" : item.state === section || (section === "Sem estoque" && item.state === "Sem estoque"));
  return <><PageSummary kicker="ALMOXARIFADO" title="Resolva aqui. O fluxo avisa todos." description="Cada ação atualiza a OM sem depender de recados entre setores." metrics={["2 Novas", `${requests.filter((item) => item.state === "Separando").length} Separando`, `${requests.filter((item) => item.state === "Pronto").length} Prontas`]} /><div className="split-layout"><section className="control-list"><ListHeader title={section} />{visible.map((item) => <button key={item.id} className={`control-row ${selected === item.id ? "selected" : ""}`} onClick={() => setSelected(item.id)}><span className="resource-icon">{item.id.startsWith("FER") ? "F" : "M"}</span><span><small className="mono">{item.id} · OM {item.om} · {item.age}</small><strong>{item.item}</strong><i>{item.qty} · {item.professional}</i></span><StateBadge tone={item.state === "Pronto" ? "success" : item.state === "Sem estoque" ? "danger" : "warning"}>{item.state}</StateBadge></button>)}</section><article className="inspection-panel"><span className="section-kicker mono">{active.id} · OM {active.om}</span><h2>{active.item}</h2><p className="inspection-subtitle">{active.qty} · {active.professional} · {active.unit}</p><div className="stock-card"><div><span className="section-kicker">ESTOQUE LOCAL</span><strong>4 unidades compatíveis</strong></div><StateBadge tone="success">Disponível</StateBadge></div><div className="flow-note"><span>i</span><p><strong>Retirada não é espera.</strong> “Pronto para retirada” libera a atividade e notifica o profissional.</p></div><div className="warehouse-actions"><button onClick={() => update("Separando")}>Separando<small>Ainda não liberado</small></button><button className="ready" onClick={() => update("Pronto")}>Pronto para retirada<small>Libera a atividade</small></button><button onClick={() => update("Sem estoque")}>Sem estoque<small>Bloqueia só a atividade</small></button><button onClick={() => update("Pendente")}>Sugerir equivalente<small>Pode exigir aprovação</small></button></div></article></div></>;
}

function PageSummary({ kicker, title, description, action, onAction, metrics }: { kicker: string; title: string; description: string; action?: string; onAction?: () => void; metrics?: string[] }) {
  return <section className="page-summary"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2><p>{description}</p></div>{action && <button onClick={onAction}>{action}</button>}{metrics && <div className="summary-metrics">{metrics.map((item) => { const [number, ...label] = item.split(" "); return <span key={item}><b>{number}</b><small>{label.join(" ")}</small></span>; })}</div>}</section>;
}

function ListHeader({ title }: { title: string }) {
  return <header className="control-list-head"><div><span className="section-kicker">FILA ATUAL</span><h3>{title}</h3></div><button>Mais antigos ↓</button></header>;
}
