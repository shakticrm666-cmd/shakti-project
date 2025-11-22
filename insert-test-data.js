// Script to insert test data for Telecaller testing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://157.173.218.112:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  console.log('🔄 Inserting test data...\n');

  try {
    // First, insert the tenant
    const tenantData = {
      id: '2e64a0d0-dd47-4c61-8c4d-373b36459a0a',
      name: 'Yanavi infotech',
      subdomain: 'yanavi',
      status: 'active',
      proprietor_name: 'naveen',
      phone_number: '9986155669',
      address: 'dasarahalli',
      gst_number: '22NOTHING IS IMPOSSIBEL',
      plan: 'basic',
      max_users: 10,
      max_connections: 5,
      settings: { branding: {}, features: { sms: false, voip: true, analytics: true, apiAccess: false } }
    };

    const { error: tenantError } = await supabase
      .from('tenants')
      .upsert([tenantData]);

    if (tenantError) {
      console.error('❌ Error inserting tenant:', tenantError.message);
    } else {
      console.log('✅ Tenant inserted or updated');
    }

    // Insert employee
    const employeeData = {
      tenant_id: '2e64a0d0-dd47-4c61-8c4d-373b36459a0a',
      name: 'Test Telecaller',
      emp_id: 'EMP001',
      mobile: '9876543210',
      password_hash: '$2a$10$ViqoEqQf4KosLeUJj3EoR.TeR1yw0WL7/Rly6LeKaWwh3TwVhymp.',
      role: 'Telecaller',
      status: 'active'
    };

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single();

    if (empError) {
      console.error('❌ Error inserting employee:', empError.message);
    } else {
      console.log('✅ Employee inserted:', employee);
    }

    // Insert customer cases
    const cases = [
      {
        tenant_id: '2e64a0d0-dd47-4c61-8c4d-373b36459a0a',
        assigned_employee_id: 'EMP001',
        loan_id: 'LN001',
        customer_name: 'John Doe',
        mobile_no: '9876543210',
        loan_amount: '500000',
        outstanding_amount: '450000',
        pos_amount: '50000',
        emi_amount: '15000',
        pending_dues: '75000',
        dpd: 45,
        address: '123 Main St, City',
        sanction_date: '2023-01-15',
        last_paid_amount: '15000',
        last_paid_date: '2024-11-15',
        branch_name: 'Main Branch',
        loan_type: 'Personal Loan',
        case_status: 'pending'
      },
      {
        tenant_id: '2e64a0d0-dd47-4c61-8c4d-373b36459a0a',
        assigned_employee_id: 'EMP001',
        loan_id: 'LN002',
        customer_name: 'Jane Smith',
        mobile_no: '9876543211',
        loan_amount: '300000',
        outstanding_amount: '195000',
        pos_amount: '105000',
        emi_amount: '12000',
        pending_dues: '36000',
        dpd: 30,
        address: '456 Oak Ave, City',
        sanction_date: '2023-09-20',
        last_paid_amount: '12000',
        last_paid_date: '2024-02-10',
        branch_name: 'Branch 2',
        loan_type: 'Home Loan',
        case_status: 'in_progress'
      }
    ];

    const { data: insertedCases, error: casesError } = await supabase
      .from('customer_cases')
      .insert(cases)
      .select();

    if (casesError) {
      console.error('❌ Error inserting cases:', casesError.message);
    } else {
      console.log('✅ Cases inserted:', insertedCases.length);
      insertedCases.forEach((c, i) => {
        console.log(`  ${i+1}. ${c.customer_name} - ${c.loan_id}`);
      });
    }

    console.log('\n🎉 Test data inserted successfully!');
    console.log('Login credentials:');
    console.log('Username: EMP001');
    console.log('Password: Arqpn2492n');
    console.log('Role: Telecaller');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

insertTestData();