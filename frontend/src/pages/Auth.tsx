import { useState, useEffect, useRef } from 'react';
import { Mail, Lock, User, ArrowLeft, Check, AlertCircle, CheckCircle2, Send } from 'lucide-react';

// Ícone do Google
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const Auth = ({ mode, setView, formData, setFormData, onLoginSubmit }: any) => {
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null); 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false); // Loading do reenvio
  
  // Controla se o email de confirmação foi enviado (Cadastro)
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Controla se mostra o botão de reenviar (Login falhou por verificação)
  const [showResendLink, setShowResendLink] = useState(false);

  // REF PARA CORRIGIR O AUTOFILL DA SENHA
  const passwordRef = useRef<HTMLInputElement>(null);

  // Estados de validação de senha
  const [passValidations, setPassValidations] = useState({
      length: false,
      upper: false,
      lower: false,
      number: false,
      special: false
  });

  // 1. CORREÇÃO DO AUTOFILL (Ouvinte de preenchimento automático)
  useEffect(() => {
    // Verifica a cada 100ms se o navegador preencheu a senha sozinho
    const timer = setInterval(() => {
        if (passwordRef.current && passwordRef.current.value && !formData.password) {
            // Se tem valor no input mas não tem no estado, atualiza!
            handleChange('password', passwordRef.current.value);
        }
    }, 100);

    // Para de verificar depois de 2 segundos (para não pesar a memória)
    const timeout = setTimeout(() => clearInterval(timer), 2000);

    return () => {
        clearInterval(timer);
        clearTimeout(timeout);
    };
  }, [formData.password]); // Roda sempre que a senha muda (ou deveria mudar)

  // 2. CAPTURA RETORNO DO E-MAIL (Link mágico)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
        setSuccessMsg("✅ E-mail confirmado com sucesso! Faça login para continuar.");
        window.history.replaceState({}, '', '/login'); // Limpa URL
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
    setShowResendLink(false); // Esconde o botão se o usuário tentar digitar de novo

    if (field === 'password') {
        setPassValidations({
            length: value.length >= 8,
            upper: /[A-Z]/.test(value),
            lower: /[a-z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
        });
    }
  };

  const handleResendCode = async () => {
      setIsResending(true);
      setError(null);
      setSuccessMsg(null);
      try {
          const res = await fetch('http://localhost:3333/auth/resend-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email })
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setSuccessMsg("Código reenviado! Verifique sua caixa de entrada.");
          setShowResendLink(false);

      } catch (err: any) {
          setError(err.message || "Erro ao reenviar código.");
      } finally {
          setIsResending(false);
      }
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setShowResendLink(false);

    // Força atualização da senha com o valor do input (Garantia final contra autofill)
    if (passwordRef.current && passwordRef.current.value !== formData.password) {
        formData.password = passwordRef.current.value;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        setError('Por favor, insira um e-mail válido.');
        return;
    }

    if (mode === 'signup') {
        if (!formData.name.trim()) { setError('Informe seu nome.'); return; }

        const allValid = Object.values(passValidations).every(Boolean);
        if (!allValid) { setError('Sua senha não atende aos requisitos de segurança.'); return; }

        if (formData.password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    }

    setIsLoading(true);

    if (mode === 'signup') {
      // --- CADASTRO ---
      try {
          const res = await fetch('http://localhost:3333/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: formData.name,
                  email: formData.email,
                  password: formData.password
              })
          });

          const data = await res.json();

          // SE O EMAIL JÁ EXISTE MAS NÃO FOI VALIDADO
          if (res.status === 409 && data.code === 'EMAIL_NOT_VERIFIED_YET') {
              setError(data.error);
              setShowResendLink(true); // Mostra o botão para ele tentar de novo
              throw new Error(data.error);
          }

          if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');

          setIsEmailSent(true);

      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }

    } else {
      // --- LOGIN ---
      try {
          await onLoginSubmit();
      } catch (err: any) {
          // AQUI ESTÁ A LÓGICA DO "REENVIAR EMAIL"
          const errorMsg = err.message || '';
          
          if (errorMsg.includes('EMAIL_NOT_VERIFIED') || errorMsg.includes('Confirme seu e-mail')) {
             setError("Sua conta ainda não foi verificada.");
             setShowResendLink(true); // ATIVA O BOTÃO
          } else {
             setError('E-mail ou senha incorretos.');
          }
          setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
      alert("Configuração de OAuth 2.0 necessária no Backend.");
  };

  // --- TELA DE CONFIRMAÇÃO DE EMAIL ENVIADO ---
  if (isEmailSent) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FC] p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Verifique seu e-mail</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Enviamos um link de confirmação para <br/>
                    <span className="font-bold text-slate-800">{formData.email}</span>.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-400 mb-8">
                    Não recebeu? Verifique sua caixa de spam.
                </div>
                <button 
                    onClick={() => { setIsEmailSent(false); setView('login'); }} 
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition"
                >
                    Voltar para o Login
                </button>
            </div>
        </div>
      );
  }

  // --- TELA NORMAL DE AUTH ---
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FC] p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-100 text-center animate-in zoom-in-95 duration-300">
        
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition mb-8 font-bold text-sm">
          <ArrowLeft size={16} /> Voltar para Home
        </button>

        <div className="mb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-black text-xl italic shadow-lg shadow-slate-200">S+</div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta segura'}
            </h2>
        </div>
        
        {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-bold flex items-center gap-3 mb-6 text-left border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={20} className="shrink-0"/>
                {successMsg}
            </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex flex-col items-start gap-2 mb-6 text-left border border-red-100 animate-in shake">
                <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="shrink-0"/>
                    {error}
                </div>
                
                {/* BOTÃO DE REENVIAR CÓDIGO (APARECE SE O ERRO FOR DE VERIFICAÇÃO) */}
                {showResendLink && (
                    <button 
                        onClick={handleResendCode}
                        disabled={isResending}
                        className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 transition ml-8 mt-1 flex items-center gap-2"
                    >
                        {isResending ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
                    </button>
                )}
            </div>
        )}

        <form onSubmit={validateAndSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Seu Nome</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><User size={18}/></div>
                <input 
                  type="text" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition font-medium text-slate-700" placeholder="Seu nome completo"
                  value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="text-left">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">E-mail Corporativo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Mail size={18}/></div>
              <input 
                type="email" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition font-medium text-slate-700" placeholder="seu@email.com"
                value={formData.email} onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="text-left">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Lock size={18}/></div>
              {/* INPUT DE SENHA COM REF PARA AUTOFILL */}
              <input 
                ref={passwordRef}
                type="password" 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition font-medium text-slate-700" 
                placeholder="Senha forte"
                value={formData.password} 
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="current-password"
              />
            </div>
            
            {mode === 'signup' && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className={`flex items-center gap-1.5 ${passValidations.length ? 'text-emerald-600' : ''}`}>
                        {passValidations.length ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Mínimo 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidations.upper ? 'text-emerald-600' : ''}`}>
                        {passValidations.upper ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Letra Maiúscula
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidations.lower ? 'text-emerald-600' : ''}`}>
                        {passValidations.lower ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Letra Minúscula
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidations.number ? 'text-emerald-600' : ''}`}>
                        {passValidations.number ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Número
                    </div>
                    <div className={`flex items-center gap-1.5 ${passValidations.special ? 'text-emerald-600' : ''}`}>
                        {passValidations.special ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Caractere Especial
                    </div>
                </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className="text-left animate-in slide-in-from-top-2 fade-in">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Confirme a Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    {formData.password && formData.password === confirmPassword && confirmPassword.length >= 8 ? <CheckCircle2 size={18} className="text-emerald-500"/> : <Lock size={18}/>}
                </div>
                <input 
                  type="password" className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-xl outline-none transition font-medium text-slate-700 ${formData.password && confirmPassword && formData.password !== confirmPassword ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-600'}`} 
                  placeholder="Repita a senha"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition mt-6 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (mode === 'login' ? 'Acessar Painel' : 'Criar Conta')}
          </button>
        </form>

        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ou continue com</span></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full bg-white border-2 border-slate-100 text-slate-600 py-3.5 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-200 transition flex items-center justify-center gap-3">
            <GoogleIcon /> Google
        </button>

        <p className="text-center mt-8 text-slate-500 font-medium text-sm">
            {mode === 'login' ? "Novo no Stoq+?" : "Já é cliente?"} {' '}
            <button 
              onClick={() => { setView(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccessMsg(null); setShowResendLink(false); }}
              className="text-blue-600 font-bold hover:text-blue-700 transition"
            >
              {mode === 'login' ? 'Crie sua conta' : 'Fazer login'}
            </button>
          </p>
      </div>
    </div>
  );
};