import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { Layout } from '../components/Layout';
import { Store, Shield, Save, CheckCircle, Trash2, AlertTriangle, X, Loader2, Check, CreditCard } from 'lucide-react';

export const Settings = ({ onNavigate, onLogout, user, storeName, setUser, toggleTheme, currentTheme }: any) => {
  const [activeTab, setActiveTab] = useState<'store' | 'security' | 'subscription'>('store');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Feedback
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Estados de Exclusão
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Dados
  const [storeData, setStoreData] = useState({ name: storeName || '' });
  const [securityData, setSecurityData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Validação de Senha (Igual ao Cadastro)
  const [passValidations, setPassValidations] = useState({
      length: false,
      upper: false,
      lower: false,
      number: false,
      special: false
  });

  useEffect(() => {
      setStoreData({ name: storeName || '' });
  }, [storeName]);

  // Monitora a senha para atualizar as validações em tempo real
  useEffect(() => {
      const pass = securityData.newPassword;
      setPassValidations({
          length: pass.length >= 8,
          upper: /[A-Z]/.test(pass),
          lower: /[a-z]/.test(pass),
          number: /[0-9]/.test(pass),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
      });
  }, [securityData.newPassword]);

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

  // --- 1. SALVAR LOJA ---
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const token = localStorage.getItem('stoq_token');
        const response = await fetch(`${API_URL}/stores/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: storeData.name })
        });

        if (response.ok) {
            const updatedStore = await response.json();
            localStorage.setItem('stoq_store_name', updatedStore.name);
            showSuccess("Nome da loja atualizado com sucesso!");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showError("Não foi possível atualizar o nome da loja. Tente novamente.");
        }
    } catch (error) {
        showError("Problema de conexão. Verifique sua internet e tente novamente.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- 2. SALVAR SEGURANÇA (Com Validação) ---
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();

    const allValid = Object.values(passValidations).every(Boolean);
    if (!allValid) {
        showError("Sua senha precisa atender a todos os requisitos listados.");
        return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
        showError("As senhas digitadas não conferem. Digite novamente.");
        return;
    }

    if (!securityData.currentPassword) {
        showError("Digite sua senha atual para confirmar a alteração.");
        return;
    }

    setIsLoading(true);
    try {
        const token = localStorage.getItem('stoq_token');
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ currentPassword: securityData.currentPassword, newPassword: securityData.newPassword })
        });

        if (response.ok) {
            showSuccess("Senha alterada com sucesso!");
            setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            const data = await response.json();
            showError(data.error || "Não foi possível alterar a senha. Verifique se a senha atual está correta.");
        }
    } catch (error) {
        showError("Problema de conexão. Verifique sua internet e tente novamente.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- 3. EXCLUIR CONTA ---
  const executeAccountDeletion = async () => {
      try {
          const token = localStorage.getItem('stoq_token');
          const response = await fetch(`${API_URL}/auth/me`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
              setShowDeleteTypeModal(false);
              showSuccess("Sua conta foi excluída. Sentiremos sua falta!");
              setTimeout(() => onLogout(), 2000);
          } else {
              showError("Erro ao excluir conta. Tente novamente.");
          }
      } catch (error) {
          showError("Erro de conexão.");
      }
  };

  // --- 4. CANCELAR ASSINATURA ---
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancelSubscription = async () => {
      setIsLoading(true);
      try {
          const token = localStorage.getItem('stoq_token');
          const storeId = localStorage.getItem('stoq_store_id');

          const response = await fetch(`${API_URL}/payments/cancel-subscription`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ storeId })
          });

          if (response.ok) {
              setShowCancelModal(false);
              showSuccess("Assinatura cancelada. Você terá acesso até o final do período pago.");
              // Atualiza user no estado
              setUser({ ...user, isSubscribed: false });
          } else {
              const data = await response.json();
              showError(data.error || "Erro ao cancelar assinatura.");
          }
      } catch (error) {
          showError("Erro de conexão.");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <Layout active="settings" onNavigate={onNavigate} onLogout={onLogout} user={user} storeName={storeName} setUser={setUser} toggleTheme={toggleTheme} currentTheme={currentTheme}>
            <div className="max-w-[1000px] mx-auto space-y-6 md:space-y-8">

                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">Configurações</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie os dados da sua loja e segurança.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* MENU LATERAL / HORIZONTAL TABS ON MOBILE */}
                    <div className="w-full md:w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden shrink-0">
                        <div className="p-2 flex md:flex-col gap-1 overflow-x-auto">
                            <button onClick={() => setActiveTab('store')} className={`flex-1 md:flex-none whitespace-nowrap flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'store' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                <Store size={18} /> <span className="hidden sm:inline">Dados da Loja</span><span className="sm:hidden">Loja</span>
                            </button>
                            <button onClick={() => setActiveTab('subscription')} className={`flex-1 md:flex-none whitespace-nowrap flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'subscription' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                <CreditCard size={18} /> Assinatura
                            </button>
                            <button onClick={() => setActiveTab('security')} className={`flex-1 md:flex-none whitespace-nowrap flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'security' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                <Shield size={18} /> Segurança
                            </button>
                        </div>
                    </div>

                    {/* CONTEÚDO PRINCIPAL */}
                    <div className="flex-1 w-full">

                        {/* ABA: LOJA */}
                        {activeTab === 'store' && (
                            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Store className="text-blue-500" size={20}/> Informações da Loja</h2>
                                <form onSubmit={handleSaveStore} className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Nome da Loja</label>
                                        <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-white outline-none focus:border-blue-500 transition dark:placeholder-slate-400"
                                            value={storeData.name}
                                            onChange={e => setStoreData({...storeData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center gap-2 transform active:scale-95 disabled:opacity-70">
                                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18}/>} Salvar Alterações
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ABA: ASSINATURA */}
                        {activeTab === 'subscription' && (
                            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><CreditCard className="text-blue-500" size={20}/> Seu Plano</h2>

                                <div className={`border rounded-xl p-6 mb-8 ${
                                  user?.isSubscribed
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200'
                                    : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200'
                                }`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                          user?.isSubscribed
                                            ? 'bg-emerald-100'
                                            : 'bg-blue-100'
                                        }`}>
                                            <CheckCircle className={user?.isSubscribed ? 'text-emerald-600' : 'text-blue-600'} size={24} />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold ${
                                              user?.isSubscribed
                                                ? 'text-emerald-900'
                                                : 'text-blue-900'
                                            }`}>
                                              {user?.isSubscribed ? 'Premium Ativo' : 'Período de Teste'}
                                            </h3>
                                            <p className={`text-sm ${
                                              user?.isSubscribed
                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                : 'text-blue-700 dark:text-blue-400'
                                            }`}>
                                              {user?.isSubscribed
                                                ? 'Seu acesso está ativo com todos os recursos'
                                                : 'Teste grátis com acesso completo'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`text-sm ${
                                      user?.isSubscribed
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-blue-700 dark:text-blue-400'
                                    }`}>
                                        {user?.isSubscribed
                                            ? "Sua assinatura está ativa e será renovada automaticamente em 30 dias por R$ 49,90. Você pode cancelar quando quiser."
                                            : "Você está em período de teste grátis. Após 30 dias, sua assinatura será renovada por R$ 49,90/mês, a menos que cancele."}
                                    </p>
                                </div>

                                {user?.isSubscribed && (
                                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h4 className="font-bold text-red-900 mb-1">Gerenciar Assinatura</h4>
                                            <p className="text-red-700 dark:text-red-400 text-sm max-w-md">Se desejar cancelar, você manterá acesso até o final do período pago. Sem multas ou taxas de cancelamento.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowCancelModal(true)}
                                            className="bg-white dark:bg-slate-800 border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shrink-0"
                                        >
                                            Cancelar Assinatura
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ABA: SEGURANÇA */}
                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Shield className="text-blue-500" size={20}/> Alterar Senha</h2>
                                    <form onSubmit={handleSaveSecurity} className="space-y-5 max-w-md">

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Senha Atual</label>
                                            <input type="password" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-white outline-none focus:border-blue-500 transition dark:placeholder-slate-400" required
                                                value={securityData.currentPassword}
                                                onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})}
                                                placeholder="Digite sua senha atual"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Nova Senha</label>
                                            <input type="password" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-white outline-none focus:border-blue-500 transition dark:placeholder-slate-400" required
                                                value={securityData.newPassword}
                                                onChange={e => setSecurityData({...securityData, newPassword: e.target.value})}
                                            />

                                            {/* REGRAS DE SENHA (Copiado do Cadastro) */}
                                            {securityData.newPassword && (
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                                    <div className={`flex items-center gap-1.5 ${passValidations.length ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.length ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-500"></div>} Mínimo 8 caracteres
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${passValidations.upper ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.upper ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-500"></div>} Maiúscula
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${passValidations.lower ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.lower ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-500"></div>} Minúscula
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${passValidations.number ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.number ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-500"></div>} Número
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${passValidations.special ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.special ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-500"></div>} Especial
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block">Confirmar Nova Senha</label>
                                            <input type="password" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-white outline-none focus:border-blue-500 transition dark:placeholder-slate-400" required
                                                value={securityData.confirmPassword}
                                                onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})}
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                disabled={isLoading || !Object.values(passValidations).every(Boolean) || securityData.newPassword !== securityData.confirmPassword}
                                                className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18}/>}
                                                Atualizar Senha
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* ZONA DE PERIGO */}
                                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-red-100 dark:border-red-800">
                                    <h2 className="text-lg font-black text-red-600 mb-6 flex items-center gap-2"><AlertTriangle size={20}/> Zona de Perigo</h2>
                                    <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h4 className="font-bold text-red-900 mb-1">Excluir sua conta e loja</h4>
                                            <p className="text-red-700 dark:text-red-400 text-sm max-w-md">Isso apagará permanentemente todos os dados.</p>
                                        </div>
                                        <button onClick={() => setShowDeleteConfirmModal(true)} className="bg-white dark:bg-slate-800 border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shrink-0">
                                            <Trash2 size={18} /> Excluir Conta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        {/* --- MODAIS DE CONFIRMAÇÃO --- */}
        {showDeleteConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-2 border-red-100 dark:border-red-800">
                    <button onClick={() => setShowDeleteConfirmModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><X size={20}/></button>
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">Tem certeza absoluta?</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm text-center mb-8">Essa ação é irreversível.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setShowDeleteConfirmModal(false)} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">Cancelar</button>
                        <button onClick={() => { setShowDeleteConfirmModal(false); setDeleteInput(''); setShowDeleteTypeModal(true); }} className="bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition">Sim, excluir</button>
                    </div>
                </div>
            </div>
        )}

        {showDeleteTypeModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setShowDeleteTypeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><X size={20}/></button>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 text-center">Confirmação Final</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">Digite <span className="font-bold text-red-600 select-all">DELETAR</span> abaixo.</p>
                    <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="DELETAR" className="w-full text-center tracking-widest font-bold border-2 border-slate-200 dark:border-slate-600 rounded-xl py-3 mb-6 focus:border-red-500 focus:outline-none uppercase bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" autoFocus />
                    <button onClick={executeAccountDeletion} disabled={deleteInput !== 'DELETAR'} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Trash2 size={18} /> Apagar conta
                    </button>
                </div>
            </div>
        )}
        {/* MODAL CANCELAR ASSINATURA */}
        {showCancelModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-2 border-orange-100">
                    <button onClick={() => setShowCancelModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><X size={20}/></button>
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 text-center">Cancelar Assinatura?</h3>
                    <p className="text-slate-600 dark:text-slate-300 font-medium text-sm text-center mb-3">Se cancelar agora, você manterá acesso até o final do período pago.</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs text-center mb-8">Sem penalidades ou taxas de cancelamento.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setShowCancelModal(false)} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-3.5 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-slate-600 transition border border-blue-200 dark:border-blue-800">Manter</button>
                        <button onClick={handleCancelSubscription} disabled={isLoading} className="bg-orange-600 text-white py-3.5 rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 className="animate-spin" size={18}/> : ''} Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}
        {/* MODAL SUCESSO/ERRO */}
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
