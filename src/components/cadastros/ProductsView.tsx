import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Layers,
  DollarSign,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, BOMItem, ProcessStep, UnitOfMeasure } from '../../types';

interface ProductsViewProps {
  onEmitOPForProduct?: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onEmitOPForProduct }) => {
  const { db, addProduct, updateProduct, deleteProduct, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Form State
  const initialForm = {
    code: '',
    name: '',
    category: 'Mobiliário Industrial',
    unit: 'UN' as UnitOfMeasure,
    salePrice: 0,
    currentStock: 0,
    description: '',
    materials: [] as BOMItem[],
    processSteps: [] as ProcessStep[],
  };

  const [formData, setFormData] = useState(initialForm);

  // BOM edit state inside modal
  const [newBOMMaterialId, setNewBOMMaterialId] = useState('');
  const [newBOMQuantity, setNewBOMQuantity] = useState<number>(1);

  // Step edit state inside modal
  const [newStepName, setNewStepName] = useState('');
  const [newStepMinutes, setNewStepMinutes] = useState<number>(30);
  const [newStepCenter, setNewStepCenter] = useState('Corte & Serralheria');
  const [newStepDesc, setNewStepDesc] = useState('');

  const categories = ['TODAS', ...Array.from(new Set(db.products.map((p) => p.category)))];

  const filteredProducts = db.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'TODAS' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const openNewModal = () => {
    setEditingProduct(null);
    const nextCode = `PROD-${100 + db.products.length + 1}`;
    setFormData({
      ...initialForm,
      code: nextCode,
      materials: [],
      processSteps: [
        { id: 'step-1', name: 'Corte e Preparação', standardMinutes: 30, workCenter: 'Corte & Serralheria' },
        { id: 'step-2', name: 'Montagem e Solda', standardMinutes: 45, workCenter: 'Solda & Caldeiraria' },
        { id: 'step-3', name: 'Acabamento e Pintura', standardMinutes: 30, workCenter: 'Pintura & Acabamento' },
        { id: 'step-4', name: 'Inspeção e Embalagem', standardMinutes: 15, workCenter: 'Controle de Qualidade' },
      ],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      unit: product.unit,
      salePrice: product.salePrice,
      currentStock: product.currentStock,
      description: product.description,
      materials: [...product.materials],
      processSteps: [...product.processSteps],
    });
    setIsModalOpen(true);
  };

  const handleAddBOMItem = () => {
    if (!newBOMMaterialId || newBOMQuantity <= 0) return;
    const exists = formData.materials.find((m) => m.materialId === newBOMMaterialId);
    if (exists) {
      setFormData({
        ...formData,
        materials: formData.materials.map((m) =>
          m.materialId === newBOMMaterialId
            ? { ...m, quantityPerUnit: m.quantityPerUnit + newBOMQuantity }
            : m
        ),
      });
    } else {
      setFormData({
        ...formData,
        materials: [...formData.materials, { materialId: newBOMMaterialId, quantityPerUnit: newBOMQuantity }],
      });
    }
    setNewBOMQuantity(1);
  };

  const handleRemoveBOMItem = (matId: string) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((m) => m.materialId !== matId),
    });
  };

  const handleAddProcessStep = () => {
    if (!newStepName.trim() || newStepMinutes <= 0) return;
    const newStep: ProcessStep = {
      id: `step-${Date.now()}`,
      name: newStepName.trim(),
      standardMinutes: newStepMinutes,
      workCenter: newStepCenter,
      description: newStepDesc,
    };
    setFormData({
      ...formData,
      processSteps: [...formData.processSteps, newStep],
    });
    setNewStepName('');
    setNewStepMinutes(30);
    setNewStepDesc('');
  };

  const handleRemoveProcessStep = (stepId: string) => {
    setFormData({
      ...formData,
      processSteps: formData.processSteps.filter((s) => s.id !== stepId),
    });
  };

  // Calculate live cost in form
  const computedMaterialCost = formData.materials.reduce((acc, item) => {
    const mat = db.rawMaterials.find((m) => m.id === item.materialId);
    return acc + (mat ? mat.unitCost * item.quantityPerUnit : 0);
  }, 0);

  const computedTotalMinutes = formData.processSteps.reduce(
    (acc, step) => acc + (step.standardMinutes || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        salePrice: Number(formData.salePrice),
        currentStock: Number(formData.currentStock),
        description: formData.description,
        materials: formData.materials,
        processSteps: formData.processSteps,
      });
    } else {
      addProduct({
        code: formData.code,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        salePrice: Number(formData.salePrice),
        currentStock: Number(formData.currentStock),
        description: formData.description,
        materials: formData.materials,
        processSteps: formData.processSteps,
        estimatedMaterialCost: computedMaterialCost,
        totalStandardTimeMinutes: computedTotalMinutes,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Produtos & Ficha Técnica (BOM)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Defina matérias-primas consumidas, roteiro operacional e tempo de processo para cada produto manufaturado.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto / Ficha Técnica</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, produto ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Categoria:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">Nenhum produto cadastrado com os filtros atuais.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isExpanded = expandedProductId === prod.id;
            return (
              <div
                key={prod.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Main Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5 flex-1">
                    <button
                      onClick={() => setExpandedProductId(isExpanded ? null : prod.id)}
                      className="mt-1 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                      title="Ver detalhes da Ficha Técnica"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {prod.code}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          {prod.category}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Estoque Acabado: <strong className="text-slate-800">{prod.currentStock} {prod.unit}</strong>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{prod.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{prod.description}</p>
                    </div>
                  </div>

                  {/* Badges: Time & Cost & Price */}
                  <div className="flex flex-wrap items-center gap-3 self-stretch md:self-center justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Tempo de Processo</div>
                      <div className="text-xs font-mono font-bold text-slate-800 flex items-center justify-end space-x-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 inline" />
                        <span>
                          {Math.floor(prod.totalStandardTimeMinutes / 60)}h {prod.totalStandardTimeMinutes % 60}min / {prod.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Custo de Insumos</div>
                      <div className="text-xs font-mono font-bold text-slate-700">
                        R$ {prod.estimatedMaterialCost.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Preço de Venda</div>
                      <div className="text-sm font-mono font-extrabold text-emerald-700">
                        R$ {prod.salePrice.toFixed(2)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 pl-2">
                      {onEmitOPForProduct && (
                        <button
                          onClick={() => onEmitOPForProduct(prod)}
                          title="Emitir Ordem de Produção para este produto"
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold"
                        >
                          Emitir OP
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(prod)}
                        title="Editar Ficha Técnica"
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o produto ${prod.code} - ${prod.name}?`)) {
                            deleteProduct(prod.id);
                          }
                        }}
                        title="Excluir Produto"
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Technical Details (BOM & Process Steps) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: BOM (Matérias-Primas) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Lista de Materiais (BOM por 1 {prod.unit})
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {prod.materials.length} insumo(s)
                        </span>
                      </div>

                      {prod.materials.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">Nenhum insumo vinculado a esta ficha.</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {prod.materials.map((item, idx) => {
                            const mat = db.rawMaterials.find((m) => m.id === item.materialId);
                            const itemCost = mat ? mat.unitCost * item.quantityPerUnit : 0;
                            return (
                              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-semibold text-slate-800">
                                    {mat ? mat.name : 'Material não encontrado'}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    Código: {mat?.code} • Estoque atual: {mat?.currentStock} {mat?.unit}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono font-bold text-slate-800">
                                    {item.quantityPerUnit} {mat?.unit}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    R$ {itemCost.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Roteiro Operacional e Tempos */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Roteiro de Produção & Tempo Padrão
                          </h4>
                        </div>
                        <span className="text-[11px] text-indigo-700 font-mono font-bold">
                          Total: {prod.totalStandardTimeMinutes} min
                        </span>
                      </div>

                      {prod.processSteps.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">Nenhum roteiro cadastrado.</p>
                      ) : (
                        <div className="space-y-2">
                          {prod.processSteps.map((step, idx) => (
                            <div
                              key={step.id || idx}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center space-x-2.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center justify-center font-mono">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="font-semibold text-slate-800">{step.name}</div>
                                  <div className="text-[10px] text-slate-500">{step.workCenter}</div>
                                </div>
                              </div>
                              <div className="font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                                {step.standardMinutes} min
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Criar / Editar Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {editingProduct ? 'Editar Ficha Técnica do Produto' : 'Cadastrar Novo Produto & Ficha Técnica'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Informações Básicas */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  1. Dados Gerais do Produto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código / SKU:</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Produto:</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      placeholder="Ex: Bancada Industrial Especial 2x1m"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria:</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unidade:</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitOfMeasure })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="UN">UN (Unidade)</option>
                      <option value="PC">PC (Peça)</option>
                      <option value="CX">CX (Caixa)</option>
                      <option value="M">M (Metro)</option>
                      <option value="KG">KG (Quilo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preço de Venda (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estoque Inicial:</label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição Técnica / Especificação:</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    placeholder="Detalhes construtivos, tolerâncias, normas aplicáveis..."
                  />
                </div>
              </div>

              {/* Ficha Técnica: Insumos / BOM */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    2. Lista de Insumos & Matérias-Primas (BOM)
                  </h4>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    Custo Insumos: R$ {computedMaterialCost.toFixed(2)}
                  </span>
                </div>

                {/* Adicionar Insumo */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2 items-center">
                  <div className="flex-1 w-full">
                    <select
                      value={newBOMMaterialId}
                      onChange={(e) => setNewBOMMaterialId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Selecione uma Matéria-Prima Cadastrada --</option>
                      {db.rawMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.name} ({m.unit}) - R$ {m.unitCost.toFixed(2)}/un
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-36">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Qtd por 1 un"
                      value={newBOMQuantity}
                      onChange={(e) => setNewBOMQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBOMItem}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap w-full sm:w-auto"
                  >
                    + Adicionar Insumo
                  </button>
                </div>

                {/* Tabela de Insumos da Ficha */}
                <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Matéria-Prima</th>
                        <th className="p-2.5 text-right">Qtd / Peça</th>
                        <th className="p-2.5 text-right">Custo Unit.</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                        <th className="p-2.5 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.materials.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            Nenhum insumo incluído na ficha ainda.
                          </td>
                        </tr>
                      ) : (
                        formData.materials.map((item, idx) => {
                          const mat = db.rawMaterials.find((m) => m.id === item.materialId);
                          const sub = mat ? mat.unitCost * item.quantityPerUnit : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <span className="font-semibold text-slate-800">{mat?.name}</span>
                                <span className="text-[11px] text-slate-400 block font-mono">{mat?.code}</span>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold">
                                {item.quantityPerUnit} {mat?.unit}
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-600">
                                R$ {mat?.unitCost.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                R$ {sub.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBOMItem(item.materialId)}
                                  className="text-rose-500 hover:text-rose-700"
                                >
                                  <X className="w-4 h-4 inline" />
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

              {/* Roteiro e Tempos de Processo */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    3. Roteiro Operacional & Tempos de Processo (Tempo Padrão)
                  </h4>
                  <span className="text-xs font-bold text-indigo-700 font-mono">
                    Tempo Total: {Math.floor(computedTotalMinutes / 60)}h {computedTotalMinutes % 60}m ({computedTotalMinutes} min)
                  </span>
                </div>

                {/* Adicionar Etapa */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nome da Etapa (ex: Solda MIG da estrutura)"
                      value={newStepName}
                      onChange={(e) => setNewStepName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Minutos"
                      value={newStepMinutes}
                      onChange={(e) => setNewStepMinutes(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddProcessStep}
                      className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                    >
                      + Incluir Etapa
                    </button>
                  </div>
                </div>

                {/* Lista de Etapas */}
                <div className="mt-3 space-y-1.5">
                  {formData.processSteps.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center font-mono text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{step.name}</span>
                        {step.workCenter && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {step.workCenter}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-slate-800">{step.standardMinutes} min</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProcessStep(step.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Responsável Técnico logado: <strong>{currentUser.name}</strong>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/20"
                  >
                    Salvar Ficha Técnica
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
