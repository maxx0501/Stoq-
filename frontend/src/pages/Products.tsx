import { useState, useEffect, useRef } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
import { Package, Plus, Search, Image as ImageIcon, AlertCircle, EyeOff, X, Edit, Trash2, Upload, Download, Filter, Tag, ChevronLeft, ChevronRight, CheckCircle, AlertOctagon, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import * as XLSX from 'xlsx';

export const Products = ({ onNavigate, onLogout, user, storeName, setUser, toggleTheme, currentTheme }: any) => {
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
  const importInputRef = useRef<HTMLInputElement>(null);

  // Import Excel
  const [importData, setImportData] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', costPrice: '',
    stock: '', minStock: '', imageUrl: '', isVisible: true
  });

  useEffect(() => { fetchProducts(); }, []);

  // Mapeamento de cabeçalhos PT-BR -> campos da API
  const HEADER_MAP: Record<string, string> = {
    'Nome': 'name', 'Categoria': 'category', 'Descrição': 'description',
    'Preço de Venda': 'price', 'Preço de Custo': 'costPrice',
    'Estoque': 'stock', 'Estoque Mínimo': 'minStock', 'URL da Imagem': 'imageUrl',
  };

  // Nomes de exemplo do template para filtrar na importação
  const EXAMPLE_NAMES = ['Camiseta Basica', 'Caneca Personalizada'];

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const templateRows = [
      ['Nome', 'Categoria', 'Descrição', 'Preço de Venda', 'Preço de Custo', 'Estoque', 'Estoque Mínimo', 'URL da Imagem'],
      ['Camiseta Basica', 'Roupas', 'Algodao 100%', 49.9, 22.0, 30, 5, ''],
      ['Caneca Personalizada', 'Utilidades', 'Caneca 325ml', 35.0, 14.5, 20, 3, ''],
    ];

    const instructionsRows = [
      ['Coluna', 'Obrigatório?', 'Formato', 'Exemplo'],
      ['Nome', 'Sim', 'Texto', 'Camiseta Basica'],
      ['Categoria', 'Não', 'Texto', 'Roupas'],
      ['Descrição', 'Não', 'Texto', 'Algodao 100%'],
      ['Preço de Venda', 'Sim', 'Número (ex: 49.90)', '49.90'],
      ['Preço de Custo', 'Não', 'Número (ex: 22.00)', '22.00'],
      ['Estoque', 'Não', 'Número inteiro', '30'],
      ['Estoque Mínimo', 'Não', 'Número inteiro', '5'],
      ['URL da Imagem', 'Não', 'Link da imagem', 'https://exemplo.com/foto.jpg'],
      [],
      ['⚠️ IMPORTANTE'],
      ['- Apague as 2 linhas de exemplo antes de preencher seus produtos.'],
      ['- Não altere o nome das colunas na aba "Produtos".'],
      ['- Máximo de 500 produtos por importação.'],
    ];

    const wsTemplate = XLSX.utils.aoa_to_sheet(templateRows);
    // Largura das colunas
    wsTemplate['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 35 },
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsRows);
    wsInstructions['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 30 }];

    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Produtos');
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');

    XLSX.writeFile(wb, 'Modelo_Importacao_Produtos_StoqPlus.xlsx');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input para permitir reimportar o mesmo arquivo
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      // Mapeia cabeçalhos PT-BR para campos internos e filtra exemplos
      const mapped = rows
        .map((row) => {
          const product: Record<string, any> = {};
          for (const [ptKey, apiKey] of Object.entries(HEADER_MAP)) {
            if (row[ptKey] !== undefined) product[apiKey] = row[ptKey];
          }
          return product;
        })
        .filter((p) => {
          // Remove linhas vazias (sem nome)
          if (!p.name || String(p.name).trim() === '') return false;
          // Remove linhas de exemplo do template
          if (EXAMPLE_NAMES.includes(String(p.name).trim())) return false;
          return true;
        });

      if (mapped.length === 0) {
        alert('Nenhum produto encontrado na planilha.\n\nDica: apague as linhas de exemplo e preencha com seus produtos.');
        return;
      }
      if (mapped.length > 500) {
        alert('Máximo de 500 produtos por importação. Sua planilha tem ' + mapped.length + ' linhas.');
        return;
      }

      setImportData(mapped);
      setImportResult(null);
      setShowImportModal(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    const token = localStorage.getItem('stoq_token');
    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      const name = String(row.name || '').trim();
      const price = Number(row.price);

      if (!name) { errors.push(`Linha ${i + 1}: Nome vazio`); continue; }
      if (isNaN(price) || price < 0) { errors.push(`Linha ${i + 1} (${name}): Preço inválido`); continue; }

      try {
        const res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            name,
            description: String(row.description || '').trim(),
            category: String(row.category || 'Geral').trim(),
            price,
            costPrice: row.costPrice ? Number(row.costPrice) : 0,
            stock: Number(row.stock) || 0,
            minStock: row.minStock ? Number(row.minStock) : 0,
            imageUrl: String(row.imageUrl || '').trim(),
            isVisible: true,
          }),
        });
        if (res.ok) { success++; }
        else {
          const data = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
          errors.push(`Linha ${i + 1} (${name}): ${data.error}`);
        }
      } catch { errors.push(`Linha ${i + 1} (${name}): Erro de conexão`); }
    }

    setImportResult({ success, errors });
    setIsImporting(false);
    if (success > 0) await fetchProducts();
  };

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
      // Valida dados antes de enviar
      if (!form.name.trim()) {
        alert('Nome do produto é obrigatório');
        setIsLoading(false);
        return;
      }

      if (!form.price || Number(form.price) < 0) {
        alert('Preço deve ser um valor positivo');
        setIsLoading(false);
        return;
      }

      // Prepara dados com conversão de tipos corretos
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim() || 'Geral',
        price: Number(form.price),
        costPrice: form.costPrice ? Number(form.costPrice) : 0,
        stock: Number(form.stock) || 0,
        minStock: form.minStock ? Number(form.minStock) : 0,
        imageUrl: form.imageUrl || '',
        isVisible: form.isVisible
      };

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });

      // Parse response com fallback
      let response;
      try {
        response = await res.json();
      } catch {
        response = { ok: res.ok };
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
        console.error('Erro ao salvar:', response);
        alert(response.error || "Erro ao salvar produto. Tente novamente.");
      }
    } catch (error: any) {
      console.error('Erro de conexão:', error);
      alert(error.message || "Erro de conexão ao salvar produto.");
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
    <Layout active="products" onNavigate={onNavigate} onLogout={onLogout} user={user} storeName={storeName} setUser={setUser} toggleTheme={toggleTheme} currentTheme={currentTheme}>
            <div className="max-w-[1600px] mx-auto">

                {/* Header Página */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Package className="text-blue-600" /> Catálogo de Produtos
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie seu inventário completo.</p>
                    </div>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <button onClick={handleDownloadTemplate} className="hidden md:flex bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-600 items-center gap-2 text-sm">
                      <Download size={16} /> Modelo Excel
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="hidden md:flex bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/30 items-center gap-2 text-sm">
                      <FileSpreadsheet size={16} /> Importar
                    </button>
                    <input type="file" ref={importInputRef} onChange={handleImportFile} className="hidden" accept=".xlsx,.xls,.csv" />
                    <button onClick={openNewProductModal} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center gap-2 text-sm">
                      <Plus size={18} /> Novo Produto
                    </button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6 md:mb-8 space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 focus-within:border-blue-400 transition">
                        <Search className="text-slate-400" />
                        <input className="flex-1 bg-transparent outline-none text-slate-700 dark:text-white font-medium dark:placeholder-slate-400"
                            placeholder="Buscar por nome ou categoria..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                        {searchTerm && <button onClick={() => setSearchTerm('')}><X size={16} className="text-slate-400"/></button>}
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase mr-2 shrink-0"><Filter size={14} /> Filtros:</div>
                        {categories.map((cat) => (
                            <button key={cat} onClick={() => {setSelectedCategory(cat); setCurrentPage(1);}} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GRID DE CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
                    {currentItems.map((product) => {
                        const isLowStock = (product.stock || 0) <= (product.minStock || 0);
                        return (
                        <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col relative">
                            <div className="h-32 md:h-48 w-full bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                                {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500 bg-slate-50 dark:bg-slate-700"><ImageIcon size={48} /></div>}
                                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        {product.isVisible === false && <span className="bg-slate-800/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit"><EyeOff size={10} /> Oculto</span>}
                                        {isLowStock && <span className="bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse w-fit"><AlertCircle size={10} /> Baixo</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 md:p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md flex items-center gap-1"><Tag size={10} /> {product.category || 'Geral'}</span>
                                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(product)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteClick(product.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white mb-1 leading-tight text-sm line-clamp-1">{product.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 md:mb-4 flex-1 h-8 hidden md:block">{product.description || 'Sem descrição.'}</p>
                                <div className="border-t border-slate-50 dark:border-slate-700 pt-3 md:pt-4 flex items-end justify-between">
                                    <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Preço</p><p className="text-base md:text-lg font-black text-slate-900 dark:text-white">R$ {Number(product.price || 0).toFixed(2)}</p></div>
                                    <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Estoque</p><div className={`font-bold text-sm px-2 py-0.5 rounded-lg ${isLowStock ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>{product.stock || 0} un</div></div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-4 mt-8">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"><ChevronLeft size={16}/> Anterior</button>
                        <span className="flex items-center text-sm font-bold text-slate-400">Página {currentPage} de {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition">Próxima <ChevronRight size={16}/></button>
                    </div>
                )}

            </div>

        {/* --- MODAL CADASTRO (Mantido) --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50] flex items-end md:items-center justify-center md:p-4">
            <div className="bg-white dark:bg-slate-800 w-full md:max-w-3xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] md:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom md:fade-in md:zoom-in duration-200">
              <div className="bg-slate-50 dark:bg-slate-700 px-5 md:px-8 py-4 md:py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 z-10">
                <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">{isEditing ? 'Editar Produto' : 'Cadastrar Novo Item'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition"><X size={20} className="text-slate-500 dark:text-slate-400"/></button>
              </div>
              <form onSubmit={handleSave} className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block">FOTO</label>
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition bg-slate-50 dark:bg-slate-700 overflow-hidden relative">
                      {form.imageUrl ? <img src={form.imageUrl} className="w-full h-full object-cover" /> : <><Upload size={20} className="text-blue-600 mb-2"/><span className="text-xs font-bold text-slate-400">Enviar foto</span></>}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">NOME</label><input className="input-padrao dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                  <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">CATEGORIA</label><input className="input-padrao dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">PREÇO VENDA</label><input type="number" step="0.01" className="input-padrao dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">CUSTO</label><input type="number" step="0.01" className="input-padrao dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">ESTOQUE</label><input type="number" className="input-padrao dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required /></div>
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">MÍNIMO</label><input type="number" className="input-padrao dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} /></div>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">DESCRIÇÃO</label><textarea className="input-padrao h-24 resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><input type="checkbox" checked={form.isVisible} onChange={e => setForm({...form, isVisible: e.target.checked})} className="w-5 h-5 accent-blue-600" /><label className="text-sm font-medium text-slate-700 dark:text-slate-200">Visível no catálogo</label></div>
                  <button type="submit" disabled={isLoading || !form.name.trim()} className="w-full bg-[#0f172a] text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Cadastrar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL CONFIRMAR EXCLUSÃO --- */}
        {showConfirmDelete && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-200">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertOctagon size={32} /></div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Excluir Produto?</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Essa ação não pode ser desfeita.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowConfirmDelete(false)} disabled={isDeleting} className="flex-1 py-2.5 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">Cancelar</button>
                      <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isDeleting ? 'Excluindo...' : 'Excluir'}</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL IMPORTAÇÃO --- */}
        {showImportModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-50 dark:bg-slate-700 px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><FileSpreadsheet className="text-emerald-600" size={22} /> Importar Produtos</h2>
                        <button onClick={() => { setShowImportModal(false); setImportData([]); setImportResult(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition"><X size={20} className="text-slate-500 dark:text-slate-400"/></button>
                    </div>

                    {!importResult ? (
                        <>
                            <div className="p-6 overflow-y-auto flex-1">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4"><span className="font-bold text-slate-700 dark:text-slate-200">{importData.length} produto{importData.length !== 1 ? 's' : ''}</span> encontrado{importData.length !== 1 ? 's' : ''} na planilha. Confira antes de importar:</p>
                                <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-700">
                                            <tr>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">#</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nome</th>
                                                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Categoria</th>
                                                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Preço</th>
                                                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Estoque</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importData.slice(0, 50).map((p, i) => (
                                                <tr key={i} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                                                    <td className="px-4 py-2 text-slate-400 text-xs">{i + 1}</td>
                                                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{p.name}</td>
                                                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{p.category || 'Geral'}</td>
                                                    <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-white">R$ {Number(p.price || 0).toFixed(2)}</td>
                                                    <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">{p.stock || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {importData.length > 50 && <p className="text-xs text-slate-400 mt-2 text-center">Mostrando 50 de {importData.length} produtos...</p>}
                            </div>
                            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition">Cancelar</button>
                                <button onClick={handleConfirmImport} disabled={isImporting} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isImporting ? <><Loader2 size={18} className="animate-spin" /> Importando...</> : <><FileSpreadsheet size={18} /> Confirmar Importação</>}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${importResult.errors.length === 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'}`}>
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Importação Concluída</h3>
                            <p className="text-emerald-600 font-bold text-lg mb-1">{importResult.success} produto{importResult.success !== 1 ? 's' : ''} importado{importResult.success !== 1 ? 's' : ''}</p>
                            {importResult.errors.length > 0 && (
                                <div className="mt-4 text-left bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl p-4 max-h-40 overflow-y-auto">
                                    <p className="text-xs font-bold text-red-600 mb-2">{importResult.errors.length} erro{importResult.errors.length !== 1 ? 's' : ''}:</p>
                                    {importResult.errors.map((err, i) => <p key={i} className="text-xs text-red-500 mb-1">• {err}</p>)}
                                </div>
                            )}
                            <button onClick={() => { setShowImportModal(false); setImportData([]); setImportResult(null); }} className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition">Fechar</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- MODAL SUCESSO --- */}
        {showSuccessModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} className="animate-bounce" /></div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">Sucesso!</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">{successMessage}</p>
                </div>
            </div>
        )}

      </Layout>
  );
};
