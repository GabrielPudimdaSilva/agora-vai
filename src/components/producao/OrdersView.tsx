import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  ClipboardList,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  User,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderItem, OrderStatus } from '../../types';

interface OrdersViewProps {
  onOpenCreateOPForOrder?: (orderId: string) => void;
  onGoToOP?: (opId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onOpenCreateOPForOrder,
  onGoToOP,
}) => {
  const { db, addOrder, updateOrder, deleteOrder, createProductionOrderFromOrder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form State
  const initialForm = {
    clientId: db.clients[0]?.id || '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'PENDENTE' as OrderStatus,
    notes: '',
    items: [] as OrderItem[],
  };

  const [formData, setFormData] = useState(initialForm);

  // Item form inside modal
  const [selectedProductId, setSelectedProductId] = useState(db.products[0]?.id || '');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemCustomPrice, setItemCustomPrice] = useState<number>(0);

  const filteredOrders = db.orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openNewModal = () => {
    setEditingOrder(null);
    const prod = db.products[0];
    setSelectedProductId(prod?.id || '');
    setItemQuantity(1);
    setItemCustomPrice(prod?.salePrice || 0);

    setFormData({
      ...initialForm,
      clientId: db.clients[0]?.id || '',
      items: prod
        ? [
            {
              productId: prod.id,
              productCode: prod.code,
              productName: prod.name,
              quantity: 1,
              unitPrice: prod.salePrice,
              totalPrice: prod.salePrice,
            },
          ]
        : [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      clientId: order.clientId,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      status: order.status,
      notes: order.notes || '',
      items: [...order.items],
    });
    setIsModalOpen(true);
  };

  const handleAddItemToOrder = () => {
    const prod = db.products.find((p) => p.id === selectedProductId);
    if (!prod || itemQuantity <= 0) return;

    const unitPrice = itemCustomPrice > 0 ? itemCustomPrice : prod.salePrice;
    const totalPrice = Number((unitPrice * itemQuantity).toFixed(2));

    const newItem: OrderItem = {
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      quantity: itemQuantity,
      unitPrice,
      totalPrice,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
    setItemQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== index),
    });
  };

  const computedTotalAmount = formData.items.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Adicione pelo menos um produto ao pedido.');
      return;
    }

    const client = db.clients.find((c) => c.id === formData.clientId);

    if (editingOrder) {
      updateOrder(editingOrder.id, {
        clientId: formData.clientId,
        clientName: client?.name || editingOrder.clientName,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        status: formData.status,
        notes: formData.notes,
        items: formData.items,
        totalAmount: computedTotalAmount,
      });
    } else {
      addOrder({
        clientId: formData.clientId,
        clientName: client?.name || 'Cliente Geral',
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        status: formData.status,
        notes: formData.notes,
        items: formData.items,
        totalAmount: computedTotalAmount,
      });
    }
    setIsModalOpen(false);
  };

  const handleGenerateOP = (order: Order) => {
    if (order.productionOrderId) {
      if (onGoToOP) {
        onGoToOP(order.productionOrderId);
      }
      return;
    }
    createProductionOrderFromOrder(order.id);
  };

  const statusBadge: Record<OrderStatus, { label: string; bg: string; text: string }> = {
    PENDENTE: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-800' },
    EM_PRODUCAO: { label: 'Em Produção', bg: 'bg-blue-100', text: 'text-blue-800' },
    CONCLUIDO: { label: 'Concluído', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    CANCELADO: { label: 'Cancelado', bg: 'bg-rose-100', text: 'text-rose-800' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Pedidos de Venda</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastro de pedidos comerciais com emissão automática de Ordens de Produção (OP) para a fábrica.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido de Venda</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número do pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todos os Pedidos ({db.orders.length})</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="EM_PRODUCAO">Em Produção</option>
            <option value="CONCLUIDO">Concluídos</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const status = statusBadge[ord.status] || {
              label: ord.status,
              bg: 'bg-slate-100',
              text: 'text-slate-700',
            };
            const linkedOP = db.productionOrders.find((op) => op.orderId === ord.id || op.id === ord.productionOrderId);

            return (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2 py-0.5 rounded">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Data: {ord.orderDate} • Entrega: <strong className="text-slate-700">{ord.deliveryDate}</strong>
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{ord.clientName}</h3>

                    {/* Order Items */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ord.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center space-x-2"
                        >
                          <span className="font-semibold text-slate-800">{item.productName}</span>
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1 rounded">
                            {item.quantity} un
                          </span>
                        </div>
                      ))}
                    </div>

                    {ord.notes && <p className="text-xs text-slate-500 mt-2 italic">Obs: {ord.notes}</p>}
                  </div>

                  {/* Right Info: Total & Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-center justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Valor Total</div>
                      <div className="text-lg font-mono font-black text-slate-900">
                        R$ {ord.totalAmount.toFixed(2)}
                      </div>
                    </div>

                    {/* Botão de Emitir OP ou Visualizar OP Vinculada */}
                    {linkedOP ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-lg font-mono font-bold">
                          OP Vinculada: {linkedOP.code}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateOP(ord)}
                        className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span>Emitir Ordem de Produção (OP)</span>
                      </button>
                    )}

                    <div className="flex items-center space-x-1 pl-1">
                      <button
                        onClick={() => openEditModal(ord)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o pedido ${ord.orderNumber}?`)) {
                            deleteOrder(ord.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Criar / Editar Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {editingOrder ? `Editar Pedido ${editingOrder.orderNumber}` : 'Novo Pedido de Venda'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Cliente:</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    {db.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name} ({c.document})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status do Pedido:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_PRODUCAO">Em Produção</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Emissão:</label>
                  <input
                    type="date"
                    required
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prazo de Entrega Acordado:</label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Produtos do Pedido
                </h4>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2 items-center">
                  <div className="flex-1 w-full">
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        const p = db.products.find((prod) => prod.id === e.target.value);
                        if (p) setItemCustomPrice(p.salePrice);
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      {db.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} (R$ {p.salePrice.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qtd"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToOrder}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold whitespace-nowrap"
                  >
                    + Adicionar Item
                  </button>
                </div>

                {/* Table of items */}
                <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-right">Qtd</th>
                        <th className="p-2.5 text-right">Preço Unit.</th>
                        <th className="p-2.5 text-right">Total</th>
                        <th className="p-2.5 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            Nenhum item adicionado.
                          </td>
                        </tr>
                      ) : (
                        formData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <span className="font-semibold text-slate-800">{item.productName}</span>
                              <span className="text-[11px] text-slate-400 block font-mono">{item.productCode}</span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold">{item.quantity} un</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">
                              R$ {item.unitPrice.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              R$ {item.totalPrice.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <X className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 text-right">
                  <span className="text-slate-500 font-medium">Total do Pedido: </span>
                  <span className="text-base font-mono font-extrabold text-blue-900 ml-1">
                    R$ {computedTotalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações do Pedido:</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Condições de pagamento, frete FOB/CIF, instruções de entrega..."
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
                  Salvar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
