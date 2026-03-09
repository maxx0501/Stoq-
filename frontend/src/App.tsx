import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
// Ícones
import { Store, Building2, ArrowRight, AlertCircle, Shield, Lock, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

// Páginas
import { Sales } from './pages/Sales';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Team } from './pages/Team';
import { Stock } from './pages/Stock';
import { Reports } from './pages/Reports';
import { Customers } from './pages/Customers';
import { Settings } from './pages/Settings';
import { Subscription } from './pages/Subscription';
import { SuperAdmin } from './pages/SuperAdmin';
import { CashFlow } from './pages/CashFlow';
import { Expenses } from './pages/Expenses';
import { Legal } from './pages/Legal';

export default function App() {
  const [view, setView] = useState<'home' | 'login' | 'signup' | 'forgot-password' | 'setup-store' | 'dashboard' | 'products' | 'sales' | 'customers' | 'team' | 'stock' | 'reports' | 'settings' | 'subscription' | 'admin' | 'cashflow' | 'expenses' | 'terms' | 'privacy' | 'lgpd'>('home'); 

  const [previousView, setPreviousView] = useState<string>('home');
  const [user, setUser] = useState<any>(null);
  const [activeStoreName, setActiveStoreName] = useState('');

  // Estados para Login/Cadastro
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  
  // Estados para Criação da Loja
  const [newStoreName, setNewStoreName] = useState('');
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  // Tema
  const [theme, setTheme] = useState(() => localStorage.getItem('stoq_theme') === 'dark' ? 'dark' : 'light');

  // Estado para Forçar Senha
  const [forcePasswordLoading, setForcePasswordLoading] = useState(false);
  const [forceNewPass, setForceNewPass] = useState('');
  const [forceConfirmPass, setForceConfirmPass] = useState('');
  const [showForcePassword, setShowForcePassword] = useState(false);
  const [showForceConfirmPassword, setShowForceConfirmPassword] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stoq_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stoq_theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- CHECK DE LOGIN E ROTAS AO CARREGAR ---
  useEffect(() => {
    // 0. CAPTURA TOKEN DO GOOGLE
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get('google_token');
    const userName = params.get('user_name');

    // 0.5. CAPTURA RESET PASSWORD TOKEN
    const resetToken = params.get('token'); // Captura 'token' que vem do email
    const path = window.location.pathname;
    if (path === '/reset-password' && resetToken) {
        // Mantém o token na URL mas limpa o path
        window.history.replaceState({}, '', `/?token=${resetToken}`);
        setView('login');
        return;
    }

    if (googleToken) {
        window.history.replaceState({}, '', '/');
        localStorage.setItem('stoq_token', googleToken);
        if (userName) localStorage.setItem('stoq_user_name', userName);

        fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${googleToken}` }
        })
        .then(res => {
            if (!res.ok) throw new Error(`Auth error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.user) {
                localStorage.setItem('stoq_user_role', data.user.role);
                localStorage.setItem('stoq_store_plan', data.user.plan || 'FREE');
                
                setUser(data.user);

                if (data.store) {
                    localStorage.setItem('stoq_store_id', data.store.id);
                    localStorage.setItem('stoq_store_name', data.store.name);
                    setActiveStoreName(data.store.name);
                    setView('dashboard'); 
                } else {
                    localStorage.removeItem('stoq_store_id');
                    setView('setup-store');
                }
            }
        })
        .catch(err => {
            console.error("Erro token:", err);
            localStorage.clear();
        });
        return; 
    }

    if (path === '/terms') { setView('terms'); return; }
    if (path === '/privacy') { setView('privacy'); return; }
    if (path === '/lgpd') { setView('lgpd'); return; }

    const token = localStorage.getItem('stoq_token');
    
    if (token) {
        // Fetch /me para pegar o status atualizado do mustChangePassword
        fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error(`Auth error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.user) {
                // Restaura avatar do localStorage se existir, senão usa do servidor
                const savedAvatar = localStorage.getItem('stoq_user_avatar');
                const userWithAvatar = {
                    ...data.user,
                    avatarUrl: data.user.avatarUrl || savedAvatar || ''
                };
                
                // Salva avatar no localStorage para persistir entre navegações
                if (data.user.avatarUrl) {
                    localStorage.setItem('stoq_user_avatar', data.user.avatarUrl);
                }
                
                setUser(userWithAvatar);
                
                if (data.store) {
                    setActiveStoreName(data.store.name);
                    if (view === 'home' || view === 'login' || view === 'signup') {
                        setView('dashboard');
                    }
                } else {
                    setView('setup-store');
                }
            }
        })
        .catch(() => localStorage.clear());
    }
  }, []);

  const checkSubscriptionStatus = () => {
    if (!user || user.role === 'SELLER') return true; 
    if (user.plan === 'PRO') return true;
    
    // 🔑 Verificação principal: isSubscribed
    // Se isSubscribed for false, o usuário DEVE assinar (mesmo que seja o plano grátis)
    if (user.isSubscribed === false) {
      return false;
    }
    
    // Backwards compatibility: se isSubscribed for true, verifica expiração
    if (user.isSubscribed === true) {
      return true;
    }
    
    // Fallback para usuários antigos (sem isSubscribed no banco)
    const createdDate = new Date(user.storeCreatedAt || Date.now());
    const trialDays = 30; 
    const expirationDate = new Date(createdDate);
    expirationDate.setDate(createdDate.getDate() + trialDays);
    return new Date() <= expirationDate; 
  };

  const handleOpenLegal = (page: 'terms' | 'privacy' | 'lgpd') => {
      setPreviousView(view); 
      setView(page);
  };

  const handleBackFromLegal = () => {
      setView(previousView as any); 
      if (previousView === 'home') window.history.pushState({}, '', '/');
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authData.email, password: authData.password })
      });

      // Lê a resposta UMA VEZ como texto
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(responseText || 'Erro ao fazer login');
      }

      if (!response.ok) throw new Error(data.error || "Erro ao fazer login");

      localStorage.setItem('stoq_token', data.token);
      localStorage.setItem('stoq_user_name', data.user.name);
      
      setUser(data.user); // O user já vem com mustChangePassword

      if (data.storeId) {
          localStorage.setItem('stoq_store_id', data.storeId); 
          const storeName = data.storeName || localStorage.getItem('stoq_store_name') || 'Minha Loja';
          setActiveStoreName(storeName);
          setView('dashboard');
      } else {
          setView('setup-store');
      }

    } catch (error: any) {
      alert(error.message); 
      throw error;
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setIsStoreLoading(true);
    setStoreError(null);

    try {
        const token = localStorage.getItem('stoq_token');
        const res = await fetch(`${API_URL}/stores`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newStoreName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.token) localStorage.setItem('stoq_token', data.token);
        const storeData = data.store || data; 
        
        if (storeData) {
            localStorage.setItem('stoq_store_id', storeData.id);
            localStorage.setItem('stoq_store_name', storeData.name);
            setActiveStoreName(storeData.name);
            setUser((prev: any) => ({ ...prev, role: 'OWNER', plan: 'FREE' }));
        }
        setView('dashboard');
    } catch (err: any) { setStoreError(err.message); } 
    finally { setIsStoreLoading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setActiveStoreName('');
    setView('home');
    window.history.pushState({}, '', '/');
  };

  const handleForcePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();
      if (forceNewPass.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
      if (forceNewPass !== forceConfirmPass) return alert("As senhas não coincidem.");

      setForcePasswordLoading(true);
      try {
          const token = localStorage.getItem('stoq_token');
          const res = await fetch(`${API_URL}/auth/force-change-password`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ newPassword: forceNewPass })
          });

          if (res.ok) {
              alert("Senha atualizada com sucesso! Bem-vindo.");
              setForceNewPass('');
              setForceConfirmPass('');
              // Atualiza o estado local para liberar o acesso
              setUser((prev: any) => ({ ...prev, mustChangePassword: false }));
          } else {
              const errorData = await res.json();
              alert("Erro ao atualizar senha: " + (errorData.error || "Tente novamente."));
          }
      } catch (error) {
          console.error('Erro de conexão:', error);
          alert("Erro de conexão ao atualizar senha.");
      } finally {
          setForcePasswordLoading(false);
      }
  };

  // --- RENDERIZAÇÃO ---
  const renderContent = () => {
      // 0. BLOQUEIO DE TROCA DE SENHA OBRIGATÓRIA
      if (user && user.mustChangePassword) {
          return (
              <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-6 font-sans">
                  <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center animate-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Shield size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Segurança em Primeiro Lugar</h2>
                      <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                          Como este é seu primeiro acesso, você precisa definir uma nova senha pessoal e segura.
                      </p>
                      
                      <form onSubmit={handleForcePasswordChange} className="space-y-4 text-left">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Nova Senha</label>
                              <div className="relative">
                                  <Lock className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                  <input 
                                      type={showForcePassword ? "text" : "password"} 
                                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 transition font-bold text-slate-700"
                                      placeholder="Mínimo 6 caracteres"
                                      value={forceNewPass}
                                      onChange={e => setForceNewPass(e.target.value)}
                                  />
                                  <button type="button" onClick={() => setShowForcePassword(!showForcePassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition">{showForcePassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Confirmar Senha</label>
                              <div className="relative">
                                  <CheckCircle className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                                  <input 
                                      type={showForceConfirmPassword ? "text" : "password"} 
                                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 transition font-bold text-slate-700"
                                      placeholder="Repita a senha"
                                      value={forceConfirmPass}
                                      onChange={e => setForceConfirmPass(e.target.value)}
                                  />
                                  <button type="button" onClick={() => setShowForceConfirmPassword(!showForceConfirmPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition">{showForceConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                              </div>
                          </div>
                          <button 
                              disabled={forcePasswordLoading} 
                              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                          >
                              {forcePasswordLoading ? <Loader2 className="animate-spin"/> : "Definir Senha e Entrar"}
                          </button>
                      </form>
                      <button onClick={handleLogout} className="mt-6 text-xs font-bold text-slate-400 hover:text-red-500 transition">
                          Sair da conta
                      </button>
                  </div>
              </div>
          );
      }

      if (view === 'terms') return <Legal type="terms" onBack={handleBackFromLegal} />;
      if (view === 'privacy') return <Legal type="privacy" onBack={handleBackFromLegal} />;
      if (view === 'lgpd') return <Legal type="lgpd" onBack={handleBackFromLegal} />;

      if (view === 'setup-store') {
          return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FC] p-6 font-sans">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Building2 size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Bem-vindo, {user?.name}!</h2>
                <p className="text-slate-500 mb-8 text-sm leading-relaxed">Para começar, precisamos criar a identidade do seu negócio no sistema.</p>
                {storeError && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 mb-6 text-left border border-red-100 animate-in shake"><AlertCircle size={18} className="shrink-0"/>{storeError}</div>}
                <form onSubmit={handleCreateStore} className="text-left space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nome da Empresa / Loja</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition"><Store size={18} /></div>
                            <input type="text" className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition font-bold text-slate-800 placeholder:text-slate-300 text-lg" placeholder="Ex: Alpha Comércio" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} autoFocus />
                        </div>
                    </div>
                    <button disabled={isStoreLoading || !newStoreName.trim()} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4">
                        {isStoreLoading ? <Loader2 className="animate-spin"/> : <>Finalizar Configuração <ArrowRight size={20}/></>}
                    </button>
                </form>
              </div>
            </div>
        );
      }

      if (view === 'login' || view === 'signup' || view === 'forgot-password') {
          return <Auth mode={view} setView={setView} formData={authData} setFormData={setAuthData} onLoginSubmit={handleLogin} onOpenLegal={handleOpenLegal} setUser={setUser} />;
      }

      const isAllowed = checkSubscriptionStatus();
      if (!isAllowed && view !== 'subscription' && view !== 'settings') return <Subscription {...{ user, storeName: activeStoreName, onLogout: handleLogout, onNavigate: setView, setUser, toggleTheme, currentTheme: theme }} isLocked={true} />;

      const commonProps = { user, storeName: activeStoreName, onLogout: handleLogout, onNavigate: setView, setUser, toggleTheme, currentTheme: theme };

      if (view === 'dashboard') return <Dashboard {...commonProps} />;
      if (view === 'products') return <Products {...commonProps} />;
      if (view === 'stock') return <Stock {...commonProps} />;
      if (view === 'sales') return <Sales {...commonProps} />;
      if (view === 'customers') return <Customers {...commonProps} />;
      if (view === 'reports') return <Reports {...commonProps} />;
      if (view === 'team') return <Team {...commonProps} />;
      if (view === 'settings') return <Settings {...commonProps} />;
      if (view === 'subscription') return <Subscription {...commonProps} />;
      if (view === 'admin') return <SuperAdmin {...commonProps} />;
      if (view === 'cashflow') return <CashFlow {...commonProps} />;
      if (view === 'expenses') return <Expenses {...commonProps} />;
      
      return <Home onLogin={() => setView('login')} onSignup={() => setView('signup')} onNavigate={(page: any) => { if (['terms', 'privacy', 'lgpd'].includes(page)) { handleOpenLegal(page); } else { setView(page); } }} />;
  };

  return renderContent();
}
