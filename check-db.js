// Quick database check script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase database...\n');

  try {
    // Check super_admins table
    console.log('📋 Checking super_admins table:');
    const { data: superAdmins, error: superAdminError } = await supabase
      .from('super_admins')
      .select('*');

    if (superAdminError) {
      console.error('❌ Error querying super_admins:', superAdminError.message);
    } else {
      console.log(`✅ Found ${superAdmins?.length || 0} super admin(s):`);
      if (superAdmins && superAdmins.length > 0) {
        superAdmins.forEach((admin, index) => {
          console.log(`  ${index + 1}. Username: ${admin.username}`);
          console.log(`     Created: ${admin.created_at}`);
          console.log(`     ID: ${admin.id}`);
          console.log('');
        });
      } else {
        console.log('  No super admins found.\n');
      }
    }

    // Check other tables
    const tables = ['company_admins', 'employees', 'tenants'];

    for (const table of tables) {
      console.log(`📋 Checking ${table} table:`);
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`❌ Error querying ${table}:`, error.message);
      } else {
        console.log(`✅ Found ${data?.length || 0} record(s) in ${table}`);
        if (data && data.length > 0) {
          console.log('📄 Details:');
          data.forEach((record, index) => {
            console.log(`  ${index + 1}. ${JSON.stringify(record, null, 2)}`);
          });
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

checkDatabase();