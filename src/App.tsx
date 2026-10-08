/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProductsView } from './components/cadastros/ProductsView';
import { MaterialsView } from './components/cadastros/MaterialsView';
import { ClientsView } from './components/cadastros/ClientsView';
import { SuppliersView } from './components/cadastros/SuppliersView';
import { CapacityView } from './components/cadastros/CapacityView';
import { OrdersView } from './components/producao/OrdersView';
import { ProductionOrdersView } from './components/producao/ProductionOrdersView';
import { CreateProductionOrderModal } from './components/producao/CreateProductionOrderModal';
import { TimeTrackingModal } from './components/producao/TimeTrackingModal';
import { CompleteOrderModal } from './components/producao/CompleteOrderModal';
import { PrintProductionOrder } from './components/documentos/PrintProductionOrder';
import { ReportsView } from './components/relatorios/ReportsView';
import { UserModal } from './components/auth/UserModal';
import { Product, ProductionOrder } from './types';
import { CheckCircle2, Info } from 'lucide-react';

const MainApp: React.FC = () => {
  const { toastMessage } = useApp();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCreateOPModalOpen, setIsCreateOPModalOpen] = useState(false);
  const [selectedProductForOP, setSelectedProductForOP] = useState<Product | null>(null);
  const [selectedOrderIdForOP, setSelectedOrderIdForOP] = useState<string | null>(null);

  const [activeOPForPrint, setActiveOPForPrint] = useState<ProductionOrder | null>(null);
  const [activeOPForTimeLog, setActiveOPForTimeLog] = useState<ProductionOrder | null>(null);
  const [activeOPForComplete, setActiveOPForComplete] = useState<ProductionOrder | null>(null);

  const handleEmitOPForProduct = (prod: Product) => {
    setSelectedProductForOP(prod);
    setSelectedOrderIdForOP(null);
    setIsCreateOPModalOpen(true);
  };

  const handleOpenCreateOPForOrder = (orderId: string) => {
    setSelectedProductForOP(null);
    setSelectedOrderIdForOP(orderId);
    setIsCreateOPModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            onSelectTab={setCurrentTab}
            onOpenCreateOPModal={() => {
              setSelectedProductForOP(null);
              setSelectedOrderIdForOP(null);
              setIsCreateOPModalOpen(true);
            }}
            onOpenPrintOP={(op) => setActiveOPForPrint(op)}
            onOpenTimeLog={(op) => setActiveOPForTimeLog(op)}
            onOpenCompleteOP={(op) => setActiveOPForComplete(op)}
          />
        )}

        {currentTab === 'production_orders' && (
          <ProductionOrdersView
            onOpenCreateOPModal={() => {
              setSelectedProductForOP(null);
              setSelectedOrderIdForOP(null);
              setIsCreateOPModalOpen(true);
            }}
            onOpenPrintOP={(op) => setActiveOPForPrint(op)}
            onOpenTimeLog={(op) => setActiveOPForTimeLog(op)}
            onOpenCompleteOP={(op) => setActiveOPForComplete(op)}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersView
            onOpenCreateOPForOrder={handleOpenCreateOPForOrder}
            onGoToOP={(opId) => {
              setCurrentTab('production_orders');
            }}
          />
        )}

        {currentTab === 'products' && (
          <ProductsView onEmitOPForProduct={handleEmitOPForProduct} />
        )}

        {currentTab === 'materials' && <MaterialsView />}

        {currentTab === 'clients' && <ClientsView />}

        {currentTab === 'suppliers' && <SuppliersView />}

        {currentTab === 'capacity' && <CapacityView />}

        {currentTab === 'reports' && <ReportsView />}
      </main>

      {/* Modals */}
      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />

      <CreateProductionOrderModal
        isOpen={isCreateOPModalOpen}
        onClose={() => {
          setIsCreateOPModalOpen(false);
          setSelectedProductForOP(null);
          setSelectedOrderIdForOP(null);
        }}
        preselectedProduct={selectedProductForOP}
        preselectedOrderId={selectedOrderIdForOP}
      />

      <TimeTrackingModal
        isOpen={Boolean(activeOPForTimeLog)}
        op={activeOPForTimeLog}
        onClose={() => setActiveOPForTimeLog(null)}
      />

      <CompleteOrderModal
        isOpen={Boolean(activeOPForComplete)}
        op={activeOPForComplete}
        onClose={() => setActiveOPForComplete(null)}
      />

      <PrintProductionOrder
        isOpen={Boolean(activeOPForPrint)}
        op={activeOPForPrint}
        onClose={() => setActiveOPForPrint(null)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs animate-bounce no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
