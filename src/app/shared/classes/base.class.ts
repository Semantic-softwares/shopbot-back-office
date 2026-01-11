import { inject } from "@angular/core";
import { ViewService } from "../services";
import { ModalDialogParams } from "@nativescript/angular";

export class BaseClass {
  readonly viewService = inject(ViewService);
  public modalServiceParams = inject(ModalDialogParams, {optional: true});


  public get isTablet(): boolean {
    return this.viewService.isTablet;
  }

  public back(params?:any): void {
    this.modalServiceParams.closeCallback(params);
  }

  public closeKeyBoard():void {
    this.viewService.closeKeyboard();
  }
}
