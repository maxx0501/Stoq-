import { useState, useEffect } from 'react';
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
import { Store, Zap, Tag } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'home' | 'login' | 'signup' | 'setup-store' | 'dashboard' | 'products' | 'sales' | 'customers' | 'team' | 'stock' | 'reports' | 'settings' | 'subscription' | 'admin'>('home'); 
  const [user, setUser] = useState<any>(null);
  const [activeStoreName, setActiveStoreName] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', storeName: ''
  });

  // --- NOVO: ESTADO DO TEMA ---
  const [theme, setTheme] = useState(() => {
    if (localStorage.getItem('stoq_theme') === 'dark') return 'dark';
    return 'light';
  });

  // --- EFEITO: APLICA A CLASSE NO HTML ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stoq_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stoq_theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- EFEITO: MEMÓRIA DE LOGIN ---
  useEffect(() => {
    const token = localStorage.getItem('stoq_token');
    if (token) {
      const savedUserName = localStorage.getItem('stoq_user_name');
      const savedUserRole = localStorage.getItem('stoq_user_role');
      const savedStore = localStorage.getItem('stoq_store_name');
      const savedAvatar = localStorage.getItem('stoq_user_avatar');
      const savedIsSuperAdmin = localStorage.getItem('stoq_is_super_admin') === 'true'; // <--- NOVO
      
      if (savedUserName) {
          setUser({ 
              name: savedUserName, 
              role: savedUserRole || 'SELLER',
              avatarUrl: savedAvatar || '',
              isSuperAdmin: savedIsSuperAdmin // <--- NOVO
          });
      }
      if (savedStore) setActiveStoreName(savedStore);
      
      setView('dashboard');
    }
  }, []);

  // --- LOGIN ---
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3333/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('stoq_token', data.token);
        localStorage.setItem('stoq_user_name', data.user.name);
        localStorage.setItem('stoq_user_avatar', data.user.avatarUrl || '');
        
        try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            const userRole = payload.role;
            localStorage.setItem('stoq_user_role', userRole);
            setUser({ ...data.user, role: userRole }); 
        } catch (e) {
            localStorage.setItem('stoq_user_role', 'SELLER');
            setUser({ ...data.user, role: 'SELLER' });
        }

        localStorage.setItem('stoq_store_name', data.storeName || 'Minha Loja');
        setActiveStoreName(data.storeName || 'Minha Loja');

        setView('dashboard'); 
      } else {
        alert('Erro: ' + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
    }
  };

  // --- CADASTRO ---
  const handleRegister = async () => {
    if (!formData.storeName) return alert("Por favor, dê um nome para sua loja.");

    try {
      const response = await fetch('http://localhost:3333/auth/register-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Loja criada com sucesso! Agora faça login.');
        setView('login');
      } else {
        alert('Erro: ' + (data.error || "Erro desconhecido"));
      }
    } catch (error) { 
      alert('Erro de conexão com o servidor.'); 
    }
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('stoq_token');
    localStorage.removeItem('stoq_user_name');
    localStorage.removeItem('stoq_user_role');
    localStorage.removeItem('stoq_store_name');
    setUser(null);
    setActiveStoreName('');
    setView('home');
  };

  // --- RENDERIZAÇÃO ---

  const commonProps = { 
    user, 
    storeName: activeStoreName, 
    onLogout: handleLogout, 
    onNavigate: setView,
    setUser,
    toggleTheme,
    currentTheme: theme
  };

  if (view === 'dashboard') {
    return <Dashboard {...commonProps} />;
  }

  if (view === 'products') {
    return <Products {...commonProps} />;
  }

  if (view === 'stock') {
    return <Stock {...commonProps} />;
  }

  if (view === 'sales') {
    return <Sales {...commonProps} />;
  }

  if (view === 'customers') {
    return <Customers {...commonProps} />;
  }

  // AQUI ESTAVA FALTANDO: ROTA DE RELATÓRIOS
  if (view === 'reports') {
    return <Reports {...commonProps} />;
  }

  if (view === 'team') {
    return <Team {...commonProps} />;
  }

  if (view === 'settings') {
    return <Settings {...commonProps} />;
  }

  if (view === 'subscription') {
    return <Subscription {...commonProps} />;
  }

  if (view === 'admin') {
    return <SuperAdmin {...commonProps} />;
  }

  return (
    <div className="w-full min-h-screen">
      {view === 'home' && (
        <Home onLogin={() => setView('login')} onSignup={() => setView('signup')} />
      )}
      
      {(view === 'login' || view === 'signup') && (
        <Auth 
          mode={view} 
          setView={setView} 
          formData={formData} 
          setFormData={setFormData}
          onLoginSubmit={handleLogin}
        />
      )}

      {view === 'setup-store' && (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
            
            <div className="w-16 h-16 bg-yellow-400/20 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Store size={32} />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-2">Configure sua Loja</h2>
            <p className="text-slate-500 mb-8 font-medium">Como seus clientes conhecerão seu negócio?</p>
            
            <div className="text-left space-y-4">
              <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome da Loja</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Tag size={18}/></div>
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition"
                      placeholder="Ex: Mateus Fashion"
                      value={formData.storeName}
                      onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                    />
                  </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl mb-6 flex gap-3 text-left">
                <Zap className="text-yellow-600 shrink-0" size={20} />
                <p className="text-[11px] text-yellow-800 leading-tight">
                  <strong>Dica Stoq+:</strong> Escolha um nome curto e fácil de lembrar. Você poderá alterar isso depois nas configurações.
                </p>
              </div>

              <button 
                onClick={handleRegister} 
                className="w-full bg-[#0f172a] text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-600 transition shadow-lg shadow-blue-900/10"
              >
                Finalizar e Abrir Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}