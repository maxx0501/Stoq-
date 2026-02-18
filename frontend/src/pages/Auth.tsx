import { useState, useEffect, useRef } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
import { Mail, Lock, User, ArrowLeft, Check, AlertCircle, CheckCircle2, Send, CheckSquare, Loader2 } from 'lucide-react';

// Ícone do Google
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const Auth = ({ mode, setView, formData, setFormData, onLoginSubmit, onOpenLegal, setUser }: any) => {
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null); 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false); 
  
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  const [passValidations, setPassValidations] = useState({
      length: false, upper: false, lower: false, number: false, special: false
  });

  // --- OUVINTE PARA LOGIN VIA GOOGLE ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Caso 1: Retorno do Login Google
    const googleToken = params.get('google_token');
    const userName = params.get('user_name');

    if (googleToken) {
        // Salva o token
        localStorage.setItem('stoq_token', googleToken);
        if (userName) localStorage.setItem('stoq_user_name', userName);
        
        // Limpa a URL para ficar bonita
        window.history.replaceState({}, '', '/login');
        
        // Força um reload para o App.tsx pegar a sessão
        // 3. Busca dados do usuário para decidir para onde ir (SEM RELOAD)
        fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${googleToken}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                // Atualiza usuário global
                if (setUser) setUser(data.user);
                localStorage.setItem('stoq_user_name', data.user.name);
                
                // DECISÃO DE ROTA:
                if (data.store) {
                    // Se JÁ TEM loja -> Vai para Dashboard
                    localStorage.setItem('stoq_store_name', data.store.name);
                    setView('dashboard'); 
                } else {
                    // Se NÃO TEM loja -> Vai para Setup Store
                    setView('setup-store');
                }
            }
        })
        .catch(err => {
            console.error("Erro ao validar Google Token:", err);
            // Se der erro, aí sim recarrega ou volta pro login
            window.location.reload();
        });
    }

    // Caso 2: Erro do Google
    if (params.get('error') === 'google_auth_failed') {
        setError("Falha ao entrar com Google. Tente novamente.");
        window.history.replaceState({}, '', '/login');
    }

    // Caso 3: E-mail Verificado
    if (params.get('verified') === 'true') {
        setSuccessMsg("✅ E-mail confirmado com sucesso! Faça login para continuar.");
        window.history.replaceState({}, '', '/login'); 
    }
  }, []);

  // Autofill Check
  useEffect(() => {
    const timer = setInterval(() => {
        if (passwordRef.current && passwordRef.current.value && !formData.password) {
            handleChange('password', passwordRef.current.value);
        }
    }, 100);
    const timeout = setTimeout(() => clearInterval(timer), 2000);
    return () => { clearInterval(timer); clearTimeout(timeout); };
  }, [formData.password]); 

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
    setShowResendLink(false); 

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
        if (!acceptTerms) { setError("Você precisa aceitar os Termos de Uso."); return; }
        const allValid = Object.values(passValidations).every(Boolean);
        if (!allValid) { setError('Sua senha não atende aos requisitos.'); return; }
        if (formData.password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    }

    setIsLoading(true);

    if (mode === 'signup') {
      try {
          const res = await fetch(`${API_URL}/auth/signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: formData.name,
                  email: formData.email,
                  password: formData.password
              })
          });
          const data = await res.json();
          if (res.status === 409 && data.code === 'EMAIL_NOT_VERIFIED_YET') {
              setError(data.error);
              setShowResendLink(true); 
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
      try {
          await onLoginSubmit();
      } catch (err: any) {
          const errorMsg = err.message || '';
          if (errorMsg.includes('EMAIL_NOT_VERIFIED') || errorMsg.includes('Confirme seu e-mail')) {
             setError("Sua conta ainda não foi verificada.");
             setShowResendLink(true); 
          } else {
             setError('E-mail ou senha incorretos.');
          }
          setIsLoading(false);
      }
    }
  };

  // --- AÇÃO DO BOTÃO GOOGLE ---
  const handleGoogleLogin = () => {
      // Redireciona o navegador para a rota do Backend que iniciamos no passo 2
      window.location.href = `${API_URL}/auth/google`;
  };

  // ... (O restante do render - isEmailSent e formulários - permanece igual ao seu código original)
  // Vou apenas devolver a estrutura renderizada para garantir:

  if (isEmailSent) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FC] p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Send size={32} /></div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">Verifique seu e-mail</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">Enviamos um link de confirmação para <br/><span className="font-bold text-slate-800">{formData.email}</span>.</p>
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-400 mb-8">Não recebeu? Verifique sua caixa de spam.</div>
                <button onClick={() => { setIsEmailSent(false); setView('login'); }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition">Voltar para o Login</button>
            </div>
        </div>
      );
  }

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
                <CheckCircle2 size={20} className="shrink-0"/> {successMsg}
            </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex flex-col items-start gap-2 mb-6 text-left border border-red-100 animate-in shake">
                <div className="flex items-center gap-3"><AlertCircle size={20} className="shrink-0"/> {error}</div>
                {showResendLink && (
                    <button onClick={handleResendCode} disabled={isResending} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 transition ml-8 mt-1 flex items-center gap-2">
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
                <input type="text" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition font-medium text-slate-700" placeholder="Seu nome completo" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
              </div>
            </div>
          )}

          <div className="text-left">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">E-mail Corporativo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Mail size={18}/></div>
              <input type="email" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition font-medium text-slate-700" placeholder="seu@email.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
          </div>

          <div className="text-left">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Lock size={18}/></div>
              <input ref={passwordRef} type="password" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-600 transition font-medium text-slate-700" placeholder="Senha" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} autoComplete="current-password" />
            </div>
            
            {mode === 'signup' && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className={`flex items-center gap-1.5 ${passValidations.length ? 'text-emerald-600' : ''}`}>{passValidations.length ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Mínimo 8 caracteres</div>
                    <div className={`flex items-center gap-1.5 ${passValidations.upper ? 'text-emerald-600' : ''}`}>{passValidations.upper ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Letra Maiúscula</div>
                    <div className={`flex items-center gap-1.5 ${passValidations.lower ? 'text-emerald-600' : ''}`}>{passValidations.lower ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Letra Minúscula</div>
                    <div className={`flex items-center gap-1.5 ${passValidations.number ? 'text-emerald-600' : ''}`}>{passValidations.number ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Número</div>
                    <div className={`flex items-center gap-1.5 ${passValidations.special ? 'text-emerald-600' : ''}`}>{passValidations.special ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>} Caractere Especial</div>
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
                <input type="password" className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 rounded-xl outline-none transition font-medium text-slate-700 ${formData.password && confirmPassword && formData.password !== confirmPassword ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-600'}`} placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
          )}
          
          {mode === 'signup' && (
            <div className="flex items-start gap-3 mt-4 animate-in slide-in-from-top-2 fade-in">
                <button type="button" onClick={() => setAcceptTerms(!acceptTerms)} className={`mt-0.5 min-w-[20px] w-5 h-5 rounded border flex items-center justify-center transition ${acceptTerms ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-transparent hover:border-blue-400'}`}>
                    <CheckSquare size={14} />
                </button>
                <p className="text-xs text-slate-500 leading-relaxed text-left">
                    Li e concordo com os <button type="button" onClick={() => onOpenLegal('terms')} className="text-blue-600 font-bold hover:underline">Termos de Uso</button> e <button type="button" onClick={() => onOpenLegal('privacy')} className="text-blue-600 font-bold hover:underline">Política de Privacidade</button> do Stoq+.
                </p>
            </div>
          )}

          <button disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition mt-6 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'Acessar Painel' : 'Criar Conta')}
          </button>
        </form>

        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Ou continue com</span></div>
        </div>

        {/* BOTÃO GOOGLE ATUALIZADO */}
        <button onClick={handleGoogleLogin} className="w-full bg-white border-2 border-slate-100 text-slate-600 py-3.5 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-200 transition flex items-center justify-center gap-3">
            <GoogleIcon /> Google
        </button>

        <p className="text-center mt-8 text-slate-500 font-medium text-sm">
            {mode === 'login' ? "Novo no Stoq+?" : "Já é cliente?"} {' '}
            <button onClick={() => { setView(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccessMsg(null); setShowResendLink(false); }} className="text-blue-600 font-bold hover:text-blue-700 transition">
              {mode === 'login' ? 'Crie sua conta' : 'Fazer login'}
            </button>
          </p>
      </div>
    </div>
  );
};