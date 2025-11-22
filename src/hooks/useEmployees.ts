import { useState, useCallback } from 'react';
import { employeeService } from '../services/employeeService';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/employee';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const loadEmployees = useCallback(async (tenantId: string) => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      const data = await employeeService.getEmployees(tenantId, roleFilter);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter]);

  const createEmployee = useCallback(async (tenantId: string, createdBy: string, employeeData: CreateEmployeeRequest) => {
    try {
      setIsLoading(true);
      await employeeService.createEmployee(tenantId, createdBy, employeeData);
      await loadEmployees(tenantId);
      return true;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadEmployees]);

  const updateEmployee = useCallback(async (employeeId: string, updates: UpdateEmployeeRequest) => {
    try {
      setIsLoading(true);
      // Reload employees to get updated data
      const updatedEmployee = await employeeService.updateEmployee(employeeId, updates);
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? updatedEmployee : emp));
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteEmployee = useCallback(async (employeeId: string) => {
    try {
      setIsLoading(true);
      await employeeService.deleteEmployee(employeeId);
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkDeleteEmployees = useCallback(async (employeeIds: string[]) => {
    try {
      setIsLoading(true);
      const result = await employeeService.bulkDeleteEmployees(employeeIds);
      setEmployees(prev => prev.filter(emp => !employeeIds.includes(emp.id)));
      return result;
    } catch (error) {
      console.error('Error bulk deleting employees:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetEmployeePassword = useCallback(async (employeeId: string) => {
    try {
      setIsLoading(true);
      const newPassword = await employeeService.resetEmployeePassword(employeeId);
      return newPassword;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleEmployeeStatus = useCallback(async (employee: Employee) => {
    try {
      setIsLoading(true);
      await employeeService.toggleEmployeeStatus(employee.id, employee.status);
      setEmployees(prev => prev.map(emp =>
        emp.id === employee.id
          ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' }
          : emp
      ));
      return true;
    } catch (error) {
      console.error('Error toggling status:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);



  return {
    employees,
    isLoading,
    roleFilter,
    setRoleFilter,
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkDeleteEmployees,
    resetEmployeePassword,
    toggleEmployeeStatus,
  };
};