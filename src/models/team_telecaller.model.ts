export interface TeamTelecaller {
  id: string;
  team_id: string;
  telecaller_id: string;
  assigned_by: string | null;
  created_at: string;
}

export interface TeamTelecallerInsert {
  team_id: string;
  telecaller_id: string;
  assigned_by?: string;
}

export const TEAM_TELECALLER_TABLE = 'team_telecallers' as const;
