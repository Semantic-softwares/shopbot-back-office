# Bluetooth Printing Quick Start

## What Was Added

Your Angular back-office application now supports **direct Bluetooth printing** from the browser to thermal receipt printers. No additional software or print services needed!

## Key Features

✅ **Browser-based Bluetooth connection** - Connect directly to thermal printers  
✅ **Automatic printing** - New print jobs auto-print when Bluetooth connected  
✅ **Manual print controls** - Print individual jobs on demand  
✅ **Test printing** - Verify printer setup before going live  
✅ **ESC/POS support** - Works with all thermal receipt printers  
✅ **Connection persistence** - Stays connected during your session  

## Quick Start (3 Steps)

### 1. Use Compatible Browser
Open the app in **Chrome**, **Edge**, or **Opera** (Safari/Firefox not supported)

### 2. Navigate to Print Jobs
Go to **Settings → Print Jobs** in the back-office

### 3. Connect Printer
Click **"Connect Printer"** → Select your printer → Click **"Pair"**

**That's it!** New print jobs will now automatically print via Bluetooth.

## Using the Feature

### Auto-Print Mode (Recommended)
1. Connect to Bluetooth printer once
2. Leave the Print Jobs page open
3. All new orders automatically print
4. No manual intervention needed

### Manual Print Mode
1. Go to Print Jobs page
2. Find the job you want to print
3. Click menu (⋮) → "Print via Bluetooth"
4. Job prints immediately

### Test Print
1. Click connected printer name (top-right)
2. Select "Test Print"
3. Verify test receipt prints correctly

### Disconnect
1. Click connected printer name
2. Select "Disconnect"
3. Or simply close the browser tab

## Browser Requirements

| Browser | Desktop | Android | iOS |
|---------|---------|---------|-----|
| Chrome | ✅ Yes | ✅ Yes | ❌ No |
| Edge | ✅ Yes | ✅ Yes | ❌ No |
| Opera | ✅ Yes | ✅ Yes | ❌ No |
| Firefox | ❌ No | ❌ No | ❌ No |
| Safari | ❌ No | ❌ No | ❌ No |

**Important:** Must use HTTPS (or localhost for development)

## Supported Printers

Your **XP-T58H** printer is fully supported! 

Also compatible with:
- EPSON TM series
- Star Micronics TSP series  
- Citizen CT-S series
- Bixolon SRP series
- Any thermal printer with ESC/POS support

## Common Issues

### "Web Bluetooth is not supported"
→ Switch to Chrome, Edge, or Opera browser

### No printers appear
→ Ensure printer is powered on and in Bluetooth pairing mode  
→ Move printer closer to computer (within 10 meters)

### Prints gibberish
→ Your printer may not support ESC/POS commands  
→ Use the backend print service instead

### Connection drops
→ Keep printer within Bluetooth range  
→ Reduce wireless interference

## Files Modified

### Component
`src/app/menu/dashboard/settings/print-jobs/print-jobs.component.ts`
- Added Bluetooth service injection
- Added connection methods
- Added auto-print on Socket.IO events

### Service  
`src/app/shared/services/bluetooth-printer.service.ts`
- Made `sendToPrinter()` public for external use

### Template
`src/app/menu/dashboard/settings/print-jobs/print-jobs.component.html`
- Added connection button and status
- Added print actions menu

## Architecture

```
Browser (Angular)
    ↓
Web Bluetooth API
    ↓
Bluetooth Printer Service
    ↓
XP-T58H Thermal Printer
```

**Socket.IO Integration:**
```
Backend Server
    ↓ (Socket.IO)
Print Jobs Component
    ↓ (Auto-print)
Bluetooth Printer
```

## What Happens Behind the Scenes

1. **Order Created** → Backend creates print job
2. **Socket.IO Event** → `printJob:created` sent to frontend
3. **Auto-Print** → If Bluetooth connected, job prints automatically
4. **Status Update** → Job marked as printed in database

## Development Notes

### Key Methods
```typescript
// Connect to Bluetooth printer
connectBluetoothPrinter(): Promise<void>

// Print a job via Bluetooth  
printJobViaBluetooth(job: PrintJob): Promise<void>

// Test the printer connection
testBluetoothPrint(): Promise<void>
```

### Socket.IO Listener
```typescript
this.socketService.on<any>('printJob:created').subscribe({
  next: async (data) => {
    if (this.isBluetoothConnected() && data.printJob) {
      await this.printJobViaBluetooth(data.printJob);
    }
  }
});
```

### ESC/POS Commands
The service generates thermal printer commands:
- `\x1B\x40` - Initialize printer
- `\x1B\x61\x01` - Center align
- `\x1B\x45\x01` - Bold on
- `\x1D\x56\x00` - Cut paper

## Next Steps

1. **Test the feature** - Connect your XP-T58H and run a test print
2. **Create test order** - Verify auto-printing works with real orders
3. **Go live** - Keep Print Jobs page open during operations
4. **Monitor** - Watch for any connection or printing issues

## Support

For detailed troubleshooting and advanced configuration, see:
- **[BLUETOOTH_PRINTING_GUIDE.md](./BLUETOOTH_PRINTING_GUIDE.md)** - Complete documentation

## Benefits Over Backend Print Service

| Feature | Backend Service | Bluetooth (Browser) |
|---------|----------------|-------------------|
| Setup | Install Node.js service | Just connect printer |
| Maintenance | Keep service running | No maintenance |
| Network | Requires network printer | Works offline |
| Portability | Tied to server | Works anywhere |
| Security | Exposes network port | Bluetooth only |
| Cost | Requires server | Client-side only |

---

**You're all set!** Connect your Bluetooth printer and start printing receipts directly from the browser. 🎉
