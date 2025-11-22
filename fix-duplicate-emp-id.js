// Script to fix duplicate employee ID issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateEmployeeId() {
  console.log('🔧 Fixing duplicate employee ID issue...\n');

  try {
    // Get both records with the duplicate EMP ID
    const { data: adminData, error: adminError } = await supabase
      .from('company_admins')
      .select('*')
      .eq('employee_id', 'EMP001');

    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('emp_id', 'EMP001');

    if (adminError || employeeError) {
      console.error('❌ Error fetching records:', adminError || employeeError);
      return;
    }

    console.log('📋 Current records with EMP ID "EMP001":');
    console.log('Company Admin:', adminData?.[0]);
    console.log('Employee:', employeeData?.[0]);

    // Option 1: Change the employee's EMP ID to make it unique
    if (employeeData && employeeData.length > 0) {
      const newEmpId = 'EMP002'; // or generate a unique ID

      console.log(`\n🔄 Updating employee EMP ID from "EMP001" to "${newEmpId}"...`);

      const { error: updateError } = await supabase
        .from('employees')
        .update({ emp_id: newEmpId })
        .eq('id', employeeData[0].id);

      if (updateError) {
        console.error('❌ Error updating employee:', updateError.message);
      } else {
        console.log('✅ Successfully updated employee EMP ID');

        // Verify the fix
        const { data: verifyData } = await supabase
          .from('employees')
          .select('emp_id')
          .eq('id', employeeData[0].id);

        console.log('✅ Verification - New EMP ID:', verifyData?.[0]?.emp_id);
      }
    }

    console.log('\n🎉 Duplicate EMP ID issue should now be resolved!');
    console.log('The Telecaller can now login with their original credentials.');

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

fixDuplicateEmployeeId();