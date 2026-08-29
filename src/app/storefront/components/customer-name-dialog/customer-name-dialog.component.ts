import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

// Asked once per session, right before the first order at a table — required,
// since the backend now stamps this name onto every line added (so a shared
// table order can show who ordered what). Opened with disableClose: true, so
// the only way out is a valid submit. Never re-shown after that, see
// StorefrontStore.hasPromptedForName.
@Component({
  selector: 'app-storefront-customer-name-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  templateUrl: './customer-name-dialog.component.html',
})
export class CustomerNameDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CustomerNameDialogComponent>);
  protected readonly name = signal('');
  protected readonly canSubmit = computed(() => this.name().trim().length > 0);

  submit(): void {
    const trimmed = this.name().trim();
    if (!trimmed) {
      return;
    }
    this.dialogRef.close(trimmed);
  }
}
