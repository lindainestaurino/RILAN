export enum Role {
    Operador = 'operador',
    Gerente = 'gerente',
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    active: boolean;
    createdAt: string;
}

export interface Supplier {
    id: string;
    name: string;
    cnpj: string;
    phone: string;
    email: string;
}

export interface Material {
    id: number;
    code: string;
    description: string;
    category: string;
    unit: string;
    minStock: number;
    currentStock: number;
    supplier: Supplier;
    avgCost: number;
    controlStatus: string;
    purchaseRecommendation: string;
    stockValue: number;
}

export enum MovementType {
    Entrada = 'entrada',
    Saida = 'saida',
}

export enum MovementReason {
    Compra = 'compra',
    AjustePositivo = 'ajuste+',
    Devolucao = 'devolucao',
    Venda = 'venda',
    AjusteNegativo = 'ajuste-',
    ConsumoInterno = 'consumo interno',
    Estorno = 'estorno',
}

export interface StockMovement {
    id: number;
    materialId: number;
    materialCode: string;
    materialDescription: string;
    supplierName?: string;
    type: MovementType;
    reason: MovementReason;
    quantity: number;
    unitCost: number;
    movedAt: string;
    createdBy: string;
    docRef?: string;
    note?: string;
    location?: { lat: number; lon: number; };
}

export interface AuditLog {
    id: number;
    user: string;
    action: string;
    entity: string;
    entityId: number;
    timestamp: string;
    details: string;
}

export interface SalesForecast {
    materialDescription: string;
    predictedRank: number;
    justification: string;
}