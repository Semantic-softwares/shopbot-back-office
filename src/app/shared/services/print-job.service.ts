import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrintJob, PrintJobStats } from '../models/print-job.model';
import { StoreStore } from '../stores/store.store';
import { BluetoothPrinterService } from './bluetooth-printer.service';

@Injectable({
  providedIn: 'root',
})
export class PrintJobService {
  private http = inject(HttpClient);
  private storeStore = inject(StoreStore);
  private bluetoothPrinterService = inject(BluetoothPrinterService);
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
   * Generate ESC/POS receipt data from order
   * @param order - The order object containing all order details
   * @returns ESC/POS formatted receipt string
   */
  public generateOrderReceipt(order: any): string {
    console.log('=== GENERATE RECEIPT ===');
    console.log('Order ID:', order._id);
    console.log('Order Reference:', order.reference);
    console.log('Order cart products:', order.cart?.products?.length || 0);
    
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
        receipt += `${store.name}\n`;
      }
      
      receipt += 'KITCHEN ORDER\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += this.COMMANDS.TEXT_NORMAL;
    }
    
    receipt += this.COMMANDS.ALIGN_LEFT;
    receipt += '================================\n';
    
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
    
    receipt += '================================\n';
    
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
    
    receipt += '================================\n';
    
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
    
    receipt += '================================\n';
    
    // Order notes (if enabled)
    if (showNote && (order.note || order.orderInstruction)) {
      receipt += this.COMMANDS.BOLD_ON;
      receipt += 'NOTES:\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += `${order.note || order.orderInstruction}\n`;
      receipt += '================================\n';
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

  /**
   * Smart print method that:
   * 1. Checks if Bluetooth printer is connected
   * 2. If connected → Print directly via Bluetooth
   * 3. If NOT connected → Create backend print job for master system
   * @param order - The order object to print
   * @returns Object with isPrinterConnected flag
   */
  public async printOrderReceipt(order: any): Promise<{ isPrinterConnected: boolean }> {
    const isPrinterConnected = this.bluetoothPrinterService.isConnected();
    
    if (isPrinterConnected) {
      console.log('📱 [PRINT] Printer connected - Printing directly via Bluetooth');
      try {
        // Generate receipt from order
        const receiptData = this.generateOrderReceipt(order);
        
        // Send to printer via Bluetooth service
        await this.bluetoothPrinterService.sendToPrinter(receiptData);
        
        console.log('✅ [PRINT] Direct print completed');
        return { isPrinterConnected: true };
      } catch (error: any) {
        console.error('❌ [PRINT] Direct print failed:', error);
        throw error;
      }
    } else {
      console.log('📡 [PRINT] No printer connected - Creating backend print job');
      try {
        // Create backend print job for master system to pick up
        const result = await this.createPrintJobsForOrder(order).toPromise();
        console.log('✅ [PRINT] Print job created - Master system will print:', result);
        return { isPrinterConnected: false };
      } catch (error: any) {
        console.error('❌ [PRINT] Failed to create print job:', error);
        throw new Error('Failed to create print job. Please try again.');
      }
    }
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
   * Handle auto-printing based on store settings and conditions
   * Called when a new print job is created
   */
  public async handleAutoPrint(data: any): Promise<void> {
    try {
      console.log('🔍 [AUTO-PRINT] Checking auto-print conditions');
      
      // Extract print job data
      const printJob = data.printJob || data;
      
      if (!printJob) {
        console.warn('⚠️ [AUTO-PRINT] No print job data');
        return;
      }

      console.log('✓ Print Job ID:', printJob._id);
      console.log('✓ Job Status:', printJob.status);

      // Check if order exists
      const order = printJob.order;
      if (!order || typeof order !== 'object') {
        console.warn('⚠️ [AUTO-PRINT] No order object in print job');
        return;
      }

      console.log('✓ Order ID:', order._id);
      console.log('✓ Order Category:', order.category);
      console.log('✓ Payment Status:', order.paymentStatus);

      // Check if order is complete and paid
      const isComplete = order.category === 'Complete';
      const isPaid = order.paymentStatus === 'Paid';

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [ORDER VALIDATION]');
      console.log('  Complete:', isComplete ? '✅' : '❌');
      console.log('  Paid:', isPaid ? '✅' : '❌');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // if (!isComplete || !isPaid) {
      //   console.log('⏭️ [AUTO-PRINT] Skipped - Order not complete or not paid');
      //   return;
      // }

      // Check store setting for auto-print
      const printAfterFinish = this.storeStore.selectedStore()?.posSettings?.receiptSettings?.printAfterFinish ?? true;
      console.log('🔍 [STORE SETTING] printAfterFinish:', printAfterFinish);

      if (!printAfterFinish) {
        console.log('⏭️ [AUTO-PRINT] Skipped - Store setting printAfterFinish is disabled');
        return;
      }

      // Check if Bluetooth printer is connected
      const printerConnected = this.bluetoothPrinterService.isConnected();
      console.log('🖨️ [PRINTER CHECK] Bluetooth connected:', printerConnected ? '✅' : '❌');
      
      if (!printerConnected) {
        console.log('⏭️ [AUTO-PRINT] Skipped - Bluetooth printer not connected');
        return;
      }

      // All conditions met - auto-print ONLY via direct Bluetooth
      // NOTE: Do NOT create a new print job here - the socket event already indicates
      // a job exists. Creating another would cause an infinite loop.
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🖨️ [AUTO-PRINTING] Receipt via Bluetooth...');
      console.log('  Order:', order.reference || order._id);
      console.log('  Store:', order.store?.name || 'N/A');
      console.log('  Total:', order.total);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Generate receipt and send directly to Bluetooth printer
      // Do NOT call printOrderReceipt as it would create another job
      const receiptData = this.generateOrderReceipt(order);
      await this.bluetoothPrinterService.sendToPrinter(receiptData);
      
      console.log('✅ [AUTO-PRINT] Printed directly via Bluetooth');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
      console.error('❌ [AUTO-PRINT] Failed:', error);
    }
  }
}
