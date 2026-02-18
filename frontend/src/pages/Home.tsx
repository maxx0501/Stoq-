import { 
  BarChart3, ArrowRight, Store, Zap, Laptop, 
  Check, ShieldCheck, Cloud, Lock, Calendar, CreditCard, Star
} from 'lucide-react';

interface HomeProps {
    onLogin: () => void;
    onSignup: () => void;
    onNavigate: (page: any) => void; // <--- Adicione isso
}

export const Home = ({ onLogin, onSignup, onNavigate }: HomeProps) => {
  
  const FeatureCard = ({ icon, title, desc }: any) => (
    <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center mb-6 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-800">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 selection:bg-blue-100 font-sans">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white font-black text-lg italic">S+</span>
                </div>
                <span className="text-xl font-black tracking-tight text-slate-800">Stoq<span className="text-blue-600">+</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
                <a href="#funcionalidades" className="hover:text-blue-600 transition">Funcionalidades</a>
                <a href="#planos" className="hover:text-blue-600 transition">Planos</a>
                <a href="#contato" className="hover:text-blue-600 transition">Contato</a>
            </div>

            <div className="flex items-center gap-4">
                <button onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition px-4 py-2">Entrar</button>
                <button onClick={onSignup} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition shadow-lg hover:-translate-y-0.5 transform duration-200">
                    Testar Grátis
                </button>
            </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8 border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap size={14} className="fill-blue-500" />
          <span>Sistema completo para computador</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight text-slate-900 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Profissionalize sua loja <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">sem complicação.</span>
        </h1>
        
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          O Stoq+ é a ferramenta definitiva para o pequeno lojista. Comece a usar agora e tenha controle total do seu negócio no computador da sua loja.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
          <button onClick={onSignup} className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 hover:scale-105 transform duration-200">
            Começar 30 Dias Grátis <ArrowRight size={20} />
          </button>
          <a href="#planos" className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:border-blue-200 hover:text-blue-600 transition">
            Ver opções de planos
          </a>
        </div>

        {/* MOCKUP VISUAL */}
        <div className="relative mx-auto max-w-5xl rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden animate-in fade-in zoom-in duration-1000 delay-300">
            <div className="bg-slate-50 h-10 w-full border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-4 bg-white h-6 w-1/2 rounded-md border border-slate-200"></div>
            </div>
            <div className="flex h-[400px] md:h-[500px] bg-slate-50">
                <div className="hidden md:block w-64 bg-slate-900 h-full p-4 space-y-4">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg mb-8"></div>
                    <div className="h-4 w-3/4 bg-slate-700 rounded-full opacity-50"></div>
                    <div className="h-4 w-full bg-slate-700 rounded-full opacity-50"></div>
                    <div className="h-4 w-5/6 bg-slate-700 rounded-full opacity-50"></div>
                    <div className="h-4 w-4/5 bg-slate-700 rounded-full opacity-50"></div>
                </div>
                <div className="flex-1 p-6 space-y-6 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <div className="h-8 w-48 bg-white rounded-lg shadow-sm"></div>
                        <div className="h-8 w-8 bg-white rounded-full shadow-sm"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-32 bg-white rounded-2xl shadow-sm border border-slate-200 p-4"><div className="h-8 w-8 bg-blue-100 rounded-lg mb-4"></div><div className="h-6 w-24 bg-slate-100 rounded mb-2"></div></div>
                        <div className="h-32 bg-white rounded-2xl shadow-sm border border-slate-200 p-4"><div className="h-8 w-8 bg-emerald-100 rounded-lg mb-4"></div><div className="h-6 w-24 bg-slate-100 rounded mb-2"></div></div>
                        <div className="h-32 bg-white rounded-2xl shadow-sm border border-slate-200 p-4"><div className="h-8 w-8 bg-violet-100 rounded-lg mb-4"></div><div className="h-6 w-24 bg-slate-100 rounded mb-2"></div></div>
                    </div>
                    <div className="h-64 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-end justify-between gap-4">
                        <div className="w-full bg-blue-500 rounded-t-lg h-[40%] opacity-20"></div>
                        <div className="w-full bg-blue-500 rounded-t-lg h-[70%]"></div>
                        <div className="w-full bg-blue-500 rounded-t-lg h-[50%] opacity-40"></div>
                        <div className="w-full bg-blue-500 rounded-t-lg h-[90%]"></div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* FAIXA DE GARANTIAS */}
      <div className="border-y border-slate-100 bg-slate-50 py-12">
          <div className="max-w-5xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm"><Cloud size={24}/></div>
                      <h4 className="font-bold text-slate-800">100% em Nuvem</h4>
                      <p className="text-sm text-slate-500">Seus dados salvos automaticamente. Não perde nada se formatar o PC.</p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm"><Lock size={24}/></div>
                      <h4 className="font-bold text-slate-800">Acesso Seguro</h4>
                      <p className="text-sm text-slate-500">Apenas você e seus vendedores autorizados têm acesso.</p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm"><Laptop size={24}/></div>
                      <h4 className="font-bold text-slate-800">Ideal para PC</h4>
                      <p className="text-sm text-slate-500">Layout otimizado para telas grandes e uso rápido com mouse e teclado.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-900 tracking-tight">O controle que faltava</h2>
          <p className="text-slate-500 text-lg">Pare de sofrer com planilhas. Tenha uma gestão profissional hoje.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Store size={24} />}
            title="Gestão de Estoque"
            desc="Saiba exatamente o que tem na loja. Receba alertas de estoque baixo automaticamente."
          />
          <FeatureCard 
            icon={<BarChart3 size={24} />}
            title="Financeiro Real"
            desc="Veja seu lucro líquido na hora. Descontamos o custo do produto automaticamente."
          />
          <FeatureCard 
            icon={<Laptop size={24} />}
            title="Frente de Caixa (PDV)"
            desc="Faça vendas em segundos pelo computador. Selecione o produto e finalize a venda."
          />
          <FeatureCard 
            icon={<Zap size={24} />}
            title="Cupom Não Fiscal"
            desc="Imprima comprovantes profissionais para seus clientes com sua marca."
          />
          <FeatureCard 
            icon={<ShieldCheck size={24} />}
            title="Controle de Vendedores"
            desc="Saiba quem vendeu o quê. Calcule comissões e desempenho individual."
          />
          <FeatureCard 
            icon={<Check size={24} />}
            title="Simples de Usar"
            desc="Interface limpa e direta. Você não precisa de treinamento para começar."
          />
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="bg-slate-900 py-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] opacity-20"></div>

          <div className="max-w-6xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">Escolha como quer pagar</h2>
            <p className="text-slate-400 text-lg mb-12">Teste todas as funções grátis por 30 dias em qualquer plano.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* PLANO MENSAL */}
                <div className="bg-white rounded-[2rem] p-8 flex flex-col hover:scale-[1.02] transition-transform duration-300">
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
                        <li className="flex items-center gap-3 text-slate-600 text-sm font-medium"><Check size={16} className="text-blue-600"/> 30 dias de teste grátis</li>
                        <li className="flex items-center gap-3 text-slate-600 text-sm font-medium"><Check size={16} className="text-blue-600"/> Acesso total ao sistema</li>
                        <li className="flex items-center gap-3 text-slate-600 text-sm font-medium"><Check size={16} className="text-blue-600"/> Sem fidelidade</li>
                        <li className="flex items-center gap-3 text-slate-400 text-sm font-medium pt-4 border-t border-slate-100"><Lock size={14}/> Acesso bloqueado se não renovar</li>
                    </div>

                    <button onClick={onSignup} className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition">
                        Escolher Mensal
                    </button>
                </div>

                {/* PLANO ANUAL (Super Oferta) */}
                <div className="bg-white rounded-[2rem] p-8 flex flex-col relative border-4 border-blue-600 hover:scale-[1.02] transition-transform duration-300 shadow-2xl shadow-blue-900/50">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
                        <Star size={12} className="fill-white"/> Melhor Custo-Benefício
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><CreditCard size={24}/></div>
                        <h3 className="text-xl font-bold text-slate-800">Plano Anual</h3>
                    </div>
                    
                    {/* PREÇO ATUALIZADO */}
                    <div className="mb-2 text-left">
                        <p className="text-xs text-slate-400 line-through font-bold">De R$ 598,80</p>
                        <div className="flex items-end gap-1">
                            <span className="text-4xl font-black text-slate-900">R$ 389,90</span>
                            <span className="text-slate-500 font-bold mb-1">/ano</span>
                        </div>
                        
                    </div>
                    
                    <div className="text-left mb-6">
                         <span className="text-sm text-emerald-700 font-bold bg-emerald-100 px-3 py-1.5 rounded-lg inline-block border border-emerald-200">
                             Economize R$ 208,90 (35% OFF)
                         </span>
                    </div>

                    <div className="flex-1 space-y-4 text-left mb-8">
                        <li className="flex items-center gap-3 text-slate-700 text-sm font-bold"><Check size={16} className="text-blue-600"/> 30 dias de teste grátis</li>
                        <li className="flex items-center gap-3 text-slate-700 text-sm font-bold"><Check size={16} className="text-blue-600"/> Acesso garantido por 12 meses</li>
                        <li className="flex items-center gap-3 text-slate-700 text-sm font-bold"><Check size={16} className="text-blue-600"/> Pagamento único promocional</li>
                        <li className="flex items-center gap-3 text-slate-400 text-sm font-medium pt-4 border-t border-slate-100"><Lock size={14}/> Proteção contra aumento de preço</li>
                    </div>

                    <button onClick={onSignup} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
                        Quero o Plano Anual
                    </button>
                    
                    <p className="text-[10px] text-center text-slate-400 mt-3">
                        *Parcele em até 12x no cartão (consulte taxas)
                    </p>
                </div>

            </div>
          </div>
      </section>

      {/* FOOTER */}
      <footer id="contato" className="bg-white border-t border-slate-200 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-12">
          
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white italic">S+</span>
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">Stoq+</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              O sistema de gestão feito para simplificar a vida do pequeno empreendedor brasileiro. Tecnologia acessível, segura e eficiente.
            </p>
          </div>
          
          <div className="flex gap-16">
            <div>
                <h4 className="font-bold mb-4 text-slate-900">Produto</h4>
                <ul className="space-y-3 text-slate-500 text-sm">
                <li><a href="#funcionalidades" className="hover:text-blue-600 transition">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-blue-600 transition">Assinatura</a></li>
                <li><button onClick={onLogin} className="hover:text-blue-600 transition">Área do Cliente</button></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold mb-4 text-slate-900">Legal</h4>
                <ul className="space-y-3 text-slate-500 text-sm">
                <li><button onClick={() => onNavigate('terms')} className="hover:text-blue-600 transition">Termos de Uso</button></li>
                <li><button onClick={() => onNavigate('privacy')} className="hover:text-blue-600 transition">Privacidade</button></li>
                <li><button onClick={() => onNavigate('lgpd')} className="hover:text-blue-600 transition">LGPD</button></li>
                </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
          <p>© 2026 Stoq+ Sistemas. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0 opacity-50">Versão Desktop 1.0</p>
        </div>
      </footer>
    </div>
  );
};
