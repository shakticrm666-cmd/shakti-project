import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const seedSuperAdmin = async () => {
  try {
    const username = 'Shaktiadmin';
    const password = 'Arqpn2492n';

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: existingAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingAdmin) {
      console.log('Super admin already exists');
      return;
    }

    const { data, error } = await supabase
      .from('super_admins')
      .insert([
        {
          username,
          password_hash: passwordHash
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating super admin:', error);
      throw error;
    }

    console.log('Super admin created successfully:', data);
  } catch (error) {
    console.error('Failed to seed super admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
