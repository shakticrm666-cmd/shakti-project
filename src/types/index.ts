export type {
  Team,
  TeamIncharge,
  Telecaller,
  TeamWithDetails
} from '../models';

export type { CustomerCase } from '../models';
export type { ColumnConfiguration as ColumnConfig } from '../models';
import { Employee } from '../models';
export type { Employee };

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  progress: number;
  status: string;
}

export interface ModalState<T = unknown> {
  isOpen: boolean;
  data?: T;
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: unknown;
  badge?: string | number;
}

export interface TeamInchargeDashboardProps {
  user: Employee;
  onLogout: () => void;
}

export interface DashboardMetrics {
  totalTeams: number;
  totalTelecallers: number;
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  pendingCases: number;
}

export interface PerformanceData {
  name: string;
  calls: number;
  connected: number;
  success: number;
  rate: string;
}

export interface ReportFilters {
  fromTelecaller: string;
  toTelecaller: string;
  product: string;
  dpdRange: string;
  minAmount: string;
  maxAmount: string;
}

export interface ReassignPreview {
  totalCases: number;
  fromTelecaller: string;
  toTelecaller: string;
  product: string;
  dpdRange: string;
}