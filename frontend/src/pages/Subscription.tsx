import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { 
  Check, ShieldCheck, Calendar, CreditCard, Lock, Loader2, Rocket, Star
} from 'lucide-react';

export const Subscription = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [isLoading, setIsLoading] = useState<'monthly' | 'yearly' | null>(null);

  // --- LÓGICA DE PAGAMENTO ---
  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    setIsLoading(planType);
    try {
        const token = localStorage.getItem('stoq_token');
        const storeId = localStorage.getItem('stoq_store_id'); 

        if (!storeId) {
            alert("Erro: ID da loja não encontrado. Tente fazer login novamente.");
            return;
        }
        
        // Chama a rota que criamos no Backend
        const response = await fetch('http://localhost:3333/payments/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                planType,
                storeId 
            })
        });

        const data = await response.json();

        if (response.ok && data.init_point) {
            // Redireciona para o Mercado Pago
            window.location.href = data.init_point;
        } else {
            alert("Erro ao criar pagamento: " + (data.error || "Tente novamente."));
        }

    } catch (error) {
        console.error(error);
        alert("Erro de conexão com o servidor.");
    } finally {
        setIsLoading(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="subscription" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8 relative">
            
            {/* Background decorativo (Igual da Home) */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                
                {/* Header da Página */}
                <div className="text-center space-y-4 pt-8 mb-12">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                        <Rocket size={14} /> Upgrade
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Invista no crescimento <br/> da sua loja.
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Desbloqueie todo o potencial do Stoq+. Sem contratos de fidelidade, cancele quando quiser.
                    </p>
                </div>

                {/* GRID DE PLANOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                    {/* PLANO MENSAL */}
                    <div className="bg-white rounded-[2rem] p-8 flex flex-col hover:scale-[1.02] transition-transform duration-300 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><Calendar size={24}/></div>
                            <h3 className="text-xl font-bold text-slate-800">Plano Mensal</h3>
                        </div>
                        
                        <div className="mb-6 text-left">
                            <p className="text-sm text-slate-400 font-bold line-through mb-1">De R$ 79,90</p>
                            <div className="flex items-end gap-1 text-slate-900">
                                <span className="text-4xl font-black">R$ 49,90</span>
                                <span className="text-slate-500 font-medium mb-1">/mês</span>
                            </div>
                            <p className="text-xs text-blue-600 font-bold mt-2 bg-blue-50 inline-block px-2 py-1 rounded">Oferta de Lançamento</p>
                        </div>

                        <div className="flex-1 space-y-4 text-left mb-8">
                            <li className="flex items-center gap-3 text-slate-600 text-sm font-medium"><Check size={16} className="text-blue-600"/> Acesso total ao sistema</li>
                            <li className="flex items-center gap-3 text-slate-600 text-sm font-medium"><Check size={16} className="text-blue-600"/> Usuários ilimitados</li>
                            <li className="flex items-center gap-3 text-slate-600 text-sm font-medium"><Check size={16} className="text-blue-600"/> Sem fidelidade</li>
                            <li className="flex items-center gap-3 text-slate-400 text-sm font-medium pt-4 border-t border-slate-100"><Lock size={14}/> Pagamento seguro via Mercado Pago</li>
                        </div>

                        <button 
                            onClick={() => handleSubscribe('monthly')}
                            disabled={isLoading !== null}
                            className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2"
                        >
                            {isLoading === 'monthly' ? <Loader2 className="animate-spin"/> : 'Escolher Mensal'}
                        </button>
                    </div>

                    {/* PLANO ANUAL (Super Oferta) */}
                    <div className="bg-white rounded-[2rem] p-8 flex flex-col relative border-4 border-blue-600 hover:scale-[1.02] transition-transform duration-300 shadow-2xl shadow-blue-900/20">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg whitespace-nowrap flex items-center gap-1">
                             <Star size={12} className="fill-white"/> Melhor Custo-Benefício
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><CreditCard size={24}/></div>
                            <h3 className="text-xl font-bold text-slate-800">Plano Anual</h3>
                        </div>
                        
                        {/* PREÇO ATUALIZADO (389,90) */}
                        <div className="mb-2 text-left">
                            <p className="text-xs text-slate-400 line-through font-bold">De R$ 598,80</p>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-black text-slate-900">R$ 389,90</span>
                                <span className="text-slate-500 font-bold mb-1">/ano</span>
                            </div>
                            
                        </div>
                        
                        <p className="text-left text-sm text-emerald-600 font-bold mb-6 bg-emerald-50 inline-block px-3 py-1 rounded-lg self-start border border-emerald-100">
                             Economize R$ 208,90 (35% OFF)
                        </p>

                        <div className="flex-1 space-y-4 text-left mb-8">
                            <li className="flex items-center gap-3 text-slate-700 text-sm font-bold"><Check size={16} className="text-blue-600"/> Acesso garantido por 12 meses</li>
                            <li className="flex items-center gap-3 text-slate-700 text-sm font-bold"><Check size={16} className="text-blue-600"/> Usuários ilimitados</li>
                            <li className="flex items-center gap-3 text-slate-700 text-sm font-bold"><Check size={16} className="text-blue-600"/> Pagamento único promocional</li>
                            <li className="flex items-center gap-3 text-slate-400 text-sm font-medium pt-4 border-t border-slate-100"><Lock size={14}/> Garantia de preço por 12 meses</li>
                        </div>

                        <button 
                            onClick={() => handleSubscribe('yearly')}
                            disabled={isLoading !== null}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                             {isLoading === 'yearly' ? <Loader2 className="animate-spin"/> : 'Quero o Plano Anual'}
                        </button>
                        
                         <p className="text-[10px] text-center text-slate-400 mt-3">
                            *Parcele em até 12x no cartão (consulte taxas)
                        </p>
                    </div>

                </div>

                {/* Footer de Segurança */}
                <div className="text-center pt-8 border-t border-slate-200 max-w-2xl mx-auto">
                    <div className="flex justify-center items-center gap-2 text-slate-400 mb-2">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Pagamento 100% Seguro</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                        Seus dados estão protegidos. A ativação do plano PRO é automática após a confirmação do pagamento.
                    </p>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
};