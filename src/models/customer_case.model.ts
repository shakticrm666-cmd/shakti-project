export interface CustomerCase {
  id: string;
  tenant_id: string;
  assigned_employee_id: string;
  loan_id: string;
  customer_name: string;
  mobile_no: string | null;
  alternate_number: string | null;
  email: string | null;
  loan_amount: string | null;
  loan_type: string | null;
  outstanding_amount: string | null;
  pos_amount: string | null;
  emi_amount: string | null;
  pending_dues: string | null;
  dpd: number | null;
  branch_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  sanction_date: string | null;
  last_paid_date: string | null;
  last_paid_amount: string | null;
  payment_link: string | null;
  remarks: string | null;
  custom_fields: Record<string, unknown>;
  case_status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCaseInsert {
  tenant_id: string;
  assigned_employee_id: string;
  loan_id: string;
  customer_name: string;
  mobile_no?: string;
  alternate_number?: string;
  email?: string;
  loan_amount?: string;
  loan_type?: string;
  outstanding_amount?: string;
  pos_amount?: string;
  emi_amount?: string;
  pending_dues?: string;
  dpd?: number;
  branch_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  sanction_date?: string;
  last_paid_date?: string;
  last_paid_amount?: string;
  payment_link?: string;
  remarks?: string;
  custom_fields?: Record<string, unknown>;
  case_status?: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  uploaded_by?: string;
}

export interface CustomerCaseUpdate {
  assigned_employee_id?: string;
  loan_id?: string;
  customer_name?: string;
  mobile_no?: string;
  alternate_number?: string;
  email?: string;
  loan_amount?: string;
  loan_type?: string;
  outstanding_amount?: string;
  pos_amount?: string;
  emi_amount?: string;
  pending_dues?: string;
  dpd?: number;
  branch_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  sanction_date?: string;
  last_paid_date?: string;
  last_paid_amount?: string;
  payment_link?: string;
  remarks?: string;
  custom_fields?: Record<string, unknown>;
  case_status?: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const CUSTOMER_CASE_TABLE = 'customer_cases' as const;
