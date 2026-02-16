import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Store, User, Camera, X, Mail, Shield, CheckCircle, Bell, AlertTriangle, Info } from 'lucide-react';

export const Header = ({ user, storeName, onLogout, setUser }: any) => {
  // Estados para Dropdowns e Modais
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false); // <--- NOVO
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dados
  const [notifications, setNotifications] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', avatarUrl: user?.avatarUrl || '' });
  const [isSaving, setIsSaving] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null); // <--- NOVO
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Busca notificações ao carregar
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('stoq_token');
    if (!token) return;
    try {
        const res = await fetch('http://localhost:3333/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setNotifications(await res.json());
    } catch (e) { console.error(e); }
  };

  // Click Outside (Fecha os menus se clicar fora)
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Atualiza form se user mudar
  useEffect(() => {
    if (user) setFormData({ name: user.name || '', email: user.email || '', avatarUrl: user.avatarUrl || '' });
  }, [user]);

  const getRoleLabel = (role: string) => {
    if (role === 'OWNER') return 'PROPRIETÁRIO';
    if (role === 'MANAGER') return 'GERENTE';
    return 'VENDEDOR';
  };

  // Upload Foto
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, avatarUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  // Salvar Perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const token = localStorage.getItem('stoq_token');
        const res = await fetch('http://localhost:3333/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: formData.name, avatarUrl: formData.avatarUrl })
        });
        if (res.ok) {
            const updatedUser = await res.json();
            if (setUser) setUser((prev: any) => ({ ...prev, ...updatedUser }));
            localStorage.setItem('stoq_user_name', updatedUser.name);
            setIsModalOpen(false);
        } else { alert("Erro ao atualizar."); }
    } catch (error) { alert("Erro conexão."); } finally { setIsSaving(false); }
  };

  // Conta notificações de perigo (Vermelhas)
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
         
         {/* 1. NOTIFICAÇÕES */}
         <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition relative"
            >
                <Bell size={20} />
                {dangerCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>

            {isNotifOpen && (
                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-500 uppercase">Notificações</p>
                        {dangerCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{dangerCount} alertas</span>}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-center text-slate-400 text-xs py-8">Nenhuma notificação.</p>
                        ) : (
                            notifications.map((notif, i) => (
                                <div key={i} className="px-4 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex gap-3">
                                    <div className={`mt-1 shrink-0`}>
                                        {notif.type === 'danger' && <AlertTriangle size={16} className="text-red-500" />}
                                        {notif.type === 'success' && <CheckCircle size={16} className="text-emerald-500" />}
                                        {notif.type === 'info' && <Info size={16} className="text-blue-500" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 leading-tight mb-0.5">{notif.title}</p>
                                        <p className="text-xs text-slate-500 leading-snug">{notif.message}</p>
                                        <p className="text-[10px] text-slate-300 font-bold mt-1">{notif.time}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
         </div>

         {/* BOTÃO DARK MODE
         <button 
             onClick={toggleTheme}
             className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
             title={currentTheme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
         >
             {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
         </button>

         <div className="h-8 w-px bg-slate-100 mx-2"></div> */}

         {/* 2. PERFIL */}
         <div className="relative" ref={profileRef}>
            <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)} 
                className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full transition group pr-3"
            >
                {/* FOTO (Sem brilho/borda conforme pedido) */}
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-white font-black text-sm uppercase overflow-hidden relative">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="bg-blue-600 w-full h-full flex items-center justify-center">
                            {user?.name?.[0] || 'U'}
                        </span>
                    )}
                </div>
                
                {/* NOME */}
                <div className="text-left hidden md:block">
                    <p className="text-sm font-bold text-slate-700 leading-tight">{user?.name}</p>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-0.5">
                        {getRoleLabel(user?.role)}
                    </p>
                </div>

                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
                <div className="absolute right-0 top-14 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 mb-2">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Conta Logada</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                    </div>
                    <button onClick={() => { setIsModalOpen(true); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2 transition">
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
    {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-slate-900 px-8 pt-8 pb-16 relative text-center">
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"><X size={20}/></button>
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
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-2"><User size={14}/> Nome</label><input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-slate-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-2"><Mail size={14}/> E-mail</label><input className="w-full p-3 bg-slate-100 border rounded-xl text-slate-500 cursor-not-allowed" value={formData.email} disabled/></div>
                        <div className="bg-blue-50 p-3 rounded-xl flex gap-3 items-center border border-blue-100"><Shield className="text-blue-600" size={20} /><div><p className="text-xs font-bold text-blue-700 uppercase">Seu Cargo</p><p className="text-sm font-bold text-slate-700">{getRoleLabel(user?.role)}</p></div></div>
                        <button disabled={isSaving} type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">{isSaving ? 'Salvando...' : <><CheckCircle size={18}/> Salvar Alterações</>}</button>
                    </form>
                </div>
            </div>
        </div>
    )}
    </>
  );
};