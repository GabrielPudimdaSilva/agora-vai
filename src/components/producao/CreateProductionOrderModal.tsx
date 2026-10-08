import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Calendar,
  Layers,
  Factory,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface CreateProductionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProduct?: Product | null;
  preselectedOrderId?: string | null;
}

export const CreateProductionOrderModal: React.FC<CreateProductionOrderModalProps> = ({
  isOpen,
  onClose,
  preselectedProduct,
  preselectedOrderId,
}) => {
  const { db, createProductionOrder, currentUser } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [targetDate, setTargetDate] = useState<string>('');
  const [lotNumber, setLotNumber] = useState<string>('');
  const [capacityId, setCapacityId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const prod = preselectedProduct || db.products[0];
      setSelectedProductId(prod?.id || '');
      setQuantity(1);
      const defaultDate = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
      setTargetDate(defaultDate);

      const seq = String(db.productionOrders.length + 1).padStart(2, '0');
      const dateCode = new Date().toISOString().slice(2, 7).replace('-', '');
      setLotNumber(`LT-${dateCode}-${seq}`);

      setCapacityId(db.capacities[0]?.id || '');
      setOrderId(preselectedOrderId || '');
      setNotes('');
    }
  }, [isOpen, preselectedProduct, preselectedOrderId, db.products, db.capacities, db.productionOrders]);

  if (!isOpen) return null;

  const currentProduct = db.products.find((p) => p.id === selectedProductId) || db.products[0];

  // Calculate required materials on the fly for preview
  const materialsRequired = currentProduct
    ? currentProduct.materials.map((bom) => {
        const mat = db.rawMaterials.find((m) => m.id === bom.materialId);
        const reqQty = Number((bom.quantityPerUnit * quantity).toFixed(2));
        const avail = mat ? mat.currentStock : 0;
        return {
          id: bom.materialId,
          name: mat?.name || 'Insumo',
          code: mat?.code || 'N/A',
          unit: mat?.unit || 'UN',
          required: reqQty,
          available: avail,
          isSufficient: avail >= reqQty,
        };
      })
    : [];

  const allAvailable = materialsRequired.every((m) => m.isSufficient);

  const estimatedTotalHours = currentProduct
    ? ((currentProduct.totalStandardTimeMinutes * quantity) / 60).toFixed(1)
    : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || quantity <= 0) return;

    createProductionOrder({
      productId: currentProduct.id,
      quantity,
      lotNumber,
      targetDate,
      capacityId: capacityId || undefined,
      orderId: orderId || undefined,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">Emissão de Ordem de Produção (OP)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Produto e Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Produto Manufaturado (Ficha Técnica):
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                {db.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantidade a Produzir:
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                />
                <span className="font-mono text-slate-500 font-bold">{currentProduct?.unit}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lote de Fabricação:</label>
              <input
                type="text"
                required
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold uppercase text-blue-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prazo de Conclusão:</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Posto / Linha Alocada:</label>
              <select
                value={capacityId}
                onChange={(e) => setCapacityId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                {db.capacities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vínculo com Pedido de Venda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vincular a Pedido de Venda:</label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Produção para Estoque (Sem Pedido) --</option>
                {db.orders
                  .filter((o) => o.status !== 'CONCLUIDO')
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.clientName} (Entrega: {o.deliveryDate})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Responsável Técnico (Emissor):</label>
              <div className="px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-800 font-medium">
                {currentUser.name} ({currentUser.registrationNumber})
              </div>
            </div>
          </div>

          {/* Checagem Automática do Estoque de Matérias-Primas */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Checagem Automática de Insumos (BOM * {quantity})</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Tempo estimado: {estimatedTotalHours} horas fabris
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Insumo</th>
                    <th className="p-2 text-right">Qtd Necessária</th>
                    <th className="p-2 text-right">Saldo Atual</th>
                    <th className="p-2 text-center">Disponibilidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialsRequired.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-400">
                        Nenhum insumo configurado na ficha deste produto.
                      </td>
                    </tr>
                  ) : (
                    materialsRequired.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-50">
                        <td className="p-2">
                          <span className="font-medium text-slate-800">{mat.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{mat.code}</span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          {mat.required} {mat.unit}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-600">
                          {mat.available} {mat.unit}
                        </td>
                        <td className="p-2 text-center">
                          {mat.isSufficient ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              ✓ Disponível
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              ⚠ Falta Saldo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!allAvailable && (
              <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Atenção: Um ou mais insumos não possuem estoque suficiente no almoxarifado. A OP pode ser emitida, mas exigirá requisição de compra.
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observações Técnicas da OP:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              placeholder="Instruções para o corte, ferramentas especiais, tolerâncias..."
            />
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-900/20"
            >
              Emitir Ordem de Produção
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
