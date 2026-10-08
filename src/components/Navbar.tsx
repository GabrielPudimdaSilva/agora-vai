import React, { useState } from 'react';
import {
  Factory,
  ClipboardList,
  ShoppingCart,
  Boxes,
  Layers,
  Users,
  Truck,
  Gauge,
  BarChart3,
  UserCheck,
  Download,
  Upload,
  RotateCcw,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type NavTab =
  | 'dashboard'
  | 'production_orders'
  | 'orders'
  | 'products'
  | 'materials'
  | 'clients'
  | 'suppliers'
  | 'capacity'
  | 'reports';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenUserModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenUserModal }) => {
  const { db, currentUser, exportDatabase, resetDatabase, importDatabase } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);

  // Alertas
  const lowStockCount = db.rawMaterials.filter((m) => m.currentStock <= m.minStock).length;
  const activeOPsCount = db.productionOrders.filter(
    (op) => op.status !== 'CONCLUIDA' && op.status !== 'CANCELADA'
  ).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm('Importar este backup substituirá os dados atuais. Deseja continuar?')) {
        importDatabase(file);
      }
    }
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Painel Geral', icon: <Gauge className="w-4 h-4" /> },
    {
      id: 'production_orders',
      label: 'Ordens de Produção',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: activeOPsCount > 0 ? activeOPsCount : undefined,
      badgeColor: 'bg-blue-600 text-white',
    },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'products', label: 'Ficha Técnica (BOM)', icon: <Boxes className="w-4 h-4" /> },
    {
      id: 'materials',
      label: 'Matéria-Prima',
      icon: <Layers className="w-4 h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'clients', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
    { id: 'suppliers', label: 'Fornecedores', icon: <Truck className="w-4 h-4" /> },
    { id: 'capacity', label: 'Capacidade (PCP)', icon: <Factory className="w-4 h-4" /> },
    { id: 'reports', label: 'Relatórios & Laudos', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 no-print shadow-md">
      {/* Top Banner / Brand Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-lg text-white shadow-inner flex items-center justify-center">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">FabriPCP</span>
                <span className="bg-blue-900/60 text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-700/50 uppercase tracking-wider">
                  ERP Manufatura
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Planejamento & Controle da Produção</p>
            </div>
          </div>

          {/* Right Header: User Active as Technical Responsible & Tools */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Responsável Técnico Badge */}
            <button
              onClick={onOpenUserModal}
              title="Clique para alterar ou editar o Responsável Técnico"
              className="flex items-center space-x-2.5 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 hover:border-blue-500/50 text-left px-3 py-1.5 rounded-lg transition-all text-xs group"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="hidden md:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-medium text-slate-200">{currentUser.name}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1 rounded font-mono">
                    RT ATIVO
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {currentUser.registrationNumber} • {currentUser.roleTitle.split('/')[0]}
                </div>
              </div>
            </button>

            {/* System Options Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSystemMenuOpen(!systemMenuOpen)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
                title="Configurações de Dados e Backup"
              >
                <span>Dados</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {systemMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs"
                  onClick={() => setSystemMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Gerenciamento do Banco
                  </div>
                  <button
                    onClick={exportDatabase}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Fazer Backup (Download JSON)</span>
                  </button>

                  <label className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center space-x-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restaurar Backup (JSON)</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <button
                    onClick={() => {
                      if (window.confirm('Deseja recarregar os dados de demonstração da fábrica?')) {
                        resetDatabase();
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-amber-300 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restaurar Dados Padrão (Demo)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex space-x-1 pb-2 overflow-x-auto scrollbar-none text-xs">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-700 text-white'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.badgeColor || 'bg-slate-700 text-white'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
