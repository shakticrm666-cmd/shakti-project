// Script to recreate the mohan employee with correct details
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateEmployee() {
  console.log('🔄 Recreating mohan employee with correct details...\n');

  try {
    // First, delete the current employee with EMP002 if it exists
    console.log('1. Removing existing employee with EMP002...');
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('emp_id', 'EMP002');

    if (deleteError) {
      console.error('❌ Error deleting existing employee:', deleteError.message);
    } else {
      console.log('✅ Existing employee removed');
    }

    // Get the tenant and company admin info
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', 'maryse')
      .single();

    if (tenantError || !tenantData) {
      console.error('❌ Could not find tenant:', tenantError?.message);
      return;
    }

    const { data: adminData, error: adminError } = await supabase
      .from('company_admins')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .single();

    if (adminError || !adminData) {
      console.error('❌ Could not find company admin:', adminError?.message);
      return;
    }

    // Hash the password
    console.log('2. Hashing password...');
    const password = '121212';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed');

    // Create the new employee
    console.log('3. Creating mohan employee...');
    const { data: newEmployee, error: createError } = await supabase
      .from('employees')
      .insert({
        tenant_id: tenantData.id,
        name: 'mohan',
        mobile: '998866554477',
        emp_id: 'EMP002',
        password_hash: passwordHash,
        role: 'Telecaller',
        status: 'active',
        created_by: adminData.id
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating employee:', createError.message);
      return;
    }

    console.log('✅ Employee created successfully!');
    console.log('📋 Employee details:');
    console.log('   Name: mohan');
    console.log('   EMP ID: EMP002');
    console.log('   Role: Telecaller');
    console.log('   Mobile: 998866554477');
    console.log('   Password: 121212');

    console.log('\n🎉 Employee recreation complete!');
    console.log('You can now login at http://maryse.localhost:3001/login');
    console.log('Use Employee ID: EMP002 and Password: 121212');

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

recreateEmployee();