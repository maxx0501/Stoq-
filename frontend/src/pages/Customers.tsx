import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Users, Search, Plus, Trash2, Edit, Phone, User, CheckCircle, FileText, CalendarClock, DollarSign, ChevronRight, X, Printer, Loader2, AlertCircle } from 'lucide-react';
import { printReceipt } from '../utils/printReceipt';

export const Customers = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  // --- ESTADOS GERAIS ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADOS DE CRIAÇÃO/EDIÇÃO ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', email: '', phone: '', cpf: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);

  // --- ESTADOS DE HISTÓRICO E PAGAMENTO ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<any[]>([]);
  const [currentCustomerName, setCurrentCustomerName] = useState('');
  const [historyTab, setHistoryTab] = useState<'ALL' | 'DEBTS'>('ALL');

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  // --- ESTADOS DE FEEDBACK (MODAL EM VEZ DE ALERT) ---
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => { 
    fetchCustomers(); 
    fetchDebts();
  }, []);

  const fetchCustomers = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/customers`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchDebts = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
        const res = await fetch(`${API_URL}/sales/debts`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setDebts(await res.json());
    } catch (e) { console.error(e); }
  };

  // --- HELPER DE FEEDBACK ---
  const showFeedback = (type: 'success' | 'error', message: string) => {
      setFeedback({ type, message });
      // Se for sucesso, fecha sozinho depois de 2s. Se for erro, espera o usuário fechar.
      if (type === 'success') {
          setTimeout(() => setFeedback(null), 2000);
      }
  };

  // --- AÇÕES DO CLIENTE (HISTÓRICO) ---
  const handleOpenHistory = async (customer: any) => {
      setCurrentCustomerName(customer.name);
      setHistoryTab('ALL');
      setIsHistoryOpen(true);
      
      const token = localStorage.getItem('stoq_token');
      try {
          const res = await fetch(`${API_URL}/customers/${customer.id}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) setSelectedCustomerHistory(await res.json());
      } catch (error) {
          console.error("Erro ao carregar histórico", error);
      }
  };

  // --- AÇÕES DE PAGAMENTO (BAIXA) ---
  const handleOpenPay = (sale: any) => {
      setSelectedDebt(sale);
      setIsPayModalOpen(true);
  };

  const confirmPayment = async () => {
      if (!selectedDebt) return;
      const token = localStorage.getItem('stoq_token');
      
      try {
          const res = await fetch(`${API_URL}/sales/${selectedDebt.id}/pay`, { 
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` } 
          });

          if (res.ok) {
              showFeedback('success', "Pagamento confirmado com sucesso!");
              setIsPayModalOpen(false);
              setIsHistoryOpen(false); 
              fetchCustomers(); 
              fetchDebts(); 
          } else {
              throw new Error();
          }
      } catch (error) {
          showFeedback('error', "Erro ao processar o pagamento. Tente novamente.");
      }
  };

  // --- MÁSCARAS ---
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);
  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  // --- FORMULÁRIO (SALVAR) ---
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return showFeedback('error', "O nome é obrigatório.");

    setIsSaving(true);
    const token = localStorage.getItem('stoq_token');
    const url = isEditMode ? `${API_URL}/customers/${form.id}` : `${API_URL}/customers`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { 
            method, 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
            body: JSON.stringify(form) 
        });

        if (res.ok) {
            setIsFormOpen(false);
            fetchCustomers();
            showFeedback('success', isEditMode ? "Cliente atualizado!" : "Cliente cadastrado!");
        } else {
            const data = await res.json();
            showFeedback('error', data.error || "Erro ao salvar cliente.");
        }
    } catch (error) {
        showFeedback('error', "Erro de conexão com o servidor.");
    } finally {
        setIsSaving(false);
    }
  };

  // --- DELETAR ---
  const handleDelete = async (e: any, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Substituindo o confirm nativo por um check rápido, idealmente seria outra modal, 
    // mas vamos manter simples com confirm por enquanto, mas com feedback de erro visual.
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    
    const token = localStorage.getItem('stoq_token');
    try {
        const res = await fetch(`${API_URL}/customers/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` } 
        });

        if (res.ok) {
            fetchCustomers();
            showFeedback('success', "Cliente removido.");
        } else {
            // Geralmente falha se tiver vendas vinculadas
            showFeedback('error', "Não é possível excluir clientes que possuem histórico de vendas.");
        }
    } catch (error) {
        showFeedback('error', "Erro ao excluir cliente.");
    }
  };

  // --- FILTROS ---
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm));
  const filteredHistory = historyTab === 'ALL' ? selectedCustomerHistory : selectedCustomerHistory.filter(s => s.paymentMethod === 'CREDIT_STORE' && s.status === 'PENDING');

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="customers" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-[1400px] mx-auto space-y-10">
                
                {/* --- SEÇÃO 1: GESTÃO DE CLIENTES --- */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Users className="text-blue-600" /> Meus Clientes</h1>
                            <p className="text-slate-500 text-sm mt-1">Gerencie sua base de contatos e visualize históricos.</p>
                        </div>
                        <button onClick={() => { setForm({ id: '', name: '', email: '', phone: '', cpf: '', address: '' }); setIsEditMode(false); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition">
                            <Plus size={20} /> Novo Cliente
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <Search className="text-slate-400" size={20} />
                        <input className="flex-1 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400" placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    {isLoading ? (
                        <div className="text-center py-10 text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/> Carregando clientes...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCustomers.map(customer => (
                                <div key={customer.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg">{customer.name[0].toUpperCase()}</div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 line-clamp-1">{customer.name}</h3>
                                                <p className="text-xs text-slate-400 font-medium">Desde {formatDate(customer.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => { setForm(customer); setIsEditMode(true); setIsFormOpen(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600" title="Editar cliente"><Edit size={16}/></button>
                                            <button type="button" onClick={(e) => handleDelete(e, customer.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600" title="Deletar cliente"><Trash2 size={16}/></button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-600 mb-6">
                                        {customer.phone ? <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {customer.phone}</div> : <div className="flex items-center gap-2 text-slate-300"><Phone size={14}/> Sem telefone</div>}
                                        {customer.cpf ? <div className="flex items-center gap-2"><User size={14} className="text-slate-400"/> {customer.cpf}</div> : <div className="flex items-center gap-2 text-slate-300"><User size={14}/> Sem CPF</div>}
                                    </div>

                                    <button 
                                        onClick={() => handleOpenHistory(customer)}
                                        className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                                    >
                                        <FileText size={14}/> Ver Histórico de Compras
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- SEÇÃO 2: TABELA GERAL DE VENDAS A CRÉDITO --- */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-purple-50/30 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <CalendarClock className="text-purple-600" /> Controle de Vendas a Crédito
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Todas as contas pendentes da loja.</p>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Total a Receber</span>
                            <span className="text-lg font-black text-purple-700">{formatMoney(debts.reduce((acc, d) => acc + Number(d.total), 0))}</span>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                            <tr>
                                <th className="px-8 py-4">Cliente</th>
                                <th className="px-8 py-4">Vencimento</th>
                                <th className="px-8 py-4">Valor</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {debts.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma dívida pendente! 🎉</td></tr>
                            ) : (
                                debts.map(debt => {
                                    const isLate = new Date() > new Date(debt.dueDate);
                                    return (
                                        <tr key={debt.id} className="hover:bg-purple-50/30 transition group cursor-pointer" onClick={() => handleOpenPay(debt)}>
                                            <td className="px-8 py-4 font-bold text-slate-700">{debt.customer?.name}</td>
                                            <td className="px-8 py-4 text-slate-500">
                                                {debt.dueDate ? formatDate(debt.dueDate) : '-'}
                                            </td>
                                            <td className="px-8 py-4 font-black text-slate-800">{formatMoney(Number(debt.total))}</td>
                                            <td className="px-8 py-4 text-center">
                                                {isLate ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase"><AlertCircle size={10}/> Atrasado</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase"><CalendarClock size={10}/> No Prazo</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <button className="text-blue-600 font-bold text-xs hover:underline flex items-center justify-end gap-1">
                                                    Abrir <ChevronRight size={14}/>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>

        {/* --- MODAL 1: FORMULÁRIO DE CLIENTE (Email e Endereço Opcionais) --- */}
        {isFormOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">
                    <h2 className="text-xl font-black text-slate-800 mb-6">{isEditMode ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                    <form onSubmit={handleSaveCustomer} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Completo *</label>
                            <input className="input-padrao" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ex: Maria Silva" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">CPF (Opcional)</label>
                                <input className="input-padrao" value={form.cpf} onChange={e => setForm({...form, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={14} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Telefone (Opcional)</label>
                                <input className="input-padrao" value={form.phone} onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" maxLength={15} />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail (Opcional)</label>
                            <input className="input-padrao" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="exemplo@email.com" />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Endereço (Opcional)</label>
                            <input className="input-padrao" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Rua, Número, Bairro..." />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="btn-primary flex justify-center">
                                {isSaving ? <Loader2 className="animate-spin" size={20}/> : "Salvar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL 2: HISTÓRICO DO CLIENTE (Com botão de fechar) --- */}
        {isHistoryOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                <div className="bg-white w-full max-w-2xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                    
                    {/* Header do Histórico */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                <FileText className="text-blue-600"/> Histórico de Compras
                            </h2>
                            <p className="text-sm text-slate-500">Cliente: <strong>{currentCustomerName}</strong></p>
                        </div>
                        <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Abas */}
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setHistoryTab('ALL')} className={`flex-1 py-3 text-sm font-bold transition ${historyTab === 'ALL' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>Todas as Vendas</button>
                        <button onClick={() => setHistoryTab('DEBTS')} className={`flex-1 py-3 text-sm font-bold transition ${historyTab === 'DEBTS' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>Apenas Créditos (Pendente)</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-20 text-slate-400"><FileText size={48} className="mx-auto mb-2 opacity-20"/><p>Nenhum registro encontrado nesta aba.</p></div>
                        ) : (
                            filteredHistory.map(sale => (
                                <div key={sale.id} className={`p-4 rounded-2xl border flex justify-between items-center ${sale.status === 'PENDING' ? 'bg-purple-50 border-purple-100' : 'bg-white border-slate-100'}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800 text-sm">{formatDate(sale.createdAt)}</span>
                                            {sale.status === 'PENDING' && <span className="bg-purple-200 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">PENDENTE</span>}
                                            {sale.status === 'PAID' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">PAGO</span>}
                                        </div>
                                        <p className="text-xs text-slate-500">{sale.items.length} itens</p>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-2">
                                        <p className="font-black text-lg text-slate-800">{formatMoney(Number(sale.total))}</p>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => printReceipt({ ...sale, customer: { name: currentCustomerName } }, storeName)}
                                                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-1 rounded-lg transition"
                                                title="Imprimir Recibo"
                                            >
                                                <Printer size={12}/> Recibo
                                            </button>

                                            {sale.status === 'PENDING' && (
                                                <button onClick={() => handleOpenPay(sale)} className="text-xs font-bold text-blue-600 hover:underline">Pagar Agora</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL 3: PAGAMENTO DE DÍVIDA --- */}
        {isPayModalOpen && selectedDebt && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in zoom-in duration-200">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center relative">
                    <button onClick={() => setIsPayModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
                        <DollarSign size={40} />
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-800 mb-1">Receber Valor</h3>
                    <p className="text-slate-500 text-sm mb-6">Confirma o recebimento deste pagamento em aberto?</p>

                    <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Total</p>
                        <p className="text-3xl font-black text-slate-900">{formatMoney(Number(selectedDebt.total))}</p>
                        <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                            <span>Vencimento:</span>
                            <span className="font-bold">{selectedDebt.dueDate ? formatDate(selectedDebt.dueDate) : '-'}</span>
                        </div>
                    </div>

                    <button onClick={confirmPayment} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg shadow-green-500/30 transition transform active:scale-95 flex items-center justify-center gap-2">
                        <CheckCircle size={20}/> Confirmar Baixa
                    </button>
                </div>
            </div>
        )}

        {/* --- MODAL GLOBAL DE FEEDBACK (SUBSTITUI ALERTS) --- */}
        {feedback && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-200">
                <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center relative">
                    {feedback.type === 'error' && (
                        <button onClick={() => setFeedback(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    )}
                    
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {feedback.type === 'success' ? <CheckCircle size={32}/> : <AlertCircle size={32}/>}
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-2">{feedback.type === 'success' ? 'Sucesso!' : 'Atenção'}</h3>
                    <p className="text-slate-500 font-medium text-sm">{feedback.message}</p>
                </div>
            </div>
        )}

        {/* CSS GLOBAL PARA INPUTS */}
        <style>{`
            .input-padrao { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem; outline: none; font-weight: 500; color: #334155; transition: 0.2s; }
            .input-padrao:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
            .btn-primary { flex: 1; padding: 0.75rem; background: #2563eb; color: white; font-weight: bold; border-radius: 0.75rem; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
            .btn-primary:hover { background: #1d4ed8; }
            .btn-secondary { flex: 1; padding: 0.75rem; font-weight: bold; color: #64748b; border-radius: 0.75rem; transition: 0.2s; background: #f1f5f9; }
            .btn-secondary:hover { background: #e2e8f0; }
        `}</style>

      </main>
    </div>
  );
};
