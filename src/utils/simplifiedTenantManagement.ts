import { supabase } from '../lib/supabase';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface TenantCreateData {
  name: string;
  subdomain: string;
}

export const getAllTenants = async (): Promise<Tenant[]> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTenant = async (tenantData: TenantCreateData): Promise<Tenant> => {
  const { data, error } = await supabase
    .from('tenants')
    .insert([{
      name: tenantData.name,
      subdomain: tenantData.subdomain,
      status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTenant = async (id: string, tenantData: Partial<TenantCreateData>): Promise<Tenant> => {
  const { data, error } = await supabase
    .from('tenants')
    .update(tenantData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTenant = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (error) throw error;
  return !data;
};

export const sanitizeSubdomain = (subdomain: string): string => {
  return subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
};
