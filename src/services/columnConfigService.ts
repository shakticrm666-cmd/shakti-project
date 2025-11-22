import { supabase } from '../lib/supabase';
import { COLUMN_CONFIGURATION_TABLE } from '../models';

export interface ColumnConfiguration {
  id?: string;
  tenant_id: string;
  product_name: string;
  column_name: string;
  display_name: string;
  is_active: boolean;
  is_custom: boolean;
  column_order: number;
  data_type: string;
}

export const columnConfigService = {
  async getColumnConfigurations(tenantId: string, productName?: string): Promise<ColumnConfiguration[]> {
    let query = supabase
      .from(COLUMN_CONFIGURATION_TABLE)
      .select('*')
      .eq('tenant_id', tenantId);

    if (productName) {
      query = query.eq('product_name', productName);
    }

    const { data, error } = await query.order('column_order', { ascending: true });

    if (error) {
      console.error('Error fetching column configurations:', error);
      throw new Error('Failed to fetch column configurations');
    }

    return data || [];
  },

  async getActiveColumnConfigurations(tenantId: string, productName?: string): Promise<ColumnConfiguration[]> {
    let query = supabase
      .from(COLUMN_CONFIGURATION_TABLE)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (productName) {
      query = query.eq('product_name', productName);
    }

    const { data, error } = await query.order('column_order', { ascending: true });

    if (error) {
      console.error('Error fetching active column configurations:', error);
      throw new Error('Failed to fetch active column configurations');
    }

    return data || [];
  },

  async saveColumnConfigurations(
    tenantId: string,
    productName: string,
    columns: Omit<ColumnConfiguration, 'id' | 'tenant_id' | 'product_name'>[]
  ): Promise<void> {
    const { error: deleteError } = await supabase
      .from(COLUMN_CONFIGURATION_TABLE)
      .delete()
      .eq('tenant_id', tenantId)
      .eq('product_name', productName);

    if (deleteError) {
      console.error('Error deleting old configurations:', deleteError);
      throw new Error('Failed to delete old configurations');
    }

    const columnsWithTenantId = columns.map(col => ({
      ...col,
      tenant_id: tenantId,
      product_name: productName
    }));

    const { error: insertError } = await supabase
      .from(COLUMN_CONFIGURATION_TABLE)
      .insert(columnsWithTenantId);

    if (insertError) {
      console.error('Error saving column configurations:', insertError);
      throw new Error('Failed to save column configurations');
    }
  },

  async initializeDefaultColumns(tenantId: string, productName: string): Promise<void> {
    const existingConfig = await this.getColumnConfigurations(tenantId, productName);

    if (existingConfig.length > 0) {
      return;
    }

    const defaultColumns: Omit<ColumnConfiguration, 'id' | 'tenant_id' | 'product_name'>[] = [
      // Customer Information columns
      { column_name: 'customerName', display_name: 'Customer Name', is_active: true, is_custom: false, column_order: 1, data_type: 'text' },
      { column_name: 'loanId', display_name: 'Loan ID', is_active: true, is_custom: false, column_order: 2, data_type: 'text' },
      { column_name: 'mobileNo', display_name: 'Mobile Number', is_active: true, is_custom: false, column_order: 3, data_type: 'phone' },
      { column_name: 'address', display_name: 'Address', is_active: true, is_custom: false, column_order: 4, data_type: 'text' },

      // Loan Details columns
      { column_name: 'dpd', display_name: 'DPD', is_active: true, is_custom: false, column_order: 5, data_type: 'number' },
      { column_name: 'pos', display_name: 'POS', is_active: true, is_custom: false, column_order: 6, data_type: 'currency' },
      { column_name: 'emi', display_name: 'EMI', is_active: true, is_custom: false, column_order: 7, data_type: 'currency' },
      { column_name: 'totalOutstanding', display_name: 'TOTAL OUTSTANDING', is_active: true, is_custom: false, column_order: 8, data_type: 'currency' },
      { column_name: 'employmentType', display_name: 'EMPLOYMENT TYPE', is_active: true, is_custom: false, column_order: 9, data_type: 'text' },
      { column_name: 'paymentLink', display_name: 'Payment Link', is_active: true, is_custom: false, column_order: 10, data_type: 'url' },
      { column_name: 'loanAmount', display_name: 'Loan Amount', is_active: true, is_custom: false, column_order: 11, data_type: 'currency' }
    ];

    await this.saveColumnConfigurations(tenantId, productName, defaultColumns);
  },

  async deleteProductConfigurations(tenantId: string, productName: string): Promise<void> {
    const { error } = await supabase
      .from(COLUMN_CONFIGURATION_TABLE)
      .delete()
      .eq('tenant_id', tenantId)
      .eq('product_name', productName);

    if (error) {
      console.error('Error deleting product configurations:', error);
      throw new Error('Failed to delete product configurations');
    }
  },

  async clearAllColumnConfigurations(tenantId: string): Promise<void> {
    const { error } = await supabase
      .from(COLUMN_CONFIGURATION_TABLE)
      .delete()
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error clearing all column configurations:', error);
      throw new Error('Failed to clear all column configurations');
    }
  }
};
