import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  User,
  AlertCircle,
  Calendar,
  History,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionOrder, TimeLog, ProcessStep } from '../../types';

interface TimeTrackingModalProps {
  op: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TimeTrackingModal: React.FC<TimeTrackingModalProps> = ({ op, isOpen, onClose }) => {
  const { addTimeLogToOP, currentUser } = useApp();

  // Stopwatch state
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Form State
  const [selectedStepId, setSelectedStepId] = useState('');
  const [operatorName, setOperatorName] = useState('Roberto Antunes Costa');
  const [manualMinutes, setManualMinutes] = useState<number>(30);
  const [producedQuantity, setProducedQuantity] = useState<number>(op?.quantity || 1);
  const [notes, setNotes] = useState('');
  const [useStopwatch, setUseStopwatch] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isRunning) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (op && op.processSteps.length > 0) {
      setSelectedStepId(op.processSteps[0].id);
      setProducedQuantity(op.quantity);
    }
  }, [op]);

  if (!isOpen || !op) return null;

  const currentStep = op.processSteps.find((s) => s.id === selectedStepId) || op.processSteps[0];

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMinutes = useStopwatch ? Math.max(1, Math.round(secondsElapsed / 60)) : manualMinutes;

    if (finalMinutes <= 0) {
      alert('Informe um tempo de processo maior que zero.');
      return;
    }

    const now = new Date().toISOString();
    const startTime = new Date(Date.now() - finalMinutes * 60000).toISOString();

    addTimeLogToOP(op.id, {
      stepId: currentStep?.id || 'step-geral',
      stepName: currentStep?.name || 'Operação de Chão de Fábrica',
      operatorName,
      startTime,
      endTime: now,
      durationMinutes: finalMinutes,
      producedQuantity: Number(producedQuantity),
      notes,
    });

    // Reset
    setIsRunning(false);
    setSecondsElapsed(0);
    setNotes('');
    onClose();
  };

  const plannedTotal = op.plannedTotalMinutes || 1;
  const actualTotal = op.actualTotalMinutes || 0;
  const variancePct = Math.round(((actualTotal - plannedTotal) / plannedTotal) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600/30 border border-blue-500 rounded-lg text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Apontamento de Tempo de Produção</h3>
              <p className="text-xs text-slate-400 font-mono">
                {op.code} • {op.productName} ({op.quantity} {op.unit})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* Summary / Time Comparison Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700">Tempo de Processo Acumulado:</span>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-slate-900 font-bold">
                  {Math.floor(actualTotal / 60)}h {actualTotal % 60}m apontados
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-500">
                  {Math.floor(plannedTotal / 60)}h {plannedTotal % 60}m planejados
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  actualTotal > plannedTotal ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, (actualTotal / plannedTotal) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Roteiro com {op.processSteps.length} etapas cadastradas</span>
              {variancePct > 0 ? (
                <span className="text-amber-700 font-semibold">Desvio: +{variancePct}% sobre o padrão</span>
              ) : (
                <span className="text-emerald-700 font-semibold">Dentro do tempo padrão ({variancePct}%)</span>
              )}
            </div>
          </div>

          {/* Mode Switch: Cronômetro ao vivo vs Lançamento Manual */}
          <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-100">
            <button
              type="button"
              onClick={() => setUseStopwatch(false)}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                !useStopwatch ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apontamento Manual (Minutos)
            </button>
            <button
              type="button"
              onClick={() => setUseStopwatch(true)}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                useStopwatch ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cronômetro ao Vivo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Stopwatch Section */}
            {useStopwatch ? (
              <div className="bg-slate-950 text-white rounded-xl p-6 text-center shadow-inner border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  Cronômetro de Chão de Fábrica
                </div>
                <div className="text-4xl font-extrabold font-mono text-blue-400 my-3 tracking-wider">
                  {formatStopwatch(secondsElapsed)}
                </div>
                <div className="flex items-center justify-center space-x-3">
                  {!isRunning ? (
                    <button
                      type="button"
                      onClick={() => setIsRunning(true)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Iniciar / Continuar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRunning(false)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all shadow-md"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pausar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRunning(false);
                      setSecondsElapsed(0);
                    }}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    title="Zerar cronômetro"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-3">
                  Equivalente a: <strong>{Math.round(secondsElapsed / 60)} minutos</strong> a registrar.
                </p>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempo Gasto nesta Operação (em minutos):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    required
                    min={1}
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  />
                  <span className="font-mono text-slate-500 font-bold">minutos</span>
                </div>
                <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
                  <span>Sugestões rápidas:</span>
                  {[15, 30, 45, 60, 90, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setManualMinutes(m)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Etapa e Operador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Etapa do Roteiro:</label>
                <select
                  value={selectedStepId}
                  onChange={(e) => setSelectedStepId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  {op.processSteps.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.standardMinutes} min padrão)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operador Responsável:</label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Nome do operador ou soldador..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peças Processadas / Avançadas:</label>
                <input
                  type="number"
                  min={1}
                  value={producedQuantity}
                  onChange={(e) => setProducedQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responsável Técnico que Autoriza:
                </label>
                <div className="px-3 py-1.5 bg-slate-100 rounded-lg font-medium text-slate-700 border border-slate-200">
                  {currentUser.name}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Observações Operacionais:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                placeholder="Ocorrências, regulagem de máquina, ferramenta utilizada..."
              />
            </div>

            {/* Submit */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
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
                Salvar Apontamento
              </button>
            </div>
          </form>

          {/* Histórico de Apontamentos da OP */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-700 flex items-center space-x-1.5 mb-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Histórico de Apontamentos Desta OP ({op.timeLogs.length})</span>
            </h4>

            {op.timeLogs.length === 0 ? (
              <p className="text-slate-400 italic">Nenhum apontamento registrado ainda para esta ordem.</p>
            ) : (
              <div className="space-y-2">
                {op.timeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{log.stepName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Operador: <strong className="text-slate-700">{log.operatorName}</strong> • {log.producedQuantity} peças
                      </div>
                      {log.notes && <div className="text-[11px] text-slate-600 mt-1 italic">"{log.notes}"</div>}
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Registrado por: {log.loggedByUserName} às {new Date(log.startTime).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        +{log.durationMinutes} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
