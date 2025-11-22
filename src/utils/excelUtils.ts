import * as XLSX from 'xlsx';
import { ColumnConfiguration } from '../services/columnConfigService';

export interface ExcelRow {
  [key: string]: string | number | boolean | null | undefined;
}

export const excelUtils = {
  generateTemplate(columns: ColumnConfiguration[]): void {
    // Debug: Log all columns received
    console.log('🔍 excelUtils.generateTemplate - Received columns:', columns);
    console.log('🔍 Column names found:', columns.map(c => c.column_name));
    console.log('🔍 Column display names:', columns.map(c => c.display_name));
    console.log('🔍 Active columns:', columns.filter(c => c.is_active).map(c => c.column_name));

    // Validate that we have required columns
    const hasCustomerName = columns.some(col => col.column_name === 'customerName');
    const hasLoanId = columns.some(col => col.column_name === 'loanId');

    console.log('🔍 hasCustomerName:', hasCustomerName, 'hasLoanId:', hasLoanId);

    if (!hasCustomerName || !hasLoanId) {
      console.error('❌ Required columns missing. Available columns:', columns.map(c => `${c.column_name} (${c.is_active ? 'active' : 'inactive'})`));
      throw new Error('Template generation failed: Required columns (Customer Name, Loan ID) are missing from configuration');
    }

    console.log('✅ Required columns found, generating template with columns:', columns.map(c => `${c.column_name} -> ${c.display_name}`));

    const headers = ['EMPID', ...columns.map(col => col.display_name)];

    const sampleData = [
      [
        'EMP001',
        ...columns.map(col => {
          switch (col.column_name) {
            case 'customerName': return 'Rajesh Kumar';
            case 'loanId': return 'LN001234567';
            case 'loanAmount': return '500000';
            case 'mobileNo': return '9876543210';
            case 'dpd': return '45';
            case 'outstandingAmount': return '450000';
            case 'posAmount': return '50000';
            case 'emiAmount': return '15000';
            case 'pendingDues': return '75000';
            case 'address': return '123 MG Road, Sector 15, Gurgaon';
            case 'sanctionDate': return '2023-01-15';
            case 'lastPaidAmount': return '15000';
            case 'lastPaidDate': return '2024-11-15';
            case 'paymentLink': return 'https://pay.company.com/LN001234567';
            case 'branchName': return 'Gurgaon Branch';
            case 'loanType': return 'Personal Loan';
            case 'remarks': return 'Cooperative customer';
            default: return 'n/a'; // Default value for unknown columns
          }
        })
      ],
      [
        'EMP002',
        ...columns.map(col => {
          switch (col.column_name) {
            case 'customerName': return 'Sunita Sharma';
            case 'loanId': return 'LN002345678';
            case 'loanAmount': return '350000';
            case 'mobileNo': return '9876543220';
            case 'dpd': return '30';
            case 'outstandingAmount': return '195000';
            case 'posAmount': return '155000';
            case 'emiAmount': return '12000';
            case 'pendingDues': return '36000';
            case 'address': return '456 Park Street, Mumbai';
            case 'sanctionDate': return '2023-09-20';
            case 'lastPaidAmount': return '12000';
            case 'lastPaidDate': return '2024-02-10';
            case 'paymentLink': return 'https://pay.company.com/LN002345678';
            case 'branchName': return 'Mumbai Branch';
            case 'loanType': return 'Home Loan';
            case 'remarks': return 'Needs follow-up';
            default: return 'n/a'; // Default value for unknown columns
          }
        })
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    const colWidths = headers.map(header => ({
      wch: Math.max(header.length + 2, 15)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cases Template');

    XLSX.writeFile(wb, 'case_upload_template.xlsx');
  },

  async parseExcelFile(file: File, columns: ColumnConfiguration[]): Promise<ExcelRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

          if (jsonData.length < 2) {
            reject(new Error('Excel file is empty or has no data rows'));
            return;
          }

          const headers = jsonData[0];
          const rows = jsonData.slice(1);

          console.log('Excel headers found:', headers);
          console.log('Expected column display names:', columns.map(c => c.display_name));

          const empIdIndex = headers.findIndex((h: unknown) =>
            String(h || '').toLowerCase().trim() === 'empid'
          );

          if (empIdIndex === -1) {
            reject(new Error('EMPID column not found in Excel file. Please ensure the first column is named "EMPID" (case insensitive).'));
            return;
          }

          // Check for column mapping issues
          const mappedColumns: string[] = [];
          const unmappedHeaders: string[] = [];

          headers.forEach((header: unknown, index: number) => {
            if (index !== empIdIndex && header) {
              const headerStr = String(header);
              const columnConfig = columns.find(col =>
                col.display_name.toLowerCase().trim() === header.toString().toLowerCase().trim()
              );

              if (columnConfig) {
                mappedColumns.push(`${headerStr} -> ${columnConfig.column_name}`);
              } else {
                unmappedHeaders.push(headerStr);
              }
            }
          });

          console.log('Successfully mapped columns:', mappedColumns);
          if (unmappedHeaders.length > 0) {
            console.warn('Unmapped headers (will be ignored):', unmappedHeaders);
          }

          if (mappedColumns.length === 0) {
            reject(new Error('No columns in the Excel file match your product\'s column configuration. Please download a fresh template for this product.'));
            return;
          }

          const parsedRows: ExcelRow[] = rows
            .filter(row => row && row.length > 0 && row[empIdIndex])
            .map(row => {
              const rowData: ExcelRow = {
                EMPID: row[empIdIndex]?.toString().trim()
              };

              headers.forEach((header: unknown, index: number) => {
                if (index !== empIdIndex && header) {
                  const headerStr = String(header);
                  const columnConfig = columns.find(col =>
                    col.display_name.toLowerCase().trim() === headerStr.toLowerCase().trim()
                  );

                  if (columnConfig) {
                    const value = row[index];
                    rowData[columnConfig.column_name] = value !== undefined && value !== null ? value.toString().trim() : '';
                  }
                }
              });

              return rowData;
            });

          console.log(`Parsed ${parsedRows.length} valid rows from Excel file`);
          resolve(parsedRows);
        } catch (error) {
          reject(new Error('Failed to parse Excel file: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  },

  async validateExcelHeaders(file: File, columns: ColumnConfiguration[]): Promise<{ valid: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

          if (jsonData.length < 1) {
            resolve({ valid: false, message: 'Excel file appears to be empty' });
            return;
          }

          const headers = jsonData[0];
          console.log('Validating Excel headers:', headers);

          const empIdIndex = headers.findIndex((h: unknown) =>
            String(h || '').toLowerCase().trim() === 'empid'
          );

          if (empIdIndex === -1) {
            resolve({
              valid: false,
              message: 'EMPID column not found. The first column must be named "EMPID" (case insensitive).'
            });
            return;
          }

          // Check how many columns can be mapped
          let mappedCount = 0;
          const unmappedHeaders: string[] = [];

          headers.forEach((header: unknown, index: number) => {
            if (index !== empIdIndex && header) {
              const headerStr = String(header);
              const columnConfig = columns.find(col =>
                col.display_name.toLowerCase().trim() === headerStr.toLowerCase().trim()
              );

              if (columnConfig) {
                mappedCount++;
              } else {
                unmappedHeaders.push(headerStr);
              }
            }
          });

          if (mappedCount === 0) {
            resolve({
              valid: false,
              message: `No columns in your Excel file match the configured columns for this product. Expected columns: ${columns.map(c => c.display_name).join(', ')}. Found headers: ${headers.join(', ')}. Please download a fresh template.`
            });
            return;
          }

          if (unmappedHeaders.length > 0) {
            console.warn('Some headers will be ignored:', unmappedHeaders);
          }

          resolve({
            valid: true,
            message: `Headers validated successfully. ${mappedCount} columns matched, ${unmappedHeaders.length} headers will be ignored.`
          });

        } catch (error) {
          resolve({
            valid: false,
            message: 'Failed to read Excel file: ' + (error as Error).message
          });
        }
      };

      reader.onerror = () => {
        resolve({
          valid: false,
          message: 'Failed to read the Excel file'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  },

  validateCaseData(row: ExcelRow, columns: ColumnConfiguration[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!row.EMPID || String(row.EMPID).trim() === '') {
      errors.push('EMPID is required');
    }

    const requiredColumns = ['customerName', 'loanId'];
    requiredColumns.forEach(colName => {
      const value = row[colName];
      if (!value || String(value).trim() === '' || String(value).trim().toLowerCase() === 'n/a') {
        const displayName = columns.find(c => c.column_name === colName)?.display_name || colName;
        errors.push(`${displayName} is required and cannot be empty or 'n/a'`);
      }
    });

    if (row.mobileNo) {
      const mobileStr = String(row.mobileNo).replace(/\D/g, '');
      if (mobileStr && mobileStr !== '' && !/^\d{10}$/.test(mobileStr)) {
        errors.push('Mobile number must be 10 digits');
      }
    }

    if (row.dpd) {
      const dpdStr = String(row.dpd).trim();
      if (dpdStr && dpdStr !== '' && (isNaN(parseInt(dpdStr)) || parseInt(dpdStr) < 0)) {
        errors.push('DPD must be a non-negative number');
      }
    }

    const numericFields = ['loanAmount', 'outstandingAmount', 'posAmount', 'emiAmount', 'pendingDues', 'lastPaidAmount'];
    numericFields.forEach(field => {
      if (row[field]) {
        const valueStr = String(row[field]).trim().replace(/,/g, '');
        if (valueStr && valueStr !== '' && valueStr.toLowerCase() !== 'n/a' && isNaN(parseFloat(valueStr))) {
          const displayName = columns.find(c => c.column_name === field)?.display_name || field;
          errors.push(`${displayName} must be a valid number`);
        }
      }
    });

    const dateFields = ['sanctionDate', 'lastPaidDate'];
    dateFields.forEach(field => {
      if (row[field]) {
        const dateStr = String(row[field]).trim();
        if (dateStr && dateStr !== '' && dateStr.toLowerCase() !== 'n/a') {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            const displayName = columns.find(c => c.column_name === field)?.display_name || field;
            errors.push(`${displayName} must be a valid date`);
          }
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  },

  async comprehensiveValidation(
    rows: ExcelRow[],
    columns: ColumnConfiguration[]
  ): Promise<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: Array<{ row: number; column: string; value: string; error: string }>;
    duplicateLoanIds: Array<{ loanId: string; rows: number[] }>;
    warnings: Array<{ row: number; column: string; message: string }>;
  }> {
    const errors: Array<{ row: number; column: string; value: string; error: string }> = [];
    const warnings: Array<{ row: number; column: string; message: string }> = [];
    const loanIdMap = new Map<string, number[]>();
    let validRowCount = 0;

    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowValidation = this.validateCaseData(row, columns);

      if (!rowValidation.valid) {
        rowValidation.errors.forEach(error => {
          let column = 'Unknown';
          let value = '';

          if (error.includes('EMPID')) {
            column = 'EMPID';
            value = String(row.EMPID || '');
          } else if (error.includes('Customer Name') || error.includes('customerName')) {
            column = 'Customer Name';
            value = String(row.customerName || '');
          } else if (error.includes('Loan ID') || error.includes('loanId')) {
            column = 'Loan ID';
            value = String(row.loanId || '');
          } else if (error.includes('Mobile')) {
            column = 'Mobile Number';
            value = String(row.mobileNo || '');
          } else if (error.includes('DPD')) {
            column = 'DPD';
            value = String(row.dpd || '');
          } else {
            const fieldMatch = error.match(/^([^:]+)/);
            if (fieldMatch) {
              column = fieldMatch[1];
            }
          }

          errors.push({
            row: rowNumber,
            column,
            value,
            error
          });
        });
      } else {
        validRowCount++;
      }

      const loanId = String(row.loanId || '').trim();
      if (loanId && loanId.toLowerCase() !== 'n/a') {
        if (!loanIdMap.has(loanId)) {
          loanIdMap.set(loanId, []);
        }
        loanIdMap.get(loanId)!.push(rowNumber);
      }

      if (!row.mobileNo || String(row.mobileNo).trim() === '' || String(row.mobileNo).trim().toLowerCase() === 'n/a') {
        warnings.push({
          row: rowNumber,
          column: 'Mobile Number',
          message: 'Mobile number is missing or empty'
        });
      }

      if (!row.address || String(row.address).trim() === '' || String(row.address).trim().toLowerCase() === 'n/a') {
        warnings.push({
          row: rowNumber,
          column: 'Address',
          message: 'Address is missing or empty'
        });
      }
    });

    const duplicateLoanIds: Array<{ loanId: string; rows: number[] }> = [];
    loanIdMap.forEach((rows, loanId) => {
      if (rows.length > 1) {
        duplicateLoanIds.push({ loanId, rows });
      }
    });

    return {
      totalRows: rows.length,
      validRows: validRowCount,
      invalidRows: rows.length - validRowCount,
      errors,
      duplicateLoanIds,
      warnings
    };
  },

  exportCasesToExcel(cases: Record<string, unknown>[], columns: ColumnConfiguration[]): void {
    const headers = columns.map(col => col.display_name);

    const rows = cases.map(case_ =>
      columns.map(col => {
        const value = case_[col.column_name];
        return value !== undefined && value !== null ? value : '';
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    const colWidths = headers.map(header => ({
      wch: Math.max(header.length + 2, 15)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Cases');

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `customer_cases_${timestamp}.xlsx`);
  }
};
