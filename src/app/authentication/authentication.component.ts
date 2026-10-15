import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';
import { LanguageMenuComponent } from '../shared/components/language-menu/language-menu.component';

@Component({
  selector: 'app-authentication',
  imports: [RouterModule, ThemeToggleComponent, LanguageMenuComponent],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss',
})
export class AuthenticationComponent { }
