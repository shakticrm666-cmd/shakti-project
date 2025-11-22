import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/employee';
import { EMPLOYEE_TABLE } from '../models';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


interface EmployeeExcelRow {
  Name: string;
  Mobile: string;
  'EMP ID': string;
  Role: string;
  Status?: string;
  [key: string]: unknown;
}

export const employeeService = {
  async getEmployees(tenantId: string, roleFilter?: string): Promise<Employee[]> {
    try {
      let query = supabase
        .from(EMPLOYEE_TABLE)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (roleFilter && roleFilter !== 'All') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching employees:', error);
        throw new Error(error.message);
      }

      return (data || []).map(emp => ({
        id: emp.id,
        tenantId: emp.tenant_id,
        name: emp.name,
        mobile: emp.mobile,
        empId: emp.emp_id,
        role: emp.role,
        status: emp.status,
        createdAt: new Date(emp.created_at),
        updatedAt: new Date(emp.updated_at),
        createdBy: emp.created_by,
      }));
    } catch (error) {
      console.error('Error in getEmployees:', error);
      throw error;
    }
  },

  async createEmployee(tenantId: string, createdBy: string | null, employeeData: CreateEmployeeRequest): Promise<Employee> {
    try {
      const passwordHash = await bcrypt.hash(employeeData.password, 10);

      const insertData: Record<string, unknown> = {
        tenant_id: tenantId,
        name: employeeData.name,
        mobile: employeeData.mobile,
        emp_id: employeeData.empId,
        password_hash: passwordHash,
        role: employeeData.role,
        status: 'active',
      };

      if (createdBy && createdBy.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        insertData.created_by = createdBy;
      }

      const { data, error } = await supabase
        .from(EMPLOYEE_TABLE)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating employee:', error);
        throw new Error(error.message);
      }

      return {
        id: data.id,
        tenantId: data.tenant_id,
        name: data.name,
        mobile: data.mobile,
        empId: data.emp_id,
        role: data.role,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
      };
    } catch (error) {
      console.error('Error in createEmployee:', error);
      throw error;
    }
  },

  async updateEmployee(employeeId: string, updates: UpdateEmployeeRequest): Promise<Employee> {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.mobile !== undefined) updateData.mobile = updates.mobile;
      if (updates.empId !== undefined) updateData.emp_id = updates.empId;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.password !== undefined && updates.password.trim() !== '') {
        updateData.password_hash = await bcrypt.hash(updates.password, 10);
      }

      const { data, error } = await supabase
        .from(EMPLOYEE_TABLE)
        .update(updateData)
        .eq('id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('Error updating employee:', error);
        throw new Error(error.message);
      }

      return {
        id: data.id,
        tenantId: data.tenant_id,
        name: data.name,
        mobile: data.mobile,
        empId: data.emp_id,
        role: data.role,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
      };
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      throw error;
    }
  },

  async deleteEmployee(employeeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(EMPLOYEE_TABLE)
        .delete()
        .eq('id', employeeId);

      if (error) {
        console.error('Error deleting employee:', error);
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      throw error;
    }
  },

  async bulkDeleteEmployees(employeeIds: string[]): Promise<{ successful: number; failed: number; errors: string[] }> {
    try {
      let successful = 0;
      const errors: string[] = [];

      // Delete employees one by one for better error handling
      for (const employeeId of employeeIds) {
        try {
          await this.deleteEmployee(employeeId);
          successful++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to delete employee ${employeeId}: ${message}`);
        }
      }

      return {
        successful,
        failed: errors.length,
        errors
      };
    } catch (error) {
      console.error('Error in bulkDeleteEmployees:', error);
      throw error;
    }
  },

  async resetEmployeePassword(employeeId: string): Promise<string> {
    try {
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const { error } = await supabase
        .from(EMPLOYEE_TABLE)
        .update({ password_hash: passwordHash })
        .eq('id', employeeId);

      if (error) {
        console.error('Error resetting password:', error);
        throw new Error(error.message);
      }

      return tempPassword;
    } catch (error) {
      console.error('Error in resetEmployeePassword:', error);
      throw error;
    }
  },

  async toggleEmployeeStatus(employeeId: string, currentStatus: string): Promise<Employee> {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const { data, error } = await supabase
        .from(EMPLOYEE_TABLE)
        .update({ status: newStatus })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling employee status:', error);
        throw new Error(error.message);
      }

      return {
        id: data.id,
        tenantId: data.tenant_id,
        name: data.name,
        mobile: data.mobile,
        empId: data.emp_id,
        role: data.role,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
      };
    } catch (error) {
      console.error('Error in toggleEmployeeStatus:', error);
      throw error;
    }
  },

  downloadTemplate(): void {
    const templateData = [
      {
        'Name': 'John Doe',
        'Mobile': '+91 98765 43210',
        'EMP ID': 'EMP001',
        'Role': 'Telecaller',
        'Status': 'active'
      },
      {
        'Name': 'Jane Smith',
        'Mobile': '+91 98765 43211',
        'EMP ID': 'EMP002',
        'Role': 'TeamIncharge',
        'Status': 'active'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Template');

    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // Name
      { wch: 15 }, // Mobile
      { wch: 10 }, // EMP ID
      { wch: 12 }, // Role
      { wch: 10 }  // Status
    ];
    ws['!cols'] = colWidths;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'employee_upload_template.xlsx');
  },

  async bulkUploadEmployees(tenantId: string, createdBy: string | null, file: File): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ row: number; error: string; data?: unknown }>;
  }> {
    try {
      // Load existing employees for duplicate checking
      const existingEmployees = await this.getEmployees(tenantId, 'All');

      // Read Excel file
      const data = await new Promise<EmployeeExcelRow[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target?.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as EmployeeExcelRow[];
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsBinaryString(file);
      });

      if (data.length === 0) {
        throw new Error('Excel file is empty');
      }

      if (data.length > 500) {
        throw new Error('Maximum 500 records allowed per upload');
      }

      // Validate and check for duplicates
      const errors: Array<{ row: number; error: string; data?: unknown }> = [];
      const validEmployees: CreateEmployeeRequest[] = [];

      for (let i = 0; i < data.length; i++) {
        // Validate data
        const validationError = this.validateEmployeeData(data[i], i);
        if (validationError) {
          errors.push({ row: i + 1, error: validationError, data: data[i] });
          continue;
        }

        // Check for duplicates
        const duplicateErrors = this.checkForDuplicates(data, i, existingEmployees);
        if (duplicateErrors.length > 0) {
          duplicateErrors.forEach(error => {
            errors.push({ row: i + 1, error, data: data[i] });
          });
          continue;
        }

        // Prepare employee data
        const employeeData: CreateEmployeeRequest = {
          name: data[i].Name.trim(),
          mobile: data[i].Mobile.trim(),
          empId: data[i]['EMP ID'].trim(),
          password: Math.random().toString(36).slice(-8), // Generate random password
          role: data[i].Role.trim() as 'Telecaller' | 'TeamIncharge',
        };

        validEmployees.push(employeeData);
      }

      // Process valid employees in batches
      let successful = 0;
      const processingErrors: Array<{ row: number; error: string; data?: unknown }> = [];

      for (let i = 0; i < validEmployees.length; i += 10) { // Process in batches of 10
        const batch = validEmployees.slice(i, i + 10);

        for (const employee of batch) {
          try {
            await this.createEmployee(tenantId, createdBy, employee);
            successful++;
          } catch (error) {
            const rowNumber = validEmployees.indexOf(employee) + 1;
            processingErrors.push({
              row: rowNumber,
              error: (error as Error).message || 'Failed to create employee',
              data: employee
            });
          }
        }
      }

      // Combine validation errors and processing errors
      const allErrors = [...errors, ...processingErrors];

      return {
        successful,
        failed: allErrors.length,
        errors: allErrors
      };

    } catch (error) {
      console.error('Bulk upload error:', error);
      const message = error instanceof Error ? error.message : 'An error occurred during upload';
      throw new Error(message);
    }
  },

  validateEmployeeData(data: Record<string, unknown>, rowIndex: number): string | null {
    // Helper function to safely get string value
    const getStringValue = (value: unknown): string => {
      return typeof value === 'string' ? value : String(value || '');
    };

    // Check required fields
    const name = getStringValue(data.Name);
    if (!name || name.trim() === '') {
      return `Row ${rowIndex + 1}: Name is required`;
    }
    const mobile = getStringValue(data.Mobile);
    if (!mobile || mobile.trim() === '') {
      return `Row ${rowIndex + 1}: Mobile is required`;
    }
    const empId = getStringValue(data['EMP ID']);
    if (!empId || empId.trim() === '') {
      return `Row ${rowIndex + 1}: EMP ID is required`;
    }
    const role = getStringValue(data.Role);
    if (!role || role.trim() === '') {
      return `Row ${rowIndex + 1}: Role is required`;
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^[+]?[0-9\s\-()]{10,15}$/;
    if (!mobileRegex.test(mobile.trim())) {
      return `Row ${rowIndex + 1}: Invalid mobile number format`;
    }

    // Validate role
    if (!['Telecaller', 'TeamIncharge'].includes(role.trim())) {
      return `Row ${rowIndex + 1}: Role must be either 'Telecaller' or 'TeamIncharge'`;
    }

    // Validate status if provided
    const status = getStringValue(data.Status);
    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      return `Row ${rowIndex + 1}: Status must be either 'active' or 'inactive'`;
    }

    return null;
  },

  checkForDuplicates(data: Record<string, unknown>[], currentIndex: number, allEmployees: Employee[]): string[] {
    const errors: string[] = [];

    // Helper function to safely get string value
    const getStringValue = (value: unknown): string => {
      return typeof value === 'string' ? value : String(value || '');
    };

    const currentEmpId = getStringValue(data[currentIndex]['EMP ID']).trim();
    const currentMobile = getStringValue(data[currentIndex]['Mobile']).trim();

    // Check against existing employees
    allEmployees.forEach(emp => {
      if (emp.empId === currentEmpId) {
        errors.push(`Row ${currentIndex + 1}: EMP ID '${currentEmpId}' already exists`);
      }
      if (emp.mobile === currentMobile) {
        errors.push(`Row ${currentIndex + 1}: Mobile '${currentMobile}' already exists`);
      }
    });

    // Check against other rows in the upload
    for (let i = 0; i < currentIndex; i++) {
      const empId = getStringValue(data[i]['EMP ID']).trim();
      const mobile = getStringValue(data[i]['Mobile']).trim();

      if (empId === currentEmpId) {
        errors.push(`Row ${currentIndex + 1}: EMP ID '${currentEmpId}' is duplicate within the upload file`);
      }
      if (mobile === currentMobile) {
        errors.push(`Row ${currentIndex + 1}: Mobile '${currentMobile}' is duplicate within the upload file`);
      }
    }

    return errors;
  },
};
