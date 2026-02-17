import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Store, Shield, Bell, Save, CreditCard, CheckCircle, Printer, Zap, Trash2, AlertTriangle, X } from 'lucide-react';

export const Settings = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [activeTab, setActiveTab] = useState<'store' | 'security' | 'preferences'>('store');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Feedback (Modal Sucesso)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados de Exclusão (Modais de Perigo)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); // Passo 1
  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);       // Passo 2
  const [deleteInput, setDeleteInput] = useState('');                          // O que o usuário digitou

  const [storeData, setStoreData] = useState({ name: storeName, phone: '', address: '' });
  const [securityData, setSecurityData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Função auxiliar para mostrar sucesso
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        showSuccess("Dados da loja atualizados!");
    }, 800);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
        alert("As senhas não coincidem."); // Pode melhorar isso depois também se quiser
        return; 
    }
    showSuccess("Senha alterada com sucesso!");
    setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // --- FUNÇÃO FINAL QUE CHAMA A API ---
  const executeAccountDeletion = async () => {
      try {
          const token = localStorage.getItem('stoq_token');
          const response = await fetch('http://localhost:3333/auth/me', {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (response.ok) {
              setShowDeleteTypeModal(false); // Fecha modal
              alert("Sua conta foi excluída. Sentiremos sua falta!");
              onLogout(); // Desloga
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
                
                {/* Cabeçalho */}
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Configurações</h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie os dados da sua loja e preferências.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    
                    {/* MENU LATERAL */}
                    <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shrink-0">
                        <div className="p-2 space-y-1">
                            <button onClick={() => setActiveTab('store')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'store' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <Store size={18} /> Dados da Loja
                            </button>
                            <button onClick={() => setActiveTab('preferences')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'preferences' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <Bell size={18} /> Preferências
                            </button>
                            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${activeTab === 'security' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <Shield size={18} /> Segurança
                            </button>
                        </div>
                        
                        {/* CARD DE PLANO NA SIDEBAR */}
                        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <CreditCard size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seu Plano</p>
                                    <p className="text-sm font-black text-slate-800">
                                        {user?.plan === 'PRO' ? 'Stoq+ PRO' : 'Stoq+ Free'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onNavigate('subscription')} 
                                className="w-full py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                <Zap size={14} className="fill-yellow-400 text-yellow-400" /> 
                                {user?.plan === 'PRO' ? 'Gerenciar Assinatura' : 'Fazer Upgrade'}
                            </button>
                        </div>
                    </div>

                    {/* CONTEÚDO PRINCIPAL */}
                    <div className="flex-1 w-full">
                        
                        {/* ABA: DADOS DA LOJA */}
                        {activeTab === 'store' && (
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Store className="text-blue-500" size={20}/> Informações Públicas</h2>
                                <form onSubmit={handleSaveStore} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Nome da Loja</label>
                                            <input className="input-padrao" value={storeData.name} onChange={e => setStoreData({...storeData, name: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Telefone / WhatsApp</label>
                                            <input className="input-padrao" placeholder="(11) 99999-9999" value={storeData.phone} onChange={e => setStoreData({...storeData, phone: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Endereço Completo</label>
                                        <input className="input-padrao" placeholder="Rua, Número, Bairro - Cidade/UF" value={storeData.address} onChange={e => setStoreData({...storeData, address: e.target.value})} />
                                    </div>
                                    
                                    <div className="pt-4 flex justify-end">
                                        <button disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center gap-2 transform active:scale-95">
                                            {isLoading ? 'Salvando...' : <><Save size={18}/> Salvar Alterações</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ABA: PREFERÊNCIAS */}
                        {activeTab === 'preferences' && (
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Bell className="text-blue-500" size={20}/> Sistema e Impressão</h2>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition hover:shadow-md cursor-default group">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200 transition">
                                            <Printer size={22} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">Impressão de Recibos</p>
                                            <p className="text-xs text-slate-500">Configuração de impressoras térmicas (Em breve).</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded">Desativado</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button onClick={() => showSuccess("Preferências salvas!")} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg transform active:scale-95">
                                            Salvar Preferências
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ABA: SEGURANÇA (COM ZONA DE PERIGO) */}
                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                
                                {/* Alterar Senha */}
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                    <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Shield className="text-blue-500" size={20}/> Login e Senha</h2>
                                    <form onSubmit={handleSaveSecurity} className="space-y-5 max-w-md">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Nova Senha</label>
                                            <input type="password" className="input-padrao" required 
                                                value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Confirmar Nova Senha</label>
                                            <input type="password" className="input-padrao" required 
                                                value={securityData.confirmPassword} onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} />
                                        </div>
                                        
                                        <div className="pt-4">
                                            <button className="bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition flex items-center gap-2 transform active:scale-95">
                                                <Shield size={18}/> Atualizar Senha
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
                                            <p className="text-red-700 text-sm max-w-md">
                                                Isso irá apagar permanentemente seus dados, histórico de vendas e acesso ao sistema. Essa ação não pode ser desfeita.
                                            </p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setShowDeleteConfirmModal(true)} // ABRE MODAL 1
                                            className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shrink-0"
                                        >
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

        {/* --- MODAL 1: CONFIRMAÇÃO --- */}
        {showDeleteConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-2 border-red-100">
                    <button onClick={() => setShowDeleteConfirmModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
                    
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">Tem certeza absoluta?</h3>
                    <p className="text-slate-500 font-medium text-sm text-center mb-8">
                        Essa ação é irreversível. Todos os seus dados, produtos, vendas e clientes serão apagados permanentemente do nosso banco de dados.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setShowDeleteConfirmModal(false)} className="bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition">
                            Cancelar
                        </button>
                        <button 
                            onClick={() => {
                                setShowDeleteConfirmModal(false);
                                setDeleteInput(''); // Limpa input
                                setShowDeleteTypeModal(true); // Abre Modal 2
                            }} 
                            className="bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition"
                        >
                            Sim, quero excluir
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL 2: DIGITE 'DELETAR' --- */}
        {showDeleteTypeModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setShowDeleteTypeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"><X size={20}/></button>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-4 text-center">Confirmação Final</h3>
                    <p className="text-slate-500 text-sm text-center mb-6">
                        Para confirmar, digite <span className="font-bold text-red-600 select-all">DELETAR</span> no campo abaixo.
                    </p>

                    <input 
                        type="text" 
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder="DELETAR"
                        className="w-full text-center tracking-widest font-bold border-2 border-slate-200 rounded-xl py-3 mb-6 focus:border-red-500 focus:outline-none uppercase"
                        autoFocus
                    />

                    <button 
                        onClick={executeAccountDeletion}
                        disabled={deleteInput !== 'DELETAR'}
                        className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} /> Apagar minha conta agora
                    </button>
                </div>
            </div>
        )}

        {/* --- MODAL DE SUCESSO (JÁ EXISTENTE) --- */}
        {showSuccessModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center transform scale-100 transition-all">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50">
                        <CheckCircle size={48} className="animate-bounce drop-shadow-sm" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Sucesso!</h3>
                    <p className="text-slate-500 font-medium text-sm">{successMessage}</p>
                </div>
            </div>
        )}

        <style>{`
            .input-padrao {
                width: 100%;
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 0.75rem;
                padding: 0.75rem 1rem;
                outline: none;
                transition: all 0.2s;
                font-weight: 600;
                color: #334155;
            }
            .input-padrao:focus {
                border-color: #3b82f6;
                background-color: #fff;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            }
        `}</style>
      </main>
    </div>
  );
};