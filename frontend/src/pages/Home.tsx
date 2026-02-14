import { BarChart3, ArrowRight, Store, Zap, Smartphone } from 'lucide-react';
export const Home = ({ onLogin, onSignup }: any) => {
  
  // Componente interno para os cards de benefícios
  const FeatureCard = ({ icon, title, desc }: any) => (
    <div className="group bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
      <div className="w-14 h-14 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center mb-8 transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 selection:bg-blue-100">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center">
            <span className="text-blue-500 font-black text-xl">S+</span>
          </div>
          <span className="text-2xl font-black tracking-tight">Stoq+</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          <a href="#funcionalidades" className="hover:text-blue-600 transition">Funcionalidades</a>
          <a href="#planos" className="hover:text-blue-600 transition">Planos</a>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onLogin} className="font-bold text-slate-700 hover:text-blue-600 transition">Entrar</button>
          <button onClick={onSignup} className="bg-[#0f172a] text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 transition shadow-lg">
            Cadastrar
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="px-6 pt-16 pb-24 max-w-5xl mx-auto text-center w-full">
        <div className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8 border border-yellow-200">
          <Zap size={14} className="fill-yellow-500" />
          <span>Gestão inteligente para lojistas de roupas</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
          Venda mais, <span className="text-blue-600">organize melhor</span> seu estoque.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          O Stoq+ é o braço direito do pequeno lojista. Controle vendas, lucro e estoque de forma simples, rápida e profissional.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onSignup} className="w-full sm:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20">
            Começar Teste Grátis
            <ArrowRight size={20} />
          </button>
          <button className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 px-10 py-4 rounded-2xl font-black text-lg hover:border-yellow-400 transition">
            Ver Planos
          </button>
        </div>
      </header>

      {/* SEÇÃO DE FUNCIONALIDADES */}
      <section id="funcionalidades" className="bg-slate-50 py-24 px-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 tracking-tight">Tudo o que você precisa para crescer</h2>
            <p className="text-slate-500 font-medium">Ferramentas pensadas para o dia a dia de quem vende.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Store className="text-blue-600" />}
              title="Multiusuário"
              desc="Cadastre seus vendedores e controle permissões de acesso facilmente."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-yellow-500" />}
              title="Relatórios de Lucro"
              desc="Saiba exatamente quanto está ganhando por venda e no mês."
            />
            <FeatureCard 
              icon={<Smartphone className="text-blue-600" />}
              title="Totalmente Mobile"
              desc="Acesse o estoque e registre vendas pelo celular onde estiver."
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f172a] text-white py-16 px-6 w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-slate-800 pb-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">S+</span>
              </div>
              <span className="text-2xl font-black">Stoq+</span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Simplificando a gestão de pequenos negócios no Brasil. Controle de estoque e vendas sem complicação.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-yellow-400">Produto</h4>
            <ul className="space-y-4 text-slate-400 font-medium text-sm">
              <li><a href="#" className="hover:text-white transition">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-white transition">Planos Pro</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Suporte</h4>
            <ul className="space-y-4 text-slate-400 font-medium text-sm">
              <li><a href="#" className="hover:text-white transition">Contato</a></li>
              <li><a href="#" className="hover:text-white transition">Guarulhos, SP</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-widest">
          <p>© 2026 Stoq+ Sistemas LTDA.</p>
        </div>
      </footer>
    </div>
  );
};