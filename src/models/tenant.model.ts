export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended';
  proprietor_name: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  plan: 'basic' | 'standard' | 'premium' | 'enterprise';
  max_users: number;
  max_connections: number;
  settings: {
    branding?: Record<string, unknown>;
    features?: {
      voip?: boolean;
      sms?: boolean;
      analytics?: boolean;
      apiAccess?: boolean;
    };
  };
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TenantInsert {
  name: string;
  subdomain: string;
  status?: 'active' | 'inactive' | 'suspended';
  proprietor_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  pan_number?: string;
  city?: string;
  state?: string;
  pincode?: string;
  plan?: 'basic' | 'standard' | 'premium' | 'enterprise';
  max_users?: number;
  max_connections?: number;
  settings?: Tenant['settings'];
  created_by?: string;
}

export interface TenantUpdate {
  name?: string;
  subdomain?: string;
  status?: 'active' | 'inactive' | 'suspended';
  proprietor_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  gst_number?: string;
  pan_number?: string;
  city?: string;
  state?: string;
  pincode?: string;
  plan?: 'basic' | 'standard' | 'premium' | 'enterprise';
  max_users?: number;
  max_connections?: number;
  settings?: Tenant['settings'];
}

export const TENANT_TABLE = 'tenants' as const;
