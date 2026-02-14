import { LayoutDashboard, ShoppingBag, Package, LogOut, Users, PackagePlusIcon, BarChart3, Settings, CreditCard, ShieldAlert, DollarSign } from 'lucide-react';

interface SidebarProps {
  active: 'dashboard' | 'products' | 'sales' | 'customers' | 'team' | 'stock' | 'reports' | 'settings' | 'subscription' | 'admin' | 'cashflow';
  onNavigate: (page: any) => void;
  onLogout: () => void;
  user?: any; // Recebemos o user para saber se ele é vendedor
}

export const Sidebar = ({ active, onNavigate, onLogout, user }: SidebarProps) => {
  
  // Verifica se é vendedor para esconder coisas
  const isSeller = user?.role === 'SELLER';

  const getButtonClass = (pageName: string) => {
    const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm";
    if (active === pageName) {
      return `${baseClass} bg-blue-600 text-white shadow-lg shadow-blue-500/20`; 
    }
    return `${baseClass} text-slate-400 hover:bg-slate-800 hover:text-white`;
  };

  return (
    <aside className="w-64 bg-[#0f172a] hidden md:flex flex-col justify-between p-6 text-white shrink-0 transition-all duration-300">
      <div>
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <span className="text-white font-black text-xl italic">S+</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none italic">Stoq+</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">GESTÃO INTELIGENTE</p>
          </div>
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


  
          {/* BOTÃO FLUXO DE CAIXA (AJUSTADO) */}
              <button 
                onClick={() => onNavigate('cashflow')} 
                className={getButtonClass('cashflow')}
              >
                <DollarSign size={20} /> Fluxo de Caixa
              </button>

          <button onClick={() => onNavigate('customers')} className={getButtonClass('customers')}>
            <Users size={18} /> <span>Clientes</span>
          </button>

          {/* SÓ MOSTRA EQUIPE SE NÃO FOR VENDEDOR */}
          {!isSeller && (
            <button onClick={() => onNavigate('team')} className={getButtonClass('team')}>
                <Users size={18} /> <span>Equipe</span>
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
        {/* CARD DE UPGRADE (VISUAL) - Só pra dono ver, talvez? Deixei pra todos por enquanto */}
        {!isSeller && (
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-all"></div>
                
                <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className="text-white font-bold text-sm">Plano Pro</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">ATIVO</span>
                </div>
                
                <p className="text-[10px] text-slate-400 mb-3 leading-tight">
                    Sua loja está rodando com potência máxima.
                </p>
            </div>
        )}

        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400">
          <LogOut size={18} /> <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};