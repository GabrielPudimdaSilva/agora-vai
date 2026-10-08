import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Printer,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Boxes,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionOrder, ProductionOrderStatus } from '../../types';

interface ProductionOrdersViewProps {
  onOpenCreateOPModal: () => void;
  onOpenPrintOP: (op: ProductionOrder) => void;
  onOpenTimeLog: (op: ProductionOrder) => void;
  onOpenCompleteOP: (op: ProductionOrder) => void;
}

export const ProductionOrdersView: React.FC<ProductionOrdersViewProps> = ({
  onOpenCreateOPModal,
  onOpenPrintOP,
  onOpenTimeLog,
  onOpenCompleteOP,
}) => {
  const { db, updateProductionOrderStatus, deleteProductionOrder, currentUser } = useApp();
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  const filteredOPs = db.productionOrders.filter((op) => {
    const matchesSearch =
      op.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.clientName && op.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'TODOS' || op.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: { status: ProductionOrderStatus; title: string; color: string; badge: string }[] = [
    { status: 'PLANEJADA', title: '1. Planejadas', color: 'border-slate-300 bg-slate-50', badge: 'bg-slate-200 text-slate-800' },
    { status: 'SEPARACAO', title: '2. Separação de Insumos', color: 'border-amber-300 bg-amber-50/40', badge: 'bg-amber-100 text-amber-900' },
    { status: 'EM_PRODUCAO', title: '3. Em Produção', color: 'border-blue-400 bg-blue-50/40', badge: 'bg-blue-100 text-blue-900' },
    { status: 'QUALIDADE', title: '4. Controle de Qualidade', color: 'border-purple-300 bg-purple-50/40', badge: 'bg-purple-100 text-purple-900' },
    { status: 'CONCLUIDA', title: '5. Concluídas & Baixadas', color: 'border-emerald-300 bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-900' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Gestão de Ordens de Produção (OP)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento em tempo real das etapas de manufatura, registro de tempos, consumo de insumos e baixa formal.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Toggle View Mode */}
          <div className="flex border border-slate-200 rounded-xl bg-white p-1 shadow-xs">
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                viewMode === 'KANBAN' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização Quadro Kanban"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Quadro</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                viewMode === 'TABLE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização Tabela"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateOPModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nova OP</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código da OP, produto, lote ou cliente..."
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
            <option value="TODOS">Todas as OPs ({db.productionOrders.length})</option>
            <option value="PLANEJADA">Planejada</option>
            <option value="SEPARACAO">Separação</option>
            <option value="EM_PRODUCAO">Em Produção</option>
            <option value="QUALIDADE">Qualidade</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'KANBAN' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {columns.map((col) => {
            const columnOPs = filteredOPs.filter((op) => op.status === col.status);

            return (
              <div
                key={col.status}
                className={`rounded-2xl border ${col.color} p-3 min-h-[500px] flex flex-col`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                  <span className="font-bold text-xs text-slate-800">{col.title}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {columnOPs.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnOPs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                      Nenhuma OP nesta etapa
                    </div>
                  ) : (
                    columnOPs.map((op) => {
                      const allStockAvailable = op.materials.every((m) => m.isAvailable);
                      const progressPct =
                        op.plannedTotalMinutes > 0
                          ? Math.min(100, Math.round((op.actualTotalMinutes / op.plannedTotalMinutes) * 100))
                          : 0;

                      return (
                        <div
                          key={op.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all p-3.5 space-y-2.5"
                        >
                          {/* Card Top */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs bg-slate-900 text-white px-1.5 py-0.5 rounded">
                              {op.code}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{op.lotNumber}</span>
                          </div>

                          {/* Product and qty */}
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs line-clamp-2">{op.productName}</h4>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between">
                              <span>
                                Qtd: <strong className="text-slate-800">{op.quantity} {op.unit}</strong>
                              </span>
                              <span>Prazo: {op.targetDate}</span>
                            </div>
                          </div>

                          {/* Stock Availability indicator */}
                          <div className="text-[10px] flex items-center justify-between pt-1 border-t border-slate-100">
                            {allStockAvailable ? (
                              <span className="text-emerald-700 font-semibold flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Insumos OK
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-0.5" /> Falta Insumo
                              </span>
                            )}
                            <span className="text-slate-400 font-mono">
                              {Math.floor(op.actualTotalMinutes / 60)}h{op.actualTotalMinutes % 60}m / {Math.floor(op.plannedTotalMinutes / 60)}h
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {/* Move Status Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <select
                              value={op.status}
                              onChange={(e) => updateProductionOrderStatus(op.id, e.target.value as any)}
                              className="text-[10px] border border-slate-300 rounded px-1.5 py-1 bg-white text-slate-700 font-medium max-w-[110px]"
                            >
                              <option value="PLANEJADA">Planejada</option>
                              <option value="SEPARACAO">Separação</option>
                              <option value="EM_PRODUCAO">Em Produção</option>
                              <option value="QUALIDADE">Qualidade</option>
                              <option value="CONCLUIDA">Concluída</option>
                              <option value="CANCELADA">Cancelada</option>
                            </select>

                            {/* Card action icons */}
                            <div className="flex items-center space-x-1">
                              {op.status !== 'CONCLUIDA' && (
                                <button
                                  onClick={() => onOpenTimeLog(op)}
                                  title="Apontar Tempo"
                                  className="p-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                                >
                                  <Play className="w-3.5 h-3.5 fill-blue-700" />
                                </button>
                              )}
                              <button
                                onClick={() => onOpenPrintOP(op)}
                                title="Imprimir Ordem de Produção"
                                className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              {op.status !== 'CONCLUIDA' && (
                                <button
                                  onClick={() => onOpenCompleteOP(op)}
                                  title="Concluir / Baixa"
                                  className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Código da OP</th>
                  <th className="p-3.5">Produto Fabricado</th>
                  <th className="p-3.5 text-center">Quantidade</th>
                  <th className="p-3.5">Setor / Linha</th>
                  <th className="p-3.5">Prazo</th>
                  <th className="p-3.5">Tempo Apontado</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOPs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Nenhuma ordem de produção localizada.
                    </td>
                  </tr>
                ) : (
                  filteredOPs.map((op) => {
                    return (
                      <tr key={op.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {op.code}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                            Lote: {op.lotNumber}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{op.productName}</div>
                          {op.clientName && (
                            <span className="text-[11px] text-slate-500 block">Cliente: {op.clientName}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                          {op.quantity} {op.unit}
                        </td>
                        <td className="p-3.5 text-slate-600">{op.capacityName || 'Linha Geral'}</td>
                        <td className="p-3.5 font-mono text-slate-700">{op.targetDate}</td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-slate-800">
                            {Math.floor(op.actualTotalMinutes / 60)}h {op.actualTotalMinutes % 60}m
                          </div>
                          <span className="text-[10px] text-slate-400">
                            plan: {Math.floor(op.plannedTotalMinutes / 60)}h {op.plannedTotalMinutes % 60}m
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <select
                            value={op.status}
                            onChange={(e) => updateProductionOrderStatus(op.id, e.target.value as any)}
                            className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white font-medium"
                          >
                            <option value="PLANEJADA">Planejada</option>
                            <option value="SEPARACAO">Separação</option>
                            <option value="EM_PRODUCAO">Em Produção</option>
                            <option value="QUALIDADE">Qualidade</option>
                            <option value="CONCLUIDA">Concluída</option>
                            <option value="CANCELADA">Cancelada</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {op.status !== 'CONCLUIDA' && (
                              <button
                                onClick={() => onOpenTimeLog(op)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold flex items-center space-x-1"
                              >
                                <Play className="w-3 h-3 fill-blue-700" />
                                <span>Apontar</span>
                              </button>
                            )}
                            <button
                              onClick={() => onOpenPrintOP(op)}
                              title="Imprimir OP"
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {op.status !== 'CONCLUIDA' && (
                              <button
                                onClick={() => onOpenCompleteOP(op)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                              >
                                Baixa
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm(`Excluir OP ${op.code}?`)) {
                                  deleteProductionOrder(op.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
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
      )}
    </div>
  );
};
