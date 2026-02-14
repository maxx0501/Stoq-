import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Users, UserPlus, ShieldCheck, Trash2, Edit, CheckCircle, XCircle, BarChart3, Activity, ShoppingBag, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Team = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [team, setTeam] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ ranking: [], activityLog: [] });
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetMember, setTargetMember] = useState<any>(null); 
  const [showSuccessModal, setShowSuccessModal] = useState(false); // <--- NOVO
  const [successMessage, setSuccessMessage] = useState(''); // <--- NOVO

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SELLER', canSell: true, canManageProducts: false });

  useEffect(() => {
    fetchTeam();
    fetchAnalytics();
  }, []);

  const fetchTeam = async () => {
    const token = localStorage.getItem('stoq_token');
    const res = await fetch('http://localhost:3333/sellers', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setTeam(await res.json());
  };

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('stoq_token');
    const res = await fetch('http://localhost:3333/team/analytics', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setAnalytics(await res.json());
  };

  const openCreateModal = (role: 'SELLER' | 'MANAGER') => {
    setIsEditMode(false);
    setForm({ name: '', email: '', password: '', role, canSell: true, canManageProducts: role === 'MANAGER' });
    setIsModalOpen(true);
  };

  const openEditModal = (member: any) => {
    setIsEditMode(true);
    setTargetMember(member);
    setForm({
        name: member.name, email: member.email, password: '', 
        role: member.role, canSell: member.canSell, canManageProducts: member.canManageProducts
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Demitir este funcionário?")) {
      const token = localStorage.getItem('stoq_token');
      await fetch(`http://localhost:3333/sellers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchTeam();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('stoq_token');
    const url = isEditMode ? `http://localhost:3333/team/member/${targetMember.id}` : 'http://localhost:3333/sellers';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(form)
        });

        if (res.ok) {
            // SUCESSO VISUAL
            setIsModalOpen(false);
            setSuccessMessage(isEditMode ? "Permissões atualizadas!" : "Membro adicionado!");
            setShowSuccessModal(true);
            fetchTeam();
            // Fecha sozinho
            setTimeout(() => setShowSuccessModal(false), 2000);
        } else {
            alert("Erro ao salvar.");
        }
    } catch (error) { alert("Erro conexão"); }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="team" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <Users className="text-blue-600" /> Gestão de Equipe
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Gerencie permissões, adicione gestores e acompanhe desempenho.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => openCreateModal('MANAGER')} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/30 transition transform hover:-translate-y-1">
                            <ShieldCheck size={20} /> Novo Gestor
                        </button>
                        <button onClick={() => openCreateModal('SELLER')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-1">
                            <UserPlus size={20} /> Novo Vendedor
                        </button>
                    </div>
                </div>

                {/* Gráfico e Log */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-blue-500"/> Ranking de Vendas
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.ranking} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#1e293b', border:'none', borderRadius: '8px', color:'#fff'}} formatter={(val: number | undefined) => formatMoney(val || 0)}/>
                                    <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                                        {analytics.ranking.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-emerald-500"/> Atividade Recente
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-64 custom-scrollbar">
                            {analytics.activityLog.map((log: any) => (
                                <div key={log.id} className="flex gap-3 items-start text-sm">
                                    <div className={`mt-1 p-1.5 rounded-full shrink-0 ${log.type === 'SALE' ? 'bg-blue-100 text-blue-600' : (log.type === 'STOCK_ENTRY' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}`}>
                                        {log.type === 'SALE' ? <ShoppingBag size={12}/> : <Package size={12}/>}
                                    </div>
                                    <div>
                                        <p className="text-slate-800 font-bold">
                                            {log.user} <span className="font-normal text-slate-500 text-xs">· {new Date(log.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                                        </p>
                                        <p className="text-slate-500 text-xs leading-tight">{log.detail}</p>
                                    </div>
                                </div>
                            ))}
                            {analytics.activityLog.length === 0 && <p className="text-slate-400 text-xs italic">Nenhuma atividade recente.</p>}
                        </div>
                    </div>
                </div>

                {/* Tabela */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                            <tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Cargo</th><th className="px-6 py-4 text-center">Vende?</th><th className="px-6 py-4 text-center">Estoque?</th><th className="px-6 py-4 text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {team.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4"><p className="font-bold text-slate-700">{member.name}</p><p className="text-xs text-slate-400">{member.email}</p></td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${member.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{member.role === 'MANAGER' ? 'GESTOR' : 'VENDEDOR'}</span></td>
                                    <td className="px-6 py-4 text-center">{member.canSell ? <CheckCircle size={16} className="text-emerald-500 mx-auto"/> : <XCircle size={16} className="text-slate-300 mx-auto"/>}</td>
                                    <td className="px-6 py-4 text-center">{member.canManageProducts ? <CheckCircle size={16} className="text-emerald-500 mx-auto"/> : <XCircle size={16} className="text-slate-300 mx-auto"/>}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEditModal(member)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(member.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --- MODAL FORM --- */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in zoom-in duration-200">
                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
                    <h2 className="text-xl font-black text-slate-800 mb-6">{isEditMode ? 'Editar Permissões' : (form.role === 'MANAGER' ? 'Novo Gestor' : 'Novo Vendedor')}</h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        {!isEditMode && (
                            <>
                                <div><label className="text-xs font-bold text-slate-500">NOME</label><input className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required/></div>
                                <div><label className="text-xs font-bold text-slate-500">EMAIL</label><input type="email" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/></div>
                                <div><label className="text-xs font-bold text-slate-500">SENHA</label><input type="password" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required/></div>
                            </>
                        )}
                        {isEditMode && <div className="bg-slate-50 p-3 rounded-xl mb-4"><p className="font-bold text-slate-700">{form.name}</p><p className="text-xs text-slate-500">{form.email}</p></div>}
                        <div className="pt-2 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">CARGO</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setForm({...form, role: 'SELLER', canManageProducts: false})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${form.role === 'SELLER' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-500'}`}>Vendedor</button>
                                <button type="button" onClick={() => setForm({...form, role: 'MANAGER', canSell: true, canManageProducts: true})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${form.role === 'MANAGER' ? 'bg-purple-50 border-purple-500 text-purple-600' : 'border-slate-200 text-slate-500'}`}>Gestor</button>
                            </div>
                        </div>
                        {form.role === 'SELLER' && (
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.canSell} onChange={e=>setForm({...form, canSell: e.target.checked})} className="w-5 h-5 accent-blue-600"/><span className="text-sm text-slate-700">Pode realizar vendas</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.canManageProducts} onChange={e=>setForm({...form, canManageProducts: e.target.checked})} className="w-5 h-5 accent-blue-600"/><span className="text-sm text-slate-700">Pode mexer no estoque</span></label>
                            </div>
                        )}
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL SUCESSO --- */}
        {showSuccessModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={48} className="animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">Sucesso!</h3>
                    <p className="text-slate-500 font-bold">{successMessage}</p>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};