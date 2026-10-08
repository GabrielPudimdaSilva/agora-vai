import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  X,
  Layers,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionOrder } from '../../types';

interface CompleteOrderModalProps {
  op: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompleteOrderModal: React.FC<CompleteOrderModalProps> = ({ op, isOpen, onClose }) => {
  const { completeProductionOrder, currentUser } = useApp();

  const [completedQty, setCompletedQty] = useState<number>(op?.quantity || 1);
  const [scrapQty, setScrapQty] = useState<number>(0);
  const [qualityNotes, setQualityNotes] = useState('Lote aprovado em 100% dos ensaios visuais e dimensionais. Atende às especificações técnicas da Engenharia.');
  const [deductStock, setDeductStock] = useState(true);

  if (!isOpen || !op) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (completedQty <= 0) {
      alert('A quantidade concluída deve ser maior que zero.');
      return;
    }

    const res = completeProductionOrder(op.id, completedQty, scrapQty, qualityNotes, deductStock);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-8 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between text-white border-b border-emerald-900">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-600/30 border border-emerald-500 rounded-lg text-emerald-300">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Conclusão & Baixa da Ordem de Produção</h3>
              <p className="text-xs text-emerald-300/80 font-mono">
                {op.code} • {op.productName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Card Resumo do Lote */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ordem de Produção:</span>
              <span className="font-mono font-bold text-slate-900">{op.code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lote de Fabricação:</span>
              <span className="font-mono font-bold text-blue-700">{op.lotNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Quantidade Planejada:</span>
              <span className="font-mono font-bold text-slate-800">
                {op.quantity} {op.unit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tempo Total Apontado:</span>
              <span className="font-mono font-bold text-slate-800">
                {Math.floor((op.actualTotalMinutes || 0) / 60)}h {(op.actualTotalMinutes || 0) % 60}m
              </span>
            </div>
          </div>

          {/* Quantidades Produzidas e Refugo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantidade Conforme Aprovada ({op.unit}):
              </label>
              <input
                type="number"
                required
                min={1}
                value={completedQty}
                onChange={(e) => setCompletedQty(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-sm text-emerald-800"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Dará entrada imediata no estoque de produtos acabados.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Refugo / Não-Conformes ({op.unit}):
              </label>
              <input
                type="number"
                min={0}
                value={scrapQty}
                onChange={(e) => setScrapQty(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Peças descartadas ou para retrabalho.
              </span>
            </div>
          </div>

          {/* Opção de Baixa no Estoque */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={deductStock}
                onChange={(e) => setDeductStock(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-emerald-600 rounded border-slate-300"
              />
              <div>
                <span className="font-bold text-emerald-900 block">
                  Baixar automaticamente matérias-primas do estoque
                </span>
                <span className="text-emerald-700 text-[11px]">
                  Os insumos consumidos calculados na Ficha Técnica ({op.materials.length} itens) serão debitados do saldo atual do almoxarifado.
                </span>
              </div>
            </label>
          </div>

          {/* Parecer do CQ */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Parecer de Qualidade / Laudo de Liberação:
            </label>
            <textarea
              rows={3}
              required
              value={qualityNotes}
              onChange={(e) => setQualityNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800"
              placeholder="Descreva as inspeções realizadas, conformidade com tolerâncias e laudo final..."
            />
          </div>

          {/* Carimbo do Responsável Técnico */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-full">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">
                Liberação Técnica por: {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {currentUser.registrationNumber} • {currentUser.roleTitle}
              </div>
            </div>
          </div>

          {/* Ações */}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-950/20"
            >
              Confirmar Baixa & Concluir OP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
