import { useState, useEffect } from 'react';
// Ícones
import { Store, Building2, ArrowRight, AlertCircle } from 'lucide-react';

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
// Importe a página Legal que criamos
import { Legal } from './pages/Legal';

export default function App() {
  // Adicionei os tipos 'terms', 'privacy' e 'lgpd' aqui no estado
  const [view, setView] = useState<'home' | 'login' | 'signup' | 'setup-store' | 'dashboard' | 'products' | 'sales' | 'customers' | 'team' | 'stock' | 'reports' | 'settings' | 'subscription' | 'admin' | 'cashflow' | 'expenses' | 'terms' | 'privacy' | 'lgpd'>('home'); 

  // NOVO ESTADO: Guarda de onde o usuário veio (home, login ou signup)
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
    // 1. VERIFICA SE O USUÁRIO ENTROU DIRETO EM UMA PÁGINA LEGAL (/terms, /privacy)
    const path = window.location.pathname;
    if (path === '/terms') { setView('terms'); return; }
    if (path === '/privacy') { setView('privacy'); return; }
    if (path === '/lgpd') { setView('lgpd'); return; }

    // 2. Se não for rota legal, verifica token normal
    const token = localStorage.getItem('stoq_token');
    
    if (token) {
        const savedUserName = localStorage.getItem('stoq_user_name');
        const savedUserRole = localStorage.getItem('stoq_user_role');
        const savedStoreName = localStorage.getItem('stoq_store_name');
        const savedAvatar = localStorage.getItem('stoq_user_avatar');
        const savedPlan = localStorage.getItem('stoq_store_plan');
        const savedStoreCreatedAt = localStorage.getItem('stoq_store_created_at');
        
        if (savedUserName) {
            setUser({ 
                name: savedUserName, 
                role: savedUserRole || 'USER',
                avatarUrl: savedAvatar || '',
                plan: savedPlan || 'FREE',
                storeCreatedAt: savedStoreCreatedAt 
            });
        }

        if (!savedStoreName || savedStoreName === 'undefined') {
            setView('setup-store');
        } else {
            setActiveStoreName(savedStoreName);
            // Se estava na home/login, joga pro dashboard.
            if (view === 'home' || view === 'login' || view === 'signup') {
                setView('dashboard');
            }
        }
    }
  }, []); // Array vazio = roda só uma vez ao abrir o site

  // --- LÓGICA DE BLOQUEIO / TESTE GRÁTIS ---
  const checkSubscriptionStatus = () => {
    if (!user || user.role === 'SELLER') return true; 
    if (user.plan === 'PRO') return true; 

    const createdDate = new Date(user.storeCreatedAt || Date.now());
    const trialDays = 30; 
    const expirationDate = new Date(createdDate);
    expirationDate.setDate(createdDate.getDate() + trialDays);
    
    const now = new Date();
    
    if (now > expirationDate) {
        return false;
    }
    return true; 
  };

  // --- FUNÇÕES DE NAVEGAÇÃO LEGAL ---
  const handleOpenLegal = (page: 'terms' | 'privacy' | 'lgpd') => {
      setPreviousView(view); // Salva onde estou agora
      setView(page);         // Vai para a página legal
  };

  const handleBackFromLegal = () => {
      setView(previousView as any); // Volta para onde estava
      // Se estava na home, limpa a URL. Se estava no login, mantém.
      if (previousView === 'home') {
          window.history.pushState({}, '', '/');
      }
  };

  // --- FUNÇÕES DE LOGIN/LOGOUT ---
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3333/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authData.email, password: authData.password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      localStorage.setItem('stoq_token', data.token);
      localStorage.setItem('stoq_user_name', data.user.name);
      localStorage.setItem('stoq_user_role', data.user.role);
      localStorage.setItem('stoq_store_plan', data.user.plan || 'FREE');
      
      if (data.user.storeCreatedAt) {
          localStorage.setItem('stoq_store_created_at', data.user.storeCreatedAt);
      }
      
      setUser({
          ...data.user,
          storeCreatedAt: data.user.storeCreatedAt 
      });

      if (data.storeId) {
          localStorage.setItem('stoq_store_id', data.storeId); 
          const storeName = data.storeName || localStorage.getItem('stoq_store_name') || 'Minha Loja';
          setActiveStoreName(storeName);
          localStorage.setItem('stoq_store_name', storeName);
          setView('dashboard');
      } else {
          localStorage.removeItem('stoq_store_id');
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
        if (!token) {
            setStoreError("Sessão expirada. Faça login novamente.");
            setIsStoreLoading(false);
            return;
        }

        const res = await fetch('http://localhost:3333/stores', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newStoreName })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Erro ao criar loja.");
        }

        if (data.token) {
            localStorage.setItem('stoq_token', data.token);
        }

        const storeData = data.store || data; 
        
        if (storeData) {
            localStorage.setItem('stoq_store_id', storeData.id);
            localStorage.setItem('stoq_store_name', storeData.name);
            localStorage.setItem('stoq_store_plan', 'FREE');
            
            const now = new Date().toISOString();
            localStorage.setItem('stoq_store_created_at', storeData.createdAt || now);
            
            setActiveStoreName(storeData.name);
            
            setUser((prev: any) => ({ 
                ...prev, 
                role: 'OWNER', 
                plan: 'FREE',
                storeCreatedAt: storeData.createdAt || now
            }));
        }

        localStorage.setItem('stoq_user_role', 'OWNER');
        setView('dashboard');

    } catch (err: any) {
        console.error(err);
        setStoreError(err.message || "Erro de conexão.");
    } finally {
        setIsStoreLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setActiveStoreName('');
    setView('home');
    // Limpa a URL caso esteja em uma rota específica
    window.history.pushState({}, '', '/');
  };

  const commonProps = { 
    user, 
    storeName: activeStoreName, 
    onLogout: handleLogout, 
    onNavigate: setView,
    setUser,
    toggleTheme,
    currentTheme: theme
  };

  // --- RENDERIZAÇÃO CENTRALIZADA ---
  const renderContent = () => {
      // 1. ROTAS LEGAIS (PÚBLICAS)
      if (view === 'terms') return <Legal type="terms" onBack={handleBackFromLegal} />;
      if (view === 'privacy') return <Legal type="privacy" onBack={handleBackFromLegal} />;
      if (view === 'lgpd') return <Legal type="lgpd" onBack={handleBackFromLegal} />;

      // 2. SETUP (Privado, mas sem loja)
      if (view === 'setup-store') {
          return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FC] p-6 font-sans">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Building2 size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Bem-vindo, {user?.name}!</h2>
                <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                    Para começar, precisamos criar a identidade do seu negócio no sistema.
                </p>
                {storeError && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 mb-6 text-left border border-red-100 animate-in shake">
                        <AlertCircle size={18} className="shrink-0"/>
                        {storeError}
                    </div>
                )}
                <form onSubmit={handleCreateStore} className="text-left space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nome da Empresa / Loja</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition">
                                <Store size={18} />
                            </div>
                            <input 
                                type="text" 
                                className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition font-bold text-slate-800 placeholder:text-slate-300 text-lg" 
                                placeholder="Ex: Alpha Comércio" 
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                        <div className="mt-0.5 text-blue-600"><AlertCircle size={16}/></div>
                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            Esse nome aparecerá nos recibos e no painel principal. Você poderá alterá-lo nas configurações depois.
                        </p>
                    </div>
                    <button 
                        disabled={isStoreLoading || !newStoreName.trim()} 
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {isStoreLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Finalizar Configuração <ArrowRight size={20}/></>}
                    </button>
                </form>
              </div>
            </div>
        );
      }

      // 3. AUTH (Pública)
      if (view === 'login' || view === 'signup') {
          return (
            <Auth 
              mode={view} 
              setView={setView} 
              formData={authData} 
              setFormData={setAuthData}
              onLoginSubmit={handleLogin}
              onOpenLegal={handleOpenLegal} // <--- PASSAMOS AQUI A FUNÇÃO DE ABRIR TERMOS
            />
          );
      }

      // 4. TELAS DO SISTEMA (Privadas + Checagem de Assinatura)
      const isAllowed = checkSubscriptionStatus();
      
      // Bloqueio de Assinatura
      if (!isAllowed && view !== 'subscription' && view !== 'settings') {
           return <Subscription {...commonProps} isLocked={true} />;
      }

      // Rotas do Painel
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
      
      // 5. HOME (Padrão)
      return <Home 
          onLogin={() => setView('login')} 
          onSignup={() => setView('signup')} 
          onNavigate={(page: any) => {
              // Se for página legal, usa a função inteligente que salva o histórico
              if (['terms', 'privacy', 'lgpd'].includes(page)) {
                  handleOpenLegal(page);
              } else {
                  setView(page);
              }
          }} 
      />;
  };

  return renderContent();
}