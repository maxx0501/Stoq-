import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  LogOut, 
  Users, 
  PackagePlusIcon, 
  BarChart3, 
  Settings, 
  CreditCard, 
  ShieldAlert, 
  DollarSign, 
  UserCog,      
  TrendingDown,
  Sparkles,
  Clock,
  X
} from 'lucide-react';

interface SidebarProps {
  active: 'dashboard' | 'products' | 'sales' | 'customers' | 'team' | 'stock' | 'reports' | 'settings' | 'subscription' | 'admin' | 'cashflow' | 'expenses';
  onNavigate: (page: any) => void;
  onLogout: () => void;
  user?: any;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar = ({ active, onNavigate, onLogout, user, isMobileOpen, onMobileClose }: SidebarProps) => {
  
  // Verifica se é vendedor para esconder coisas
  const isSeller = user?.role === 'SELLER';
  
  // Verifica o plano real
  const isPro = user?.plan === 'PRO';

  // --- CÁLCULO DOS DIAS DE TESTE (30 DIAS) ---
  let daysLeft = 0;
  let isTrialExpired = false;

  // Só calcula se não for PRO e não for Vendedor (Seller não paga)
  if (!isPro && !isSeller) {
      // Pega a data de criação da loja (ou data atual se não tiver, pra não quebrar)
      const createdDate = new Date(user?.storeCreatedAt || Date.now());
      const trialDays = 30; // Período de teste aumentado para 30 dias
      
      const expirationDate = new Date(createdDate);
      expirationDate.setDate(createdDate.getDate() + trialDays);
      
      const now = new Date();
      // Diferença em milissegundos
      const diffTime = expirationDate.getTime() - now.getTime();
      // Converte para dias e arredonda para cima
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (daysLeft <= 0) {
          daysLeft = 0;
          isTrialExpired = true;
      }
  }

  const getButtonClass = (pageName: string) => {
    const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm";
    if (active === pageName) {
      return `${baseClass} bg-blue-600 text-white shadow-lg shadow-blue-500/20`; 
    }
    return `${baseClass} text-slate-400 hover:bg-slate-800 hover:text-white`;
  };

  return (
    <aside className={`
      w-64 bg-[#0f172a] flex-col justify-between p-6 text-white shrink-0 transition-all duration-300
      hidden md:flex
      ${isMobileOpen ? '!flex fixed inset-y-0 left-0 z-50 shadow-2xl' : ''}
    `}>
      <div>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3 px-2">
            <img src="/logo.png" alt="Stoq+" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold leading-none italic">Stoq+</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">GESTÃO INTELIGENTE</p>
            </div>
          </div>
          {isMobileOpen && (
            <button onClick={onMobileClose} className="md:hidden p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800">
              <X size={20} />
            </button>
          )}
        </div>
        
        <nav className="space-y-2">
          <button onClick={() => onNavigate('dashboard')} className={getButtonClass('dashboard')}>
            <LayoutDashboard size={18} /> <span>Dashboard</span>
          </button>
          
          <button onClick={() => onNavigate('products')} className={getButtonClass('products')}>
            <Package size={18} /> <span>Produtos</span>
          </button>

          <button onClick={() => onNavigate('sales')} className={getButtonClass('sales')}>
            <ShoppingBag size={18} /> <span>Vendas</span>
          </button>

          <button onClick={() => onNavigate('cashflow')} className={getButtonClass('cashflow')}>
             <DollarSign size={18} /> <span>Fluxo de Caixa</span>
          </button>

          {!isSeller && (
             <button onClick={() => onNavigate('expenses')} className={getButtonClass('expenses')}>
                <TrendingDown size={18} /> <span>Despesas</span>
             </button>
          )}

          <div className="pt-4 pb-2">
             <p className="text-[10px] font-bold text-slate-500 uppercase px-4">Gestão</p>
          </div>

          <button onClick={() => onNavigate('customers')} className={getButtonClass('customers')}>
            <Users size={18} /> <span>Clientes</span>
          </button>

          {!isSeller && (
            <button onClick={() => onNavigate('team')} className={getButtonClass('team')}>
                <UserCog size={18} /> <span>Equipe</span>
            </button>
          )}

          {!isSeller && (
            <button onClick={() => onNavigate('stock')} className={getButtonClass('stock')}>
              <PackagePlusIcon size={18} /> <span>Entrada de Estoque</span>
            </button>
          )}
          
          {!isSeller && (
            <button onClick={() => onNavigate('reports')} className={getButtonClass('reports')}>
              <BarChart3 size={18} /> <span>Relatórios</span>
            </button>
          )}
          
          {!isSeller && (
            <button onClick={() => onNavigate('settings')} className={getButtonClass('settings')}>
              <Settings size={18} /> <span>Configurações</span>
            </button>
          )}
          
          {!isSeller && (
            <button onClick={() => onNavigate('subscription')} className={getButtonClass('subscription')}>
              <CreditCard size={18} /> <span>Assinatura</span>
            </button>
          )}
          
          {user?.isSuperAdmin && (
            <button onClick={() => onNavigate('admin')} className={getButtonClass('admin')}>
              <ShieldAlert size={18} /> <span>Painel CEO</span>
            </button>
          )}
        </nav>
      </div>

      <div className="space-y-6">
        
        {!isSeller && !isPro && (
            <div className={`rounded-2xl p-5 border relative overflow-hidden group transition-all duration-300 ${
                isTrialExpired 
                ? 'bg-red-900/10 border-red-500/30'
                : 'bg-slate-800/50 border-slate-700/50'
            }`}>
                <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full transition-all ${
                    isTrialExpired ? 'bg-red-500/10' : 'bg-slate-500/10 group-hover:bg-slate-500/20'
                }`}></div>
                
                <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className={`font-bold text-sm ${isTrialExpired ? 'text-red-400' : 'text-white'}`}>
                        {isTrialExpired ? 'Plano Expirado' : 'Período Grátis'}
                    </span>
                    
                    {!isTrialExpired && (
                        <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30 font-bold flex items-center gap-1">
                            <Clock size={10} /> {daysLeft} DIAS
                        </span>
                    )}
                </div>
                
                <p className="text-[10px] text-slate-400 mb-3 leading-tight">
                    {isTrialExpired 
                        ? "Seu acesso foi bloqueado. Assine para continuar." 
                        : "Aproveite todos os recursos antes que seu teste acabe."}
                </p>

                <button 
                    onClick={() => onNavigate('subscription')}
                    className={`w-full text-[10px] font-bold py-2 rounded-lg transition-all border flex items-center justify-center gap-2 ${
                        isTrialExpired 
                        ? 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border-red-600/30'
                        : 'bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-600/20'
                    }`}
                >
                    {isTrialExpired ? 'Regularizar Agora' : 'Virar Pro'} <Sparkles size={10}/>
                </button>
            </div>
        )}

        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400">
          <LogOut size={18} /> <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};
