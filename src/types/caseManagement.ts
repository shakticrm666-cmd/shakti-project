// Enhanced types for Case Management feature

export interface TeamInchargeCase {
  id: string;
  tenant_id: string;
  team_id: string;
  telecaller_id?: string;
  product_name: string;
  case_data: Record<string, unknown>;
  status: 'new' | 'assigned' | 'in_progress' | 'closed';
  uploaded_by: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  // Additional computed fields
  telecaller?: {
    id: string;
    name: string;
    emp_id: string;
  };
}

export interface CaseUploadResult {
  totalUploaded: number;
  autoAssigned: number;
  unassigned: number;
  errors: Array<{
    row: number;
    error: string;
    data: unknown;
  }>;
}

export interface CaseFilters {
  product?: string;
  telecaller?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TeamTelecaller {
  id: string;
  name: string;
  emp_id: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  assigned_cases: number;
}

export interface CaseAssignment {
  caseId: string;
  telecallerId: string | null;
  assignedBy: string;
}

export interface ExcelColumnMapping {
  [key: string]: {
    column_name: string;
    display_name: string;
    data_type: string;
    is_required: boolean;
  };
}

export interface CaseUploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentRow?: number;
  errors: string[];
}