import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrintJob, PrintJobStats } from '../models/print-job.model';
import { StoreStore } from '../stores/store.store';
import { NetworkPrinterService } from './network-printer.service';

@Injectable({
  providedIn: 'root',
})
export class PrintJobService {
  private http = inject(HttpClient);
  private storeStore = inject(StoreStore);
  private networkPrinterService = inject(NetworkPrinterService);
  private apiUrl = `${environment.apiUrl}/print-jobs`;

  // ESC/POS Commands
  private readonly COMMANDS = {
    INIT: '\x1B\x40',
    ALIGN_CENTER: '\x1B\x61\x01',
    ALIGN_LEFT: '\x1B\x61\x00',
    TEXT_DOUBLE_SIZE: '\x1B\x21\x30',
    TEXT_NORMAL: '\x1B\x21\x00',
    BOLD_ON: '\x1B\x45\x01',
    BOLD_OFF: '\x1B\x45\x00',
    FEED_LINE: '\x0A',
    CUT_PAPER: '\x1D\x56\x00',
  };

  getPrintJobs(storeId: string, filters?: {
    status?: string;
    stationId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Observable<PrintJob[]> {
    const params: any = { 
      store: storeId, 
      populate: 'order,station',  // Request populated order and station data
      ...filters 
    };
    return this.http.get<PrintJob[]>(this.apiUrl, { params });
  }

  getPrintJobById(id: string): Observable<PrintJob> {
    return this.http.get<PrintJob>(`${this.apiUrl}/${id}`);
  }

  getPrintJobStats(storeId: string): Observable<PrintJobStats> {
    return this.http.get<PrintJobStats>(`${this.apiUrl}/stats`, { params: { store: storeId } });
  }

  retryPrintJob(id: string): Observable<PrintJob> {
    return this.http.post<PrintJob>(`${this.apiUrl}/${id}/retry`, {});
  }

  cancelPrintJob(id: string): Observable<PrintJob> {
    return this.http.post<PrintJob>(`${this.apiUrl}/${id}/cancel`, {});
  }

  createPrintJobsForOrder(orderData: any): Observable<{ success: boolean; jobs: PrintJob[] }> {
    return this.http.post<{ success: boolean; jobs: PrintJob[] }>(`${this.apiUrl}/create-for-order`, {
      orderData
    });
  }

  /**
   * Print an order by sending it to the backend to create print jobs.
   * The backend fetches the full order, groups items by station, generates
   * ESC/POS receipts, and creates print jobs for each printer.
   * The Electron print-service app polls and prints them automatically.
   *
   * @param orderId - The MongoDB order ID
   * @returns Observable with the created print jobs
   */
  printOrder(orderId: string): Observable<{ success: boolean; jobs: PrintJob[]; message: string }> {
    return this.http.post<{ success: boolean; jobs: PrintJob[]; message: string }>(
      `${this.apiUrl}/print-order`,
      { orderId },
    );
  }

  /**
   * Generate ESC/POS receipt data from order
   * @param order - The order object containing all order details
   * @param paperWidth - Paper width in mm (58 or 80). Defaults to 80 if not specified
   * @returns ESC/POS formatted receipt string
   */
  public generateOrderReceipt(order: any, paperWidth: number = 80): string {
    console.log('=== GENERATE RECEIPT ===');
    console.log('Order ID:', order._id);
    console.log('Order Reference:', order.reference);
    console.log('Order cart products:', order.cart?.products?.length || 0);
    console.log('Paper Width:', paperWidth, 'mm');
    
    if (!order) {
      console.error('❌ No order provided');
      return this.COMMANDS.INIT + 'ERROR: No order data\n' + this.COMMANDS.CUT_PAPER;
    }

    // Get POS receipt settings from store
    const receiptSettings = this.storeStore.selectedStore()?.posSettings?.receiptSettings;
    const showNote = receiptSettings?.showNote ?? false;
    const showTax = receiptSettings?.showTax ?? true;
    const showStoreDetails = receiptSettings?.showStoreDetails ?? true;
    const showSellerInfo = receiptSettings?.showSellerInfo ?? true;
    const showCustomerName = receiptSettings?.showCustomerName ?? true;
    const footerMessage = receiptSettings?.footerMessage || 'Thank you for your patronage';
    const disclaimer = receiptSettings?.disclaimer || '';

    // Generate receipt
    let receipt = '';
    
    // Initialize
    receipt += this.COMMANDS.INIT;
    
    // Header with store info (if enabled)
    if (showStoreDetails) {
      receipt += this.COMMANDS.ALIGN_CENTER;
      receipt += this.COMMANDS.TEXT_DOUBLE_SIZE;
      receipt += this.COMMANDS.BOLD_ON;
      
      const store = order.store;
      if (store && store.name) {
        const displayName = (receiptSettings?.useCustomBusinessName && receiptSettings?.businessName)
          ? receiptSettings.businessName
          : store.name;
        receipt += `${displayName}\n`;
      }
      
      receipt += 'KITCHEN ORDER\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += this.COMMANDS.TEXT_NORMAL;
    }
    
    receipt += this.COMMANDS.ALIGN_LEFT;
    receipt += this.generateSeparator(paperWidth);
    
    // Order info
    receipt += this.COMMANDS.BOLD_ON;
    receipt += `Order: #${order.reference || order._id}\n`;
    receipt += this.COMMANDS.BOLD_OFF;
    receipt += `Time: ${this.formatDate(order.createdAt || new Date())}\n`;
    
    // Order type
    if (order.type) {
      receipt += `Type: ${order.type}\n`;
    }
    
    // Sales channel
    if (order.salesChannel) {
      receipt += `Channel: ${order.salesChannel}\n`;
    }
    
    // Table info
    if (order.table) {
      const table = order.table;
      receipt += `Table: ${table.number || table.name || table}\n`;
    }
    
    // Guest/Customer info (if enabled)
    if (showCustomerName) {
      if (order.guest) {
        const guest = order.guest;
        if (guest.name) receipt += `Guest: ${guest.name}\n`;
        if (guest.room) receipt += `Room: ${guest.room}\n`;
      }
    }
    
    // Staff/Server info (if enabled)
    if (showSellerInfo) {
      if (order.staff) {
        const staff = order.staff;
        const staffName = staff.name || staff.firstName || staff;
        receipt += `Server: ${staffName}\n`;
      }
    }
    
    receipt += this.generateSeparator(paperWidth);
    
    // Items from order.cart.products
    const products = order.cart?.products || [];
    
    // Get store currency code from selected store
    const currencyCode = this.storeStore.selectedStore()?.currencyCode || 'NGN';
    
    if (products.length > 0) {
      receipt += this.COMMANDS.BOLD_ON;
      receipt += 'ITEMS:\n';
      receipt += this.COMMANDS.BOLD_OFF;
      
      products.forEach((product: any) => {
        const productName = product.name;
        const quantity = product.quantity || 1;
        const price = product.price || 0;
        
        receipt += `${quantity}x ${productName}`;
        if (price > 0) {
          receipt += ` - ${this.formatCurrency(price, currencyCode)}`;
        }
        receipt += '\n';
        
        // Add options/modifiers with prices and quantities
        if (product.options && Array.isArray(product.options) && product.options.length > 0) {
          product.options.forEach((opt: any) => {
            if (opt.options && Array.isArray(opt.options)) {
              opt.options.forEach((optItem: any) => {
                if (optItem.selected) {
                  const optQty = optItem.quantity || 1;
                  const optPrice = optItem.price || 0;
                  receipt += `   + ${optQty}x ${optItem.name}`;
                  if (optPrice > 0) {
                    receipt += ` (${this.formatCurrency(optPrice, currencyCode)})`;
                  }
                  receipt += '\n';
                }
              });
            } else {
              const optName = opt.optionItemName || opt.name || opt;
              const optQty = opt.quantity || 1;
              const optPrice = opt.price || 0;
              
              if (optQty > 1) {
                receipt += `   + ${optQty}x ${optName}`;
              } else {
                receipt += `   + ${optName}`;
              }
              
              if (optPrice > 0) {
                receipt += ` (${this.formatCurrency(optPrice, currencyCode)})`;
              }
              receipt += '\n';
            }
          });
        }
        
        // Add product notes
        if (product.notes) {
          receipt += `   Note: ${product.notes}\n`;
        }
        
        receipt += '\n';
      });
    } else {
      receipt += 'No items in order\n';
    }
    
    receipt += this.generateSeparator(paperWidth);
    
    // Order financial summary
    const subtotal = order.subTotal || order.subtotal;
    const tax = order.tax;
    const discount = order.discount;
    const shippingFee = order.shippingFee;
    const serviceFee = order.serviceFee;
    const total = order.total;
    
    receipt += this.COMMANDS.BOLD_ON;
    receipt += 'ORDER SUMMARY:\n';
    receipt += this.COMMANDS.BOLD_OFF;
    
    if (subtotal !== undefined) {
      receipt += `Subtotal:            ${this.formatCurrency(subtotal, currencyCode)}\n`;
    }
    
    if (showTax && tax && tax > 0) {
      receipt += `Tax:                 ${this.formatCurrency(tax, currencyCode)}\n`;
    }
    
    if (discount && discount > 0) {
      receipt += `Discount:           -${this.formatCurrency(discount, currencyCode)}\n`;
    }
    
    if (shippingFee && shippingFee > 0) {
      receipt += `Shipping:            ${this.formatCurrency(shippingFee, currencyCode)}\n`;
    }
    
    if (serviceFee && serviceFee > 0) {
      receipt += `Service Fee:         ${this.formatCurrency(serviceFee, currencyCode)}\n`;
    }
    
    if (total !== undefined) {
      receipt += '--------------------------------\n';
      receipt += this.COMMANDS.BOLD_ON;
      receipt += `TOTAL:               ${this.formatCurrency(total, currencyCode)}\n`;
      receipt += this.COMMANDS.BOLD_OFF;
    }
    
    // Payment info
    if (order.payment) {
      receipt += `Payment: ${order.payment}\n`;
    }
    
    if (order.paymentStatus) {
      receipt += `Status: ${order.paymentStatus}\n`;
    }
    
    receipt += this.generateSeparator(paperWidth);
    
    // Order notes (if enabled)
    if (showNote && (order.note || order.orderInstruction)) {
      receipt += this.COMMANDS.BOLD_ON;
      receipt += 'NOTES:\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += `${order.note || order.orderInstruction}\n`;
      receipt += this.generateSeparator(paperWidth);
    }
    
    receipt += this.COMMANDS.ALIGN_CENTER;
    
    // Footer message
    if (footerMessage) {
      receipt += `${footerMessage}\n`;
    }
    
    // Disclaimer
    if (disclaimer) {
      receipt += this.COMMANDS.TEXT_NORMAL;
      receipt += `${disclaimer}\n`;
    }
    
    // Order reference footer
    receipt += this.COMMANDS.TEXT_NORMAL;
    receipt += `Order: ${order.reference || order._id.substring(order._id.length - 6)}\n`;
    receipt += this.COMMANDS.FEED_LINE;
    receipt += this.COMMANDS.FEED_LINE;
    
    // Cut paper
    receipt += this.COMMANDS.CUT_PAPER;
    
    console.log('=== RECEIPT GENERATED ===');
    return receipt;
  }



  private formatCurrency(amount: number, currencyCode: string): string {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${currencyCode} ${formatted}`;
  }

  private formatDate(date: Date | string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  /**
   * Send receipt data to network printer service
   * @param receiptData - ESC/POS formatted receipt data
   * @param order - Order object for metadata
   */
  private sendToNetworkPrinter(receiptData: string, order?: any): void {
    try {
      this.networkPrinterService
        .sendToPrinter(receiptData, undefined, order?._id, order?.reference)
        .subscribe({
          next: (response: any) => {
            console.log('✅ [NETWORK PRINTER] Print job sent successfully:', response);
          },
          error: (err: any) => {
            console.warn('⚠️ [NETWORK PRINTER] Failed to send to network printer:', err.message);
            // Don't throw - network printer is optional, Bluetooth is primary
          },
        });
    } catch (error: any) {
      console.warn('⚠️ [NETWORK PRINTER] Error preparing print job:', error.message);
    }
  }

 
  /**
   * Generate a separator line based on paper width
   * 58mm = ~31 characters, 80mm = ~42 characters
   * @param paperWidth Paper width in mm (58 or 80)
   * @returns Separator string with newline
   */
  private generateSeparator(paperWidth: number = 80): string {
    const separatorLength = paperWidth === 58 ? 31 : 42;
    const separator = '='.repeat(separatorLength) + '\n';
    return separator;
  }
}
