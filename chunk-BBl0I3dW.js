import{L as S,et as ee,m as Eo,u as D}from"./chunk-ZG_ciif-.js";import{a as x,i as w}from"./chunk-B9dn0NrW.js";import{Cn as kI,E as Gp,H as Lt,In as ne,U as M,X as Pe,en as dp,kn as lp,lr as th,s as AI,sn as fl,v as E,vr as vp}from"./chunk-5XvVQiy2.js";import{r as T,t as H}from"./chunk-C2ra7W0i.js";import{L as xe,T as ie,p as Jt,t as $t}from"./chunk-BDr1J6Tf.js";import{t as I}from"./chunk--TR0RrN-.js";import{l as Yt,r as Ht}from"./chunk-Bu_A3-kn.js";import{i as K$1,r as Et,s as X}from"./chunk-CYVia-Nl.js";var P=`_mat-bottom-sheet-enter`;var Y=`_mat-bottom-sheet-exit`;var $=(()=>{class o extends K$1{_breakpointSubscription;_animationsDisabled=Jt();_animationState=`void`;_animationStateChanged=new Pe;_destroyed=!1;constructor(){super();let t=E(ie);this._breakpointSubscription=t.observe([$t.Medium,$t.Large,$t.XLarge]).subscribe(()=>{let a=this._elementRef.nativeElement.classList;a.toggle(`mat-bottom-sheet-container-medium`,t.isMatched($t.Medium)),a.toggle(`mat-bottom-sheet-container-large`,t.isMatched($t.Large)),a.toggle(`mat-bottom-sheet-container-xlarge`,t.isMatched($t.XLarge))})}enter(){this._destroyed||(this._animationState=`visible`,this._changeDetectorRef.markForCheck(),this._changeDetectorRef.detectChanges(),this._animationsDisabled&&this._simulateAnimation(P))}exit(){this._destroyed||(this._elementRef.nativeElement.setAttribute(`mat-exit`,``),this._animationState=`hidden`,this._changeDetectorRef.markForCheck(),this._animationsDisabled&&this._simulateAnimation(Y))}ngOnDestroy(){super.ngOnDestroy(),this._breakpointSubscription.unsubscribe(),this._destroyed=!0}_simulateAnimation(t){this._ngZone.run(()=>{this._handleAnimationEvent(!0,t,this._elementRef.nativeElement),setTimeout(()=>this._handleAnimationEvent(!1,t,this._elementRef.nativeElement))})}_trapFocus(){super._trapFocus({preventScroll:!0})}_handleAnimationEvent(t,a,e){if(e===this._elementRef.nativeElement){let n=a===P;(n||a===Y)&&this._animationStateChanged.emit({toState:n?`visible`:`hidden`,phase:t?`start`:`done`})}}static ɵfac=function(a){return new(a||o)};static ɵcmp=(function(){function t(a,e){}return AI({type:o,selectors:[[`mat-bottom-sheet-container`]],hostAttrs:[`tabindex`,`-1`,1,`mat-bottom-sheet-container`],hostVars:9,hostBindings:function(e,n){e&1&&Gp(`animationstart`,function(i){return n._handleAnimationEvent(!0,i.animationName,i.target)})(`animationend`,function(i){return n._handleAnimationEvent(!1,i.animationName,i.target)})(`animationcancel`,function(i){return n._handleAnimationEvent(!1,i.animationName,i.target)}),e&2&&(vp(`role`,n._config.role)(`aria-modal`,n._config.ariaModal)(`aria-label`,n._config.ariaLabel),th(`mat-bottom-sheet-container-animations-enabled`,!n._animationsDisabled)(`mat-bottom-sheet-container-enter`,n._animationState===`visible`)(`mat-bottom-sheet-container-exit`,n._animationState===`hidden`))},features:[lp],decls:1,vars:0,consts:[[`cdkPortalOutlet`,``]],template:function(e,n){e&1&&dp(0,t,0,0,`ng-template`,0)},dependencies:[H],styles:[`@keyframes _mat-bottom-sheet-enter {
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
`],encapsulation:2,changeDetection:1})})()}return o})();var G=new M(`MatBottomSheetData`);var u=class{viewContainerRef;injector;panelClass;direction;data=null;hasBackdrop=!0;backdropClass;disableClose=!1;ariaLabel=null;ariaModal=!1;closeOnNavigation=!0;autoFocus=`first-tabbable`;restoreFocus=!0;scrollStrategy;height=``;minHeight;maxHeight;bindings};var b=class{_ref;get instance(){return this._ref.componentInstance}get componentRef(){return this._ref.componentRef}containerInstance;disableClose;_afterOpened=new S;_result;_closeFallbackTimeout;constructor(c,t,a){this._ref=c,this.containerInstance=a,this.disableClose=t.disableClose,a._animationStateChanged.pipe(D(e=>e.phase===`done`&&e.toState===`visible`),ee(1)).subscribe(()=>{this._afterOpened.next(),this._afterOpened.complete()}),a._animationStateChanged.pipe(D(e=>e.phase===`done`&&e.toState===`hidden`),ee(1)).subscribe(()=>{clearTimeout(this._closeFallbackTimeout),this._ref.close(this._result)}),c.overlayRef.detachments().subscribe(()=>{this._ref.close(this._result)}),Eo(this.backdropClick(),this.keydownEvents().pipe(D(e=>e.keyCode===27))).subscribe(e=>{!this.disableClose&&(e.type!==`keydown`||!xe(e))&&(e.preventDefault(),this.dismiss())})}dismiss(c){this.containerInstance&&(this.containerInstance._animationStateChanged.pipe(D(t=>t.phase===`start`),ee(1)).subscribe(()=>{this._closeFallbackTimeout=setTimeout(()=>this._ref.close(this._result),500),this._ref.overlayRef.detachBackdrop()}),this._result=c,this.containerInstance.exit(),this.containerInstance=null)}afterDismissed(){return this._ref.closed}afterOpened(){return this._afterOpened}backdropClick(){return this._ref.backdropClick}keydownEvents(){return this._ref.keydownEvents}};var K=new M(`mat-bottom-sheet-default-options`);var U=(()=>{class o{_injector=E(ne);_parentBottomSheet=E(o,{optional:!0,skipSelf:!0});_animationsDisabled=Jt();_defaultOptions=E(K,{optional:!0});_bottomSheetRefAtThisLevel=null;_dialog=E(X);get _openedBottomSheetRef(){let t=this._parentBottomSheet;return t?t._openedBottomSheetRef:this._bottomSheetRefAtThisLevel}set _openedBottomSheetRef(t){this._parentBottomSheet?this._parentBottomSheet._openedBottomSheetRef=t:this._bottomSheetRefAtThisLevel=t}open(t,a){let e=w(w({},this._defaultOptions||new u),a),n;return this._dialog.open(t,x(w({},e),{disableClose:!0,closeOnOverlayDetachments:!1,maxWidth:`100%`,container:$,scrollStrategy:e.scrollStrategy||Yt(this._injector),positionStrategy:Ht(this._injector).centerHorizontally().bottom(`0`),disableAnimations:this._animationsDisabled,templateContext:()=>({bottomSheetRef:n}),providers:(m,i,V)=>(n=new b(m,e,V),[{provide:b,useValue:n},{provide:G,useValue:e.data}])})),n.afterDismissed().subscribe(()=>{this._openedBottomSheetRef===n&&(this._openedBottomSheetRef=null)}),this._openedBottomSheetRef?(this._openedBottomSheetRef.afterDismissed().subscribe(()=>n.containerInstance?.enter()),this._openedBottomSheetRef.dismiss()):n.containerInstance.enter(),this._openedBottomSheetRef=n,n}dismiss(t){this._openedBottomSheetRef&&this._openedBottomSheetRef.dismiss(t)}ngOnDestroy(){this._bottomSheetRefAtThisLevel&&this._bottomSheetRefAtThisLevel.dismiss()}static ɵfac=function(a){return new(a||o)};static ɵprov=Lt({token:o,factory:o.ɵfac})}return o})();var dt=(()=>{class o{static ɵfac=function(a){return new(a||o)};static ɵmod=kI({type:o});static ɵinj=fl({providers:[U],imports:[Et,T,I]})}return o})();export{dt as i,U as n,b as r,G as t};