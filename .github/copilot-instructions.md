# Angular 20+ Development Guidelines for GitHub Copilot

This document outlines the standards and best practices for Angular 20+ development in this project. Copilot should always follow these guidelines when generating code.

## Core Principles

- **Standalone Components**: All components must use the `standalone: true` pattern
- **Signals-Based State**: Use Angular signals for state management
- **Strict TypeScript**: Maintain strict type checking at all times
- **Minimal Templates**: Move complex logic out of templates
- **Component Composition**: Build reusable, focused components

## Component Architecture

### 1. Standalone Components (Required)

All components MUST be standalone:

```typescript
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, MatButtonModule, /* other modules */],
  templateUrl: './feature.html',
  styleUrl: './feature.scss',
})
export class FeatureComponent {}
```

**Key Rules:**
- ✅ Always set `standalone: true`
- ✅ Explicitly import all dependencies in the `imports` array
- ✅ Use `templateUrl` and `styleUrl` (never embed in template)
- ✅ Never use `NgModules` - use standalone pattern instead

### 2. Template vs. Component Files

**REQUIRED: All templates must be separate files**

❌ **DO NOT:**
```typescript
@Component({
  template: `<div>...</div>` // FORBIDDEN
})
```

✅ **DO:**
```typescript
@Component({
  templateUrl: './component.html',
  styleUrl: './component.scss',
})
```

**File Structure:**
```
component/
  ├── component.ts
  ├── component.html
  ├── component.scss
  └── component.spec.ts
```

### 3. Change Detection Strategy

All components MUST use `OnPush` strategy:

```typescript
@Component({
  selector: 'app-feature',
  // ... other options
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureComponent {}
```

**Benefits:**
- Better performance
- More predictable change detection
- Encourages proper reactive patterns

## State Management

### 1. Signals (Primary Pattern)

Use Angular signals for local component state:

```typescript
export class MyComponent {
  private count = signal(0);
  readonly count$ = this.count.asReadonly();

  increment() {
    this.count.update(v => v + 1);
  }
}
```

**Signal Rules:**
- ✅ Use `signal()` for state initialization
- ✅ Use `update()` to modify state
- ✅ Use `set()` for direct assignment
- ✅ Export readonly versions with `asReadonly()`
- ❌ Never use `mutate()` on signals

### 2. Computed Values

Use `computed()` for derived state:

```typescript
readonly doubleCount = computed(() => this.count() * 2);
readonly hasItems = computed(() => this.items().length > 0);
```

### 3. Resource Loading (rxResource)

Use `rxResource` for API calls:

```typescript
import { resource } from '@angular/core';

export class MyComponent {
  protected dataResource = resource({
    loader: () => this.apiService.getData(),
  });

  get isLoading() { return this.dataResource.isLoading(); }
  get error() { return this.dataResource.error(); }
  get value() { return this.dataResource.value(); }
}
```

**Benefits:**
- Automatic loading/error/value state
- No manual subscription handling
- Proper cleanup on destroy

## Dependency Injection

### 1. Use `inject()` Function

Always use the `inject()` function:

```typescript
export class MyComponent {
  private http = inject(HttpClient);
  private service = inject(MyService);
  private router = inject(Router);
}
```

**DO NOT use constructor injection:**
```typescript
// ❌ FORBIDDEN
constructor(private http: HttpClient) {}
```

### 2. Service Creation

Create singleton services with `providedIn: 'root'`:

```typescript
@Injectable({
  providedIn: 'root',
})
export class MyService {
  private http = inject(HttpClient);
}
```

## Templates

### 1. Control Flow (@if, @for, @switch)

Use native control flow:

```html
<!-- ✅ Correct -->
@if (condition) {
  <div>Content</div>
} @else {
  <div>Alternative</div>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

<!-- ❌ Never use -->
<div *ngIf="condition">Content</div>
<div *ngFor="let item of items">{{ item }}</div>
```

### 2. Event Binding

Use parentheses for event binding:

```html
<button (click)="onClick()">Click me</button>
<input (change)="onValueChange($event)">
```

### 3. Two-Way Binding (Avoid)

Minimize two-way binding:

```html
<!-- ❌ Avoid -->
<input [(ngModel)]="value">

<!-- ✅ Use reactive approach -->
<input [value]="value()" (change)="value.set($event.target.value)">
```

### 4. Pipes

Always use pipes for formatting:

```html
<p>{{ price | currency }}</p>
<p>{{ date | date: 'MMMM d, y' }}</p>
<p>{{ value | number: '1.2-2' }}</p>
<p>{{ text | uppercase }}</p>
```

**Never format in component:**
```typescript
// ❌ FORBIDDEN
getFormattedDate() { return this.date.toLocaleDateString(); }

// ✅ Use in template
{{ date | date: 'MMMM d, y' }}
```

## Forms

### 1. Reactive Forms Required

Always use Reactive Forms:

```typescript
export class MyComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  onSubmit() {
    if (this.form.valid) {
      // Process form data
    }
  }
}
```

### 2. Template Forms (Forbidden)

Never use template-driven forms:

```html
<!-- ❌ FORBIDDEN -->
<input [(ngModel)]="email">
```

## TypeScript Standards

### 1. Strict Mode (Required)

All TypeScript must use strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### 2. Type Annotations

Always provide explicit types:

```typescript
// ✅ Correct
private count = signal<number>(0);
private items = signal<Item[]>([]);

function calculate(a: number, b: number): number {
  return a + b;
}

// ❌ Avoid implicit any
private count = signal(0); // Type is inferred, but be explicit for signals
```

### 3. Return Types

Always specify return types:

```typescript
// ✅ Correct
getUser(id: number): Observable<User> {
  return this.http.get<User>(`/api/users/${id}`);
}

// ❌ Avoid
getUser(id: number) {
  return this.http.get(`/api/users/${id}`);
}
```

## Styling

### 1. Tailwind CSS

Use Tailwind CSS for styling:

```html
<div class="flex items-center gap-4 p-6 border border-gray-200 rounded-lg">
  <span class="text-sm text-gray-600">Label</span>
  <span class="font-semibold text-gray-900">Value</span>
</div>
```

### 2. Component Styles (Minimal)

Keep component styles minimal; use Tailwind:

```scss
// component.scss - Keep minimal
:host {
  display: block;
}
```

### 3. Avoid Global Styles

Never style globally; keep styles scoped to components.

## Imports & Exports

### 1. Module Imports in Components

Always import what you need in `imports` array:

```typescript
@Component({
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MySharedComponent,
  ],
})
```

### 2. Named Exports

Always use named exports:

```typescript
// ✅ Correct
export class MyComponent {}
export const CONSTANT = 'value';

// ❌ Avoid default exports
export default class MyComponent {}
```

## Naming Conventions

### 1. Component Files

- Component class: `PascalCase` (e.g., `MyComponent`)
- Component selector: `kebab-case` (e.g., `app-my-component`)
- File names: `kebab-case.component.ts` (e.g., `my-component.ts`)

### 2. Methods & Properties

- Public methods: `camelCase` (e.g., `onClick()`)
- Private fields: `private` prefix with `camelCase` (e.g., `private itemCount`)
- Signal properties: `camelCase` (e.g., `count`, `items`)
- Readonly signals: `readonly` prefix (e.g., `readonly count$`)

### 3. Service Methods

```typescript
export class MyService {
  // Queries (Observables)
  getUsers(): Observable<User[]> {}

  // Mutations (Observables)
  createUser(user: User): Observable<User> {}

  // Sync operations
  formatDate(date: Date): string {}
}
```

## Error Handling

### 1. Proper Error Handling

Always handle errors in subscriptions:

```typescript
this.service.getData().subscribe({
  next: (data) => {
    this.data.set(data);
  },
  error: (error) => {
    console.error('Failed to load data:', error);
    this.error.set(error.message);
  },
  complete: () => {
    this.isLoading.set(false);
  }
});
```

### 2. Optional Chaining

Use optional chaining and nullish coalescing:

```typescript
// ✅ Correct
const name = user?.profile?.name ?? 'Unknown';

// ❌ Avoid
const name = user && user.profile && user.profile.name || 'Unknown';
```

## Accessibility

### 1. ARIA Attributes

Always include proper ARIA attributes:

```html
<button 
  aria-label="Close dialog"
  aria-pressed="false"
  (click)="close()"
>
  ✕
</button>
```

### 2. Semantic HTML

Use semantic HTML elements:

```html
<!-- ✅ Correct -->
<nav>Navigation content</nav>
<main>Main content</main>
<footer>Footer content</footer>
<article>Article content</article>

<!-- ❌ Avoid -->
<div id="nav">Navigation</div>
<div id="main">Main</div>
```

### 3. Keyboard Support

All interactive elements must support keyboard navigation:

```html
<button (click)="action()" (keydown.enter)="action()">Action</button>
```

## Testing

### 1. Component Testing

Create unit tests for all components:

```typescript
describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [MyService],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Performance

### 1. OnPush Change Detection

Always use `ChangeDetectionStrategy.OnPush`:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### 2. trackBy with @for

Always provide `track` function in loops:

```html
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

### 3. Lazy Load Routes

Use lazy loading for feature modules:

```typescript
const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component')
      .then(m => m.AdminComponent),
  },
];
```

## Common Pitfalls

### ❌ DON'T:
- Embed HTML templates in component decorators
- Use constructor injection instead of `inject()`
- Mix signals with RxJS subjects
- Use `any` type
- Mutate signals directly
- Use global styles
- Create two-way bindings
- Use `*ngIf` instead of `@if`
- Forget `track` in `@for` loops
- Make components non-standalone

### ✅ DO:
- Separate templates into `.html` files
- Use `inject()` function
- Use signals for state
- Provide explicit types
- Use `update()` or `set()` on signals
- Use Tailwind CSS
- Use reactive forms
- Use native control flow
- Include `track` function
- Always use standalone components

## Resources

- [Angular Official Docs](https://angular.io/docs)
- [Angular Signals Guide](https://angular.io/guide/signals)
- [Angular Best Practices](https://angular.io/guide/styleguide)
- [Standalone Components](https://angular.io/guide/standalone-components)
# ShopBot Back-Office: Complete AI Development Guide

## Part 1: Angular 20+ Standards (General Guidelines)

See existing [copilot-instructions.md](./copilot-instructions.md) for:
- Standalone components with `standalone: true`
- Signal-based state with `signal()`, `computed()`, `update()`, `set()`
- OnPush change detection strategy
- Reactive forms (no two-way binding)
- Tailwind CSS + Material Design
- `inject()` for dependencies
- Native control flow (`@if`, `@for`, `@switch`)

---

## Part 2: ShopBot Project-Specific Architecture

### Multi-Tenant Store Context

Every operation is **scoped to a store**. Access store context everywhere:

```typescript
private storeStore = inject(StoreStore);

// Current store
const storeId = this.storeStore.selectedStore()?._id;
const settings = this.storeStore.selectedStore()?.posSettings;

// Store config is ALWAYS available
// It drives: currency, receipt settings, printer config, features
```

**File**: [StoreStore](src/app/shared/stores/store.store.ts)

### Three Modules with Role-Based Access

- **ERP** - Inventory, products, suppliers, orders (general)
- **HMS** - Hotel reservations, rooms, guests, housekeeping
- **POS** - Point of sale, kitchen orders, table management

Each has its own routing under `src/app/menu/`. Module access controlled via role-based permissions.

### State Management: @ngrx/signals

**NOT traditional ngrx**. Uses signal stores with computed properties and methods:

```typescript
export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ carts, selectedCart }) => ({
    cartCount: computed(() => carts().length),
    selectedProducts: computed(() => selectedCart()?.products || []),
  })),
  withMethods((store) => ({
    selectCart: (cart: Cart) => patchState(store, { selectedCart: cart }),
    addProduct: (product: Product) => { /* mutation */ },
  }))
);

// Usage
private store = inject(CartStore);
readonly products = this.store.selectedProducts;  // Already a signal
this.store.selectCart(newCart);  // Call method directly
```

**Key Stores**: CartStore, OrderStore, TableStore, ProductStore, HotelStore

**Rule**: All mutations go through `.withMethods()` functions, never direct state mutation.

### Real-Time Socket.IO Events (Global Pattern)

**Socket listeners are registered in SocketService at connection time**, not in components. This ensures:
- No duplicate listeners on navigation
- Listeners persist across entire app lifetime
- Singleton pattern prevents subscription leaks

```typescript
// In SocketService - setup ONCE when socket connects
private setupGlobalPrintJobListeners(): void {
  this.socket?.on('printJob:created', (data) => {
    // Auto-print logic
    this.printJobService.handleAutoPrint(data);
    // Snackbar notification
    this.snackBar.open('Print job created', ...);
  });
}

// In ANY component - just use the service
const printJobs$ = this.socketService.on('printJob:created');  // Observable
```

**File**: [SocketService](src/app/shared/services/socket.service.ts)

**Event Examples**:
- `printJob:created` - Print job generated (with full order data)
- `printJob:completed` - Printer sent receipt successfully
- `printJob:failed` - Print failed, reason in error field

### Three-Tier Print System

#### 1. Direct Bluetooth (When Printer Connected)
```typescript
// In component or service
const receiptData = printJobService.generateOrderReceipt(order);
await bluetoothPrinterService.sendToPrinter(receiptData);
```

#### 2. Backend Print Job Queue (No Printer)
```typescript
// Backend creates job, print-service app polls and prints
const result = await printJobService.createPrintJobsForOrder(order).toPromise();
```

#### 3. Auto-Print on Order Completion (Triggered by Socket)
```typescript
// Validates ALL conditions before printing:
// - Order.category === 'Complete'
// - Order.paymentStatus === 'Paid'
// - store.posSettings.receiptSettings.printAfterFinish === true
// - Bluetooth printer is connected
// Only prints if ALL pass
await printJobService.handleAutoPrint(socketData);
```

**Files**:
- Receipt generation: [PrintJobService.generateOrderReceipt()](src/app/shared/services/print-job.service.ts#L60)
- Auto-print logic: [PrintJobService.handleAutoPrint()](src/app/shared/services/print-job.service.ts#L525)
- Bluetooth: [BluetoothPrinterService](src/app/shared/services/bluetooth-printer.service.ts)

### Receipt Settings (Store Configuration)

Store controls all printing behavior:

```typescript
store.posSettings.receiptSettings = {
  printAfterFinish: true,       // Enable auto-print
  showStoreDetails: true,       // Header with store name
  showCustomerName: true,       // Guest or customer info
  showSellerInfo: true,         // Staff/server name
  showTax: true,
  showNote: false,
  footerMessage: 'Thank you for your patronage',
  disclaimer: 'Keep receipt for warranty'
}

// Check in code
const printAfterFinish = store?.posSettings?.receiptSettings?.printAfterFinish ?? true;
```

**Always null-check** settings with optional chaining + nullish coalescing.

### Critical: UUID vs MongoDB ID

**Channex integration uses UUIDs, PMS uses MongoDB IDs. They don't match.**

```typescript
// PMS Room Type
roomType._id              // "507f1f77bcf86cd799439011" (MongoDB)

// Channex Booking Reference
room.room_type_id         // "550e8400-e29b-41d4-a716-446655440000" (UUID)

// Correct matching
const pmsType = roomTypes.find(
  (type) => (type.id || type.attributes?.id) === channexUUID  // UUID comparison
);

// In RoomType assignment
const channexId = roomType.channexRoomTypeId || roomType._id;  // Prefer UUID
```

**When**: Room assignment, booking relationship matching, availability checking
**File**: [AssignRoomDialog](src/app/menu/hms/front-desk/reservations/reservation-view/live-booking-details/assign-room-dialog/)

### Cart & Order Workflow

**Cart states**: New → Active → Pending (paused) → Finalized (checkout complete)

**Order states**: Pending → Confirmed → In Kitchen → Complete → [Must pay] → Closed

```typescript
// Print jobs only trigger when BOTH conditions met
if (order.category === 'Complete' && order.paymentStatus === 'Paid') {
  // Now eligible for auto-print
}
```

**Discounts & Delivery**: Applied at cart level, affect subtotal calculation before checkout.

**Files**: CartStore, OrderStore

### Accessibility & Semantic HTML

Always include:
- ARIA labels on buttons: `aria-label="Close dialog"`
- Semantic tags: `<nav>`, `<main>`, `<article>`
- Keyboard support: `(click)` + `(keydown.enter)` handlers

---

## Part 3: Common Pitfalls & Anti-Patterns

### Socket Listeners (❌ DON'T)
```typescript
// ❌ WRONG - Creates duplicate listeners on every component visit
ngOnInit() {
  this.socketService.on('event').subscribe(...);  // Fires multiple times!
}

// ✅ RIGHT - Register in SocketService once
// Listen globally anywhere
this.socketService.on('event').subscribe(...);
```

### Bluetooth Printer (❌ DON'T)
```typescript
// ❌ WRONG - Printer may disconnect between checks
if (isConnected()) { /* ... */ }
if (isConnected()) { /* ... */ }  // May be false now!

// ✅ RIGHT - Single check, handle failures
const connected = bluetoothPrinterService.isConnected();
if (!connected) {
  // Create backend job instead
  return createPrintJobsForOrder(order);
}
```

### Cart Mutations (❌ DON'T)
```typescript
// ❌ WRONG - Direct mutation of signal value
cartStore.selectedCart().products.push(newProduct);  // Won't trigger updates

// ✅ RIGHT - Use store methods
cartStore.addProductToCart(newProduct);
// or manually
patchState(cartStore, { 
  selectedCart: { ...cart, products: [...cart.products, newProduct] } 
});
```

### Store Context (❌ DON'T)
```typescript
// ❌ WRONG - Doesn't work, store might be null
const id = this.storeStore.selectedStore()._id;  // Crash if null

// ✅ RIGHT - Null-safe
const id = this.storeStore.selectedStore()?._id;
const currency = this.storeStore.selectedStore()?.currencyCode || 'NGN';
```

### Order Totals (❌ DON'T)
```typescript
// ❌ WRONG - Calculated in component, gets stale
const total = order.subtotal - order.discount + order.tax;

// ✅ RIGHT - Use computed signal from store or passed from backend
readonly orderTotal = computed(() => this.orderStore.selectedOrder()?.total);
```

### Room Assignment (❌ DON'T)
```typescript
// ❌ WRONG - Using MongoDB ID instead of UUID
const room = findBy(rooms, '_id', booking.room_type_id);

// ✅ RIGHT - Use UUID for matching
const room = findBy(rooms, 'channexRoomTypeId', booking.room_type_id);
```

### Guest Creation (❌ DON'T)
```typescript
// ❌ WRONG - dateOfBirth is required but missing
const guest = { name: 'John', phone: '123' };  // Will fail validation

// ✅ RIGHT - Generate random DOB if not provided
const guest = { 
  name: 'John', 
  phone: '123',
  dateOfBirth: getRandomDateOfBirth(18, 70)  // Required field
};
```

---

## Part 4: Build & Deployment

```bash
# Development
npm start              # localhost:4200, auto-reload

# Testing
npm test              # Karma test runner

# Production build
npm run build         # Generates dist/shopbot-back-office/

# Deploy to GitHub Pages
npm run publish       # Builds + deploys to office.shopbot.africa
```

---

## Part 5: Critical File Map

| Task | File(s) |
|------|---------|
| Add new store | `src/app/shared/stores/new.store.ts` |
| Add socket event listener | [SocketService](src/app/shared/services/socket.service.ts) |
| Print functionality | [PrintJobService](src/app/shared/services/print-job.service.ts) |
| Bluetooth printer control | [BluetoothPrinterService](src/app/shared/services/bluetooth-printer.service.ts) |
| Store-wide settings | [StoreStore](src/app/shared/stores/store.store.ts) |
| Cart management | [CartStore](src/app/shared/stores/cart.store.ts), [cart.component.ts](src/app/shared/components/cart/) |
| Order workflow | [OrderStore](src/app/shared/stores/order.store.ts) |
| Table management | [TableStore](src/app/shared/stores/table.store.ts), [tables.component.ts](src/app/menu/pos/tables/) |
| POS module | [src/app/menu/pos/](src/app/menu/pos/) |
| HMS module | [src/app/menu/hms/](src/app/menu/hms/) |
| ERP module | [src/app/menu/erp/](src/app/menu/erp/) |
| Main routing | [MenuComponent](src/app/menu/menu.component.ts) |
| Authentication | [src/app/authentication/](src/app/authentication/) |

---

## When to Ask for Code Examples

**Mention these patterns** when asking for implementation help:
- "Use ngrx signals with withMethods()"
- "Register in SocketService, not component"
- "Check store?.posSettings with optional chaining"
- "Use UUID for Channex matching, not MongoDB ID"
- "Validate print job with: complete + paid + setting + printer"
- "Generate receipt via PrintJobService.generateOrderReceipt()"

**Good Context Clues** in existing code:
- [cart.store.ts](src/app/shared/stores/cart.store.ts) - exemplifies store pattern
- [socket.service.ts](src/app/shared/services/socket.service.ts) - exemplifies global listeners
- [print-job.service.ts](src/app/shared/services/print-job.service.ts) - exemplifies print workflow
- [menu.component.ts](src/app/menu/menu.component.ts) - exemplifies main routing + socket setup
- [cart.component.html](src/app/shared/components/cart/cart.component.html) - exemplifies Tailwind + Material
