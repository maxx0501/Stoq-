import { useState, useEffect, useRef } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
import { Package, Plus, Search, Image as ImageIcon, AlertCircle, EyeOff, X, Edit, Trash2, Upload, Filter, Tag, ChevronLeft, ChevronRight, CheckCircle, AlertOctagon } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const Products = ({ onNavigate, onLogout, user, storeName, setUser }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Modais de Feedback
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filtro e Paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', costPrice: '', 
    stock: '', minStock: '', imageUrl: '', isVisible: true
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('stoq_token');
      const res = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (error) { console.error("Erro conexão", error); }
  };

  const categories = ['Todas', ...new Set(products.map(p => p.category || 'Sem Categoria').filter(c => c))];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const openNewProductModal = () => {
    setForm({ name: '', description: '', category: '', price: '', costPrice: '', stock: '', minStock: '', imageUrl: '', isVisible: true });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (product: any) => {
    setForm({
      name: product.name || '', description: product.description || '', category: product.category || '',
      price: product.price, costPrice: product.costPrice || '', stock: product.stock,
      minStock: product.minStock || '', imageUrl: product.imageUrl || '', isVisible: product.isVisible
    });
    setCurrentId(product.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Prepara exclusão (abre modal)
  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setShowConfirmDelete(true);
  };

  // Confirma Exclusão
  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('stoq_token');
      const res = await fetch(`${API_URL}/products/${productToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro ao deletar produto' }));
        throw new Error(data.error || 'Erro ao deletar produto');
      }
      
      setSuccessMessage('Produto deletado com sucesso!');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
      await fetchProducts();
      setShowConfirmDelete(false);
      setProductToDelete(null);
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar produto.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Previne cliques múltiplos
    
    setIsLoading(true);
    const token = localStorage.getItem('stoq_token');
    const url = isEditing ? `${API_URL}/products/${currentId}` : `${API_URL}/products`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });

      // Parse response com fallback
      let data;
      try {
        data = await res.json();
      } catch {
        data = { ok: res.ok };
      }

      if (res.ok) {
        setIsModalOpen(false);
        await fetchProducts();
        setForm({ name: '', description: '', category: '', price: '', costPrice: '', stock: '', minStock: '', imageUrl: '', isVisible: true });
        setIsEditing(false);
        setCurrentId(null);
        
        // Feedback Visual
        setSuccessMessage(isEditing ? "Produto atualizado!" : "Produto criado com sucesso!");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert(data.error || "Erro ao salvar.");
      }
    } catch (error: any) {
      alert(error.message || "Erro de conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  // Paginação Lógica
  const filteredProducts = products.filter(product => {
    if (!product) return false;
    const matchesSearch = !searchTerm || (
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCategory = selectedCategory === 'Todas' || (product.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans">
      <Sidebar active="products" onNavigate={onNavigate} onLogout={onLogout} user={user} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} storeName={storeName} onLogout={onLogout} setUser={setUser} />

        <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-[1600px] mx-auto">
                
                {/* Header Página */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <Package className="text-blue-600" /> Catálogo de Produtos
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Gerencie seu inventário completo.</p>
                    </div>
                    <button onClick={openNewProductModal} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center gap-2">
                        <Plus size={20} /> Novo Produto
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 space-y-4">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 focus-within:border-blue-400 transition">
                        <Search className="text-slate-400" />
                        <input className="flex-1 bg-transparent outline-none text-slate-700 font-medium" 
                            placeholder="Buscar por nome ou categoria..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                        {searchTerm && <button onClick={() => setSearchTerm('')}><X size={16} className="text-slate-400"/></button>}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase mr-2 shrink-0"><Filter size={14} /> Filtros:</div>
                        {categories.map((cat) => (
                            <button key={cat} onClick={() => {setSelectedCategory(cat); setCurrentPage(1);}} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GRID DE CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                    {currentItems.map((product) => {
                        const isLowStock = (product.stock || 0) <= (product.minStock || 0);
                        return (
                        <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col relative">
                            <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                                {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><ImageIcon size={48} /></div>}
                                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        {product.isVisible === false && <span className="bg-slate-800/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit"><EyeOff size={10} /> Oculto</span>}
                                        {isLowStock && <span className="bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse w-fit"><AlertCircle size={10} /> Baixo</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1"><Tag size={10} /> {product.category || 'Geral'}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(product)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteClick(product.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1 leading-tight text-sm line-clamp-1">{product.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1 h-8">{product.description || 'Sem descrição.'}</p>
                                <div className="border-t border-slate-50 pt-4 flex items-end justify-between">
                                    <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Preço</p><p className="text-lg font-black text-slate-900">R$ {Number(product.price || 0).toFixed(2)}</p></div>
                                    <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Estoque</p><div className={`font-bold text-sm px-2 py-0.5 rounded-lg ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{product.stock || 0} un</div></div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-4 mt-8">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"><ChevronLeft size={16}/> Anterior</button>
                        <span className="flex items-center text-sm font-bold text-slate-400">Página {currentPage} de {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">Próxima <ChevronRight size={16}/></button>
                    </div>
                )}

            </div>
        </div>

        {/* --- MODAL CADASTRO (Mantido) --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-xl font-black text-slate-800">{isEditing ? 'Editar Produto' : 'Cadastrar Novo Item'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
              </div>
              <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">FOTO</label>
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition bg-slate-50 overflow-hidden relative">
                      {form.imageUrl ? <img src={form.imageUrl} className="w-full h-full object-cover" /> : <><Upload size={20} className="text-blue-600 mb-2"/><span className="text-xs font-bold text-slate-400">Enviar foto</span></>}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500">NOME</label><input className="input-padrao" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                  <div><label className="text-xs font-bold text-slate-500">CATEGORIA</label><input className="input-padrao" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-500">PREÇO VENDA</label><input type="number" step="0.01" className="input-padrao" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                    <div><label className="text-xs font-bold text-slate-500">CUSTO</label><input type="number" step="0.01" className="input-padrao" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-500">ESTOQUE</label><input type="number" className="input-padrao" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required /></div>
                    <div><label className="text-xs font-bold text-slate-500">MÍNIMO</label><input type="number" className="input-padrao" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} /></div>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500">DESCRIÇÃO</label><textarea className="input-padrao h-24 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl"><input type="checkbox" checked={form.isVisible} onChange={e => setForm({...form, isVisible: e.target.checked})} className="w-5 h-5 accent-blue-600" /><label className="text-sm font-medium text-slate-700">Visível no catálogo</label></div>
                  <button type="submit" disabled={isLoading || !form.name.trim()} className="w-full bg-[#0f172a] text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Cadastrar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL CONFIRMAR EXCLUSÃO --- */}
        {showConfirmDelete && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon size={32} /></div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Excluir Produto?</h3>
                    <p className="text-slate-500 mb-6 text-sm">Essa ação não pode ser desfeita.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancelar</button>
                        <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg">Excluir</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL SUCESSO --- */}
        {showSuccessModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} className="animate-bounce" /></div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">Sucesso!</h3>
                    <p className="text-slate-500 font-bold">{successMessage}</p>
                </div>
            </div>
        )}

      </main>
      <style>{`.input-padrao { width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem 1rem; outline: none; transition: all 0.2s; font-weight: 500; color: #334155; } .input-padrao:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1); background-color: #fff; } .scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};
