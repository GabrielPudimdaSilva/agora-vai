import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  X,
  PackagePlus,
  PackageMinus,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RawMaterial, UnitOfMeasure } from '../../types';

export const MaterialsView: React.FC = () => {
  const { db, addMaterial, updateMaterial, deleteMaterial, adjustMaterialStock } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'TODOS' | 'CRITICO' | 'NORMAL'>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Quick adjust modal
  const [adjustModalMat, setAdjustModalMat] = useState<RawMaterial | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Recebimento / Compra');

  const initialForm = {
    code: '',
    name: '',
    unit: 'UN' as UnitOfMeasure,
    currentStock: 0,
    minStock: 10,
    unitCost: 0,
    supplierId: '',
    location: 'Almoxarifado Geral',
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const filteredMaterials = db.rawMaterials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const isCritical = m.currentStock <= m.minStock;
    if (filterStockStatus === 'CRITICO') return matchesSearch && isCritical;
    if (filterStockStatus === 'NORMAL') return matchesSearch && !isCritical;
    return matchesSearch;
  });

  const openNewModal = () => {
    setEditingMaterial(null);
    const nextCode = `MP-${100 + db.rawMaterials.length + 1}`;
    setFormData({
      ...initialForm,
      code: nextCode,
      supplierId: db.suppliers[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (material: RawMaterial) => {
    setEditingMaterial(material);
    setFormData({
      code: material.code,
      name: material.name,
      unit: material.unit,
      currentStock: material.currentStock,
      minStock: material.minStock,
      unitCost: material.unitCost,
      supplierId: material.supplierId || '',
      location: material.location || '',
      notes: material.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMaterial) {
      updateMaterial(editingMaterial.id, {
        code: formData.code,
        name: formData.name,
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        unitCost: Number(formData.unitCost),
        supplierId: formData.supplierId,
        location: formData.location,
        notes: formData.notes,
      });
    } else {
      addMaterial({
        code: formData.code,
        name: formData.name,
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        unitCost: Number(formData.unitCost),
        supplierId: formData.supplierId,
        location: formData.location,
        notes: formData.notes,
      });
    }
    setIsModalOpen(false);
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalMat || adjustDelta === 0) return;
    adjustMaterialStock(adjustModalMat.id, adjustDelta, adjustReason);
    setAdjustModalMat(null);
    setAdjustDelta(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Matérias-Primas & Almoxarifado
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de saldo em estoque, estoque mínimo de segurança, custos unitários e fornecedores de insumos.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Matéria-Prima</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nome ou localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Status Estoque:</span>
          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todos os Insumos ({db.rawMaterials.length})</option>
            <option value="CRITICO">Abaixo do Mínimo</option>
            <option value="NORMAL">Estoque Suficiente</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Código / Descrição</th>
                <th className="p-3.5">Localização</th>
                <th className="p-3.5">Fornecedor Principal</th>
                <th className="p-3.5 text-right">Custo Unitário</th>
                <th className="p-3.5 text-right">Estoque Mínimo</th>
                <th className="p-3.5 text-right">Saldo Atual</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhuma matéria-prima localizada.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isLow = mat.currentStock <= mat.minStock;
                  const supplier = db.suppliers.find((s) => s.id === mat.supplierId);
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {mat.code}
                          </span>
                          <span className="font-semibold text-slate-900 text-sm">{mat.name}</span>
                        </div>
                        {mat.notes && <p className="text-[11px] text-slate-400 mt-0.5">{mat.notes}</p>}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                        {mat.location || 'Não especificado'}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {supplier ? (
                          <span>{supplier.tradeName || supplier.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Não vinculado</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                        R$ {mat.unitCost.toFixed(2)} / {mat.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-500">
                        {mat.minStock} {mat.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <span className={`font-bold text-sm ${isLow ? 'text-amber-700' : 'text-slate-900'}`}>
                          {mat.currentStock} {mat.unit}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600 inline mr-0.5" />
                            <span>Crítico</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-0.5" />
                            <span>Normal</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setAdjustModalMat(mat);
                              setAdjustDelta(0);
                            }}
                            title="Ajustar / Dar Entrada ou Saída no Estoque"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(mat)}
                            title="Editar Matéria-Prima"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Deseja excluir a matéria-prima ${mat.code} - ${mat.name}?`)) {
                                deleteMaterial(mat.id);
                              }
                            }}
                            title="Excluir Matéria-Prima"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Matéria-Prima */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {editingMaterial ? 'Editar Matéria-Prima' : 'Cadastrar Matéria-Prima'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código:</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Nome:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    placeholder="Ex: Chapa de Aço Inox 2mm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unidade:</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitOfMeasure })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="M">M (Metro)</option>
                    <option value="M2">M² (Metro Quadrado)</option>
                    <option value="L">L (Litro)</option>
                    <option value="PC">PC (Peça)</option>
                    <option value="CX">CX (Caixa)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custo Unitário (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estoque Mínimo:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estoque Atual:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Localização Física:</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    placeholder="Ex: Almox. A - RACK-02"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fornecedor Principal:</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Não especificado --</option>
                  {db.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city}/{s.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações:</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  placeholder="Normas, especificações, dimensões de barra..."
                />
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste Rápido de Saldo */}
      {adjustModalMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-blue-400" />
                <span>Movimentação de Estoque</span>
              </h3>
              <button onClick={() => setAdjustModalMat(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="p-5 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-800 text-sm">{adjustModalMat.name}</span>
                <div className="text-slate-500 font-mono mt-0.5">
                  Saldo Atual: <strong>{adjustModalMat.currentStock} {adjustModalMat.unit}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantidade a movimentar (Use valor positivo para Entrada ou negativo para Saída):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                    placeholder="Ex: +50 ou -10"
                  />
                  <span className="font-mono font-bold text-slate-600">{adjustModalMat.unit}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Novo Saldo Projetado:{' '}
                  <strong className="font-mono text-blue-700">
                    {Math.max(0, adjustModalMat.currentStock + adjustDelta)} {adjustModalMat.unit}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Documento:</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Ex: NF 4580 ou Ajuste de Inventário"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalMat(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Confirmar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
