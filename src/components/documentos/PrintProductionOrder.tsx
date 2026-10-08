import React from 'react';
import {
  Printer,
  X,
  Factory,
  Clock,
  Layers,
  CheckSquare,
  Award,
  Calendar,
  User,
} from 'lucide-react';
import { ProductionOrder } from '../../types';
import { useApp } from '../../context/AppContext';

interface PrintProductionOrderProps {
  op: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintProductionOrder: React.FC<PrintProductionOrderProps> = ({ op, isOpen, onClose }) => {
  const { currentUser } = useApp();

  if (!isOpen || !op) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      {/* Floating Toolbar on screen (hidden on print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 no-print bg-slate-900 p-2 rounded-xl shadow-xl border border-slate-700">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Salvar PDF</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Sheet (Standard A4 layout) */}
      <div className="print-sheet bg-white max-w-4xl w-full mx-auto my-0 sm:my-8 p-6 sm:p-10 shadow-2xl border border-slate-300 text-slate-900 font-sans print:shadow-none print:border-none print:p-4">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 font-mono">
                FabriPCP Manufatura Industrial Ltda
              </h1>
              <p className="text-xs text-slate-600">
                Sistema de Planejamento e Controle da Produção • CNPJ: 12.345.678/0001-90
              </p>
              <p className="text-[11px] text-slate-500">
                Distrito Industrial - Jundiaí/SP • Fone: (11) 4700-1000
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold uppercase text-slate-500">DOCUMENTO OFICIAL PCP</div>
            <div className="text-2xl font-black font-mono tracking-wider text-slate-900 mt-0.5">
              {op.code}
            </div>
            <div className="text-xs font-mono font-bold text-blue-800">
              LOTE: {op.lotNumber}
            </div>
          </div>
        </div>

        {/* Barcode visual pattern */}
        <div className="py-2.5 flex items-center justify-between border-b border-slate-200 text-xs">
          <div className="flex items-center space-x-4">
            <span>
              Emissão: <strong className="font-mono">{new Date(op.issueDate).toLocaleDateString('pt-BR')}</strong>
            </span>
            <span>•</span>
            <span>
              Prazo de Entrega: <strong className="font-mono text-red-700">{op.targetDate}</strong>
            </span>
            <span>•</span>
            <span>
              Status: <strong className="font-mono uppercase">{op.status.replace('_', ' ')}</strong>
            </span>
          </div>

          {/* SVG Barcode mock */}
          <div className="flex flex-col items-end">
            <div className="flex space-x-0.5 h-6 items-end">
              {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 3].map((w, i) => (
                <div key={i} className="bg-slate-900" style={{ width: `${w}px`, height: '24px' }} />
              ))}
            </div>
            <span className="text-[9px] font-mono tracking-widest text-slate-500">{op.code}-{op.lotNumber}</span>
          </div>
        </div>

        {/* Section 1: Dados do Produto & Pedido */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
          <div className="md:col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Produto a Fabricar
            </span>
            <span className="font-bold text-sm text-slate-900 block mt-0.5">
              {op.productName}
            </span>
            <span className="font-mono text-slate-600 block mt-0.5">
              Código / SKU: {op.productCode}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Quantidade do Lote
            </span>
            <span className="text-xl font-black font-mono text-slate-900 block mt-0.5">
              {op.quantity} {op.unit}
            </span>
            {op.clientName && (
              <span className="text-[11px] text-slate-600 block mt-0.5 truncate">
                Cliente: <strong>{op.clientName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Section 2: Requisição de Matérias-Primas (Almoxarifado) */}
        <div className="mt-5">
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-900">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>1. Requisição de Matérias-Primas ao Almoxarifado (BOM)</span>
            </h2>
            <span className="text-[10px] text-slate-500 italic">Conferência física obrigatória</span>
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300 w-10 text-center">OK</th>
                <th className="p-2 border-r border-slate-300">Código</th>
                <th className="p-2 border-r border-slate-300">Descrição do Insumo</th>
                <th className="p-2 border-r border-slate-300 text-right">Qtd Requisitada</th>
                <th className="p-2 border-r border-slate-300 text-right">Saldo Estoque</th>
                <th className="p-2 text-center">Visto Almoxarife</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {op.materials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-slate-400">
                    Nenhum material listado na ficha.
                  </td>
                </tr>
              ) : (
                op.materials.map((mat, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-r border-slate-300 text-center">
                      <div className="w-4 h-4 border border-slate-400 rounded-xs mx-auto" />
                    </td>
                    <td className="p-2 border-r border-slate-300 font-mono font-semibold">
                      {mat.materialCode}
                    </td>
                    <td className="p-2 border-r border-slate-300">{mat.materialName}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">
                      {mat.requiredQuantity} {mat.unit}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-slate-600">
                      {mat.availableStock} {mat.unit}
                    </td>
                    <td className="p-2 text-center text-[10px] text-slate-400 font-mono">
                      [____/____]
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Section 3: Roteiro Operacional e Tempos */}
        <div className="mt-5">
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-900">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>2. Roteiro de Operações & Tempo Padrão de Fabricação</span>
            </h2>
            <span className="text-[10px] font-mono font-bold text-slate-700">
              Tempo Padrão Total: {Math.floor(op.plannedTotalMinutes / 60)}h {op.plannedTotalMinutes % 60}min
            </span>
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300 w-10 text-center">Seq</th>
                <th className="p-2 border-r border-slate-300">Operação / Posto</th>
                <th className="p-2 border-r border-slate-300">Instrução Operacional</th>
                <th className="p-2 border-r border-slate-300 text-right">Tempo Padrão</th>
                <th className="p-2 border-r border-slate-300 text-center">Tempo Real</th>
                <th className="p-2 text-center">Assinatura Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {op.processSteps.map((step, idx) => (
                <tr key={idx}>
                  <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-2 border-r border-slate-300 font-semibold">
                    {step.name}
                    {step.workCenter && (
                      <span className="text-[10px] text-slate-500 block font-normal">{step.workCenter}</span>
                    )}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-[11px] text-slate-600">
                    {step.description || 'Executar conforme desenho técnico padrão'}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">
                    {step.standardMinutes} min
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono text-[11px]">
                    _____ min
                  </td>
                  <td className="p-2 text-center text-[10px] text-slate-400">
                    ________________
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Apontamentos Já Registrados no Sistema */}
        {op.timeLogs.length > 0 && (
          <div className="mt-5">
            <div className="pb-1 mb-2 border-b border-slate-900">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                3. Registro de Apontamentos Já Realizados no Sistema
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {op.timeLogs.map((log) => (
                <div key={log.id} className="p-2 border border-slate-200 rounded-sm bg-slate-50">
                  <div className="font-bold text-slate-800">{log.stepName}</div>
                  <div className="text-slate-500">
                    Operador: {log.operatorName} • Duração: <strong>{log.durationMinutes} min</strong> • Qtd: {log.producedQuantity} un
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Controle de Qualidade & Liberação Técnica */}
        <div className="mt-6 border-t-2 border-slate-900 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Checklist CQ */}
            <div className="space-y-2 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-900">
                Checklist de Controle de Qualidade
              </h3>
              <div className="space-y-1.5 text-slate-700">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked={op.status === 'CONCLUIDA'} />
                  <span>Inspeção Dimensional e Esquadro conforme tolerância</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked={op.status === 'CONCLUIDA'} />
                  <span>Inspeção Visual de Soldas, Acabamentos e Pintura</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked={op.status === 'CONCLUIDA'} />
                  <span>Ensaio de montagem, nivelamento e identificação de lote</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked={op.status === 'CONCLUIDA'} />
                  <span>Embalagem protetora e fixação para transporte</span>
                </label>
              </div>

              {op.qualityNotes && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 mt-2">
                  <strong>Parecer do CQ:</strong> {op.qualityNotes}
                </div>
              )}
            </div>

            {/* Formal Technical Responsible Signatures */}
            <div className="flex flex-col justify-between border-l-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-xs text-slate-900 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-blue-700" />
                  <span>Responsável Técnico Homologado</span>
                </h3>
                <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    {currentUser.registrationNumber} • {currentUser.roleTitle}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Certifico que este lote foi planejado e inspecionado segundo as normas de manufatura e segurança.
                  </div>
                </div>
              </div>

              <div className="pt-8 text-center">
                <div className="border-b border-slate-800 w-3/4 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-800 block">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">
                  Responsável Técnico • {currentUser.registrationNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
          Impresso em: {new Date().toLocaleString('pt-BR')} • Sistema FabriPCP Manufatura • Responsável Técnico:{' '}
          {currentUser.name} ({currentUser.registrationNumber})
        </div>
      </div>
    </div>
  );
};
