import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
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
        const res = await fetch('http://localhost:3333/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleDeleteStore = async (id: string, name: string) => {
    const confirmName = prompt(`PERIGO: Você está prestes a apagar a loja "${name}" e TODOS os dados dela.\n\nPara confirmar, digite o nome da loja:`);
    if (confirmName !== name) return alert("Nome incorreto. Ação cancelada.");

    const token = localStorage.getItem('stoq_token');
    try {
        await fetch(`http://localhost:3333/admin/store/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        alert("Loja deletada.");
        fetchAdminData();
    } catch (e) { alert("Erro ao deletar."); }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredStores = data?.stores.filter((s: any) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="admin" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento (MRR)</p>
                            <TrendingUp size={18} className="text-emerald-500"/>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{formatMoney(data?.metrics.mrr || 0)}<span className="text-sm text-slate-400 font-medium">/mês</span></h3>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Lojas</p>
                            <Store size={18} className="text-blue-500"/>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{data?.metrics.totalStores || 0}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assinantes PRO</p>
                            <Crown size={18} className="text-yellow-500 fill-yellow-500"/>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{data?.metrics.proCount || 0}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuários Totais</p>
                            <Users size={18} className="text-slate-400"/>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{data?.metrics.totalUsers || 0}</h3>
                    </div>
                </div>

                {/* Lista de Lojas */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
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
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Loja</th>
                                <th className="px-6 py-4">Dono</th>
                                <th className="px-6 py-4">Plano</th>
                                <th className="px-6 py-4 text-center">Stats (Prod/Vend/Eqp)</th>
                                <th className="px-6 py-4">Criada em</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredStores.map((store: any) => (
                                <tr key={store.id} className="hover:bg-slate-50 transition group">
                                    <td className="px-6 py-4 font-bold text-slate-800">{store.name}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-slate-700 font-bold text-xs">{store.ownerName}</p>
                                        <p className="text-slate-400 text-[10px]">{store.ownerEmail}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {store.plan === 'PRO' ? (
                                            <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded flex items-center gap-1 w-fit"><Crown size={10} className="fill-yellow-400 text-yellow-400"/> PRO</span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">FREE</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                            {store.stats.products} / {store.stats.sales} / {store.stats.users}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {new Date(store.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDeleteStore(store.id, store.name)}
                                            className="text-slate-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition" 
                                            title="Deletar Loja Permanentemente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
};