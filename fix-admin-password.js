// Script to fix the admin password
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminPassword() {
  console.log('🔧 Fixing Shaktiadmin password...\n');

  try {
    // First, check current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('super_admins')
      .select('id, username, password_hash')
      .eq('username', 'Shaktiadmin')
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError.message);
      return;
    }

    if (!currentUser) {
      console.error('❌ User Shaktiadmin not found');
      return;
    }

    console.log('📋 Current user data:');
    console.log(`   Username: ${currentUser.username}`);
    console.log(`   Has password hash: ${!!currentUser.password_hash}`);
    console.log(`   Password hash length: ${currentUser.password_hash?.length || 0}`);

    // Hash the user's preferred password
    const defaultPassword = 'Arqpn2492n'; // User's preferred password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    console.log(`\n🔐 Setting new password for Shaktiadmin...`);
    console.log(`   New password will be: ${defaultPassword}`);

    // Update the user with the new password hash
    const { data, error } = await supabase
      .from('super_admins')
      .update({ password_hash: hashedPassword })
      .eq('username', 'Shaktiadmin')
      .select();

    if (error) {
      console.error('❌ Error updating password:', error.message);
    } else {
      console.log('✅ Password updated successfully!');
      console.log(`\n🎉 You can now login with:`);
      console.log(`   Username: Shaktiadmin`);
      console.log(`   Password: ${defaultPassword}`);
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

fixAdminPassword();