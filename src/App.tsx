import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  Clock3, CreditCard, FileText, LayoutDashboard, Menu, Monitor,
  Package, Plus, Printer, Search, Settings, ShoppingBag, TrendingUp,
  Users, Wallet, Wrench, X, Box, Target, CircleDollarSign, LogOut
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
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return <AuthShell><div className="auth-card"><div className="auth-mark"><Wrench size={25}/></div><h1>Doutor <span>Resolve</span></h1><p>Configuração do banco pendente.</p><div className="auth-alert">A conexão segura ainda não foi configurada no Netlify. As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam ser adicionadas antes do login.</div></div></AuthShell>;
  }
  if (checkingSession) {
    return <AuthShell><div className="auth-card"><div className="auth-mark"><Wrench size={25}/></div><p>Verificando acesso seguro...</p></div></AuthShell>;
  }
  if (!session) return <LoginScreen />;
  return <DashboardApp email={session.user.email ?? "Usuário"} />;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="auth-shell"><div className="auth-brand"><div className="auth-mark"><Wrench size={25}/></div><div><strong>DOUTOR <em>RESOLVE</em></strong><small>TECH · GESTÃO INTELIGENTE</small></div></div>{children}<p className="auth-foot">A resolução do seu problema.</p></div>;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) setError("Não foi possível entrar. Confira o e-mail e a senha ou verifique se o usuário já foi criado no Supabase.");
    setBusy(false);
  }

  return <AuthShell><form className="auth-card" onSubmit={handleSubmit}>
    <div className="auth-mark"><Wrench size={25}/></div>
    <h1>Bem-vindo de <span>volta!</span></h1>
    <p>Entre com seu e-mail e senha para acessar o sistema.</p>
    <label className="auth-field">E-mail<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"/></label>
    <label className="auth-field">Senha<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha"/></label>
    {error && <div className="auth-error" role="alert">{error}</div>}
    <button className="auth-submit" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</button>
    <small className="auth-note">Acesso restrito a usuários cadastrados.</small>
  </form></AuthShell>;
}

function DashboardApp({ email }: { email: string }) {
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
            <div className="avatar">DR</div><div className="profile-info"><strong>{email}</strong><span>Usuário autenticado</span></div><button className="icon-button" aria-label="Sair" title="Sair" onClick={() => void supabase?.auth.signOut()}><LogOut size={17}/></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={21}/></button><div className="breadcrumb">Painel <ChevronRight size={14}/><strong>{activeNav?.label ?? "Configurações"}</strong></div></div>
          <div className="topbar-actions"><div className="system-status"><span/> Sistema conectado</div><button className="icon-button notification-button" aria-label="Notificações"><Bell size={19}/><i/></button><div className="top-avatar">DR</div></div>
        </header>

        <div className="content">
          {notice && <div className="notice"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice("")}><X size={16}/></button></div>}
          {page === "dashboard" && <Dashboard period={period} setPeriod={setPeriod} setPage={changePage} setShowNewSale={setShowNewSale} setShowNewOrder={setShowNewOrder} orders={orders}/>}
          {page === "pdv" && <CashRegisterPage />}
          {page === "ordens" && <OrdersPage orders={filteredOrders} search={search} setSearch={setSearch} onNew={() => setShowNewOrder(true)} />}
          {page === "producao" && <ProductionPage orders={orders.filter((o) => o.category === "Serviços gráficos")} />}
          {page === "clientes" && <CustomersPage />}
          {page === "relatorios" && <GenericPage title="Relatórios" subtitle="Acompanhe o desempenho e os resultados da sua empresa." icon={<TrendingUp/>} action="Exportar relatório" onAction={() => setNotice("A exportação será habilitada quando os dados reais estiverem conectados.")}><div className="report-grid"><div className="report-card"><span>Faturamento no mês</span><strong>R$ 8.450,00</strong><small>Valor ilustrativo</small></div><div className="report-card"><span>Ordens concluídas</span><strong>38</strong><small>Quantidade ilustrativa</small></div><div className="report-card"><span>Ticket médio</span><strong>R$ 125,40</strong><small>Valor ilustrativo</small></div></div></GenericPage>}
          {page === "configuracoes" && <GenericPage title="Configurações" subtitle="Personalize os dados e as preferências do Doutor Resolve Tech." icon={<Settings/>}><div className="settings-list"><div><strong>Dados da empresa</strong><span>Nome, slogan e informações comerciais</span><ChevronRight/></div><div><strong>Metas de faturamento</strong><span>Defina objetivos diários, semanais e mensais</span><ChevronRight/></div><div><strong>Usuários e acessos</strong><span>Dois usuários com permissões iguais</span><ChevronRight/></div><div><strong>Formas de pagamento</strong><span>Configure dinheiro, PIX, cartão e outros</span><ChevronRight/></div></div></GenericPage>}
        </div>
      </main>

      {showNewSale && <NewSaleModal onClose={() => setShowNewSale(false)} onSaved={() => { setShowNewSale(false); setNotice("Venda registrada no caixa aberto."); }} />}
      {showNewOrder && <NewServiceOrderModal onClose={() => setShowNewOrder(false)} onSaved={(number) => { setShowNewOrder(false); setNotice(`OS #${number} criada com sucesso.`); }} />}
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




function NewSaleModal({onClose,onSaved}:{onClose:()=>void;onSaved:()=>void}) {
 const [description,setDescription]=useState(""); const [qty,setQty]=useState("1"); const [price,setPrice]=useState(""); const [discount,setDiscount]=useState("0"); const [method,setMethod]=useState("cash"); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 const total=Math.max(0,Number(qty||0)*Number(price||0)-Number(discount||0));
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!supabase)return;if(!description.trim()||Number(qty)<=0||Number(price)<=0||total<=0){setError("Confira os dados e os valores.");return;}setBusy(true);setError("");
 const {data:reg}=await supabase.from("cash_registers").select("id").eq("status","open").maybeSingle();if(!reg){setError("Abra o caixa antes de registrar uma venda.");setBusy(false);return;}
 const {data:user}=await supabase.auth.getUser();
 const {data:sale,error:se}=await supabase.from("sales").insert({cash_register_id:reg.id,status:"paid",subtotal:Number(qty)*Number(price),discount:Number(discount||0),total,created_by:user.user?.id??null}).select("id").single();
 if(se||!sale){setError("Não foi possível registrar a venda.");setBusy(false);return;}
 const {error:ie}=await supabase.from("sale_items").insert({sale_id:sale.id,description:description.trim(),quantity:Number(qty),unit_price:Number(price),discount:Number(discount||0)});
 if(ie){await supabase.from("sales").update({status:"cancelled",cancellation_reason:"Falha ao gravar item."}).eq("id",sale.id);setError("Falha ao salvar o item.");setBusy(false);return;}
 const {error:pe}=await supabase.from("sale_payments").insert({sale_id:sale.id,method,amount:total,status:"confirmed",paid_at:new Date().toISOString()});
 if(pe){await supabase.from("sales").update({status:"cancelled",cancellation_reason:"Falha ao gravar pagamento."}).eq("id",sale.id);setError("Falha ao salvar o pagamento.");setBusy(false);return;}setBusy(false);onSaved();}
 return <Modal title="Registrar venda" onClose={onClose}><form onSubmit={save}><p className="modal-copy">A venda será vinculada ao caixa aberto.</p>
 <label className="auth-field">Produto ou serviço<input required value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <div className="customer-form-grid"><label className="auth-field">Quantidade<input type="number" min="0.01" step="0.01" value={qty} onChange={e=>setQty(e.target.value)}/></label><label className="auth-field">Valor unitário (R$)<input type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></label><label className="auth-field">Desconto (R$)<input type="number" min="0" step="0.01" value={discount} onChange={e=>setDiscount(e.target.value)}/></label><label className="auth-field">Pagamento<select value={method} onChange={e=>setMethod(e.target.value)}><option value="cash">Dinheiro</option><option value="pix">PIX</option><option value="debit_card">Débito</option><option value="credit_card">Crédito</option><option value="bank_transfer">Transferência</option><option value="other">Outro</option></select></label></div>
 <div className="report-card"><span>Total</span><strong>{money(total)}</strong></div>{error&&<div className="auth-error">{error}</div>}
 <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy?"Salvando...":"Confirmar venda"}</button></div></form></Modal>;
}
type CashRegister = {
  id: string; register_number: number; status: "open" | "closed";
  opening_amount: number; closing_counted: number | null; closing_expected: number | null;
  closing_difference: number | null; opening_notes: string | null; closing_notes: string | null;
  opened_at: string; closed_at: string | null;
};
type CashMovement = { id: string; movement_type: "cash_in" | "cash_out"; amount: number; description: string; payment_method: string; created_at: string };

function CashRegisterPage() {
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [history, setHistory] = useState<CashRegister[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [salesPayments, setSalesPayments] = useState<{amount:number;method:string}[]>([]);
  const [openingAmount, setOpeningAmount] = useState("0");
  const [openingNotes, setOpeningNotes] = useState("");
  const [movementType, setMovementType] = useState<"cash_in"|"cash_out">("cash_in");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");
  const [counted, setCounted] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!supabase) return;
    setLoading(true); setError("");
    const {data: openData, error: openError} = await supabase.from("cash_registers").select("*").eq("status","open").maybeSingle();
    if (openError) { setError("Não foi possível consultar o caixa."); setLoading(false); return; }
    const current = (openData as CashRegister | null);
    setRegister(current);
    const {data: oldData} = await supabase.from("cash_registers").select("*").eq("status","closed").order("closed_at",{ascending:false}).limit(10);
    setHistory((oldData ?? []) as CashRegister[]);
    if (current) {
      const [{data: movementData,error: movementError},{data: saleData,error: saleError}] = await Promise.all([
        supabase.from("cash_movements").select("id,movement_type,amount,description,payment_method,created_at").eq("cash_register_id",current.id).order("created_at",{ascending:false}),
        supabase.from("sales").select("id,sale_payments(amount,method,status)").eq("cash_register_id",current.id).eq("status","paid")
      ]);
      if (movementError || saleError) setError("O caixa foi localizado, mas houve erro ao carregar suas movimentações.");
      setMovements((movementData ?? []) as CashMovement[]);
      const payments = (saleData ?? []).flatMap((sale:any) => (sale.sale_payments ?? []).filter((p:any)=>p.status==="confirmed").map((p:any)=>({amount:Number(p.amount),method:p.method})));
      setSalesPayments(payments);
    } else { setMovements([]); setSalesPayments([]); }
    setLoading(false);
  }
  useEffect(()=>{ void load(); },[]);

  const paymentsByMethod = (method:string) => salesPayments.filter(p=>p.method===method).reduce((sum,p)=>sum+p.amount,0);
  const cashIn = movements.filter(m=>m.movement_type==="cash_in" && m.payment_method==="cash").reduce((sum,m)=>sum+Number(m.amount),0);
  const cashOut = movements.filter(m=>m.movement_type==="cash_out" && m.payment_method==="cash").reduce((sum,m)=>sum+Number(m.amount),0);
  const expectedCash = Number(register?.opening_amount ?? 0) + paymentsByMethod("cash") + cashIn - cashOut;
  const totalSales = salesPayments.reduce((sum,p)=>sum+p.amount,0);

  async function openRegister(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const {data:userData} = await supabase.auth.getUser();
    const {error:saveError} = await supabase.from("cash_registers").insert({
      opening_amount:Number(openingAmount), opening_notes:openingNotes.trim()||null, opened_by:userData.user?.id??null
    });
    if(saveError) setError(saveError.code==="23505" ? "Já existe um caixa aberto. Feche-o antes de abrir outro." : "Não foi possível abrir o caixa. Confira os dados e tente novamente.");
    else { setOpeningAmount("0"); setOpeningNotes(""); setMessage("Caixa aberto com sucesso."); await load(); }
    setBusy(false);
  }
  async function addMovement(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(!supabase || !register) return;
    const amount=Number(movementAmount.replace(",","."));
    if(!Number.isFinite(amount)||amount<=0||!movementDescription.trim()){setError("Informe um valor válido e a descrição da movimentação.");return;}
    setBusy(true);setError("");setMessage("");
    const {data:userData}=await supabase.auth.getUser();
    const {error:saveError}=await supabase.from("cash_movements").insert({
      cash_register_id:register.id,movement_type:movementType,amount,description:movementDescription.trim(),payment_method:"cash",created_by:userData.user?.id??null
    });
    if(saveError)setError("Não foi possível registrar a movimentação.");
    else {setMovementAmount("");setMovementDescription("");setMessage("Movimentação registrada.");await load();}
    setBusy(false);
  }
  async function closeRegister(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(!supabase||!register)return;
    const countedValue=Number(counted.replace(",","."));
    if(!Number.isFinite(countedValue)||countedValue<0){setError("Informe o dinheiro contado no caixa.");return;}
    const difference=countedValue-expectedCash;
    if(Math.abs(difference)>0.009&&!closingNotes.trim()){setError("Explique a diferença entre o valor esperado e o valor contado.");return;}
    if(!window.confirm("Confirma o fechamento deste caixa? Depois de fechado, ele não poderá receber novas movimentações."))return;
    setBusy(true);setError("");setMessage("");
    const {data:userData}=await supabase.auth.getUser();
    const {error:saveError}=await supabase.from("cash_registers").update({
      status:"closed",closing_counted:countedValue,closing_expected:expectedCash,closing_difference:difference,
      closing_notes:closingNotes.trim()||null,closed_by:userData.user?.id??null,closed_at:new Date().toISOString()
    }).eq("id",register.id).eq("status","open");
    if(saveError)setError("Não foi possível fechar o caixa.");
    else {setCounted("");setClosingNotes("");setMessage("Caixa fechado e registrado com sucesso.");await load();}
    setBusy(false);
  }

  return <>
    <div className="page-heading"><div><div className="eyebrow">PDV · CONTROLE FINANCEIRO</div><h1>Frente de <span>caixa</span></h1><p>Abertura, movimentações e fechamento do caixa.</p></div><button className="secondary-button" onClick={()=>void load()}><Activity size={16}/> Atualizar</button></div>
    {message&&<div className="notice"><CheckCircle2 size={17}/>{message}</div>}
    {error&&<div className="auth-error" role="alert">{error}</div>}
    {loading?<div className="panel empty-state">Carregando informações do caixa...</div>:!register?
      <section className="panel" style={{maxWidth:650,padding:24}}>
        <div className="panel-heading"><div><h3><Wallet size={18}/> Caixa fechado</h3><p>Informe o fundo de troco para iniciar o expediente.</p></div><span className="status-pill waiting">Fechado</span></div>
        <form onSubmit={openRegister} className="customer-form-grid">
          <label className="auth-field">Valor inicial em dinheiro (R$)<input required type="number" min="0" step="0.01" value={openingAmount} onChange={e=>setOpeningAmount(e.target.value)}/></label>
          <label className="auth-field wide">Observações da abertura<textarea rows={2} value={openingNotes} onChange={e=>setOpeningNotes(e.target.value)} placeholder="Ex.: fundo de troco recebido"/></label>
          <div className="modal-actions wide"><button className="primary-button" disabled={busy}>{busy?"Abrindo...":"Abrir caixa"}</button></div>
        </form>
      </section>
    :
      <>
        <section className="panel" style={{padding:22,marginBottom:18}}>
          <div className="panel-heading"><div><h3>Caixa #{register.register_number} <span className="status-pill success">Aberto</span></h3><p>Aberto em {new Date(register.opened_at).toLocaleString("pt-BR")}</p></div><strong style={{fontSize:22}}>{money(expectedCash)}</strong></div>
          <div className="metrics-grid">
            <Metric icon={<Wallet/>} label="Fundo inicial" value={money(Number(register.opening_amount))} change="Abertura" detail="Dinheiro inicial"/>
            <Metric icon={<CircleDollarSign/>} label="Vendas recebidas" value={money(totalSales)} change="Registradas" detail="Pagamentos vinculados a vendas"/>
            <Metric icon={<ArrowUpRight/>} label="Entradas em dinheiro" value={money(cashIn)} change="Reforços" detail="Movimentações de entrada"/>
            <Metric icon={<ArrowDownRight/>} label="Saídas em dinheiro" value={money(cashOut)} change="Sangrias" detail="Movimentações de saída"/>
          </div>
          <div className="report-grid" style={{marginTop:18}}>
            {(["cash","pix","debit_card","credit_card","bank_transfer","other"] as const).map(method=><div className="report-card" key={method}><span>{{cash:"Dinheiro",pix:"PIX",debit_card:"Débito",credit_card:"Crédito",bank_transfer:"Transferência",other:"Outros"}[method]}</span><strong>{money(paymentsByMethod(method))}</strong><small>Vendas pagas</small></div>)}
          </div>
        </section>
        <div className="dashboard-grid">
          <section className="panel" style={{padding:22}}>
            <div className="panel-heading"><div><h3>Registrar movimentação</h3><p>Reforço de caixa ou sangria.</p></div></div>
            <form onSubmit={addMovement} className="customer-form-grid">
              <label className="auth-field">Tipo<select value={movementType} onChange={e=>setMovementType(e.target.value as "cash_in"|"cash_out")}><option value="cash_in">Entrada / Reforço</option><option value="cash_out">Saída / Sangria</option></select></label>
              <label className="auth-field">Valor (R$)<input required type="number" min="0.01" step="0.01" value={movementAmount} onChange={e=>setMovementAmount(e.target.value)}/></label>
              <label className="auth-field wide">Justificativa / descrição<input required maxLength={300} value={movementDescription} onChange={e=>setMovementDescription(e.target.value)} placeholder="Descreva o motivo"/></label>
              <div className="modal-actions wide"><button className="primary-button" disabled={busy}>Registrar movimentação</button></div>
            </form>
          </section>
          <section className="panel" style={{padding:22}}>
            <div className="panel-heading"><div><h3>Fechamento de caixa</h3><p>Confira o dinheiro físico antes de encerrar.</p></div></div>
            <div className="report-card" style={{marginBottom:14}}><span>Dinheiro esperado em caixa</span><strong>{money(expectedCash)}</strong><small>Fundo + vendas em dinheiro + entradas − saídas</small></div>
            <form onSubmit={closeRegister} className="customer-form-grid">
              <label className="auth-field wide">Dinheiro contado (R$)<input required type="number" min="0" step="0.01" value={counted} onChange={e=>setCounted(e.target.value)}/></label>
              <label className="auth-field wide">Observação / justificativa da diferença<textarea rows={2} value={closingNotes} onChange={e=>setClosingNotes(e.target.value)} placeholder="Obrigatória se houver sobra ou falta"/></label>
              {counted!==""&&<div className="wide"><strong>Diferença: {money(Number(counted)-expectedCash)}</strong></div>}
              <div className="modal-actions wide"><button className="primary-button" disabled={busy}>Fechar caixa</button></div>
            </form>
          </section>
        </div>
        <section className="panel" style={{padding:22,marginTop:18}}>
          <div className="panel-heading"><div><h3>Movimentações do expediente</h3><p>Histórico de entradas e saídas do caixa aberto.</p></div></div>
          {movements.length===0?<div className="empty-state">Nenhuma movimentação manual registrada.</div>:<div className="table-wrap"><table><thead><tr><th>DATA</th><th>TIPO</th><th>DESCRIÇÃO</th><th>VALOR</th></tr></thead><tbody>{movements.map(m=><tr key={m.id}><td>{new Date(m.created_at).toLocaleString("pt-BR")}</td><td>{m.movement_type==="cash_in"?"Entrada":"Saída"}</td><td>{m.description}</td><td className="table-value">{m.movement_type==="cash_in"?"+":"−"} {money(Number(m.amount))}</td></tr>)}</tbody></table></div>}
        </section>
      </>
    }
    <section className="panel" style={{padding:22,marginTop:18}}>
      <div className="panel-heading"><div><h3>Últimos fechamentos</h3><p>Histórico dos caixas encerrados.</p></div></div>
      {history.length===0?<div className="empty-state">Nenhum fechamento registrado ainda.</div>:<div className="table-wrap"><table><thead><tr><th>CAIXA</th><th>ABERTURA</th><th>FECHAMENTO</th><th>ESPERADO</th><th>CONTADO</th><th>DIFERENÇA</th></tr></thead><tbody>{history.map(h=><tr key={h.id}><td>#{h.register_number}</td><td>{new Date(h.opened_at).toLocaleString("pt-BR")}</td><td>{h.closed_at?new Date(h.closed_at).toLocaleString("pt-BR"):"—"}</td><td>{money(Number(h.closing_expected??0))}</td><td>{money(Number(h.closing_counted??0))}</td><td className="table-value">{money(Number(h.closing_difference??0))}</td></tr>)}</tbody></table></div>}
    </section>
  </>;
}

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  async function loadCustomers() {
    if (!supabase) return;
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("customers")
      .select("id,name,phone,email,cpf,address,notes,is_active,created_at")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(500);
    if (loadError) setError("Não foi possível carregar os clientes. Confira a conexão e as permissões do banco.");
    else setCustomers((data ?? []) as Customer[]);
    setLoading(false);
  }

  useEffect(() => { void loadCustomers(); }, []);

  function openNew() {
    setEditing(null);
    setName(""); setPhone(""); setEmail(""); setCpf(""); setAddress(""); setNotes("");
    setShowForm(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setName(customer.name); setPhone(customer.phone ?? ""); setEmail(customer.email ?? "");
    setCpf(customer.cpf ?? ""); setAddress(customer.address ?? ""); setNotes(customer.notes ?? "");
    setShowForm(true);
  }

  async function saveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true); setError("");
    const payload = {
      name: name.trim(), phone: phone.trim() || null, email: email.trim() || null,
      cpf: cpf.trim() || null, address: address.trim() || null, notes: notes.trim() || null,
      updated_at: new Date().toISOString()
    };
    const result = editing
      ? await supabase.from("customers").update(payload).eq("id", editing.id)
      : await supabase.from("customers").insert(payload);
    if (result.error) {
      setError("Não foi possível salvar. Verifique os dados e tente novamente.");
      setSaving(false);
      return;
    }
    setShowForm(false); setSaving(false);
    await loadCustomers();
  }

  async function archiveCustomer(customer: Customer) {
    if (!supabase || !window.confirm(`Arquivar o cadastro de ${customer.name}? O histórico será preservado.`)) return;
    const { error: archiveError } = await supabase.from("customers")
      .update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", customer.id);
    if (archiveError) setError("Não foi possível arquivar este cliente.");
    else await loadCustomers();
  }

  const filtered = customers.filter((customer) =>
    [customer.name, customer.phone ?? "", customer.email ?? "", customer.cpf ?? ""].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return <>
    <div className="page-heading">
      <div><div className="eyebrow">RELACIONAMENTO</div><h1>Cadastro de <span>clientes</span></h1><p>Cadastre e consulte os clientes compartilhados entre os usuários.</p></div>
      <button className="primary-button" onClick={openNew}><Plus size={16}/> Novo cliente</button>
    </div>
    <section className="panel customers-panel">
      <div className="customers-toolbar">
        <div><strong>{customers.length}</strong><span> clientes ativos</span></div>
        <label className="search-box"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, telefone, e-mail ou CPF"/></label>
      </div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {loading ? <div className="empty-state">Carregando clientes...</div> :
        filtered.length === 0 ? <div className="customers-empty"><Users size={30}/><strong>{search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}</strong><p>{search ? "Tente buscar por outro dado." : "Cadastre o primeiro cliente para começar a usar os registros reais."}</p><button className="primary-button" onClick={openNew}><Plus size={16}/> Novo cliente</button></div> :
        <div className="table-wrap"><table><thead><tr><th>NOME</th><th>TELEFONE</th><th>E-MAIL</th><th>CPF</th><th>AÇÕES</th></tr></thead><tbody>
          {filtered.map((customer) => <tr key={customer.id}>
            <td><strong>{customer.name}</strong></td><td>{customer.phone || "—"}</td><td>{customer.email || "—"}</td><td>{customer.cpf || "—"}</td>
            <td><div className="customer-actions"><button onClick={() => openEdit(customer)}>Editar</button><button onClick={() => void archiveCustomer(customer)}>Arquivar</button></div></td>
          </tr>)}
        </tbody></table></div>
      }
    </section>
    {showForm && <Modal title={editing ? "Editar cliente" : "Novo cliente"} onClose={() => setShowForm(false)}>
      <form onSubmit={saveCustomer}>
        <div className="customer-form-grid">
          <label className="auth-field wide">Nome completo *<input required maxLength={160} value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nome do cliente"/></label>
          <label className="auth-field">Telefone<input maxLength={40} value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="(00) 00000-0000"/></label>
          <label className="auth-field">E-mail<input type="email" maxLength={254} value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="cliente@email.com"/></label>
          <label className="auth-field">CPF (opcional)<input maxLength={14} value={cpf} onChange={(e)=>setCpf(e.target.value)} placeholder="000.000.000-00"/></label>
          <label className="auth-field wide">Endereço<input maxLength={300} value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Endereço do cliente"/></label>
          <label className="auth-field wide">Observações<textarea rows={3} maxLength={2000} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Informações adicionais"/></label>
        </div>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setShowForm(false)}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? "Salvando..." : "Salvar cliente"}</button></div>
      </form>
    </Modal>}
  </>;
}


type NewCustomerDraft = { name: string; phone: string; email: string; cpf: string; address: string };

function NewServiceOrderModal({ onClose, onSaved }: { onClose: () => void; onSaved: (number: number) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [draft, setDraft] = useState<NewCustomerDraft>({ name: "", phone: "", email: "", cpf: "", address: "" });
  const [category, setCategory] = useState("maintenance");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [equipment, setEquipment] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [reportedDefect, setReportedDefect] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [rg, setRg] = useState("");
  const [rgIssuedOn, setRgIssuedOn] = useState("");
  const [rgIssuer, setRgIssuer] = useState("");
  const [voterRegistration, setVoterRegistration] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [education, setEducation] = useState("");
  const [profession, setProfession] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [nationality, setNationality] = useState("Brasileira");
  const [firearmEmail, setFirearmEmail] = useState("");
  const [firearmAddress, setFirearmAddress] = useState("");
  const [consentRecorded, setConsentRecorded] = useState(false);
  const [docChecks, setDocChecks] = useState<Record<string, boolean>>({
    photo_3x4: false, official_id: false, cpf: false, proof_of_address: false, proof_of_occupation: false
  });
  const [estimatedTotal, setEstimatedTotal] = useState("0");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase) return;
      const { data, error: loadError } = await supabase.from("customers")
        .select("id,name,phone,email,cpf,address,notes,is_active,created_at")
        .eq("is_active", true).order("name").limit(500);
      if (!alive) return;
      if (loadError) setError("Não foi possível carregar os clientes cadastrados.");
      else setCustomers((data ?? []) as Customer[]);
    }
    void load();
    return () => { alive = false; };
  }, []);

  const matches = customers.filter((c) =>
    [c.name, c.phone ?? "", c.email ?? "", c.cpf ?? ""].join(" ").toLowerCase().includes(customerSearch.toLowerCase())
  ).slice(0, 8);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      let customer = selectedCustomer;
      if (!customer && creatingCustomer) {
        if (!draft.name.trim()) throw new Error("Informe o nome do cliente.");
        const { data, error: customerError } = await supabase.from("customers").insert({
          name: draft.name.trim(), phone: draft.phone.trim() || null,
          email: draft.email.trim() || null, cpf: draft.cpf.trim() || null,
          address: draft.address.trim() || null
        }).select("id,name,phone,email,cpf,address,notes,is_active,created_at").single();
        if (customerError) throw customerError;
        customer = data as Customer;
      }
      if (!customer) throw new Error("Selecione um cliente ou cadastre um novo.");
      if (!title.trim()) throw new Error("Informe o serviço solicitado.");
      const { data: order, error: orderError } = await supabase.from("service_orders").insert({
        customer_id: customer.id,
        category,
        title: title.trim(),
        description: description.trim() || null,
        equipment: equipment.trim() || null,
        make: make.trim() || null,
        model: model.trim() || null,
        reported_defect: reportedDefect.trim() || null,
        estimated_total: Number(estimatedTotal || 0),
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        status: "open",
        process_status: "process_started",
        production_status: category === "graphic" ? "waiting" : null
      }).select("id,order_number").single();
      if (orderError) throw orderError;
      if (category === "firearm_process") {
        const { error: customerUpdateError } = await supabase.from("customers").update({
          email: firearmEmail.trim() || customer.email,
          address: firearmAddress.trim() || customer.address,
          cpf: draft.cpf.trim() || customer.cpf
        }).eq("id", customer.id);
        if (customerUpdateError) throw customerUpdateError;
        const { error: profileError } = await supabase.from("customer_firearm_profiles").upsert({
          customer_id: customer.id,
          birth_date: birthDate || null, rg: rg.trim() || null,
          rg_issued_on: rgIssuedOn || null, rg_issuer: rgIssuer.trim() || null,
          voter_registration: voterRegistration.trim() || null,
          father_name: fatherName.trim() || null, mother_name: motherName.trim() || null,
          postal_code: postalCode.trim() || null, education: education || null,
          profession: profession.trim() || null, marital_status: maritalStatus || null,
          nationality: nationality.trim() || null,
          consent_recorded: consentRecorded,
          consent_recorded_at: consentRecorded ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: "customer_id" });
        if (profileError) throw profileError;
        const docs = [
          ["photo_3x4", "Foto 3x4"], ["official_id", "Documento oficial com foto"],
          ["cpf", "CPF"], ["proof_of_address", "Comprovante de residência"],
          ["proof_of_occupation", "Comprovante de ocupação lícita"]
        ] as const;
        const { error: docsError } = await supabase.from("firearm_process_documents").insert(
          docs.map(([document_type]) => ({
            service_order_id: order.id, document_type,
            received: Boolean(docChecks[document_type]),
            received_at: docChecks[document_type] ? new Date().toISOString() : null
          }))
        );
        if (docsError) throw docsError;
      }
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("service_order_events").insert({
        service_order_id: order.id, event_type: "created",
        description: "Ordem de serviço criada.", actor_id: userData.user?.id ?? null
      });
      onSaved(Number(order.order_number));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Não foi possível salvar a ordem. Confira os dados e tente novamente.");
      setBusy(false);
    }
  }

  return <Modal title="Nova ordem de serviço" onClose={onClose}>
    <form onSubmit={save}>
      <div className="form-field">
        <label>Cliente *</label>
        {selectedCustomer ? <div className="selected-customer"><div><strong>{selectedCustomer.name}</strong><small>{selectedCustomer.phone || selectedCustomer.email || "Cliente selecionado"}</small></div><button type="button" className="secondary-button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}>Trocar</button></div> :
          <>
            <label className="search-box customer-picker-search"><Search size={16}/><input value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setCreatingCustomer(false); }} placeholder="Buscar por nome, telefone, e-mail ou CPF"/></label>
            {customerSearch.trim() && <div className="customer-picker-results">
              {matches.map((c) => <button type="button" key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}><strong>{c.name}</strong><small>{c.phone || c.email || c.cpf || "Sem contato informado"}</small></button>)}
              {matches.length === 0 && <p>Nenhum cliente encontrado com essa busca.</p>}
            </div>}
            <button type="button" className="text-action" onClick={() => { setCreatingCustomer(true); setSelectedCustomer(null); }}>+ Cadastrar novo cliente</button>
          </>
        }
      </div>
      {creatingCustomer && <section className="inline-customer-form">
        <h3>Novo cadastro de cliente</h3><p>Após salvar, ele será vinculado automaticamente a esta OS.</p>
        <div className="customer-form-grid">
          <label className="auth-field wide">Nome completo *<input required value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})} maxLength={160}/></label>
          <label className="auth-field">Telefone<input value={draft.phone} onChange={(e)=>setDraft({...draft,phone:e.target.value})} maxLength={40}/></label>
          <label className="auth-field">E-mail<input type="email" value={draft.email} onChange={(e)=>setDraft({...draft,email:e.target.value})} maxLength={254}/></label>
          <label className="auth-field">CPF<input value={draft.cpf} onChange={(e)=>setDraft({...draft,cpf:e.target.value})} maxLength={14}/></label>
          <label className="auth-field wide">Endereço<input value={draft.address} onChange={(e)=>setDraft({...draft,address:e.target.value})} maxLength={300}/></label>
        </div>
      </section>}
      <div className="form-field"><label>Categoria *</label><select value={category} onChange={(e)=>setCategory(e.target.value)}>
        <option value="maintenance">Manutenção</option><option value="graphic">Serviços gráficos</option><option value="printing_3d">Impressão 3D</option><option value="firearm_process">Processos de CR/CAC</option>
      </select></div>
      <div className="form-field"><label>Serviço solicitado *</label><input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ex.: Manutenção de notebook, cartões de visita..."/></div>
      {category === "firearm_process" && <section className="firearm-form-section">
        <h3>Dados do processo — CR/CAC</h3>
        <p>Preencha com as informações fornecidas pelo cliente. Os dados ficam vinculados ao cadastro dele.</p>
        <div className="customer-form-grid">
          <label className="auth-field wide">Nome completo *<input required value={creatingCustomer ? draft.name : selectedCustomer?.name ?? ""} onChange={(e)=>{ if(creatingCustomer) setDraft({...draft,name:e.target.value}); }}/></label>
          <label className="auth-field">Data de nascimento<input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)}/></label>
          <label className="auth-field">CPF<input value={creatingCustomer ? draft.cpf : selectedCustomer?.cpf ?? ""} onChange={(e)=>{if(creatingCustomer) setDraft({...draft,cpf:e.target.value});}}/></label>
          <label className="auth-field">RG<input value={rg} onChange={(e)=>setRg(e.target.value)}/></label>
          <label className="auth-field">Data de expedição RG<input type="date" value={rgIssuedOn} onChange={(e)=>setRgIssuedOn(e.target.value)}/></label>
          <label className="auth-field wide">Órgão de emissão do RG<input value={rgIssuer} onChange={(e)=>setRgIssuer(e.target.value)}/></label>
          <label className="auth-field">Nº título de eleitor<input value={voterRegistration} onChange={(e)=>setVoterRegistration(e.target.value)}/></label>
          <label className="auth-field">E-mail<input type="email" value={firearmEmail || (selectedCustomer?.email ?? draft.email)} onChange={(e)=>setFirearmEmail(e.target.value)}/></label>
          <label className="auth-field">Nome do pai<input value={fatherName} onChange={(e)=>setFatherName(e.target.value)}/></label>
          <label className="auth-field">Nome da mãe<input value={motherName} onChange={(e)=>setMotherName(e.target.value)}/></label>
          <label className="auth-field wide">Endereço completo<input value={firearmAddress || (selectedCustomer?.address ?? draft.address)} onChange={(e)=>setFirearmAddress(e.target.value)}/></label>
          <label className="auth-field">CEP<input value={postalCode} onChange={(e)=>setPostalCode(e.target.value)}/></label>
          <label className="auth-field">Escolaridade<select value={education} onChange={(e)=>setEducation(e.target.value)}><option value="">Selecione</option><option>Fundamental incompleto</option><option>Fundamental completo</option><option>Médio incompleto</option><option>Médio completo</option><option>Superior incompleto</option><option>Superior completo</option><option>Pós-graduação</option></select></label>
          <label className="auth-field">Profissão<input value={profession} onChange={(e)=>setProfession(e.target.value)}/></label>
          <label className="auth-field">Estado civil<select value={maritalStatus} onChange={(e)=>setMaritalStatus(e.target.value)}><option value="">Selecione</option><option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viúvo(a)</option><option>União estável</option></select></label>
          <label className="auth-field">Nacionalidade<input value={nationality} onChange={(e)=>setNationality(e.target.value)}/></label>
        </div>
        <div className="credential-notice"><strong>Gov.br:</strong> não informe nem registre a senha neste sistema. Marque abaixo somente se o cliente autorizou o acompanhamento do acesso.</div>
        <label className="consent-check"><input type="checkbox" checked={consentRecorded} onChange={(e)=>setConsentRecorded(e.target.checked)}/> Cliente autorizou o atendimento/acompanhamento do acesso Gov.br.</label>
        <h3 className="checklist-title">Checklist de documentos recebidos</h3>
        <p>Marque os documentos entregues pelo cliente.</p>
        <div className="firearm-checklist">
          <label><input type="checkbox" checked={docChecks.photo_3x4} onChange={(e)=>setDocChecks({...docChecks,photo_3x4:e.target.checked})}/> <span><strong>Foto 3x4</strong><small>Pode ser tirada com celular, parede clara ao fundo.</small></span></label>
          <label><input type="checkbox" checked={docChecks.official_id} onChange={(e)=>setDocChecks({...docChecks,official_id:e.target.checked})}/> <span><strong>Documento oficial com foto</strong><small>RG, CNH ou outro documento oficial.</small></span></label>
          <label><input type="checkbox" checked={docChecks.cpf} onChange={(e)=>setDocChecks({...docChecks,cpf:e.target.checked})}/> <span><strong>CPF</strong><small>Caso não conste no documento de identidade.</small></span></label>
          <label><input type="checkbox" checked={docChecks.proof_of_address} onChange={(e)=>setDocChecks({...docChecks,proof_of_address:e.target.checked})}/> <span><strong>Comprovante de residência atualizado</strong></span></label>
          <label><input type="checkbox" checked={docChecks.proof_of_occupation} onChange={(e)=>setDocChecks({...docChecks,proof_of_occupation:e.target.checked})}/> <span><strong>Comprovante de ocupação lícita</strong><small>Contracheque, carteira de trabalho, IR, contrato social, pró-labore, MEI etc.</small></span></label>
        </div>
      </section>}
      {(category === "maintenance") && <div className="customer-form-grid">
        <label className="auth-field">Equipamento<input value={equipment} onChange={(e)=>setEquipment(e.target.value)} placeholder="Notebook, computador..."/></label>
        <label className="auth-field">Marca<input value={make} onChange={(e)=>setMake(e.target.value)}/></label>
        <label className="auth-field">Modelo<input value={model} onChange={(e)=>setModel(e.target.value)}/></label>
        <label className="auth-field wide">Defeito relatado<textarea rows={2} value={reportedDefect} onChange={(e)=>setReportedDefect(e.target.value)}/></label>
      </div>}
      <div className="form-field"><label>Descrição / observações</label><textarea rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Detalhes do atendimento, especificações ou orientações"/></div>
      <div className="customer-form-grid">
        <label className="auth-field">Valor estimado (R$)<input type="number" min="0" step="0.01" value={estimatedTotal} onChange={(e)=>setEstimatedTotal(e.target.value)}/></label>
        <label className="auth-field">Prazo previsto<input type="datetime-local" value={dueAt} onChange={(e)=>setDueAt(e.target.value)}/></label>
      </div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Salvando..." : "Criar ordem de serviço"}</button></div>
    </form>
  </Modal>;
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