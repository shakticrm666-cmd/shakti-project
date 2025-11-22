// Debug script to test authentication process
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuthentication() {
  console.log('🔍 Debugging authentication process...\n');

  try {
    // Test subdomain detection
    console.log('1. Testing subdomain detection for maryse.localhost...');
    const testSubdomain = 'maryse.localhost';
    const extracted = testSubdomain.split('.')[0];
    console.log('   Extracted subdomain:', extracted);

    // Get tenant by subdomain
    console.log('\n2. Looking up tenant by subdomain...');
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', extracted)
      .maybeSingle();

    if (tenantError) {
      console.error('❌ Tenant lookup error:', tenantError);
      return;
    }

    if (!tenantData) {
      console.error('❌ No tenant found with subdomain:', extracted);
      return;
    }

    console.log('✅ Found tenant:', tenantData.name, 'with ID:', tenantData.id);

    // Test employee lookup
    console.log('\n3. Testing employee lookup...');
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .eq('emp_id', 'EMP002')
      .maybeSingle();

    if (employeeError) {
      console.error('❌ Employee lookup error:', JSON.stringify(employeeError, null, 2));
      return;
    }

    if (!employeeData) {
      console.error('❌ No employee found with EMP ID EMP002 in tenant', tenantData.id);
      return;
    }

    console.log('✅ Found employee:', employeeData.name, 'with role:', employeeData.role);

    // Test company admin lookup (should not find anything)
    console.log('\n4. Testing company admin lookup (should be empty)...');
    const { data: adminData, error: adminError } = await supabase
      .from('company_admins')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .eq('employee_id', 'EMP002')
      .maybeSingle();

    if (adminError) {
      console.error('❌ Company admin lookup error:', adminError);
      return;
    }

    if (adminData) {
      console.log('⚠️  Found company admin (unexpected):', adminData.name);
    } else {
      console.log('✅ No company admin found (expected)');
    }

    console.log('\n🎉 Authentication debugging complete!');
    console.log('Employee should be able to login with:');
    console.log('- Employee ID: EMP002');
    console.log('- Tenant ID:', tenantData.id);

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

debugAuthentication();