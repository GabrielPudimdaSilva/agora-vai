import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  X,
  PackageCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';

export const SuppliersView: React.FC = () => {
  const { db, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const initialForm = {
    code: '',
    name: '',
    tradeName: '',
    document: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    state: 'SP',
    deliveryLeadTimeDays: 3,
    suppliedCategories: ['Tubos de Aço', 'Parafusos'],
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [categoryInput, setCategoryInput] = useState('');

  const filteredSuppliers = db.suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.tradeName && s.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.document.includes(searchTerm) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNewModal = () => {
    setEditingSupplier(null);
    const nextCode = `FORN-${String(db.suppliers.length + 1).padStart(3, '0')}`;
    setFormData({ ...initialForm, code: nextCode });
    setIsModalOpen(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      code: sup.code,
      name: sup.name,
      tradeName: sup.tradeName || '',
      document: sup.document,
      contactPerson: sup.contactPerson,
      email: sup.email,
      phone: sup.phone,
      city: sup.city,
      state: sup.state,
      deliveryLeadTimeDays: sup.deliveryLeadTimeDays,
      suppliedCategories: [...sup.suppliedCategories],
      notes: sup.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleAddCategory = () => {
    if (!categoryInput.trim()) return;
    if (!formData.suppliedCategories.includes(categoryInput.trim())) {
      setFormData({
        ...formData,
        suppliedCategories: [...formData.suppliedCategories, categoryInput.trim()],
      });
    }
    setCategoryInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setFormData({
      ...formData,
      suppliedCategories: formData.suppliedCategories.filter((c) => c !== cat),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
    } else {
      addSupplier(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Cadastro de Fornecedores</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de fornecedores homologados de matérias-primas e prazos de entrega (Lead Time).
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por razão social, CNPJ ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-xl border border-slate-200">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhum fornecedor cadastrado.</p>
          </div>
        ) : (
          filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {sup.code}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(sup)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir fornecedor ${sup.name}?`)) {
                          deleteSupplier(sup.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-2">{sup.name}</h3>
                {sup.tradeName && <p className="text-xs text-blue-700 font-medium">{sup.tradeName}</p>}
                <p className="text-xs text-slate-500 font-mono mt-0.5">CNPJ: {sup.document}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      Prazo Médio de Entrega: <strong className="font-mono">{sup.deliveryLeadTimeDays} dias</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone} • {sup.contactPerson}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.city}/{sup.state}</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {sup.suppliedCategories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {sup.notes && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  "{sup.notes}"
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código:</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Razão Social:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    placeholder="Ex: Aços Brasil Tubos S/A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia:</label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CNPJ:</label>
                  <input
                    type="text"
                    required
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contato / Vendedor:</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone:</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prazo de Entrega (dias):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.deliveryLeadTimeDays}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryLeadTimeDays: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">E-mail de Pedidos:</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade / UF:</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Campinas/SP"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Categorias Fornecidas */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Itens e Categorias Fornecidas:</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    placeholder="Ex: Chapas Inox, Parafusos M8..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-semibold"
                  >
                    + Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.suppliedCategories.map((c, i) => (
                    <span
                      key={i}
                      className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md flex items-center space-x-1"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(c)}
                        className="text-blue-500 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Condições / Observações:</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Prazo para pagamento, pedido mínimo, laudos de lote..."
                />
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
