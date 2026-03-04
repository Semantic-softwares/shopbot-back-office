# Copilot Instructions Update Summary

## What Was Updated

**File**: `.github/copilot-instructions.md`

### Before
- 575 lines of generic Angular 20+ best practices
- Covered standards like standalone components, signals, reactive forms, Tailwind CSS
- No project-specific knowledge

### After  
- **914 lines** - Added 339 lines of ShopBot-specific architecture patterns
- Preserved all original Angular standards (first 575 lines intact)
- Added **Part 2-5** covering ShopBot-specific patterns

## Key Additions

### 1. **Multi-Tenant Store Context** (Part 1)
- How every operation is scoped to a store
- Store context is globally available and drives all business logic
- Reference to StoreStore for context management

### 2. **State Management with @ngrx/signals** (Part 2)
- Explains the signal store pattern (NOT traditional ngrx)
- Shows how to use `.withMethods()` for mutations
- Lists key stores: CartStore, OrderStore, TableStore, StoreStore
- Pattern: Don't mutate state directly, use store methods

### 3. **Real-Time Socket.IO - Global Pattern** (Part 3)
- Critical rule: Listeners registered ONLY in SocketService at connection time
- Prevents duplicate listeners on navigation
- Ensures persistence across entire app lifetime
- Print job event examples (created/completed/failed)

### 4. **Three-Tier Print System** (Part 4)
- Direct Bluetooth printing (synchronous)
- Backend print job queue (asynchronous)  
- Auto-print on order completion (socket-triggered)
- Explains validation requirements for auto-print

### 5. **UUID vs MongoDB ID** (Part 5)
- **Critical for integrations**: Channex uses UUIDs, PMS uses MongoDB IDs
- Shows correct matching pattern for room assignments
- Prevents data mismatch bugs between systems

### 6. **Cart & Order Workflow** (Part 6)
- State progression: Cart states and Order states
- Print jobs only trigger when order is Complete AND Paid
- Discount/delivery applied at cart level

### 7. **Common Anti-Patterns** (Part 7)
- 6 specific anti-patterns with correct alternatives
- Socket listeners in components (❌)
- Multiple printer state checks (❌)
- Direct store mutations (❌)
- Unguarded store access (❌)
- Component total calculations (❌)
- MongoDB ID for UUID lookups (❌)

### 8. **Build Commands & File Reference** (Parts 8-9)
- Dev/test/build/publish commands
- Quick lookup table for key files and their purposes

## How to Use

These instructions are designed for **AI coding agents** to be immediately productive:

1. **When creating new features**: Reference the pattern sections to follow project conventions
2. **When debugging issues**: Check the anti-patterns section - most bugs follow these patterns
3. **When modifying stores**: Reference Part 2 for the correct `.withMethods()` pattern
4. **When adding socket events**: Use Part 3 - register ONLY in SocketService, not components
5. **When implementing printing**: Reference Part 4 for the three-tier validation logic
6. **When working with HMS data**: Part 5 covers the UUID/MongoDB ID mismatch critical for Channex

## Sections That May Need Feedback

Please review these areas and let me know if anything needs clarification:

1. **Socket.IO Global Pattern** - Is the rule clear enough that listeners should NEVER be in components?
2. **UUID vs MongoDB ID** - Is the critical nature of this mismatch sufficiently emphasized?
3. **Print System Validation** - Are the four conditions for auto-print (complete + paid + setting + printer) clear enough?
4. **Store Context** - Should we add more examples of null-checking patterns?
5. **Anti-Patterns** - Are there other common mistakes that should be documented?

## Files Referenced

The guide references 30+ key files in the codebase:
- Stores: CartStore, OrderStore, TableStore, StoreStore, ProductStore, HotelStore
- Services: SocketService, PrintJobService, BluetoothPrinterService
- Modules: POS, HMS, ERP
- Components: MenuComponent, CartComponent, TablesComponent, AssignRoomDialog

All with direct links to their locations in the codebase.
