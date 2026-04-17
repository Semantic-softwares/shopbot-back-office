import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Employee } from '../../models/employee.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-property-manager-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './property-manager-selector.component.html',
})
export class PropertyManagerSelectorComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) control!: FormControl<string>;
  @Input() storeId: string | undefined;
  @Input() label = 'Property Manager';
  @Input() set preloadedManager(manager: Employee | null | undefined) {
    if (manager) {
      this.selectedManager.set(manager);
    }
  }

  readonly merchants = signal<Employee[]>([]);
  readonly managerSearchText = signal<string>('');
  readonly selectedManager = signal<Employee | null>(null);

  readonly filteredMerchants = computed(() => {
    const search = this.managerSearchText().toLowerCase();
    const all = this.merchants();
    if (!search) return all;
    return all.filter(
      (m) =>
        m.name?.toLowerCase().includes(search) ||
        m.email?.toLowerCase().includes(search),
    );
  });

  ngOnInit(): void {
    if (this.storeId) {
      this.userService.getStoreMerchants(this.storeId).subscribe({
        next: (merchants) => {
          this.merchants.set(merchants);
          // Re-match existing value after merchants load (edit mode)
          const currentId = this.control.value;
          if (currentId && !this.selectedManager()) {
            const mgr = merchants.find((m) => m._id === currentId);
            if (mgr) {
              this.selectedManager.set(mgr);
              // Re-trigger displayWith by briefly resetting the value
              this.control.setValue('', { emitEvent: false });
              this.control.setValue(currentId, { emitEvent: false });
              this.cdr.markForCheck();
            }
          }
        },
      });
    }
  }

  readonly displayMerchantName = (merchantId: string): string => {
    if (!merchantId) return '';
    const found = this.merchants().find((m) => m._id === merchantId);
    if (found) return found.name || '';
    const selected = this.selectedManager();
    if (selected && selected._id === merchantId) return selected.name || '';
    return '';
  };

  onManagerSelected(event: MatAutocompleteSelectedEvent): void {
    const merchant = this.merchants().find((m) => m._id === event.option.value);
    if (merchant) {
      this.selectedManager.set(merchant);
      this.control.setValue(merchant._id ?? '');
    }
  }

  onManagerInput(event: Event): void {
    this.managerSearchText.set((event.target as HTMLInputElement).value);
  }

  clearManager(): void {
    this.control.setValue('');
    this.selectedManager.set(null);
    this.managerSearchText.set('');
  }
}
