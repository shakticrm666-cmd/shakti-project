import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { TeamService } from '../../services/teamService';
import { useAuth } from '../../contexts/AuthContext';
import { useTeams } from '../../hooks/useTeams';
import { useProducts } from '../../hooks/useProducts';
import type { Telecaller } from '../../types';
import { useNotification, notificationHelpers } from '../shared/Notification';

interface CreateTeamProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated?: () => void;
}

export const CreateTeam: React.FC<CreateTeamProps> = ({ isOpen, onClose, onTeamCreated }) => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { createTeam } = useTeams(user?.tenantId);
  const { products, isLoading: productsLoading } = useProducts(user?.tenantId);
  const [teamName, setTeamName] = useState('');
  const [selectedTelecallers, setSelectedTelecallers] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [telecallers, setTelecallers] = useState<Telecaller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAvailableTelecallers = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setIsLoading(true);
      const telecallerList = await TeamService.getAvailableTelecallers(user?.tenantId);
      setTelecallers(telecallerList);
    } catch (error) {
      console.error('Error loading telecallers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableTelecallers();
    }
  }, [isOpen, loadAvailableTelecallers]);

  const handleTelecallerToggle = (telecallerId: string) => {
    setSelectedTelecallers(prev =>
      prev.includes(telecallerId)
        ? prev.filter(id => id !== telecallerId)
        : [...prev, telecallerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submission data:', {
      teamName: teamName.trim(),
      selectedColumn: selectedColumn,
      tenantId: user?.tenantId,
      userId: user?.id,
      selectedTelecallers: selectedTelecallers
    });

    if (!teamName.trim() || !selectedColumn) {
      showNotification(notificationHelpers.error(
        'Validation Error',
        'Please fill in all required fields'
      ));
      return;
    }

    if (!user?.tenantId || !user?.id) {
      showNotification(notificationHelpers.error(
        'Error',
        'User or tenant information not found'
      ));
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Calling createTeam with:', {
        name: teamName.trim(),
        team_incharge_id: user.id,
        selectedTelecallers: selectedTelecallers,
        selectedColumn: selectedColumn
      });

      const success = await createTeam({
        name: teamName.trim(),
        team_incharge_id: user.id,
        selectedTelecallers: selectedTelecallers,
        selectedColumn: selectedColumn
      });

      if (success) {
        // Reset form
        setTeamName('');
        setSelectedTelecallers([]);
        setSelectedColumn('');

        // Reload telecallers to get updated list
        loadAvailableTelecallers();

        // Call the onTeamCreated callback if provided
        onTeamCreated?.();

        showNotification(notificationHelpers.success(
          'Team Created',
          'Team created successfully!'
        ));
        onClose();
      }
    } catch (error) {
      console.error('Error creating team:', error);
      showNotification(notificationHelpers.error(
        'Failed to Create Team',
        error instanceof Error ? error.message : 'Unknown error'
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTeamName('');
    setSelectedTelecallers([]);
    setSelectedColumn('');
    setTelecallers([]);
    onClose();
  };

  const selectedTelecallersInfo = telecallers.filter(t => selectedTelecallers.includes(t.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Team"
      size="md"
      footer={
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-xs font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !teamName.trim() || !selectedColumn}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Team Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
            required
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Team In-charge (Auto-selected) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Team In-charge
          </label>
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-full p-1 mr-2">
                <Users className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">{user?.name || 'Current User'}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'TeamIncharge' ? 'Team Incharge' :
                    user?.role === 'CompanyAdmin' ? 'Company Admin' :
                      user?.role === 'SuperAdmin' ? 'Super Admin' :
                        user?.role}
                </p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Auto-assigned as team in-charge
            </p>
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            required
            disabled={productsLoading}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {productsLoading ? 'Loading products...' : products.length === 0 ? 'No products available' : 'Select Product'}
            </option>
            {products.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
          {products.length === 0 && !productsLoading && (
            <p className="text-xs text-orange-600 mt-1">
              No products found. Please add products in Product Management first.
            </p>
          )}
        </div>

        {/* Telecaller Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Assign Telecallers ({selectedTelecallers.length} selected)
          </label>
          <div className="border border-gray-300 rounded max-h-32 overflow-y-auto">
            {isLoading ? (
              <div className="p-2 text-center text-gray-500 text-xs">Loading telecallers...</div>
            ) : telecallers.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 p-2">
                {telecallers.map((telecaller) => (
                  <div key={telecaller.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      id={`telecaller-${telecaller.id}`}
                      checked={selectedTelecallers.includes(telecaller.id)}
                      onChange={() => handleTelecallerToggle(telecaller.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <label
                      htmlFor={`telecaller-${telecaller.id}`}
                      className="ml-2 text-xs cursor-pointer flex-1"
                    >
                      <div className="text-gray-900 font-medium truncate">
                        {telecaller.name}
                      </div>
                      <div className="text-gray-500">
                        {telecaller.emp_id}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 text-center text-gray-500 text-xs">
                No available telecallers found
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {(user?.name || selectedTelecallersInfo.length > 0 || selectedColumn) && (
          <div className="bg-gray-50 rounded p-2">
            <h4 className="text-xs font-semibold text-gray-900 flex items-center mb-2">
              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
              Team Preview
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {user?.name && (
                <div className="bg-blue-50 rounded p-2">
                  <h5 className="font-medium text-gray-900 text-xs mb-1">Team In-charge</h5>
                  <div className="text-xs text-gray-700">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-gray-600 text-xs">
                      {user.role === 'TeamIncharge' ? 'Team Incharge' :
                        user.role === 'CompanyAdmin' ? 'Company Admin' :
                          user.role === 'SuperAdmin' ? 'Super Admin' :
                            user.role}
                    </p>
                  </div>
                </div>
              )}

              {selectedColumn && (
                <div className="bg-purple-50 rounded p-2">
                  <h5 className="font-medium text-gray-900 text-xs mb-1">Product</h5>
                  <p className="text-xs text-gray-700 font-medium truncate">{selectedColumn}</p>
                </div>
              )}
            </div>

            {selectedTelecallersInfo.length > 0 && (
              <div className="bg-green-50 rounded p-2">
                <h5 className="font-medium text-gray-900 text-xs mb-1">
                  Assigned Telecallers ({selectedTelecallersInfo.length})
                </h5>
                <div className="grid grid-cols-2 gap-1">
                  {selectedTelecallersInfo.map((telecaller) => (
                    <div key={telecaller.id} className="bg-white rounded p-1 border">
                      <p className="font-medium text-gray-900 text-xs truncate">{telecaller.name}</p>
                      <p className="text-gray-600 text-xs">{telecaller.emp_id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};