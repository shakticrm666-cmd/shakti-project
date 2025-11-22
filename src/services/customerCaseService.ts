import { supabase } from '../lib/supabase';
import { CUSTOMER_CASE_TABLE, CASE_CALL_LOG_TABLE, EMPLOYEE_TABLE } from '../models';
import type {
  TeamInchargeCase,
  CaseUploadResult,
  CaseFilters,
  CaseAssignment
} from '../types/caseManagement';

export interface CustomerCase {
  id?: string;
  tenant_id: string;
  assigned_employee_id?: string;
  team_id?: string;
  telecaller_id?: string;
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
  case_data?: Record<string, unknown>; // For backward compatibility
  product_name?: string;
  case_status?: string;
  status?: 'new' | 'assigned' | 'in_progress' | 'closed';
  priority?: string;
  uploaded_by?: string;
  total_collected_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CallLog {
  id?: string;
  case_id: string;
  employee_id: string;
  call_status: string;
  ptp_date?: string;
  call_notes?: string;
  call_duration?: number;
  call_result?: string;
  amount_collected?: string;
  created_at?: string;
}

export const customerCaseService = {
  async getCasesByEmployee(tenantId: string, employeeId: string): Promise<CustomerCase[]> {
    const { data, error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('assigned_employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer cases:', error);
      throw new Error('Failed to fetch customer cases');
    }

    return data || [];
  },

  async getCasesByTelecaller(tenantId: string, empId: string): Promise<CustomerCase[]> {
    try {
      console.log('getCasesByTelecaller called with tenantId:', tenantId, 'empId:', empId);

      // First, find the employee by EMPID
      const { data: employee, error: employeeError } = await supabase
        .from(EMPLOYEE_TABLE)
        .select('id, emp_id, name')
        .eq('tenant_id', tenantId)
        .eq('emp_id', empId)
        .eq('role', 'Telecaller')
        .eq('status', 'active')
        .maybeSingle();

      if (employeeError) {
        console.error('Error finding telecaller employee:', employeeError);
        return [];
      }

      if (!employee) {
        console.warn('No active telecaller found with EMPID:', empId, 'in tenant:', tenantId);
        return [];
      }

      console.log('Found employee:', employee);

      // First try to get cases by telecaller_id (UUID)
      const { data: casesByTelecallerId, error: telecallerError } = await supabase
        .from(CUSTOMER_CASE_TABLE)
        .select(`
          id, tenant_id, assigned_employee_id, team_id, telecaller_id,
          loan_id, customer_name, mobile_no, alternate_number, email,
          loan_amount, loan_type, outstanding_amount, pos_amount, emi_amount,
          pending_dues, dpd, branch_name, address, city, state, pincode,
          sanction_date, last_paid_date, last_paid_amount, payment_link,
          remarks, custom_fields, case_data, product_name, case_status, status, priority,
          uploaded_by, created_at, updated_at, total_collected_amount
        `)
        .eq('tenant_id', tenantId)
        .eq('telecaller_id', employee.id)
        .order('created_at', { ascending: false });

      if (telecallerError) {
        console.error('Error fetching cases by telecaller_id:', telecallerError);
      }

      console.log('Cases found by telecaller_id:', casesByTelecallerId?.length || 0);

      // If no cases found by telecaller_id, also try by assigned_employee_id as fallback
      if (!casesByTelecallerId || casesByTelecallerId.length === 0) {
        console.log('No cases found by telecaller_id, trying assigned_employee_id fallback');
        const { data: casesByEmpId, error: empIdError } = await supabase
          .from(CUSTOMER_CASE_TABLE)
          .select(`
            id, tenant_id, assigned_employee_id, team_id, telecaller_id,
            loan_id, customer_name, mobile_no, alternate_number, email,
            loan_amount, loan_type, outstanding_amount, pos_amount, emi_amount,
            pending_dues, dpd, branch_name, address, city, state, pincode,
            sanction_date, last_paid_date, last_paid_amount, payment_link,
            remarks, custom_fields, case_data, product_name, case_status, status, priority,
            uploaded_by, created_at, updated_at, total_collected_amount
          `)
          .eq('tenant_id', tenantId)
          .eq('assigned_employee_id', empId)
          .order('created_at', { ascending: false });

        if (empIdError) {
          console.error('Error fetching cases by assigned_employee_id:', empIdError);
          return [];
        }

        console.log('Cases found by assigned_employee_id:', casesByEmpId?.length || 0);
        return casesByEmpId || [];
      }

      return casesByTelecallerId || [];
    } catch (error) {
      console.error('Unexpected error in getCasesByTelecaller:', error);
      return [];
    }
  },

  async getAllCases(tenantId: string): Promise<CustomerCase[]> {
    const { data, error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all cases:', error);
      throw new Error('Failed to fetch all cases');
    }

    return data || [];
  },

  async createCase(caseData: Omit<CustomerCase, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerCase> {
    const { data, error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .insert([caseData])
      .select()
      .single();

    if (error) {
      console.error('Error creating case:', error);
      throw new Error('Failed to create case');
    }

    return data;
  },

  async bulkCreateCases(cases: Omit<CustomerCase, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .insert(cases);

    if (error) {
      console.error('Error bulk creating cases:', error);
      throw new Error('Failed to bulk create cases');
    }
  },

  async updateCase(caseId: string, updates: Partial<CustomerCase>): Promise<CustomerCase> {
    const { data, error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .update(updates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating case:', error);
      throw new Error('Failed to update case');
    }

    return data;
  },

  async deleteCase(caseId: string): Promise<void> {
    const { error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .delete()
      .eq('id', caseId);

    if (error) {
      console.error('Error deleting case:', error);
      throw new Error('Failed to delete case');
    }
  },

  async addCallLog(callLog: Omit<CallLog, 'id' | 'created_at'>): Promise<CallLog> {
    const { data, error } = await supabase
      .from(CASE_CALL_LOG_TABLE)
      .insert([callLog])
      .select()
      .single();

    if (error) {
      console.error('Error adding call log:', error);
      throw new Error('Failed to add call log');
    }

    return data;
  },

  async getCallLogsByCase(caseId: string): Promise<CallLog[]> {
    const { data, error } = await supabase
      .from(CASE_CALL_LOG_TABLE)
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching call logs:', error);
      throw new Error('Failed to fetch call logs');
    }

    return data || [];
  },

  async getCallLogsWithEmployeeDetails(caseId: string): Promise<(CallLog & { employee_name?: string })[]> {
    // First, get the call logs
    const { data: logs, error: logsError } = await supabase
      .from(CASE_CALL_LOG_TABLE)
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching call logs:', logsError);
      throw new Error('Failed to fetch call logs');
    }

    if (!logs || logs.length === 0) {
      return [];
    }

    // Get unique employee IDs
    const employeeIds = [...new Set(logs.map(log => log.employee_id))];

    // Fetch employee names
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name')
      .in('id', employeeIds);

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      // Return logs without employee names if fetch fails
      return logs.map(log => ({
        ...log,
        employee_name: 'Unknown'
      }));
    }

    // Create a map of employee IDs to names
    const employeeMap = new Map(
      (employees || []).map(emp => [emp.id, emp.name])
    );

    // Merge employee names with call logs
    return logs.map(log => ({
      ...log,
      employee_name: employeeMap.get(log.employee_id) || 'Unknown'
    }));
  },

  async getCaseStatsByEmployee(tenantId: string, employeeId: string): Promise<{
    totalCases: number;
    pendingCases: number;
    inProgressCases: number;
    resolvedCases: number;
    highPriorityCases: number;
  }> {
    const cases = await this.getCasesByEmployee(tenantId, employeeId);

    return {
      totalCases: cases.length,
      pendingCases: cases.filter(c => c.case_status === 'pending').length,
      inProgressCases: cases.filter(c => c.case_status === 'in_progress').length,
      resolvedCases: cases.filter(c => c.case_status === 'resolved').length,
      highPriorityCases: cases.filter(c => c.priority === 'high' || c.priority === 'urgent').length
    };
  },

  // Team Incharge specific methods
  async getTeamCases(tenantId: string, teamId: string): Promise<TeamInchargeCase[]> {
    try {
      // First get all cases for the team
      const { data: cases, error: casesError } = await supabase
        .from(CUSTOMER_CASE_TABLE)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (casesError) {
        console.error('Error fetching team cases:', casesError);
        throw new Error('Failed to fetch team cases');
      }

      if (!cases || cases.length === 0) {
        return [];
      }

      // Get unique telecaller IDs
      const telecallerIds = [...new Set(cases.filter(c => c.telecaller_id).map(c => c.telecaller_id))];

      // If no telecallers, return cases as is
      if (telecallerIds.length === 0) {
        return cases as TeamInchargeCase[];
      }

      // Fetch telecaller details
      const { data: telecallers, error: telecallersError } = await supabase
        .from('employees')
        .select('id, name, emp_id')
        .eq('tenant_id', tenantId)
        .in('id', telecallerIds);

      if (telecallersError) {
        console.error('Error fetching telecallers:', telecallersError);
        return cases as TeamInchargeCase[];
      }

      // Create a map of telecaller details
      const telecallerMap = new Map(
        telecallers?.map(t => [t.id, t]) || []
      );

      // Merge telecaller details with cases
      const casesWithTelecallers = cases.map(caseItem => ({
        ...caseItem,
        telecaller: caseItem.telecaller_id ? telecallerMap.get(caseItem.telecaller_id) : null
      }));

      return casesWithTelecallers as TeamInchargeCase[];
    } catch (error) {
      console.error('Error in getTeamCases:', error);
      throw error;
    }
  },

  async getUnassignedTeamCases(tenantId: string, teamId: string): Promise<TeamInchargeCase[]> {
    const { data, error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('team_id', teamId)
      .is('telecaller_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unassigned cases:', error);
      throw new Error('Failed to fetch unassigned cases');
    }

    return data || [];
  },

  async getCasesByFilters(tenantId: string, teamId: string, filters: CaseFilters): Promise<TeamInchargeCase[]> {
    console.log('Getting cases with filters:', filters);

    let query = supabase
      .from(CUSTOMER_CASE_TABLE)
      .select(`
        *,
        telecaller:employees!telecaller_id(
          id,
          name,
          emp_id
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('team_id', teamId);

    if (filters.product && filters.product.trim() !== '') {
      query = query.eq('product_name', filters.product);
    }

    if (filters.telecaller && filters.telecaller.trim() !== '') {
      query = query.eq('telecaller_id', filters.telecaller);
    }

    if (filters.status && filters.status.trim() !== '') {
      query = query.eq('status', filters.status);
    }

    if (filters.dateFrom && filters.dateFrom.trim() !== '') {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo && filters.dateTo.trim() !== '') {
      query = query.lte('created_at', filters.dateTo + 'T23:59:59.999Z');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching filtered cases:', error);
      throw new Error('Failed to fetch filtered cases');
    }

    console.log(`Found ${data?.length || 0} cases with filters`);
    return data || [];
  },

  async createBulkCases(cases: Omit<CustomerCase, 'id' | 'created_at' | 'updated_at'>[]): Promise<CaseUploadResult> {
    let totalUploaded = 0;
    let autoAssigned = 0;
    let unassigned = 0;
    const errors: Array<{ row: number; error: string; data: unknown }> = [];

    // Get all telecallers for auto-assignment lookup
    const telecallerMap = new Map<string, string>();
    const { data: telecallers } = await supabase
      .from(EMPLOYEE_TABLE)
      .select('id, emp_id')
      .eq('tenant_id', cases[0]?.tenant_id)
      .eq('role', 'Telecaller')
      .eq('status', 'active');

    telecallers?.forEach(tel => {
      telecallerMap.set(tel.emp_id, tel.id);
    });

    // Process cases in batches
    for (let i = 0; i < cases.length; i++) {
      try {
        const caseData = cases[i];
        const rowNumber = i + 1;

        // Auto-assign based on EMPID if available
        if (caseData.case_data?.EMPID && telecallerMap.has(String(caseData.case_data.EMPID))) {
          caseData.telecaller_id = telecallerMap.get(String(caseData.case_data.EMPID));
          caseData.assigned_employee_id = String(caseData.case_data.EMPID);
          caseData.status = 'assigned';
          autoAssigned++;
        } else {
          caseData.telecaller_id = null;
          caseData.assigned_employee_id = null;
          caseData.status = 'new';
          unassigned++;
        }

        // Use upsert to insert or update based on tenant_id + loan_id
        const { error } = await supabase
          .from(CUSTOMER_CASE_TABLE)
          .upsert([caseData], {
            onConflict: 'tenant_id,loan_id',
            ignoreDuplicates: false
          });

        if (error) {
          errors.push({
            row: rowNumber,
            error: error.message,
            data: caseData
          });
        } else {
          totalUploaded++;
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          error: (error as Error).message,
          data: cases[i]
        });
      }
    }

    return {
      totalUploaded,
      autoAssigned,
      unassigned,
      errors
    };
  },

  async assignCase(caseId: string, assignment: CaseAssignment): Promise<void> {
    const updateData: Partial<CustomerCase> = {
      telecaller_id: assignment.telecallerId,
      updated_at: new Date().toISOString()
    };

    // Set status based on assignment type
    if (assignment.telecallerId) {
      // Assigning - get telecaller's emp_id and set status to 'assigned'
      const { data: telecaller, error: telecallerError } = await supabase
        .from(EMPLOYEE_TABLE)
        .select('emp_id')
        .eq('id', assignment.telecallerId)
        .single();

      if (telecallerError || !telecaller) {
        console.error('Error finding telecaller:', telecallerError);
        throw new Error('Failed to find telecaller details');
      }

      updateData.assigned_employee_id = telecaller.emp_id || null;
      updateData.status = 'assigned';
    } else {
      // Unassigning - clear assigned_employee_id and set status to 'new'
      updateData.assigned_employee_id = null;
      updateData.status = 'new';
    }

    const { error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .update(updateData)
      .eq('id', caseId);

    if (error) {
      console.error('Error assigning/unassigning case:', error);
      throw new Error('Failed to update case assignment');
    }
  },

  async getTelecallerCaseStats(tenantId: string, telecallerId: string): Promise<{
    total: number;
    new: number;
    assigned: number;
    inProgress: number;
    closed: number;
  }> {
    const { data, error } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('telecaller_id', telecallerId);

    if (error) {
      console.error('Error fetching telecaller case stats:', error);
      throw new Error('Failed to fetch telecaller case stats');
    }

    const cases = data || [];
    return {
      total: cases.length,
      new: cases.filter(c => c.status === 'new').length,
      assigned: cases.filter(c => c.status === 'assigned').length,
      inProgress: cases.filter(c => c.status === 'in_progress').length,
      closed: cases.filter(c => c.status === 'closed').length
    };
  },

  async recordPayment(caseId: string, employeeId: string, amount: number, notes: string): Promise<CustomerCase> {
    const { data: currentCase, error: fetchError } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .select('*, total_collected_amount, outstanding_amount, loan_amount')
      .eq('id', caseId)
      .single();

    if (fetchError || !currentCase) {
      console.error('Error fetching case for payment:', fetchError);
      throw new Error('Failed to fetch case details');
    }

    const currentCollected = currentCase.total_collected_amount || 0;
    const newTotalCollected = currentCollected + amount;

    const outstandingAmount = parseFloat(currentCase.outstanding_amount || '0');
    const remainingAmount = outstandingAmount - newTotalCollected;
    const shouldCloseCase = remainingAmount <= 0;

    const { error: logError } = await supabase
      .from(CASE_CALL_LOG_TABLE)
      .insert({
        case_id: caseId,
        employee_id: employeeId,
        call_status: 'PAYMENT_RECEIVED',
        call_notes: notes,
        amount_collected: String(amount)
      });

    if (logError) {
      console.error('Error logging payment:', logError);
      throw new Error('Failed to record payment log');
    }

    const updateData: Partial<CustomerCase> = {
      total_collected_amount: newTotalCollected,
      updated_at: new Date().toISOString()
    };

    if (shouldCloseCase) {
      updateData.case_status = 'closed';
      updateData.status = 'closed';
    }

    const { data: updatedCase, error: updateError } = await supabase
      .from(CUSTOMER_CASE_TABLE)
      .update(updateData)
      .eq('id', caseId)
      .select('*, total_collected_amount')
      .single();

    if (updateError || !updatedCase) {
      console.error('Error updating case with payment:', updateError);
      throw new Error('Failed to update case');
    }

    return updatedCase;
  }
};
