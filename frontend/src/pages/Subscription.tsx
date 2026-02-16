import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Check, Zap, ShieldCheck, Rocket, Crown, CheckCircle, Loader2 } from 'lucide-react';

export const Subscription = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  // --- LÓGICA DE PAGAMENTO ---
  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('stoq_token');
        
        // Chama a rota que criamos no Backend
        const response = await fetch('http://localhost:3333/payments/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ planType: billingCycle })
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
        setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="subscription" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8 relative">
            
            {/* Background decorativo (Glow) */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50 to-transparent pointer-events-none opacity-50"></div>

            <div className="max-w-[1200px] mx-auto space-y-12 relative z-10">
                
                {/* Header da Página */}
                <div className="text-center space-y-4 pt-8">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                        <Rocket size={14} /> Potencialize sua loja
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Escolha o plano ideal para <br/> o seu crescimento.
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Comece grátis e evolua conforme suas vendas aumentam. Sem contratos de fidelidade, cancele quando quiser.
                    </p>

                    {/* Toggle Mensal/Anual */}
                    <div className="flex justify-center mt-8">
                        <div className="bg-slate-100 p-1.5 rounded-xl flex relative cursor-pointer select-none">
                            
                            <div 
                                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out
                                ${billingCycle === 'monthly' ? 'left-1.5' : 'left-[calc(50%+1.5px)]'}`}
                            ></div>

                            <button 
                                onClick={() => setBillingCycle('monthly')}
                                className={`relative z-10 px-8 py-2 rounded-lg text-sm font-bold transition-colors w-32
                                ${billingCycle === 'monthly' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-600'}`}
                            >
                                Mensal
                            </button>

                            <button 
                                onClick={() => setBillingCycle('yearly')}
                                className={`relative z-10 px-8 py-2 rounded-lg text-sm font-bold transition-colors w-32 flex items-center justify-center gap-2
                                ${billingCycle === 'yearly' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-600'}`}
                            >
                                Anual <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-black">-20%</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* GRID DE PLANOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
                    
                    {/* PLANO FREE (SIMPLES) */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Plano Inicial</h3>
                                <p className="text-sm text-slate-500">Perfeito para quem está começando.</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-slate-900">R$ 0</span>
                                <span className="text-slate-400 font-medium">/mês</span>
                            </div>
                            <button disabled className="w-full py-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-400 font-bold text-sm cursor-default mb-8 flex items-center justify-center gap-2">
                                <CheckCircle size={18}/> Seu Plano Atual
                            </button>
                            <ul className="space-y-4">
                                {[
                                    '1 Usuário (Dono)',
                                    'Controle de Vendas',
                                    'Controle de Estoque Básico',
                                    'Relatórios Simples',
                                    'Suporte por E-mail'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Check size={12}/></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* PLANO PRO (O BONITÃO) */}
                    <div className="relative group">
                        {/* Efeito de Glow atrás */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                        
                        <div className="relative bg-slate-900 p-8 rounded-3xl shadow-2xl overflow-hidden text-white transform group-hover:-translate-y-2 transition duration-500">
                            
                            {/* Badge Recomendado */}
                            <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-500 to-violet-500 text-white text-[10px] font-black px-4 py-2 rounded-bl-2xl uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                <Crown size={12} className="text-yellow-300 fill-yellow-300"/> Recomendado
                            </div>

                            {/* Conteúdo */}
                            <div className="relative z-10">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <Zap size={24} className="text-yellow-400 fill-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Stoq+ PRO</h3>
                                        <p className="text-sm text-slate-400">Para lojas que querem voar.</p>
                                    </div>
                                </div>

                                <div className="mb-8 flex items-end gap-1">
                                    <span className="text-5xl font-black text-white tracking-tight">
                                        {billingCycle === 'monthly' ? 'R$ 49' : 'R$ 39'}
                                    </span>
                                    <span className="text-slate-400 font-medium mb-1">/mês</span>
                                    {billingCycle === 'yearly' && <span className="text-xs text-emerald-400 font-bold ml-2 mb-2 bg-emerald-400/10 px-2 py-1 rounded">Cobrado anualmente</span>}
                                </div>

                                {/* BOTÃO DE ASSINAR COM LOADING */}
                                <button 
                                    onClick={handleSubscribe}
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-lg shadow-lg shadow-blue-900/50 mb-8 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <><Loader2 size={24} className="animate-spin"/> Processando...</>
                                    ) : (
                                        <>Fazer Upgrade Agora <Zap size={18} className="fill-white"/></>
                                    )}
                                </button>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tudo do Free, mais:</p>
                                    <ul className="space-y-4">
                                        {[
                                            'Usuários Ilimitados (Gestores/Vendedores)',
                                            'Relatórios Avançados de Lucro',
                                            'Gestão de Equipe e Permissões',
                                            'Histórico Completo de Estoque',
                                            'Suporte Prioritário WhatsApp',
                                            'Multi-lojas (Em breve)'
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/50">
                                                    <Check size={14} className="text-white"/>
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Detalhe de fundo */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute top-20 right-10 w-32 h-32 bg-violet-600/20 rounded-full blur-2xl pointer-events-none"></div>
                        </div>
                    </div>

                </div>

                {/* Footer de Segurança */}
                <div className="text-center pt-12 pb-8 border-t border-slate-200 max-w-2xl mx-auto">
                    <div className="flex justify-center items-center gap-2 text-slate-400 mb-2">
                        <ShieldCheck size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Pagamento 100% Seguro</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                        Seus dados estão protegidos. Cancele sua assinatura a qualquer momento através do painel de configurações.
                        Dúvidas? Fale com nosso suporte.
                    </p>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
};