import { Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from './socket.service';
import { BluetoothPrinterService } from './bluetooth-printer.service';

@Injectable({
  providedIn: 'root'
})
export class AutoPrintService {
  private socketService = inject(SocketService);
  private bluetoothPrinterService = inject(BluetoothPrinterService);
  private socketSubscription: Subscription | null = null;

  constructor() {}

  /**
   * Start listening to print job socket events
   */
  startListening(): void {
    if (this.socketSubscription) {
      console.log('🔄 Auto-print already listening');
      return;
    }

    console.log('🎧 Starting auto-print socket listener');

    this.socketSubscription = this.socketService.on<any>('printJob:created').subscribe({
      next: async (data) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📡 [SOCKET EVENT RECEIVED] printJob:created');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📦 Full Socket Data:', JSON.stringify(data, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await this.handlePrintJobEvent(data);
      },
      error: (error) => {
        console.error('❌ [SOCKET ERROR] in auto-print:', error);
      }
    });
    
    console.log('✅ Auto-print socket listener active');
  }

  /**
   * Stop listening to socket events
   */
  stopListening(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
      this.socketSubscription = null;
      console.log('Auto-print listener stopped');
    }
  }

  /**
   * Handle print job creation event
   */
  private async handlePrintJobEvent(data: any): Promise<void> {
    try {
      console.log('🔍 [PROCESSING] Starting print job validation');
      
      // Extract print job data
      const printJob = data.printJob || data;
      
      if (!printJob) {
        console.warn('⚠️ [VALIDATION FAILED] No print job data in socket event');
        console.log('Available data keys:', Object.keys(data));
        return;
      }

      console.log('✓ [PRINT JOB FOUND]');
      console.log('  - Job ID:', printJob._id);
      console.log('  - Job Status:', printJob.status);
      console.log('  - Station:', printJob.station);

      // Check if order exists in print job
      const order = printJob.order;
      if (!order || typeof order !== 'object') {
        console.warn('⚠️ [VALIDATION FAILED] No order object in print job');
        console.log('  - Order type:', typeof order);
        console.log('  - Order value:', order);
        return;
      }

      console.log('✓ [ORDER FOUND]');
      console.log('  - Order ID:', order._id);
      console.log('  - Order Reference:', order.reference);
      console.log('  - Order Category:', order.category);
      console.log('  - Payment Status:', order.paymentStatus);

      // Check if order is complete and paid
      const isComplete = order.category === 'Complete';
      const isPaid = order.paymentStatus === 'Paid';

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [ORDER VALIDATION CHECK]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Category:', order.category, isComplete ? '✅' : '❌');
      console.log('  Payment:', order.paymentStatus, isPaid ? '✅' : '❌');
      console.log('  Can Print:', (isComplete && isPaid) ? '✅ YES' : '❌ NO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (!isComplete || !isPaid) {
        console.log('⏭️ [SKIPPED] Order not complete or not paid');
        return;
      }

      // Check if Bluetooth printer is connected
      const printerConnected = this.bluetoothPrinterService.isConnected();
      console.log('🖨️ [PRINTER CHECK] Bluetooth printer connected:', printerConnected ? '✅ YES' : '❌ NO');
      
      if (!printerConnected) {
        console.log('⏭️ [SKIPPED] Bluetooth printer not connected');
        return;
      }

      // Generate and print receipt
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🖨️ [PRINTING] Auto-printing receipt...');
      console.log('  Order:', order.reference || order._id);
      console.log('  Store:', order.store?.name || 'N/A');
      console.log('  Total:', order.total);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      await this.printReceipt(printJob);
      
      console.log('✅ [SUCCESS] Auto-print completed successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
      console.error('❌ [ERROR] Auto-print failed:', error);
      console.error('Error details:', error);
    }
  }

  /**
   * Generate and print receipt
   */
  private async printReceipt(job: any): Promise<void> {
    const receiptData = this.generateReceipt(job);
    await this.bluetoothPrinterService.sendToPrinter(receiptData);
  }

  /**
   * Generate receipt ESC/POS data
   */
  private generateReceipt(job: any): string {
    const COMMANDS = {
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

    const order = job.order;
    const store = order?.store;
    
    if (!order) {
      return COMMANDS.INIT + 'ERROR: No order data\n' + COMMANDS.CUT_PAPER;
    }

    let receipt = '';
    
    // Initialize
    receipt += COMMANDS.INIT;
    
    // Header
    receipt += COMMANDS.ALIGN_CENTER;
    receipt += COMMANDS.TEXT_DOUBLE_SIZE;
    receipt += COMMANDS.BOLD_ON;
    
    if (store?.name) {
      receipt += `${store.name}\n`;
    }
    
    receipt += 'KITCHEN ORDER\n';
    receipt += COMMANDS.BOLD_OFF;
    receipt += COMMANDS.TEXT_NORMAL;
    receipt += COMMANDS.ALIGN_LEFT;
    receipt += '================================\n';
    
    // Order info
    receipt += COMMANDS.BOLD_ON;
    receipt += `Order: #${order.reference || order._id}\n`;
    receipt += COMMANDS.BOLD_OFF;
    receipt += `Time: ${new Date().toLocaleString()}\n`;
    
    if (order.type) {
      receipt += `Type: ${order.type}\n`;
    }
    
    if (order.salesChannel) {
      receipt += `Channel: ${order.salesChannel}\n`;
    }
    
    if (order.table) {
      const table = order.table;
      receipt += `Table: ${table.number || table.name || table}\n`;
    }
    
    if (order.staff) {
      const staff = order.staff;
      const staffName = staff.name || staff.firstName || staff;
      receipt += `Server: ${staffName}\n`;
    }
    
    receipt += '================================\n';
    
    // Items
    const products = order.cart?.products || [];
    const currency = store?.currencyCode || 'USD';
    
    if (products.length > 0) {
      receipt += COMMANDS.BOLD_ON;
      receipt += 'ITEMS:\n';
      receipt += COMMANDS.BOLD_OFF;
      
      products.forEach((product: any) => {
        const quantity = product.quantity || 1;
        const price = product.price || 0;
        
        receipt += `${quantity}x ${product.name}`;
        if (price > 0) {
          receipt += ` - ${this.formatCurrency(price, currency)}`;
        }
        receipt += '\n';
        
        // Options
        if (product.options && Array.isArray(product.options)) {
          product.options.forEach((opt: any) => {
            if (opt.options && Array.isArray(opt.options)) {
              opt.options.forEach((optItem: any) => {
                if (optItem.selected) {
                  const optQty = optItem.quantity || 1;
                  const optPrice = optItem.price || 0;
                  receipt += `   + ${optQty}x ${optItem.name}`;
                  if (optPrice > 0) {
                    receipt += ` (${this.formatCurrency(optPrice, currency)})`;
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
                receipt += ` (${this.formatCurrency(optPrice, currency)})`;
              }
              receipt += '\n';
            }
          });
        }
        
        if (product.notes) {
          receipt += `   Note: ${product.notes}\n`;
        }
        
        receipt += '\n';
      });
    }
    
    receipt += '================================\n';
    
    // Order summary
    const subtotal = order.subTotal || order.subtotal;
    const tax = order.tax;
    const discount = order.discount;
    const total = order.total;
    
    receipt += COMMANDS.BOLD_ON;
    receipt += 'ORDER SUMMARY:\n';
    receipt += COMMANDS.BOLD_OFF;
    
    if (subtotal !== undefined) {
      receipt += `Subtotal:            ${this.formatCurrency(subtotal, currency)}\n`;
    }
    
    if (tax && tax > 0) {
      receipt += `Tax:                 ${this.formatCurrency(tax, currency)}\n`;
    }
    
    if (discount && discount > 0) {
      receipt += `Discount:           -${this.formatCurrency(discount, currency)}\n`;
    }
    
    if (total !== undefined) {
      receipt += '--------------------------------\n';
      receipt += COMMANDS.BOLD_ON;
      receipt += `TOTAL:               ${this.formatCurrency(total, currency)}\n`;
      receipt += COMMANDS.BOLD_OFF;
    }
    
    if (order.payment) {
      receipt += `Payment: ${order.payment}\n`;
    }
    
    receipt += '================================\n';
    
    // Order notes
    if (order.note || order.orderInstruction) {
      receipt += COMMANDS.BOLD_ON;
      receipt += 'NOTES:\n';
      receipt += COMMANDS.BOLD_OFF;
      receipt += `${order.note || order.orderInstruction}\n`;
      receipt += '================================\n';
    }
    
    receipt += COMMANDS.ALIGN_CENTER;
    receipt += `Job #${job._id?.substring(job._id.length - 6) || 'N/A'}\n`;
    receipt += COMMANDS.FEED_LINE;
    receipt += COMMANDS.FEED_LINE;
    receipt += COMMANDS.CUT_PAPER;
    
    return receipt;
  }

  /**
   * Format currency with thousand separators
   */
  private formatCurrency(amount: number, currencyCode: string): string {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${currencyCode} ${formatted}`;
  }
}
