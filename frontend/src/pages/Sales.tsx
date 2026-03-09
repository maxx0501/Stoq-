import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, Package, X, DollarSign, TrendingUp, Calendar, ArrowRight, CheckCircle, CalendarClock, User, CreditCard, Banknote, QrCode } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';

export const Sales = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  // --- ESTADOS ---
  const [metrics, setMetrics] = useState<any>(null);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [saleMode, setSaleMode] = useState<'STANDARD' | 'CREDIT'>('STANDARD'); 
  
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Cliente
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Estados de Pagamento
  const [paymentMethod, setPaymentMethod] = useState('MONEY');

  // Feedback
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMyMetrics();
  }, []);

  const fetchMyMetrics = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
        const res = await fetch(`${API_URL}/my-sales-metrics`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setMetrics(await res.json());
    } catch (error) { console.error(error); }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem('stoq_token');
    const res = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setProducts(await res.json());
  };

  const fetchCustomers = async () => {
    const token = localStorage.getItem('stoq_token');
    const res = await fetch(`${API_URL}/customers`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setCustomers(await res.json());
  };

  const handleOpenPos = (mode: 'STANDARD' | 'CREDIT') => {
    setSaleMode(mode);
    fetchProducts();
    fetchCustomers();
    setCart([]);
    setSelectedCustomer(null);
    setSearchTerm('');
    setPaymentMethod('MONEY'); 
    setIsPosOpen(true);
  };

  const addToCart = (product: any) => {
    if ((product.stock || 0) <= 0) return alert("Produto sem estoque!");
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        if (existing.quantity >= product.stock) return alert("Estoque máximo!");
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
        setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
        if (item.id === id) {
            const newQ = item.quantity + delta;
            if (newQ < 1) return item;
            if (newQ > item.stock) return item;
            return { ...item, quantity: newQ };
        }
        return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));
  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);

  // --- FINALIZAR VENDA ---
  const handleFinishSale = async () => {
    if (cart.length === 0) return alert("Carrinho vazio!");
    
    if (saleMode === 'CREDIT' && !selectedCustomer) {
        return alert("⚠️ Selecione um cliente para vender a crédito.");
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('stoq_token');
      
      const payload = {
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
          customerId: selectedCustomer?.id, 
          // Se for crédito, força CREDIT_STORE. 
          paymentMethod: saleMode === 'CREDIT' ? 'CREDIT_STORE' : paymentMethod
      };

      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setCart([]);
        setShowSuccessModal(true);
        fetchMyMetrics(); 
        
        setTimeout(() => {
            setShowSuccessModal(false);
            setIsPosOpen(false);
        }, 1500);
      } else {
        const err = await res.json();
        alert("Erro: " + (err.error || "Falha na venda."));
      }
    } catch (error) { 
        alert("Erro de conexão."); 
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- HELPERS VISUAIS (NOVOS) ---
  
  // 1. Tradutor de nomes para texto corrido (Modal)
  const getPaymentLabel = (method: string) => {
      switch (method) {
          case 'MONEY': return 'Dinheiro';
          case 'CREDIT_CARD': return 'Cartão de Crédito';
          case 'DEBIT_CARD': return 'Cartão de Débito';
          case 'PIX': return 'Pix';
            case 'CREDIT_STORE': return 'Crédito';
          default: return method;
      }
  };

  // 2. Badges coloridas para o Histórico
  const getPaymentBadge = (method: string) => {
      switch(method) {
          case 'CREDIT_STORE': 
            return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-black border border-purple-200 uppercase flex items-center gap-1 w-fit"><CalendarClock size={10}/> CRÉDITO</span>;
          case 'PIX': 
            return <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-[10px] font-bold border border-teal-200 uppercase flex items-center gap-1 w-fit"><QrCode size={10}/> PIX</span>;
          case 'CREDIT_CARD': 
            return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-200 uppercase flex items-center gap-1 w-fit"><CreditCard size={10}/> CRÉDITO</span>;
          case 'DEBIT_CARD': // Nova opção visual
            return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-bold border border-orange-200 uppercase flex items-center gap-1 w-fit"><CreditCard size={10}/> DÉBITO</span>;
          default: 
            return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200 uppercase flex items-center gap-1 w-fit"><Banknote size={10}/> DINHEIRO</span>;
      }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.isVisible !== false);
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.cpf?.includes(customerSearch));
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="sales" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* CABEÇALHO */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Minhas Vendas</h1>
                        <p className="text-slate-500 text-sm">Escolha o tipo de operação abaixo.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => handleOpenPos('STANDARD')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 flex items-center gap-3 transition transform hover:scale-105">
                            <ShoppingCart size={24} /> REALIZAR VENDA
                        </button>
                        <button onClick={() => handleOpenPos('CREDIT')} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-2xl font-black text-lg shadow-xl shadow-purple-500/30 flex items-center gap-3 transition transform hover:scale-105">
                            <CalendarClock size={24} /> VENDA C/ CRÉDITO
                        </button>
                    </div>
                </div>

                {/* ESTATÍSTICAS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Você vendeu hoje</p>
                            <h3 className="text-3xl font-black text-slate-800">{formatMoney(metrics?.revenueToday || 0)}</h3>
                        </div>
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><DollarSign size={24} /></div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> Seu Desempenho (7 Dias)</h3>
                        </div>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics?.chartData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value: any) => [formatMoney(value), "Vendas"]} />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* TABELA */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-slate-800">Histórico Recente</h3></div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                            <tr><th className="px-6 py-4">Data</th><th className="px-6 py-4">Itens</th><th className="px-6 py-4">Pagamento</th><th className="px-6 py-4 text-right">Total</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {metrics?.recentSales?.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-sm">Sem vendas hoje.</td></tr>
                            ) : (
                                metrics?.recentSales?.map((sale: any) => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-sm text-slate-600"><div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400"/> {new Date(sale.createdAt).toLocaleString('pt-BR')}</div></td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{sale.items.length} produtos</td>
                                        <td className="px-6 py-4">{getPaymentBadge(sale.paymentMethod || 'MONEY')}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">{formatMoney(Number(sale.total))}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --- MODAL DE PDV --- */}
        {isPosOpen && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-[95%] h-[90vh] rounded-3xl shadow-2xl flex overflow-hidden relative">
                    
                    {/* ESQUERDA: CATÁLOGO */}
                    <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200">
                        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
                            <div><h2 className="text-xl font-black text-slate-800">Catálogo</h2><p className="text-xs text-slate-500">Selecione os itens para {saleMode === 'CREDIT' ? 'venda a crédito' : 'venda'}.</p></div>
                            <div className="bg-slate-100 p-2 rounded-xl flex items-center gap-2 border border-slate-200 w-64"><Search className="text-slate-400" size={18} /><input className="bg-transparent outline-none text-sm w-full" placeholder="Buscar produto..." autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
                            {filteredProducts.map(product => (
                                <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock <= 0} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition text-left group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-40">
                                    <div className="flex-1 w-full flex items-center justify-center bg-slate-50 rounded-lg mb-3 overflow-hidden relative">
                                        {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package className="text-slate-300" />}
                                        <div className="absolute bottom-1 right-1 bg-slate-800 text-white text-[10px] font-bold px-1.5 rounded">{product.stock} un</div>
                                    </div>
                                    <h4 className="font-bold text-slate-700 text-xs truncate w-full">{product.name}</h4>
                                    <p className="text-sm font-black text-blue-600 mt-auto">{formatMoney(Number(product.price))}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DIREITA: CARRINHO E CHECKOUT */}
                    <div className="w-96 flex flex-col bg-white h-full relative border-l-8 border-slate-100">
                        
                        {/* Header Carrinho */}
                        <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${saleMode === 'CREDIT' ? 'bg-purple-50' : 'bg-slate-50'}`}>
                            <div>
                                <h2 className={`font-black flex items-center gap-2 ${saleMode === 'CREDIT' ? 'text-purple-800' : 'text-slate-800'}`}>
                                    {saleMode === 'CREDIT' ? <CalendarClock size={20}/> : <ShoppingCart size={20}/>} 
                                    {saleMode === 'CREDIT' ? 'CARRINHO DE CRÉDITO' : 'CARRINHO'}
                                </h2>
                            </div>
                            <button onClick={() => setIsPosOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
                        </div>

                        {/* Seletor Cliente */}
                        <div className="p-4 border-b border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Cliente {saleMode === 'CREDIT' ? '(OBRIGATÓRIO)' : '(OPCIONAL)'}</label>
                                {selectedCustomer && <span className="text-[10px] bg-green-100 text-green-700 px-2 rounded font-bold">OK</span>}
                            </div>
                            
                            {!selectedCustomer ? (
                                <div className="relative">
                                    <button onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)} className={`w-full bg-white border text-slate-500 font-medium py-3 px-3 rounded-xl flex items-center justify-between hover:border-blue-300 transition text-sm ${saleMode === 'CREDIT' ? 'border-purple-300 ring-2 ring-purple-50 text-purple-700' : 'border-slate-200'}`}>
                                        <span className="flex items-center gap-2"><User size={16}/> {saleMode === 'CREDIT' ? 'Selecione o Cliente...' : 'Cliente (Opcional)'}</span><Plus size={14}/>
                                    </button>
                                    {isCustomerDropdownOpen && (
                                        <div className="absolute top-12 left-0 w-full bg-white shadow-xl border border-slate-100 rounded-xl p-2 z-50 max-h-60 overflow-y-auto">
                                            <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none mb-2" placeholder="Buscar..." autoFocus value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                                            {saleMode === 'STANDARD' && <button onClick={() => { setSelectedCustomer(null); setIsCustomerDropdownOpen(false); }} className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-sm text-slate-500 font-medium border-b border-slate-50 mb-1">-- Sem Cliente --</button>}
                                            {filteredCustomers.map(c => (
                                                <button key={c.id} onClick={() => { setSelectedCustomer(c); setIsCustomerDropdownOpen(false); }} className="w-full text-left p-2 hover:bg-blue-50 rounded-lg text-sm text-slate-700 font-medium">{c.name}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex justify-between items-center animate-in fade-in">
                                    <div><p className="font-bold text-blue-900 text-sm">{selectedCustomer.name}</p><p className="text-[10px] text-blue-600">{selectedCustomer.cpf || 'Sem CPF'}</p></div>
                                    <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-blue-100 rounded text-blue-500"><X size={14}/></button>
                                </div>
                            )}
                        </div>

                        {/* Lista de Itens */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2"><ShoppingCart size={48} /><p className="text-sm">Carrinho vazio</p></div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex-1 min-w-0 mr-2"><p className="text-xs font-bold text-slate-700 truncate">{item.name}</p><p className="text-[10px] text-slate-500">{formatMoney(Number(item.price))} un</p></div>
                                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Minus size={12}/></button>
                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Plus size={12}/></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="ml-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* --- FOOTER (PAGAMENTO SEPARADO) --- */}
                        <div className="p-6 bg-slate-50 border-t border-slate-200">
                            
                            {/* Seletor de Pagamento Atualizado */}
                            {saleMode === 'STANDARD' && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Forma de Pagamento</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        
                                        <button onClick={() => setPaymentMethod('MONEY')} className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'MONEY' ? 'border-emerald-500 bg-emerald-100 text-emerald-700' : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-100'}`}>
                                            <Banknote size={16}/> DINHEIRO
                                        </button>
                                        
                                        <button onClick={() => setPaymentMethod('PIX')} className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'PIX' ? 'border-teal-500 bg-teal-100 text-teal-700' : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-100'}`}>
                                            <QrCode size={16}/> PIX
                                        </button>

                                        <button onClick={() => setPaymentMethod('CREDIT_CARD')} className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'CREDIT_CARD' ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-100'}`}>
                                            <CreditCard size={16}/> CRÉDITO
                                        </button>

                                        {/* NOVA OPÇÃO: DÉBITO */}
                                        <button onClick={() => setPaymentMethod('DEBIT_CARD')} className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition ${paymentMethod === 'DEBIT_CARD' ? 'border-orange-500 bg-orange-100 text-orange-700' : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-100'}`}>
                                            <CreditCard size={16}/> DÉBITO
                                        </button>

                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-end mb-4"><span className="text-slate-500 text-sm font-medium">Total</span><span className="text-2xl font-black text-slate-900">{formatMoney(cartTotal)}</span></div>
                            
                            <button 
                                onClick={handleFinishSale} 
                                disabled={cart.length === 0 || (saleMode === 'CREDIT' && !selectedCustomer) || isSubmitting} 
                                className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed ${saleMode === 'CREDIT' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
                            >
                                {isSubmitting ? 'Processando...' : (saleMode === 'CREDIT' ? 'FINALIZAR COM CRÉDITO' : 'FINALIZAR VENDA')} <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* MODAL SUCESSO (ATUALIZADA COM NOME AMIGÁVEL) */}
                    {showSuccessModal && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                            <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} className="animate-bounce" /></div>
                                <h3 className="text-2xl font-black text-slate-800 mb-1">Venda Concluída!</h3>
                                {/* Aqui usamos a função tradutora */}
                                <p className="text-slate-500 font-bold text-sm">
                                    Registrado como {saleMode === 'CREDIT' ? 'Crédito' : getPaymentLabel(paymentMethod)}.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
