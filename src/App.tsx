import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  Clock3, CreditCard, FileText, LayoutDashboard, Menu, Monitor,
  Package, Plus, Printer, Search, Settings, ShoppingBag, TrendingUp,
  Users, Wallet, Wrench, X, Box, Target, CircleDollarSign
} from "lucide-react";

type PageKey = "dashboard" | "pdv" | "ordens" | "producao" | "clientes" | "relatorios" | "configuracoes";

const navigation: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { key: "pdv", label: "PDV / Vendas", icon: ShoppingBag },
  { key: "ordens", label: "Ordens de serviço", icon: ClipboardList },
  { key: "producao", label: "Produção gráfica", icon: Printer },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "relatorios", label: "Relatórios", icon: TrendingUp },
];

const initialOrders = [
  { id: "OS-000128", client: "Mariana Costa", service: "Manutenção de notebook", category: "Manutenção", status: "Em andamento", date: "05 nov, 09:42", value: 280 },
  { id: "OS-000127", client: "Clínica São Lucas", service: "Cartões de visita • 500 un.", category: "Serviços gráficos", status: "Aguardando", date: "05 nov, 09:18", value: 145 },
  { id: "OS-000126", client: "Rafael Mendes", service: "Peça personalizada em 3D", category: "Impressão 3D", status: "Pronto", date: "04 nov, 16:35", value: 90 },
  { id: "OS-000125", client: "Ana Paula Ribeiro", service: "Formatação de computador", category: "Manutenção", status: "Aguardando aprovação", date: "04 nov, 15:10", value: 180 },
];

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function App() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Este mês");
  const [showNewSale, setShowNewSale] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orders, setOrders] = useState(initialOrders);
  const [notice, setNotice] = useState("");

  const filteredOrders = useMemo(() => orders.filter((order) =>
    [order.id, order.client, order.service, order.category, order.status].join(" ").toLowerCase().includes(search.toLowerCase())
  ), [orders, search]);

  const activeNav = navigation.find((item) => item.key === page);
  const changePage = (next: PageKey) => { setPage(next); setMobileOpen(false); setSearch(""); };

  function createDemoOrder() {
    const nextNumber = 129 + orders.length - initialOrders.length;
    setOrders((current) => [{
      id: `OS-000${nextNumber}`, client: "Novo cliente", service: "Nova solicitação de serviço",
      category: "Serviços gráficos", status: "Aguardando", date: "Agora", value: 0
    }, ...current]);
    setShowNewOrder(false);
    setNotice("Prévia: ordem demonstrativa adicionada. O cadastro real será conectado ao Supabase na próxima etapa.");
    window.setTimeout(() => setNotice(""), 5500);
  }

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Wrench size={23} strokeWidth={2.5} /><span className="brand-dot" /></div>
          <div className="brand-copy"><strong>DOUTOR <em>RESOLVE</em></strong><span>TECH · GESTÃO INTELIGENTE</span></div>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={19}/></button>
        </div>
        <div className="workspace-label">MENU PRINCIPAL</div>
        <nav className="main-nav">
          {navigation.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${page === key ? "active" : ""}`} onClick={() => changePage(key)}>
              <Icon size={19} /><span>{label}</span>{key === "ordens" && <b className="nav-count">4</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${page === "configuracoes" ? "active" : ""}`} onClick={() => changePage("configuracoes")}><Settings size={19}/><span>Configurações</span></button>
          <div className="help-card"><div className="help-icon"><Activity size={17}/></div><strong>Precisa de ajuda?</strong><p>Organize sua operação em um só lugar.</p><button onClick={() => setNotice("Central de ajuda estará disponível em uma próxima atualização.")}>Saiba mais <ChevronRight size={14}/></button></div>
          <div className="profile">
            <div className="avatar">DR</div><div className="profile-info"><strong>Administrador</strong><span>Conta de demonstração</span></div><button className="icon-button" aria-label="Opções do perfil"><ChevronDown size={17}/></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={21}/></button><div className="breadcrumb">Painel <ChevronRight size={14}/><strong>{activeNav?.label ?? "Configurações"}</strong></div></div>
          <div className="topbar-actions"><div className="system-status"><span/> Sistema de demonstração</div><button className="icon-button notification-button" aria-label="Notificações"><Bell size={19}/><i/></button><div className="top-avatar">DR</div></div>
        </header>

        <div className="content">
          {notice && <div className="notice"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice("")}><X size={16}/></button></div>}
          {page === "dashboard" && <Dashboard period={period} setPeriod={setPeriod} setPage={changePage} setShowNewSale={setShowNewSale} setShowNewOrder={setShowNewOrder} orders={orders}/>}
          {page === "pdv" && <GenericPage title="PDV / Vendas" subtitle="Registre vendas de produtos e serviços em poucos passos." icon={<ShoppingBag/>} action="Nova venda" onAction={() => setShowNewSale(true)}><div className="empty-hint"><CreditCard size={28}/><strong>Frente de caixa</strong><p>O cadastro de produtos, serviços e pagamentos será implementado na próxima etapa.</p><button className="primary-button" onClick={() => setShowNewSale(true)}><Plus size={16}/> Iniciar venda</button></div></GenericPage>}
          {page === "ordens" && <OrdersPage orders={filteredOrders} search={search} setSearch={setSearch} onNew={() => setShowNewOrder(true)} />}
          {page === "producao" && <ProductionPage orders={orders.filter((o) => o.category === "Serviços gráficos")} />}
          {page === "clientes" && <GenericPage title="Clientes" subtitle="Consulte e organize o relacionamento com seus clientes." icon={<Users/>} action="Novo cliente" onAction={() => setNotice("Cadastro de clientes será implementado na próxima etapa.")}><div className="empty-hint"><Users size={28}/><strong>Seus clientes em um só lugar</strong><p>O cadastro e o histórico de atendimentos serão conectados ao banco de dados na próxima etapa.</p></div></GenericPage>}
          {page === "relatorios" && <GenericPage title="Relatórios" subtitle="Acompanhe o desempenho e os resultados da sua empresa." icon={<TrendingUp/>} action="Exportar relatório" onAction={() => setNotice("A exportação será habilitada quando os dados reais estiverem conectados.")}><div className="report-grid"><div className="report-card"><span>Faturamento no mês</span><strong>R$ 8.450,00</strong><small>Valor ilustrativo</small></div><div className="report-card"><span>Ordens concluídas</span><strong>38</strong><small>Quantidade ilustrativa</small></div><div className="report-card"><span>Ticket médio</span><strong>R$ 125,40</strong><small>Valor ilustrativo</small></div></div></GenericPage>}
          {page === "configuracoes" && <GenericPage title="Configurações" subtitle="Personalize os dados e as preferências do Doutor Resolve Tech." icon={<Settings/>}><div className="settings-list"><div><strong>Dados da empresa</strong><span>Nome, slogan e informações comerciais</span><ChevronRight/></div><div><strong>Metas de faturamento</strong><span>Defina objetivos diários, semanais e mensais</span><ChevronRight/></div><div><strong>Usuários e acessos</strong><span>Dois usuários com permissões iguais</span><ChevronRight/></div><div><strong>Formas de pagamento</strong><span>Configure dinheiro, PIX, cartão e outros</span><ChevronRight/></div></div></GenericPage>}
        </div>
      </main>

      {showNewSale && <Modal title="Iniciar nova venda" onClose={() => setShowNewSale(false)}><p className="modal-copy">O PDV completo será conectado na próxima etapa. Esta é uma prévia da ação.</p><div className="form-field"><label>Tipo de operação</label><select><option>Produto</option><option>Serviço gráfico — abrir OS</option><option>Manutenção — abrir OS</option><option>Impressão 3D — abrir OS</option></select></div><div className="modal-actions"><button className="secondary-button" onClick={() => setShowNewSale(false)}>Voltar</button><button className="primary-button" onClick={() => {setShowNewSale(false);setNotice("PDV demonstrativo: fluxo de venda será implementado na próxima etapa.");}}>Continuar <ChevronRight size={16}/></button></div></Modal>}
      {showNewOrder && <Modal title="Nova ordem de serviço" onClose={() => setShowNewOrder(false)}><p className="modal-copy">Selecione a categoria para abrir o formulário correspondente.</p><div className="category-options"><button onClick={createDemoOrder}><Monitor/><span><strong>Manutenção</strong><small>Notebook e computador</small></span><ChevronRight/></button><button onClick={createDemoOrder}><Printer/><span><strong>Serviços gráficos</strong><small>Impressões e materiais gráficos</small></span><ChevronRight/></button><button onClick={createDemoOrder}><Box/><span><strong>Impressão 3D</strong><small>Peças e projetos personalizados</small></span><ChevronRight/></button></div></Modal>}
    </div>
  );
}

function Dashboard({ period, setPeriod, setPage, setShowNewSale, setShowNewOrder, orders }: {
  period: string; setPeriod: (value: string) => void; setPage: (value: PageKey) => void;
  setShowNewSale: (value: boolean) => void; setShowNewOrder: (value: boolean) => void;
  orders: typeof initialOrders;
}) {
  const [goalTab, setGoalTab] = useState("Diária");
  const goals = { Diária: { target: 650, current: 420 }, Semanal: { target: 3500, current: 2180 }, Mensal: { target: 14000, current: 8450 } };
  const goal = goals[goalTab as keyof typeof goals];
  const progress = Math.min(100, Math.round(goal.current / goal.target * 100));
  return <>
    <div className="page-heading"><div><div className="eyebrow">QUARTA-FEIRA, 05 DE NOVEMBRO DE 2026</div><h1>Bom dia! <span>Vamos resolver?</span></h1><p>Acompanhe o movimento e mantenha sua operação em dia.</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => setShowNewOrder(true)}><Plus size={16}/> Nova OS</button><button className="primary-button" onClick={() => setShowNewSale(true)}><Plus size={16}/> Nova venda</button></div></div>
    <div className="section-toolbar"><div><h2>Visão geral</h2><span>Resumo do desempenho da sua loja</span></div><label className="select-wrap"><CalendarDays size={16}/><select value={period} onChange={(e) => setPeriod(e.target.value)}><option>Este mês</option><option>Esta semana</option><option>Hoje</option></select><ChevronDown size={14}/></label></div>
    <div className="metrics-grid">
      <Metric icon={<Wallet/>} label="Faturamento do mês" value="R$ 8.450,00" change="+12,8%" positive detail="em relação ao mês anterior"/>
      <Metric icon={<ShoppingBag/>} label="Vendas realizadas" value="67" change="+8,2%" positive detail="vendas neste período"/>
      <Metric icon={<ClipboardList/>} label="OS em aberto" value="12" change="4 novas" detail="aguardando ou em andamento"/>
      <Metric icon={<Printer/>} label="Produção gráfica" value="08" change="3 prontas" detail="pedidos na fila de produção"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel revenue-panel"><div className="panel-heading"><div><h3>Faturamento</h3><p>Desempenho ao longo do período</p></div><button className="more-button" onClick={() => setPage("relatorios")}>Ver relatório <ChevronRight size={15}/></button></div><div className="revenue-total"><strong>R$ 8.450,00</strong><span><ArrowUpRight size={15}/> 12,8%</span></div><RevenueChart/><div className="chart-axis"><span>01 NOV</span><span>05 NOV</span><span>10 NOV</span><span>15 NOV</span><span>20 NOV</span><span>25 NOV</span><span>30 NOV</span></div></section>
      <section className="panel goals-panel"><div className="panel-heading"><div><h3>Metas de faturamento</h3><p>Seus objetivos e resultados</p></div><Target size={19} className="muted-icon"/></div><div className="goal-tabs">{(["Diária","Semanal","Mensal"] as const).map((tab) => <button className={goalTab === tab ? "selected" : ""} onClick={() => setGoalTab(tab)} key={tab}>{tab}</button>)}</div><div className="goal-amount"><strong>{money(goal.current)}</strong><span>de {money(goal.target)}</span></div><div className="progress-track"><div style={{width: `${progress}%`}}/></div><div className="goal-footer"><span>{progress}% atingido</span><strong>Faltam {money(Math.max(0, goal.target - goal.current))}</strong></div><div className="goal-tip"><Target size={16}/><span>{progress >= 100 ? "Meta alcançada! Excelente trabalho." : "Continue assim! Você está no caminho da sua meta."}</span></div></section>
    </div>
    <div className="bottom-grid">
      <section className="panel orders-panel"><div className="panel-heading"><div><h3>Ordens recentes</h3><p>Acompanhe os últimos atendimentos</p></div><button className="more-button" onClick={() => setPage("ordens")}>Ver todas <ChevronRight size={15}/></button></div><div className="table-wrap"><table><thead><tr><th>ORDEM</th><th>CLIENTE / SERVIÇO</th><th>SITUAÇÃO</th><th>VALOR</th></tr></thead><tbody>{orders.slice(0,4).map((order) => <tr key={order.id}><td className="order-id">{order.id}</td><td><strong>{order.client}</strong><small>{order.service}</small></td><td><Status status={order.status}/></td><td className="table-value">{money(order.value)}</td></tr>)}</tbody></table></div></section>
      <section className="panel shortcuts-panel"><div className="panel-heading"><div><h3>Acesso rápido</h3><p>O que você precisa fazer?</p></div></div><div className="shortcut-list"><button onClick={() => setShowNewSale(true)}><span className="shortcut-icon yellow"><ShoppingBag/></span><span><strong>Registrar venda</strong><small>Abrir o PDV</small></span><ChevronRight/></button><button onClick={() => setShowNewOrder(true)}><span className="shortcut-icon gray"><FileText/></span><span><strong>Abrir ordem de serviço</strong><small>Registrar atendimento</small></span><ChevronRight/></button><button onClick={() => setPage("producao")}><span className="shortcut-icon gray"><Printer/></span><span><strong>Ver produção gráfica</strong><small>Acompanhar pedidos</small></span><ChevronRight/></button></div></section>
    </div>
    <div className="demo-disclaimer"><Activity size={15}/><span>Ambiente de demonstração — os valores e registros exibidos são ilustrativos e ainda não estão conectados ao Supabase.</span></div>
  </>;
}

function Metric({ icon, label, value, change, positive, detail }: { icon: React.ReactNode; label: string; value: string; change: string; positive?: boolean; detail: string }) {
  return <div className="metric-card"><div className="metric-top"><span className="metric-icon">{icon}</span><span className={positive ? "metric-change positive" : "metric-change"}>{positive && <ArrowUpRight size={13}/>} {change}</span></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><small className="metric-detail">{detail}</small></div>;
}

function RevenueChart() {
  return <div className="chart-area"><div className="chart-y"><span>R$ 3 mil</span><span>R$ 2 mil</span><span>R$ 1 mil</span><span>R$ 0</span></div><svg viewBox="0 0 650 190" preserveAspectRatio="none" role="img" aria-label="Gráfico ilustrativo de faturamento"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f5c542" stopOpacity=".28"/><stop offset="100%" stopColor="#f5c542" stopOpacity="0"/></linearGradient></defs>{[12,66,120,174].map((y) => <line key={y} x1="0" x2="650" y1={y} y2={y} stroke="#e9e9e9" strokeDasharray="4 5"/>)}<path d="M0 150 C35 142 40 120 75 128 S120 100 150 115 S190 72 225 93 S270 120 300 86 S350 95 375 70 S420 88 450 55 S495 73 525 43 S570 65 600 35 S630 43 650 20 L650 174 L0 174 Z" fill="url(#areaFill)"/><path d="M0 150 C35 142 40 120 75 128 S120 100 150 115 S190 72 225 93 S270 120 300 86 S350 95 375 70 S420 88 450 55 S495 73 525 43 S570 65 600 35 S630 43 650 20" fill="none" stroke="#d6a916" strokeWidth="3" strokeLinecap="round"/></svg></div>;
}

function OrdersPage({ orders, search, setSearch, onNew }: { orders: typeof initialOrders; search: string; setSearch: (value: string) => void; onNew: () => void }) {
  const [filter, setFilter] = useState("Todas");
  const visible = orders.filter((o) => filter === "Todas" || o.status === filter);
  return <><div className="page-heading"><div><div className="eyebrow">ATENDIMENTO</div><h1>Ordens de <span>serviço</span></h1><p>Gerencie manutenções, serviços gráficos e impressão 3D.</p></div><button className="primary-button" onClick={onNew}><Plus size={16}/> Nova OS</button></div><div className="panel orders-full"><div className="list-toolbar"><div className="filter-tabs">{["Todas","Aguardando","Em andamento","Pronto","Aguardando aprovação"].map((f) => <button key={f} className={filter === f ? "selected" : ""} onClick={() => setFilter(f)}>{f}</button>)}</div><label className="search-box"><Search size={16}/><input placeholder="Buscar OS ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)}/></label></div><div className="table-wrap"><table><thead><tr><th>NÚMERO</th><th>CLIENTE</th><th>SERVIÇO</th><th>CATEGORIA</th><th>SITUAÇÃO</th><th>VALOR</th><th>DATA</th></tr></thead><tbody>{visible.map((o) => <tr key={o.id}><td className="order-id">{o.id}</td><td><strong>{o.client}</strong></td><td>{o.service}</td><td>{o.category}</td><td><Status status={o.status}/></td><td className="table-value">{money(o.value)}</td><td>{o.date}</td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-state">Nenhuma ordem encontrada.</div>}</div></div></>;
}

function ProductionPage({ orders }: { orders: typeof initialOrders }) {
  const columns = [{name:"Aguardando", color:"amber"},{name:"Em andamento",color:"blue"},{name:"Pronto",color:"green"}];
  return <><div className="page-heading"><div><div className="eyebrow">OPERAÇÃO</div><h1>Produção <span>gráfica</span></h1><p>Visualize e acompanhe a fila de produção da gráfica.</p></div><div className="heading-actions"><span className="production-date"><CalendarDays size={16}/> Hoje, 05 nov</span></div></div><div className="production-summary"><div><span>Pedidos na fila</span><strong>{orders.length.toString().padStart(2,"0")}</strong></div><div><span>Aguardando</span><strong>{orders.filter(o=>o.status==="Aguardando").length.toString().padStart(2,"0")}</strong></div><div><span>Em produção</span><strong>{orders.filter(o=>o.status==="Em andamento").length.toString().padStart(2,"0")}</strong></div><div><span>Prontos</span><strong>{orders.filter(o=>o.status==="Pronto").length.toString().padStart(2,"0")}</strong></div></div><div className="kanban">{columns.map((col) => <section className="kanban-column" key={col.name}><div className="kanban-heading"><span className={`kanban-dot ${col.color}`}/><strong>{col.name}</strong><b>{orders.filter(o=>o.status===col.name).length}</b></div>{orders.filter(o=>o.status===col.name).map((o)=><article className="production-card" key={o.id}><span className="order-id">{o.id}</span><h3>{o.service}</h3><p>{o.client}</p><div><Clock3 size={14}/> {o.date}</div><strong>{money(o.value)}</strong></article>)}{orders.filter(o=>o.status===col.name).length===0&&<div className="column-empty">Nenhum pedido nesta etapa.</div>}</section>)}</div></>;
}

function GenericPage({ title, subtitle, icon, action, onAction, children }: { title: string; subtitle: string; icon: React.ReactNode; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return <><div className="page-heading"><div><div className="eyebrow">DOUTOR RESOLVE TECH</div><h1>{title}</h1><p>{subtitle}</p></div>{action&&<button className="primary-button" onClick={onAction}><Plus size={16}/>{action}</button>}</div><section className="panel generic-panel"><div className="generic-icon">{icon}</div>{children}</section></>;
}

function Status({ status }: { status: string }) {
  const style = status === "Pronto" ? "green" : status === "Em andamento" ? "blue" : status === "Aguardando aprovação" ? "purple" : "amber";
  return <span className={`status-pill ${style}`}><i/>{status}</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal"><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19}/></button></div>{children}</div></div>;
}

export default App;