export type CallStatus =
  | 'WN'           // Wrong Number
  | 'SW'           // Switched Off
  | 'RNR'          // Ringing No Response
  | 'BUSY'         // Busy
  | 'CALL_BACK'    // Call Back
  | 'PTP'          // Promise to Pay
  | 'FUTURE_PTP'   // Future Promise to Pay
  | 'BPTP'         // Broken Promise to Pay
  | 'RTP'          // Refused to Pay
  | 'NC'           // Not Connected
  | 'CD'           // Call Disconnected
  | 'INC';         // Incomplete

export interface CaseCallLog {
  id: string;
  case_id: string;
  employee_id: string;
  call_status: CallStatus;
  ptp_date: string | null;
  call_notes: string | null;
  call_duration: number;
  call_result: string | null;
  amount_collected: string | null;
  created_at: string;
}

export interface CaseCallLogInsert {
  case_id: string;
  employee_id: string;
  call_status: CallStatus;
  ptp_date?: string;
  call_notes?: string;
  call_duration?: number;
  call_result?: string;
  amount_collected?: string;
}

export interface CaseCallLogUpdate {
  call_status?: CallStatus;
  ptp_date?: string;
  call_notes?: string;
  call_duration?: number;
  call_result?: string;
  amount_collected?: string;
}

export const CASE_CALL_LOG_TABLE = 'case_call_logs' as const;
