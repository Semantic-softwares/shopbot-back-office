import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../../../shared/services/product.service';
import { CategoryService } from '../../../../../shared/services/category.service';
import { Category } from '../../../../../shared/models/category.model';

interface ImportRow {
  externalId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  categoryKey: string;
  categoryName: string;
}

interface CategoryGroup {
  key: string;
  count: number;
  samples: string[];
  choice: string; // existing menu _id, or 'new'
  newName: string;
}

type Step = 'select' | 'map' | 'importing' | 'done';

const CHUNK_SIZE = 25;
const NEW_MENU = 'new';

@Component({
  selector: 'app-import-products-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './import-products-dialog.component.html',
})
export class ImportProductsDialogComponent {
  private dialogRef = inject(MatDialogRef<ImportProductsDialogComponent>);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  protected data = inject<{ storeId: string; menus: Category[] }>(MAT_DIALOG_DATA);

  protected step = signal<Step>('select');
  protected fileName = signal('');
  protected parseError = signal('');
  protected reuploadImages = signal(false);
  protected rows = signal<ImportRow[]>([]);
  protected invalidCount = signal(0);
  protected groups = signal<CategoryGroup[]>([]);
  protected progress = signal(0);
  protected result = signal<{ created: number; skipped: string[]; failed: string[] } | null>(null);

  protected canImport = computed(
    () => this.groups().length > 0 && this.groups().every((g) => g.choice !== NEW_MENU || g.newName.trim().length > 0),
  );

  protected async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.parseError.set('');
    this.fileName.set(file.name);
    try {
      const parsed = JSON.parse(await file.text());
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : null;
      if (!list) throw new Error('Expected a list of products.');

      // Their fields -> ours: name, description, price, imageUrl (-> photos),
      // available (-> active), category_id (-> a Menu, chosen in the next step).
      const valid: ImportRow[] = [];
      let invalid = 0;
      for (const item of list) {
        const name = String(item?.name ?? '').trim();
        const price = Number(item?.price);
        if (!name || !Number.isFinite(price) || price < 0) {
          invalid++;
          continue;
        }
        valid.push({
          externalId: item?.id ? String(item.id) : '',
          name,
          description: String(item?.description ?? '').trim(),
          price,
          imageUrl: String(item?.image_url ?? item?.imageUrl ?? '').trim(),
          available: item?.available !== false,
          categoryKey: String(item?.category_id ?? item?.category ?? 'uncategorized'),
          categoryName: String(item?.category_name ?? '').trim(),
        });
      }
      if (valid.length === 0) throw new Error('No valid products found in this file.');

      const byKey = new Map<string, CategoryGroup>();
      for (const row of valid) {
        let group = byKey.get(row.categoryKey);
        if (!group) {
          const existing = row.categoryName
            ? this.data.menus.find((m) => m.name.trim().toLowerCase() === row.categoryName.toLowerCase())
            : undefined;
          group = {
            key: row.categoryKey,
            count: 0,
            samples: [],
            choice: existing?._id ?? NEW_MENU,
            newName: row.categoryName,
          };
        }
        group.count++;
        if (group.samples.length < 3) group.samples.push(row.name);
        byKey.set(row.categoryKey, group);
      }
      this.rows.set(valid);
      this.invalidCount.set(invalid);
      this.groups.set([...byKey.values()]);
      this.step.set('map');
    } catch (err: any) {
      this.parseError.set(err?.message || 'This file could not be read as JSON.');
    }
  }

  protected setChoice(key: string, choice: string): void {
    this.groups.update((gs) => gs.map((g) => (g.key === key ? { ...g, choice } : g)));
  }

  protected setNewName(key: string, newName: string): void {
    this.groups.update((gs) => gs.map((g) => (g.key === key ? { ...g, newName } : g)));
  }

  protected async startImport(): Promise<void> {
    this.step.set('importing');
    this.progress.set(0);
    const skipped: string[] = [];
    const failed: string[] = [];
    let created = 0;

    try {
      const menuByKey = new Map<string, string>();
      for (const group of this.groups()) {
        if (group.choice === NEW_MENU) {
          const menu: any = await firstValueFrom(
            this.categoryService.createMenu({ name: group.newName.trim(), store: this.data.storeId, activate: true } as any),
          );
          menuByKey.set(group.key, menu._id);
        } else {
          menuByKey.set(group.key, group.choice);
        }
      }

      const items = this.rows().map((row) => ({
        externalId: row.externalId,
        name: row.name,
        description: row.description,
        price: row.price,
        imageUrl: row.imageUrl,
        available: row.available,
        menu: menuByKey.get(row.categoryKey),
      }));

      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        try {
          const res = await firstValueFrom(
            this.productService.importProducts({
              store: this.data.storeId,
              items: items.slice(i, i + CHUNK_SIZE),
              reuploadImages: this.reuploadImages(),
            }),
          );
          created += res.created.length;
          skipped.push(...res.skipped.map((s) => `${s.name}: ${s.reason}`));
          failed.push(...res.failed.map((f) => `${f.name}: ${f.error}`));
        } catch {
          failed.push(...items.slice(i, i + CHUNK_SIZE).map((it) => `${it.name}: request failed`));
        }
        this.progress.set(Math.round((Math.min(i + CHUNK_SIZE, items.length) / items.length) * 100));
      }
    } catch (err: any) {
      failed.push(err?.error?.message || err?.message || 'Could not create categories.');
    }

    this.result.set({ created, skipped, failed });
    this.step.set('done');
  }

  protected finish(): void {
    this.dialogRef.close((this.result()?.created ?? 0) > 0);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
