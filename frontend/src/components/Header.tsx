import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Store, User, Camera, X, Mail, Shield, CheckCircle, Bell, Loader2, Check } from 'lucide-react';

export const Header = ({ user, storeName, onLogout, setUser }: any) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Nova Modal de Sucesso
  
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Dados do Formulário
  const [formData, setFormData] = useState({ name: '', email: '', avatarUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // <--- ARQUIVO REAL
  const [isSaving, setIsSaving] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza dados sempre que o user muda
  useEffect(() => {
    if (user) {
        setFormData({ 
            name: user.name || '', 
            email: user.email || '', 
            avatarUrl: user.avatarUrl || '' 
        });
    }
  }, [user]);

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleLabel = (role: string) => {
    if (role === 'OWNER') return 'PROPRIETÁRIO';
    if (role === 'MANAGER') return 'GERENTE';
    return 'VENDEDOR';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // <--- GUARDA O ARQUIVO REAL PARA ENVIAR DEPOIS
      
      // Cria preview apenas para mostrar na tela agora
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  // --- SALVAR PERFIL (CORRIGIDO PARA FORMDATA) ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        const token = localStorage.getItem('stoq_token');
        
        // 1. Cria o FormData (Necessário para enviar arquivos)
        const data = new FormData();
        data.append('name', formData.name);
        if (selectedFile) {
            data.append('avatar', selectedFile); // 'avatar' deve bater com o backend
        }
        
        const res = await fetch('http://localhost:3333/users/me', { 
            method: 'PUT',
            headers: { 
                // NÃO COLOCAR Content-Type aqui! O navegador define sozinho para multipart/form-data
                'Authorization': `Bearer ${token}` 
            },
            body: data
        });
        
        if (res.ok) {
            const updatedUser = await res.json();
            
            // Atualiza o estado global
            if (setUser) {
                // Adiciona um timestamp na URL da imagem para forçar o navegador a recarregar a imagem nova (cache busting)
                const freshUser = {
                    ...updatedUser,
                    avatarUrl: updatedUser.avatarUrl ? `${updatedUser.avatarUrl}?t=${Date.now()}` : null
                };
                setUser((prev: any) => ({ ...prev, ...freshUser }));
            }
            
            // Atualiza LocalStorage
            localStorage.setItem('stoq_user_name', updatedUser.name);
            if (updatedUser.avatarUrl) localStorage.setItem('stoq_user_avatar', updatedUser.avatarUrl);

            // Troca as modais
            setIsEditModalOpen(false); // Fecha edição
            setIsSuccessModalOpen(true); // Abre sucesso

        } else { 
            const errorData = await res.json();
            alert("Erro ao atualizar: " + (errorData.error || "Tente novamente.")); 
        }
    } catch (error) { 
        console.error(error);
        alert("Erro de conexão com o servidor."); 
    } finally { 
        setIsSaving(false); 
    }
  };

  const dangerCount = notifications.filter(n => n.type === 'danger').length;

  return (
    <>
    <header className="bg-white h-20 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-100 shrink-0">
      
      {/* ESQUERDA: Logo */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Store size={20} />
        </div>
        <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">{storeName || 'Minha Loja'}</h1>
            <p className="text-xs text-slate-500 font-medium capitalize">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>
      </div>
      
      {/* DIREITA: Ações */}
      <div className="flex items-center gap-4">
         
         {/* Notificações */}
         <div className="relative" ref={notifRef}>
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition relative">
                <Bell size={20} />
                {dangerCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
            </button>
            {isNotifOpen && (
                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-4 z-50 text-center text-slate-400 text-xs animate-in fade-in zoom-in duration-200">
                    Nenhuma notificação no momento.
                </div>
            )}
         </div>

         {/* Perfil */}
         <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full transition group pr-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-white font-black text-sm uppercase overflow-hidden relative border-2 border-white shadow-sm">
                    {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : <span className="bg-blue-600 w-full h-full flex items-center justify-center">{user?.name?.[0] || 'U'}</span>}
                </div>
                <div className="text-left hidden md:block">

                    <p className="text-sm font-bold text-slate-700 leading-tight">{user?.name}</p>

                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-0.5">{getRoleLabel(user?.role)}</p>

                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
                <div className="absolute right-0 top-14 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-2">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Conta Logada</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                    </div>
                    <button onClick={() => { setIsEditModalOpen(true); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2 transition">
                        <User size={16} /> Editar Perfil
                    </button>
                    <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-bold hover:bg-red-50 flex items-center gap-2 transition">
                        <LogOut size={16} /> Sair do Sistema
                    </button>
                </div>
            )}
         </div>
      </div>
    </header>

    {/* --- MODAL EDITAR PERFIL --- */}
    {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-slate-900 px-8 pt-8 pb-16 relative text-center">
                    <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"><X size={20}/></button>
                    <h2 className="text-white font-black text-xl">Seu Perfil</h2>
                    <p className="text-slate-400 text-sm">Mantenha seus dados atualizados.</p>
                </div>
                <div className="px-8 pb-8 relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 shadow-lg overflow-hidden">
                                {formData.avatarUrl ? <img src={formData.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-black">{formData.name?.[0] || 'U'}</div>}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm"><Camera size={14} /></div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                    <form onSubmit={handleSaveProfile} className="mt-16 space-y-5">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-2"><User size={14}/> Nome</label>
                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-2"><Mail size={14}/> E-mail</label>
                            <input className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" value={formData.email} disabled/>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl flex gap-3 items-center border border-blue-100">
                            <Shield className="text-blue-600" size={20} />
                            <div>
                                <p className="text-xs font-bold text-blue-700 uppercase">Seu Cargo</p>
                                <p className="text-sm font-bold text-slate-700">{getRoleLabel(user?.role)}</p>
                            </div>
                        </div>
                        <button disabled={isSaving} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">
                            {isSaving ? <Loader2 className="animate-spin w-5 h-5"/> : <><CheckCircle size={18}/> Salvar Alterações</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )}

    {/* --- NOVA MODAL DE SUCESSO --- */}
    {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in zoom-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} strokeWidth={3} />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Sucesso!</h2>
                <p className="text-slate-500 text-sm mb-6">
                    Seu perfil foi atualizado com sucesso.
                </p>
                <button 
                    onClick={() => setIsSuccessModalOpen(false)}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition"
                >
                    Entendido
                </button>
            </div>
        </div>
    )}
    </>
  );
};