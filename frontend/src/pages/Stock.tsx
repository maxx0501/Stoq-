import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Package, Search, ArrowDownCircle, ArrowUpCircle, AlertTriangle, CheckCircle, TrendingUp, ChevronLeft, ChevronRight, History, Calendar, Trash2 } from 'lucide-react';

export const Stock = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ENTRY' | 'LOSS'>('ENTRY'); // Controla se é entrada ou saída
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Formulário
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [reason, setReason] = useState(''); // Novo campo: Motivo da perda

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [histPage, setHistPage] = useState(1);
  const histPerPage = 5;

  useEffect(() => {
    fetchStock();
    fetchHistory();
  }, []);

  const fetchStock = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
      const res = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setProducts(await res.json());
    } catch (error) { console.error(error); }
  };

  const fetchHistory = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
      const res = await fetch(`${API_URL}/stock/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch (error) { console.error(error); }
  };

  const openModal = (type: 'ENTRY' | 'LOSS') => {
    setModalType(type);
    setQty(''); setCost(''); setReason(''); setSelectedProductId('');
    setIsModalOpen(true);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !qty) return alert("Preencha os campos obrigatórios.");
    if (modalType === 'LOSS' && !reason) return alert("Informe o motivo da perda.");
    setShowConfirmModal(true);
  };

  const confirmTransaction = async () => {
    try {
      const token = localStorage.getItem('stoq_token');
      const res = await fetch(`${API_URL}/stock/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            productId: selectedProductId, 
            quantity: qty, 
            newCostPrice: cost,
            type: modalType, // Envia se é ENTRY ou LOSS
            reason: reason   // Envia o motivo
        })
      });

      if (res.ok) {
        setShowConfirmModal(false);
        setIsModalOpen(false);
        setShowSuccessModal(true);
        fetchStock();
        fetchHistory();
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        const err = await res.json();
        alert("Erro: " + (err.error || "Falha na operação."));
        setShowConfirmModal(false);
      }
    } catch (error) { alert("Erro de conexão."); }
  };

  // Filtros e Paginação
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentHistory = history.slice((histPage - 1) * histPerPage, histPage * histPerPage);
  const totalHistPages = Math.ceil(history.length / histPerPage);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="stock" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-[1600px] mx-auto space-y-8">
                
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <Package className="text-blue-600" /> Controle de Estoque
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Gerencie entradas e perdas de mercadoria.</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Botão de Perda */}
                        <button 
                            onClick={() => openModal('LOSS')}
                            className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition"
                        >
                            <Trash2 size={20} /> Registrar Perda
                        </button>
                        {/* Botão de Entrada */}
                        <button 
                            onClick={() => openModal('ENTRY')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-1"
                        >
                            <ArrowDownCircle size={20} /> Receber Mercadoria
                        </button>
                    </div>
                </div>

                {/* KPIs (Iguais ao anterior) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase">Valor em Estoque (Custo)</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">
                            {formatMoney(products.reduce((acc, p) => acc + (Number(p.costPrice||0) * Number(p.stock)), 0))}
                        </h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase">Itens com Estoque Baixo</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{products.filter(p => p.stock <= (p.minStock || 5)).length} produtos</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase">Total de SKUs</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{products.length} itens</h3>
                    </div>
                </div>

                {/* Tabela Estoque Atual */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3 bg-white border border-slate-200 px-3 py-2 rounded-lg w-full max-w-md">
                            <Search className="text-slate-400" size={18} />
                            <input className="bg-transparent outline-none text-sm flex-1 font-medium" placeholder="Buscar produto..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                        </div>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition"><ChevronLeft size={16}/></button>
                            <span className="text-xs font-bold text-slate-500">Pág {currentPage} de {totalPages || 1}</span>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Qtd. Atual</th>
                                <th className="px-6 py-4 text-right">Custo Unit.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {currentProducts.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        {p.stock <= (p.minStock || 5) ? 
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><AlertTriangle size={10}/> Baixo</span> : 
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle size={10}/> Ok</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800">{p.stock}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{formatMoney(Number(p.costPrice || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Tabela Histórico (Com Tipo e Motivo) */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg"><History className="text-slate-400"/> Histórico de Movimentações</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Produto</th>
                                    <th className="px-6 py-4 text-center">Qtd.</th>
                                    <th className="px-6 py-4">Motivo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {currentHistory.map((entry: any) => {
                                    const isLoss = entry.entryType === 'LOSS';
                                    return (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-300"/>
                                                {new Date(entry.createdAt).toLocaleDateString('pt-BR')} <span className="text-[10px] bg-slate-100 px-1 rounded">{new Date(entry.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isLoss ? 
                                                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowUpCircle size={12} className="rotate-180"/> Saída</span> :
                                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowDownCircle size={12}/> Entrada</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{entry.product?.name || 'Item excluído'}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800">
                                                {isLoss ? '-' : '+'}{entry.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs italic">{entry.reason || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {/* Paginação Histórico */}
                        {totalHistPages > 1 && (
                            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-center gap-2">
                                <button disabled={histPage === 1} onClick={() => setHistPage(p => p - 1)} className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 transition"><ChevronLeft size={16}/></button>
                                <span className="text-xs font-bold text-slate-500 py-1.5">Pág {histPage}</span>
                                <button disabled={histPage === totalHistPages} onClick={() => setHistPage(p => p + 1)} className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 transition"><ChevronRight size={16}/></button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>

        {/* --- MODAL DE MOVIMENTAÇÃO (Adapta para Entrada ou Saída) --- */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in zoom-in duration-200">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">
                    <h2 className={`text-xl font-black mb-6 flex items-center gap-2 ${modalType === 'ENTRY' ? 'text-slate-800' : 'text-red-600'}`}>
                        {modalType === 'ENTRY' ? <><ArrowDownCircle className="text-emerald-600" /> Nova Entrada</> : <><Trash2 /> Registrar Perda</>}
                    </h2>
                    
                    <form onSubmit={handlePreSubmit} className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Produto</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                                value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} required>
                                <option value="">Selecione...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Atual: {p.stock})</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Quantidade</label>
                                <input type="number" min="1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={qty} onChange={e => setQty(e.target.value)} required />
                            </div>
                            {modalType === 'ENTRY' ? (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Novo Custo (R$)</label>
                                    <input type="number" step="0.01" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Opcional" value={cost} onChange={e => setCost(e.target.value)} />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Motivo</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                                        value={reason} onChange={e => setReason(e.target.value)} required>
                                        <option value="">Selecione...</option>
                                        <option value="Validade">Vencimento / Validade</option>
                                        <option value="Avaria">Avaria / Quebra</option>
                                        <option value="Uso Interno">Uso Interno / Consumo</option>
                                        <option value="Furto">Furto / Roubo</option>
                                        <option value="Ajuste">Ajuste de Inventário</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className={`p-4 rounded-xl text-xs flex gap-2 items-start ${modalType === 'ENTRY' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                            <TrendingUp size={16} className="shrink-0 mt-0.5"/>
                            <p>{modalType === 'ENTRY' ? 'O estoque será somado automaticamente.' : 'O item será descontado do estoque e registrado como perda.'}</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition">Cancelar</button>
                            <button type="submit" className={`flex-1 py-3 text-white font-black rounded-xl shadow-lg transition ${modalType === 'ENTRY' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'}`}>
                                Confirmar {modalType === 'ENTRY' ? 'Entrada' : 'Baixa'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL CONFIRMAÇÃO --- */}
        {showConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in zoom-in duration-200">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalType === 'ENTRY' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Confirmar {modalType === 'ENTRY' ? 'Entrada' : 'Baixa'}?</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        {modalType === 'ENTRY' ? 'Você está adicionando itens.' : 'Esses itens sairão do estoque sem gerar receita.'}
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Voltar</button>
                        <button onClick={confirmTransaction} className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg ${modalType === 'ENTRY' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL SUCESSO --- */}
        {showSuccessModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={48} className="animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">Sucesso!</h3>
                    <p className="text-slate-500 font-bold">Estoque atualizado.</p>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};
