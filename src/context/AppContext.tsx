import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ERPDatabase,
  User,
  RawMaterial,
  Product,
  Client,
  Supplier,
  ProductionCapacity,
  Order,
  ProductionOrder,
  ProductionOrderStatus,
  TimeLog,
  ProductionOrderMaterialRequirement,
} from '../types';
import {
  loadDatabase,
  saveDatabase,
  resetToSeedDatabase,
  exportDatabaseAsJSON,
  importDatabaseFromJSON,
} from '../services/storage';

interface AppContextType {
  db: ERPDatabase;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  updateCurrentUserProfile: (profile: Partial<User>) => void;
  
  // CRUD Matérias-Primas
  addMaterial: (material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMaterial: (id: string, material: Partial<RawMaterial>) => void;
  deleteMaterial: (id: string) => boolean;
  adjustMaterialStock: (id: string, delta: number, reason?: string) => void;

  // CRUD Produtos (Ficha Técnica)
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;

  // CRUD Clientes
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => boolean;

  // CRUD Fornecedores
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => boolean;

  // CRUD Capacidades
  addCapacity: (capacity: Omit<ProductionCapacity, 'id'>) => void;
  updateCapacity: (id: string, capacity: Partial<ProductionCapacity>) => void;
  deleteCapacity: (id: string) => boolean;

  // Pedidos
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => boolean;
  createProductionOrderFromOrder: (orderId: string, productId?: string) => ProductionOrder | null;

  // Ordens de Produção (OP)
  createProductionOrder: (data: {
    productId: string;
    quantity: number;
    lotNumber?: string;
    targetDate: string;
    capacityId?: string;
    orderId?: string;
    notes?: string;
  }) => ProductionOrder | null;
  updateProductionOrder: (id: string, op: Partial<ProductionOrder>) => void;
  updateProductionOrderStatus: (id: string, status: ProductionOrderStatus) => void;
  deleteProductionOrder: (id: string) => boolean;
  addTimeLogToOP: (opId: string, timeLog: Omit<TimeLog, 'id' | 'loggedByUserId' | 'loggedByUserName'>) => void;
  completeProductionOrder: (
    opId: string,
    completedQty: number,
    scrapQty: number,
    qualityNotes: string,
    deductStock?: boolean
  ) => { success: boolean; message: string };

  // Sistema e Backup
  resetDatabase: () => void;
  exportDatabase: () => void;
  importDatabase: (file: File) => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<ERPDatabase>(() => loadDatabase());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Persist whenever db updates
  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  const currentUser = db.currentUser || db.users[0];

  const setCurrentUser = (user: User) => {
    setDb((prev) => ({
      ...prev,
      currentUser: user,
    }));
    showToast(`Usuário ativo alterado para: ${user.name}`);
  };

  const updateCurrentUserProfile = (profile: Partial<User>) => {
    setDb((prev) => {
      const updatedUser = { ...prev.currentUser, ...profile };
      const updatedUsers = prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      return {
        ...prev,
        currentUser: updatedUser,
        users: updatedUsers,
      };
    });
    showToast('Dados do Responsável Técnico atualizados com sucesso!');
  };

  // ================= MATÉRIA PRIMA CRUD =================
  const addMaterial = (material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newId = `mat-${Date.now()}`;
    const newMat: RawMaterial = {
      ...material,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    setDb((prev) => ({
      ...prev,
      rawMaterials: [newMat, ...prev.rawMaterials],
    }));
    showToast(`Matéria-prima "${newMat.name}" cadastrada!`);
  };

  const updateMaterial = (id: string, data: Partial<RawMaterial>) => {
    setDb((prev) => ({
      ...prev,
      rawMaterials: prev.rawMaterials.map((m) =>
        m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
      ),
    }));
    showToast('Matéria-prima atualizada com sucesso.');
  };

  const deleteMaterial = (id: string): boolean => {
    // Check if used in any BOM
    const isUsed = db.products.some((p) => p.materials.some((m) => m.materialId === id));
    if (isUsed) {
      showToast('Não é possível excluir: esta matéria-prima está em uso na Ficha Técnica de um ou mais produtos.');
      return false;
    }
    setDb((prev) => ({
      ...prev,
      rawMaterials: prev.rawMaterials.filter((m) => m.id !== id),
    }));
    showToast('Matéria-prima excluída.');
    return true;
  };

  const adjustMaterialStock = (id: string, delta: number, reason?: string) => {
    setDb((prev) => ({
      ...prev,
      rawMaterials: prev.rawMaterials.map((m) => {
        if (m.id === id) {
          const newQty = Math.max(0, m.currentStock + delta);
          return { ...m, currentStock: newQty, updatedAt: new Date().toISOString() };
        }
        return m;
      }),
    }));
    showToast(`Estoque ajustado (${delta > 0 ? `+${delta}` : delta})${reason ? `: ${reason}` : ''}`);
  };

  // ================= PRODUTOS & FICHA TÉCNICA CRUD =================
  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newId = `prod-${Date.now()}`;
    
    // Calcular custo estimado dos materiais com base no preço atual
    let estCost = 0;
    product.materials.forEach((bom) => {
      const mat = db.rawMaterials.find((m) => m.id === bom.materialId);
      if (mat) {
        estCost += bom.quantityPerUnit * mat.unitCost;
      }
    });

    const totalMinutes = product.processSteps.reduce((acc, step) => acc + (step.standardMinutes || 0), 0);

    const newProd: Product = {
      ...product,
      id: newId,
      estimatedMaterialCost: estCost,
      totalStandardTimeMinutes: totalMinutes,
      createdAt: now,
      updatedAt: now,
    };

    setDb((prev) => ({
      ...prev,
      products: [newProd, ...prev.products],
    }));
    showToast(`Produto "${newProd.name}" com ficha técnica cadastrado!`);
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setDb((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...data, updatedAt: new Date().toISOString() };
        if (data.materials || data.processSteps) {
          let estCost = 0;
          (updated.materials || []).forEach((bom) => {
            const mat = prev.rawMaterials.find((m) => m.id === bom.materialId);
            if (mat) {
              estCost += bom.quantityPerUnit * mat.unitCost;
            }
          });
          updated.estimatedMaterialCost = estCost;
          updated.totalStandardTimeMinutes = (updated.processSteps || []).reduce(
            (acc, step) => acc + (step.standardMinutes || 0),
            0
          );
        }
        return updated;
      }),
    }));
    showToast('Ficha técnica do produto atualizada.');
  };

  const deleteProduct = (id: string): boolean => {
    const inOP = db.productionOrders.some((op) => op.productId === id && op.status !== 'CONCLUIDA');
    if (inOP) {
      showToast('Não é possível excluir: existem Ordens de Produção ativas para este produto.');
      return false;
    }
    setDb((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
    showToast('Produto excluído.');
    return true;
  };

  // ================= CLIENTES CRUD =================
  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newId = `cli-${Date.now()}`;
    const newCli: Client = {
      ...client,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      clients: [newCli, ...prev.clients],
    }));
    showToast(`Cliente "${newCli.name}" cadastrado!`);
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setDb((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    showToast('Dados do cliente atualizados.');
  };

  const deleteClient = (id: string): boolean => {
    const hasOrder = db.orders.some((o) => o.clientId === id);
    if (hasOrder) {
      showToast('Não é possível excluir: cliente possui pedidos cadastrados.');
      return false;
    }
    setDb((prev) => ({
      ...prev,
      clients: prev.clients.filter((c) => c.id !== id),
    }));
    showToast('Cliente removido.');
    return true;
  };

  // ================= FORNECEDORES CRUD =================
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newId = `sup-${Date.now()}`;
    const newSup: Supplier = {
      ...supplier,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      suppliers: [newSup, ...prev.suppliers],
    }));
    showToast(`Fornecedor "${newSup.name}" cadastrado!`);
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setDb((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
    showToast('Dados do fornecedor atualizados.');
  };

  const deleteSupplier = (id: string): boolean => {
    setDb((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => s.id !== id),
    }));
    showToast('Fornecedor removido.');
    return true;
  };

  // ================= CAPACIDADE PRODUTIVA CRUD =================
  const addCapacity = (capacity: Omit<ProductionCapacity, 'id'>) => {
    const newId = `cap-${Date.now()}`;
    const newCap: ProductionCapacity = {
      ...capacity,
      id: newId,
    };
    setDb((prev) => ({
      ...prev,
      capacities: [...prev.capacities, newCap],
    }));
    showToast(`Linha de produção "${newCap.name}" cadastrada!`);
  };

  const updateCapacity = (id: string, data: Partial<ProductionCapacity>) => {
    setDb((prev) => ({
      ...prev,
      capacities: prev.capacities.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    showToast('Capacidade produtiva atualizada.');
  };

  const deleteCapacity = (id: string): boolean => {
    setDb((prev) => ({
      ...prev,
      capacities: prev.capacities.filter((c) => c.id !== id),
    }));
    showToast('Linha de produção removida.');
    return true;
  };

  // ================= PEDIDOS DE VENDA =================
  const addOrder = (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    const nextSeq = db.orders.length + 1;
    const orderNumber = `PED-2026-${String(nextSeq).padStart(3, '0')}`;
    const newId = `ord-${Date.now()}`;
    const newOrder: Order = {
      ...order,
      id: newId,
      orderNumber,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
    }));
    showToast(`Pedido ${orderNumber} cadastrado com sucesso!`);
  };

  const updateOrder = (id: string, data: Partial<Order>) => {
    setDb((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
    }));
    showToast('Pedido atualizado.');
  };

  const deleteOrder = (id: string): boolean => {
    setDb((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => o.id !== id),
    }));
    showToast('Pedido excluído.');
    return true;
  };

  // ================= ORDENS DE PRODUÇÃO (OP) =================
  const createProductionOrder = (data: {
    productId: string;
    quantity: number;
    lotNumber?: string;
    targetDate: string;
    capacityId?: string;
    orderId?: string;
    notes?: string;
  }): ProductionOrder | null => {
    const product = db.products.find((p) => p.id === data.productId);
    if (!product) {
      showToast('Erro: Produto não encontrado para gerar OP.');
      return null;
    }

    const nextSeq = db.productionOrders.length + 1;
    const opCode = `OP-2026-${String(nextSeq).padStart(3, '0')}`;
    const dateFormatted = new Date().toISOString().slice(2, 7).replace('-', '');
    const lot = data.lotNumber || `LT-${dateFormatted}-${String(nextSeq).padStart(2, '0')}`;

    // Construir necessidades de insumos com base na Ficha Técnica (BOM)
    const materials: ProductionOrderMaterialRequirement[] = product.materials.map((bom) => {
      const raw = db.rawMaterials.find((m) => m.id === bom.materialId);
      const reqQty = Number((bom.quantityPerUnit * data.quantity).toFixed(2));
      const availStock = raw ? raw.currentStock : 0;
      const unitCost = raw ? raw.unitCost : 0;
      return {
        materialId: bom.materialId,
        materialCode: raw?.code || 'N/A',
        materialName: raw?.name || 'Insumo',
        requiredQuantity: reqQty,
        unit: raw?.unit || 'UN',
        availableStock: availStock,
        unitCost: unitCost,
        totalCost: Number((reqQty * unitCost).toFixed(2)),
        isAvailable: availStock >= reqQty,
      };
    });

    // Escalar tempos de processo da Ficha Técnica para a quantidade
    const processSteps = product.processSteps.map((step) => ({
      ...step,
      standardMinutes: step.standardMinutes * data.quantity,
    }));
    const plannedTotalMinutes = processSteps.reduce((acc, s) => acc + s.standardMinutes, 0);

    const capacity = data.capacityId ? db.capacities.find((c) => c.id === data.capacityId) : undefined;
    const order = data.orderId ? db.orders.find((o) => o.id === data.orderId) : undefined;

    const newOP: ProductionOrder = {
      id: `op-${Date.now()}`,
      code: opCode,
      orderId: data.orderId,
      orderNumber: order?.orderNumber,
      clientName: order?.clientName,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      quantity: data.quantity,
      unit: product.unit,
      lotNumber: lot,
      status: 'PLANEJADA',
      issueDate: new Date().toISOString().split('T')[0],
      targetDate: data.targetDate,
      technicalResponsibleId: currentUser.id,
      technicalResponsibleName: currentUser.name,
      technicalResponsibleRegistration: currentUser.registrationNumber,
      capacityId: capacity?.id,
      capacityName: capacity?.name,
      materials,
      processSteps,
      plannedTotalMinutes,
      actualTotalMinutes: 0,
      timeLogs: [],
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDb((prev) => {
      const updatedOPs = [newOP, ...prev.productionOrders];
      let updatedOrders = prev.orders;
      if (data.orderId) {
        updatedOrders = prev.orders.map((o) =>
          o.id === data.orderId ? { ...o, productionOrderId: newOP.id, status: 'EM_PRODUCAO' as const } : o
        );
      }
      return {
        ...prev,
        productionOrders: updatedOPs,
        orders: updatedOrders,
      };
    });

    showToast(`Ordem de Produção ${opCode} emitida com sucesso!`);
    return newOP;
  };

  const createProductionOrderFromOrder = (orderId: string, productId?: string): ProductionOrder | null => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      showToast('Pedido não localizado.');
      return null;
    }

    const item = productId
      ? order.items.find((i) => i.productId === productId)
      : order.items[0];

    if (!item) {
      showToast('Nenhum item válido encontrado no pedido.');
      return null;
    }

    return createProductionOrder({
      productId: item.productId,
      quantity: item.quantity,
      targetDate: order.deliveryDate,
      orderId: order.id,
      notes: `Gerada automaticamente do Pedido ${order.orderNumber} para o cliente ${order.clientName}.`,
    });
  };

  const updateProductionOrder = (id: string, data: Partial<ProductionOrder>) => {
    setDb((prev) => ({
      ...prev,
      productionOrders: prev.productionOrders.map((op) =>
        op.id === id ? { ...op, ...data, updatedAt: new Date().toISOString() } : op
      ),
    }));
    showToast('Ordem de Produção atualizada.');
  };

  const updateProductionOrderStatus = (id: string, status: ProductionOrderStatus) => {
    setDb((prev) => ({
      ...prev,
      productionOrders: prev.productionOrders.map((op) => {
        if (op.id !== id) return op;
        const now = new Date().toISOString();
        const update: Partial<ProductionOrder> = { status, updatedAt: now };
        if (status === 'EM_PRODUCAO' && !op.startDate) {
          update.startDate = now;
        }
        return { ...op, ...update };
      }),
    }));
    showToast(`Status da OP alterado para: ${status.replace('_', ' ')}`);
  };

  const deleteProductionOrder = (id: string): boolean => {
    setDb((prev) => ({
      ...prev,
      productionOrders: prev.productionOrders.filter((op) => op.id !== id),
    }));
    showToast('Ordem de Produção excluída.');
    return true;
  };

  const addTimeLogToOP = (
    opId: string,
    timeLog: Omit<TimeLog, 'id' | 'loggedByUserId' | 'loggedByUserName'>
  ) => {
    const newLog: TimeLog = {
      ...timeLog,
      id: `log-${Date.now()}`,
      loggedByUserId: currentUser.id,
      loggedByUserName: currentUser.name,
    };

    setDb((prev) => ({
      ...prev,
      productionOrders: prev.productionOrders.map((op) => {
        if (op.id !== opId) return op;
        const updatedLogs = [...op.timeLogs, newLog];
        const actualTotalMinutes = updatedLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
        return {
          ...op,
          timeLogs: updatedLogs,
          actualTotalMinutes,
          updatedAt: new Date().toISOString(),
          // Se estava apenas planejada ou separação, move para EM_PRODUCAO
          status: op.status === 'PLANEJADA' || op.status === 'SEPARACAO' ? 'EM_PRODUCAO' : op.status,
          startDate: op.startDate || new Date().toISOString(),
        };
      }),
    }));

    showToast(`Tempo de processo registrado: +${newLog.durationMinutes} minutos por ${newLog.operatorName}`);
  };

  // Baixa / Conclusão de Ordem de Produção com movimentação de estoque
  const completeProductionOrder = (
    opId: string,
    completedQty: number,
    scrapQty: number,
    qualityNotes: string,
    deductStock: boolean = true
  ): { success: boolean; message: string } => {
    const op = db.productionOrders.find((o) => o.id === opId);
    if (!op) {
      return { success: false, message: 'Ordem de Produção não encontrada.' };
    }

    const now = new Date().toISOString();

    setDb((prev) => {
      // 1. Atualizar a OP
      const updatedOPs = prev.productionOrders.map((o) => {
        if (o.id !== opId) return o;
        return {
          ...o,
          status: 'CONCLUIDA' as const,
          completedDate: now,
          completedQuantity: completedQty,
          scrapQuantity: scrapQty,
          qualityNotes,
          technicalResponsibleId: currentUser.id,
          technicalResponsibleName: currentUser.name,
          technicalResponsibleRegistration: currentUser.registrationNumber,
          updatedAt: now,
        };
      });

      // 2. Dar baixa nas matérias-primas no estoque (se solicitado)
      let updatedMaterials = prev.rawMaterials;
      if (deductStock) {
        updatedMaterials = prev.rawMaterials.map((mat) => {
          const req = op.materials.find((m) => m.materialId === mat.id);
          if (req) {
            // Proporcional à quantidade produzida + refugo se aplicável
            const ratio = completedQty / (op.quantity || 1);
            const toDeduct = Number((req.requiredQuantity * ratio).toFixed(2));
            const newStock = Math.max(0, Number((mat.currentStock - toDeduct).toFixed(2)));
            return {
              ...mat,
              currentStock: newStock,
              updatedAt: now,
            };
          }
          return mat;
        });
      }

      // 3. Dar entrada no estoque do Produto Acabado
      const updatedProducts = prev.products.map((p) => {
        if (p.id === op.productId) {
          return {
            ...p,
            currentStock: p.currentStock + completedQty,
            updatedAt: now,
          };
        }
        return p;
      });

      // 4. Se havia pedido vinculado, atualizar status para CONCLUIDO
      let updatedOrders = prev.orders;
      if (op.orderId) {
        updatedOrders = prev.orders.map((ord) => {
          if (ord.id === op.orderId) {
            return {
              ...ord,
              status: 'CONCLUIDO' as const,
            };
          }
          return ord;
        });
      }

      return {
        ...prev,
        productionOrders: updatedOPs,
        rawMaterials: updatedMaterials,
        products: updatedProducts,
        orders: updatedOrders,
      };
    });

    const msg = `OP ${op.code} concluída com sucesso! Entrada de ${completedQty} ${op.unit} no estoque. Baixa realizada pelo RT: ${currentUser.name}.`;
    showToast(msg);
    return { success: true, message: msg };
  };

  // ================= SISTEMA E BACKUP =================
  const resetDatabase = () => {
    const res = resetToSeedDatabase();
    setDb(res);
    showToast('Banco de dados restaurado para os dados originais de demonstração!');
  };

  const exportDatabase = () => {
    exportDatabaseAsJSON(db);
    showToast('Backup gerado e baixado com sucesso!');
  };

  const importDatabase = async (file: File) => {
    try {
      const imported = await importDatabaseFromJSON(file);
      setDb(imported);
      showToast('Dados restaurados com sucesso a partir do arquivo JSON!');
    } catch (err: any) {
      showToast(`Erro ao restaurar backup: ${err.message || 'Arquivo inválido'}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        setCurrentUser,
        updateCurrentUserProfile,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        adjustMaterialStock,
        addProduct,
        updateProduct,
        deleteProduct,
        addClient,
        updateClient,
        deleteClient,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addCapacity,
        updateCapacity,
        deleteCapacity,
        addOrder,
        updateOrder,
        deleteOrder,
        createProductionOrderFromOrder,
        createProductionOrder,
        updateProductionOrder,
        updateProductionOrderStatus,
        deleteProductionOrder,
        addTimeLogToOP,
        completeProductionOrder,
        resetDatabase,
        exportDatabase,
        importDatabase,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
