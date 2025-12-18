import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  // Provided in root or in the parent component's providers array
  providedIn: 'root', 
})
export class ReservationFormService {
  private formSubject = new BehaviorSubject<FormGroup | null>(null);
  public form$: Observable<FormGroup | null> = this.formSubject.asObservable();

  setForm(form: FormGroup): void {
    this.formSubject.next(form);
  }
}