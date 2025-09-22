import { Injectable } from '@angular/core';
import { Reservation } from '../models/reservation.model';

// Simple type declarations for Web Bluetooth API
interface BluetoothRequestDeviceOptions {
  filters?: Array<{
    services?: string[];
    name?: string;
    namePrefix?: string;
  }>;
  optionalServices?: string[];
  acceptAllDevices?: boolean;
}

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  device: BluetoothDevice;
  uuid: string;
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: string): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

interface BluetoothRemoteGATTCharacteristic {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  writeValue(value: ArrayBuffer | ArrayBufferView): Promise<void>;
  writeValueWithResponse(value: ArrayBuffer | ArrayBufferView): Promise<void>;
  writeValueWithoutResponse(value: ArrayBuffer | ArrayBufferView): Promise<void>;
  readValue(): Promise<DataView>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface PrinterDevice {
  device: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  service?: BluetoothRemoteGATTService;
  characteristic?: BluetoothRemoteGATTCharacteristic;
  isConnected: boolean;
}

export interface PrinterConfiguration {
  paperSize: '58mm' | '80mm' | '112mm';
  printQuality: 'draft' | 'normal' | 'high';
  autocut: boolean;
  headerText?: string;
  footerText?: string;
  includeLogo: boolean;
  fontSize: number;
  lineSpacing: number;
}

@Injectable({
  providedIn: 'root'
})
export class BluetoothPrinterService {
  private connectedPrinter: PrinterDevice | null = null;
  private readonly PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
  private readonly PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';
  
  // ESC/POS Commands
  private readonly ESC = '\x1B';
  private readonly GS = '\x1D';
  private readonly LF = '\x0A';
  private readonly CR = '\x0D';
  private readonly FF = '\x0C';
  
  // Text formatting commands
  private readonly COMMANDS = {
    INIT: '\x1B\x40',           // Initialize printer
    RESET: '\x1B\x40',          // Reset printer
    FEED_LINE: '\x0A',          // Line feed
    CUT_PAPER: '\x1D\x56\x00',  // Cut paper
    
    // Text alignment
    ALIGN_LEFT: '\x1B\x61\x00',
    ALIGN_CENTER: '\x1B\x61\x01',
    ALIGN_RIGHT: '\x1B\x61\x02',
    
    // Text size and style
    TEXT_NORMAL: '\x1B\x21\x00',
    TEXT_DOUBLE_HEIGHT: '\x1B\x21\x10',
    TEXT_DOUBLE_WIDTH: '\x1B\x21\x20',
    TEXT_DOUBLE_SIZE: '\x1B\x21\x30',
    
    // Text emphasis
    BOLD_ON: '\x1B\x45\x01',
    BOLD_OFF: '\x1B\x45\x00',
    UNDERLINE_ON: '\x1B\x2D\x01',
    UNDERLINE_OFF: '\x1B\x2D\x00',
    
    // Character spacing
    CHAR_SPACING_0: '\x1B\x20\x00',
    CHAR_SPACING_1: '\x1B\x20\x01',
    CHAR_SPACING_TIGHT: '\x1B\x20\x00',    // Tighter spacing for smaller paper
    CHAR_SPACING_NORMAL: '\x1B\x20\x01',   // Normal spacing
    CHAR_SPACING_WIDE: '\x1B\x20\x02',     // Wider spacing for larger paper
    
    // Line spacing
    LINE_SPACING_DEFAULT: '\x1B\x32',
    LINE_SPACING_NARROW: '\x1B\x33\x10',
    LINE_SPACING_WIDE: '\x1B\x33\x20',
    
    // Character density and width optimization
    CHAR_DENSITY_HIGH: '\x1B\x21\x01',     // High density for more chars per line
    CHAR_DENSITY_NORMAL: '\x1B\x21\x00',   // Normal density
    CHAR_WIDTH_COMPRESSED: '\x0F',          // Compressed character width
    CHAR_WIDTH_NORMAL: '\x12',              // Normal character width
    
    // Logo and image commands
    LOGO_COMMAND: '\x1C\x70\x01\x00',      // Print stored logo (position 1)
    IMAGE_MODE: '\x1B\x2A\x21',            // Set image printing mode
    
    // Print quality/speed commands
    QUALITY_DRAFT: '\x1B\x78\x00',      // Draft quality (fast)
    QUALITY_NORMAL: '\x1B\x78\x01',     // Normal quality
    QUALITY_HIGH: '\x1B\x78\x02',       // High quality (slow)
    
    // Font size commands
    FONT_SIZE_SMALL: '\x1B\x21\x01',
    FONT_SIZE_MEDIUM: '\x1B\x21\x00',
    FONT_SIZE_LARGE: '\x1B\x21\x11',
    FONT_SIZE_EXTRA_LARGE: '\x1B\x21\x33',
  };

  // Paper size configurations with font-responsive widths
  private readonly PAPER_CONFIGS = {
    '58mm': { 
      width: 38, 
      maxChars: {
        small: 42,    // Reduced for better 58mm utilization
        medium: 38,   // Standard font - better fit for 58mm
        large: 30,    // Large font fits fewer characters
        extraLarge: 22 // Extra large font
      }
    },
    '80mm': { 
      width: 64, 
      maxChars: {
        small: 72,    // Small font
        medium: 64,   // Standard font  
        large: 48,    // Large font
        extraLarge: 32 // Extra large font
      }
    },
    '112mm': { 
      width: 90, 
      maxChars: {
        small: 100,   // Small font
        medium: 90,   // Standard font
        large: 72,    // Large font
        extraLarge: 56 // Extra large font
      }
    }
  };

  constructor() {}

  // Check if Web Bluetooth is supported
  isBluetoothSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  // Connect to Bluetooth printer
  async connectToPrinter(): Promise<PrinterDevice> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      console.log('Requesting Bluetooth device...');
      
      // Request device with generic printer services
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: [this.PRINTER_SERVICE_UUID] },
          { namePrefix: 'POS' },
          { namePrefix: 'Printer' },
          { namePrefix: 'EPSON' },
          { namePrefix: 'STAR' },
          { namePrefix: 'Citizen' },
        ],
        optionalServices: [
          this.PRINTER_SERVICE_UUID,
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic printer service
          '0000ff00-0000-1000-8000-00805f9b34fb', // Custom printer service
        ]
      });

      console.log('Connecting to GATT server...');
      const server = await device.gatt!.connect();
      
      console.log('Getting printer service...');
      // Try different service UUIDs for different printer brands
      let service: BluetoothRemoteGATTService;
      try {
        service = await server.getPrimaryService(this.PRINTER_SERVICE_UUID);
      } catch (e) {
        // Try alternative service UUIDs
        const services = await server.getPrimaryServices();
        if (services.length > 0) {
          service = services[0]; // Use first available service
        } else {
          throw new Error('No compatible printer service found');
        }
      }
      
      console.log('Getting printer characteristic...');
      // Try to get the write characteristic
      let characteristic: BluetoothRemoteGATTCharacteristic;
      try {
        characteristic = await service.getCharacteristic(this.PRINTER_CHARACTERISTIC_UUID);
      } catch (e) {
        // Try to find a writable characteristic
        const characteristics = await service.getCharacteristics();
        const writableChar = characteristics.find((char: BluetoothRemoteGATTCharacteristic) => 
          char.properties.write || char.properties.writeWithoutResponse
        );
        
        if (!writableChar) {
          throw new Error('No writable characteristic found');
        }
        characteristic = writableChar;
      }

      this.connectedPrinter = {
        device,
        server,
        service,
        characteristic,
        isConnected: true
      };

      console.log('Successfully connected to printer:', device.name);
      return this.connectedPrinter;

    } catch (error) {
      console.error('Error connecting to printer:', error);
      throw new Error(`Failed to connect to printer: ${error}`);
    }
  }

  // Disconnect from printer
  async disconnectPrinter(): Promise<void> {
    if (this.connectedPrinter?.server) {
      this.connectedPrinter.server.disconnect();
      this.connectedPrinter.isConnected = false;
      this.connectedPrinter = null;
      console.log('Disconnected from printer');
    }
  }

  // Check if printer is connected
  isConnected(): boolean {
    return this.connectedPrinter?.isConnected || false;
  }

  // Send raw data to printer
  private async sendToPrinter(data: string | Uint8Array): Promise<void> {
    if (!this.connectedPrinter?.characteristic) {
      throw new Error('Printer not connected');
    }

    try {
      let buffer: ArrayBuffer;
      
      if (typeof data === 'string') {
        // Convert string to bytes using TextEncoder for proper UTF-8 encoding
        const encoder = new TextEncoder();
        buffer = encoder.encode(data).buffer;
      } else {
        buffer = data.buffer as ArrayBuffer;
      }

      // Split large data into chunks (some printers have MTU limitations)
      const chunkSize = 20; // Conservative chunk size for Bluetooth LE
      const chunks = [];
      
      for (let i = 0; i < buffer.byteLength; i += chunkSize) {
        chunks.push(buffer.slice(i, i + chunkSize));
      }

      // Send chunks sequentially with small delays
      for (const chunk of chunks) {
        await this.connectedPrinter.characteristic.writeValue(chunk);
        await this.delay(10); // Small delay between chunks
      }

    } catch (error) {
      console.error('Error sending data to printer:', error);
      throw new Error(`Failed to send data to printer: ${error}`);
    }
  }

  // Utility function for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get paper width based on configuration
  private getPaperWidth(config?: PrinterConfiguration): number {
    const paperSize = config?.paperSize || '80mm';
    return this.PAPER_CONFIGS[paperSize].width;
  }

  // Get font size category based on fontSize setting
  private getFontSizeCategory(config?: PrinterConfiguration): 'small' | 'medium' | 'large' | 'extraLarge' {
    const fontSize = config?.fontSize || 12;
    if (fontSize <= 10) {
      return 'small';
    } else if (fontSize <= 14) {
      return 'medium';
    } else if (fontSize <= 18) {
      return 'large';
    } else {
      return 'extraLarge';
    }
  }

  // Get maximum characters per line based on paper size and font size
  private getMaxCharsPerLine(config?: PrinterConfiguration): number {
    const paperSize = config?.paperSize || '80mm';
    const fontCategory = this.getFontSizeCategory(config);
    return this.PAPER_CONFIGS[paperSize].maxChars[fontCategory];
  }

  // Get print quality command
  private getPrintQualityCommand(config?: PrinterConfiguration): string {
    const quality = config?.printQuality || 'normal';
    switch (quality) {
      case 'draft':
        return this.COMMANDS.QUALITY_DRAFT;
      case 'high':
        return this.COMMANDS.QUALITY_HIGH;
      case 'normal':
      default:
        return this.COMMANDS.QUALITY_NORMAL;
    }
  }

  // Get font size command based on configuration and paper size
  private getFontSizeCommand(config?: PrinterConfiguration): string {
    const fontSize = config?.fontSize || 12;
    const paperSize = config?.paperSize || '80mm';
    
    // Adjust font size commands based on paper size for better utilization
    if (paperSize === '58mm') {
      // For smaller paper, use more compact fonts
      if (fontSize <= 8) {
        return this.COMMANDS.FONT_SIZE_SMALL;
      } else if (fontSize <= 12) {
        return this.COMMANDS.TEXT_NORMAL; // Use normal text for better readability
      } else if (fontSize <= 16) {
        return this.COMMANDS.FONT_SIZE_MEDIUM;
      } else {
        return this.COMMANDS.FONT_SIZE_LARGE;
      }
    } else if (paperSize === '80mm') {
      // Standard sizing for 80mm paper
      if (fontSize <= 10) {
        return this.COMMANDS.FONT_SIZE_SMALL;
      } else if (fontSize <= 14) {
        return this.COMMANDS.FONT_SIZE_MEDIUM;
      } else if (fontSize <= 18) {
        return this.COMMANDS.FONT_SIZE_LARGE;
      } else {
        return this.COMMANDS.FONT_SIZE_EXTRA_LARGE;
      }
    } else { // 112mm paper
      // Larger paper can accommodate larger fonts better
      if (fontSize <= 12) {
        return this.COMMANDS.FONT_SIZE_MEDIUM;
      } else if (fontSize <= 16) {
        return this.COMMANDS.FONT_SIZE_LARGE;
      } else {
        return this.COMMANDS.FONT_SIZE_EXTRA_LARGE;
      }
    }
  }

  // Get line spacing command based on configuration
  private getLineSpacingCommand(config?: PrinterConfiguration): string {
    const lineSpacing = config?.lineSpacing || 1.2;
    if (lineSpacing <= 1.0) {
      return this.COMMANDS.LINE_SPACING_NARROW;
    } else if (lineSpacing >= 2.0) {
      return this.COMMANDS.LINE_SPACING_WIDE;
    } else {
      return this.COMMANDS.LINE_SPACING_DEFAULT;
    }
  }

  // Get character spacing and density commands for optimal paper utilization
  private getCharacterOptimizationCommands(config?: PrinterConfiguration): string {
    const paperSize = config?.paperSize || '80mm';
    let commands = '';
    
    if (paperSize === '58mm') {
      // For 58mm paper, use compressed characters and tighter spacing for maximum utilization
      commands += this.COMMANDS.CHAR_WIDTH_COMPRESSED;      // Enable compressed characters
      commands += this.COMMANDS.CHAR_SPACING_TIGHT;         // Tight character spacing
      commands += this.COMMANDS.CHAR_DENSITY_HIGH;          // High character density
    } else if (paperSize === '80mm') {
      // For 80mm paper, use normal spacing
      commands += this.COMMANDS.CHAR_WIDTH_NORMAL;          // Normal character width
      commands += this.COMMANDS.CHAR_SPACING_NORMAL;        // Normal character spacing
      commands += this.COMMANDS.CHAR_DENSITY_NORMAL;        // Normal density
    } else { // 112mm paper
      // For 112mm paper, use wider spacing for better readability
      commands += this.COMMANDS.CHAR_WIDTH_NORMAL;          // Normal character width
      commands += this.COMMANDS.CHAR_SPACING_WIDE;          // Wider character spacing
      commands += this.COMMANDS.CHAR_DENSITY_NORMAL;        // Normal density
    }
    
    return commands;
  }

  // Format text to fit printer width (configurable based on paper size)
  private formatText(text: string, config?: PrinterConfiguration): string {
    const width = this.getMaxCharsPerLine(config);
    if (text.length <= width) {
      return text;
    }
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  // Center text
  private centerText(text: string, config?: PrinterConfiguration): string {
    const width = this.getMaxCharsPerLine(config);
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  // Right align text
  private rightAlignText(text: string, config?: PrinterConfiguration): string {
    const width = this.getMaxCharsPerLine(config);
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  }

  // Create justified line (label on left, value on right)
  private justifyLine(label: string, value: string, config?: PrinterConfiguration): string {
    const width = this.getMaxCharsPerLine(config);
    const totalLength = label.length + value.length;
    if (totalLength >= width) {
      return label + ' ' + value;
    }
    
    const padding = width - totalLength;
    return label + ' '.repeat(padding) + value;
  }

  // Print separator line
  private getSeparatorLine(config?: PrinterConfiguration, char: string = '-'): string {
    const width = this.getMaxCharsPerLine(config);
    return char.repeat(width);
  }

  // Generate reservation receipt data
  private generateReservationReceipt(reservation: Reservation, store: any, config?: PrinterConfiguration): string {
    let receipt = '';
    
    // Initialize printer
    receipt += this.COMMANDS.INIT;
    
    // Apply character optimization for paper size (critical for 58mm paper)
    receipt += this.getCharacterOptimizationCommands(config);
    
    // Apply print quality setting
    receipt += this.getPrintQualityCommand(config);
    
    // Apply line spacing setting
    receipt += this.getLineSpacingCommand(config);
    
    // Apply font size setting
    receipt += this.getFontSizeCommand(config);
    
    // Custom header text if provided
    if (config?.headerText) {
      receipt += this.COMMANDS.ALIGN_CENTER;
      receipt += this.COMMANDS.BOLD_ON;
      receipt += this.centerText(config.headerText, config) + '\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += '\n';
    }
    
    // Print logo if enabled and available
    if (config?.includeLogo) {
      // Try to print stored logo first, fallback to text logo
      try {
        receipt += this.COMMANDS.ALIGN_CENTER;
        receipt += this.COMMANDS.LOGO_COMMAND; // Print stored logo
        receipt += '\n\n';
      } catch (error) {
        // Fallback to text-based logo using hotel name if stored logo fails
        receipt += this.createTextLogo(store?.name || 'HOTEL', config);
        receipt += '\n';
      }
    }
    
    // Hotel header - all centered like POS version (only if logo is not enabled to avoid duplication)
    if (!config?.includeLogo) {
      receipt += this.COMMANDS.ALIGN_CENTER;
      receipt += this.COMMANDS.TEXT_DOUBLE_SIZE;
      receipt += this.COMMANDS.BOLD_ON;
      receipt += this.centerText(store?.name || 'HOTEL NAME', config) + '\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += this.COMMANDS.TEXT_NORMAL;
      receipt += this.getCharacterOptimizationCommands(config); // Reapply optimization
      receipt += this.getFontSizeCommand(config); // Reapply font size after normal command
    }
    
    // Center all contact information
    if (store?.contactInfo?.address) {
      receipt += this.centerText(this.formatText(store.contactInfo.address, config), config) + '\n';
    }
    if (store?.contactInfo?.phone) {
      receipt += this.centerText(`Tel: ${store.contactInfo.phone}`, config) + '\n';
    }
    if (store?.contactInfo?.email) {
      receipt += this.centerText(store.contactInfo.email, config) + '\n';
    }
    
    receipt += '\n';
    receipt += this.getSeparatorLine(config) + '\n';
    
    // Receipt title
    receipt += this.COMMANDS.ALIGN_CENTER;
    receipt += this.COMMANDS.TEXT_DOUBLE_HEIGHT;
    receipt += this.COMMANDS.BOLD_ON;
    receipt += this.centerText('RESERVATION DETAILS', config) + '\n';
    receipt += this.COMMANDS.BOLD_OFF;
    receipt += this.COMMANDS.TEXT_NORMAL;
    receipt += this.getCharacterOptimizationCommands(config); // Reapply optimization
    receipt += this.getFontSizeCommand(config); // Reapply font size
    receipt += this.getSeparatorLine(config) + '\n';
    
    // Reservation info
    receipt += this.COMMANDS.ALIGN_LEFT;
    receipt += this.COMMANDS.BOLD_ON;
    receipt += this.justifyLine('Confirmation:', reservation.confirmationNumber || 'N/A', config) + '\n';
    receipt += this.COMMANDS.BOLD_OFF;
    
    receipt += this.justifyLine('Status:', (reservation.status || 'unknown').toUpperCase(), config) + '\n';
    receipt += this.justifyLine('Booking Date:', this.formatDate(reservation.createdAt), config) + '\n';
    receipt += '\n';
    
    // Guest information
    receipt += this.COMMANDS.BOLD_ON;
    receipt += 'GUEST INFORMATION' + '\n';
    receipt += this.COMMANDS.BOLD_OFF;
    receipt += this.getSeparatorLine(config, '-') + '\n';
    
    const guest = typeof reservation.guest === 'object' ? reservation.guest : null;
    const guestName = guest?.firstName && guest?.lastName 
      ? `${guest.firstName} ${guest.lastName}`
      : 'Guest';
    receipt += this.justifyLine('Name:', guestName, config) + '\n';
    
    if (guest?.email) {
      receipt += `Email: ${guest.email}\n`;
    }
    if (guest?.phone) {
      receipt += `Phone: ${guest.phone}\n`;
    }
    
    const totalAdults = reservation.guestDetails?.totalAdults || 1;
    const totalChildren = reservation.guestDetails?.totalChildren || 0;
    receipt += this.justifyLine('Occupancy:', `${totalAdults} Adults, ${totalChildren} Children`, config) + '\n';
    receipt += '\n';
    
    // Stay information
    receipt += this.COMMANDS.BOLD_ON;
    receipt += 'STAY INFORMATION' + '\n';
    receipt += this.COMMANDS.BOLD_OFF;
    receipt += this.getSeparatorLine(config, '-') + '\n';
    
    receipt += this.justifyLine('Check-in:', this.formatDate(reservation.checkInDate), config) + '\n';
    receipt += this.justifyLine('Check-out:', this.formatDate(reservation.checkOutDate), config) + '\n';
    receipt += this.justifyLine('Nights:', (reservation.numberOfNights || 1).toString(), config) + '\n';
    
    if (reservation.expectedCheckInTime) {
      receipt += this.justifyLine('Check-in Time:', reservation.expectedCheckInTime, config) + '\n';
    }
    if (reservation.expectedCheckOutTime) {
      receipt += this.justifyLine('Check-out Time:', reservation.expectedCheckOutTime, config) + '\n';
    }
    receipt += '\n';
    
    // Room details
    receipt += this.COMMANDS.BOLD_ON;
    receipt += 'ROOM DETAILS' + '\n';
    receipt += this.COMMANDS.BOLD_OFF;
    receipt += this.getSeparatorLine(config, '-') + '\n';
    
    if (reservation.rooms && reservation.rooms.length > 0) {
      reservation.rooms.forEach((roomEntry: any, index: number) => {
        const room = roomEntry.room || {};
        const roomNumber = room.roomNumber || `Room ${index + 1}`;
        const roomType = typeof room.roomType === 'object' ? room.roomType?.name : room.roomType || 'Standard';
        const rate = room.priceOverride || room.rate || 0;
        
        receipt += `${roomNumber} (${room.name || roomType})\n`;
        receipt += this.justifyLine('Type:', roomType, config) + '\n';
        receipt += this.justifyLine('Rate/Night:', this.formatCurrency(rate, store?.currency), config) + '\n';
        
        if (roomEntry.guests) {
          receipt += this.justifyLine('Guests:', `${roomEntry.guests.adults || 1}A, ${roomEntry.guests.children || 0}C`, config) + '\n';
        }
        
        if (index < reservation.rooms.length - 1) {
          receipt += '\n';
        }
      });
    }
    receipt += '\n';
    
    // Pricing summary
    receipt += this.COMMANDS.BOLD_ON;
    receipt += 'PRICING SUMMARY' + '\n';
    receipt += this.COMMANDS.BOLD_OFF;
    receipt += this.getSeparatorLine(config, '=') + '\n';
    
    if (reservation.pricing) {
      if (reservation.pricing.subtotal) {
        receipt += this.justifyLine('Subtotal:', this.formatCurrency(reservation.pricing.subtotal, store?.currency), config) + '\n';
      }
      if (reservation.pricing.taxes) {
        receipt += this.justifyLine('Taxes:', this.formatCurrency(reservation.pricing.taxes, store?.currency), config) + '\n';
      }
      if (reservation.pricing.fees) {
        Object.entries(reservation.pricing.fees).forEach(([key, value]) => {
          if (value) {
            const feeLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            receipt += this.justifyLine(feeLabel + ':', this.formatCurrency(value as number, store?.currency), config) + '\n';
          }
        });
      }
      if (reservation.pricing.discounts?.amount) {
        receipt += this.justifyLine('Discount:', '-' + this.formatCurrency(reservation.pricing.discounts.amount, store?.currency), config) + '\n';
      }
      
      receipt += this.getSeparatorLine(config, '-') + '\n';
      receipt += this.COMMANDS.TEXT_DOUBLE_HEIGHT;
      receipt += this.COMMANDS.BOLD_ON;
      receipt += this.justifyLine('TOTAL:', this.formatCurrency(reservation.pricing.total || 0, store?.currency), config) + '\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += this.COMMANDS.TEXT_NORMAL;
      receipt += this.getCharacterOptimizationCommands(config); // Reapply optimization
      receipt += this.getFontSizeCommand(config); // Reapply font size
      
      receipt += this.justifyLine('Paid:', this.formatCurrency(reservation.pricing.paid || 0, store?.currency), config) + '\n';
      
      const balance = (reservation.pricing.balance || 0);
      const balanceLabel = balance > 0 ? 'BALANCE DUE:' : 'OVERPAID:';
      const balanceAmount = Math.abs(balance);
      
      if (balance !== 0) {
        receipt += this.COMMANDS.BOLD_ON;
        receipt += this.justifyLine(balanceLabel, this.formatCurrency(balanceAmount, store?.currency), config) + '\n';
        receipt += this.COMMANDS.BOLD_OFF;
      }
    }
    
    receipt += '\n';
    
    // Payment information
    if (reservation.paymentInfo) {
      receipt += this.COMMANDS.BOLD_ON;
      receipt += 'PAYMENT INFORMATION' + '\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += this.getSeparatorLine(config, '-') + '\n';
      
      receipt += this.justifyLine('Method:', (reservation.paymentInfo.method || 'N/A').toUpperCase(), config) + '\n';
      receipt += this.justifyLine('Status:', (reservation.paymentInfo.status || 'pending').toUpperCase(), config) + '\n';
      receipt += '\n';
    }
    
    // Special requests
    if (reservation.specialRequests) {
      receipt += this.COMMANDS.BOLD_ON;
      receipt += 'SPECIAL REQUESTS' + '\n';
      receipt += this.COMMANDS.BOLD_OFF;
      receipt += this.getSeparatorLine(config, '-') + '\n';
      receipt += this.formatText(reservation.specialRequests, config) + '\n';
      receipt += '\n';
    }
    
    // Footer
    receipt += this.getSeparatorLine(config, '=') + '\n';
    receipt += this.COMMANDS.ALIGN_CENTER;
    
    // Use custom footer text if provided, otherwise default
    const footerText = config?.footerText || 'Thank you for choosing us!\nHave a pleasant stay';
    const footerLines = footerText.split('\n');
    footerLines.forEach(line => {
      receipt += this.centerText(line.trim(), config) + '\n';
    });
    receipt += '\n';
    
    receipt += this.centerText('Printed: ' + this.formatDateTime(new Date()), config) + '\n';
    receipt += '\n\n';
    
    // Cut paper if autocut is enabled
    if (config?.autocut !== false) {
      receipt += this.COMMANDS.CUT_PAPER;
    }
    
    return receipt;
  }

  // Format date for printing
  private formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format date and time for printing
  private formatDateTime(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format currency for printing
  private formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  // Main method to print reservation
  async printReservation(reservation: Reservation, store: any, config?: PrinterConfiguration): Promise<void> {
    if (!this.isConnected()) {
      await this.connectToPrinter();
    }

    try {
      const receiptData = this.generateReservationReceipt(reservation, store, config);
      await this.sendToPrinter(receiptData);
      console.log('Reservation printed successfully');
    } catch (error) {
      console.error('Error printing reservation:', error);
      throw new Error(`Failed to print reservation: ${error}`);
    }
  }

  // Test print method
  async testPrint(config?: PrinterConfiguration): Promise<void> {
    if (!this.isConnected()) {
      await this.connectToPrinter();
    }

    try {
      let testData = '';
      testData += this.COMMANDS.INIT;
      
      // Apply character optimization for paper size
      testData += this.getCharacterOptimizationCommands(config);
      
      // Apply configuration settings
      testData += this.getPrintQualityCommand(config);
      testData += this.getLineSpacingCommand(config);
      testData += this.getFontSizeCommand(config);
      
      testData += this.COMMANDS.ALIGN_CENTER;
      testData += this.COMMANDS.TEXT_DOUBLE_SIZE;
      testData += this.COMMANDS.BOLD_ON;
      testData += this.centerText('TEST PRINT', config) + '\n';
      testData += this.COMMANDS.BOLD_OFF;
      testData += this.COMMANDS.TEXT_NORMAL;
      
      // Reapply character optimization after text normal command
      testData += this.getCharacterOptimizationCommands(config);
      testData += this.getFontSizeCommand(config); // Reapply font size
      
      testData += this.getSeparatorLine(config) + '\n';
      testData += this.centerText('Printer is working correctly', config) + '\n';
      testData += this.centerText(`Paper Size: ${config?.paperSize || '80mm'}`, config) + '\n';
      testData += this.centerText(`Print Quality: ${config?.printQuality || 'normal'}`, config) + '\n';
      testData += this.centerText(`Font Size: ${config?.fontSize || 12}px`, config) + '\n';
      testData += this.centerText(`Max Chars: ${this.getMaxCharsPerLine(config)}`, config) + '\n';
      testData += this.centerText(`Logo Enabled: ${config?.includeLogo ? 'Yes' : 'No'}`, config) + '\n';
      testData += this.centerText(new Date().toLocaleString(), config) + '\n';
      testData += '\n\n';
      
      // Cut paper if autocut is enabled
      if (config?.autocut !== false) {
        testData += this.COMMANDS.CUT_PAPER;
      }

      await this.sendToPrinter(testData);
      console.log('Test print completed successfully');
    } catch (error) {
      console.error('Error during test print:', error);
      throw new Error(`Test print failed: ${error}`);
    }
  }

  // Get connected device info
  getConnectedDeviceInfo(): { name: string; id: string } | null {
    if (this.connectedPrinter?.device) {
      return {
        name: this.connectedPrinter.device.name || 'Unknown Printer',
        id: this.connectedPrinter.device.id
      };
    }
    return null;
  }

  // Create a simple text-based logo from store name
  private createTextLogo(storeName: string, config?: PrinterConfiguration): string {
    if (!storeName) return '';
    
    let logo = '';
    logo += this.COMMANDS.ALIGN_CENTER;
    logo += this.COMMANDS.TEXT_DOUBLE_SIZE;
    logo += this.COMMANDS.BOLD_ON;
    
    // Create decorative border around store name
    const maxChars = this.getMaxCharsPerLine(config);
    const logoWidth = Math.min(storeName.length + 4, maxChars);
    const border = '='.repeat(logoWidth);
    
    logo += this.centerText(border, config) + '\n';
    logo += this.centerText(`  ${storeName}  `, config) + '\n';
    logo += this.centerText(border, config) + '\n';
    
    logo += this.COMMANDS.BOLD_OFF;
    logo += this.COMMANDS.TEXT_NORMAL;
    logo += this.getCharacterOptimizationCommands(config);
    logo += this.getFontSizeCommand(config);
    
    return logo;
  }
  async uploadLogo(logoData: string | ArrayBuffer): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      // Convert logo data to bytes if it's a base64 string
      let logoBytes: Uint8Array;
      
      if (typeof logoData === 'string') {
        // Assume base64 encoded image
        const base64Data = logoData.replace(/^data:image\/[a-z]+;base64,/, '');
        const binaryString = atob(base64Data);
        logoBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          logoBytes[i] = binaryString.charCodeAt(i);
        }
      } else {
        logoBytes = new Uint8Array(logoData);
      }

      // ESC/POS command to store logo in position 1
      const storeLogoCommand = new Uint8Array([
        0x1C, 0x71, 0x01, // Store logo command
        ...logoBytes
      ]);

      await this.sendToPrinter(storeLogoCommand);
      console.log('Logo uploaded to printer successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error(`Failed to upload logo: ${error}`);
    }
  }

  // Debug method to test paper utilization
  async testPaperUtilization(config?: PrinterConfiguration): Promise<void> {
    if (!this.isConnected()) {
      await this.connectToPrinter();
    }

    try {
      const maxChars = this.getMaxCharsPerLine(config);
      const paperSize = config?.paperSize || '80mm';
      
      let testData = '';
      testData += this.COMMANDS.INIT;
      testData += this.getCharacterOptimizationCommands(config);
      testData += this.getFontSizeCommand(config);
      
      testData += this.COMMANDS.ALIGN_CENTER;
      testData += this.COMMANDS.BOLD_ON;
      testData += this.centerText('PAPER UTILIZATION TEST', config) + '\n';
      testData += this.COMMANDS.BOLD_OFF;
      testData += this.getSeparatorLine(config) + '\n';
      
      testData += this.COMMANDS.ALIGN_LEFT;
      testData += `Paper Size: ${paperSize}\n`;
      testData += `Max Chars: ${maxChars}\n`;
      testData += `Font Size: ${config?.fontSize || 12}px\n`;
      testData += '\n';
      
      // Test full width utilization
      testData += 'Full width test:\n';
      testData += '|' + '='.repeat(maxChars - 2) + '|\n';
      testData += '|' + ' '.repeat(maxChars - 2) + '|\n';
      testData += '|' + '1234567890'.repeat(Math.floor((maxChars - 2) / 10)) + '123456789'.substring(0, (maxChars - 2) % 10) + '|\n';
      testData += '|' + '='.repeat(maxChars - 2) + '|\n';
      testData += '\n';
      
      testData += 'Character density test:\n';
      for (let i = 1; i <= 5; i++) {
        const lineChars = Math.floor(maxChars * i / 5);
        testData += `${i}/5: ${'#'.repeat(lineChars)}\n`;
      }
      
      testData += '\n';
      testData += 'Optimal for 58mm: 4/5 density\n';
      const optimalChars = Math.floor(maxChars * 4 / 5);
      testData += `Recommended: ${'*'.repeat(optimalChars)}\n`;
      
      testData += '\n\n';
      
      if (config?.autocut !== false) {
        testData += this.COMMANDS.CUT_PAPER;
      }

      await this.sendToPrinter(testData);
      console.log('Paper utilization test completed');
    } catch (error) {
      console.error('Error during paper utilization test:', error);
      throw new Error(`Paper utilization test failed: ${error}`);
    }
  }
}