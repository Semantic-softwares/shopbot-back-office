import{c as z}from"./chunk-RykAvsdd.js";import{At as ge,E as Jm,in as ur,ot as Xm,w as J,wt as du,x as I,z as P}from"./chunk-DMEhUgHW.js";import{$t as aM,An as iM,Ar as uN,B as Jm$1,Cn as eu,Cr as sw,Ct as UL,D as HL,E as Ge,Fr as uw,Hr as wm,Ir as vN,It as Xd,Jr as y,Kn as lm,Kr as xd,Kt as ZM,Ln as jo,Lr as vi,Or as tv,Q as Nm,Qn as nM,Qt as _m,T as GL,U as KM,Vt as Xt,Wn as lN,Xt as __,Z as N,a as Ad,c as BM,cn as cM,dn as cv,g as DM,h as Ct,ht as SI,i as AL,ii as zs,kr as uM,ln as cN,m as Cm,mn as dT,mr as rN,mt as Rm,pr as rM,pt as RM,qt as Ze,rn as av,rr as nv,sn as cI,ti as z$1,un as cm,ur as qM,ut as Qo,vr as sN,vt as Si,xn as em,xr as sm,yr as sS,yt as Tc,z as Ji,zr as vv}from"./chunk-DTckT2H2.js";import{S as hn,u as Nn}from"./chunk-Bodb_Sun.js";import{An as Ie,Cn as Ae,En as Ct$1,Fn as Qe,G as Dt,J as zt,K as gt$1,Ln as Ut$1,Pn as Ot,Qt as k,St as m,Un as ai,Vn as _$1,Xn as et,Yt as U,Zn as fe,cn as O,cr as ut,dn as f,en as s,fn as Ae$1,gn as de,gr as x,hn as ce,kn as Fi,ln as S,mn as G,mr as V,pn as Fe,pr as L,tn as z$2,un as _,xt as d,zn as Xe}from"./chunk-BnCWAQsu.js";import{p as Yn$1,t as Et}from"./chunk-DOjBFkEa.js";import{o as Mn,x as h}from"./chunk-8fDZZi2k.js";function ve(t){return typeof t==`function`}function jt(t){return ve(t)?t().valid():t.valid}function vt(t){return ve(t)?t().invalid():t.invalid}function qt(t){return ve(t)?t().pending():t.pending}function Gt(t){ve(t)?t().reset():t.reset()}var ke;var we;var R;var Qt;var be;var q;var gt;var _t;var yt;var xt=z(()=>{"use strict";__();__();Mn();du();Xd();f();Ot();Ct$1();Xe();fe();_();ke=(()=>{class t{_elementRef=y(Qo);focus(){this._elementRef.nativeElement.focus()}static ɵfac=function(n){return new(n||t)};static ɵdir=uw({type:t,selectors:[[``,`cdkStepHeader`,``]],hostAttrs:[`role`,`tab`]})}return t})(),we=(()=>{class t{template=y(jo);static ɵfac=function(n){return new(n||t)};static ɵdir=uw({type:t,selectors:[[``,`cdkStepLabel`,``]]})}return t})(),R={NUMBER:`number`,EDIT:`edit`,DONE:`done`,ERROR:`error`},Qt=new N(`STEPPER_GLOBAL_OPTIONS`),be=(()=>{class t{_stepperOptions;_stepper=y(q);_displayDefaultIndicatorType;stepLabel;_childForms;content;stepControl;get interacted(){return this._interacted()}set interacted(e){this._interacted.set(e)}_interacted=Ge(!1);interactedStream=new Ze;label;errorMessage;ariaLabel;ariaLabelledby;get state(){return this._state()}set state(e){this._state.set(e)}_state=Ge(void 0);get editable(){return this._editable()}set editable(e){this._editable.set(e)}_editable=Ge(!0);optional=!1;get completed(){let e=this._completedOverride(),n=this._interacted();return e??(n&&(!this.stepControl||jt(this.stepControl)))}set completed(e){this._completedOverride.set(e)}_completedOverride=Ge(null);index=Ge(-1);isSelected=Ct(()=>this._stepper.selectedIndex===this.index());indicatorType=Ct(()=>{let e=this.isSelected(),n=this.completed,r=this._state()??R.NUMBER,l=this._editable();return this._showError()&&this.hasError&&!e?R.ERROR:this._displayDefaultIndicatorType?!n||e?R.NUMBER:l?R.EDIT:R.DONE:n&&!e?R.DONE:n&&e?r:l&&e?R.EDIT:r});isNavigable=Ct(()=>{let e=this.isSelected();return this.completed||e||!this._stepper.linear});get hasError(){return this._customError()??this._getDefaultError()}set hasError(e){this._customError.set(e)}_customError=Ge(null);_getDefaultError(){return this.interacted&&!!this.stepControl&&vt(this.stepControl)}constructor(){let e=y(Qt,{optional:!0});this._stepperOptions=e||{},this._displayDefaultIndicatorType=this._stepperOptions.displayDefaultIndicatorType!==!1}select(){this._stepper.selected=this}reset(){this._interacted.set(!1),this._completedOverride()!=null&&this._completedOverride.set(!1),this._customError()!=null&&this._customError.set(!1),this.stepControl&&(this._childForms?.forEach(e=>e.resetForm?.()),Gt(this.stepControl))}ngOnChanges(){this._stepper._stateChanged()}_markAsInteracted(){this._interacted()||(this._interacted.set(!0),this.interactedStream.emit(this))}_showError(){return this._stepperOptions.showError??this._customError()!=null}static ɵfac=function(n){return new(n||t)};static ɵcmp=(function(){let e=[`*`];function n(r,l){r&1&&iM(0)}return sw({type:t,selectors:[[`cdk-step`]],contentQueries:function(l,h$1,g){if(l&1&&tv(g,we,5)(g,h,5),l&2){let z;aM(z=cM())&&(h$1.stepLabel=z.first),aM(z=cM())&&(h$1._childForms=z)}},viewQuery:function(l,h){if(l&1&&nv(jo,7),l&2){let g;aM(g=cM())&&(h.content=g.first)}},inputs:{stepControl:`stepControl`,label:`label`,errorMessage:`errorMessage`,ariaLabel:[0,`aria-label`,`ariaLabel`],ariaLabelledby:[0,`aria-labelledby`,`ariaLabelledby`],state:`state`,editable:[2,`editable`,`editable`,UL],optional:[2,`optional`,`optional`,UL],completed:[2,`completed`,`completed`,UL],hasError:[2,`hasError`,`hasError`,UL]},outputs:{interactedStream:`interacted`},exportAs:[`cdkStep`],features:[cI],ngContentSelectors:e,decls:1,vars:0,template:function(l,h){l&1&&(rM(),lm(0,n,1,0,`ng-template`))},encapsulation:2})})()}return t})(),q=(()=>{class t{_dir=y(S,{optional:!0});_changeDetectorRef=y(HL);_elementRef=y(Qo);_destroyed=new I;_keyManager;_steps;steps=new vi;_stepHeader;_sortedHeaders=new vi;get linear(){return this._linear()}set linear(e){this._linear.set(e)}_linear=Ge(!1);get selectedIndex(){return this._selectedIndex()}set selectedIndex(e){this._steps?(this._isValidIndex(e),this.selectedIndex!==e&&(this.selected?._markAsInteracted(),!this._anyControlsInvalidOrPending(e)&&(e>=this.selectedIndex||this.steps.toArray()[e].editable)&&this._updateSelectedItemIndex(e))):this._selectedIndex.set(e)}_selectedIndex=Ge(0);get selected(){return this.steps?this.steps.toArray()[this.selectedIndex]:void 0}set selected(e){this.selectedIndex=e&&this.steps?this.steps.toArray().indexOf(e):-1}selectionChange=new Ze;selectedIndexChange=new Ze;_groupId=y(Ie).getId(`cdk-stepper-`);get orientation(){return this._orientation}set orientation(e){this._orientation=e,this._keyManager&&this._keyManager.withVerticalOrientation(e===`vertical`)}_orientation=`horizontal`;ngAfterContentInit(){this._steps.changes.pipe(Jm(this._steps),Xm(this._destroyed)).subscribe(e=>{this.steps.reset(e.filter(n=>n._stepper===this)),this.steps.forEach((n,r)=>n.index.set(r)),this.steps.notifyOnChanges()})}ngAfterViewInit(){if(this._stepHeader.changes.pipe(Jm(this._stepHeader),Xm(this._destroyed)).subscribe(e=>{this._sortedHeaders.reset(e.toArray().sort((n,r)=>n._elementRef.nativeElement.compareDocumentPosition(r._elementRef.nativeElement)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1)),this._sortedHeaders.notifyOnChanges()}),this._keyManager=new Ae(this._sortedHeaders).withWrap().withHomeAndEnd().withVerticalOrientation(this._orientation===`vertical`),this._keyManager.updateActiveItem(this.selectedIndex),(this._dir?this._dir.change:ur()).pipe(Jm(this._layoutDirection()),Xm(this._destroyed)).subscribe(e=>this._keyManager?.withHorizontalOrientation(e)),this._keyManager.updateActiveItem(this.selectedIndex),this.steps.changes.subscribe(()=>{this.selected||this._selectedIndex.set(Math.max(this.selectedIndex-1,0))}),this._isValidIndex(this.selectedIndex)||this._selectedIndex.set(0),this.linear&&this.selectedIndex>0){let e=this.steps.toArray().slice(0,this._selectedIndex());for(let n of e)n._markAsInteracted()}}ngOnDestroy(){this._keyManager?.destroy(),this.steps.destroy(),this._sortedHeaders.destroy(),this._destroyed.next(),this._destroyed.complete()}next(){this.selectedIndex=Math.min(this._selectedIndex()+1,this.steps.length-1)}previous(){this.selectedIndex=Math.max(this._selectedIndex()-1,0)}reset(){this._updateSelectedItemIndex(0),this.steps.forEach(e=>e.reset()),this._stateChanged()}_getStepLabelId(e){return`${this._groupId}-label-${e}`}_getStepContentId(e){return`${this._groupId}-content-${e}`}_stateChanged(){this._changeDetectorRef.markForCheck()}_getAnimationDirection(e){let n=e-this._selectedIndex();return n<0?this._layoutDirection()===`rtl`?`next`:`previous`:n>0?this._layoutDirection()===`rtl`?`previous`:`next`:`current`}_getFocusIndex(){return this._keyManager?this._keyManager.activeItemIndex:this._selectedIndex()}_updateSelectedItemIndex(e){let n=this.steps.toArray(),r=this._selectedIndex();this.selectionChange.emit({selectedIndex:e,previouslySelectedIndex:r,selectedStep:n[e],previouslySelectedStep:n[r]}),this._keyManager&&(this._containsFocus()?this._keyManager.setActiveItem(e):this._keyManager.updateActiveItem(e)),this._selectedIndex.set(e),this.selectedIndexChange.emit(e),this._stateChanged()}_onKeydown(e){let n=Qe(e),r=e.keyCode,l=this._keyManager;l?.activeItemIndex!=null&&!n&&(r===32||r===13)?(this.selectedIndex=l.activeItemIndex,e.preventDefault()):l?.setFocusOrigin(`keyboard`).onKeydown(e)}_anyControlsInvalidOrPending(e){return this.linear&&e>=0?this.steps.toArray().slice(0,e).some(n=>{let r=n.stepControl;return(r?vt(r)||qt(r)||!n.interacted:!n.completed)&&!n.optional&&!n._completedOverride()}):!1}_layoutDirection(){return this._dir&&this._dir.value===`rtl`?`rtl`:`ltr`}_containsFocus(){let e=this._elementRef.nativeElement,n=et();return e===n||e.contains(n)}_isValidIndex(e){return e>-1&&(!this.steps||e<this.steps.length)}static ɵfac=function(n){return new(n||t)};static ɵdir=uw({type:t,selectors:[[``,`cdkStepper`,``]],contentQueries:function(n,r,l){if(n&1&&tv(l,be,5)(l,ke,5),n&2){let h;aM(h=cM())&&(r._steps=h),aM(h=cM())&&(r._stepHeader=h)}},inputs:{linear:[2,`linear`,`linear`,UL],selectedIndex:[2,`selectedIndex`,`selectedIndex`,GL],selected:`selected`,orientation:`orientation`},outputs:{selectionChange:`selectionChange`,selectedIndexChange:`selectedIndexChange`},exportAs:[`cdkStepper`]})}return t})();gt=(()=>{class t{_stepper=y(q);type=`submit`;static ɵfac=function(n){return new(n||t)};static ɵdir=uw({type:t,selectors:[[`button`,`cdkStepperNext`,``]],hostVars:1,hostBindings:function(n,r){n&1&&Jm$1(`click`,function(){return r._stepper.next()}),n&2&&Rm(`type`,r.type)},inputs:{type:`type`}})}return t})(),_t=(()=>{class t{_stepper=y(q);type=`button`;static ɵfac=function(n){return new(n||t)};static ɵdir=uw({type:t,selectors:[[`button`,`cdkStepperPrevious`,``]],hostVars:1,hostBindings:function(n,r){n&1&&Jm$1(`click`,function(){return r._stepper.previous()}),n&2&&Rm(`type`,r.type)},inputs:{type:`type`}})}return t})(),yt=(()=>{class t{static ɵfac=function(n){return new(n||t)};static ɵmod=em({type:t});static ɵinj=zs({imports:[O]})}return t})()});var De;var Wt;var Ne;var Kt;var Ut;var Zt;var Yt;var Un;var Zn;var Yn;var Jt=z(()=>{"use strict";xt();__();__();Nn();G();k();du();Xd();ai();L();gt$1();ce();de();Et();Ut$1();_();d();De=(()=>{class t extends we{static ɵfac=(()=>{let e;return function(r){return(e||(e=SI(t)))(r||t)}})();static ɵdir=uw({type:t,selectors:[[``,`matStepLabel`,``]],features:[sm]})}return t})(),Wt=(()=>{class t{changes=new I;optionalLabel=`Optional`;completedLabel=`Completed`;editableLabel=`Editable`;static ɵfac=function(n){return new(n||t)};static ɵprov=Xt({token:t,factory:t.ɵfac})}return t})(),Ne=(()=>{class t extends ke{_intl=y(Wt);_focusMonitor=y(ut);_intlSubscription;state;label;errorMessage;iconOverrides;index;selected=!1;active=!1;optional=!1;disableRipple=!1;color;constructor(){super();let e=y(x);e.load(Fe),e.load(V);let n=y(HL);this._intlSubscription=this._intl.changes.subscribe(()=>n.markForCheck())}ngAfterViewInit(){this._focusMonitor.monitor(this._elementRef,!0)}ngOnDestroy(){this._intlSubscription.unsubscribe(),this._focusMonitor.stopMonitoring(this._elementRef)}focus(e,n){e?this._focusMonitor.focusVia(this._elementRef,e,n):this._elementRef.nativeElement.focus(n)}_stringLabel(){return this.label instanceof De?null:this.label}_templateLabel(){return this.label instanceof De?this.label:null}_getHostElement(){return this._elementRef.nativeElement}_getDefaultTextForState(e){return e==`number`?`${this.index+1}`:e==`edit`?`create`:e==`error`?`warning`:e}_hasEmptyLabel(){return!this._stringLabel()&&!this._templateLabel()&&!this._hasOptionalLabel()&&!this._hasErrorLabel()}_hasOptionalLabel(){return this.optional&&this.state!==`error`}_hasErrorLabel(){return this.state===`error`}static ɵfac=function(n){return new(n||t)};static ɵcmp=(function(){let e=(p,b,i)=>({index:p,active:b,optional:i});function n(p,b){if(p&1&&_m(0,2),p&2){let i=nM();wm(`ngTemplateOutlet`,i.iconOverrides[i.state])(`ngTemplateOutletContext`,KM(2,e,i.index,i.active,i.optional))}}function r(p,b){if(p&1&&(Si(0,`span`,7),RM(1),eu()),p&2){let i=nM(2);dT(),vv(i._getDefaultTextForState(i.state))}}function l(p,b){if(p&1&&(Si(0,`span`,8),RM(1),eu()),p&2){let i=nM(3);dT(),vv(i._intl.completedLabel)}}function h(p,b){if(p&1&&(Si(0,`span`,8),RM(1),eu()),p&2){let i=nM(3);dT(),vv(i._intl.editableLabel)}}function g(p,b){if(p&1&&(rN(0,l,2,1,`span`,8)(1,h,2,1,`span`,8),Si(2,`mat-icon`,7),RM(3),eu()),p&2){let i=nM(2);sN(i.state===`done`?0:i.state===`edit`?1:-1),dT(3),vv(i._getDefaultTextForState(i.state))}}function z(p,b){if(p&1&&rN(0,r,2,1,`span`,7)(1,g,4,2),p&2){let A=nM();sN(A.state===`number`?0:1)}}function D(p,b){p&1&&(Si(0,`div`,4),_m(1,9),eu()),p&2&&(dT(),wm(`ngTemplateOutlet`,b.template))}function ge(p,b){if(p&1&&(Si(0,`div`,4),RM(1),eu()),p&2){let i=nM();dT(),vv(i.label)}}function _e(p,b){if(p&1&&(Si(0,`div`,5),RM(1),eu()),p&2){let i=nM();dT(),vv(i._intl.optionalLabel)}}function ye(p,b){if(p&1&&(Si(0,`div`,6),RM(1),eu()),p&2){let i=nM();dT(),vv(i.errorMessage)}}return sw({type:t,selectors:[[`mat-step-header`]],hostAttrs:[`role`,``,1,`mat-step-header`],hostVars:4,hostBindings:function(b,i){b&2&&(DM(`mat-`+(i.color||`primary`)),cv(`mat-step-header-empty-label`,i._hasEmptyLabel()))},inputs:{state:`state`,label:`label`,errorMessage:`errorMessage`,iconOverrides:`iconOverrides`,index:`index`,selected:`selected`,active:`active`,optional:`optional`,disableRipple:`disableRipple`,color:`color`},features:[sm],decls:10,vars:17,consts:[[`matRipple`,``,1,`mat-step-header-ripple`,`mat-focus-indicator`,3,`matRippleTrigger`,`matRippleDisabled`],[1,`mat-step-icon-content`],[3,`ngTemplateOutlet`,`ngTemplateOutletContext`],[1,`mat-step-label`],[1,`mat-step-text-label`],[1,`mat-step-optional`],[1,`mat-step-sub-label-error`],[`aria-hidden`,`true`],[1,`cdk-visually-hidden`],[3,`ngTemplateOutlet`]],template:function(b,i){if(b&1&&(Nm(0,`div`,0),Si(1,`div`)(2,`div`,1),rN(3,n,1,6,`ng-container`,2)(4,z,2,1),eu()(),Si(5,`div`,3),rN(6,D,2,1,`div`,4)(7,ge,2,1,`div`,4),rN(8,_e,2,1,`div`,5),rN(9,ye,2,1,`div`,6),eu()),b&2){let A;wm(`matRippleTrigger`,i._getHostElement())(`matRippleDisabled`,i.disableRipple),dT(),DM(BM(`mat-step-icon-state-`,i.state,` mat-step-icon`)),cv(`mat-step-icon-selected`,i.selected),dT(2),sN(i.iconOverrides&&i.iconOverrides[i.state]?3:4),dT(2),cv(`mat-step-label-active`,i.active)(`mat-step-label-selected`,i.selected)(`mat-step-label-error`,i.state==`error`),dT(),sN((A=i._templateLabel())?6:i._stringLabel()?7:-1,A),dT(2),sN(i._hasOptionalLabel()?8:-1),dT(),sN(i._hasErrorLabel()?9:-1)}},dependencies:[Ae$1,hn,zt],styles:[`.mat-step-header {
  overflow: hidden;
  outline: none;
  cursor: pointer;
  position: relative;
  box-sizing: content-box;
  -webkit-tap-highlight-color: transparent;
}
.mat-step-header:focus-visible .mat-focus-indicator::before {
  content: "";
}
.mat-step-header:hover[aria-disabled=true] {
  cursor: default;
}
.mat-step-header:hover:not([aria-disabled]), .mat-step-header:hover[aria-disabled=false] {
  background-color: var(--%NS%mat-stepper-header-hover-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-hover-state-layer-opacity) * 100%), transparent));
  border-radius: var(--%NS%mat-stepper-header-hover-state-layer-shape, var(--%NS%mat-sys-corner-medium));
}
.mat-step-header:hover:not([aria-disabled]) .mat-step-header-ripple::before, .mat-step-header:hover[aria-disabled=false] .mat-step-header-ripple::before {
  border-radius: var(--%NS%mat-stepper-header-hover-state-layer-shape, var(--%NS%mat-sys-corner-medium));
}
.mat-step-header.cdk-keyboard-focused, .mat-step-header.cdk-program-focused {
  background-color: var(--%NS%mat-stepper-header-focus-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-focus-state-layer-opacity) * 100%), transparent));
  border-radius: var(--%NS%mat-stepper-header-focus-state-layer-shape, var(--%NS%mat-sys-corner-medium));
}
.mat-step-header.cdk-keyboard-focused .mat-step-header-ripple::before, .mat-step-header.cdk-program-focused .mat-step-header-ripple::before {
  border-radius: var(--%NS%mat-stepper-header-focus-state-layer-shape, var(--%NS%mat-sys-corner-medium));
}
@media (hover: none) {
  .mat-step-header:hover {
    background: none;
  }
}
@media (forced-colors: active) {
  .mat-step-header {
    outline: solid 1px;
  }
  .mat-step-header[aria-selected=true] .mat-step-label {
    text-decoration: underline;
  }
  .mat-step-header[aria-disabled=true] {
    outline-color: GrayText;
  }
  .mat-step-header[aria-disabled=true] .mat-step-label,
  .mat-step-header[aria-disabled=true] .mat-step-icon,
  .mat-step-header[aria-disabled=true] .mat-step-optional {
    color: GrayText;
  }
}

.mat-step-optional {
  font-size: 12px;
  color: var(--%NS%mat-stepper-header-optional-label-text-color, var(--%NS%mat-sys-on-surface-variant));
}

.mat-step-sub-label-error {
  font-size: 12px;
  font-weight: normal;
}

.mat-step-icon {
  border-radius: 50%;
  height: 24px;
  width: 24px;
  flex-shrink: 0;
  position: relative;
  color: var(--%NS%mat-stepper-header-icon-foreground-color, var(--%NS%mat-sys-surface));
  background-color: var(--%NS%mat-stepper-header-icon-background-color, var(--%NS%mat-sys-on-surface-variant));
}

.mat-step-icon-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
}

.mat-step-icon .mat-icon {
  font-size: 16px;
  height: 16px;
  width: 16px;
}

.mat-step-icon-state-error {
  background-color: var(--%NS%mat-stepper-header-error-state-icon-background-color, transparent);
  color: var(--%NS%mat-stepper-header-error-state-icon-foreground-color, var(--%NS%mat-sys-error));
}
.mat-step-icon-state-error .mat-icon {
  font-size: 24px;
  height: 24px;
  width: 24px;
}

.mat-step-label {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 50px;
  vertical-align: middle;
  font-family: var(--%NS%mat-stepper-header-label-text-font, var(--%NS%mat-sys-title-small-font));
  font-size: var(--%NS%mat-stepper-header-label-text-size, var(--%NS%mat-sys-title-small-size));
  font-weight: var(--%NS%mat-stepper-header-label-text-weight, var(--%NS%mat-sys-title-small-weight));
  color: var(--%NS%mat-stepper-header-label-text-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-step-label.mat-step-label-active {
  color: var(--%NS%mat-stepper-header-selected-state-label-text-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-step-label.mat-step-label-error {
  color: var(--%NS%mat-stepper-header-error-state-label-text-color, var(--%NS%mat-sys-error));
  font-size: var(--%NS%mat-stepper-header-error-state-label-text-size, var(--%NS%mat-sys-title-small-size));
}
.mat-step-label.mat-step-label-selected {
  font-size: var(--%NS%mat-stepper-header-selected-state-label-text-size, var(--%NS%mat-sys-title-small-size));
  font-weight: var(--%NS%mat-stepper-header-selected-state-label-text-weight, var(--%NS%mat-sys-title-small-weight));
}
.mat-step-header-empty-label .mat-step-label {
  min-width: 0;
}

.mat-step-text-label {
  text-overflow: ellipsis;
  overflow: hidden;
}

.mat-step-header .mat-step-header-ripple {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
}

.mat-step-icon-selected {
  background-color: var(--%NS%mat-stepper-header-selected-state-icon-background-color, var(--%NS%mat-sys-primary));
  color: var(--%NS%mat-stepper-header-selected-state-icon-foreground-color, var(--%NS%mat-sys-on-primary));
}

.mat-step-icon-state-done {
  background-color: var(--%NS%mat-stepper-header-done-state-icon-background-color, var(--%NS%mat-sys-primary));
  color: var(--%NS%mat-stepper-header-done-state-icon-foreground-color, var(--%NS%mat-sys-on-primary));
}

.mat-step-icon-state-edit {
  background-color: var(--%NS%mat-stepper-header-edit-state-icon-background-color, var(--%NS%mat-sys-primary));
  color: var(--%NS%mat-stepper-header-edit-state-icon-foreground-color, var(--%NS%mat-sys-on-primary));
}
`],encapsulation:2})})()}return t})(),Kt=(()=>{class t{templateRef=y(jo);name;static ɵfac=function(n){return new(n||t)};static ɵdir=uw({type:t,selectors:[[`ng-template`,`matStepperIcon`,``]],inputs:{name:[0,`matStepperIcon`,`name`]}})}return t})(),Ut=(()=>{class t{_template=y(jo);static ɵfac=function(n){return new(n||t)};static ɵdir=uw({type:t,selectors:[[`ng-template`,`matStepContent`,``]]})}return t})(),Zt=(()=>{class t extends be{_errorStateMatcher=y(Yn$1,{skipSelf:!0});_viewContainerRef=y(Ji);_isSelected=P.EMPTY;stepLabel=void 0;color;_lazyContent;_portal;ngAfterContentInit(){this._isSelected=this._stepper.steps.changes.pipe(ge(()=>this._stepper.selectionChange.pipe(J(e=>e.selectedStep===this),Jm(this._stepper.selected===this)))).subscribe(e=>{e&&this._lazyContent&&!this._portal&&(this._portal=new s(this._lazyContent._template,this._viewContainerRef))})}ngOnDestroy(){this._isSelected.unsubscribe()}isErrorState(e,n){let r=this._errorStateMatcher.isErrorState(e,n),l=!!(e&&e.invalid&&this.interacted);return r||l}isSignalErrorState(e){let n=this._errorStateMatcher.isSignalErrorState?.(e)??!1,r=!!(e&&e().invalid()&&this.interacted);return n||r}static ɵfac=(()=>{let e;return function(r){return(e||(e=SI(t)))(r||t)}})();static ɵcmp=(function(){let e=[`*`];function n(l,h){}function r(l,h){if(l&1&&(iM(0),cm(1,n,0,0,`ng-template`,0)),l&2){let g=nM();dT(),wm(`cdkPortalOutlet`,g._portal)}}return sw({type:t,selectors:[[`mat-step`]],contentQueries:function(h,g,z){if(h&1&&tv(z,De,5)(z,Ut,5),h&2){let D;aM(D=cM())&&(g.stepLabel=D.first),aM(D=cM())&&(g._lazyContent=D.first)}},hostAttrs:[`hidden`,``],inputs:{color:`color`},exportAs:[`matStep`],features:[qM([{provide:Yn$1,useExisting:t},{provide:be,useExisting:t}]),sm],ngContentSelectors:e,decls:1,vars:0,consts:[[3,`cdkPortalOutlet`]],template:function(h,g){h&1&&(rM(),cm(0,r,2,1,`ng-template`))},dependencies:[U],encapsulation:2})})()}return t})(),Yt=(()=>{class t extends q{_ngZone=y(z$1);_renderer=y(Tc);_animationsDisabled=Fi();_cleanupTransition;_isAnimating=Ge(!1);_stepHeader=void 0;_animatedContainers;_steps=void 0;steps=new vi;_icons;animationDone=new Ze;disableRipple=!1;color;labelPosition=`end`;headerPosition=`top`;ariaLabel=null;headerPrefix=AL(null);_iconOverrides={};get animationDuration(){return this._animationDuration}set animationDuration(e){/^[0-9]+(?:\.[0-9]+)?$/.test(e)?this._animationDuration=e+`ms`:/^[0-9]+(?:\.[0-9]+)?(?:ms|s)$/.test(e)?this._animationDuration=e:this._animationDuration=``}_animationDuration=``;_isServer=!y(_$1).isBrowser;constructor(){super();let n=y(Qo).nativeElement.nodeName.toLowerCase();this.orientation=n===`mat-vertical-stepper`?`vertical`:`horizontal`}ngAfterContentInit(){super.ngAfterContentInit(),this._icons.forEach(({name:e,templateRef:n})=>this._iconOverrides[e]=n),this.steps.changes.pipe(Xm(this._destroyed)).subscribe(()=>this._stateChanged()),this.selectedIndexChange.pipe(Xm(this._destroyed)).subscribe(()=>{let e=this._getAnimationDuration();e===`0ms`||e===`0s`?this._onAnimationDone():this._isAnimating.set(!0)}),this._ngZone.runOutsideAngular(()=>{this._animationsDisabled||setTimeout(()=>{this._elementRef.nativeElement.classList.add(`mat-stepper-animations-enabled`),this._cleanupTransition=this._renderer.listen(this._elementRef.nativeElement,`transitionend`,this._handleTransitionend)},200)})}ngAfterViewInit(){if(super.ngAfterViewInit(),typeof queueMicrotask==`function`){let e=!1;this._animatedContainers.changes.pipe(Jm(null),Xm(this._destroyed)).subscribe(()=>queueMicrotask(()=>{e||(e=!0,this.animationDone.emit()),this._stateChanged()}))}}ngOnDestroy(){super.ngOnDestroy(),this._cleanupTransition?.()}_getAnimationDuration(){return this._animationsDisabled?`0ms`:this.animationDuration?this.animationDuration:this.orientation===`horizontal`?`500ms`:`225ms`}_handleTransitionend=e=>{let n=e.target;if(!n)return;let r=this.orientation===`horizontal`&&e.propertyName===`transform`&&n.classList.contains(`mat-horizontal-stepper-content-current`),l=this.orientation===`vertical`&&e.propertyName===`grid-template-rows`&&n.classList.contains(`mat-vertical-content-container-active`);(r||l)&&this._animatedContainers.find(g=>g.nativeElement===n)&&this._onAnimationDone()};_onAnimationDone(){this._isAnimating.set(!1),this.animationDone.emit()}static ɵfac=function(n){return new(n||t)};static ɵcmp=(function(){let e=[`animatedContainer`],n=[`*`],r=s=>({steps:s}),l=s=>({step:s});function h(s,d){s&1&&iM(0)}function g(s,d){if(s&1&&(Si(0,`div`,5),_m(1,9)(2,6),eu()),s&2){let a=nM(2),o=uM(6);dT(),wm(`ngTemplateOutlet`,a.headerPrefix()),dT(),wm(`ngTemplateOutlet`,o)(`ngTemplateOutletContext`,ZM(3,r,a.steps))}}function z(s,d){if(s&1&&_m(0,6),s&2){let a=nM(2),o=uM(6);wm(`ngTemplateOutlet`,o)(`ngTemplateOutletContext`,ZM(2,r,a.steps))}}function D(s,d){if(s&1&&(Si(0,`div`,10,2),_m(2,9),eu()),s&2){let a=d.$implicit,o=d.$index,_=nM(2);DM(`mat-horizontal-stepper-content-`+_._getAnimationDirection(o)),wm(`id`,_._getStepContentId(o)),Cm(`aria-labelledby`,_._getStepLabelId(o))(`inert`,_.selectedIndex===o?null:``),dT(2),wm(`ngTemplateOutlet`,a.content)}}function ge(s,d){if(s&1&&(Si(0,`div`,3),rN(1,g,3,5,`div`,5)(2,z,1,4,`ng-container`,6),Si(3,`div`,7),lN(4,D,3,6,`div`,8,cN),eu()()),s&2){let a=nM();dT(),sN(a.headerPrefix()?1:2),dT(3),uN(a.steps)}}function _e(s,d){if(s&1&&_m(0,9),s&2){let a=nM(2);wm(`ngTemplateOutlet`,a.headerPrefix())}}function ye(s,d){if(s&1&&(Si(0,`div`,11),_m(1,6),Si(2,`div`,12,2)(4,`div`,13)(5,`div`,14),_m(6,9),eu()()()()),s&2){let a=d.$implicit,o=d.$index,_=d.$index,G=d.$count,W=nM(2),Ct=uM(4);dT(),wm(`ngTemplateOutlet`,Ct)(`ngTemplateOutletContext`,ZM(11,l,a)),dT(),cv(`mat-stepper-vertical-line`,_!==G-1)(`mat-vertical-content-container-active`,W.selectedIndex===o),Cm(`inert`,W.selectedIndex===o?null:``)(`aria-label`,W.ariaLabel),dT(2),wm(`id`,W._getStepContentId(o)),Cm(`aria-labelledby`,W._getStepLabelId(o)),dT(2),wm(`ngTemplateOutlet`,a.content)}}function p(s,d){if(s&1&&(Si(0,`div`,4),rN(1,_e,1,1,`ng-container`,9),lN(2,ye,7,13,`div`,11,cN),eu()),s&2){let a=nM();dT(),sN(a.headerPrefix()?1:-1),dT(),uN(a.steps)}}function b(s,d){if(s&1){let a=vN();Si(0,`mat-step-header`,15),Jm$1(`click`,function(){let _=Ad(a).step;return xd(_.select())})(`keydown`,function(_){Ad(a);let G=nM();return xd(G._onKeydown(_))}),eu()}if(s&2){let a=d.step,o=nM();cv(`mat-horizontal-stepper-header`,o.orientation===`horizontal`)(`mat-vertical-stepper-header`,o.orientation===`vertical`),wm(`tabIndex`,o._getFocusIndex()===a.index()?0:-1)(`id`,o._getStepLabelId(a.index()))(`index`,a.index())(`state`,a.indicatorType())(`label`,a.stepLabel||a.label)(`selected`,a.isSelected())(`active`,a.isNavigable())(`optional`,a.optional)(`errorMessage`,a.errorMessage)(`iconOverrides`,o._iconOverrides)(`disableRipple`,o.disableRipple||!a.isNavigable())(`color`,a.color||o.color),Cm(`role`,o.orientation===`horizontal`?`tab`:`button`)(`aria-posinset`,o.orientation===`horizontal`?a.index()+1:null)(`aria-setsize`,o.orientation===`horizontal`?o.steps.length:null)(`aria-selected`,o.orientation===`horizontal`?a.isSelected():null)(`aria-current`,o.orientation===`vertical`&&a.isSelected()?`step`:null)(`aria-disabled`,o.orientation===`vertical`&&a.isSelected()?`true`:null)(`aria-expanded`,o.orientation===`vertical`?a.isSelected():null)(`aria-controls`,o._getStepContentId(a.index()))(`aria-label`,a.ariaLabel||null)(`aria-labelledby`,!a.ariaLabel&&a.ariaLabelledby?a.ariaLabelledby:null)(`aria-disabled`,a.isNavigable()?null:!0)}}function i(s,d){s&1&&Nm(0,`div`,17)}function A(s,d){if(s&1&&(_m(0,6),rN(1,i,1,0,`div`,17)),s&2){let a=d.$implicit,o=d.$index,_=d.$count;nM(2);let G=uM(4);wm(`ngTemplateOutlet`,G)(`ngTemplateOutletContext`,ZM(3,l,a)),dT(),sN(o!==_-1?1:-1)}}function St(s,d){if(s&1&&(Si(0,`div`,16),lN(1,A,2,5,null,null,cN),eu()),s&2){let a=d.steps,o=nM();Cm(`aria-label`,o.ariaLabel),dT(),uN(a)}}return sw({type:t,selectors:[[`mat-stepper`],[`mat-vertical-stepper`],[`mat-horizontal-stepper`],[``,`matStepper`,``]],contentQueries:function(d,a,o){if(d&1&&tv(o,Zt,5)(o,Kt,5),d&2){let _;aM(_=cM())&&(a._steps=_),aM(_=cM())&&(a._icons=_)}},viewQuery:function(d,a){if(d&1&&nv(Ne,5)(e,5),d&2){let o;aM(o=cM())&&(a._stepHeader=o),aM(o=cM())&&(a._animatedContainers=o)}},hostVars:14,hostBindings:function(d,a){d&2&&(av(`--%NS%mat-stepper-animation-duration`,a._getAnimationDuration()),cv(`mat-stepper-horizontal`,a.orientation===`horizontal`)(`mat-stepper-vertical`,a.orientation===`vertical`)(`mat-stepper-label-position-end`,a.orientation===`horizontal`&&a.labelPosition==`end`)(`mat-stepper-label-position-bottom`,a.orientation===`horizontal`&&a.labelPosition==`bottom`)(`mat-stepper-header-position-bottom`,a.headerPosition===`bottom`)(`mat-stepper-animating`,a._isAnimating()))},inputs:{disableRipple:`disableRipple`,color:`color`,labelPosition:`labelPosition`,headerPosition:`headerPosition`,ariaLabel:[0,`aria-label`,`ariaLabel`],headerPrefix:[1,`headerPrefix`],animationDuration:`animationDuration`},outputs:{animationDone:`animationDone`},exportAs:[`matStepper`,`matVerticalStepper`,`matHorizontalStepper`],features:[qM([{provide:q,useExisting:t}]),sm],ngContentSelectors:n,decls:7,vars:2,consts:[[`stepTemplate`,``],[`horizontalStepsTemplate`,``],[`animatedContainer`,``],[1,`mat-horizontal-stepper-wrapper`],[1,`mat-vertical-stepper-wrapper`],[1,`mat-horizontal-stepper-header-wrapper`],[3,`ngTemplateOutlet`,`ngTemplateOutletContext`],[1,`mat-horizontal-content-container`],[`role`,`tabpanel`,1,`mat-horizontal-stepper-content`,3,`id`,`class`],[3,`ngTemplateOutlet`],[`role`,`tabpanel`,1,`mat-horizontal-stepper-content`,3,`id`],[1,`mat-step`],[1,`mat-vertical-content-container`],[`role`,`region`,1,`mat-vertical-stepper-content`,3,`id`],[1,`mat-vertical-content`],[3,`click`,`keydown`,`tabIndex`,`id`,`index`,`state`,`label`,`selected`,`active`,`optional`,`errorMessage`,`iconOverrides`,`disableRipple`,`color`],[`aria-orientation`,`horizontal`,`role`,`tablist`,1,`mat-horizontal-stepper-header-container`],[1,`mat-stepper-horizontal-line`]],template:function(d,a){if(d&1&&(rM(),rN(0,h,1,0),rN(1,ge,6,1,`div`,3)(2,p,4,1,`div`,4),cm(3,b,1,27,`ng-template`,null,0,sS)(5,St,3,1,`ng-template`,null,1,sS)),d&2){let o;sN(a._isServer?0:-1),dT(),sN((o=a.orientation)===`horizontal`?1:o===`vertical`?2:-1)}},dependencies:[hn,Ne],styles:[`.mat-stepper-vertical,
.mat-stepper-horizontal {
  display: block;
  font-family: var(--%NS%mat-stepper-container-text-font, var(--%NS%mat-sys-body-medium-font));
  background: var(--%NS%mat-stepper-container-color, var(--%NS%mat-sys-surface));
}

.mat-horizontal-stepper-header-wrapper {
  align-items: center;
  display: flex;
}

.mat-horizontal-stepper-header-container {
  white-space: nowrap;
  display: flex;
  align-items: center;
  flex-grow: 1;
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header-container {
  align-items: flex-start;
}
.mat-stepper-header-position-bottom .mat-horizontal-stepper-header-container {
  order: 1;
}

.mat-stepper-horizontal-line {
  border-top-width: 1px;
  border-top-style: solid;
  flex: auto;
  height: 0;
  margin: 0 -16px;
  min-width: 32px;
  border-top-color: var(--%NS%mat-stepper-line-color, var(--%NS%mat-sys-outline));
}
.mat-stepper-label-position-bottom .mat-stepper-horizontal-line {
  margin: 0;
  min-width: 0;
  position: relative;
  top: calc(calc((var(--%NS%mat-stepper-header-height, 72px) - 24px) / 2) + 12px);
}

.mat-stepper-label-position-bottom .mat-horizontal-stepper-header:not(:first-child)::before, [dir=rtl] .mat-stepper-label-position-bottom .mat-horizontal-stepper-header:not(:last-child)::before, .mat-stepper-label-position-bottom .mat-horizontal-stepper-header:not(:last-child)::after, [dir=rtl] .mat-stepper-label-position-bottom .mat-horizontal-stepper-header:not(:first-child)::after {
  border-top-width: 1px;
  border-top-style: solid;
  content: "";
  display: inline-block;
  height: 0;
  position: absolute;
  width: calc(50% - 20px);
}

.mat-horizontal-stepper-header {
  display: flex;
  overflow: hidden;
  align-items: center;
  padding: 0 24px;
  height: var(--%NS%mat-stepper-header-height, 72px);
}
.mat-horizontal-stepper-header .mat-step-icon {
  margin-right: 8px;
  flex: none;
}
[dir=rtl] .mat-horizontal-stepper-header .mat-step-icon {
  margin-right: 0;
  margin-left: 8px;
}
.mat-horizontal-stepper-header.mat-step-header-empty-label .mat-step-icon {
  margin: 0;
}
.mat-horizontal-stepper-header::before, .mat-horizontal-stepper-header::after {
  border-top-color: var(--%NS%mat-stepper-line-color, var(--%NS%mat-sys-outline));
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header {
  padding: calc((var(--%NS%mat-stepper-header-height, 72px) - 24px) / 2) 24px;
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header::before, .mat-stepper-label-position-bottom .mat-horizontal-stepper-header::after {
  top: calc(calc((var(--%NS%mat-stepper-header-height, 72px) - 24px) / 2) + 12px);
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header {
  box-sizing: border-box;
  flex-direction: column;
  height: auto;
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header:not(:last-child)::after, [dir=rtl] .mat-stepper-label-position-bottom .mat-horizontal-stepper-header:not(:first-child)::after {
  right: 0;
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header:not(:first-child)::before, [dir=rtl] .mat-stepper-label-position-bottom .mat-horizontal-stepper-header:not(:last-child)::before {
  left: 0;
}
[dir=rtl] .mat-stepper-label-position-bottom .mat-horizontal-stepper-header:last-child::before, [dir=rtl] .mat-stepper-label-position-bottom .mat-horizontal-stepper-header:first-child::after {
  display: none;
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header .mat-step-icon {
  margin-right: 0;
  margin-left: 0;
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header .mat-step-label {
  padding: 16px 0 0 0;
  text-align: center;
  width: 100%;
}

.mat-vertical-stepper-header {
  display: flex;
  align-items: center;
  height: 24px;
  padding: calc((var(--%NS%mat-stepper-header-height, 72px) - 24px) / 2) 24px;
}
.mat-vertical-stepper-header .mat-step-icon {
  margin-right: 12px;
}
[dir=rtl] .mat-vertical-stepper-header .mat-step-icon {
  margin-right: 0;
  margin-left: 12px;
}

.mat-horizontal-stepper-wrapper {
  display: flex;
  flex-direction: column;
}

.mat-horizontal-stepper-content {
  visibility: hidden;
  overflow: hidden;
  outline: 0;
  height: 0;
}
.mat-stepper-animations-enabled .mat-horizontal-stepper-content {
  transition: transform var(--%NS%mat-stepper-animation-duration, 0) cubic-bezier(0.35, 0, 0.25, 1);
}
.mat-horizontal-stepper-content.mat-horizontal-stepper-content-previous {
  transform: translate3d(-100%, 0, 0);
}
.mat-horizontal-stepper-content.mat-horizontal-stepper-content-next {
  transform: translate3d(100%, 0, 0);
}
.mat-horizontal-stepper-content.mat-horizontal-stepper-content-current {
  visibility: visible;
  transform: none;
  height: auto;
}
.mat-stepper-horizontal:not(.mat-stepper-animating) .mat-horizontal-stepper-content.mat-horizontal-stepper-content-current {
  overflow: visible;
}

.mat-horizontal-content-container {
  overflow: hidden;
  padding: 0 24px 24px 24px;
}
@media (forced-colors: active) {
  .mat-horizontal-content-container {
    outline: solid 1px;
  }
}
.mat-stepper-header-position-bottom .mat-horizontal-content-container {
  padding: 24px 24px 0 24px;
}

.mat-vertical-content-container {
  display: grid;
  grid-template-rows: 0fr;
  grid-template-columns: 100%;
  margin-left: 36px;
  border: 0;
  position: relative;
}
.mat-stepper-animations-enabled .mat-vertical-content-container {
  transition: grid-template-rows var(--%NS%mat-stepper-animation-duration, 0) cubic-bezier(0.4, 0, 0.2, 1);
}
.mat-vertical-content-container.mat-vertical-content-container-active {
  grid-template-rows: 1fr;
}
.mat-step:last-child .mat-vertical-content-container {
  border: none;
}
@media (forced-colors: active) {
  .mat-vertical-content-container {
    outline: solid 1px;
  }
}
[dir=rtl] .mat-vertical-content-container {
  margin-left: 0;
  margin-right: 36px;
}
@supports not (grid-template-rows: 0fr) {
  .mat-vertical-content-container {
    height: 0;
  }
  .mat-vertical-content-container.mat-vertical-content-container-active {
    height: auto;
  }
}

.mat-stepper-vertical-line::before {
  content: "";
  position: absolute;
  left: 0;
  border-left-width: 1px;
  border-left-style: solid;
  border-left-color: var(--%NS%mat-stepper-line-color, var(--%NS%mat-sys-outline));
  top: calc(8px - calc((var(--%NS%mat-stepper-header-height, 72px) - 24px) / 2));
  bottom: calc(8px - calc((var(--%NS%mat-stepper-header-height, 72px) - 24px) / 2));
}
[dir=rtl] .mat-stepper-vertical-line::before {
  left: auto;
  right: 0;
}

.mat-vertical-stepper-content {
  overflow: hidden;
  outline: 0;
  visibility: hidden;
}
.mat-stepper-animations-enabled .mat-vertical-stepper-content {
  transition: visibility var(--%NS%mat-stepper-animation-duration, 0) linear;
}
.mat-vertical-content-container-active > .mat-vertical-stepper-content {
  visibility: visible;
}

.mat-vertical-content {
  padding: 0 24px 24px 24px;
}
`],encapsulation:2})})()}return t})(),Un=(()=>{class t extends gt{static ɵfac=(()=>{let e;return function(r){return(e||(e=SI(t)))(r||t)}})();static ɵdir=uw({type:t,selectors:[[`button`,`matStepperNext`,``]],hostAttrs:[1,`mat-stepper-next`],hostVars:1,hostBindings:function(n,r){n&2&&Rm(`type`,r.type)},features:[sm]})}return t})(),Zn=(()=>{class t extends _t{static ɵfac=(()=>{let e;return function(r){return(e||(e=SI(t)))(r||t)}})();static ɵdir=uw({type:t,selectors:[[`button`,`matStepperPrevious`,``]],hostAttrs:[1,`mat-stepper-previous`],hostVars:1,hostBindings:function(n,r){n&2&&Rm(`type`,r.type)},features:[sm]})}return t})(),Yn=(()=>{class t{static ɵfac=function(n){return new(n||t)};static ɵmod=em({type:t});static ɵinj=zs({providers:[Yn$1],imports:[z$2,yt,Dt,m,Yt,Ne,O]})}return t})()});export{Yt as a,Yn as i,Jt as n,Zn as o,Un as r,Zt as s,De as t};