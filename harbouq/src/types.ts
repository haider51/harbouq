export interface UserProfile {
  name: string;
  projectName: string;
  projectDescription: string;
  createdAt: string;
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  rawMaterialCost: number;
  manufacturingPrice: number;
  createdAt: string;
}

export interface Material {
  id?: string;
  name: string;
  cost: number;
  quantity: number;
  duration: string;
  createdAt: string;
}

export interface Employee {
  id?: string;
  name: string;
  salary: number;
  createdAt: string;
}

export interface Machine {
  id?: string;
  name: string;
  lastMaintenance: string;
  nextMaintenance: string;
  createdAt: string;
}

export interface Credit {
  id?: string;
  type: 'owed_to_me' | 'owed_by_me';
  amount: number;
  party: string;
  dueDate: string;
  createdAt: string;
}

export interface LogEntry {
  id?: string;
  type: 'sale' | 'purchase' | 'expense' | 'other';
  description: string;
  amount: number;
  date: string;
  relatedEntityId?: string;
}
