/*
  # Add PAYMENT_RECEIVED to Call Status Options

  ## Summary
  Adds 'PAYMENT_RECEIVED' as a valid call status option to enable recording
  of payment collection events in the call logs.

  ## Changes
  1. Drops existing CHECK constraint on call_status
  2. Adds new CHECK constraint including 'PAYMENT_RECEIVED'

  ## Status Options After Migration
  - WN (Wrong Number)
  - SW (Switched Off)
  - RNR (Ringing No Response)
  - BUSY
  - CALL_BACK
  - PTP (Promise to Pay)
  - FUTURE_PTP
  - BPTP (Broken Promise to Pay)
  - RTP (Refuse to Pay)
  - NC (Not Contactable)
  - CD (Customer Dispute)
  - INC (Incomplete)
  - PAYMENT_RECEIVED (New)
*/

-- Drop the existing CHECK constraint
ALTER TABLE case_call_logs 
DROP CONSTRAINT IF EXISTS case_call_logs_call_status_check;

-- Add new CHECK constraint with PAYMENT_RECEIVED included
ALTER TABLE case_call_logs 
ADD CONSTRAINT case_call_logs_call_status_check 
CHECK (call_status IN (
  'WN', 
  'SW', 
  'RNR', 
  'BUSY', 
  'CALL_BACK', 
  'PTP', 
  'FUTURE_PTP', 
  'BPTP', 
  'RTP', 
  'NC', 
  'CD', 
  'INC',
  'PAYMENT_RECEIVED'
));