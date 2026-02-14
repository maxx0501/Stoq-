import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Lock, TrendingUp, TrendingDown, AlertTriangle, Calculator, CheckCircle, X, ArrowRight, History, Wallet, Calendar } from 'lucide-react';

export const CashFlow = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT');
  const [status, setStatus] = useState('CLOSED'); // CLOSED, OPEN, CONFERENCE, FINISHED
  
  // Dados Financeiros
  const [openingBalance, setOpeningBalance] = useState(0); 
  const [inputOpening, setInputOpening] = useState('');
  
  // Resumo atual (Vendas do dia)
  const [salesSummary, setSalesSummary] = useState({ MONEY: 0, CREDIT_CARD: 0, PIX: 0, CREDIT_STORE: 0 });
  const [bleeds, setBleeds] = useState<any[]>([]); 
  const [supplies, setSupplies] = useState<any[]>([]); 
  
  // Conferência e Fechamento
  const [countedMoney, setCountedMoney] = useState('');
  const [serverDifference, setServerDifference] = useState(0); // Diferença calculada

  // Modais
  const [showBleedModal, setShowBleedModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [modalType, setModalType] = useState(''); // 'BLEED' ou 'SUPPLY'
  const [moveValue, setMoveValue] = useState('');
  const [moveDesc, setMoveDesc] = useState('');

  // Histórico
  const [historyLog, setHistoryLog] = useState<any[]>([]);

  // Carrega dados iniciais
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('stoq_token');
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        // 1. Status do Caixa Atual
        const sessionRes = await fetch('http://localhost:3333/cashflow/current', { headers });
        const session = await sessionRes.json();
        
        if (session && session.id && session.status !== 'FINISHED' && session.status !== 'CLOSED') {
            setStatus(session.status);
            setOpeningBalance(Number(session.openingBalance));
            
            const movs = session.movements || [];
            setBleeds(movs.filter((m: any) => m.type === 'BLEED'));
            setSupplies(movs.filter((m: any) => m.type === 'SUPPLY'));
        } else {
            setStatus('CLOSED');
        }

        // 2. Resumo de Vendas do Dia (Backend soma vendas desde 00:00)
        const summaryRes = await fetch('http://localhost:3333/cashflow/summary', { headers });
        const summaryData = await summaryRes.json();
        if (summaryData.summary) {
            setSalesSummary({
                MONEY: Number(summaryData.summary.MONEY || 0),
                CREDIT_CARD: Number(summaryData.summary.CREDIT_CARD || 0) + Number(summaryData.summary.DEBIT_CARD || 0),
                PIX: Number(summaryData.summary.PIX || 0),
                CREDIT_STORE: Number(summaryData.summary.CREDIT_STORE || 0)
            });
        }

        // 3. Histórico de Fechamentos
        const histRes = await fetch('http://localhost:3333/cashflow/history', { headers });
        const histData = await histRes.json();
        if (Array.isArray(histData)) setHistoryLog(histData);

    } catch (error) { console.error("Erro ao carregar dados", error); }
  };

  // --- CÁLCULO EM TEMPO REAL (Visual) ---
  const totalBleedsVal = bleeds.reduce((acc, curr) => acc + Number(curr.value), 0);
  const totalSuppliesVal = supplies.reduce((acc, curr) => acc + Number(curr.value), 0);
  
  // A LÓGICA CORRETA: Fundo + Vendas em Dinheiro (Do dia todo) + Suprimentos - Sangrias
  const currentExpected = openingBalance + salesSummary.MONEY + totalSuppliesVal - totalBleedsVal;

  // --- AÇÕES ---

  const handleOpenBox = async () => {
    const val = inputOpening ? parseFloat(inputOpening.replace(',', '.')) : 0;
    const token = localStorage.getItem('stoq_token');
    
    await fetch('http://localhost:3333/cashflow/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ openingBalance: val })
    });
    
    setInputOpening('');
    fetchData(); 
  };

  const handleMovement = async () => {
    if (!moveValue || !moveDesc) return;
    const val = parseFloat(moveValue.replace(',', '.'));
    const token = localStorage.getItem('stoq_token');

    await fetch('http://localhost:3333/cashflow/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: modalType, value: val, desc: moveDesc })
    });

    setMoveValue(''); setMoveDesc(''); setShowBleedModal(false); setShowSupplyModal(false);
    fetchData();
  };

  // 1. Usuário clica em "Encerrar" na conferência -> Mostra resumo
  const handlePreFinish = () => {
    if (!countedMoney) return;
    const val = parseFloat(countedMoney.replace(',', '.'));
    const diff = val - currentExpected; // Cálculo visual para o usuário confirmar
    setServerDifference(diff);
    setShowCloseConfirmation(true);
  };

  // 2. Usuário confirma -> Envia pro backend fechar de verdade
  const confirmFinish = async () => {
    const token = localStorage.getItem('stoq_token');
    const val = parseFloat(countedMoney.replace(',', '.'));

    const res = await fetch('http://localhost:3333/cashflow/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ countedMoney: val })
    });
    
    const data = await res.json();

    setShowCloseConfirmation(false);
    // Usa a diferença real calculada pelo servidor
    setServerDifference(Number(data.difference));
    setStatus('FINISHED'); 
    fetchData();
  };

  const handleReset = async () => {
    const token = localStorage.getItem('stoq_token');
    await fetch('http://localhost:3333/cashflow/reset', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    
    // Reseta estados locais
    setOpeningBalance(0);
    setBleeds([]);
    setSupplies([]);
    setCountedMoney('');
    setServerDifference(0);
    setStatus('CLOSED');
    fetchData();
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="cashflow" onNavigate={onNavigate} onLogout={onLogout} user={user} />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />
        
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">Fluxo de Caixa</h1>
                        <p className="text-slate-500">Gestão de turno e conferência.</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                        <button onClick={() => setActiveTab('CURRENT')} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 transition ${activeTab === 'CURRENT' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Wallet size={16}/> Caixa Atual</button>
                        <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 transition ${activeTab === 'HISTORY' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><History size={16}/> Histórico</button>
                    </div>
                </div>

                {activeTab === 'CURRENT' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        {/* HEADER DE STATUS */}
                        {status !== 'CLOSED' && status !== 'FINISHED' && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6 flex justify-between items-center">
                                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Status</span><h2 className="text-2xl font-black text-green-600 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"/>ABERTO</h2></div>
                                <div className="text-right"><span className="text-[10px] font-bold text-slate-400 uppercase">Total na Gaveta (Sistema)</span><h2 className="text-3xl font-black text-slate-800">{formatMoney(currentExpected)}</h2></div>
                            </div>
                        )}

                        {/* 1. CAIXA FECHADO */}
                        {status === 'CLOSED' && (
                            <div className="bg-white p-12 rounded-3xl shadow-lg border border-slate-100 text-center max-w-lg mx-auto mt-10">
                                <Lock className="mx-auto text-slate-300 mb-4" size={48}/>
                                <h2 className="text-2xl font-black text-slate-800">Caixa Fechado</h2>
                                <p className="text-slate-500 mb-6 text-sm">Informe o fundo de troco para iniciar.</p>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="R$ 0,00" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-800 outline-none focus:border-blue-500" value={inputOpening} onChange={e => setInputOpening(e.target.value)} />
                                    <button onClick={handleOpenBox} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30">ABRIR</button>
                                </div>
                            </div>
                        )}

                        {/* 2. CAIXA ABERTO */}
                        {status === 'OPEN' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Fundo Inicial</p>
                                        <p className="text-2xl font-black text-slate-700">{formatMoney(openingBalance)}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Vendas (Dinheiro)</p>
                                        <p className="text-2xl font-black text-emerald-800">+{formatMoney(salesSummary.MONEY)}</p>
                                    </div>
                                    <button onClick={() => {setModalType('SUPPLY'); setShowSupplyModal(true)}} className="bg-blue-50 hover:bg-blue-100 p-5 rounded-2xl border border-blue-100 transition text-left group">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1"><TrendingUp size={12}/> Suprimento</p>
                                        <p className="text-2xl font-black text-blue-800 group-hover:translate-x-1 transition">Adicionar +</p>
                                    </button>
                                    <button onClick={() => {setModalType('BLEED'); setShowBleedModal(true)}} className="bg-red-50 hover:bg-red-100 p-5 rounded-2xl border border-red-100 transition text-left group">
                                        <p className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1"><TrendingDown size={12}/> Sangria</p>
                                        <p className="text-2xl font-black text-red-800 group-hover:translate-x-1 transition">Retirar -</p>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Movimentações */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-72 flex flex-col">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-700 text-sm">Movimentações Manuais</h3></div>
                                        <div className="flex-1 overflow-y-auto p-2">
                                            {[...supplies, ...bleeds].length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300"><p className="text-sm">Nenhuma sangria ou suprimento.</p></div>}
                                            {[...supplies.map(s=>({...s, t:'SUPPLY'})), ...bleeds.map(b=>({...b, t:'BLEED'}))].sort((a,b)=>b.id-a.id).map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg">
                                                    <div><p className="text-xs font-bold text-slate-700">{item.desc}</p><p className="text-[10px] text-slate-400">{item.time}</p></div>
                                                    <span className={`font-bold text-sm ${item.t==='SUPPLY' ? 'text-blue-600' : 'text-red-600'}`}>{item.t==='SUPPLY' ? '+' : '-'}{formatMoney(Number(item.value))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resumo Vendas */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
                                        <h3 className="font-bold text-slate-700 text-sm mb-6">Faturamento Total do Dia</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center"><span className="text-slate-500 text-sm font-medium">Cartão</span><span className="font-bold text-slate-800">{formatMoney(salesSummary.CREDIT_CARD)}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-slate-500 text-sm font-medium">Pix</span><span className="font-bold text-slate-800">{formatMoney(salesSummary.PIX)}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-purple-600 text-sm font-bold">Fiado (A receber)</span><span className="font-bold text-purple-700">{formatMoney(salesSummary.CREDIT_STORE)}</span></div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-end">
                                            <span className="text-slate-500 text-sm">Total Geral (Inclui dinheiro)</span>
                                            <span className="text-2xl font-black text-slate-800">{formatMoney(salesSummary.MONEY + salesSummary.CREDIT_CARD + salesSummary.PIX + salesSummary.CREDIT_STORE)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button onClick={() => setStatus('CONFERENCE')} className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold shadow-lg flex gap-2 items-center transition transform hover:-translate-y-1">
                                        <Calculator size={20} /> INICIAR CONFERÊNCIA
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. CONFERENCIA */}
                        {status === 'CONFERENCE' && (
                            <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200 mt-10 animate-in zoom-in">
                                <h2 className="text-xl font-black text-slate-800 text-center mb-6">Conferência de Valores</h2>
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Valor Contado na Gaveta</label>
                                    <input autoFocus type="number" value={countedMoney} onChange={e => setCountedMoney(e.target.value)} className="w-full text-4xl font-black text-slate-800 bg-transparent border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 text-center" placeholder="0,00" />
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-500">O sistema espera:</span>
                                    <div className="group relative cursor-help">
                                        <span className="text-xl font-black text-slate-700 blur-sm group-hover:blur-none transition">{formatMoney(currentExpected)}</span>
                                        <span className="text-[10px] text-slate-400 absolute -top-3 left-0 opacity-0 group-hover:opacity-100 transition">Espiar</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStatus('OPEN')} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancelar</button>
                                    <button onClick={handlePreFinish} disabled={!countedMoney} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition">ENCERRAR</button>
                                </div>
                            </div>
                        )}

                        {/* 4. RESULTADO FINAL */}
                        {status === 'FINISHED' && (
                            <div className="max-w-md mx-auto text-center mt-10 animate-in fade-in">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${Math.abs(serverDifference) < 0.1 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {Math.abs(serverDifference) < 0.1 ? <CheckCircle size={48} /> : <AlertTriangle size={48} />}
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Caixa Encerrado</h2>
                                <p className="text-slate-500 mb-6">Diferença Final: <span className={`font-black ${serverDifference === 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(serverDifference)}</span></p>
                                <button onClick={handleReset} className="bg-slate-800 hover:bg-black text-white px-8 py-3 rounded-xl font-bold w-full shadow-lg transition">NOVO DIA</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Operador</th>
                                    <th className="p-4">Fundo Inicial</th>
                                    <th className="p-4">Vendas (Din)</th>
                                    <th className="p-4">Total na Gaveta</th>
                                    <th className="p-4">Contado</th>
                                    <th className="p-4 text-center">Diferença</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {historyLog.map((h: any) => (
                                    <tr key={h.id}>
                                        <td className="p-4 text-sm font-bold text-slate-700">{formatDate(h.date)}</td>
                                        <td className="p-4 text-sm text-slate-500">{h.operator}</td>
                                        <td className="p-4 text-sm text-slate-500">{formatMoney(Number(h.openingBalance))}</td>
                                        <td className="p-4 text-sm text-emerald-600 font-bold">+{formatMoney(Number(h.revenue))}</td>
                                        <td className="p-4 text-sm font-bold text-slate-800">
                                            {formatMoney(Number(h.expected))}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-blue-600">{formatMoney(Number(h.counted))}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${Math.abs(Number(h.diff)) < 0.1 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {formatMoney(Number(h.diff))}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {historyLog.length === 0 && <p className="text-center p-8 text-slate-400 text-sm">Sem histórico.</p>}
                    </div>
                )}
            </div>
        </div>

        {/* MODAL SANGRIA/SUPRIMENTO */}
        {(showBleedModal || showSupplyModal) && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-xl font-black ${modalType==='BLEED'?'text-red-600':'text-blue-600'}`}>{modalType==='BLEED'?'Sangria':'Suprimento'}</h3>
                        <button onClick={()=>{setShowBleedModal(false); setShowSupplyModal(false)}}><X size={20} className="text-slate-400"/></button>
                    </div>
                    <input type="number" placeholder="Valor R$" autoFocus className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 mb-3 outline-none focus:border-blue-500" value={moveValue} onChange={e=>setMoveValue(e.target.value)} />
                    <input type="text" placeholder="Motivo (Ex: Conta Luz)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 mb-4 outline-none focus:border-blue-500" value={moveDesc} onChange={e=>setMoveDesc(e.target.value)} />
                    <button onClick={handleMovement} className={`w-full py-3 font-bold text-white rounded-xl shadow-lg ${modalType==='BLEED'?'bg-red-600':'bg-blue-600'}`}>Confirmar</button>
                </div>
            </div>
        )}

        {/* MODAL CONFIRMAÇÃO FINAL */}
        {showCloseConfirmation && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${Math.abs(serverDifference) < 0.1 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {Math.abs(serverDifference) < 0.1 ? <CheckCircle size={40}/> : <AlertTriangle size={40}/>}
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Confirmar Fechamento?</h3>
                    <p className="text-slate-500 mb-6 text-sm">
                        Diferença calculada: <strong className={serverDifference===0?'text-green-600':'text-red-600'}>{formatMoney(serverDifference)}</strong>
                    </p>
                    <div className="flex gap-3">
                        <button onClick={()=>setShowCloseConfirmation(false)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl">Voltar</button>
                        <button onClick={confirmFinish} className="flex-1 py-3 font-bold text-white bg-slate-900 rounded-xl shadow-lg">Confirmar</button>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};