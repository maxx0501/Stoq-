import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Store, Shield, Save, CheckCircle, Trash2, AlertTriangle, X, Loader2, Check } from 'lucide-react';

export const Settings = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [activeTab, setActiveTab] = useState<'store' | 'security'>('store');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Feedback
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados de Exclusão
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Dados
  const [storeData, setStoreData] = useState({ name: storeName || '' });
  const [securityData, setSecurityData] = useState({ newPassword: '', confirmPassword: '' });

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
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  // --- 1. SALVAR LOJA ---
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const token = localStorage.getItem('stoq_token');
        const response = await fetch('http://localhost:3333/stores/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: storeData.name })
        });

        if (response.ok) {
            const updatedStore = await response.json();
            localStorage.setItem('stoq_store_name', updatedStore.name);
            window.location.reload(); 
            showSuccess("Nome da loja atualizado!");
        } else {
            alert("Erro ao atualizar loja.");
        }
    } catch (error) {
        alert("Erro de conexão.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- 2. SALVAR SEGURANÇA (Com Validação) ---
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verifica se todas as regras foram cumpridas
    const allValid = Object.values(passValidations).every(Boolean);
    if (!allValid) {
        alert("A senha precisa atender a todos os requisitos.");
        return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
        alert("As senhas não coincidem.");
        return;
    }

    setIsLoading(true);
    try {
        const token = localStorage.getItem('stoq_token');
        const response = await fetch('http://localhost:3333/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ newPassword: securityData.newPassword })
        });

        if (response.ok) {
            showSuccess("Senha alterada com sucesso!");
            setSecurityData({ newPassword: '', confirmPassword: '' });
        } else {
            const data = await response.json();
            alert(data.error || "Erro ao alterar senha.");
        }
    } catch (error) {
        alert("Erro de conexão.");
    } finally {
        setIsLoading(false);
    }
  };

  // --- 3. EXCLUIR CONTA ---
  const executeAccountDeletion = async () => {
      try {
          const token = localStorage.getItem('stoq_token');
          const response = await fetch('http://localhost:3333/auth/me', {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
              setShowDeleteTypeModal(false);
              alert("Sua conta foi excluída. Sentiremos sua falta!");
              onLogout(); 
          } else {
              alert("Erro ao excluir conta. Tente novamente.");
          }
      } catch (error) {
          alert("Erro de conexão.");
      }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="settings" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1000px] mx-auto space-y-8">
                
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Configurações</h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie os dados da sua loja e segurança.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    
                    {/* MENU LATERAL */}
                    <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shrink-0">
                        <div className="p-2 space-y-1">
                            <button onClick={() => setActiveTab('store')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'store' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <Store size={18} /> Dados da Loja
                            </button>
                            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'security' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <Shield size={18} /> Segurança
                            </button>
                        </div>
                    </div>

                    {/* CONTEÚDO PRINCIPAL */}
                    <div className="flex-1 w-full">
                        
                        {/* ABA: LOJA */}
                        {activeTab === 'store' && (
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Store className="text-blue-500" size={20}/> Informações da Loja</h2>
                                <form onSubmit={handleSaveStore} className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Nome da Loja</label>
                                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-500 transition" 
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

                        {/* ABA: SEGURANÇA */}
                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                    <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Shield className="text-blue-500" size={20}/> Alterar Senha</h2>
                                    <form onSubmit={handleSaveSecurity} className="space-y-5 max-w-md">
                                        
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Nova Senha</label>
                                            <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-500 transition" required 
                                                value={securityData.newPassword} 
                                                onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} 
                                            />
                                            
                                            {/* REGRAS DE SENHA (Copiado do Cadastro) */}
                                            {securityData.newPassword && (
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className={`flex items-center gap-1.5 ${passValidations.length ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.length ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Mínimo 8 caracteres
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${passValidations.upper ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.upper ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Maiúscula
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${passValidations.lower ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.lower ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Minúscula
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${passValidations.number ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.number ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Número
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${passValidations.special ? 'text-emerald-600' : ''}`}>
                                                        {passValidations.special ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Especial
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Confirmar Nova Senha</label>
                                            <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-500 transition" required 
                                                value={securityData.confirmPassword} 
                                                onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} 
                                            />
                                        </div>
                                        
                                        <div className="pt-4">
                                            <button 
                                                disabled={isLoading || !Object.values(passValidations).every(Boolean) || securityData.newPassword !== securityData.confirmPassword} 
                                                className="bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18}/>}
                                                Atualizar Senha
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* ZONA DE PERIGO */}
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100">
                                    <h2 className="text-lg font-black text-red-600 mb-6 flex items-center gap-2"><AlertTriangle size={20}/> Zona de Perigo</h2>
                                    <div className="bg-red-50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div>
                                            <h4 className="font-bold text-red-900 mb-1">Excluir sua conta e loja</h4>
                                            <p className="text-red-700 text-sm max-w-md">Isso apagará permanentemente todos os dados.</p>
                                        </div>
                                        <button onClick={() => setShowDeleteConfirmModal(true)} className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shrink-0">
                                            <Trash2 size={18} /> Excluir Conta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- MODAIS DE CONFIRMAÇÃO --- */}
        {showDeleteConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-2 border-red-100">
                    <button onClick={() => setShowDeleteConfirmModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">Tem certeza absoluta?</h3>
                    <p className="text-slate-500 font-medium text-sm text-center mb-8">Essa ação é irreversível.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setShowDeleteConfirmModal(false)} className="bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition">Cancelar</button>
                        <button onClick={() => { setShowDeleteConfirmModal(false); setDeleteInput(''); setShowDeleteTypeModal(true); }} className="bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition">Sim, excluir</button>
                    </div>
                </div>
            </div>
        )}

        {showDeleteTypeModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setShowDeleteTypeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
                    <h3 className="text-xl font-black text-slate-800 mb-4 text-center">Confirmação Final</h3>
                    <p className="text-slate-500 text-sm text-center mb-6">Digite <span className="font-bold text-red-600 select-all">DELETAR</span> abaixo.</p>
                    <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="DELETAR" className="w-full text-center tracking-widest font-bold border-2 border-slate-200 rounded-xl py-3 mb-6 focus:border-red-500 focus:outline-none uppercase" autoFocus />
                    <button onClick={executeAccountDeletion} disabled={deleteInput !== 'DELETAR'} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Trash2 size={18} /> Apagar conta
                    </button>
                </div>
            </div>
        )}

        {/* MODAL SUCESSO */}
        {showSuccessModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center transform scale-100 transition-all">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50"><CheckCircle size={48} className="animate-bounce" /></div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Sucesso!</h3>
                    <p className="text-slate-500 font-medium text-sm">{successMessage}</p>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};