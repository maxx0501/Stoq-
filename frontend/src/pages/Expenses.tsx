import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Plus, Trash2, TrendingDown, CheckCircle, Circle, Calendar, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export const Expenses = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Controle do Mês Atual
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form States
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [cat, setCat] = useState('FIXA');
  
  // Repetição
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatCount, setRepeatCount] = useState(12);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const token = localStorage.getItem('stoq_token');
    try {
        const res = await fetch(`${API_URL}/expenses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setExpenses(data);
    } catch (e) { console.error("Erro ao carregar despesas"); }
  };

  // --- NAVEGAÇÃO DE MÊS ---
  const handlePrevMonth = () => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(newDate.getMonth() - 1);
          return newDate;
      });
  };

  const handleNextMonth = () => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(newDate.getMonth() + 1);
          return newDate;
      });
  };

  // --- FILTRAGEM CORRIGIDA ---
  const filteredExpenses = expenses.filter(expense => {
      if (!expense.dueDate) return false;
      
      // 1. Pega apenas a parte 'YYYY-MM-DD' da string ISO que vem do banco
      const dateString = expense.dueDate.toString().split('T')[0]; 
      
      // 2. Cria a data forçando meio-dia para evitar problemas de fuso horário (UTC vs Local)
      const expenseDate = new Date(dateString + 'T12:00:00');
      
      return (
          expenseDate.getMonth() === currentDate.getMonth() &&
          expenseDate.getFullYear() === currentDate.getFullYear()
      );
  });

  const totalPending = filteredExpenses.filter(e => !e.paid).reduce((acc, curr) => acc + Number(curr.value), 0);
  const totalPaid = filteredExpenses.filter(e => e.paid).reduce((acc, curr) => acc + Number(curr.value), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('stoq_token');
    
    try {
        await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                description: desc, 
                value: parseFloat(amount.replace(',', '.')), 
                dueDate: date, 
                category: cat,
                repeatCount: isRecurring ? repeatCount : 1 
            })
        });
        
        setShowModal(false);
        setDesc(''); setAmount(''); setDate(''); setIsRecurring(false); setRepeatCount(12);
        fetchExpenses();
    } catch (e) { alert("Erro ao salvar"); }
    setIsLoading(false);
  };

  const togglePaid = async (id: string) => {
    const token = localStorage.getItem('stoq_token');
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, paid: !e.paid } : e));

    await fetch(`${API_URL}/expenses/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchExpenses(); 
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Apagar despesa?")) return;
    const token = localStorage.getItem('stoq_token');
    setExpenses(prev => prev.filter(e => e.id !== id)); 

    await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  // Formatador seguro para exibição
  const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const cleanDate = dateStr.toString().split('T')[0];
      const dateObj = new Date(cleanDate + 'T12:00:00');
      return dateObj.toLocaleDateString('pt-BR');
  };

  const currentMonthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="expenses" onNavigate={onNavigate} onLogout={onLogout} user={user} />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />
        
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">Despesas</h1>
                        <p className="text-slate-500">Controle suas contas fixas e variáveis.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/30 transition active:scale-95">
                        <Plus size={20}/> Nova Despesa
                    </button>
                </div>

                {/* --- NAVEGADOR DE MESES --- */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                        <ChevronLeft size={24} />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                            <Calendar size={20} />
                        </div>
                        <span className="text-lg font-black text-slate-800 capitalize">
                            {currentMonthLabel}
                        </span>
                    </div>

                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* RESUMO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">A Pagar em {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</p>
                            <h2 className="text-3xl font-black text-slate-800">{formatMoney(totalPending)}</h2>
                        </div>
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                            <TrendingDown size={24}/>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Pago em {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</p>
                            <h2 className="text-3xl font-black text-emerald-600">{formatMoney(totalPaid)}</h2>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle size={24}/>
                        </div>
                    </div>
                </div>

                {/* LISTA */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                            <tr>
                                <th className="p-4">Status</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4">Vencimento</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.map((expense: any) => (
                                <tr key={expense.id} className="hover:bg-slate-50 transition group">
                                    <td className="p-4">
                                        <button onClick={() => togglePaid(expense.id)} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition ${expense.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                            {expense.paid ? <CheckCircle size={14}/> : <Circle size={14}/>}
                                            {expense.paid ? 'PAGO' : 'PENDENTE'}
                                        </button>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700">{expense.description}</td>
                                    <td className="p-4 text-sm text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{expense.category}</span></td>
                                    <td className={`p-4 text-sm font-bold flex items-center gap-2 ${new Date(expense.dueDate).getTime() < new Date().getTime() && !expense.paid ? 'text-red-500' : 'text-slate-600'}`}>
                                        <Calendar size={14}/> {formatDate(expense.dueDate)}
                                    </td>
                                    <td className="p-4 font-black text-slate-800">{formatMoney(Number(expense.value))}</td>
                                    <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => handleDelete(expense.id)} className="text-slate-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                                <TrendingDown size={24} className="text-slate-300"/>
                                            </div>
                                            Nenhuma despesa encontrada neste mês.<br/>Use o botão "Nova Despesa" para adicionar.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* MODAL (Igual ao anterior) */}
        {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600"><Plus size={18}/></div>
                        Nova Despesa
                    </h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Descrição</label>
                            <input autoFocus required placeholder="Ex: Aluguel da Loja" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition" value={desc} onChange={e => setDesc(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Valor</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400 font-bold">R$</span>
                                    <input required placeholder="0,00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition" value={amount} onChange={e => setAmount(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">1º Vencimento</label>
                                <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Categoria</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-red-500" value={cat} onChange={e => setCat(e.target.value)}>
                                <option value="FIXA">Custo Fixo (Aluguel, Net)</option>
                                <option value="VARIAVEL">Variável (Taxas, Embalagem)</option>
                                <option value="PESSOAL">Pessoal (Salário, Prolabore)</option>
                                <option value="FORNECEDOR">Fornecedor (Estoque)</option>
                            </select>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="recurring" 
                                    className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                                    checked={isRecurring}
                                    onChange={e => setIsRecurring(e.target.checked)}
                                />
                                <label htmlFor="recurring" className="text-sm font-bold text-slate-600 cursor-pointer flex items-center gap-2">
                                    <RefreshCw size={14} className="text-slate-400"/> Repetir mensalmente?
                                </label>
                            </div>
                            
                            {isRecurring && (
                                <div className="mt-3 animate-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Quantas vezes?</label>
                                    <div className="flex gap-2 mt-1">
                                        <input 
                                            type="number" 
                                            min="2" 
                                            max="60" 
                                            className="w-20 bg-white border border-slate-200 rounded-lg p-2 font-bold text-center outline-none focus:border-red-500"
                                            value={repeatCount}
                                            onChange={e => setRepeatCount(Number(e.target.value))}
                                        />
                                        <div className="flex-1 flex items-center text-xs font-bold text-slate-400 bg-white border border-slate-200 rounded-lg px-3">
                                            meses
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        Serão criadas <strong>{repeatCount}</strong> despesas iguais, uma para cada mês.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
                            <button disabled={isLoading} type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/30 transition active:scale-95 flex justify-center">
                                {isLoading ? 'Salvando...' : 'Salvar Despesa'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
