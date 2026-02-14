import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, 
  AlertTriangle, Plus, ArrowRight, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

export const Dashboard = ({ onLogout, user, storeName, onNavigate, setUser }: any) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'7days' | 'month' | 'year'>('7days');

  useEffect(() => {
    fetchMetrics();
  }, [chartPeriod]);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('stoq_token');
      const res = await fetch(`http://localhost:3333/dashboard-metrics?period=${chartPeriod}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (error) { console.error("Erro dashboard"); } finally { setIsLoading(false); }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- Formatador Compacto (ex: 1500 -> 1.5k) ---
  const formatCompact = (val: number) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return val.toString();
  };

  // --- Componente para o Label em cima da barra ---
  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (!value || value === 0) return null;

    return (
      <text 
        x={x + width / 2} 
        y={y} 
        dy={-6} 
        fill="#64748b" 
        fontSize={10} 
        fontWeight="bold"
        textAnchor="middle" 
      >
        {formatCompact(Number(value))}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
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

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const KpiCard = ({ title, value, subtext, icon: Icon, color, trend, trendValue }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div><p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">{title}</p><h3 className="text-2xl font-black text-slate-800">{value}</h3></div>
        <div className={`p-3 rounded-xl ${color}`}><Icon size={20} /></div>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium">
        {trend === 'up' && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 font-bold"><TrendingUp size={12}/> {trendValue}</span>}
        {trend === 'down' && <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1 font-bold"><TrendingDown size={12}/> {trendValue}</span>}
        <span className="text-slate-400">{subtext}</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      {/* CORREÇÃO AQUI: Passando user={user} */}
      <Sidebar active="dashboard" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h2>
                        <p className="text-slate-500 text-sm mt-1">Visão geral da performance da sua loja.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onNavigate('products')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"><Package size={18}/> Produtos</button>
                        <button onClick={() => onNavigate('sales')} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/30"><Plus size={18}/> Nova Venda</button>
                    </div>
                </div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Faturamento Hoje" value={formatMoney(data?.today.revenue)} subtext="vs. ontem" icon={DollarSign} color="bg-blue-50 text-blue-600" trend={revTrend} trendValue="vs. ontem"/>
                    <KpiCard title="Lucro Líquido" value={formatMoney(data?.today.profit)} subtext="Margem real" icon={Wallet} color="bg-emerald-50 text-emerald-600" trend={profitTrend} trendValue="vs. ontem"/>
                    <KpiCard title="Pedidos" value={data?.today.count} subtext="Volume de vendas" icon={ShoppingBag} color="bg-violet-50 text-violet-600" trend="up" trendValue="Hoje"/>
                    <KpiCard title="Risco de Estoque" value={`${data?.lowStockCount} itens`} subtext="Abaixo do mínimo" icon={AlertTriangle} color="bg-amber-50 text-amber-600" trend={data?.lowStockCount > 0 ? 'down' : 'up'} trendValue={data?.lowStockCount > 0 ? 'Crítico' : 'Ok'}/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Faturamento</h3>
                                <p className="text-xs text-slate-400">Acompanhamento financeiro.</p>
                            </div>
                            
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button onClick={() => setChartPeriod('7days')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartPeriod === '7days' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>7 Dias</button>
                                <button onClick={() => setChartPeriod('month')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartPeriod === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{currentMonthName}</button>
                                <button onClick={() => setChartPeriod('year')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartPeriod === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{currentYear}</button>
                            </div>
                        </div>
                        
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickFormatter={(value) => `R$ ${value}`}
                              />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                              <Bar 
                                dataKey="value" 
                                fill="#2563eb" 
                                radius={[4, 4, 0, 0]} 
                                barSize={chartPeriod === 'month' ? 15 : 40}
                                animationDuration={1000}
                                label={<CustomBarLabel />} 
                              />
                              {chartAverage > 0 && (
                                <ReferenceLine y={chartAverage} stroke="#fb923c" strokeDasharray="3 3" />
                              )}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {chartAverage > 0 && (
                           <div className="flex justify-end mt-2">
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-orange-400"></div> Média: {formatMoney(chartAverage)}
                              </span>
                           </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-yellow-500"/> Campeões de Venda
                        </h3>
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

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div><h3 className="font-bold text-slate-800">Transações Recentes</h3><p className="text-xs text-slate-400">Últimas movimentações.</p></div>
                        <button onClick={() => onNavigate('sales')} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition flex items-center gap-1">Ver histórico <ArrowRight size={12}/></button>
                    </div>
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

            </div>
        </div>
      </main>
    </div>
  );
};