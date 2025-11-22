import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://hlcxssgfizlbhbnwphsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsY3hzc2dmaXpsYmhibndwaHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzI0NTIsImV4cCI6MjA3OTEwODQ1Mn0.TF6-A_tAl20i7SFFZQMTVZPsxpEEEFOF70bkEI0eJ3U';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetSuperAdminPassword() {
  const username = 'admin';
  const newPassword = 'admin123';

  console.log('Resetting Super Admin password...');
  console.log('Username:', username);
  console.log('New Password:', newPassword);

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the password in the database
  const { data, error } = await supabase
    .from('super_admins')
    .update({ password_hash: hashedPassword })
    .eq('username', username)
    .select();

  if (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }

  console.log('\n✅ Password reset successfully!');
  console.log('\nLogin credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('\nYou can now login with these credentials.');
}

resetSuperAdminPassword();
