import { useState, useEffect, useCallback } from 'react';
import { TeamService, TeamWithDetails } from '../services/teamService';
import type { Team } from '../types';

export const useTeams = (tenantId?: string) => {
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      setError(null);
      const teamsData = await TeamService.getTeams(tenantId);
      setTeams(teamsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teams';
      setError(errorMessage);
      console.error('Error loading teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  const createTeam = useCallback(async (teamData: Partial<Team> & { selectedTelecallers?: string[], selectedColumn?: string }) => {
    try {
      setError(null);
      
      // Validate required data
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }
      if (!teamData.name) {
        throw new Error('Team name is required');
      }
      if (!teamData.team_incharge_id) {
        throw new Error('Team in-charge ID is required');
      }
      
      console.log('Creating team with data:', {
        tenant_id: tenantId,
        name: teamData.name,
        team_incharge_id: teamData.team_incharge_id,
        telecaller_ids: teamData.selectedTelecallers || [],
        product_name: teamData.selectedColumn || teamData.product_name || 'General',
        created_by: teamData.team_incharge_id // Use team in-charge as creator
      });
      
      await TeamService.createTeam({
        tenant_id: tenantId,
        name: teamData.name,
        team_incharge_id: teamData.team_incharge_id,
        telecaller_ids: teamData.selectedTelecallers || [],
        product_name: teamData.selectedColumn || teamData.product_name || 'General',
        created_by: teamData.team_incharge_id
      });
      await loadTeams();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      setError(errorMessage);
      console.error('Team creation error:', err);
      alert(errorMessage);
      return false;
    }
  }, [tenantId, loadTeams]);

  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team> & { selectedTelecallers?: string[], selectedColumn?: string }) => {
    try {
      setError(null);
      await TeamService.updateTeam(teamId, {
        name: updates.name,
        team_incharge_id: updates.team_incharge_id,
        telecaller_ids: updates.selectedTelecallers,
        status: updates.status,
        product_name: updates.selectedColumn || updates.product_name
      });
      await loadTeams();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team';
      setError(errorMessage);
      alert(errorMessage);
      return false;
    }
  }, [loadTeams]);

  const deleteTeam = useCallback(async (teamId: string) => {
    try {
      setError(null);
      await TeamService.deleteTeam(teamId);
      await loadTeams();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      setError(errorMessage);
      alert(errorMessage);
      return false;
    }
  }, [loadTeams]);

  const toggleTeamStatus = useCallback(async (teamId: string) => {
    try {
      setError(null);
      await TeamService.toggleTeamStatus(teamId);
      await loadTeams();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team status';
      setError(errorMessage);
      alert(errorMessage);
      return false;
    }
  }, [loadTeams]);

  useEffect(() => {
    if (tenantId) {
      loadTeams();
    }
  }, [tenantId, loadTeams]);

  return {
    teams,
    isLoading,
    error,
    loadTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    toggleTeamStatus,
  };
};