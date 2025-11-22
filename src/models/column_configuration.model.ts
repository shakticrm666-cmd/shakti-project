export type ColumnDataType = 'text' | 'number' | 'date' | 'phone' | 'currency' | 'email' | 'url';

export interface ColumnConfiguration {
  id: string;
  tenant_id: string;
  product_name: string;
  column_name: string;
  display_name: string;
  is_active: boolean;
  is_custom: boolean;
  column_order: number;
  data_type: ColumnDataType;
  created_at: string;
  updated_at: string;
}

export interface ColumnConfigurationInsert {
  tenant_id: string;
  product_name: string;
  column_name: string;
  display_name: string;
  is_active?: boolean;
  is_custom?: boolean;
  column_order?: number;
  data_type?: ColumnDataType;
}

export interface ColumnConfigurationUpdate {
  column_name?: string;
  display_name?: string;
  product_name?: string;
  is_active?: boolean;
  is_custom?: boolean;
  column_order?: number;
  data_type?: ColumnDataType;
}

export const COLUMN_CONFIGURATION_TABLE = 'column_configurations' as const;
