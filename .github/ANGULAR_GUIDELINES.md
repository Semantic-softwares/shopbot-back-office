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
