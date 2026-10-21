import{a as w,c as z,o as x}from"./chunk-RykAvsdd.js";import{G as Se,M as Mf,Tt as ee,wt as du,x as I}from"./chunk-DMEhUgHW.js";import{B as Jm,Cr as sw,It as Xd,Jr as y,Mt as X,Vt as Xt,Xt as __,Z as N,dn as cv,ii as zs,m as Cm,qt as Ze,un as cm,xn as em,xr as sm}from"./chunk-DTckT2H2.js";import{At as U,Dn as Ut,Dt as ve,It as z$1,Nt as k,Sn as Mi,St as jt,Tn as Qe,Zn as ue,kn as Xe,ln as _,nr as ze,sn as O,vt as Xt$1,yn as Fi}from"./chunk-BsQ53arL.js";import{n as J,r as X$1,s as jt$1,t as Bt}from"./chunk-D2dN3lws.js";var Y;var V;var nt;var at;var u;var b;var ot;var it;var wt;var st=z(()=>{"use strict";__();__();jt$1();ve();ze();k();Ut();Xe();du();Xd();_();Y=`_mat-bottom-sheet-enter`,V=`_mat-bottom-sheet-exit`,nt=(()=>{class o extends X$1{_breakpointSubscription;_animationsDisabled=Fi();_animationState=`void`;_animationStateChanged=new Ze;_destroyed=!1;constructor(){super();let t=y(ue);this._breakpointSubscription=t.observe([Mi.Medium,Mi.Large,Mi.XLarge]).subscribe(()=>{let a=this._elementRef.nativeElement.classList;a.toggle(`mat-bottom-sheet-container-medium`,t.isMatched(Mi.Medium)),a.toggle(`mat-bottom-sheet-container-large`,t.isMatched(Mi.Large)),a.toggle(`mat-bottom-sheet-container-xlarge`,t.isMatched(Mi.XLarge))})}enter(){this._destroyed||(this._animationState=`visible`,this._changeDetectorRef.markForCheck(),this._changeDetectorRef.detectChanges(),this._animationsDisabled&&this._simulateAnimation(Y))}exit(){this._destroyed||(this._elementRef.nativeElement.setAttribute(`mat-exit`,``),this._animationState=`hidden`,this._changeDetectorRef.markForCheck(),this._animationsDisabled&&this._simulateAnimation(V))}ngOnDestroy(){super.ngOnDestroy(),this._breakpointSubscription.unsubscribe(),this._destroyed=!0}_simulateAnimation(t){this._ngZone.run(()=>{this._handleAnimationEvent(!0,t,this._elementRef.nativeElement),setTimeout(()=>this._handleAnimationEvent(!1,t,this._elementRef.nativeElement))})}_trapFocus(){super._trapFocus({preventScroll:!0})}_handleAnimationEvent(t,a,e){if(e===this._elementRef.nativeElement){let n=a===Y;(n||a===V)&&this._animationStateChanged.emit({toState:n?`visible`:`hidden`,phase:t?`start`:`done`})}}static ɵfac=function(a){return new(a||o)};static ɵcmp=(function(){function t(a,e){}return sw({type:o,selectors:[[`mat-bottom-sheet-container`]],hostAttrs:[`tabindex`,`-1`,1,`mat-bottom-sheet-container`],hostVars:9,hostBindings:function(e,n){e&1&&Jm(`animationstart`,function(i){return n._handleAnimationEvent(!0,i.animationName,i.target)})(`animationend`,function(i){return n._handleAnimationEvent(!1,i.animationName,i.target)})(`animationcancel`,function(i){return n._handleAnimationEvent(!1,i.animationName,i.target)}),e&2&&(Cm(`role`,n._config.role)(`aria-modal`,n._config.ariaModal)(`aria-label`,n._config.ariaLabel),cv(`mat-bottom-sheet-container-animations-enabled`,!n._animationsDisabled)(`mat-bottom-sheet-container-enter`,n._animationState===`visible`)(`mat-bottom-sheet-container-exit`,n._animationState===`hidden`))},features:[sm],decls:1,vars:0,consts:[[`cdkPortalOutlet`,``]],template:function(e,n){e&1&&cm(0,t,0,0,`ng-template`,0)},dependencies:[U],styles:[`@keyframes _mat-bottom-sheet-enter {
  from {
    transform: translateY(100%);
  }
  to {
    transform: none;
  }
}
@keyframes _mat-bottom-sheet-exit {
  from {
    transform: none;
  }
  to {
    transform: translateY(100%);
  }
}
.mat-bottom-sheet-container {
  box-shadow: 0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12);
  padding: 8px 16px;
  min-width: 100vw;
  box-sizing: border-box;
  display: block;
  outline: 0;
  max-height: 80vh;
  overflow: auto;
  position: relative;
  background: var(--%NS%mat-bottom-sheet-container-background-color, var(--%NS%mat-sys-surface-container-low));
  color: var(--%NS%mat-bottom-sheet-container-text-color, var(--%NS%mat-sys-on-surface));
  font-family: var(--%NS%mat-bottom-sheet-container-text-font, var(--%NS%mat-sys-body-large-font));
  font-size: var(--%NS%mat-bottom-sheet-container-text-size, var(--%NS%mat-sys-body-large-size));
  line-height: var(--%NS%mat-bottom-sheet-container-text-line-height, var(--%NS%mat-sys-body-large-line-height));
  font-weight: var(--%NS%mat-bottom-sheet-container-text-weight, var(--%NS%mat-sys-body-large-weight));
  letter-spacing: var(--%NS%mat-bottom-sheet-container-text-tracking, var(--%NS%mat-sys-body-large-tracking));
}
@media (forced-colors: active) {
  .mat-bottom-sheet-container {
    outline: 1px solid;
  }
}

.mat-bottom-sheet-container-animations-enabled {
  transform: translateY(100%);
}
.mat-bottom-sheet-container-animations-enabled.mat-bottom-sheet-container-enter {
  animation: _mat-bottom-sheet-enter 195ms cubic-bezier(0, 0, 0.2, 1) forwards;
}
.mat-bottom-sheet-container-animations-enabled.mat-bottom-sheet-container-exit {
  animation: _mat-bottom-sheet-exit 375ms cubic-bezier(0.4, 0, 1, 1) backwards;
}

.mat-bottom-sheet-container-xlarge, .mat-bottom-sheet-container-large, .mat-bottom-sheet-container-medium {
  border-top-left-radius: var(--%NS%mat-bottom-sheet-container-shape, 28px);
  border-top-right-radius: var(--%NS%mat-bottom-sheet-container-shape, 28px);
}

.mat-bottom-sheet-container-medium {
  min-width: 384px;
  max-width: calc(100vw - 128px);
}

.mat-bottom-sheet-container-large {
  min-width: 512px;
  max-width: calc(100vw - 256px);
}

.mat-bottom-sheet-container-xlarge {
  min-width: 576px;
  max-width: calc(100vw - 384px);
}
`],encapsulation:2,changeDetection:1})})()}return o})(),at=new N(`MatBottomSheetData`),u=class{viewContainerRef;injector;panelClass;direction;data=null;hasBackdrop=!0;backdropClass;disableClose=!1;ariaLabel=null;ariaModal=!1;closeOnNavigation=!0;autoFocus=`first-tabbable`;restoreFocus=!0;scrollStrategy;height=``;minHeight;maxHeight;bindings},b=class{_ref;get instance(){return this._ref.componentInstance}get componentRef(){return this._ref.componentRef}containerInstance;disableClose;_afterOpened=new I;_result;_closeFallbackTimeout;constructor(c,t,a){this._ref=c,this.containerInstance=a,this.disableClose=t.disableClose,a._animationStateChanged.pipe(ee(e=>e.phase===`done`&&e.toState===`visible`),Se(1)).subscribe(()=>{this._afterOpened.next(),this._afterOpened.complete()}),a._animationStateChanged.pipe(ee(e=>e.phase===`done`&&e.toState===`hidden`),Se(1)).subscribe(()=>{clearTimeout(this._closeFallbackTimeout),this._ref.close(this._result)}),c.overlayRef.detachments().subscribe(()=>{this._ref.close(this._result)}),Mf(this.backdropClick(),this.keydownEvents().pipe(ee(e=>e.keyCode===27))).subscribe(e=>{!this.disableClose&&(e.type!==`keydown`||!Qe(e))&&(e.preventDefault(),this.dismiss())})}dismiss(c){this.containerInstance&&(this.containerInstance._animationStateChanged.pipe(ee(t=>t.phase===`start`),Se(1)).subscribe(()=>{this._closeFallbackTimeout=setTimeout(()=>this._ref.close(this._result),500),this._ref.overlayRef.detachBackdrop()}),this._result=c,this.containerInstance.exit(),this.containerInstance=null)}afterDismissed(){return this._ref.closed}afterOpened(){return this._afterOpened}backdropClick(){return this._ref.backdropClick}keydownEvents(){return this._ref.keydownEvents}},ot=new N(`mat-bottom-sheet-default-options`),it=(()=>{class o{_injector=y(X);_parentBottomSheet=y(o,{optional:!0,skipSelf:!0});_animationsDisabled=Fi();_defaultOptions=y(ot,{optional:!0});_bottomSheetRefAtThisLevel=null;_dialog=y(J);get _openedBottomSheetRef(){let t=this._parentBottomSheet;return t?t._openedBottomSheetRef:this._bottomSheetRefAtThisLevel}set _openedBottomSheetRef(t){this._parentBottomSheet?this._parentBottomSheet._openedBottomSheetRef=t:this._bottomSheetRefAtThisLevel=t}open(t,a){let e=w(w({},this._defaultOptions||new u),a),n;return this._dialog.open(t,x(w({},e),{disableClose:!0,closeOnOverlayDetachments:!1,maxWidth:`100%`,container:nt,scrollStrategy:e.scrollStrategy||Xt$1(this._injector),positionStrategy:jt(this._injector).centerHorizontally().bottom(`0`),disableAnimations:this._animationsDisabled,templateContext:()=>({bottomSheetRef:n}),providers:(m,i,X)=>(n=new b(m,e,X),[{provide:b,useValue:n},{provide:at,useValue:e.data}])})),n.afterDismissed().subscribe(()=>{this._openedBottomSheetRef===n&&(this._openedBottomSheetRef=null)}),this._openedBottomSheetRef?(this._openedBottomSheetRef.afterDismissed().subscribe(()=>n.containerInstance?.enter()),this._openedBottomSheetRef.dismiss()):n.containerInstance.enter(),this._openedBottomSheetRef=n,n}dismiss(t){this._openedBottomSheetRef&&this._openedBottomSheetRef.dismiss(t)}ngOnDestroy(){this._bottomSheetRefAtThisLevel&&this._bottomSheetRefAtThisLevel.dismiss()}static ɵfac=function(a){return new(a||o)};static ɵprov=Xt({token:o,factory:o.ɵfac})}return o})(),wt=(()=>{class o{static ɵfac=function(a){return new(a||o)};static ɵmod=em({type:o});static ɵinj=zs({providers:[it],imports:[Bt,z$1,O]})}return o})()});export{wt as a,st as i,b as n,it as r,at as t};