import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { Layout } from '../components/Layout';
import { WIDGET_REGISTRY } from '../components/dashboard/WidgetRegistry';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, AlertTriangle, Plus, ArrowRight, Wallet, 
  LayoutGrid, X, CheckCircle2, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

export const Dashboard = ({ onLogout, user, storeName, onNavigate, setUser }: any) => {
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>({ sellers: [], categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // FIXO: Removemos a opção de trocar, agora é sempre 7 dias
//   const chartPeriod = '7days';
  
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
      const saved = localStorage.getItem('stoq_dashboard_widgets');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { fetchMetrics(); }, []);

  useEffect(() => {
    if (activeWidgets.length > 0 && analytics.sellers.length === 0) {
        fetchAnalytics();
    }
  }, [activeWidgets]);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('stoq_token');
      // Forçamos o periodo para 7days
      const res = await fetch(`${API_URL}/dashboard-metrics?period=7days`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (error) { console.error("Erro dashboard"); } finally { setIsLoading(false); }
  };

  const fetchAnalytics = async () => {
    try {
        const token = localStorage.getItem('stoq_token');
        // A rota advanced continua funcionando para os widgets extras
        const res = await fetch(`${API_URL}/dashboard-metrics/advanced`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok) setAnalytics(json);
    } catch (error) { console.error("Erro analytics"); }
  };

  const toggleWidget = (widgetId: string) => {
      const newWidgets = activeWidgets.includes(widgetId)
        ? activeWidgets.filter(id => id !== widgetId)
        : [...activeWidgets, widgetId];
      
      setActiveWidgets(newWidgets);
      localStorage.setItem('stoq_dashboard_widgets', JSON.stringify(newWidgets));
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatCompact = (val: number) => { if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'k'; return val.toString(); };

  // Componentes visuais do gráfico principal
  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (!value || value === 0) return null;
    return <text x={x + width / 2} y={y} dy={-6} fill="#64748b" fontSize={10} fontWeight="bold" textAnchor="middle">{formatCompact(Number(value))}</text>;
  };
  
  const CustomTooltipMain = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700 z-50">
            <p className="font-bold text-slate-300 mb-1 uppercase tracking-wider">{label}</p>
            <p className="font-black text-lg">{formatMoney(payload[0].value)}</p>
          </div>
        );
      }
      return null;
  };

  const calculateAverage = () => {
    if (!data?.chartData) return 0;
    const total = data.chartData.reduce((acc: number, curr: any) => acc + Number(curr.value), 0);
    return total / (data.chartData.length || 1);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-bold text-slate-400 animate-pulse">Carregando Stoq+...</div>;

  const revTrend = (data?.today.revenue >= data?.yesterday.revenue) ? 'up' : 'down';
  const profitTrend = (data?.today.profit >= data?.yesterday.profit) ? 'up' : 'down';
  const chartAverage = calculateAverage();

  const KpiCard = ({ title, value, subtext, icon: Icon, color, trend, trendValue }: any) => (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div><p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wide mb-1">{title}</p><h3 className="text-xl md:text-2xl font-black text-slate-800">{value}</h3></div>
        <div className={`p-2 md:p-3 rounded-xl ${color}`}><Icon size={18} /></div>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium">
        {trend === 'up' && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 font-bold"><TrendingUp size={12}/> {trendValue}</span>}
        {trend === 'down' && <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1 font-bold"><TrendingDown size={12}/> {trendValue}</span>}
        <span className="text-slate-400">{subtext}</span>
      </div>
    </div>
  );

  return (
    <Layout active="dashboard" onNavigate={onNavigate} onLogout={onLogout} user={user} storeName={storeName} setUser={setUser}>
            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h2>
                        <p className="text-slate-500 text-sm mt-1">Visão geral da performance da sua loja.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                        <button 
                            onClick={() => setShowWidgetModal(true)} 
                            className="px-3 md:px-5 py-2 md:py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 text-xs md:text-sm font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
                        >
                            <LayoutGrid size={16}/> <span className="hidden sm:inline">Personalizar</span><span className="sm:hidden">Widgets</span>
                            {activeWidgets.length > 0 && <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 rounded-full">{activeWidgets.length}</span>}
                        </button>
                        <button onClick={() => onNavigate('sales')} className="px-3 md:px-5 py-2 md:py-2.5 bg-blue-600 text-white text-xs md:text-sm font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/30"><Plus size={16}/> <span className="hidden sm:inline">Nova Venda</span><span className="sm:hidden">Vender</span></button>
                    </div>
                </div>
            
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <KpiCard title="Faturamento Hoje" value={formatMoney(data?.today.revenue)} subtext="vs. ontem" icon={DollarSign} color="bg-blue-50 text-blue-600" trend={revTrend} trendValue="vs. ontem"/>
                    <KpiCard title="Lucro Líquido" value={formatMoney(data?.today.profit)} subtext="Margem real" icon={Wallet} color="bg-emerald-50 text-emerald-600" trend={profitTrend} trendValue="vs. ontem"/>
                    <KpiCard title="Pedidos" value={data?.today.count} subtext="Volume de vendas" icon={ShoppingBag} color="bg-violet-50 text-violet-600" trend="up" trendValue="Hoje"/>
                    <KpiCard title="Risco de Estoque" value={`${data?.lowStockCount} itens`} subtext="Abaixo do mínimo" icon={AlertTriangle} color="bg-amber-50 text-amber-600" trend={data?.lowStockCount > 0 ? 'down' : 'up'} trendValue={data?.lowStockCount > 0 ? 'Crítico' : 'Ok'}/>
                </div>

                {/* 1. GRÁFICO PRINCIPAL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                    <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Faturamento</h3>
                                <p className="text-xs text-slate-400">Acompanhamento financeiro.</p>
                            </div>
                            
                            {/* AQUI ESTAVA O FILTRO - AGORA É SÓ UM TEXTO FIXO */}
                            <div className="bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400"/>
                                Últimos 7 Dias
                            </div>
                        </div>
                        
                        <div className="h-48 md:h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                              
                              <YAxis width={80} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(value) => `R$ ${value}`} />
                              
                              <Tooltip content={<CustomTooltipMain />} cursor={{ fill: '#f8fafc' }} />
                              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1000} label={<CustomBarLabel />} />
                              {chartAverage > 0 && <ReferenceLine y={chartAverage} stroke="#fb923c" strokeDasharray="3 3" />}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {chartAverage > 0 && (
                           <div className="flex justify-end mt-4 px-2">
                                <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg">
                                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Média do Período</span>
                                    <span className="text-sm font-black text-orange-600">{formatMoney(chartAverage)}</span>
                                    <div className="w-8 h-0.5 bg-orange-300 border-t border-b border-orange-200 border-dashed"></div> 
                                </div>
                           </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-yellow-500"/> Campeões de Venda</h3>
                        <div className="space-y-4">
                        {data?.topProducts.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>{i+1}º</div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate max-w-[120px]" title={p.name}>{p.name}</p>
                                        <div className="flex items-center gap-2"><span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{p.quantity} un</span></div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-800">{formatMoney(Number(p.price))}</p>
                                    <p className="text-[10px] text-slate-400">unidade</p>
                                </div>
                            </div>
                        ))}
                        {data?.topProducts.length === 0 && <div className="text-center py-10 text-slate-300 italic text-sm">Nenhuma venda ainda.</div>}
                        </div>
                    </div>
                </div>

                {/* 2. ÁREA DINÂMICA DE WIDGETS */}
                {activeWidgets.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        {activeWidgets.map(widgetId => {
                            const widgetConfig = WIDGET_REGISTRY.find(w => w.id === widgetId);
                            if (!widgetConfig) return null;
                            const WidgetComponent = widgetConfig.component;
                            
                            return (
                                <div key={widgetId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80 flex flex-col relative group">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition cursor-pointer" onClick={() => toggleWidget(widgetId)}>
                                        <X size={16} className="text-slate-300 hover:text-red-500"/>
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <widgetConfig.icon size={18} className={widgetConfig.color}/> {widgetConfig.title}
                                    </h3>
                                    <div className="flex-1 w-full min-h-0">
                                        <WidgetComponent data={analytics[widgetConfig.dataKey]} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 3. TRANSAÇÕES RECENTES */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div><h3 className="font-bold text-slate-800 text-sm md:text-base">Transações Recentes</h3><p className="text-xs text-slate-400 hidden sm:block">Últimas movimentações.</p></div>
                        <button onClick={() => onNavigate('sales')} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition flex items-center gap-1">Ver tudo <ArrowRight size={12}/></button>
                    </div>
                    
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Responsável</th>
                            <th className="px-6 py-4">Detalhes</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {data?.recentSales.map((sale: any) => (
                            <tr key={sale.id} className="hover:bg-blue-50/30 transition group cursor-default">
                                <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-emerald-200"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Pago</span></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center text-[10px] font-bold uppercase">{(sale.user?.name || user?.name || '?')[0]}</div>
                                        <span className="text-sm font-bold text-slate-700">{sale.user?.name || <span className="text-slate-400 italic font-normal">Sistema Antigo</span>}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}</span></td>
                                <td className="px-6 py-4 text-xs text-slate-500 font-mono">{new Date(sale.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</td>
                                <td className="px-6 py-4 text-right"><span className="font-black text-slate-800 bg-green-50 text-green-700 px-2 py-1 rounded-lg">{formatMoney(Number(sale.total))}</span></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden divide-y divide-slate-50">
                        {data?.recentSales.map((sale: any) => (
                            <div key={sale.id} className="p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center text-xs font-bold uppercase shrink-0">{(sale.user?.name || user?.name || '?')[0]}</div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{sale.user?.name || 'Sistema'}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(sale.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })} · {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}</p>
                                    </div>
                                </div>
                                <span className="font-black text-sm text-green-700 bg-green-50 px-2 py-1 rounded-lg shrink-0">{formatMoney(Number(sale.total))}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        {/* MODAL DE GALERIA - COM SCROLL CORRIGIDO */}
        {showWidgetModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Galeria de Gráficos</h3>
                            <p className="text-slate-500 text-sm">Escolha o que você quer ver no painel.</p>
                        </div>
                        <button onClick={() => setShowWidgetModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0 custom-scrollbar">
                        {WIDGET_REGISTRY.map((widget) => {
                            const isActive = activeWidgets.includes(widget.id);
                            return (
                                <div 
                                    key={widget.id} 
                                    onClick={() => toggleWidget(widget.id)}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 group ${isActive ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <div className={`p-3 rounded-xl shrink-0 ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white'} transition-colors`}>
                                        <widget.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-sm ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>{widget.title}</h4>
                                        <p className="text-xs text-slate-500 leading-tight mt-0.5">{widget.description}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-transparent'}`}>
                                        <CheckCircle2 size={12} fill="currentColor" className="text-white" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end shrink-0">
                        <button onClick={() => setShowWidgetModal(false)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg w-full sm:w-auto">
                            Concluir
                        </button>
                    </div>
                </div>
            </div>
        )}
    </Layout>
  );
};
