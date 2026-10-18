import{a as w$1,c as z,o as x}from"./chunk-RykAvsdd.js";import{E as Jm,G as Se,M as Mf,Tt as ee,p as Fe,wt as du,x as I,zt as ke}from"./chunk-DMEhUgHW.js";import{Cn as cv,Ct as Rm,E as Fo,Er as sM,Et as Si,Ft as VL,G as Jl,H as Jd,Ht as Ws,Jr as y,K as Jm$1,Or as sm,Rt as W,Un as iw,Ut as X$1,Zt as Xt,ar as lw,at as M_,bn as cm,cr as mw,ct as N,f as Cm,fr as nv,h as Dc,k as Ge,kn as em,ln as aI,ot as Mh,ri as zo,rn as Ze,rt as MI,u as Bt$1,un as aM}from"./chunk-BOgKwfio.js";import{An as et$1,At as U,Cn as ai$1,Dt as me$1,En as di,Ft as s,Hn as ut,It as z$1,Mn as gt,Mt as d,Nt as k,On as dt,Pt as p$1,Rn as pe$1,Un as vt,Wn as ye,_n as Ut$1,ar as _$1,gn as S,gt as st,hn as Qe,ir as S$1,it as D,jn as fe$1,ln as Fi,lt as Xt$1,mn as Ot,or as f,ot as N$1,pt as jt$1,rr as O,st as Ut,un as Ie,ut as Zt,vt as ve,xn as _,xt as Le,yn as Xe,yt as ye$1,zn as si$1}from"./chunk-B64orv_y.js";function me(i){let o=Ge(i),t=new Ze;return{valueSignal:o,get value(){return o()},change:t,ngOnDestroy(){t.complete()}}}function K(i,o){let t=i.length;for(;t--;)o(i[t])}var u;var X;var p;var le;var de;var ce;var J;var Bt;var jt=z(()=>{"use strict";M_();M_();du();k();ye();dt();S();fe$1();Ut();Jd();Xe();Ot();f();u=class{viewContainerRef;injector;id;role=`dialog`;panelClass=``;hasBackdrop=!0;backdropClass=``;disableClose=!1;closePredicate;width=``;height=``;minWidth;minHeight;maxWidth;maxHeight;positionStrategy;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus=`first-tabbable`;restoreFocus=!0;scrollStrategy;closeOnNavigation=!0;closeOnDestroy=!0;closeOnOverlayDetachments=!0;disableAnimations=!1;providers;container;templateContext;bindings},X=(()=>{class i extends d{_elementRef=y(zo);_focusTrapFactory=y(vt);_config;_interactivityChecker=y(gt);_ngZone=y(W);_focusMonitor=y(ut);_renderer=y(Dc);_changeDetectorRef=y(VL);_injector=y(X$1);_platform=y(_);_document=y(Bt$1);_portalOutlet;_focusTrapped=new I;_focusTrap=null;_elementFocusedBeforeDialogWasOpened=null;_closeInteractionType=null;_ariaLabelledByQueue=[];_isDestroyed=!1;constructor(){super(),this._config=y(u,{optional:!0})||new u,this._config.ariaLabelledBy&&this._ariaLabelledByQueue.push(this._config.ariaLabelledBy)}_addAriaLabelledBy(t){this._ariaLabelledByQueue.push(t),this._changeDetectorRef.markForCheck()}_removeAriaLabelledBy(t){let e=this._ariaLabelledByQueue.indexOf(t);e>-1&&(this._ariaLabelledByQueue.splice(e,1),this._changeDetectorRef.markForCheck())}_contentAttached(){this._initializeFocusTrap(),this._captureInitialFocus()}_captureInitialFocus(){this._trapFocus()}ngOnDestroy(){this._focusTrapped.complete(),this._isDestroyed=!0,this._restoreFocus()}attachComponentPortal(t){this._portalOutlet.hasAttached();let e=this._portalOutlet.attachComponentPortal(t);return this._contentAttached(),e}attachTemplatePortal(t){this._portalOutlet.hasAttached();let e=this._portalOutlet.attachTemplatePortal(t);return this._contentAttached(),e}attachDomPortal=t=>{this._portalOutlet.hasAttached();let e=this._portalOutlet.attachDomPortal(t);return this._contentAttached(),e};_recaptureFocus(){this._containsFocus()||this._trapFocus()}_forceFocus(t,e){this._interactivityChecker.isFocusable(t)||(t.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let n=()=>{a(),r(),t.removeAttribute(`tabindex`)},a=this._renderer.listen(t,`blur`,n),r=this._renderer.listen(t,`mousedown`,n)})),t.focus(e)}_focusByCssSelector(t,e){let n=this._elementRef.nativeElement.querySelector(t);n&&this._forceFocus(n,e)}_trapFocus(t){this._isDestroyed||Mh(()=>{let e=this._elementRef.nativeElement;switch(this._config.autoFocus){case!1:case`dialog`:this._containsFocus()||e.focus(t);break;case!0:case`first-tabbable`:this._focusTrap?.focusInitialElement(t)||this._focusDialogContainer(t);break;case`first-heading`:this._focusByCssSelector(`h1, h2, h3, h4, h5, h6, [role="heading"]`,t);break;default:this._focusByCssSelector(this._config.autoFocus,t)}this._focusTrapped.next()},{injector:this._injector})}_restoreFocus(){let t=this._config.restoreFocus,e=null;if(typeof t==`string`?e=this._document.querySelector(t):typeof t==`boolean`?e=t?this._elementFocusedBeforeDialogWasOpened:null:t&&(e=t),this._config.restoreFocus&&e&&typeof e.focus==`function`){let n=et$1(),a=this._elementRef.nativeElement;(!n||n===this._document.body||n===a||a.contains(n))&&(this._focusMonitor?(this._focusMonitor.focusVia(e,this._closeInteractionType),this._closeInteractionType=null):e.focus())}this._focusTrap&&this._focusTrap.destroy()}_focusDialogContainer(t){this._elementRef.nativeElement.focus?.(t)}_containsFocus(){let t=this._elementRef.nativeElement,e=et$1();return t===e||t.contains(e)}_initializeFocusTrap(){this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._document&&(this._elementFocusedBeforeDialogWasOpened=et$1()))}static ɵfac=function(e){return new(e||i)};static ɵcmp=(function(){function t(e,n){}return iw({type:i,selectors:[[`cdk-dialog-container`]],viewQuery:function(n,a){if(n&1&&nv(U,7),n&2){let r;sM(r=aM())&&(a._portalOutlet=r.first)}},hostAttrs:[`tabindex`,`-1`,1,`cdk-dialog-container`],hostVars:6,hostBindings:function(n,a){n&2&&Cm(`id`,a._config.id||null)(`role`,a._config.role)(`aria-modal`,a._config.ariaModal)(`aria-labelledby`,a._config.ariaLabel?null:a._ariaLabelledByQueue[0])(`aria-label`,a._config.ariaLabel)(`aria-describedby`,a._config.ariaDescribedBy||null)},features:[sm],decls:1,vars:0,consts:[[`cdkPortalOutlet`,``]],template:function(n,a){n&1&&cm(0,t,0,0,`ng-template`,0)},dependencies:[U],styles:[`.cdk-dialog-container {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
  max-height: inherit;
}
`],encapsulation:2,changeDetection:1})})()}return i})(),p=class{overlayRef;config;componentInstance=null;componentRef=null;containerInstance;disableClose;closed=new I;backdropClick;keydownEvents;outsidePointerEvents;id;_detachSubscription;constructor(o,t){this.overlayRef=o,this.config=t,this.disableClose=t.disableClose,this.backdropClick=o.backdropClick(),this.keydownEvents=o.keydownEvents(),this.outsidePointerEvents=o.outsidePointerEvents(),this.id=t.id,this.keydownEvents.subscribe(e=>{e.keyCode===27&&!this.disableClose&&!Qe(e)&&(e.preventDefault(),this.close(void 0,{focusOrigin:`keyboard`}))}),this.backdropClick.subscribe(()=>{!this.disableClose&&this._canClose()?this.close(void 0,{focusOrigin:`mouse`}):this.containerInstance._recaptureFocus?.()}),this._detachSubscription=o.detachments().subscribe(()=>{t.closeOnOverlayDetachments!==!1&&this.close()})}close(o,t){if(this._canClose(o)){let e=this.closed;this.containerInstance._closeInteractionType=t?.focusOrigin||`program`,this._detachSubscription.unsubscribe(),this.overlayRef.dispose(),e.next(o),e.complete(),this.componentInstance=this.containerInstance=null}}updatePosition(){return this.overlayRef.updatePosition(),this}updateSize(o=``,t=``){return this.overlayRef.updateSize({width:o,height:t}),this}addPanelClass(o){return this.overlayRef.addPanelClass(o),this}removePanelClass(o){return this.overlayRef.removePanelClass(o),this}_canClose(o){let t=this.config;return!!this.containerInstance&&(!t.closePredicate||t.closePredicate(o,t,this.componentInstance))}},le=new N(`DialogScrollStrategy`,{providedIn:`root`,factory:()=>{let i=y(X$1);return()=>Xt$1(i)}}),de=new N(`DialogData`),ce=new N(`DefaultDialogConfig`);J=(()=>{class i{_injector=y(X$1);_defaultOptions=y(ce,{optional:!0});_parentDialog=y(i,{optional:!0,skipSelf:!0});_overlayContainer=y(Zt);_idGenerator=y(Ie);_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new I;_afterOpenedAtThisLevel=new I;_ariaHiddenElements=new Map;_scrollStrategy=y(le);get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}afterAllClosed=ke(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(Jm(void 0)));open(t,e){let n=this._defaultOptions||new u;e=w$1(w$1({},n),e),e.id=e.id||this._idGenerator.getId(`cdk-dialog-`),e.id&&this.getDialogById(e.id);let a=this._getOverlayConfig(e),r=st(this._injector,a),l=new p(r,e),d=this._attachContainer(r,l,e);if(l.containerInstance=d,!this.openDialogs.length){let G=this._overlayContainer.getContainerElement();d._focusTrapped?d._focusTrapped.pipe(Se(1)).subscribe(()=>{this._hideNonDialogContentFromAssistiveTechnology(G)}):this._hideNonDialogContentFromAssistiveTechnology(G)}return this._attachDialogContent(t,l,d,e),this.openDialogs.push(l),l.closed.subscribe(()=>this._removeOpenDialog(l,!0)),this.afterOpened.next(l),l}closeAll(){K(this.openDialogs,t=>t.close())}getDialogById(t){return this.openDialogs.find(e=>e.id===t)}ngOnDestroy(){K(this._openDialogsAtThisLevel,t=>{t.config.closeOnDestroy===!1&&this._removeOpenDialog(t,!1)}),K(this._openDialogsAtThisLevel,t=>t.close()),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete(),this._openDialogsAtThisLevel=[]}_getOverlayConfig(t){let e=new D({positionStrategy:t.positionStrategy||jt$1().centerHorizontally().centerVertically(),scrollStrategy:t.scrollStrategy||this._scrollStrategy(),panelClass:t.panelClass,hasBackdrop:t.hasBackdrop,direction:t.direction,minWidth:t.minWidth,minHeight:t.minHeight,maxWidth:t.maxWidth,maxHeight:t.maxHeight,width:t.width,height:t.height,disposeOnNavigation:t.closeOnNavigation,disableAnimations:t.disableAnimations});return t.backdropClass&&(e.backdropClass=t.backdropClass),e}_attachContainer(t,e,n){let a=n.injector||n.viewContainerRef?.injector,r=[{provide:u,useValue:n},{provide:p,useValue:e},{provide:N$1,useValue:t}],l;n.container?typeof n.container==`function`?l=n.container:(l=n.container.type,r.push(...n.container.providers(n))):l=X;let d=new p$1(l,n.viewContainerRef,X$1.create({parent:a||this._injector,providers:r}));return t.attach(d).instance}_attachDialogContent(t,e,n,a){if(t instanceof Fo){let r=this._createInjector(a,e,n,void 0),l={$implicit:a.data,dialogRef:e};a.templateContext&&(l=w$1(w$1({},l),typeof a.templateContext==`function`?a.templateContext():a.templateContext)),n.attachTemplatePortal(new s(t,null,l,r))}else{let r=this._createInjector(a,e,n,this._injector),l=n.attachComponentPortal(new p$1(t,a.viewContainerRef,r,null,a.bindings));e.componentRef=l,e.componentInstance=l.instance}}_createInjector(t,e,n,a){let r=t.injector||t.viewContainerRef?.injector,l=[{provide:de,useValue:t.data},{provide:p,useValue:e}];return t.providers&&(typeof t.providers==`function`?l.push(...t.providers(e,t,n)):l.push(...t.providers)),t.direction&&(!r||!r.get(S$1,null,{optional:!0}))&&l.push({provide:S$1,useValue:me(t.direction)}),X$1.create({parent:r||a,providers:l})}_removeOpenDialog(t,e){let n=this.openDialogs.indexOf(t);n>-1&&(this.openDialogs.splice(n,1),this.openDialogs.length||(this._ariaHiddenElements.forEach((a,r)=>{a?r.setAttribute(`aria-hidden`,a):r.removeAttribute(`aria-hidden`)}),this._ariaHiddenElements.clear(),e&&this._getAfterAllClosed().next()))}_hideNonDialogContentFromAssistiveTechnology(t){if(t.parentElement){let e=t.parentElement.children;for(let n=e.length-1;n>-1;n--){let a=e[n];a!==t&&a.nodeName!==`SCRIPT`&&a.nodeName!==`STYLE`&&!a.hasAttribute(`aria-live`)&&!a.hasAttribute(`popover`)&&(this._ariaHiddenElements.set(a,a.getAttribute(`aria-hidden`)),a.setAttribute(`aria-hidden`,`true`))}}}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}static ɵfac=function(e){return new(e||i)};static ɵprov=Xt({token:i,factory:i.ɵfac})}return i})();Bt=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵmod=em({type:i});static ɵinj=Ws({providers:[J],imports:[ye$1,z$1,si$1,z$1]})}return i})()});function Gt(i){return i==null?null:typeof i==`number`?i:i.endsWith(`ms`)?pe$1(i.substring(0,i.length-2)):i.endsWith(`s`)?pe$1(i.substring(0,i.length-1))*1e3:i===`0`?0:null}function Wt(i,o,t){return i._closeInteractionType=o,i.close(t)}function qt(i,o){let t=i.nativeElement.parentElement;for(;t&&!t.classList.contains(`mat-mdc-dialog-container`);)t=t.parentElement;return t?o.find(e=>e.id===t.id):null}var H;var tt;var zt;var Vt;var ge;var he;var ue;var Ht;var V;var w;var pe;var fe;var _e;var et;var ai;var Qt;var oi;var si;var ri;var li;var be=z(()=>{"use strict";ve();M_();M_();jt();di();k();Ut$1();du();Jd();Xe();ai$1();Le();_$1();H=class{viewContainerRef;injector;id;role=`dialog`;panelClass=``;hasBackdrop=!0;backdropClass=``;disableClose=!1;closePredicate;width=``;height=``;minWidth;minHeight;maxWidth;maxHeight;position;data=null;direction;ariaDescribedBy=null;ariaLabelledBy=null;ariaLabel=null;ariaModal=!1;autoFocus=`first-tabbable`;restoreFocus=!0;delayFocusTrap=!0;scrollStrategy;closeOnNavigation=!0;enterAnimationDuration;exitAnimationDuration;bindings},tt=`mdc-dialog--open`,zt=`mdc-dialog--opening`,Vt=`mdc-dialog--closing`,ge=150,he=75,ue=(()=>{class i extends X{_animationStateChanged=new Ze;_animationsEnabled=!Fi();_actionSectionCount=0;_hostElement=this._elementRef.nativeElement;_enterAnimationDuration=this._animationsEnabled?Gt(this._config.enterAnimationDuration)??ge:0;_exitAnimationDuration=this._animationsEnabled?Gt(this._config.exitAnimationDuration)??he:0;_animationTimer=null;_contentAttached(){super._contentAttached(),this._startOpenAnimation()}_startOpenAnimation(){this._animationStateChanged.emit({state:`opening`,totalTime:this._enterAnimationDuration}),this._animationsEnabled?(this._hostElement.style.setProperty(Ht,`${this._enterAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(zt,tt)),this._waitForAnimationToComplete(this._enterAnimationDuration,this._finishDialogOpen)):(this._hostElement.classList.add(tt),Promise.resolve().then(()=>this._finishDialogOpen()))}_startExitAnimation(){this._animationStateChanged.emit({state:`closing`,totalTime:this._exitAnimationDuration}),this._hostElement.classList.remove(tt),this._animationsEnabled?(this._hostElement.style.setProperty(Ht,`${this._exitAnimationDuration}ms`),this._requestAnimationFrame(()=>this._hostElement.classList.add(Vt)),this._waitForAnimationToComplete(this._exitAnimationDuration,this._finishDialogClose)):Promise.resolve().then(()=>this._finishDialogClose())}_updateActionSectionCount(t){this._actionSectionCount+=t,this._changeDetectorRef.markForCheck()}_finishDialogOpen=()=>{this._clearAnimationClasses(),this._openAnimationDone(this._enterAnimationDuration)};_finishDialogClose=()=>{this._clearAnimationClasses(),this._animationStateChanged.emit({state:`closed`,totalTime:this._exitAnimationDuration})};_clearAnimationClasses(){this._hostElement.classList.remove(zt,Vt)}_waitForAnimationToComplete(t,e){this._animationTimer!==null&&clearTimeout(this._animationTimer),this._animationTimer=setTimeout(e,t)}_requestAnimationFrame(t){this._ngZone.runOutsideAngular(()=>{typeof requestAnimationFrame==`function`?requestAnimationFrame(t):t()})}_captureInitialFocus(){this._config.delayFocusTrap||this._trapFocus()}_openAnimationDone(t){this._config.delayFocusTrap&&this._trapFocus(),this._animationStateChanged.next({state:`opened`,totalTime:t})}ngOnDestroy(){super.ngOnDestroy(),this._animationTimer!==null&&clearTimeout(this._animationTimer)}attachComponentPortal(t){let e=super.attachComponentPortal(t);return e.location.nativeElement.classList.add(`mat-mdc-dialog-component-host`),e}static ɵfac=(()=>{let t;return function(n){return(t||(t=MI(i)))(n||i)}})();static ɵcmp=(function(){function t(e,n){}return iw({type:i,selectors:[[`mat-dialog-container`]],hostAttrs:[`tabindex`,`-1`,1,`mat-mdc-dialog-container`,`mdc-dialog`],hostVars:10,hostBindings:function(n,a){n&2&&(Rm(`id`,a._config.id),Cm(`aria-modal`,a._config.ariaModal)(`role`,a._config.role)(`aria-labelledby`,a._config.ariaLabel?null:a._ariaLabelledByQueue[0])(`aria-label`,a._config.ariaLabel)(`aria-describedby`,a._config.ariaDescribedBy||null),cv(`_mat-animation-noopable`,!a._animationsEnabled)(`mat-mdc-dialog-container-with-actions`,a._actionSectionCount>0))},features:[sm],decls:3,vars:0,consts:[[1,`mat-mdc-dialog-inner-container`,`mdc-dialog__container`],[1,`mat-mdc-dialog-surface`,`mdc-dialog__surface`],[`cdkPortalOutlet`,``]],template:function(n,a){n&1&&(Si(0,`div`,0)(1,`div`,1),cm(2,t,0,0,`ng-template`,2),Jl()())},dependencies:[U],styles:[`.mat-mdc-dialog-container {
  width: 100%;
  height: 100%;
  display: block;
  box-sizing: border-box;
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
  outline: 0;
}

.cdk-overlay-pane.mat-mdc-dialog-panel {
  max-width: var(--%NS%mat-dialog-container-max-width, 560px);
  min-width: var(--%NS%mat-dialog-container-min-width, 280px);
}
@media (max-width: 599px) {
  .cdk-overlay-pane.mat-mdc-dialog-panel {
    max-width: var(--%NS%mat-dialog-container-small-max-width, calc(100vw - 32px));
  }
}

.mat-mdc-dialog-inner-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  box-sizing: border-box;
  height: 100%;
  opacity: 0;
  transition: opacity linear var(--%NS%mat-dialog-transition-duration, 0ms);
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
}
.mdc-dialog--closing .mat-mdc-dialog-inner-container {
  transition: opacity 75ms linear;
  transform: none;
}
.mdc-dialog--open .mat-mdc-dialog-inner-container {
  opacity: 1;
}
._mat-animation-noopable .mat-mdc-dialog-inner-container {
  transition: none;
}

.mat-mdc-dialog-surface {
  display: flex;
  flex-direction: column;
  flex-grow: 0;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;
  outline: 0;
  transform: scale(0.8);
  transition: transform var(--%NS%mat-dialog-transition-duration, 0ms) cubic-bezier(0, 0, 0.2, 1);
  max-height: inherit;
  min-height: inherit;
  min-width: inherit;
  max-width: inherit;
  box-shadow: var(--%NS%mat-dialog-container-elevation-shadow, none);
  border-radius: var(--%NS%mat-dialog-container-shape, var(--%NS%mat-sys-corner-extra-large, 4px));
  background-color: var(--%NS%mat-dialog-container-color, var(--%NS%mat-sys-surface, white));
}
[dir=rtl] .mat-mdc-dialog-surface {
  text-align: right;
}
.mdc-dialog--open .mat-mdc-dialog-surface, .mdc-dialog--closing .mat-mdc-dialog-surface {
  transform: none;
}
._mat-animation-noopable .mat-mdc-dialog-surface {
  transition: none;
}
.mat-mdc-dialog-surface::before {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 2px solid transparent;
  border-radius: inherit;
  content: "";
  pointer-events: none;
}

.mat-mdc-dialog-title {
  display: block;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  margin: 0 0 1px;
  padding: var(--%NS%mat-dialog-headline-padding, 6px 24px 13px);
}
.mat-mdc-dialog-title::before {
  display: inline-block;
  width: 0;
  height: 40px;
  content: "";
  vertical-align: 0;
}
[dir=rtl] .mat-mdc-dialog-title {
  text-align: right;
}
.mat-mdc-dialog-container .mat-mdc-dialog-title {
  color: var(--%NS%mat-dialog-subhead-color, var(--%NS%mat-sys-on-surface, rgba(0, 0, 0, 0.87)));
  font-family: var(--%NS%mat-dialog-subhead-font, var(--%NS%mat-sys-headline-small-font, inherit));
  line-height: var(--%NS%mat-dialog-subhead-line-height, var(--%NS%mat-sys-headline-small-line-height, 1.5rem));
  font-size: var(--%NS%mat-dialog-subhead-size, var(--%NS%mat-sys-headline-small-size, 1rem));
  font-weight: var(--%NS%mat-dialog-subhead-weight, var(--%NS%mat-sys-headline-small-weight, 400));
  letter-spacing: var(--%NS%mat-dialog-subhead-tracking, var(--%NS%mat-sys-headline-small-tracking, 0.03125em));
}

.mat-mdc-dialog-content {
  display: block;
  flex-grow: 1;
  box-sizing: border-box;
  margin: 0;
  overflow: auto;
  max-height: 65vh;
}
.mat-mdc-dialog-content > :first-child {
  margin-top: 0;
}
.mat-mdc-dialog-content > :last-child {
  margin-bottom: 0;
}
.mat-mdc-dialog-container .mat-mdc-dialog-content {
  color: var(--%NS%mat-dialog-supporting-text-color, var(--%NS%mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6)));
  font-family: var(--%NS%mat-dialog-supporting-text-font, var(--%NS%mat-sys-body-medium-font, inherit));
  line-height: var(--%NS%mat-dialog-supporting-text-line-height, var(--%NS%mat-sys-body-medium-line-height, 1.5rem));
  font-size: var(--%NS%mat-dialog-supporting-text-size, var(--%NS%mat-sys-body-medium-size, 1rem));
  font-weight: var(--%NS%mat-dialog-supporting-text-weight, var(--%NS%mat-sys-body-medium-weight, 400));
  letter-spacing: var(--%NS%mat-dialog-supporting-text-tracking, var(--%NS%mat-sys-body-medium-tracking, 0.03125em));
}
.mat-mdc-dialog-container .mat-mdc-dialog-content {
  padding: var(--%NS%mat-dialog-content-padding, 20px 24px);
}
.mat-mdc-dialog-container-with-actions .mat-mdc-dialog-content {
  padding: var(--%NS%mat-dialog-with-actions-content-padding, 20px 24px 0);
}
.mat-mdc-dialog-container .mat-mdc-dialog-title + .mat-mdc-dialog-content {
  padding-top: 0;
}

.mat-mdc-dialog-actions {
  display: flex;
  position: relative;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  box-sizing: border-box;
  min-height: 52px;
  margin: 0;
  border-top: 1px solid transparent;
  padding: var(--%NS%mat-dialog-actions-padding, 16px 24px);
  justify-content: var(--%NS%mat-dialog-actions-alignment, flex-end);
}
@media (forced-colors: active) {
  .mat-mdc-dialog-actions {
    border-top-color: CanvasText;
  }
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-start, .mat-mdc-dialog-actions[align=start] {
  justify-content: start;
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-center, .mat-mdc-dialog-actions[align=center] {
  justify-content: center;
}
.mat-mdc-dialog-actions.mat-mdc-dialog-actions-align-end, .mat-mdc-dialog-actions[align=end] {
  justify-content: flex-end;
}
.mat-mdc-dialog-actions .mat-button-base + .mat-button-base,
.mat-mdc-dialog-actions .mat-mdc-button-base + .mat-mdc-button-base {
  margin-left: 8px;
}
[dir=rtl] .mat-mdc-dialog-actions .mat-button-base + .mat-button-base,
[dir=rtl] .mat-mdc-dialog-actions .mat-mdc-button-base + .mat-mdc-button-base {
  margin-left: 0;
  margin-right: 8px;
}

.mat-mdc-dialog-component-host {
  display: contents;
}
`],encapsulation:2,changeDetection:1})})()}return i})(),Ht=`--mat-dialog-transition-duration`;V=(function(i){return i[i.OPEN=0]=`OPEN`,i[i.CLOSING=1]=`CLOSING`,i[i.CLOSED=2]=`CLOSED`,i})(V||{}),w=class{_ref;_config;_containerInstance;componentInstance;componentRef=null;disableClose;id;_afterOpened=new Fe(1);_beforeClosed=new Fe(1);_result;_closeFallbackTimeout;_state=V.OPEN;_closeInteractionType;constructor(o,t,e){this._ref=o,this._config=t,this._containerInstance=e,this.disableClose=t.disableClose,this.id=o.id,o.addPanelClass(`mat-mdc-dialog-panel`),e._animationStateChanged.pipe(ee(n=>n.state===`opened`),Se(1)).subscribe(()=>{this._afterOpened.next(),this._afterOpened.complete()}),e._animationStateChanged.pipe(ee(n=>n.state===`closed`),Se(1)).subscribe(()=>{clearTimeout(this._closeFallbackTimeout),this._finishDialogClose()}),o.overlayRef.detachments().subscribe(()=>{this._beforeClosed.next(this._result),this._beforeClosed.complete(),this._finishDialogClose()}),Mf(this.backdropClick(),this.keydownEvents().pipe(ee(n=>n.keyCode===27&&!this.disableClose&&!Qe(n)))).subscribe(n=>{this.disableClose||(n.preventDefault(),Wt(this,n.type===`keydown`?`keyboard`:`mouse`))})}close(o){let t=this._config.closePredicate;t&&!t(o,this._config,this.componentInstance)||(this._result=o,this._containerInstance._animationStateChanged.pipe(ee(e=>e.state===`closing`),Se(1)).subscribe(e=>{this._beforeClosed.next(o),this._beforeClosed.complete(),this._ref.overlayRef.detachBackdrop(),this._closeFallbackTimeout=setTimeout(()=>this._finishDialogClose(),e.totalTime+100)}),this._state=V.CLOSING,this._containerInstance._startExitAnimation())}afterOpened(){return this._afterOpened}afterClosed(){return this._ref.closed}beforeClosed(){return this._beforeClosed}backdropClick(){return this._ref.backdropClick}keydownEvents(){return this._ref.keydownEvents}updatePosition(o){let t=this._ref.config.positionStrategy;return o&&(o.left||o.right)?o.left?t.left(o.left):t.right(o.right):t.centerHorizontally(),o&&(o.top||o.bottom)?o.top?t.top(o.top):t.bottom(o.bottom):t.centerVertically(),this._ref.updatePosition(),this}updateSize(o=``,t=``){return this._ref.updateSize(o,t),this}addPanelClass(o){return this._ref.addPanelClass(o),this}removePanelClass(o){return this._ref.removePanelClass(o),this}getState(){return this._state}_finishDialogClose(){this._state=V.CLOSED,this._ref.close(this._result,{focusOrigin:this._closeInteractionType}),this.componentInstance=null}};pe=new N(`MatMdcDialogData`),fe=new N(`mat-mdc-dialog-default-options`),_e=new N(`mat-mdc-dialog-scroll-strategy`,{providedIn:`root`,factory:()=>{let i=y(X$1);return()=>Xt$1(i)}}),et=(()=>{class i{_defaultOptions=y(fe,{optional:!0});_scrollStrategy=y(_e);_parentDialog=y(i,{optional:!0,skipSelf:!0});_idGenerator=y(Ie);_injector=y(X$1);_dialog=y(J);_animationsDisabled=Fi();_openDialogsAtThisLevel=[];_afterAllClosedAtThisLevel=new I;_afterOpenedAtThisLevel=new I;dialogConfigClass=H;_dialogRefConstructor;_dialogContainerType;_dialogDataToken;get openDialogs(){return this._parentDialog?this._parentDialog.openDialogs:this._openDialogsAtThisLevel}get afterOpened(){return this._parentDialog?this._parentDialog.afterOpened:this._afterOpenedAtThisLevel}_getAfterAllClosed(){let t=this._parentDialog;return t?t._getAfterAllClosed():this._afterAllClosedAtThisLevel}afterAllClosed=ke(()=>this.openDialogs.length?this._getAfterAllClosed():this._getAfterAllClosed().pipe(Jm(void 0)));constructor(){this._dialogRefConstructor=w,this._dialogContainerType=ue,this._dialogDataToken=pe}open(t,e){let n;e=w$1(w$1({},this._defaultOptions||new H),e),e.id=e.id||this._idGenerator.getId(`mat-mdc-dialog-`),e.scrollStrategy=e.scrollStrategy||this._scrollStrategy();let a=this._dialog.open(t,x(w$1({},e),{positionStrategy:jt$1(this._injector).centerHorizontally().centerVertically(),disableClose:!0,closePredicate:void 0,closeOnDestroy:!1,closeOnOverlayDetachments:!1,disableAnimations:this._animationsDisabled||e.enterAnimationDuration?.toLocaleString()===`0`||e.exitAnimationDuration?.toString()===`0`,container:{type:this._dialogContainerType,providers:()=>[{provide:this.dialogConfigClass,useValue:e},{provide:u,useValue:e}]},templateContext:()=>({dialogRef:n}),providers:(r,l,d)=>(n=new this._dialogRefConstructor(r,e,d),n.updatePosition(e?.position),[{provide:this._dialogContainerType,useValue:d},{provide:this._dialogDataToken,useValue:l.data},{provide:this._dialogRefConstructor,useValue:n},{provide:p,useValue:null}])}));return n.componentRef=a.componentRef,n.componentInstance=a.componentInstance,this.openDialogs.push(n),this.afterOpened.next(n),n.afterClosed().subscribe(()=>{let r=this.openDialogs.indexOf(n);r>-1&&(this.openDialogs.splice(r,1),this.openDialogs.length||this._getAfterAllClosed().next())}),n}closeAll(){this._closeDialogs(this.openDialogs)}getDialogById(t){return this.openDialogs.find(e=>e.id===t)}ngOnDestroy(){this._closeDialogs(this._openDialogsAtThisLevel),this._afterAllClosedAtThisLevel.complete(),this._afterOpenedAtThisLevel.complete()}_closeDialogs(t){let e=t.length;for(;e--;)t[e].close()}static ɵfac=function(e){return new(e||i)};static ɵprov=Xt({token:i,factory:i.ɵfac})}return i})(),ai=(()=>{class i{dialogRef=y(w,{optional:!0});_elementRef=y(zo);_dialog=y(et);ariaLabel;type=`button`;dialogResult;_matDialogClose;ngOnInit(){this.dialogRef||(this.dialogRef=qt(this._elementRef,this._dialog.openDialogs))}ngOnChanges(t){let e=t._matDialogClose;e&&(this.dialogResult=e.currentValue)}_onButtonClick(t){this._elementRef.nativeElement.getAttribute(`aria-disabled`)!==`true`&&Wt(this.dialogRef,t.screenX===0&&t.screenY===0?`keyboard`:`mouse`,this.dialogResult)}static ɵfac=function(e){return new(e||i)};static ɵdir=lw({type:i,selectors:[[``,`mat-dialog-close`,``],[``,`matDialogClose`,``]],hostVars:2,hostBindings:function(e,n){e&1&&Jm$1(`click`,function(r){return n._onButtonClick(r)}),e&2&&Cm(`aria-label`,n.ariaLabel||null)(`type`,n.type)},inputs:{ariaLabel:[0,`aria-label`,`ariaLabel`],type:`type`,dialogResult:[0,`mat-dialog-close`,`dialogResult`],_matDialogClose:[0,`matDialogClose`,`_matDialogClose`]},exportAs:[`matDialogClose`],features:[aI]})}return i})(),Qt=(()=>{class i{_dialogRef=y(w,{optional:!0});_elementRef=y(zo);_dialog=y(et);ngOnInit(){this._dialogRef||(this._dialogRef=qt(this._elementRef,this._dialog.openDialogs)),this._dialogRef&&Promise.resolve().then(()=>{this._onAdd()})}ngOnDestroy(){this._dialogRef?._containerInstance&&Promise.resolve().then(()=>{this._onRemove()})}static ɵfac=function(e){return new(e||i)};static ɵdir=lw({type:i})}return i})(),oi=(()=>{class i extends Qt{id=y(Ie).getId(`mat-mdc-dialog-title-`);_onAdd(){this._dialogRef._containerInstance?._addAriaLabelledBy?.(this.id)}_onRemove(){this._dialogRef?._containerInstance?._removeAriaLabelledBy?.(this.id)}static ɵfac=(()=>{let t;return function(n){return(t||(t=MI(i)))(n||i)}})();static ɵdir=lw({type:i,selectors:[[``,`mat-dialog-title`,``],[``,`matDialogTitle`,``]],hostAttrs:[1,`mat-mdc-dialog-title`,`mdc-dialog__title`],hostVars:1,hostBindings:function(e,n){e&2&&Rm(`id`,n.id)},inputs:{id:`id`},exportAs:[`matDialogTitle`],features:[sm]})}return i})(),si=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵdir=lw({type:i,selectors:[[``,`mat-dialog-content`,``],[`mat-dialog-content`],[``,`matDialogContent`,``]],hostAttrs:[1,`mat-mdc-dialog-content`,`mdc-dialog__content`],features:[mw([me$1])]})}return i})(),ri=(()=>{class i extends Qt{align;_onAdd(){this._dialogRef._containerInstance?._updateActionSectionCount?.(1)}_onRemove(){this._dialogRef._containerInstance?._updateActionSectionCount?.(-1)}static ɵfac=(()=>{let t;return function(n){return(t||(t=MI(i)))(n||i)}})();static ɵdir=lw({type:i,selectors:[[``,`mat-dialog-actions`,``],[`mat-dialog-actions`],[``,`matDialogActions`,``]],hostAttrs:[1,`mat-mdc-dialog-actions`,`mdc-dialog__actions`],hostVars:6,hostBindings:function(e,n){e&2&&cv(`mat-mdc-dialog-actions-align-start`,n.align===`start`)(`mat-mdc-dialog-actions-align-center`,n.align===`center`)(`mat-mdc-dialog-actions-align-end`,n.align===`end`)},inputs:{align:`align`},features:[sm]})}return i})();li=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵmod=em({type:i});static ɵinj=Ws({providers:[et],imports:[Bt,ye$1,z$1,O]})}return i})()});export{be as a,li as c,ri as d,si as f,ai as i,oi as l,J as n,et as o,w as p,X as r,jt as s,Bt as t,pe as u};