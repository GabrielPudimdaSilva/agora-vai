import React, { useState } from 'react';
import {
  Factory,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Gauge,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionCapacity } from '../../types';

export const CapacityView: React.FC = () => {
  const { db, addCapacity, updateCapacity, deleteCapacity } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<ProductionCapacity | null>(null);

  const initialForm: {
    code: string;
    name: string;
    dailyCapacityHours: number;
    activeWorkers: number;
    shiftType: string;
    efficiencyRate: number;
    status: 'OPERACIONAL' | 'MANUTENCAO' | 'OCIOSA';
    notes: string;
  } = {
    code: '',
    name: '',
    dailyCapacityHours: 16,
    activeWorkers: 3,
    shiftType: '2 Turnos (06h às 22h)',
    efficiencyRate: 85,
    status: 'OPERACIONAL',
    notes: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const openNewModal = () => {
    setEditingCapacity(null);
    const nextCode = `LINHA-${String(db.capacities.length + 1).padStart(2, '0')}`;
    setFormData({ ...initialForm, code: nextCode });
    setIsModalOpen(true);
  };

  const openEditModal = (cap: ProductionCapacity) => {
    setEditingCapacity(cap);
    setFormData({
      code: cap.code,
      name: cap.name,
      dailyCapacityHours: cap.dailyCapacityHours,
      activeWorkers: cap.activeWorkers,
      shiftType: cap.shiftType,
      efficiencyRate: cap.efficiencyRate,
      status: cap.status,
      notes: cap.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCapacity) {
      updateCapacity(editingCapacity.id, formData);
    } else {
      addCapacity(formData);
    }
    setIsModalOpen(false);
  };

  // Cálculo da carga alocada em cada linha com base nas OPs ativas
  const getCapacityLoad = (capId: string) => {
    const allocatedMinutes = db.productionOrders
      .filter((op) => op.capacityId === capId && op.status !== 'CONCLUIDA' && op.status !== 'CANCELADA')
      .reduce((acc, op) => acc + (op.plannedTotalMinutes || 0), 0);
    return Math.round(allocatedMinutes / 60);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Factory className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Capacidade Produtiva & Postos de Trabalho</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Defina as linhas fabris, capacidade em horas/dia, número de operadores alocados e turnos para planejamento.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Linha / Setor</span>
        </button>
      </div>

      {/* Grid of Capacities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {db.capacities.map((cap) => {
          const hoursBooked = getCapacityLoad(cap.id);
          const daysLoad = (hoursBooked / (cap.dailyCapacityHours || 8)).toFixed(1);

          return (
            <div
              key={cap.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {cap.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cap.status === 'OPERACIONAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cap.status === 'MANUTENCAO'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cap.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(cap)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir a linha ${cap.name}?`)) {
                          deleteCapacity(cap.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2">{cap.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{cap.shiftType}</p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Disponibilidade</div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                      {cap.dailyCapacityHours}h / dia
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Equipe</div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                      {cap.activeWorkers} operadores
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Eficiência</div>
                    <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
                      {cap.efficiencyRate}%
                    </div>
                  </div>
                </div>

                {/* Carga Atual Alocada */}
                <div className="mt-4 bg-blue-50/60 border border-blue-100 p-3 rounded-lg text-xs">
                  <div className="flex items-center justify-between text-slate-700 mb-1">
                    <span className="font-medium">Carga de OPs Alocada:</span>
                    <span className="font-mono font-bold text-blue-900">
                      {hoursBooked}h (~{daysLoad} dias de produção)
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (hoursBooked / (cap.dailyCapacityHours * 5 || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {cap.notes && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                  Maquinário / Observações: {cap.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Factory className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {editingCapacity ? 'Editar Linha de Produção' : 'Cadastrar Posto de Trabalho / Linha'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
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
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Setor / Linha:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    placeholder="Ex: Setor de Usinagem CNC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horas / Dia:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={24}
                    value={formData.dailyCapacityHours}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyCapacityHours: parseFloat(e.target.value) || 8 })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº Operadores:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.activeWorkers}
                    onChange={(e) =>
                      setFormData({ ...formData, activeWorkers: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Eficiência (%):</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={100}
                    value={formData.efficiencyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, efficiencyRate: parseInt(e.target.value) || 85 })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Regime de Turnos:</label>
                  <input
                    type="text"
                    required
                    value={formData.shiftType}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    placeholder="Ex: 2 Turnos (06h às 22h)"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Operacional:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="OPERACIONAL">OPERACIONAL</option>
                    <option value="MANUTENCAO">EM MANUTENÇÃO</option>
                    <option value="OCIOSA">OCIOSA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maquinários / Observações:</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Ex: Torno CNC Romi, 2 serras de fita automáticas..."
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
