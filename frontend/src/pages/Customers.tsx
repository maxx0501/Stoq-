import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'https://stoqplus.com.br';
import { Layout } from '../components/Layout';
import { Users, Search, Plus, Trash2, Edit, Phone, User, CheckCircle, FileText, CalendarClock, DollarSign, ChevronRight, X, Printer, Loader2, AlertCircle } from 'lucide-react';
import { printReceipt } from '../utils/printReceipt';

export const Customers = ({ onNavigate, onLogout, user, storeName, setUser, toggleTheme, currentTheme }: any) => {
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
    <Layout active="customers" onNavigate={onNavigate} onLogout={onLogout} user={user} storeName={storeName} setUser={setUser} toggleTheme={toggleTheme} currentTheme={currentTheme}>
            <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-10">

                {/* --- SEÇÃO 1: GESTÃO DE CLIENTES --- */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Users className="text-blue-600" /> Meus Clientes</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie sua base de contatos e visualize históricos.</p>
                        </div>
                        <button onClick={() => { setForm({ id: '', name: '', email: '', phone: '', cpf: '', address: '' }); setIsEditMode(false); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition">
                            <Plus size={20} /> Novo Cliente
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                        <Search className="text-slate-400" size={20} />
                        <input className="flex-1 outline-none text-sm font-medium text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder-slate-400 bg-transparent" placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    {isLoading ? (
                        <div className="text-center py-10 text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/> Carregando clientes...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCustomers.map(customer => (
                                <div key={customer.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg">{customer.name[0].toUpperCase()}</div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">{customer.name}</h3>
                                                <p className="text-xs text-slate-400 font-medium">Desde {formatDate(customer.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => { setForm(customer); setIsEditMode(true); setIsFormOpen(true); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-slate-400 hover:text-blue-600" title="Editar cliente"><Edit size={16}/></button>
                                            <button type="button" onClick={(e) => handleDelete(e, customer.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-600" title="Deletar cliente"><Trash2 size={16}/></button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-6">
                                        {customer.phone ? <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {customer.phone}</div> : <div className="flex items-center gap-2 text-slate-300 dark:text-slate-500"><Phone size={14}/> Sem telefone</div>}
                                        {customer.cpf ? <div className="flex items-center gap-2"><User size={14} className="text-slate-400"/> {customer.cpf}</div> : <div className="flex items-center gap-2 text-slate-300 dark:text-slate-500"><User size={14}/> Sem CPF</div>}
                                    </div>

                                    <button
                                        onClick={() => handleOpenHistory(customer)}
                                        className="w-full py-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                                    >
                                        <FileText size={14}/> Ver Histórico de Compras
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- SEÇÃO 2: TABELA GERAL DE VENDAS A CRÉDITO --- */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 md:p-8 border-b border-slate-100 dark:border-slate-700 bg-purple-50/30 dark:bg-purple-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <CalendarClock className="text-purple-600" /> Controle de Vendas a Crédito
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Todas as contas pendentes da loja.</p>
                        </div>
                        <div className="bg-white dark:bg-slate-700 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Total a Receber</span>
                            <span className="text-lg font-black text-purple-700">{formatMoney(debts.reduce((acc, d) => acc + Number(d.total), 0))}</span>
                        </div>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700 text-xs font-bold text-slate-400 uppercase">
                            <tr>
                                <th className="px-8 py-4">Cliente</th>
                                <th className="px-8 py-4">Vencimento</th>
                                <th className="px-8 py-4">Valor</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                            {debts.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma dívida pendente! 🎉</td></tr>
                            ) : (
                                debts.map(debt => {
                                    const isLate = new Date() > new Date(debt.dueDate);
                                    return (
                                        <tr key={debt.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition group cursor-pointer" onClick={() => handleOpenPay(debt)}>
                                            <td className="px-8 py-4 font-bold text-slate-700 dark:text-slate-200">{debt.customer?.name}</td>
                                            <td className="px-8 py-4 text-slate-500 dark:text-slate-400">
                                                {debt.dueDate ? formatDate(debt.dueDate) : '-'}
                                            </td>
                                            <td className="px-8 py-4 font-black text-slate-800 dark:text-white">{formatMoney(Number(debt.total))}</td>
                                            <td className="px-8 py-4 text-center">
                                                {isLate ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase"><AlertCircle size={10}/> Atrasado</span>
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

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                        {debts.length === 0 ? (
                            <p className="p-8 text-center text-slate-400">Nenhuma dívida pendente! 🎉</p>
                        ) : (
                            debts.map(debt => {
                                const isLate = new Date() > new Date(debt.dueDate);
                                return (
                                    <div key={debt.id} className="p-4 space-y-2 active:bg-purple-50/30 dark:active:bg-purple-900/10 cursor-pointer" onClick={() => handleOpenPay(debt)}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{debt.customer?.name}</span>
                                            {isLate ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase"><AlertCircle size={10}/> Atrasado</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase"><CalendarClock size={10}/> No Prazo</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">{debt.dueDate ? formatDate(debt.dueDate) : '-'}</span>
                                            <span className="font-black text-slate-800 dark:text-white">{formatMoney(Number(debt.total))}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

        {/* --- MODAL 1: FORMULÁRIO DE CLIENTE (Email e Endereço Opcionais) --- */}
        {isFormOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">{isEditMode ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                        <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition"><X size={20} className="text-slate-400"/></button>
                    </div>
                    <form onSubmit={handleSaveCustomer} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Completo *</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition dark:placeholder-slate-400" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ex: Maria Silva" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">CPF (Opcional)</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition dark:placeholder-slate-400" value={form.cpf} onChange={e => setForm({...form, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={14} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Telefone (Opcional)</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition dark:placeholder-slate-400" value={form.phone} onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" maxLength={15} />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail (Opcional)</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition dark:placeholder-slate-400" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="exemplo@email.com" />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Endereço (Opcional)</label>
                            <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition dark:placeholder-slate-400" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Rua, Número, Bairro..." />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition active:scale-95 flex justify-center">
                                {isSaving ? <Loader2 className="animate-spin" size={20}/> : "Salvar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL 2: HISTÓRICO DO CLIENTE (Com botão de fechar) --- */}
        {isHistoryOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 w-full max-w-2xl h-[85vh] md:h-[80vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">

                    {/* Header do Histórico */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700">
                        <div>
                            <h2 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                <FileText className="text-blue-600"/> Histórico de Compras
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Cliente: <strong>{currentCustomerName}</strong></p>
                        </div>
                        <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition text-slate-500 dark:text-slate-400">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Abas */}
                    <div className="flex border-b border-slate-100 dark:border-slate-700">
                        <button onClick={() => setHistoryTab('ALL')} className={`flex-1 py-3 text-sm font-bold transition ${historyTab === 'ALL' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Todas as Vendas</button>
                        <button onClick={() => setHistoryTab('DEBTS')} className={`flex-1 py-3 text-sm font-bold transition ${historyTab === 'DEBTS' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50 dark:bg-purple-900/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Apenas Créditos (Pendente)</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-20 text-slate-400"><FileText size={48} className="mx-auto mb-2 opacity-20"/><p>Nenhum registro encontrado nesta aba.</p></div>
                        ) : (
                            filteredHistory.map(sale => (
                                <div key={sale.id} className={`p-4 rounded-2xl border flex justify-between items-center ${sale.status === 'PENDING' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800 dark:text-white text-sm">{formatDate(sale.createdAt)}</span>
                                            {sale.status === 'PENDING' && <span className="bg-purple-200 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">PENDENTE</span>}
                                            {sale.status === 'PAID' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">PAGO</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{sale.items.length} itens</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <p className="font-black text-lg text-slate-800 dark:text-white">{formatMoney(Number(sale.total))}</p>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => printReceipt({ ...sale, customer: { name: currentCustomerName } }, storeName)}
                                                className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg transition"
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
                <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center relative">
                    <button onClick={() => setIsPayModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>

                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
                        <DollarSign size={40} />
                    </div>

                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">Receber Valor</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Confirma o recebimento deste pagamento em aberto?</p>

                    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Total</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{formatMoney(Number(selectedDebt.total))}</p>
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
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
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center relative">
                    {feedback.type === 'error' && (
                        <button onClick={() => setFeedback(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>
                    )}

                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {feedback.type === 'success' ? <CheckCircle size={32}/> : <AlertCircle size={32}/>}
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{feedback.type === 'success' ? 'Sucesso!' : 'Atenção'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{feedback.message}</p>
                </div>
            </div>
        )}

    </Layout>
  );
};
