# Bluetooth Printing Guide - Angular Frontend

This guide explains how to use the Bluetooth printing feature in the ShopBot back-office application.

## Overview

The application now supports direct Bluetooth printing from the browser to thermal receipt printers using the Web Bluetooth API. This eliminates the need for a separate print service for Bluetooth printers.

## Browser Requirements

### Supported Browsers
- ✅ **Chrome** (Desktop & Android) - Version 56+
- ✅ **Edge** (Desktop & Android) - Version 79+
- ✅ **Opera** (Desktop & Android) - Version 43+
- ✅ **Samsung Internet** - Version 6.0+

### Unsupported Browsers
- ❌ **Firefox** (No Web Bluetooth support)
- ❌ **Safari** (No Web Bluetooth support on macOS/iOS)
- ❌ **Internet Explorer**

### Security Requirements
- **HTTPS Required** - Web Bluetooth only works on HTTPS websites (or localhost for development)
- User must grant Bluetooth permission when prompted
- Website must be in a secure context

## Features

### 1. **Bluetooth Printer Connection**
- Connect to any Bluetooth thermal printer that supports ESC/POS commands
- Visual connection status indicator
- Auto-reconnection capability
- Connection persists during session

### 2. **Automatic Print Job Processing**
- When connected, new print jobs automatically print via Bluetooth
- No manual intervention needed for each print job
- Real-time Socket.IO integration

### 3. **Manual Print Controls**
- Print individual jobs on demand
- Test print functionality
- Retry failed jobs
- Cancel pending jobs

### 4. **Receipt Formatting**
- ESC/POS command generation
- Configurable paper sizes (58mm, 80mm, 112mm)
- Adjustable font sizes and line spacing
- Print quality settings (draft, normal, high)
- Auto-cut support

## How to Use

### Step 1: Navigate to Print Jobs Page

1. Log in to the back-office application
2. Go to **Settings → Print Jobs**
3. The page will automatically detect if your browser supports Bluetooth

### Step 2: Connect to Bluetooth Printer

1. Click the **"Connect Printer"** button in the top-right corner
2. A browser dialog will appear showing available Bluetooth devices
3. Select your thermal printer from the list
4. Click **"Pair"** to establish connection

**Supported Printer Prefixes:**
- `POS-*` (Generic POS printers)
- `Printer-*` (Generic printers)
- `EPSON-*` (Epson printers)
- `STAR-*` (Star Micronics printers)
- `Citizen-*` (Citizen printers)
- `XP-*` (Xprinter models like XP-T58H)

### Step 3: Test the Connection

1. Once connected, click the printer name button (shows connected printer)
2. Select **"Test Print"** from the dropdown menu
3. Verify that a test receipt prints correctly

### Step 4: Automatic Printing

Once connected, all new print jobs will automatically print to the Bluetooth printer:

1. Create an order in the POS system
2. When the order is submitted, a print job is created
3. The print job automatically sends to your connected Bluetooth printer
4. You'll see a success notification

### Step 5: Manual Printing

To manually print a specific job:

1. Find the job in the print jobs list
2. Click the **menu icon** (⋮) in the Actions column
3. Select **"Print via Bluetooth"**
4. The job will immediately print

## Printer Configuration

### Default Settings
```typescript
{
  paperSize: '80mm',        // 58mm, 80mm, or 112mm
  printQuality: 'normal',   // draft, normal, or high
  autocut: true,            // Auto-cut after printing
  fontSize: 12,             // Font size in pixels
  lineSpacing: 1.2,         // Line spacing multiplier
  includeLogo: false        // Print logo (if available)
}
```

### Customizing Settings
To customize printer settings, modify the configuration in the `testBluetoothPrint()` method in the component or extend the service to support configuration UI.

## Receipt Format

### Print Job Receipt Structure
```
================================
        KITCHEN ORDER
================================
Order: #12345
Station: Kitchen
Time: Dec 15, 2024 10:30 AM
Table: 5
================================
ITEMS:
2x Burger
   Note: No onions
1x French Fries
================================
     Total Items: 3

[Cut Paper]
```

## Troubleshooting

### Connection Issues

**Problem:** "Web Bluetooth is not supported"
- **Solution:** Use Chrome, Edge, or Opera browser
- **Alternative:** Ensure you're using the latest browser version

**Problem:** No printers appear in the pairing dialog
- **Solution 1:** Ensure printer is powered on and in pairing mode
- **Solution 2:** Check if printer is already paired with another device
- **Solution 3:** Move printer closer to computer (Bluetooth range ~10m)
- **Solution 4:** Restart printer and try again

**Problem:** "Failed to connect: NotFoundError"
- **Solution:** Your printer may not support the standard printer service UUID
- **Workaround:** The service will automatically try alternative UUIDs

### Printing Issues

**Problem:** Printer prints gibberish or random characters
- **Solution:** Your printer may not support ESC/POS commands
- **Check:** Verify printer supports thermal receipt printing
- **Alternative:** Use the backend print service instead

**Problem:** Print is cut off or formatting is wrong
- **Solution:** Adjust paper size setting to match your printer (58mm, 80mm, 112mm)
- **Code Location:** Update `paperSize` in printer configuration

**Problem:** Printer doesn't cut paper automatically
- **Solution:** Set `autocut: true` in printer configuration
- **Note:** Some printers don't support auto-cut

**Problem:** Print fails with "writeValue" error
- **Solution:** Printer characteristic may not support writing
- **Check:** Ensure printer is in receive mode
- **Workaround:** Reconnect to printer

### Performance Issues

**Problem:** Printing is slow
- **Solution 1:** Change `printQuality` to `'draft'`
- **Solution 2:** Reduce chunk delay in service (currently 10ms)
- **Solution 3:** Increase chunk size (currently 20 bytes) - may cause issues on some printers

**Problem:** Connection drops frequently
- **Solution 1:** Keep printer within Bluetooth range
- **Solution 2:** Remove obstacles between computer and printer
- **Solution 3:** Reduce wireless interference (WiFi, other Bluetooth devices)

## Technical Details

### Web Bluetooth API
The application uses the Web Bluetooth API to communicate directly with printers:

```typescript
// Request device
const device = await navigator.bluetooth.requestDevice({
  filters: [{ services: [PRINTER_SERVICE_UUID] }],
  optionalServices: [...]
});

// Connect to GATT server
const server = await device.gatt.connect();

// Get service and characteristic
const service = await server.getPrimaryService(SERVICE_UUID);
const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

// Write data
await characteristic.writeValue(data);
```

### ESC/POS Commands
Common commands used for thermal printing:

| Command | Hex | Description |
|---------|-----|-------------|
| Initialize | `\x1B\x40` | Reset printer |
| Align Center | `\x1B\x61\x01` | Center text |
| Align Left | `\x1B\x61\x00` | Left align text |
| Bold On | `\x1B\x45\x01` | Enable bold |
| Bold Off | `\x1B\x45\x00` | Disable bold |
| Double Size | `\x1B\x21\x30` | Double width & height |
| Cut Paper | `\x1D\x56\x00` | Full cut |
| Feed Line | `\x0A` | Line feed |

### Data Transmission
- Data is split into 20-byte chunks (Bluetooth MTU limitation)
- 10ms delay between chunks prevents buffer overflow
- Text is encoded as UTF-8 for international character support

## Development

### Files Modified

#### Component
- **Path:** `src/app/menu/dashboard/settings/print-jobs/print-jobs.component.ts`
- **Changes:** 
  - Added Bluetooth service injection
  - Added connection state management
  - Added connect/disconnect methods
  - Added print job via Bluetooth method
  - Added auto-print on Socket.IO events
  - Added test print functionality

#### Service
- **Path:** `src/app/shared/services/bluetooth-printer.service.ts`
- **Changes:**
  - Made `sendToPrinter()` method public
  - Existing ESC/POS command generation
  - Paper size configurations
  - Connection management

#### Template
- **Path:** `src/app/menu/dashboard/settings/print-jobs/print-jobs.component.html`
- **Changes:**
  - Added Bluetooth connection button
  - Added connection status display
  - Added printer menu with test/disconnect
  - Added print action in jobs menu

### Key Methods

```typescript
// Connect to printer
connectBluetoothPrinter(): Promise<void>

// Disconnect from printer
disconnectBluetoothPrinter(): Promise<void>

// Print a job via Bluetooth
printJobViaBluetooth(job: PrintJob): Promise<void>

// Test print
testBluetoothPrint(): Promise<void>

// Generate receipt data
generatePrintJobReceipt(job: PrintJob): string
```

### Socket.IO Integration

The component listens for `printJob:created` events:

```typescript
this.socketService.on<any>('printJob:created').subscribe({
  next: async (data) => {
    // Auto-print if Bluetooth connected
    if (this.isBluetoothConnected() && data.printJob) {
      await this.printJobViaBluetooth(data.printJob);
    }
  }
});
```

## Best Practices

### 1. Connection Management
- **Connect once** at the start of your shift
- **Keep printer powered** throughout the day
- **Reconnect** if connection drops
- **Disconnect** when closing the application

### 2. Testing
- **Test print** after connecting to verify setup
- **Test with sample order** before going live
- **Monitor print jobs** page for any failures

### 3. Backup Plan
- Keep the backend print service running as backup
- Have a network printer configured as fallback
- Keep thermal paper rolls stocked

### 4. Security
- Only connect to **trusted printers**
- Don't connect to unknown Bluetooth devices
- Ensure **HTTPS** is enabled in production

## Support for Different Printers

### XP-T58H (Your Printer)
- **Connection:** Bluetooth mode
- **Paper Size:** 58mm
- **ESC/POS:** Full support
- **Auto-cut:** Supported
- **Setup:** Turn on → Enable Bluetooth → Pair

### Generic Thermal Printers
Most thermal receipt printers support ESC/POS commands:
- **EPSON TM series** - Full support
- **Star Micronics TSP series** - Full support
- **Citizen CT-S series** - Full support
- **Bixolon SRP series** - Full support

### Unsupported Printers
- Inkjet printers (not Bluetooth LE compatible)
- Laser printers (don't support ESC/POS)
- Label printers (different command set)

## Future Enhancements

Planned features for future versions:

1. **Printer Configuration UI**
   - Adjust paper size from UI
   - Change font sizes
   - Toggle auto-cut

2. **Multiple Printer Support**
   - Connect to multiple printers
   - Route jobs to specific printers
   - Save printer preferences

3. **Print Preview**
   - Preview receipt before printing
   - Edit job details
   - Customize format

4. **Print History**
   - Track all prints
   - Reprint previous jobs
   - Export print logs

5. **Logo Upload**
   - Upload custom logo
   - Store in printer memory
   - Include in receipts

## Conclusion

The Bluetooth printing feature provides a seamless, wireless printing solution for your back-office application. By leveraging the Web Bluetooth API, you can print directly from the browser without additional software or services.

For issues or questions, please refer to the troubleshooting section or contact support.

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Compatible Browsers:** Chrome 56+, Edge 79+, Opera 43+
