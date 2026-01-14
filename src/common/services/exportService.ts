import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExportService {
    async generateExcel(name: string, data: any[], headers: { header: string; key: string; width?: number }[]) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(name);

        sheet.columns = headers;

        // Add Data
        sheet.addRows(data);

        // Style the Header Row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4F81BD' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        return await workbook.xlsx.writeBuffer();
    }
}


// const data = await queryRunner.query(exportQuery, params);

// // Create Excel workbook
// const workbook = new ExcelJS.Workbook();

// // Helper to add a sheet from data
// const addSheet = (name: string, data: any[], headers: any[]) => {
//     const ws = workbook.addWorksheet(name);

//     if (data.length > 0) {
//         ws.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
//         ws.addRows(data);
//     }

//     ws.columns = headers.map(header => ({
//         header,
//         key: header,
//         width: 20
//     }));

//     ws.getRow(1).font = {
//         bold: true,
//         color: { argb: 'FFFFFF' }
//     };

//     ws.getRow(1).fill = {
//         type: 'pattern',
//         pattern: 'solid',
//         fgColor: { argb: '4F81BD' }
//     };

//     ws.getRow(1).alignment = {
//         vertical: 'middle',
//         horizontal: 'center'
//     };
// };

// // Add the pricing data
// addSheet('PRICING', data, [
//     'Visit Date', 'Client', 'Country', 'Region', 'City', 'Chain',
//     'Channel', 'Trade Type', 'Store Type', 'Store Class', 'Store',
//     'Principal', 'SKU Group', 'Category', 'Subcategory', 'Brand',
//     'SKU Name', 'SKU Code', 'SKU Image', 'RSP', 'Shelf Price', 'Promo Price'
// ]);

// // Set response headers
// res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
// res.setHeader('Content-Disposition', 'attachment; filename=pricing_export.xlsx');

// // Return as buffer
// const buffer = await workbook.xlsx.writeBuffer();
// res.send(buffer);

//       } finally {
//     await queryRunner.release();
// }

//     } catch (error) {
//     res.status(500).json({
//         success: false,
//         error: error.message,
//         timestamp: new Date().toISOString()
//     });
// }
//   }
// } 
