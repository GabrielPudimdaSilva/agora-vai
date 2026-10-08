export type UserRole = 'RESPONSAVEL_TECNICO' | 'GERENTE_PCP' | 'OPERADOR_LIDER' | 'ANALISTA_QUALIDADE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  registrationNumber: string; // Ex: CREA/CRQ/CFT ou Matrícula
}

export type UnitOfMeasure = 'UN' | 'KG' | 'M' | 'M2' | 'M3' | 'L' | 'PC' | 'CX' | 'PAR';

// 1. Matéria Prima
export interface RawMaterial {
  id: string;
  code: string; // Ex: MP-101
  name: string;
  unit: UnitOfMeasure;
  currentStock: number;
  minStock: number;
  unitCost: number; // R$
  supplierId?: string;
  location?: string; // Almoxarifado / Prateleira
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Insumo na Ficha Técnica (BOM)
export interface BOMItem {
  materialId: string;
  materialName?: string;
  quantityPerUnit: number; // Qtd necessária para 1 unidade de produto
  unit?: UnitOfMeasure;
  unitCost?: number;
}

// Etapa de processo na Ficha Técnica
export interface ProcessStep {
  id: string;
  name: string; // Ex: "Corte / Serralheria", "Usinagem CNC", "Solda & Montagem", "Pintura Eletrostática", "Inspeção e Embalagem"
  standardMinutes: number; // Tempo padrão em minutos por unidade
  workCenter?: string; // Linha / Setor de trabalho
  description?: string;
}

// 2. Ficha Técnica do Produto
export interface Product {
  id: string;
  code: string; // SKU ex: PROD-501
  name: string;
  category: string;
  unit: UnitOfMeasure;
  salePrice: number;
  description: string;
  
  // Ficha Técnica (BOM)
  materials: BOMItem[];
  
  // Roteiro de Produção / Tempo de Processo
  processSteps: ProcessStep[];
  totalStandardTimeMinutes: number; // Calculado ou definido
  
  estimatedMaterialCost: number; // Calculado com base nas matérias primas
  currentStock: number; // Estoque de produto acabado
  createdAt: string;
  updatedAt: string;
}

// 3. Cliente
export interface Client {
  id: string;
  code: string; // CLI-001
  name: string; // Razão Social / Nome
  tradeName?: string; // Nome Fantasia
  document: string; // CNPJ ou CPF
  email: string;
  phone: string;
  contactPerson?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  createdAt: string;
}

// 4. Fornecedor
export interface Supplier {
  id: string;
  code: string; // FORN-001
  name: string;
  tradeName?: string;
  document: string; // CNPJ
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  deliveryLeadTimeDays: number; // Prazo médio de entrega
  suppliedCategories: string[]; // Ex: ["Aço", "Parafusos", "Pintura"]
  notes?: string;
  createdAt: string;
}

// 5. Capacidade Produtiva
export interface ProductionCapacity {
  id: string;
  code: string; // LINHA-01
  name: string; // Setor ou Linha de Produção
  dailyCapacityHours: number; // Horas disponíveis por dia
  activeWorkers: number; // Quantidade de operadores
  shiftType: string; // Ex: "1 Turno (08h às 17h)", "2 Turnos (16h/dia)"
  efficiencyRate: number; // Ex: 85%
  status: 'OPERACIONAL' | 'MANUTENCAO' | 'OCIOSA';
  notes?: string;
}

// Item do Pedido de Venda
export interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'PENDENTE' | 'EM_PRODUCAO' | 'CONCLUIDO' | 'CANCELADO';

// Pedido de Venda
export interface Order {
  id: string;
  orderNumber: string; // Ex: PED-2026-001
  clientId: string;
  clientName: string;
  orderDate: string;
  deliveryDate: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  productionOrderId?: string; // OP vinculada se já gerada
  createdAt: string;
}

export type ProductionOrderStatus = 
  | 'PLANEJADA'       // Criada, aguardando início
  | 'SEPARACAO'       // Almoxarifado separando matérias-primas
  | 'EM_PRODUCAO'     // No chão de fábrica
  | 'QUALIDADE'       // Em inspeção / controle de qualidade
  | 'CONCLUIDA'       // Finalizada e baixada no estoque
  | 'CANCELADA';

export interface ProductionOrderMaterialRequirement {
  materialId: string;
  materialCode: string;
  materialName: string;
  requiredQuantity: number;
  unit: UnitOfMeasure;
  availableStock: number;
  unitCost: number;
  totalCost: number;
  isAvailable: boolean;
}

// Apontamento de tempo de produção
export interface TimeLog {
  id: string;
  stepId: string;
  stepName: string;
  operatorName: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  producedQuantity: number;
  notes?: string;
  loggedByUserId: string;
  loggedByUserName: string;
}

// Ordem de Produção (OP)
export interface ProductionOrder {
  id: string;
  code: string; // Ex: OP-2026-001
  orderId?: string; // Pedido de origem (opcional)
  orderNumber?: string;
  clientName?: string;
  
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: UnitOfMeasure;
  
  lotNumber: string; // Lote ex: LOTE-2610-A
  status: ProductionOrderStatus;
  
  issueDate: string; // Data de emissão
  startDate?: string; // Data início real
  targetDate: string; // Prazo de entrega planejado
  completedDate?: string; // Data conclusão real
  
  // Responsável Técnico
  technicalResponsibleId: string;
  technicalResponsibleName: string;
  technicalResponsibleRegistration: string;
  
  // Materiais e Insumos calculados
  materials: ProductionOrderMaterialRequirement[];
  
  // Roteiro e Tempos
  processSteps: ProcessStep[];
  plannedTotalMinutes: number;
  actualTotalMinutes: number;
  timeLogs: TimeLog[];
  
  // Capacidade / Linha alocada
  capacityId?: string;
  capacityName?: string;
  
  // Inspeção e Conclusão
  qualityNotes?: string;
  completedQuantity?: number;
  scrapQuantity?: number; // Refugo / Peças rejeitadas
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Snapshot de exportação/importação do ERP
export interface ERPDatabase {
  users: User[];
  currentUser: User;
  rawMaterials: RawMaterial[];
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  capacities: ProductionCapacity[];
  orders: Order[];
  productionOrders: ProductionOrder[];
}
