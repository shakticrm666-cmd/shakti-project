import { CompanyAdmin, CreateAdminRequest, UpdateAdminRequest } from '../types/admin';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

interface AdminRow {
  id: string;
  tenant_id: string;
  name: string;
  employee_id: string;
  email: string;
  status: 'active' | 'inactive';
  role: 'CompanyAdmin';
  last_login_at?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const getAdminsByTenantId = async (tenantId: string): Promise<CompanyAdmin[]> => {
  const { data, error } = await supabase
    .from('company_admins')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admins by tenant:', error);
    return [];
  }

  return data.map((item: AdminRow) => ({
    id: item.id,
    tenantId: item.tenant_id,
    name: item.name,
    employeeId: item.employee_id,
    email: item.email,
    status: item.status,
    role: item.role,
    lastLoginAt: item.last_login_at ? new Date(item.last_login_at) : undefined,
    passwordResetToken: item.password_reset_token,
    passwordResetExpires: item.password_reset_expires ? new Date(item.password_reset_expires) : undefined,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    createdBy: item.created_by || ''
  }));
};

export const getAdminById = async (adminId: string): Promise<CompanyAdmin | null> => {
  const { data, error } = await supabase
    .from('company_admins')
    .select('*')
    .eq('id', adminId)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching admin by ID:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    employeeId: data.employee_id,
    email: data.email,
    status: data.status,
    role: data.role,
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    passwordResetToken: data.password_reset_token,
    passwordResetExpires: data.password_reset_expires ? new Date(data.password_reset_expires) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by || ''
  };
};

export const createAdmin = async (tenantId: string, adminData: CreateAdminRequest, createdBy?: string): Promise<CompanyAdmin> => {
  const passwordHash = await hashPassword(adminData.password);

  const insertData: Record<string, unknown> = {
    tenant_id: tenantId,
    name: adminData.name,
    employee_id: adminData.employeeId,
    email: adminData.email,
    password_hash: passwordHash,
    status: adminData.status || 'active',
    role: 'CompanyAdmin'
  };

  if (createdBy) {
    insertData.created_by = createdBy;
  }

  const { data, error } = await supabase
    .from('company_admins')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating admin:', error);
    if (error.code === '23505') {
      throw new Error('An admin with this email or employee ID already exists');
    }
    if (error.code === '23503') {
      throw new Error('Invalid reference. Please check tenant information.');
    }
    throw new Error(error.message || 'Failed to create admin');
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    employeeId: data.employee_id,
    email: data.email,
    status: data.status,
    role: data.role,
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by || ''
  };
};

export const updateAdmin = async (adminId: string, updates: UpdateAdminRequest): Promise<CompanyAdmin> => {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.employeeId !== undefined) updateData.employee_id = updates.employeeId;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { data, error } = await supabase
    .from('company_admins')
    .update(updateData)
    .eq('id', adminId)
    .select()
    .single();

  if (error) {
    console.error('Error updating admin:', error);
    throw new Error('Failed to update admin');
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    employeeId: data.employee_id,
    email: data.email,
    status: data.status,
    role: data.role,
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by || ''
  };
};

export const deleteAdmin = async (adminId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('company_admins')
    .delete()
    .eq('id', adminId);

  if (error) {
    console.error('Error deleting admin:', error);
    throw new Error('Failed to delete admin');
  }

  return true;
};

export const resetAdminPassword = async (adminId: string): Promise<string> => {
  const tempPassword = `TempPass${Math.random().toString(36).slice(-6)}!`;
  const passwordHash = await hashPassword(tempPassword);

  const { error } = await supabase
    .from('company_admins')
    .update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null
    })
    .eq('id', adminId);

  if (error) {
    console.error('Error resetting password:', error);
    throw new Error('Failed to reset password');
  }

  return tempPassword;
};

export const toggleAdminStatus = async (adminId: string): Promise<CompanyAdmin> => {
  const admin = await getAdminById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  const newStatus = admin.status === 'active' ? 'inactive' : 'active';

  const { data, error } = await supabase
    .from('company_admins')
    .update({ status: newStatus })
    .eq('id', adminId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling admin status:', error);
    throw new Error('Failed to toggle admin status');
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    employeeId: data.employee_id,
    email: data.email,
    status: data.status,
    role: data.role,
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by || ''
  };
};

export const isEmployeeIdUnique = async (tenantId: string, employeeId: string, excludeAdminId?: string): Promise<boolean> => {
  let query = supabase
    .from('company_admins')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('employee_id', employeeId);

  if (excludeAdminId) {
    query = query.neq('id', excludeAdminId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking employee ID uniqueness:', error);
    return false;
  }

  return data.length === 0;
};

export const isEmailUnique = async (tenantId: string, email: string, excludeAdminId?: string): Promise<boolean> => {
  let query = supabase
    .from('company_admins')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('email', email);

  if (excludeAdminId) {
    query = query.neq('id', excludeAdminId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking email uniqueness:', error);
    return false;
  }

  return data.length === 0;
};