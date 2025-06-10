import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SurveyService, Survey } from '../../../../../shared/services/survey.service';
import { CreateSurveyComponent } from '../../modals/create-survey/create-survey.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-list-surveys',
  templateUrl: './list-surveys.component.html',
  styleUrl: './list-surveys.component.scss',
   imports: [
      CommonModule,
      MatTableModule,
      MatButtonModule,
      MatIconModule,
      MatCardModule,
      MatFormFieldModule,
      MatInputModule,
      MatMenuModule,
      MatSlideToggleModule,
      MatProgressSpinnerModule,
      HasPermissionDirective,
      RouterModule
    ],
})
export class ListSurveysComponent {
  private surveyService = inject(SurveyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  searchTerm = signal('');
  displayedColumns = ['name', 'description', 'feedbackType', 'touchPoint', 'channel', 'status', 'actions'];


  public surveys = rxResource({
    loader: () => this.surveyService.getSurveys()
  });

  public filteredSurveys = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.surveys.value()!.filter(channel => 
      channel.name.toLowerCase().includes(term) ||
      channel.description.toLowerCase().includes(term)
    );
  });

  goToSurveyDetails(id:string) {
    this.router.navigate(['../', id, 'details'], { relativeTo: this.route });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateSurveyComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.surveys.reload();
      }
    });
  }

  editSurvey(survey: Survey) {
    const dialogRef = this.dialog.open(CreateSurveyComponent, {
      data: survey
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.surveys.reload();
      }
    });
  }

  deleteSurvey(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: { message: `Are you sure you want to delete this survey?` }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.surveyService.deleteSurvey(id).subscribe(() => {
            this.surveys.reload();
          });
        }
      });
  }


  onStatusToggle(survey: Survey, event: MatSlideToggleChange) {
    this.surveyService.updateSurvey(survey._id!, { 
      ...survey, 
      status: event.checked 
    }).subscribe(() => {
        this.surveys.reload();
    });
  }
 }
