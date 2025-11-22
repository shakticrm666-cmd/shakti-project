// Test script to check employee query directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmployeeQuery() {
  console.log('🔍 Testing employee query...');

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, emp_id, email, password_hash, role, tenant_id, status')
      .eq('tenant_id', 'f482f8f9-ca40-4f88-a107-2173b2798035')
      .eq('emp_id', 'EMP002')
      .maybeSingle();

    console.log('Query result:', { data, error });

    if (error) {
      console.error('❌ Query failed:', error);
    } else {
      console.log('✅ Query successful');
    }
  } catch (err) {
    console.error('❌ Test error:', err);
  }
}

testEmployeeQuery();