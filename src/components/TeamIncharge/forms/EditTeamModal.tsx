import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../shared/Modal';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { TeamWithDetails } from '../../../models';
import { useProducts } from '../../../hooks/useProducts';
import { useNotification, notificationHelpers } from '../../shared/Notification';
import { useAuth } from '../../../contexts/AuthContext';

interface SimpleTelecaller {
  id: string;
  name: string;
  emp_id: string;
}

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdated: () => void;
  team: TeamWithDetails | null;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamUpdated,
  team
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { products } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTelecallers, setIsLoadingTelecallers] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [teamStatus, setTeamStatus] = useState<'active' | 'inactive'>('active');
  const [assignedTelecallers, setAssignedTelecallers] = useState<SimpleTelecaller[]>([]);
  const [availableTelecallers, setAvailableTelecallers] = useState<SimpleTelecaller[]>([]);
  const [selectedTelecallerIds, setSelectedTelecallerIds] = useState<string[]>([]);

  const loadAvailableTelecallers = useCallback(async () => {
    if (!user?.tenantId || !team?.id) return;

    try {
      setIsLoadingTelecallers(true);
      const { data: telecallers, error } = await supabase
        .from('employees')
        .select('id, name, emp_id')
        .eq('tenant_id', user?.tenantId)
        .eq('role', 'Telecaller')
        .eq('status', 'active')
        .or(`team_id.is.null,team_id.eq.${team.id}`)
        .order('name');

      if (error) throw error;

      setAvailableTelecallers(telecallers || []);
    } catch (error) {
      console.error('Error loading telecallers:', error);
    } finally {
      setIsLoadingTelecallers(false);
    }
  }, [user?.tenantId, team?.id]);

  useEffect(() => {
    if (team && user?.tenantId) {
      setTeamName(team.name || '');
      setSelectedProduct(team.product_name || '');
      setTeamStatus(team.status || 'active');

      // Set assigned telecallers
      if (team.telecallers) {
        setAssignedTelecallers(team.telecallers);
        setSelectedTelecallerIds(team.telecallers.map(t => t.id));
      }

      // Load available telecallers
      loadAvailableTelecallers();
    }
  }, [team, user?.tenantId, loadAvailableTelecallers]);

  const handleAddTelecaller = (telecallerId: string) => {
    const telecaller = availableTelecallers.find(t => t.id === telecallerId);
    if (telecaller) {
      setAssignedTelecallers(prev => [...prev, telecaller]);
      setSelectedTelecallerIds(prev => [...prev, telecallerId]);
    }
  };

  const handleRemoveTelecaller = (telecallerId: string) => {
    setAssignedTelecallers(prev => prev.filter(t => t.id !== telecallerId));
    setSelectedTelecallerIds(prev => prev.filter(id => id !== telecallerId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim() || !selectedProduct) {
      showNotification(notificationHelpers.error(
        'Validation Error',
        'Please fill in all required fields'
      ));
      return;
    }

    if (!user?.tenantId || !team?.id) {
      showNotification(notificationHelpers.error(
        'Error',
        'Required information not found'
      ));
      return;
    }

    setIsLoading(true);

    try {
      // Update team basic info
      const { error: teamError } = await supabase
        .from('teams')
        .update({
          name: teamName.trim(),
          product_name: selectedProduct,
          status: teamStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id)
        .eq('tenant_id', user?.tenantId);

      if (teamError) throw teamError;

      // Update telecaller assignments
      // First, remove all current assignments for this team
      await supabase
        .from('employees')
        .update({ team_id: null })
        .eq('team_id', team.id);

      // Then assign new telecallers
      if (selectedTelecallerIds.length > 0) {
        const { error: assignError } = await supabase
          .from('employees')
          .update({ team_id: team.id })
          .in('id', selectedTelecallerIds);

        if (assignError) {
          console.error('Error assigning telecallers:', assignError);
          // Don't fail the whole operation if telecaller assignment fails
        }
      }

      showNotification(notificationHelpers.success(
        'Team Updated',
        'Team updated successfully!'
      ));
      onTeamUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating team:', error);
      showNotification(notificationHelpers.error(
        'Update Failed',
        'Failed to update team. Please try again.'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTeamName('');
    setSelectedProduct('');
    setTeamStatus('active');
    setAssignedTelecallers([]);
    setAvailableTelecallers([]);
    setSelectedTelecallerIds([]);
    onClose();
  };

  if (!team) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Team"
      size="lg"
      footer={
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm font-medium"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !teamName.trim() || !selectedProduct}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update Team'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Product</option>
              {products.map((product: string) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Status
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="active"
                checked={teamStatus === 'active'}
                onChange={(e) => setTeamStatus(e.target.value as 'active' | 'inactive')}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="inactive"
                checked={teamStatus === 'inactive'}
                onChange={(e) => setTeamStatus(e.target.value as 'active' | 'inactive')}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Inactive</span>
            </label>
          </div>
        </div>

        {/* Telecaller Management */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="text-sm font-semibold text-blue-800">Telecaller Management</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Currently Assigned Telecallers */}
            <div>
              <h5 className="text-sm font-medium text-blue-700 mb-2">
                Assigned Telecallers ({assignedTelecallers.length})
              </h5>
              {assignedTelecallers.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {assignedTelecallers.map((telecaller) => (
                    <div key={telecaller.id} className="flex items-center justify-between bg-white border border-blue-200 rounded p-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                          {telecaller.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{telecaller.name}</p>
                          <p className="text-xs text-gray-500">{telecaller.emp_id}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTelecaller(telecaller.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Remove from team"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No telecallers assigned</p>
              )}
            </div>

            {/* Available Telecallers */}
            <div>
              <h5 className="text-sm font-medium text-blue-700 mb-2">
                Available Telecallers ({availableTelecallers.filter(t => !selectedTelecallerIds.includes(t.id)).length})
              </h5>
              {isLoadingTelecallers ? (
                <div className="text-center text-sm text-gray-500">Loading telecallers...</div>
              ) : availableTelecallers.filter(t => !selectedTelecallerIds.includes(t.id)).length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableTelecallers
                    .filter(telecaller => !selectedTelecallerIds.includes(telecaller.id))
                    .map((telecaller) => (
                      <div key={telecaller.id} className="flex items-center justify-between bg-white border border-gray-200 rounded p-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                            {telecaller.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{telecaller.name}</p>
                            <p className="text-xs text-gray-500">{telecaller.emp_id}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddTelecaller(telecaller.id)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Add to team"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No available telecallers</p>
              )}
            </div>
          </div>
        </div>

        {/* Current Team Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Team Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Team In-charge:</span>
              <p className="text-gray-900">{team.team_incharge?.name || 'Not assigned'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Current Status:</span>
              <p className={`font-medium ${team.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                {team.status === 'active' ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Telecallers:</span>
              <p className="text-gray-900">{team.telecallers?.length || 0} assigned</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Total Cases:</span>
              <p className="text-gray-900">{team.total_cases || 0}</p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};