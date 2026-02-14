import { Mail, Lock, User, ArrowLeft } from 'lucide-react';

// Agora recebemos também o 'onLoginSubmit'
export const Auth = ({ mode, setView, formData, setFormData, onLoginSubmit }: any) => {
  
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita recarregar a página
    
    if (mode === 'signup') {
      // Se for cadastro, vai para a tela de criar loja
      setView('setup-store');
    } else {
      // Se for Login, chama a função que conecta no Backend
      onLoginSubmit();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition mb-8 font-medium">
          <ArrowLeft size={18} /> Voltar
        </button>

        <h2 className="text-3xl font-black text-slate-900 mb-6">
          {mode === 'login' ? 'Acesse o Stoq+' : 'Crie sua conta'}
        </h2>
        
        {/* Aqui usamos a nova função handleSubmit */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="mb-4 text-left">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Seu Nome</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18}/></div>
                <input 
                  type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mb-4 text-left">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail size={18}/></div>
              <input 
                type="email" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4 text-left">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18}/></div>
              <input 
                type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600" placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
            </div>
          </div>

          <button className="w-full bg-[#0f172a] text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-600 transition mt-4 shadow-lg">
            {mode === 'login' ? 'Entrar' : 'Próximo Passo'}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 font-medium text-sm">
            {mode === 'login' ? "Ainda não tem conta?" : "Já possui conta?"} {' '}
            <button 
              onClick={() => setView(mode === 'login' ? 'signup' : 'login')}
              className="text-blue-600 font-bold hover:underline"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
      </div>
    </div>
  );
};