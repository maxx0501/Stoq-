import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Users, Search, Plus, Trash2, Edit, Phone, User, CheckCircle, FileText, CalendarClock, DollarSign, AlertCircle, ChevronRight, X, Printer } from 'lucide-react';
import { printReceipt } from '../utils/printReceipt';

export const Customers = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  // --- ESTADOS GERAIS ---
  const [customers, setCustomers] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]); // Lista geral de fiados
  const [searchTerm, setSearchTerm] = useState('');


  // --- ESTADOS DE CRIAÇÃO/EDIÇÃO ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', email: '', phone: '', cpf: '', address: '' });

  // --- ESTADOS DE HISTÓRICO E PAGAMENTO ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<any[]>([]);
  const [currentCustomerName, setCurrentCustomerName] = useState('');
  const [historyTab, setHistoryTab] = useState<'ALL' | 'DEBTS'>('ALL'); // Abas do modal

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => { 
    fetchCustomers(); 
    fetchDebts();
  }, []);

  const fetchCustomers = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
        const res = await fetch('http://localhost:3333/customers', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchDebts = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
        const res = await fetch('http://localhost:3333/sales/debts', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setDebts(await res.json());
    } catch (e) { console.error(e); }
  };

  // --- AÇÕES DO CLIENTE (HISTÓRICO) ---
  const handleOpenHistory = async (customer: any) => {
      setCurrentCustomerName(customer.name);
      setHistoryTab('ALL');
      setIsHistoryOpen(true);
      
      const token = localStorage.getItem('stoq_token');
      const res = await fetch(`http://localhost:3333/customers/${customer.id}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSelectedCustomerHistory(await res.json());
  };

  // --- AÇÕES DE PAGAMENTO (BAIXA) ---
  const handleOpenPay = (sale: any) => {
      setSelectedDebt(sale);
      setIsPayModalOpen(true);
  };

  const confirmPayment = async () => {
      if (!selectedDebt) return;
      const token = localStorage.getItem('stoq_token');
      const res = await fetch(`http://localhost:3333/sales/${selectedDebt.id}/pay`, { 
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` } 
      });

      if (res.ok) {
          alert("Pagamento confirmado!");
          setIsPayModalOpen(false);
          setIsHistoryOpen(false); // Fecha histórico se estiver aberto
          fetchCustomers(); // Atualiza contadores
          fetchDebts(); // Atualiza tabela de baixo
      } else {
          alert("Erro ao processar pagamento.");
      }
  };

  // --- MÁSCARAS ---
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").slice(0, 15);
  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  // --- FORMULÁRIO ---
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('stoq_token');
    const url = isEditMode ? `http://localhost:3333/customers/${form.id}` : 'http://localhost:3333/customers';
    const method = isEditMode ? 'PUT' : 'POST';

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(form) });
    if (res.ok) {
        setIsFormOpen(false);
        fetchCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    const token = localStorage.getItem('stoq_token');
    await fetch(`http://localhost:3333/customers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchCustomers();
  };

  // --- FILTROS ---
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm));
  const filteredHistory = historyTab === 'ALL' ? selectedCustomerHistory : selectedCustomerHistory.filter(s => s.paymentMethod === 'CREDIT_STORE' && s.status === 'PENDING');

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="customers" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCustomers.map(customer => (
                            <div key={customer.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg">{customer.name[0].toUpperCase()}</div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{customer.name}</h3>
                                            <p className="text-xs text-slate-400 font-medium">Cadastrado em {formatDate(customer.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => { setForm(customer); setIsEditMode(true); setIsFormOpen(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600 mb-6">
                                    {customer.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {customer.phone}</div>}
                                    {customer.cpf && <div className="flex items-center gap-2"><User size={14} className="text-slate-400"/> {customer.cpf}</div>}
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
                </div>

                {/* --- SEÇÃO 2: TABELA GERAL DE FIADOS --- */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-purple-50/30 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <CalendarClock className="text-purple-600" /> Controle de Fiados
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

        {/* --- MODAL 1: FORMULÁRIO DE CLIENTE --- */}
        {isFormOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">
                    <h2 className="text-xl font-black text-slate-800 mb-6">{isEditMode ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                    <form onSubmit={handleSaveCustomer} className="space-y-4">
                        <input className="input-padrao" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Nome Completo *" />
                        <div className="grid grid-cols-2 gap-4">
                            <input className="input-padrao" value={form.cpf} onChange={e => setForm({...form, cpf: maskCPF(e.target.value)})} placeholder="CPF" maxLength={14} />
                            <input className="input-padrao" value={form.phone} onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} placeholder="Telefone" maxLength={15} />
                        </div>
                        <input className="input-padrao" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="E-mail" />
                        <input className="input-padrao" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Endereço" />
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-primary">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL 2: HISTÓRICO DO CLIENTE --- */}
        {isHistoryOpen && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
        <div className="bg-white w-full max-w-2xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* ... header e abas iguais ao anterior ... */}

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
                                <p className="text-xs text-slate-500">{sale.items.length} itens (Ex: {sale.items[0]?.product?.name}...)</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                                <p className="font-black text-lg text-slate-800">{formatMoney(Number(sale.total))}</p>
                                
                                <div className="flex gap-2">
                                    {/* BOTÃO DE IMPRIMIR RECIBO */}
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

        {/* --- MODAL 3: PAGAMENTO DE DÍVIDA (Abre ao clicar na tabela ou no histórico) --- */}
        {isPayModalOpen && selectedDebt && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in zoom-in duration-200">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center relative">
                    <button onClick={() => setIsPayModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
                        <DollarSign size={40} />
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-800 mb-1">Receber Valor</h3>
                    <p className="text-slate-500 text-sm mb-6">Confirma o recebimento desta dívida?</p>

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

        {/* CSS GLOBAL PARA INPUTS */}
        <style>{`
            .input-padrao { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem; outline: none; font-weight: 500; color: #334155; }
            .input-padrao:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
            .btn-primary { flex: 1; padding: 0.75rem; background: #2563eb; color: white; font-weight: bold; border-radius: 0.75rem; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
            .btn-primary:hover { background: #1d4ed8; }
            .btn-secondary { flex: 1; padding: 0.75rem; font-weight: bold; color: #64748b; border-radius: 0.75rem; transition: 0.2s; }
            .btn-secondary:hover { background: #f1f5f9; }
        `}</style>

      </main>
    </div>
  );
};