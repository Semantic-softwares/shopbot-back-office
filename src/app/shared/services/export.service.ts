import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StoreStore } from '../stores/store.store';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private storeStore = inject(StoreStore);
  
  exportToPdf(data: any[], filename: string = 'export', dateRange?: { from: string; to: string }) {
    const doc = new jsPDF();
    const storeName = this.storeStore.selectedStore()?.name || 'Store';
    const currencyCode = this.storeStore.selectedStore()?.currencyCode || 'NGN';
    const tableColumn = ["Receipt No", "Date", "Category", "Order Type", "Payment Type", "Ordered By", "Grand Total"];
    const tableRows: any[] = [];
    let grandTotal = 0;

    // Add store name and date range
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, doc.internal.pageSize.width / 2, 15, { align: 'center' });

    if (dateRange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateText = `Receipts from ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      doc.text(dateText, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    }

    data.forEach(item => {
      grandTotal += item.total || 0;
      const rowData = [
        item.receiptNo,
        this.formatDateTime(item.date),
        item.category,
        item.ordertype,
        item.type,
        item.orderedBy?.name || 'N/A',
        this.formatCurrency(item.total, currencyCode)
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      foot: [['', '', '', '', '', 'Grand Total', this.formatCurrency(grandTotal, currencyCode)]],
      startY: dateRange ? 35 : 25,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      footStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: 'bold'
      },
      didDrawPage: (data) => {
        // Add footer to each page
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text('Powered by Shopbot POS', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    doc.save(`${filename}-${new Date().toISOString()}.pdf`);
  }

  /** Readable date+time, e.g. "Aug 20, 2026, 02:30 PM" */
  public formatDateTime(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /** Currency-formatted amount with the store's currency code, e.g. "NGN 8,545.00" */
  private formatCurrency(value: number, currencyCode: string): string {
    const amount = value || 0;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch {
      return `${currencyCode} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
  }

  exportToCSV(data: any[], filename: string = 'export') {
    let csvData: string;
    
    switch (filename) {
      case 'sales-summary':
        csvData = this.convertSummaryDataToCSV(data);
        break;
      case 'payment-report':
        csvData = this.convertPaymentDataToCSV(data);
        break;
      case 'item-sales':
        csvData = this.convertItemDataToCSV(data);
        break;
      case 'revenue-report':
        csvData = this.convertRevenueDataToCSV(data);
        break;
      case 'guest-report':
        csvData = this.convertGuestDataToCSV(data);
        break;
      default:
        csvData = this.convertToCSV(data);
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToExcel(data: any[], filename: string = 'export') {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, `${filename}-${new Date().toISOString()}.xlsx`);
  }

  exportPaymentDataToPdf(data: any[], filename: string = 'payment-report', dateRange?: { from: string; to: string }) {
    const doc = new jsPDF();
    const storeName = this.storeStore.selectedStore()?.name || 'Store';
    const tableColumn = ["Payment Type", "Payment Transactions", "Payment Amount", "Refund Transactions", "Refund Amount", "Net Amount"];
    const tableRows: any[] = [];

    // Add store name and date range
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    if (dateRange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateText = `Payment Report from ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      doc.text(dateText, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    }

    data.forEach(item => {
      const rowData = [
        item.paymentType,
        item.paymentTransactions,
        item.paymentAmount,
        item.refundTransactions,
        item.refundAmount,
        item.netAmount
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: dateRange ? 35 : 25,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text('Powered by Shopbot POS', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    doc.save(`${filename}-${new Date().toISOString()}.pdf`);
  }

  exportSummaryToPdf(data: any[], filename: string = 'summary', dateRange?: { from: string; to: string }) {
    const doc = new jsPDF();
    const storeName = this.storeStore.selectedStore()?.name || 'Store';
    const tableColumn = [
      "Period",
      "Gross Sales",
      "Refunds",
      "Discounts",
      "Net Sales",
      "Cost of Goods",
      "Gross Profit",
      "Margin %",
      "Taxes"
    ];
    const tableRows: any[] = [];

    // Add store name and date range
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    if (dateRange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateText = `Sales Summary from ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      doc.text(dateText, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    }

    data.forEach(item => {
      const rowData = [
        item.period,
        item.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.refunds.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.discounts.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.costOfGoods.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        `${item.margin.toFixed(2)}%`,
        item.taxes.toLocaleString('en-US', { minimumFractionDigits: 2 })
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: dateRange ? 35 : 25,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text('Powered by Shopbot POS', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    doc.save(`${filename}-${new Date().toISOString()}.pdf`);
  }

  exportEmployeeDataToPdf(data: any[], filename: string = 'employee-sales', dateRange?: { from: string; to: string }) {
    const doc = new jsPDF();
    const storeName = this.storeStore.selectedStore()?.name || 'Store';
    const tableColumn = ["Name", "Gross Sales", "Refunds", "Discounts", "Net Sales", "Receipts", "Average Sale"];
    const tableRows: any[] = [];

    // Add store name and date range
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    if (dateRange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateText = `Employee Sales from ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      doc.text(dateText, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    }

    data.forEach(item => {
      const rowData = [
        item.name || 'Removed User',
        item.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.refunds.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.discounts.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.receipts,
        item.averageSale.toLocaleString('en-US', { minimumFractionDigits: 2 })
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: dateRange ? 35 : 25,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text('Powered by Shopbot POS', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    doc.save(`${filename}-${new Date().toISOString()}.pdf`);
  }

  exportCategoryDataToPdf(data: any[], filename: string = 'category-sales', dateRange?: { from: string; to: string }) {
    const doc = new jsPDF();
    const storeName = this.storeStore.selectedStore()?.name || 'Store';
    const tableColumn = ["Category", "Items Sold", "Net Sales", "Cost of Goods", "Gross Profit"];
    const tableRows: any[] = [];

    // Add store name and date range
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    if (dateRange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateText = `Category Sales from ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      doc.text(dateText, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    }

    data.forEach(item => {
      const rowData = [
        item.category,
        item.itemsSold,
        item.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.costOfGoods.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: dateRange ? 35 : 25,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text('Powered by Shopbot POS', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    doc.save(`${filename}-${new Date().toISOString()}.pdf`);
  }

  exportItemDataToPdf(data: any[], filename: string = 'item-sales', dateRange?: { from: string; to: string }) {
    const doc = new jsPDF();
    const storeName = this.storeStore.selectedStore()?.name || 'Store';
    const tableColumn = ["Product", "Quantity Sold", "Total Revenue", "Gross Sales", "Total Tax", "Net Sales"];
    const tableRows: any[] = [];

    // Add store name and date range
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    if (dateRange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateText = `Item Sales from ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      doc.text(dateText, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    }

    data.forEach(item => {
      const rowData = [
        item.name,
        item.totalQuantitySold,
        item.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: dateRange ? 35 : 25,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text('Powered by Shopbot POS', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    doc.save(`${filename}-${new Date().toISOString()}.pdf`);
  }

  exportRevenueDataToPdf(data: any[], filename: string = 'revenue-report', dateRange?: { from: string; to: string }) {
    const doc = new jsPDF();
    const storeName = this.storeStore.selectedStore()?.name || 'Store';
    const tableColumn = ["Date", "Total Revenue", "Room Revenue", "Service Revenue", "Other Revenue", "Transactions", "Avg Transaction"];
    const tableRows: any[] = [];

    // Add store name and date range
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    if (dateRange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateText = `Revenue Report from ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      doc.text(dateText, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    }

    data.forEach(item => {
      const rowData = [
        new Date(item.date).toLocaleDateString(),
        (item.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        (item.roomRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        (item.serviceRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        (item.otherRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        item.transactions || 0,
        (item.averageTransaction || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: dateRange ? 35 : 25,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text('Powered by Shopbot POS', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    doc.save(`${filename}-${new Date().toISOString()}.pdf`);
  }

  exportGuestDataToPdf(data: any[], filename: string = 'guest-report', dateRange?: { from: string; to: string }) {
    const doc = new jsPDF();
    const storeName = this.storeStore.selectedStore()?.name || 'Store';
    const tableColumn = ["Date", "Total Guests", "New Guests", "Returning Guests", "Check-ins", "Check-outs", "Avg Stay", "Occupancy"];
    const tableRows: any[] = [];

    // Add store name and date range
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    if (dateRange) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const dateText = `Guest Report from ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      doc.text(dateText, doc.internal.pageSize.width / 2, 25, { align: 'center' });
    }

    data.forEach(item => {
      const rowData = [
        new Date(item.date).toLocaleDateString(),
        (item.totalGuests || 0).toLocaleString(),
        (item.newGuests || 0).toLocaleString(),
        (item.returningGuests || 0).toLocaleString(),
        (item.checkIns || 0).toLocaleString(),
        (item.checkOuts || 0).toLocaleString(),
        `${(item.averageStayDuration || 0).toFixed(1)} days`,
        `${(item.occupancyRate || 0).toFixed(1)}%`
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: dateRange ? 35 : 25,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255
      },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text('Powered by Shopbot POS', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });

    doc.save(`${filename}-${new Date().toISOString()}.pdf`);
  }

  private convertToCSV(data: any[]): string {
    const headers = ["Receipt No", "Date", "Category", "Order Type", "Payment Type", "Ordered By", "Grand Total"];
    const rows = data.map(item => [
      item.receiptNo,
      this.formatDateTime(item.date),
      item.category,
      item.ordertype,
      item.type,
      item.orderedBy?.name || 'N/A',
      item.total || 0
    ]);
    const grandTotal = data.reduce((sum, item) => sum + (item.total || 0), 0);
    rows.push(['', '', '', '', '', 'Grand Total', grandTotal]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private convertPaymentDataToCSV(data: any[]): string {
    const headers = ["Payment Type", "Payment Transactions", "Payment Amount", "Refund Transactions", "Refund Amount", "Net Amount"];
    const rows = data.map(item => [
      item.paymentType,
      item.paymentTransactions,
      item.paymentAmount,
      item.refundTransactions,
      item.refundAmount,
      item.netAmount
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private convertSummaryDataToCSV(data: any[]): string {
    const headers = [
      "Period",
      "Gross Sales",
      "Refunds",
      "Discounts",
      "Net Sales",
      "Cost of Goods",
      "Gross Profit",
      "Margin %",
      "Taxes"
    ];
    const rows = data.map(item => [
      item.period,
      item.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.refunds.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.discounts.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.costOfGoods.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      `${item.margin.toFixed(2)}%`,
      item.taxes.toLocaleString('en-US', { minimumFractionDigits: 2 })
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private convertEmployeeDataToCSV(data: any[]): string {
    const headers = ["Name", "Gross Sales", "Refunds", "Discounts", "Net Sales", "Receipts", "Average Sale"];
    const rows = data.map(item => [
      item.name || 'Removed User',
      item.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.refunds.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.discounts.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.receipts,
      item.averageSale.toLocaleString('en-US', { minimumFractionDigits: 2 })
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private convertCategoryDataToCSV(data: any[]): string {
    const headers = ["Category", "Items Sold", "Net Sales", "Cost of Goods", "Gross Profit"];
    const rows = data.map(item => [
      item.category,
      item.itemsSold,
      item.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.costOfGoods.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private convertItemDataToCSV(data: any[]): string {
    const headers = ["Product", "Quantity Sold", "Total Revenue", "Gross Sales", "Total Tax", "Net Sales"];
    const rows = data.map(item => [
      item.name,
      item.totalQuantitySold,
      item.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private convertRevenueDataToCSV(data: any[]): string {
    const headers = ["Date", "Total Revenue", "Room Revenue", "Service Revenue", "Other Revenue", "Transactions", "Average Transaction"];
    const rows = data.map(item => [
      new Date(item.date).toLocaleDateString(),
      (item.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      (item.roomRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      (item.serviceRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      (item.otherRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.transactions || 0,
      (item.averageTransaction || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private convertGuestDataToCSV(data: any[]): string {
    const headers = ["Date", "Total Guests", "New Guests", "Returning Guests", "Check-ins", "Check-outs", "Average Stay Duration", "Occupancy Rate"];
    const rows = data.map(item => [
      new Date(item.date).toLocaleDateString(),
      (item.totalGuests || 0).toLocaleString(),
      (item.newGuests || 0).toLocaleString(),
      (item.returningGuests || 0).toLocaleString(),
      (item.checkIns || 0).toLocaleString(),
      (item.checkOuts || 0).toLocaleString(),
      `${(item.averageStayDuration || 0).toFixed(1)} days`,
      `${(item.occupancyRate || 0).toFixed(1)}%`
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}