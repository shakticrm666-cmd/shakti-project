export interface SuperAdmin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface SuperAdminInsert {
  username: string;
  password_hash: string;
}

export interface SuperAdminUpdate {
  username?: string;
  password_hash?: string;
}

export const SUPER_ADMIN_TABLE = 'super_admins' as const;
