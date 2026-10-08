import React from 'react';
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Boxes,
  Plus,
  Play,
  Printer,
  ChevronRight,
  Factory,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from './Navbar';
import { ProductionOrder } from '../types';

interface DashboardProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateOPModal: () => void;
  onOpenPrintOP: (op: ProductionOrder) => void;
  onOpenTimeLog: (op: ProductionOrder) => void;
  onOpenCompleteOP: (op: ProductionOrder) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTab,
  onOpenCreateOPModal,
  onOpenPrintOP,
  onOpenTimeLog,
  onOpenCompleteOP,
}) => {
  const { db, currentUser } = useApp();

  // Métricas
  const activeOPs = db.productionOrders.filter(
    (op) => op.status !== 'CONCLUIDA' && op.status !== 'CANCELADA'
  );
  const completedOPs = db.productionOrders.filter((op) => op.status === 'CONCLUIDA');
  const criticalMaterials = db.rawMaterials.filter((m) => m.currentStock <= m.minStock);

  // Total de horas planejadas vs horas apontadas nas OPs ativas
  const totalPlannedMinutes = activeOPs.reduce((acc, op) => acc + (op.plannedTotalMinutes || 0), 0);
  const totalActualMinutes = activeOPs.reduce((acc, op) => acc + (op.actualTotalMinutes || 0), 0);

  // Pedidos pendentes
  const pendingOrders = db.orders.filter((o) => o.status === 'PENDENTE' || o.status === 'EM_PRODUCAO');

  // Status mapping
  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    PLANEJADA: { label: 'Planejada', bg: 'bg-slate-100', text: 'text-slate-700' },
    SEPARACAO: { label: 'Em Separação', bg: 'bg-amber-100', text: 'text-amber-800' },
    EM_PRODUCAO: { label: 'Em Produção', bg: 'bg-blue-100', text: 'text-blue-800' },
    QUALIDADE: { label: 'Controle de Qualidade', bg: 'bg-purple-100', text: 'text-purple-800' },
    CONCLUIDA: { label: 'Concluída', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    CANCELADA: { label: 'Cancelada', bg: 'bg-rose-100', text: 'text-rose-800' },
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Technical Responsible Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
              Painel de Controle PCP
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-slate-100">
            Gerenciamento de Operações e Produção
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Responsável Técnico ativo:{' '}
            <strong className="text-blue-300 font-semibold">{currentUser.name}</strong>{' '}
            <span className="text-slate-400">({currentUser.registrationNumber})</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCreateOPModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-900/40 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nova OP</span>
          </button>
          <button
            onClick={() => onSelectTab('orders')}
            className="flex items-center space-x-2 bg-slate-700/80 hover:bg-slate-700 text-slate-100 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-600 transition-all"
          >
            <span>Ver Pedidos ({pendingOrders.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active OPs */}
        <div
          onClick={() => onSelectTab('production_orders')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              OPs em Andamento
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{activeOPs.length}</span>
            <span className="text-xs text-slate-500 font-medium">ordens ativas</span>
          </div>
          <div className="mt-2 text-xs text-blue-600 flex items-center font-medium">
            <span>Acompanhar no chão de fábrica</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Carga de Horas de Processo */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tempo de Processo
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {(totalActualMinutes / 60).toFixed(1)}h
            </span>
            <span className="text-xs text-slate-400">
              / {(totalPlannedMinutes / 60).toFixed(1)}h plan.
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min(100, totalPlannedMinutes > 0 ? (totalActualMinutes / totalPlannedMinutes) * 100 : 0)}%`,
              }}
            />
          </div>
        </div>

        {/* OPs Concluídas */}
        <div
          onClick={() => onSelectTab('reports')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              OPs Concluídas
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {completedOPs.length}
            </span>
            <span className="text-xs text-slate-500">lotes finalizados</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center font-medium">
            <span>Ver relatórios e laudos</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Alerta de Matéria-Prima */}
        <div
          onClick={() => onSelectTab('materials')}
          className={`bg-white rounded-xl p-5 border shadow-xs cursor-pointer transition-all group ${
            criticalMaterials.length > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estoque de Insumos
            </span>
            <div
              className={`p-2 rounded-lg ${
                criticalMaterials.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                criticalMaterials.length > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {criticalMaterials.length}
            </span>
            <span className="text-xs text-slate-500">abaixo do mínimo</span>
          </div>
          <div className="mt-2 text-xs text-amber-700 flex items-center font-medium">
            {criticalMaterials.length > 0 ? (
              <span>Reposição necessária urgente</span>
            ) : (
              <span className="text-slate-500">Estoque em níveis normais</span>
            )}
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>

      {/* Grid: OPs em Produção Ativas & Postos de Trabalho */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Tabela de OPs em Andamento */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Ordens de Produção em Andamento</h2>
              <p className="text-xs text-slate-500">Acompanhamento e registro de tempos no chão de fábrica</p>
            </div>
            <button
              onClick={() => onSelectTab('production_orders')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center"
            >
              <span>Ver todas ({db.productionOrders.length})</span>
              <ArrowUpRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          {activeOPs.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">Nenhuma ordem de produção em andamento.</p>
              <button
                onClick={onOpenCreateOPModal}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Emitir Ordem de Produção
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {activeOPs.slice(0, 5).map((op) => {
                const statusInfo = statusLabels[op.status] || {
                  label: op.status,
                  bg: 'bg-slate-100',
                  text: 'text-slate-800',
                };
                const progressPct =
                  op.plannedTotalMinutes > 0
                    ? Math.min(100, Math.round((op.actualTotalMinutes / op.plannedTotalMinutes) * 100))
                    : 0;

                return (
                  <div key={op.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{op.code}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">Lote: {op.lotNumber}</span>
                        </div>
                        <h3 className="font-semibold text-slate-800 text-sm mt-1">{op.productName}</h3>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            Qtd: <strong className="text-slate-700">{op.quantity} {op.unit}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Prazo: <strong className="text-slate-700">{op.targetDate}</strong>
                          </span>
                          {op.clientName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 truncate max-w-[200px]">
                                Cliente: {op.clientName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Ações Rápidas na OP */}
                      <div className="flex items-center space-x-1.5 self-end sm:self-center">
                        <button
                          onClick={() => onOpenTimeLog(op)}
                          title="Apontar / Cronometrar Tempo"
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-blue-700" />
                          <span>Apontar</span>
                        </button>

                        <button
                          onClick={() => onOpenPrintOP(op)}
                          title="Imprimir Folha da OP"
                          className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenCompleteOP(op)}
                          title="Concluir / Dar Baixa no Estoque"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Baixa
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progresso de Horas */}
                    <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>
                          Tempo trabalhado:{' '}
                          <strong className="text-slate-800 font-mono">
                            {Math.floor(op.actualTotalMinutes / 60)}h{op.actualTotalMinutes % 60}m
                          </strong>{' '}
                          de {Math.floor(op.plannedTotalMinutes / 60)}h{op.plannedTotalMinutes % 60}m planejadas
                        </span>
                        <span className="font-bold text-slate-700">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            progressPct > 100 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (1/3): Capacidade dos Postos de Trabalho & Alertas de Estoque */}
        <div className="space-y-6">
          {/* Postos de Trabalho / Capacidade */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Factory className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Linhas de Produção & Capacidade</h2>
              </div>
              <button
                onClick={() => onSelectTab('capacity')}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                Gerenciar
              </button>
            </div>

            <div className="space-y-3">
              {db.capacities.map((cap) => (
                <div key={cap.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800">{cap.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {cap.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>{cap.shiftType}</span>
                    <span className="font-mono font-medium">{cap.dailyCapacityHours}h/dia • {cap.activeWorkers} op.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas de Estoque Baixo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800">Atenção ao Almoxarifado</h2>
              </div>
              <button
                onClick={() => onSelectTab('materials')}
                className="text-[11px] text-amber-700 hover:underline font-semibold"
              >
                Ver Insumos
              </button>
            </div>

            {criticalMaterials.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Todos os insumos estão acima do estoque mínimo de segurança.
              </p>
            ) : (
              <div className="space-y-2">
                {criticalMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{mat.name}</div>
                      <div className="text-[11px] text-amber-800 font-mono">
                        Atual: {mat.currentStock} {mat.unit} | Mínimo: {mat.minStock} {mat.unit}
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectTab('materials')}
                      className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded text-[11px] font-semibold"
                    >
                      Repor
                    </button>
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
