import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../../../shared/services/orders.service';
import { StoreService } from '../../../../../shared/services/store.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { MatListModule } from "@angular/material/list";


@Component({
  selector: 'receipts-details',
  templateUrl: './receipts-details.component.html',
  styleUrl: './receipts-details.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTableModule,
    MatChipsModule,
    PageHeaderComponent,
    MatListModule,
    RouterModule
]
})
export class ReceiptsDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  private location = inject(Location);

  exporting = signal(false);

  orderResource = rxResource({
    params: () => ({
      id: this.route.snapshot.paramMap.get('id')
    }),
    stream: ({ params }) => this.orderService.getOrder(params.id!)
  });

  // Computed currency signal for use in template
  currency = computed(() => {
    const store = this.storeService.getStoreLocally;
    return store?.currencyCode || 'NGN';
  });

  getProductSubtotal(item: any): number {
    const base = (item.price || 0) * (item.quantity || 0);
    const optionsTotal = (item.options || []).reduce(
      (sum: number, o: any) => sum + ((o.price || 0) * (o.quantity || 0)),
      0
    );
    return base + optionsTotal;
  }

  getCurrency(): string {
    const store = this.storeService.getStoreLocally;
    return store?.currencyCode || 'NGN';
  }

  goBack(): void {
    this.location.back();
  }

  async exportReceipt(): Promise<void> {
    await this.exportDocument('receipt');
  }

  async exportInvoice(): Promise<void> {
    await this.exportDocument('invoice');
  }

  private async exportDocument(type: 'receipt' | 'invoice'): Promise<void> {
    const order = this.orderResource.value();
    if (!order) {
      this.snackBar.open('Order data not available', 'Close', { duration: 3000 });
      return;
    }

    const currencyCode = this.currency();
    if (!currencyCode) {
      this.snackBar.open('Currency information not available', 'Close', { duration: 3000 });
      return;
    }

    this.exporting.set(true);

    try {
      const printContent = type === 'receipt' 
        ? this.generatePrintableReceipt(order, currencyCode)
        : this.generatePrintableInvoice(order, currencyCode);
      
      const windowWidth = type === 'receipt' ? 800 : 1000;
      const windowHeight = type === 'receipt' ? 900 : 1000;
      
      const printWindow = window.open('', '_blank', `width=${windowWidth},height=${windowHeight}`);
      
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Auto-print after a short delay
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        this.snackBar.open('Please allow pop-ups to export', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      this.snackBar.open(`Failed to export ${type}`, 'Close', { duration: 3000 });
    } finally {
      this.exporting.set(false);
    }
  }

  private generatePrintableReceipt(order: any, currency: string): string {
    const formatCurrency = (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          currencyDisplay: 'symbol'
        }).format(amount);
      } catch (error) {
        // Fallback for invalid currency codes
        console.warn(`Invalid currency code: ${currency}, using USD`);
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      }
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const store = this.storeService.getStoreLocally;
    const storeName = store?.name || 'Store';
    const storePhone = store?.contactInfo?.phone || '';
    const storeAddress = store?.contactInfo?.address || '';

    // Generate scheduled delivery section if applicable
    const scheduledSection = order.deliveryTime?.name === 'Schedule Delivery' ? `
      <div class="alert-section scheduled">
        <div class="alert-icon">📅</div>
        <div class="alert-content">
          <div class="alert-title">SCHEDULED DELIVERY</div>
          <div class="alert-text">${order.deliveryTime.date} at ${order.deliveryTime.time}</div>
        </div>
      </div>
    ` : '';

    // Generate gift section if applicable
    const giftSection = order.gift && order.receiver ? `
      <div class="alert-section gift">
        <div class="alert-icon">🎁</div>
        <div class="alert-content">
          <div class="alert-title">GIFT ORDER ${order.receiver.surprise ? '(SURPRISE)' : ''}</div>
          <div class="alert-text">
            <strong>To:</strong> ${order.receiver.name}<br>
            <strong>Phone:</strong> ${order.receiver.phoneNumber}
            ${order.receiver.address ? `<br><strong>Address:</strong> ${order.receiver.address.name}` : ''}
            ${order.receiver.note ? `<br><strong>Note:</strong> ${order.receiver.note}` : ''}
          </div>
        </div>
      </div>
    ` : '';

    // Generate products list
    const productsHTML = order.cart?.products?.map((item: any) => {
      const optionsHTML = item.options?.length > 0 
        ? item.options.map((opt: any) => 
            `<div class="option-line">  + ${opt.name} ${opt.price ? '(' + formatCurrency(opt.price) + ')' : ''} x${opt.quantity}</div>`
          ).join('') 
        : '';
      
      const subtotal = this.getProductSubtotal(item);
      
      return `
        <div class="product-item">
          <div class="product-header">
            <span class="product-name">${item.quantity}x ${item.name}</span>
            <span class="product-price">${formatCurrency(subtotal)}</span>
          </div>
          ${optionsHTML}
          <div class="product-unit-price">@ ${formatCurrency(item.price)} each</div>
        </div>
      `;
    }).join('') || '';

    // Generate commission breakdown if available
    const commissionSection = order.vendorCommission && order.vendorCommissionAmount ? `
      <div class="section-divider"></div>
      <div class="commission-section">
        <div class="section-title">REVENUE BREAKDOWN</div>
        <div class="commission-item">
          <span>Vendor Commission (${order.vendorCommission}%)</span>
          <span>${formatCurrency(order.vendorCommissionAmount)}</span>
        </div>
        <div class="commission-item">
          <span>Vendor Receives</span>
          <span>${formatCurrency(order.subTotal - order.vendorCommissionAmount)}</span>
        </div>
        <div class="commission-item">
          <span>Platform Receives</span>
          <span>${formatCurrency(order.total - (order.subTotal - order.vendorCommissionAmount))}</span>
        </div>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${order.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { 
            size: 80mm auto;
            margin: 0;
          }
          body { 
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
            width: 80mm;
            margin: 0 auto;
            padding: 10mm;
          }
          
          .receipt-header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .store-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .store-info {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .receipt-title {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0 5px 0;
            text-transform: uppercase;
          }
          .order-ref {
            font-size: 11px;
            margin-bottom: 3px;
          }
          .order-date {
            font-size: 10px;
            color: #555;
          }
          
          .alert-section {
            border: 2px solid #000;
            padding: 8px;
            margin: 10px 0;
            background: #f5f5f5;
          }
          .alert-section.scheduled {
            border-color: #2563eb;
          }
          .alert-section.gift {
            border-color: #db2777;
          }
          .alert-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 5px;
          }
          .alert-text {
            font-size: 10px;
            line-height: 1.5;
          }
          
          .info-section {
            margin: 15px 0;
            font-size: 11px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 100px;
          }
          
          .section-divider {
            border-top: 1px dashed #000;
            margin: 15px 0;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 8px;
            text-align: center;
            text-transform: uppercase;
          }
          
          .product-item {
            margin-bottom: 12px;
            font-size: 11px;
          }
          .product-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .product-name {
            flex: 1;
            padding-right: 10px;
          }
          .product-price {
            white-space: nowrap;
          }
          .option-line {
            font-size: 10px;
            padding-left: 10px;
            margin: 2px 0;
            color: #555;
          }
          .product-unit-price {
            font-size: 9px;
            color: #666;
            padding-left: 10px;
            margin-top: 2px;
          }
          
          .totals-section {
            margin-top: 15px;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
          }
          .total-line.grand {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 8px 0;
            margin-top: 8px;
          }
          .total-line.tip {
            color: #f59e0b;
            font-weight: bold;
            border-top: 1px dashed #000;
            padding-top: 8px;
            margin-top: 8px;
          }
          
          .commission-section {
            margin: 15px 0;
            padding: 10px;
            background: #f9f9f9;
            border: 1px solid #ddd;
          }
          .commission-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 10px;
          }
          
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px dashed #000;
            font-size: 10px;
          }
          .footer-message {
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          @media print {
            body { 
              padding: 5mm;
            }
            .no-print { 
              display: none; 
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="receipt-header">
          <div class="store-name">${storeName}</div>
          ${storePhone ? `<div class="store-info">${storePhone}</div>` : ''}
          ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ''}
          <div class="receipt-title">RECEIPT</div>
          <div class="order-ref">Order: ${order.reference}</div>
          <div class="order-date">${formatDate(order.createdAt)}</div>
        </div>

        <!-- Alerts -->
        ${scheduledSection}
        ${giftSection}

        <!-- Customer Information -->
        <div class="info-section">
          <div><span class="info-label">Customer:</span> ${order.user?.name || 'N/A'}</div>
          <div><span class="info-label">Phone:</span> ${order.user?.phoneNumber || 'N/A'}</div>
          ${order.shipping?.name ? `<div><span class="info-label">Address:</span> ${order.shipping.name}</div>` : ''}
        </div>

        <!-- Order Details -->
        <div class="info-section">
          <div><span class="info-label">Payment:</span> ${order.payment}</div>
          <div><span class="info-label">Status:</span> ${order.paymentStatus}</div>
          <div><span class="info-label">Order Type:</span> ${order.orderType}</div>
          <div><span class="info-label">Delivery:</span> ${order.deliveryType}</div>
        </div>

        <div class="section-divider"></div>

        <!-- Products -->
        <div class="section-title">Items Ordered</div>
        ${productsHTML}

        <!-- Totals -->
        <div class="totals-section">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${formatCurrency(order.subTotal)}</span>
          </div>
          <div class="total-line">
            <span>Service Fee:</span>
            <span>${formatCurrency(order.serviceFee)}</span>
          </div>
          <div class="total-line">
            <span>Shipping Fee:</span>
            <span>${formatCurrency(order.shippingFee)}</span>
          </div>
          ${order.discount ? `
          <div class="total-line">
            <span>Discount:</span>
            <span>-${formatCurrency(order.discount)}</span>
          </div>
          ` : ''}
          <div class="total-line grand">
            <span>TOTAL:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
          ${order.driverTip ? `
          <div class="total-line tip">
            <span>Driver Tip:</span>
            <span>${formatCurrency(order.driverTip)}</span>
          </div>
          ` : ''}
        </div>

        ${commissionSection}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-message">THANK YOU FOR YOUR BUSINESS!</div>
          <div>Printed: ${formatDate(new Date().toISOString())}</div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePrintableInvoice(order: any, currency: string): string {
    const formatCurrency = (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          currencyDisplay: 'symbol'
        }).format(amount);
      } catch (error) {
        console.warn(`Invalid currency code: ${currency}, using USD`);
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      }
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatDateTime = (date: string) => {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const store = this.storeService.getStoreLocally;
    const storeName = store?.name || 'Store';
    const storePhone = store?.contactInfo?.phone || '';
    const storeEmail = store?.contactInfo?.email || '';
    const storeAddress = store?.contactInfo?.address || '';
    const storeCity = store?.contactInfo?.city || '';
    const storeState = store?.contactInfo?.state || '';
    const storeCountry = store?.contactInfo?.country || '';

    // Generate scheduled delivery section if applicable
    const scheduledSection = order.deliveryTime?.name === 'Schedule Delivery' ? `
      <div class="alert-box scheduled">
        <div class="alert-icon">📅</div>
        <div class="alert-content">
          <div class="alert-title">Scheduled Delivery</div>
          <div class="alert-text">This order is scheduled for <strong>${order.deliveryTime.date}</strong> at <strong>${order.deliveryTime.time}</strong></div>
        </div>
      </div>
    ` : '';

    // Generate gift section if applicable
    const giftSection = order.gift && order.receiver ? `
      <div class="alert-box gift">
        <div class="alert-icon">🎁</div>
        <div class="alert-content">
          <div class="alert-title">Gift Order ${order.receiver.surprise ? '(Surprise)' : ''}</div>
          <div class="gift-details">
            <div><strong>Recipient:</strong> ${order.receiver.name}</div>
            <div><strong>Phone:</strong> ${order.receiver.phoneNumber}</div>
            ${order.receiver.address ? `<div><strong>Address:</strong> ${order.receiver.address.name}</div>` : ''}
            ${order.receiver.note ? `<div><strong>Gift Message:</strong> ${order.receiver.note}</div>` : ''}
          </div>
        </div>
      </div>
    ` : '';

    // Generate products table rows
    const productsRows = order.cart?.products?.map((item: any, index: number) => {
      const optionsText = item.options?.length > 0 
        ? `<br><small style="color: #666;">${item.options.map((opt: any) => 
            `+ ${opt.name} ${opt.price ? '(' + formatCurrency(opt.price) + ')' : ''} x${opt.quantity}`
          ).join('<br>')}</small>`
        : '';
      
      const subtotal = this.getProductSubtotal(item);
      
      return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${item.name}${optionsText}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.price)}</td>
          <td style="text-align: right;"><strong>${formatCurrency(subtotal)}</strong></td>
        </tr>
      `;
    }).join('') || '';

    // Generate commission breakdown if available
    const commissionSection = order.vendorCommission && order.vendorCommissionAmount ? `
      <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #374151; text-transform: uppercase;">Revenue Breakdown</h3>
        <table style="width: 100%; font-size: 12px;">
          <tr style="background: #dbeafe;">
            <td style="padding: 10px; border-radius: 4px;">Vendor Commission (${order.vendorCommission}%)</td>
            <td style="padding: 10px; text-align: right; color: #2563eb; font-weight: bold;">${formatCurrency(order.vendorCommissionAmount)}</td>
          </tr>
          <tr style="background: #fce7f3;">
            <td style="padding: 10px; border-radius: 4px; padding-top: 5px;">Vendor Receives</td>
            <td style="padding: 10px; text-align: right; color: #db2777; font-weight: bold; padding-top: 5px;">${formatCurrency(order.subTotal - order.vendorCommissionAmount)}</td>
          </tr>
          <tr style="background: #d1fae5;">
            <td style="padding: 10px; border-radius: 4px; padding-top: 5px;">Platform Receives</td>
            <td style="padding: 10px; text-align: right; color: #059669; font-weight: bold; padding-top: 5px;">${formatCurrency(order.total - (order.subTotal - order.vendorCommissionAmount))}</td>
          </tr>
        </table>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { 
            size: A4;
            margin: 0;
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1f2937;
            background: white;
            padding: 40px;
          }
          
          .invoice-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .company-info h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .company-info p {
            color: #6b7280;
            font-size: 11px;
            line-height: 1.6;
            margin-bottom: 3px;
          }
          
          .invoice-info {
            text-align: right;
          }
          .invoice-title {
            font-size: 36px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .invoice-details {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            text-align: left;
            display: inline-block;
          }
          .invoice-details div {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            margin-bottom: 5px;
            font-size: 11px;
          }
          .invoice-details strong {
            color: #374151;
            min-width: 100px;
          }
          .invoice-details span {
            color: #6b7280;
          }
          
          .alert-box {
            margin: 20px 0;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .alert-box.scheduled {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
          }
          .alert-box.gift {
            background: #fdf2f8;
            border-left: 4px solid #ec4899;
          }
          .alert-icon {
            font-size: 24px;
          }
          .alert-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 5px;
            color: #1f2937;
          }
          .alert-text {
            font-size: 11px;
            color: #6b7280;
          }
          .gift-details {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.8;
          }
          
          .parties-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .party-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .party-box h3 {
            font-size: 12px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .party-box p {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 4px;
            line-height: 1.6;
          }
          .party-box strong {
            color: #1f2937;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .items-table thead {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
          }
          .items-table th {
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
          }
          .items-table tbody tr:nth-child(even) {
            background: #f9fafb;
          }
          .items-table tbody tr:hover {
            background: #f3f4f6;
          }
          .items-table td {
            padding: 12px 10px;
            font-size: 11px;
            color: #374151;
          }
          
          .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
          }
          .totals-table {
            width: 350px;
          }
          .totals-table tr {
            border-bottom: 1px solid #e5e7eb;
          }
          .totals-table td {
            padding: 10px 15px;
            font-size: 12px;
          }
          .totals-table td:first-child {
            color: #6b7280;
          }
          .totals-table td:last-child {
            text-align: right;
            color: #1f2937;
            font-weight: 500;
          }
          .totals-table tr.subtotal {
            background: #f9fafb;
          }
          .totals-table tr.grand-total {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            font-weight: bold;
            font-size: 16px;
            border: none;
          }
          .totals-table tr.grand-total td {
            color: white;
            padding: 15px;
          }
          .totals-table tr.driver-tip {
            background: #fffbeb;
            border-top: 2px solid #f59e0b;
          }
          .totals-table tr.driver-tip td:last-child {
            color: #f59e0b;
            font-weight: bold;
          }
          
          .payment-status {
            margin-top: 30px;
            padding: 15px 20px;
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            border-radius: 8px;
          }
          .payment-status.pending {
            background: #fef3c7;
            border-left-color: #f59e0b;
          }
          .payment-status.failed {
            background: #fee2e2;
            border-left-color: #ef4444;
          }
          .payment-status h4 {
            font-size: 12px;
            margin-bottom: 5px;
            color: #1f2937;
          }
          .payment-status p {
            font-size: 11px;
            color: #6b7280;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
          }
          .footer p {
            margin-bottom: 5px;
          }
          
          @media print {
            body { 
              padding: 20mm;
            }
            .no-print { 
              display: none; 
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-info">
            <h1>${storeName}</h1>
            ${storeAddress ? `<p>${storeAddress}</p>` : ''}
            ${storeCity || storeState ? `<p>${storeCity}${storeCity && storeState ? ', ' : ''}${storeState}</p>` : ''}
            ${storeCountry ? `<p>${storeCountry}</p>` : ''}
            ${storePhone ? `<p>Phone: ${storePhone}</p>` : ''}
            ${storeEmail ? `<p>Email: ${storeEmail}</p>` : ''}
          </div>
          
          <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-details">
              <div><strong>Invoice #:</strong><span>${order.reference}</span></div>
              <div><strong>Date:</strong><span>${formatDate(order.createdAt)}</span></div>
              <div><strong>Status:</strong><span>${order.category}</span></div>
              <div><strong>Payment:</strong><span>${order.paymentStatus}</span></div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        ${scheduledSection}
        ${giftSection}

        <!-- Bill To / Ship To -->
        <div class="parties-section">
          <div class="party-box">
            <h3>Bill To</h3>
            <p><strong>${order.user?.name || 'N/A'}</strong></p>
            ${order.user?.phoneNumber ? `<p>Phone: ${order.user.phoneNumber}</p>` : ''}
            ${order.user?.email ? `<p>Email: ${order.user.email}</p>` : ''}
          </div>
          
          <div class="party-box">
            <h3>Ship To</h3>
            ${order.shipping?.name ? `<p>${order.shipping.name}</p>` : '<p>N/A</p>'}
            <p style="margin-top: 10px;"><strong>Delivery Type:</strong> ${order.deliveryType}</p>
            <p><strong>Order Type:</strong> ${order.orderType}</p>
            <p><strong>Payment Method:</strong> ${order.payment}</p>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 45%;">Item Description</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 20%; text-align: right;">Unit Price</th>
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productsRows}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <table class="totals-table">
            <tr class="subtotal">
              <td>Subtotal</td>
              <td>${formatCurrency(order.subTotal)}</td>
            </tr>
            <tr>
              <td>Service Fee</td>
              <td>${formatCurrency(order.serviceFee)}</td>
            </tr>
            <tr>
              <td>Shipping Fee</td>
              <td>${formatCurrency(order.shippingFee)}</td>
            </tr>
            ${order.discount ? `
            <tr>
              <td>Discount</td>
              <td>-${formatCurrency(order.discount)}</td>
            </tr>
            ` : ''}
            <tr class="grand-total">
              <td>TOTAL DUE</td>
              <td>${formatCurrency(order.total)}</td>
            </tr>
            ${order.driverTip ? `
            <tr class="driver-tip">
              <td>Driver Tip</td>
              <td>${formatCurrency(order.driverTip)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${commissionSection}

        <!-- Payment Status -->
        <div class="payment-status ${order.paymentStatus?.toLowerCase()}">
          <h4>Payment Status: ${order.paymentStatus}</h4>
          <p>Payment Method: ${order.payment} | Order Date: ${formatDateTime(order.createdAt)}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>Generated on ${formatDateTime(new Date().toISOString())}</p>
        </div>
      </body>
      </html>
    `;
  }
}
