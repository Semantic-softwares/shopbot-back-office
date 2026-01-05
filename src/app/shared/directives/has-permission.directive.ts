import { Directive, OnInit, Input, TemplateRef, ViewContainerRef, inject } from "@angular/core";
import { RolesService } from "../services/roles.service";

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private rolesService = inject(RolesService);

  @Input('hasPermission')
  input!: string | string[] | {
    permissions: string[];
    mode?: 'any' | 'all';
  };

  ngOnInit() {
    const { permissions, mode } = this.normalizeInput(this.input);

    const allowed =
      mode === 'all'
        ? this.rolesService.hasAll(permissions)
        : this.rolesService.hasAny(permissions);

    if (allowed) {
      this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }

  private normalizeInput(input: HasPermissionDirective['input']) {
    if (typeof input === 'string') {
      return { permissions: [input], mode: 'any' as const };
    }

    if (Array.isArray(input)) {
      return { permissions: input, mode: 'any' as const };
    }

    return {
      permissions: input.permissions,
      mode: input.mode ?? 'any'
    };
  }
}
