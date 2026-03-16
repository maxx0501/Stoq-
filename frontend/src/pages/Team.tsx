import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { Layout } from '../components/Layout';
import { Users, UserPlus, ShieldCheck, Trash2, Edit, CheckCircle, XCircle, BarChart3, Activity, ShoppingBag, Package, Lock, Eye, EyeOff, AlertTriangle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Team = ({ onNavigate, onLogout, user, storeName, setUser, toggleTheme, currentTheme }: any) => {
  const [team, setTeam] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ ranking: [], activityLog: [] });
  const [isLoading, setIsLoading] = useState(false);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetMember, setTargetMember] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Password Change Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalUserId, setPasswordModalUserId] = useState<string | null>(null);
  const [passwordModalUserName, setPasswordModalUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showMainPassword, setShowMainPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Confirmation Modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SELLER', canSell: true, canManageProducts: false });

  useEffect(() => {
    fetchTeam();
    fetchAnalytics();
  }, []);

  const fetchTeam = async () => {
    const token = localStorage.getItem('stoq_token');
    const res = await fetch(`${API_URL}/sellers`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setTeam(await res.json());
  };

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('stoq_token');
    const res = await fetch(`${API_URL}/team/analytics`, { headers: { 'Authorization': `Bearer ${token}` } });
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

  const handleResetPassword = (id: string, name: string) => {
    setPasswordModalUserId(id);
    setPasswordModalUserName(name);
    setNewPassword('');
    setConfirmPassword('');
    setShowMainPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('As senhas não conferem.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('stoq_token');

      const res = await fetch(`${API_URL}/auth/admin-reset-password/${passwordModalUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro ao alterar' }));
        showError(data.error || 'Erro ao alterar senha');
        return;
      }

      setIsPasswordModalOpen(false);
      showSuccess(`Senha de ${passwordModalUserName} alterada com sucesso!`);
    } catch (error: any) {
      showError(error.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(team.find(m => m.id === id)?.name || 'Funcionário');
    setShowDeleteConfirmModal(true);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('stoq_token');
      const res = await fetch(`${API_URL}/sellers/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro ao deletar' }));
        showError(data.error || 'Erro ao remover funcionário');
        return;
      }

      setShowDeleteConfirmModal(false);
      showSuccess("Funcionário removido com sucesso!");
      await fetchTeam();
    } catch (error: any) {
      showError(error.message || 'Erro ao remover funcionário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    const token = localStorage.getItem('stoq_token');
    const url = isEditMode ? `${API_URL}/team/member/${targetMember.id}` : `${API_URL}/team`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(form)
        });

        let data;
        try {
            data = await res.json();
        } catch {
            data = { ok: res.ok };
        }

        if (res.ok) {
            setIsModalOpen(false);
            showSuccess(isEditMode ? "Permissões atualizadas!" : "Membro adicionado!");
            await fetchTeam();
        } else {
            showError(data.error || "Erro ao salvar.");
        }
    } catch (error: any) {
        showError(error.message || "Erro na conexão");
    } finally {
        setIsLoading(false);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setMessageType('success');
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  const showError = (msg: string) => {
    setSuccessMessage(msg);
    setMessageType('error');
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  return (
    <Layout active="team" onNavigate={onNavigate} onLogout={onLogout} user={user} storeName={storeName} setUser={setUser} toggleTheme={toggleTheme} currentTheme={currentTheme}>
            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Users className="text-blue-600" /> Gestão de Equipe
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie permissões, adicione gestores e acompanhe desempenho.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => openCreateModal('MANAGER')} className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition">
                            <ShieldCheck size={20} /> <span className="hidden sm:inline">Novo</span> Gestor
                        </button>
                        <button onClick={() => openCreateModal('SELLER')} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition">
                            <UserPlus size={20} /> <span className="hidden sm:inline">Novo</span> Vendedor
                        </button>
                    </div>
                </div>

                {/* Gráfico e Log */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-blue-500"/> Ranking de Vendas
                        </h3>
                        <div className="h-48 md:h-64 w-full">
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

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-emerald-500"/> Atividade Recente
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-64 custom-scrollbar">
                            {analytics.activityLog.map((log: any) => (
                                <div key={log.id} className="flex gap-3 items-start text-sm">
                                    <div className={`mt-1 p-1.5 rounded-full shrink-0 ${log.type === 'SALE' ? 'bg-blue-100 text-blue-600' : (log.type === 'STOCK_ENTRY' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}`}>
                                        {log.type === 'SALE' ? <ShoppingBag size={12}/> : <Package size={12}/>}
                                    </div>
                                    <div>
                                        <p className="text-slate-800 dark:text-white font-bold">
                                            {log.user} <span className="font-normal text-slate-500 dark:text-slate-400 text-xs">· {new Date(log.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-tight">{log.detail}</p>
                                    </div>
                                </div>
                            ))}
                            {analytics.activityLog.length === 0 && <p className="text-slate-400 text-xs italic">Nenhuma atividade recente.</p>}
                        </div>
                    </div>
                </div>

                {/* Tabela */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden md:block">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700 text-[10px] font-bold text-slate-400 uppercase">
                            <tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Cargo</th><th className="px-6 py-4 text-center">Vende?</th><th className="px-6 py-4 text-center">Estoque?</th><th className="px-6 py-4 text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700 text-sm">
                            {team.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                    <td className="px-6 py-4"><p className="font-bold text-slate-700 dark:text-slate-200">{member.name}</p><p className="text-xs text-slate-400">{member.email}</p></td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${member.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700 dark:text-blue-400'}`}>{member.role === 'MANAGER' ? 'GESTOR' : 'VENDEDOR'}</span></td>
                                    <td className="px-6 py-4 text-center">{member.canSell ? <CheckCircle size={16} className="text-emerald-500 mx-auto"/> : <XCircle size={16} className="text-slate-300 dark:text-slate-500 mx-auto"/>}</td>
                                    <td className="px-6 py-4 text-center">{member.canManageProducts ? <CheckCircle size={16} className="text-emerald-500 mx-auto"/> : <XCircle size={16} className="text-slate-300 dark:text-slate-500 mx-auto"/>}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleResetPassword(member.id, member.name)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition" title="Redefinir Senha"><Lock size={16}/></button>
                                            <button onClick={() => openEditModal(member)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(member.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                        {team.map((member) => (
                            <div key={member.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200">{member.name}</p>
                                        <p className="text-xs text-slate-400">{member.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${member.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700 dark:text-blue-400'}`}>{member.role === 'MANAGER' ? 'GESTOR' : 'VENDEDOR'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">{member.canSell ? <CheckCircle size={12} className="text-emerald-500"/> : <XCircle size={12} className="text-slate-300 dark:text-slate-500"/>} Vende</span>
                                        <span className="flex items-center gap-1">{member.canManageProducts ? <CheckCircle size={12} className="text-emerald-500"/> : <XCircle size={12} className="text-slate-300 dark:text-slate-500"/>} Estoque</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleResetPassword(member.id, member.name)} className="p-2 text-slate-400 hover:text-amber-600 rounded-lg"><Lock size={14}/></button>
                                        <button onClick={() => openEditModal(member)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg"><Edit size={14}/></button>
                                        <button onClick={() => handleDelete(member.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        {/* --- MODAL FORM --- */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">{isEditMode ? 'Editar Permissões' : (form.role === 'MANAGER' ? 'Novo Gestor' : 'Novo Vendedor')}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition"><X size={20} className="text-slate-400"/></button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        {!isEditMode && (
                            <>
                                <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">NOME</label><input className="w-full p-3 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-slate-400" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required/></div>
                                <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">EMAIL</label><input type="email" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-slate-400" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/></div>
                                <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">SENHA</label><input type="password" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-slate-400" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required/></div>
                            </>
                        )}
                        {isEditMode && <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl mb-4"><p className="font-bold text-slate-700 dark:text-slate-200">{form.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{form.email}</p></div>}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">CARGO</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setForm({...form, role: 'SELLER', canManageProducts: false})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${form.role === 'SELLER' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}>Vendedor</button>
                                <button type="button" onClick={() => setForm({...form, role: 'MANAGER', canSell: true, canManageProducts: true})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${form.role === 'MANAGER' ? 'bg-purple-50 dark:bg-violet-900/30 border-purple-500 text-purple-600' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'}`}>Gestor</button>
                            </div>
                        </div>
                        {form.role === 'SELLER' && (
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.canSell} onChange={e=>setForm({...form, canSell: e.target.checked})} className="w-5 h-5 accent-blue-600"/><span className="text-sm text-slate-700 dark:text-slate-200">Pode realizar vendas</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.canManageProducts} onChange={e=>setForm({...form, canManageProducts: e.target.checked})} className="w-5 h-5 accent-blue-600"/><span className="text-sm text-slate-700 dark:text-slate-200">Pode mexer no estoque</span></label>
                            </div>
                        )}
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl">Cancelar</button>
                            <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-slate-900 dark:bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">{isLoading ? 'Salvando...' : 'Salvar'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL RESET PASSWORD CONFIRM --- */}
        {isPasswordModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Redefinir Senha</h2>
                        <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition"><X size={20} className="text-slate-400"/></button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{passwordModalUserName}</p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">NOVA SENHA</label>
                            <div className="relative">
                                <input
                                    type={showMainPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 pr-11 dark:text-white dark:placeholder-slate-400"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowMainPassword(!showMainPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showMainPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">CONFIRMAR SENHA</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 pr-11 dark:text-white dark:placeholder-slate-400"
                                    placeholder="Confirme a senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-6">
                        <button onClick={() => setIsPasswordModalOpen(false)} disabled={isChangingPassword} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl disabled:opacity-50">Cancelar</button>
                        <button onClick={handleChangePassword} disabled={isChangingPassword} className="flex-1 py-3 bg-slate-900 dark:bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-500 disabled:opacity-50 shadow-lg">{isChangingPassword ? 'Alterando...' : 'Alterar Senha'}</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL CONFIRMAÇÃO DELETE --- */}
        {showDeleteConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-2 border-red-100 dark:border-red-800">
                    <button onClick={() => setShowDeleteConfirmModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><X size={20}/></button>
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">Deletar {deleteTargetName}?</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm text-center mb-8">Esta ação é irreversível. O funcionário não poderá mais acessar sua conta.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setShowDeleteConfirmModal(false)} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">Cancelar</button>
                        <button onClick={executeDelete} disabled={isLoading} className="bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50">{isLoading ? 'Removendo...' : 'Deletar'}</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL SUCESSO/ERRO --- */}
        {showSuccessModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center transform scale-100 transition-all">
                    {messageType === 'success' ? (
                        <>
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50 dark:ring-emerald-900/30">
                                <CheckCircle size={48} className="animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-black text-emerald-600 mb-2">Sucesso!</h3>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-red-50 dark:ring-red-900/30">
                                <AlertTriangle size={48} className="animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-red-600 mb-2">Erro</h3>
                        </>
                    )}
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{successMessage}</p>
                </div>
            </div>
        )}

    </Layout>
  );
};
