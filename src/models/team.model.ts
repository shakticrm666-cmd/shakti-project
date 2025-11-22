export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  team_incharge_id: string;
  product_name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TeamInsert {
  tenant_id: string;
  name: string;
  team_incharge_id: string;
  product_name: string;
  status?: 'active' | 'inactive';
  created_by?: string;
}

export interface TeamUpdate {
  name?: string;
  team_incharge_id?: string;
  product_name?: string;
  status?: 'active' | 'inactive';
}

export interface TeamIncharge {
  id: string;
  name: string;
  emp_id: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

export interface Telecaller {
  id: string;
  name: string;
  emp_id: string;
  email?: string;
  phone?: string;
  team_id?: string;
  assigned_cases?: number;
  status?: 'active' | 'inactive';
}

export interface TeamWithDetails extends Team {
  team_incharge?: TeamIncharge;
  telecallers: Telecaller[];
  total_cases: number;
}

export const TEAM_TABLE = 'teams' as const;
