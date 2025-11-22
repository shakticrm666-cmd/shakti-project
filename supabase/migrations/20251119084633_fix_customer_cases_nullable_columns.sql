/*
  # Fix customer_cases nullable constraints

  1. Changes to customer_cases table
    - Make `assigned_employee_id` nullable (cases can be unassigned initially)
    - Keep `loan_id` and `customer_name` as NOT NULL (required fields)

  2. Rationale
    - In team-based workflow, cases are uploaded first, then assigned to telecallers
    - Cases need unique loan_id and customer_name to be meaningful
    - assigned_employee_id becomes populated when case is assigned to a telecaller

  3. Notes
    - This allows bulk upload of cases without immediate assignment
    - Team incharge can assign cases to telecallers after upload
*/

-- Make assigned_employee_id nullable to allow unassigned cases
ALTER TABLE customer_cases 
ALTER COLUMN assigned_employee_id DROP NOT NULL;

-- Ensure loan_id and customer_name remain required
-- (They should already be NOT NULL, but we verify it)
ALTER TABLE customer_cases 
ALTER COLUMN loan_id SET NOT NULL,
ALTER COLUMN customer_name SET NOT NULL;