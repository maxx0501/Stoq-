import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { Layout } from '../components/Layout';
import { LayoutDashboard, TrendingUp, Users, Store, Trash2, Search, Crown, ShieldAlert } from 'lucide-react';

export const SuperAdmin = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
        console.log('Fetching admin dashboard...', { token: token?.substring(0, 20) + '...' });
        const res = await fetch(`${API_URL}/admin/dashboard`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Admin data:', data);
        if (res.ok) setData(data);
        else console.error('Error from server:', data.error);
    } catch (e) { 
        console.error('Fetch error:', e); 
    }
  };

  const handleDeleteStore = async (id: string, name: string) => {
    const targetStore = data?.stores.find((s: any) => s.id === id);
    const userCount = targetStore?.stats.users || 0;
    const confirmName = prompt(`⚠️ PERIGO: Você está prestes a apagar a loja "${name}"\n\nISTO VAI DELETAR:\n✗ Todos os dados da loja (produtos, vendas, etc)\n✗ Todos os ${userCount} usuários associados\n\nPara confirmar, digite o nome da loja:`);
    if (confirmName !== name) return alert("Nome incorreto. Ação cancelada.");

    const token = localStorage.getItem('stoq_token');
    try {
        await fetch(`${API_URL}/admin/store/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        alert("Loja e usuários deletados com sucesso.");
        fetchAdminData();
    } catch (e) { alert("Erro ao deletar."); }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredStores = data?.stores.filter((s: any) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Layout active="admin" onNavigate={onNavigate} onLogout={onLogout} user={user} storeName={storeName} setUser={setUser}>
            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
                
                {/* Header Admin */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Painel do CEO</h1>
                        <p className="text-slate-500 text-sm">Visão geral de todo o ecossistema Stoq+.</p>
                    </div>
                </div>

                {/* KPIs de Negócio */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28 md:h-32">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento (MRR)</p>
                            <TrendingUp size={18} className="text-emerald-500 hidden sm:block"/>
                        </div>
                        <h3 className="text-xl md:text-3xl font-black text-slate-800">{formatMoney(data?.metrics.mrr || 0)}<span className="text-[10px] md:text-sm text-slate-400 font-medium">/mês</span></h3>
                    </div>
                    
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28 md:h-32">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Lojas</p>
                            <Store size={18} className="text-blue-500 hidden sm:block"/>
                        </div>
                        <h3 className="text-xl md:text-3xl font-black text-slate-800">{data?.metrics.totalStores || 0}</h3>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28 md:h-32">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Assinantes PRO</p>
                            <Crown size={18} className="text-yellow-500 fill-yellow-500 hidden sm:block"/>
                        </div>
                        <h3 className="text-xl md:text-3xl font-black text-slate-800">{data?.metrics.proCount || 0}</h3>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28 md:h-32">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Usuários Totais</p>
                            <Users size={18} className="text-slate-400 hidden sm:block"/>
                        </div>
                        <h3 className="text-xl md:text-3xl font-black text-slate-800">{data?.metrics.totalUsers || 0}</h3>
                    </div>
                </div>

                {/* Lista de Lojas */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <LayoutDashboard size={18} className="text-slate-400"/> Lojas Registradas
                        </h3>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                            <input 
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                placeholder="Buscar loja ou email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                    {filteredStores.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Store size={48} className="mx-auto mb-4 opacity-20"/>
                            <p className="text-lg">Nenhuma loja encontrada</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6">
                            {filteredStores.map((store: any) => (
                                <div key={store.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md transition group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 text-base line-clamp-1">{store.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Criada em {new Date(store.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteStore(store.id, store.name)}
                                            className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                                            title="Deletar loja e todos os usuários associados"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Informações do Proprietário */}
                                    <div className="mb-4 pb-4 border-b border-slate-100">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Proprietário</p>
                                        <p className="font-bold text-slate-800 text-sm">{store.ownerName}</p>
                                        <p className="text-xs text-slate-500 truncate">{store.ownerEmail}</p>
                                    </div>

                                    {/* Plano e Stats */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                            <p className="text-[10px] text-slate-500 font-bold">PLANO</p>
                                            {store.plan === 'PRO' ? (
                                                <p className="font-bold text-xs text-yellow-600 flex items-center justify-center gap-1 mt-1">
                                                    <Crown size={12} className="fill-yellow-600"/> PRO
                                                </p>
                                            ) : (
                                                <p className="font-bold text-xs text-slate-600 mt-1">FREE</p>
                                            )}
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                                            <p className="text-[10px] text-blue-600 font-bold">PRODUTOS</p>
                                            <p className="font-black text-base text-blue-700 mt-1">{store.stats.products}</p>
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded-lg text-center">
                                            <p className="text-[10px] text-emerald-600 font-bold">VENDAS</p>
                                            <p className="font-black text-base text-emerald-700 mt-1">{store.stats.sales}</p>
                                        </div>
                                    </div>

                                    {/* Usuários */}
                                    <div className="bg-purple-50 p-3 rounded-lg mt-2">
                                        <p className="text-[10px] text-purple-600 font-bold flex items-center gap-2">
                                            <Users size={12}/> USUÁRIOS
                                        </p>
                                        <p className="font-black text-base text-purple-700 mt-1">{store.stats.users}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </div>

            </div>
    </Layout>
  );
};
