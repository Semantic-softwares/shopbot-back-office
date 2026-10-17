import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ExportColumnType = 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'status' | 'boolean';

export interface ExportColumn {
  key: string;
  label: string;
  type: ExportColumnType;
}

export interface ExportRequest {
  title: string;
  storeName: string;
  currency?: string;
  /** The period or filters, shown under the title and on the info sheet. */
  subtitle?: string;
  info?: Array<[string, string]>;
  columns: ExportColumn[];
  rows: Array<Record<string, any>>;
  filename: string;
  landscape?: boolean;
  /** Turns a status code into words in the user's language. */
  statusLabel?: (value: unknown) => string;
  yes?: string;
  no?: string;
}

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

const safe = (name: string) => name.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

/**
 * One exporter for every report, driven by the column list. Excel keeps real numbers and dates (so sums and filters
 * work), CSV opens correctly in Excel with accents, PDF is laid out for paper.
 */
@Injectable({ providedIn: 'root' })
export class ReportExportService {
  /** Builds the file and downloads it; returns the PDF blob when asked to print instead. */
  export(format: ExportFormat, req: ExportRequest): void {
    const name = safe(req.filename);
    if (format === 'xlsx') return this.save(this.excel(req), `${name}.xlsx`);
    if (format === 'csv') return this.save(new Blob(['﻿' + this.csv(req)], { type: 'text/csv;charset=utf-8' }), `${name}.csv`);
    this.save(this.pdf(req).output('blob'), `${name}.pdf`);
  }

  /** Opens the PDF in a new tab, where the browser's own print button takes over. */
  print(req: ExportRequest): void {
    const url = URL.createObjectURL(this.pdf(req).output('blob'));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  private save(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** A value as text, the way a person reads it. */
  private text(col: ExportColumn, value: any, req: ExportRequest): string {
    if (value === null || value === undefined || value === '') return '';
    switch (col.type) {
      case 'boolean': return value ? (req.yes ?? 'Yes') : (req.no ?? 'No');
      case 'status': return req.statusLabel ? req.statusLabel(value) : String(value);
      case 'currency': return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'datetime': return String(value).replace('T', ' ').slice(0, 16);
      default: return String(value);
    }
  }

  private toDate(value: any): Date | null {
    if (!value) return null;
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? value + 'T00:00:00Z' : value);
    return isNaN(d.getTime()) ? null : d;
  }

  private excel(req: ExportRequest): Blob {
    const header = req.columns.map((c) => c.label);
    const body = req.rows.map((row) => req.columns.map((c) => {
      const v = row[c.key];
      if (v === null || v === undefined || v === '') return '';
      if ((c.type === 'number' || c.type === 'currency') && typeof v === 'number') return v;
      if (c.type === 'date' || c.type === 'datetime') return this.toDate(v) ?? String(v);
      return this.text(c, v, req);
    }));
    const ws = XLSX.utils.aoa_to_sheet([header, ...body], { cellDates: true });

    // Real formats, so Excel can sum, sort and filter: money with two decimals, dates as dates.
    req.columns.forEach((c, ci) => {
      for (let r = 0; r < body.length; r++) {
        const cell = ws[XLSX.utils.encode_cell({ r: r + 1, c: ci })];
        if (!cell) continue;
        if (c.type === 'currency') cell.z = '#,##0.00';
        else if (c.type === 'date') cell.z = 'yyyy-mm-dd';
        else if (c.type === 'datetime') cell.z = 'yyyy-mm-dd hh:mm';
      }
    });
    ws['!cols'] = req.columns.map((c, ci) => ({ wch: Math.min(48, Math.max(c.label.length, ...body.slice(0, 500).map((r) => String(r[ci] instanceof Date ? 'yyyy-mm-dd hh:mm' : r[ci]).length)) + 2) }));
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(body.length, 1), c: req.columns.length - 1 } }) };

    const info = XLSX.utils.aoa_to_sheet([
      [req.title], [req.storeName], ...(req.subtitle ? [[req.subtitle]] : []), [], ...(req.info ?? []).map(([k, v]) => [k, v]),
      [], ['Generated', new Date().toISOString().slice(0, 16).replace('T', ' ')], ['Rows', req.rows.length], ...(req.currency ? [['Currency', req.currency]] : []),
    ]);
    info['!cols'] = [{ wch: 24 }, { wch: 40 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, safe(req.title).slice(0, 28) || 'Report');
    XLSX.utils.book_append_sheet(wb, info, 'Info');
    const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellDates: true });
    return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private csv(req: ExportRequest): string {
    const cell = (s: string) => (/[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const raw = (c: ExportColumn, v: any) => (c.type === 'currency' && typeof v === 'number' ? v.toFixed(2) : this.text(c, v, req));
    return [req.columns.map((c) => cell(c.label)).join(','), ...req.rows.map((row) => req.columns.map((c) => cell(raw(c, row[c.key]))).join(','))].join('\r\n');
  }

  private pdf(req: ExportRequest): jsPDF {
    const doc = new jsPDF({ orientation: req.landscape === false ? 'portrait' : 'landscape', unit: 'pt', format: 'a4' });
    const width = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold').setFontSize(15).text(req.storeName, 36, 40);
    doc.setFont('helvetica', 'normal').setFontSize(12).text(req.title, 36, 58);
    if (req.subtitle) doc.setFontSize(9).setTextColor(100).text(req.subtitle, 36, 72).setTextColor(0);
    doc.setFontSize(8).setTextColor(120).text(`${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${req.rows.length}`, width - 36, 40, { align: 'right' }).setTextColor(0);

    autoTable(doc, {
      startY: req.subtitle ? 82 : 70,
      head: [req.columns.map((c) => c.label)],
      body: req.rows.map((row) => req.columns.map((c) => this.text(c, row[c.key], req))),
      styles: { fontSize: 7.5, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [55, 48, 163], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 247, 252] },
      columnStyles: Object.fromEntries(req.columns.map((c, i) => [i, c.type === 'currency' || c.type === 'number' ? { halign: 'right' as const } : {}])),
      margin: { left: 36, right: 36, bottom: 36 },
      didDrawPage: () => {
        const page = doc.getNumberOfPages();
        doc.setFontSize(8).setTextColor(120).text(`${page}`, width / 2, doc.internal.pageSize.getHeight() - 16, { align: 'center' }).setTextColor(0);
      },
    });
    return doc;
  }
}
