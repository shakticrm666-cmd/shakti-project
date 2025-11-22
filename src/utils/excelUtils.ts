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
      if (!row[colName] || String(row[colName]).trim() === '') {
        const displayName = columns.find(c => c.column_name === colName)?.display_name || colName;
        errors.push(`${displayName} is required`);
      }
    });

    if (row.mobileNo && !/^\d{10}$/.test(String(row.mobileNo).replace(/\D/g, ''))) {
      errors.push('Invalid mobile number format');
    }

    if (row.dpd && isNaN(parseInt(String(row.dpd)))) {
      errors.push('DPD must be a number');
    }

    return {
      valid: errors.length === 0,
      errors
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
