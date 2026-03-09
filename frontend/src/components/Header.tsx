import { useState, useRef, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { ChevronDown, LogOut, Store, User, Camera, X, Mail, Shield, CheckCircle, Bell, Loader2, Check, Package, DollarSign, CalendarClock } from 'lucide-react';

export const Header = ({ user, storeName, onLogout, setUser }: any) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Notificações
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  
  // Dados do Formulário
  const [formData, setFormData] = useState({ name: '', email: '', avatarUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
        setFormData({ 
            name: user.name || '', 
            email: user.email || '', 
            avatarUrl: user.avatarUrl || localStorage.getItem('stoq_user_avatar') || '' 
        });
        fetchNotifications(false); 
    }
  }, [user === null ? null : user.id, user?.avatarUrl]);

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- BUSCA NOTIFICAÇÕES (COM CACHE INTELIGENTE) ---
  const fetchNotifications = async (forceUpdate = false) => {
      const token = localStorage.getItem('stoq_token');
      if (!token) return;

      if (!forceUpdate) {
          const cachedNotifs = sessionStorage.getItem('stoq_notifs_cache');
          const cacheTime = sessionStorage.getItem('stoq_notifs_time');
          
          if (cachedNotifs && cacheTime && (Date.now() - Number(cacheTime) < 5 * 60 * 1000)) {
              setNotifications(JSON.parse(cachedNotifs));
              return;
          }
      }

      setIsLoadingNotifs(true);
      const newNotifs = [];

      try {
          // 1. Estoque Baixo
          const resProducts = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (resProducts.ok) {
              const products = await resProducts.json();
              const lowStock = products.filter((p: any) => p.stock <= 5);
              if (lowStock.length > 0) {
                  newNotifs.push({
                      id: 'stock', type: 'warning', title: 'Estoque Baixo',
                      message: `${lowStock.length} produtos estão acabando.`,
                      icon: <Package size={16} className="text-orange-500"/>
                  });
              }
          }

          // 2. Despesas Atrasadas
          const resExpenses = await fetch(`${API_URL}/expenses`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (resExpenses.ok) {
              const expenses = await resExpenses.json();
              const lateExpenses = expenses.filter((e: any) => !e.paid && new Date(e.dueDate) < new Date());
              if (lateExpenses.length > 0) {
                  newNotifs.push({
                      id: 'expense', type: 'danger', title: 'Contas Atrasadas',
                      message: `Você tem ${lateExpenses.length} contas vencidas.`,
                      icon: <DollarSign size={16} className="text-red-500"/>
                  });
              }
          }

          // 3. Vendas a Crédito Vencidas
          const resDebts = await fetch(`${API_URL}/sales/debts`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (resDebts.ok) {
              const debts = await resDebts.json();
              const lateDebts = debts.filter((d: any) => new Date(d.dueDate) < new Date());
              if (lateDebts.length > 0) {
                  newNotifs.push({
                      id: 'debt', type: 'warning', title: 'Vendas a Crédito Vencidas',
                      message: `${lateDebts.length} clientes possuem pagamentos vencidos.`,
                      icon: <CalendarClock size={16} className="text-purple-500"/>
                  });
              }
          }

          setNotifications(newNotifs);
          
          sessionStorage.setItem('stoq_notifs_cache', JSON.stringify(newNotifs));
          sessionStorage.setItem('stoq_notifs_time', Date.now().toString());

      } catch (error) {
          console.error("Erro ao buscar notificações", error);
      } finally {
          setIsLoadingNotifs(false);
      }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'OWNER') return 'PROPRIETÁRIO';
    if (role === 'MANAGER') return 'GERENTE';
    return 'VENDEDOR';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); 
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      reader.readAsDataURL(file);
      // Limpa o input para permitir reuploads
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        const token = localStorage.getItem('stoq_token');
        const data = new FormData();
        data.append('name', formData.name);
        if (selectedFile) data.append('avatar', selectedFile);
        
        const res = await fetch(`${API_URL}/users/me`, { 
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: data
        });
        
        if (res.ok) {
            const updatedUser = await res.json();
            console.log('✅ User Updated:', updatedUser);
            
            // Atualiza o state global do usuário
            if (setUser) {
                setUser((prev: any) => {
                    const newUser = { ...prev, ...updatedUser };
                    console.log('📝 New User State:', newUser);
                    return newUser;
                });
            }
            
            // Salva no localStorage
            localStorage.setItem('stoq_user_name', updatedUser.name);
            if (updatedUser.avatarUrl) localStorage.setItem('stoq_user_avatar', updatedUser.avatarUrl);

            setIsEditModalOpen(false); 
            setIsSuccessModalOpen(true);
            setSelectedFile(null);
            setFormData(prev => ({ ...prev, avatarUrl: updatedUser.avatarUrl || prev.avatarUrl }));
        } else { 
            const errorData = await res.json();
            console.error('❌ Erro ao atualizar:', errorData);
            alert("Erro ao atualizar: " + (errorData.error || "Tente novamente.")); 
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        alert("Erro de conexão com o servidor."); 
    } finally { 
        setIsSaving(false); 
    }
  };

  // --- TRATAMENTO DA IMAGEM DE PERFIL (VERSÃO ORIGINAL QUE FUNCIONAVA) ---
  const getAvatarImage = () => {
    const url = user?.avatarUrl || localStorage.getItem('stoq_user_avatar');
    if (!url) return null;
    
    // Se a imagem for um caminho relativo do servidor, concatena com a API
    if (url.startsWith('/')) return `${API_URL}${url}?v=${Date.now()}`;
    
    // Se for URL completa ou data URL, retorna como está
    return url;
  };

  // --- FUNÇÃO AUXILIAR PARA CONVERTER URLs RELATIVAS ---
  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url; // Data URL (preview)
    if (url.startsWith('http')) return url; // URL completa (Google)
    if (url.startsWith('/')) return `${API_URL}${url}`; // URL relativa
    return url;
  };
  
  const finalAvatar = getAvatarImage();
  const notifCount = notifications.length;

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
            <button onClick={() => { setIsNotifOpen(!isNotifOpen); if(!isNotifOpen) fetchNotifications(true); }} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition relative">
                <Bell size={20} />
                {notifCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>}
            </button>
            
            {isNotifOpen && (
                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase">Notificações</span>
                        {isLoadingNotifs && <Loader2 size={12} className="animate-spin text-slate-400"/>}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 && !isLoadingNotifs ? (
                            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                                <CheckCircle size={24} className="text-emerald-100"/>
                                Nenhuma notificação pendente.
                            </div>
                        ) : (
                            notifications.map((notif, idx) => (
                                <div key={idx} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition flex gap-3 items-start">
                                    <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${notif.type === 'danger' ? 'bg-red-100' : 'bg-orange-100'}`}>
                                        {notif.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 leading-tight">{notif.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
         </div>

         {/* Perfil */}
         <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full transition group pr-3">
                {/* ESTRUTURA BLINDADA DA FOTO DE PERFIL */}
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm uppercase overflow-hidden relative border-2 border-white shadow-sm">
                    {/* A letra fica sempre no fundo */}
                    <span className="absolute inset-0 flex items-center justify-center">{user?.name?.[0] || 'U'}</span>
                    
                    {/* Se a foto existir, ela fica por cima. Se der erro (onError), ela some e a letra aparece! */}
                    {finalAvatar && (
                        <img 
                            src={finalAvatar} 
                            className="absolute inset-0 w-full h-full object-cover z-10 bg-white" 
                            alt="Avatar" 
                            crossOrigin="anonymous"
                            onError={(e) => { 
                                console.error('Erro ao carregar avatar:', finalAvatar, e);
                                e.currentTarget.style.display = 'none'; 
                            }}
                        />
                    )}
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
                            
                            {/* ESTRUTURA BLINDADA DO MODAL */}
                            <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-600 shadow-lg overflow-visible relative">
                                <span className="absolute inset-0 flex items-center justify-center text-white text-3xl font-black z-0">{formData.name?.[0] || 'U'}</span>
                                {formData.avatarUrl && (
                                    <img 
                                        src={getImageUrl(formData.avatarUrl)} 
                                        className="absolute inset-0 w-full h-full object-cover z-10 bg-white rounded-full" 
                                        crossOrigin="anonymous"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                )}
                                {/* Ícone de câmera - z-30 para ficar ACIMA de tudo */}
                                <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm z-30"><Camera size={14} /></div>
                            </div>
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