// Test the exact query used in login
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('🔍 Testing the exact login query...\n');

  const username = 'Shaktiadmin';

  try {
    console.log(`Testing query for username: "${username}"`);

    const { data, error } = await supabase
      .from('super_admins')
      .select('id, username, password_hash')
      .eq('username', username)
      .maybeSingle();

    console.log('\n📋 Query Results:');
    console.log('Data type:', typeof data);
    console.log('Data value:', data);
    console.log('Data is null:', data === null);
    console.log('Data is undefined:', data === undefined);
    console.log('Boolean data check:', !data);

    if (error) {
      console.log('❌ Query error:', error);
    } else {
      console.log('✅ No query error');
    }

    console.log('\n🔍 Detailed data inspection:');
    if (data) {
      console.log('Data keys:', Object.keys(data));
      console.log('Data.id:', data.id);
      console.log('Data.username:', data.username);
      console.log('Data.password_hash exists:', !!data.password_hash);
    }

    // Test the exact condition from authService
    console.log('\n🧪 Testing authService condition:');
    console.log('!data evaluates to:', !data);

    if (!data) {
      console.log('❌ This condition would trigger "No user found"');
    } else {
      console.log('✅ This condition would pass');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testQuery();