import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  try {
    console.log('Creating super admin user...');

    const username = 'Shaktiadmin';
    const password = '123456';

    const passwordHash = await bcrypt.hash(password, 10);

    console.log('Password hashed successfully');

    const { data, error } = await supabase
      .from('super_admins')
      .insert({
        username: username,
        password_hash: passwordHash
      })
      .select();

    if (error) {
      if (error.code === '23505') {
        console.log('Super admin already exists with this username');

        const { data: updateData, error: updateError } = await supabase
          .from('super_admins')
          .update({ password_hash: passwordHash })
          .eq('username', username)
          .select();

        if (updateError) {
          console.error('Error updating super admin:', updateError);
          process.exit(1);
        }

        console.log('Super admin password updated successfully');
        console.log('Username:', username);
        console.log('Password: 123456');
        return;
      }

      console.error('Error creating super admin:', error);
      process.exit(1);
    }

    console.log('Super admin created successfully!');
    console.log('Username:', username);
    console.log('Password: 123456');
    console.log('Data:', data);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSuperAdmin();
