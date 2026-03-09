import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { Layout } from '../components/Layout';
import { Download, Calendar, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx'; // <--- IMPORTANTE

export const Reports = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('7days'); 
  const [activeTab, setActiveTab] = useState<'sales' | 'profit' | 'categories'>('sales');

  useEffect(() => { fetchReports(); }, [period]);

  const fetchReports = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
      const res = await fetch(`${API_URL}/reports?period=${period}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
    } catch (error) { console.error(error); }
  };

  // --- FUNÇÃO EXPORTAR PARA EXCEL ---
  const handleExport = () => {
    if (!data) return alert("Sem dados para exportar.");

    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo Geral
    const summaryData = [
        ["Métrica", "Valor"],
        ["Total Vendas", data.totalRevenue],
        ["Lucro Líquido", data.netProfit],
        ["Margem", `${data.margin}%`],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Resumo");

    // Aba 2: Detalhamento Diário
    if (data.chartData) {
        const ws2 = XLSX.utils.json_to_sheet(data.chartData);
        XLSX.utils.book_append_sheet(wb, ws2, "Dados Diários");
    }

    // Aba 3: Categorias
    if (data.categoryData) {
        const ws3 = XLSX.utils.json_to_sheet(data.categoryData);
        XLSX.utils.book_append_sheet(wb, ws3, "Categorias");
    }

    // Baixa o arquivo
    XLSX.writeFile(wb, `Relatorio_StoqPlus_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Layout active="reports" onNavigate={onNavigate} onLogout={onLogout} user={user} storeName={storeName} setUser={setUser}>
            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
                
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Relatórios</h1>
                        <p className="text-slate-500 text-sm mt-1">Análise detalhada de vendas e lucros.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold py-2.5 pl-10 pr-8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm w-full sm:w-auto">
                                <option value="7days">Últimos 7 dias</option>
                                <option value="30days">Últimos 30 dias</option>
                                <option value="year">Este Ano</option>
                            </select>
                            <Calendar size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none"/>
                        </div>
                        
                        <button onClick={handleExport} className="hidden md:flex bg-white border border-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl text-sm items-center gap-2 hover:bg-slate-50 shadow-sm transition hover:text-green-600 hover:border-green-200">
                            <Download size={16} /> Exportar Excel
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2"><p className="text-xs font-bold text-slate-500 uppercase">Total de Vendas</p><DollarSign size={16} className="text-slate-300"/></div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800">{formatMoney(data?.totalRevenue || 0)}</h3>
                        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1"><TrendingUp size={10}/> Período selecionado</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2"><p className="text-xs font-bold text-slate-500 uppercase">Lucro Líquido</p><TrendingUp size={16} className="text-slate-300"/></div>
                        <h3 className="text-2xl md:text-3xl font-black text-emerald-600">{formatMoney(data?.netProfit || 0)}</h3>
                        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1"><TrendingUp size={10}/> Margem saudável</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2"><p className="text-xs font-bold text-slate-500 uppercase">Margem de Lucro</p><PieIcon size={16} className="text-slate-300"/></div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800">{data?.margin || 0}%</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Média do período</p>
                    </div>
                </div>

                {/* Área Principal de Gráficos */}
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[350px] md:min-h-[500px]">
                    <div className="flex gap-2 mb-6 md:mb-8 bg-slate-50 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
                        <button onClick={() => setActiveTab('sales')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'sales' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Vendas</button>
                        <button onClick={() => setActiveTab('profit')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'profit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lucro</button>
                        <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'categories' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Categorias</button>
                    </div>

                    <div className="h-60 md:h-80 w-full">
                        {activeTab === 'sales' && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.chartData}>
                                    <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10}/>
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `R$ ${val}`}/>
                                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border:'none', borderRadius: '8px', color:'#fff'}} itemStyle={{color: '#fff'}} formatter={(value: any) => [formatMoney(value), "Vendas"]}/>
                                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                        {activeTab === 'profit' && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10}/>
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}}/>
                                    <Tooltip cursor={{fill: '#f0fdf4'}} contentStyle={{backgroundColor: '#1e293b', border:'none', borderRadius: '8px', color:'#fff'}} formatter={(value: any) => [formatMoney(value), "Lucro"]}/>
                                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {activeTab === 'categories' && (
                            <div className="flex flex-col md:flex-row h-full items-center">
                                <div className="flex-1 h-full w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={data?.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {data?.categoryData.map((_: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                            </Pie>
                                            <Tooltip formatter={(value: number | undefined) => formatMoney(value || 0)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full md:w-1/3 space-y-3 pl-0 md:pl-8 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100">
                                    {data?.categoryData.map((entry: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div><span className="text-sm font-bold text-slate-600">{entry.name}</span></div>
                                            <span className="text-xs font-bold text-slate-400">{((entry.value / data.totalRevenue) * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
    </Layout>
  );
};
