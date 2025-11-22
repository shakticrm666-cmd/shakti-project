import { supabase } from '../lib/supabase';
import { comparePassword } from '../utils/passwordUtils';
import { SUPER_ADMIN_TABLE, COMPANY_ADMIN_TABLE, EMPLOYEE_TABLE } from '../models';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  tenantId?: string;
  email?: string;
  name?: string;
  role?: string;
}

export const loginSuperAdmin = async (credentials: LoginCredentials): Promise<AuthenticatedUser> => {
  const { username, password } = credentials;

  console.log('Attempting login with username:', username);

  const { data, error } = await supabase
    .from(SUPER_ADMIN_TABLE)
    .select('id, username, password_hash')
    .eq('username', username)
    .maybeSingle();

  console.log('Query result:', { data, error });

  if (error) {
    console.error('Database error:', error);
    throw new Error('Authentication failed');
  }

  if (!data) {
    console.log('No user found with username:', username);
    throw new Error('Invalid username or password');
  }

  console.log('Found user, comparing password...');
  const isPasswordValid = await comparePassword(password, data.password_hash);
  console.log('Password valid:', isPasswordValid);

  if (!isPasswordValid) {
    throw new Error('Invalid username or password');
  }

  return {
    id: data.id,
    username: data.username
  };
};

export const loginCompanyAdmin = async (credentials: LoginCredentials): Promise<AuthenticatedUser> => {
  const { username, password } = credentials;

  console.log('Attempting login with identifier:', username);

  const { data: adminData, error: adminError } = await supabase
    .from(COMPANY_ADMIN_TABLE)
    .select('id, employee_id, name, email, password_hash, tenant_id')
    .eq('employee_id', username)
    .maybeSingle();

  console.log('Company admin query result:', { adminData, adminError });

  if (adminError) {
    console.error('Company admin query error:', adminError);
    throw new Error('Authentication failed');
  }

  if (adminData) {
    console.log('Found company admin, validating password...');
    const isPasswordValid = await comparePassword(password, adminData.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid employee ID or password');
    }

    return {
      id: adminData.id,
      username: adminData.employee_id,
      email: adminData.email,
      name: adminData.name || adminData.employee_id,
      tenantId: adminData.tenant_id,
      role: 'CompanyAdmin'
    };
  }

  const { data: employeeData, error: employeeError } = await supabase
    .from(EMPLOYEE_TABLE)
    .select('id, name, emp_id, mobile, password_hash, role, tenant_id, status')
    .eq('emp_id', username)
    .maybeSingle();

  console.log('Employee query result:', { employeeData, employeeError });

  if (employeeError) {
    console.error('Employee query error:', employeeError);
    throw new Error('Authentication failed');
  }

  if (employeeData) {
    if (employeeData.status !== 'active') {
      throw new Error('Your account is inactive. Please contact your administrator.');
    }

    console.log('Found employee, validating password...');
    const isPasswordValid = await comparePassword(password, employeeData.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid employee ID or password');
    }

    return {
      id: employeeData.id,
      username: employeeData.emp_id,
      email: employeeData.mobile || employeeData.name,
      name: employeeData.name,
      tenantId: employeeData.tenant_id,
      role: employeeData.role || 'Employee'
    };
  }

  console.log('No user found with identifier:', username);
  throw new Error('Invalid credentials');
};

