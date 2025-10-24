import ExcelJS from 'exceljs';

export interface ExcelData {
  [key: string]: any;
}

export class ExcelUtils {
  /**
   * Read Excel file and convert to JSON
   */
  static async readExcelFile(file: File): Promise<ExcelData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('No data found in file'));
            return;
          }

          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data as ArrayBuffer);
          
          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            reject(new Error('No worksheet found'));
            return;
          }

          const jsonData: ExcelData[] = [];
          const headers: string[] = [];
          
          // Get headers from first row
          const firstRow = worksheet.getRow(1);
          firstRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || '';
          });

          // Convert rows to JSON
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row
            
            const rowData: ExcelData = {};
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber - 1];
              if (header) {
                rowData[header] = cell.value;
              }
            });
            
            if (Object.keys(rowData).length > 0) {
              jsonData.push(rowData);
            }
          });

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Convert JSON data to Excel and download
   */
  static async exportToExcel(data: ExcelData[], filename: string = 'export.xlsx'): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      if (data.length === 0) {
        throw new Error('No data to export');
      }

      // Get headers from first row
      const headers = Object.keys(data[0]);
      
      // Add headers
      worksheet.addRow(headers);
      
      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };

      // Add data rows
      data.forEach(row => {
        const values = headers.map(header => row[header] || '');
        worksheet.addRow(values);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to export Excel: ${error}`);
    }
  }

  /**
   * Validate Excel data structure
   */
  static validateExcelData(data: ExcelData[], requiredFields: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push('No data found in file');
      return { isValid: false, errors };
    }

    // Check if all required fields are present
    const firstRow = data[0];
    const missingFields = requiredFields.filter(field => !(field in firstRow));
    
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check for empty rows
    const emptyRows = data.filter(row => Object.values(row).every(value => !value || value.toString().trim() === ''));
    if (emptyRows.length > 0) {
      errors.push(`Found ${emptyRows.length} empty rows`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
