import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Award,
  Factory,
  Boxes,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionOrder } from '../../types';

export const ReportsView: React.FC = () => {
  const { db, currentUser } = useApp();

  const [dateFilter, setDateFilter] = useState<'ALL' | 'MONTH' | 'WEEK'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [productFilter, setProductFilter] = useState<string>('TODOS');

  // Filtragem
  const filteredOPs = db.productionOrders.filter((op) => {
    if (statusFilter !== 'TODOS' && op.status !== statusFilter) return false;
    if (productFilter !== 'TODOS' && op.productId !== productFilter) return false;

    if (dateFilter === 'WEEK') {
      const issue = new Date(op.issueDate).getTime();
      const weekAgo = Date.now() - 7 * 86400000;
      if (issue < weekAgo) return false;
    } else if (dateFilter === 'MONTH') {
      const issue = new Date(op.issueDate).getTime();
      const monthAgo = Date.now() - 30 * 86400000;
      if (issue < monthAgo) return false;
    }
    return true;
  });

  // Estatísticas
  const totalProducedItems = filteredOPs.reduce((acc, op) => acc + (op.completedQuantity || op.quantity), 0);
  const totalPlannedMinutes = filteredOPs.reduce((acc, op) => acc + (op.plannedTotalMinutes || 0), 0);
  const totalActualMinutes = filteredOPs.reduce((acc, op) => acc + (op.actualTotalMinutes || 0), 0);

  const completedCount = filteredOPs.filter((op) => op.status === 'CONCLUIDA').length;
  const inProgressCount = filteredOPs.filter((op) => op.status === 'EM_PRODUCAO' || op.status === 'SEPARACAO').length;

  // Eficiência global: (Tempo Planejado / Tempo Real) * 100
  const efficiencyRate =
    totalActualMinutes > 0 ? Math.round((totalPlannedMinutes / totalActualMinutes) * 100) : 100;

  // Custo de insumos total das OPs filtradas
  const totalMaterialCost = filteredOPs.reduce((acc, op) => {
    return acc + op.materials.reduce((sub, m) => sub + m.totalCost, 0);
  }, 0);

  // Exportação CSV
  const exportToCSV = () => {
    const headers = [
      'Código OP',
      'Lote',
      'Produto',
      'Qtd',
      'Unidade',
      'Status',
      'Data Emissão',
      'Prazo',
      'Data Conclusão',
      'Tempo Planejado (min)',
      'Tempo Real (min)',
      'Custo Materiais (R$)',
      'Responsável Técnico',
    ];

    const rows = filteredOPs.map((op) => [
      op.code,
      op.lotNumber,
      `"${op.productName}"`,
      op.completedQuantity || op.quantity,
      op.unit,
      op.status,
      op.issueDate,
      op.targetDate,
      op.completedDate ? op.completedDate.split('T')[0] : '',
      op.plannedTotalMinutes,
      op.actualTotalMinutes,
      op.materials.reduce((s, m) => s + m.totalCost, 0).toFixed(2),
      `"${op.technicalResponsibleName}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_producao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Relatórios de Acompanhamento da Produção
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Métricas de desempenho fabril, tempos de processo, balanço de custos e laudos de liberação técnica.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Relatório Analítico de Ordens de Produção
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Empresa: <strong>FabriPCP Manufatura Industrial Ltda</strong> • Emitido em:{' '}
              {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div className="text-left sm:text-right text-xs bg-blue-50 border border-blue-100 p-2 rounded-lg">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
              Responsável Técnico Homologado:
            </span>
            <span className="font-bold text-blue-900">{currentUser.name}</span>
            <span className="text-slate-600 font-mono block text-[11px]">
              {currentUser.registrationNumber}
            </span>
          </div>
        </div>

        {/* Filter Toolbar (hidden on print) */}
        <div className="pt-3 flex flex-wrap gap-3 items-center justify-between no-print text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Período:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="border border-slate-300 rounded-lg px-2 py-1 bg-white"
              >
                <option value="ALL">Todo o Histórico</option>
                <option value="MONTH">Últimos 30 Dias</option>
                <option value="WEEK">Últimos 7 Dias</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1 bg-white"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="CONCLUIDA">Concluídas</option>
                <option value="EM_PRODUCAO">Em Produção</option>
                <option value="SEPARACAO">Separação</option>
                <option value="PLANEJADA">Planejadas</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Produto:</span>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1 bg-white max-w-[200px]"
              >
                <option value="TODOS">Todos os Produtos</option>
                {db.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-slate-500 font-mono font-bold">
            Total de {filteredOPs.length} ordem(ns) selecionada(s)
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Peças Produzidas
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {totalProducedItems} un
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {completedCount} OPs baixadas / {inProgressCount} ativas
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Tempo Padrão vs Real
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {(totalActualMinutes / 60).toFixed(1)}h
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
            Planejado: {(totalPlannedMinutes / 60).toFixed(1)}h
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Eficiência da Manufatura
          </span>
          <div className="text-2xl font-black font-mono text-blue-700 mt-1">
            {efficiencyRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {efficiencyRate >= 90 ? 'Excelente rendimento' : 'Abaixo do padrão de fábrica'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Custo Insumos Requisitados
          </span>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
            R$ {totalMaterialCost.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Valor debitado do estoque
          </span>
        </div>
      </div>

      {/* Main Analytical Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Demonstrativo Detalhado de Ordens de Produção</h3>
          <span className="text-[11px] text-slate-400 font-mono">
            RT Homologado: {currentUser.name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">OP / Lote</th>
                <th className="p-3">Produto</th>
                <th className="p-3 text-right">Qtd</th>
                <th className="p-3">Status</th>
                <th className="p-3 font-mono">Emissão</th>
                <th className="p-3 font-mono">Prazo</th>
                <th className="p-3 text-right">Tempo Plan.</th>
                <th className="p-3 text-right">Tempo Real</th>
                <th className="p-3 text-right">Custo Insumos</th>
                <th className="p-3">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOPs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Nenhuma ordem de produção atende aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOPs.map((op) => {
                  const cost = op.materials.reduce((acc, m) => acc + m.totalCost, 0);
                  const isCompleted = op.status === 'CONCLUIDA';

                  return (
                    <tr key={op.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {op.code}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          {op.lotNumber}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{op.productName}</span>
                        {op.clientName && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                            {op.clientName}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {op.completedQuantity || op.quantity} {op.unit}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : op.status === 'EM_PRODUCAO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {op.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{op.issueDate}</td>
                      <td className="p-3 font-mono text-slate-800 font-semibold">{op.targetDate}</td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {Math.floor(op.plannedTotalMinutes / 60)}h{op.plannedTotalMinutes % 60}m
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {Math.floor(op.actualTotalMinutes / 60)}h{op.actualTotalMinutes % 60}m
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        R$ {cost.toFixed(2)}
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        <span className="font-medium text-slate-800 block">{op.technicalResponsibleName}</span>
                        <span className="text-[10px] font-mono text-slate-400">{op.technicalResponsibleRegistration}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formal Signature block on Printed Reports */}
      <div className="pt-8 border-t border-slate-300 text-center text-xs print-only">
        <div className="max-w-xs mx-auto border-b border-slate-900 pb-1 mb-1 font-bold">
          {currentUser.name}
        </div>
        <div className="text-slate-600 font-mono text-[11px]">
          {currentUser.roleTitle} • {currentUser.registrationNumber}
        </div>
        <div className="text-slate-400 text-[10px] mt-0.5">
          Relatório emitido e conferido pelo Responsável Técnico em conformidade com o sistema FabriPCP.
        </div>
      </div>
    </div>
  );
};
