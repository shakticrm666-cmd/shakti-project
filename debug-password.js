// Debug password issue
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPassword() {
  console.log('🔍 Debugging password issue...\n');

  try {
    // Get the user with password hash
    const { data: user, error } = await supabase
      .from('super_admins')
      .select('id, username, password_hash')
      .eq('username', 'Shaktiadmin')
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log('📋 User data:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Password hash: ${user.password_hash}`);
    console.log(`   Hash length: ${user.password_hash.length}`);

    // Test password "Arqpn2492n"
    const testPassword = 'Arqpn2492n';
    console.log(`\n🔐 Testing password: "${testPassword}"`);

    if (!user.password_hash) {
      console.log('❌ No password hash found in database!');
      return;
    }

    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`✅ Password match result: ${isValid}`);

    if (!isValid) {
      console.log('\n🔄 Password does not match. Let me re-hash it...');

      // Create new hash
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(`New hash: ${newHash}`);

      // Update database
      const { error: updateError } = await supabase
        .from('super_admins')
        .update({ password_hash: newHash })
        .eq('username', 'Shaktiadmin');

      if (updateError) {
        console.error('❌ Update error:', updateError);
      } else {
        console.log('✅ Password updated in database');

        // Test again
        const retest = await bcrypt.compare(testPassword, newHash);
        console.log(`✅ Re-test result: ${retest}`);

        console.log('\n🎉 Try logging in again with:');
        console.log(`   Username: Shaktiadmin`);
        console.log(`   Password: Arqpn2492n`);
      }
    } else {
      console.log('✅ Password is correct! Issue might be elsewhere.');
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

debugPassword();