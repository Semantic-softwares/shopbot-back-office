import{H as Un,L as S,U as V,Y as Yn,g as Fe,gt as re,x as I}from"./chunk-ZG_ciif-.js";import{$t as dm,Cn as kI,Dn as lE,E as Gp,Ft as aD,G as Mp,Gn as qg,Gt as cE,H as Lt,Mn as nA,Mt as Zp,Or as yp,Ot as Z,Pn as nD,Rt as ai,Tr as yD,U as M,V as Ll,Wn as qD,Wt as cA,X as Pe,Xn as rD,Xt as da,Y as PI,Yt as dA,Z as Pl,Zn as rE,a as $v,bn as jD,en as dp,fn as gE,fr as uE,g as Cp,gr as vc,hn as ho,hr as ut$1,ht as WD,i as $r,in as fA,it as SD,j as Ip,kn as lp,ln as fp,lr as th,lt as Sr,nr as sE,or as tC,qt as ch,rn as eh,rr as so,s as AI,sn as fl,sr as tD,t as $D,tt as Qp,v as E,vn as iD,vr as vp,xr as xe,yt as XE}from"./chunk-5XvVQiy2.js";import{C as sn}from"./chunk-C6VwEn-p.js";import{o as s,r as T,t as H}from"./chunk-C2ra7W0i.js";import{i as w,n as T$1}from"./chunk-JltcrRJr.js";import{C as de,L as xe$1,O as le,n as Be,p as Jt,w as h,x as Ze}from"./chunk-BDr1J6Tf.js";import{n as y,t as I$1}from"./chunk--TR0RrN-.js";import{t as n}from"./chunk-9GOaJjbF.js";import{a as be$1,r as Te}from"./chunk-DYZRRrgF.js";import{c as wt$1,p as f,s as Mt$1}from"./main-L7MY4SSX.js";import{y as h$1}from"./chunk-DZq9hBzd.js";var ze=(()=>{class t{_elementRef=E(ho);focus(){this._elementRef.nativeElement.focus()}static ɵfac=function(n){return new(n||t)};static ɵdir=PI({type:t,selectors:[[``,`cdkStepHeader`,``]],hostAttrs:[`role`,`tab`]})}return t})();var ke=(()=>{class t{template=E(so);static ɵfac=function(n){return new(n||t)};static ɵdir=PI({type:t,selectors:[[``,`cdkStepLabel`,``]]})}return t})();var R={NUMBER:`number`,EDIT:`edit`,DONE:`done`,ERROR:`error`};var yt=new M(`STEPPER_GLOBAL_OPTIONS`);var fe=(()=>{class t{_stepperOptions;_stepper=E(q);_displayDefaultIndicatorType;stepLabel;_childForms;content;stepControl;get interacted(){return this._interacted()}set interacted(e){this._interacted.set(e)}_interacted=xe(!1);interactedStream=new Pe;label;errorMessage;ariaLabel;ariaLabelledby;get state(){return this._state()}set state(e){this._state.set(e)}_state=xe(void 0);get editable(){return this._editable()}set editable(e){this._editable.set(e)}_editable=xe(!0);optional=!1;get completed(){let e=this._completedOverride(),n=this._interacted();return e??(n&&(!this.stepControl||xt(this.stepControl)))}set completed(e){this._completedOverride.set(e)}_completedOverride=xe(null);index=xe(-1);isSelected=ut$1(()=>this._stepper.selectedIndex===this.index());indicatorType=ut$1(()=>{let e=this.isSelected(),n=this.completed,r=this._state()??R.NUMBER,l=this._editable();return this._showError()&&this.hasError&&!e?R.ERROR:this._displayDefaultIndicatorType?!n||e?R.NUMBER:l?R.EDIT:R.DONE:n&&!e?R.DONE:n&&e?r:l&&e?R.EDIT:r});isNavigable=ut$1(()=>{let e=this.isSelected();return this.completed||e||!this._stepper.linear});get hasError(){return this._customError()??this._getDefaultError()}set hasError(e){this._customError.set(e)}_customError=xe(null);_getDefaultError(){return this.interacted&&!!this.stepControl&&mt(this.stepControl)}constructor(){let e=E(yt,{optional:!0});this._stepperOptions=e||{},this._displayDefaultIndicatorType=this._stepperOptions.displayDefaultIndicatorType!==!1}select(){this._stepper.selected=this}reset(){this._interacted.set(!1),this._completedOverride()!=null&&this._completedOverride.set(!1),this._customError()!=null&&this._customError.set(!1),this.stepControl&&(this._childForms?.forEach(e=>e.resetForm?.()),Ct(this.stepControl))}ngOnChanges(){this._stepper._stateChanged()}_markAsInteracted(){this._interacted()||(this._interacted.set(!0),this.interactedStream.emit(this))}_showError(){return this._stepperOptions.showError??this._customError()!=null}static ɵfac=function(n){return new(n||t)};static ɵcmp=(function(){let e=[`*`];function n(r,l){r&1&&nD(0)}return AI({type:t,selectors:[[`cdk-step`]],contentQueries:function(l,h,g){if(l&1&&Qp(g,ke,5)(g,h$1,5),l&2){let z;rD(z=iD())&&(h.stepLabel=z.first),rD(z=iD())&&(h._childForms=z)}},viewQuery:function(l,h){if(l&1&&Zp(so,7),l&2){let g;rD(g=iD())&&(h.content=g.first)}},inputs:{stepControl:`stepControl`,label:`label`,errorMessage:`errorMessage`,ariaLabel:[0,`aria-label`,`ariaLabel`],ariaLabelledby:[0,`aria-labelledby`,`ariaLabelledby`],state:`state`,editable:[2,`editable`,`editable`,dA],optional:[2,`optional`,`optional`,dA],completed:[2,`completed`,`completed`,dA],hasError:[2,`hasError`,`hasError`,dA]},outputs:{interactedStream:`interacted`},exportAs:[`cdkStep`],features:[qg],ngContentSelectors:e,decls:1,vars:0,template:function(l,h){l&1&&(tD(),fp(0,n,1,0,`ng-template`))},encapsulation:2})})()}return t})();var q=(()=>{class t{_dir=E(y,{optional:!0});_changeDetectorRef=E(cA);_elementRef=E(ho);_destroyed=new S;_keyManager;_steps;steps=new Sr;_stepHeader;_sortedHeaders=new Sr;get linear(){return this._linear()}set linear(e){this._linear.set(e)}_linear=xe(!1);get selectedIndex(){return this._selectedIndex()}set selectedIndex(e){this._steps?(this._isValidIndex(e),this.selectedIndex!==e&&(this.selected?._markAsInteracted(),!this._anyControlsInvalidOrPending(e)&&(e>=this.selectedIndex||this.steps.toArray()[e].editable)&&this._updateSelectedItemIndex(e))):this._selectedIndex.set(e)}_selectedIndex=xe(0);get selected(){return this.steps?this.steps.toArray()[this.selectedIndex]:void 0}set selected(e){this.selectedIndex=e&&this.steps?this.steps.toArray().indexOf(e):-1}selectionChange=new Pe;selectedIndexChange=new Pe;_groupId=E(le).getId(`cdk-stepper-`);get orientation(){return this._orientation}set orientation(e){this._orientation=e,this._keyManager&&this._keyManager.withVerticalOrientation(e===`vertical`)}_orientation=`horizontal`;ngAfterContentInit(){this._steps.changes.pipe(Un(this._steps),Yn(this._destroyed)).subscribe(e=>{this.steps.reset(e.filter(n=>n._stepper===this)),this.steps.forEach((n,r)=>n.index.set(r)),this.steps.notifyOnChanges()})}ngAfterViewInit(){if(this._stepHeader.changes.pipe(Un(this._stepHeader),Yn(this._destroyed)).subscribe(e=>{this._sortedHeaders.reset(e.toArray().sort((n,r)=>n._elementRef.nativeElement.compareDocumentPosition(r._elementRef.nativeElement)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1)),this._sortedHeaders.notifyOnChanges()}),this._keyManager=new de(this._sortedHeaders).withWrap().withHomeAndEnd().withVerticalOrientation(this._orientation===`vertical`),this._keyManager.updateActiveItem(this.selectedIndex),(this._dir?this._dir.change:Fe()).pipe(Un(this._layoutDirection()),Yn(this._destroyed)).subscribe(e=>this._keyManager?.withHorizontalOrientation(e)),this._keyManager.updateActiveItem(this.selectedIndex),this.steps.changes.subscribe(()=>{this.selected||this._selectedIndex.set(Math.max(this.selectedIndex-1,0))}),this._isValidIndex(this.selectedIndex)||this._selectedIndex.set(0),this.linear&&this.selectedIndex>0){let e=this.steps.toArray().slice(0,this._selectedIndex());for(let n of e)n._markAsInteracted()}}ngOnDestroy(){this._keyManager?.destroy(),this.steps.destroy(),this._sortedHeaders.destroy(),this._destroyed.next(),this._destroyed.complete()}next(){this.selectedIndex=Math.min(this._selectedIndex()+1,this.steps.length-1)}previous(){this.selectedIndex=Math.max(this._selectedIndex()-1,0)}reset(){this._updateSelectedItemIndex(0),this.steps.forEach(e=>e.reset()),this._stateChanged()}_getStepLabelId(e){return`${this._groupId}-label-${e}`}_getStepContentId(e){return`${this._groupId}-content-${e}`}_stateChanged(){this._changeDetectorRef.markForCheck()}_getAnimationDirection(e){let n=e-this._selectedIndex();return n<0?this._layoutDirection()===`rtl`?`next`:`previous`:n>0?this._layoutDirection()===`rtl`?`previous`:`next`:`current`}_getFocusIndex(){return this._keyManager?this._keyManager.activeItemIndex:this._selectedIndex()}_updateSelectedItemIndex(e){let n=this.steps.toArray(),r=this._selectedIndex();this.selectionChange.emit({selectedIndex:e,previouslySelectedIndex:r,selectedStep:n[e],previouslySelectedStep:n[r]}),this._keyManager&&(this._containsFocus()?this._keyManager.setActiveItem(e):this._keyManager.updateActiveItem(e)),this._selectedIndex.set(e),this.selectedIndexChange.emit(e),this._stateChanged()}_onKeydown(e){let n=xe$1(e),r=e.keyCode,l=this._keyManager;l?.activeItemIndex!=null&&!n&&(r===32||r===13)?(this.selectedIndex=l.activeItemIndex,e.preventDefault()):l?.setFocusOrigin(`keyboard`).onKeydown(e)}_anyControlsInvalidOrPending(e){return this.linear&&e>=0?this.steps.toArray().slice(0,e).some(n=>{let r=n.stepControl;return(r?mt(r)||St(r)||!n.interacted:!n.completed)&&!n.optional&&!n._completedOverride()}):!1}_layoutDirection(){return this._dir&&this._dir.value===`rtl`?`rtl`:`ltr`}_containsFocus(){let e=this._elementRef.nativeElement,n=Be();return e===n||e.contains(n)}_isValidIndex(e){return e>-1&&(!this.steps||e<this.steps.length)}static ɵfac=function(n){return new(n||t)};static ɵdir=PI({type:t,selectors:[[``,`cdkStepper`,``]],contentQueries:function(n,r,l){if(n&1&&Qp(l,fe,5)(l,ze,5),n&2){let h;rD(h=iD())&&(r._steps=h),rD(h=iD())&&(r._stepHeader=h)}},inputs:{linear:[2,`linear`,`linear`,dA],selectedIndex:[2,`selectedIndex`,`selectedIndex`,fA],selected:`selected`,orientation:`orientation`},outputs:{selectionChange:`selectionChange`,selectedIndexChange:`selectedIndexChange`},exportAs:[`cdkStepper`]})}return t})();function be(t){return typeof t==`function`}function xt(t){return be(t)?t().valid():t.valid}function mt(t){return be(t)?t().invalid():t.invalid}function St(t){return be(t)?t().pending():t.pending}function Ct(t){be(t)?t().reset():t.reset()}var ht=(()=>{class t{_stepper=E(q);type=`submit`;static ɵfac=function(n){return new(n||t)};static ɵdir=PI({type:t,selectors:[[`button`,`cdkStepperNext`,``]],hostVars:1,hostBindings:function(n,r){n&1&&Gp(`click`,function(){return r._stepper.next()}),n&2&&Mp(`type`,r.type)},inputs:{type:`type`}})}return t})();var ut=(()=>{class t{_stepper=E(q);type=`button`;static ɵfac=function(n){return new(n||t)};static ɵdir=PI({type:t,selectors:[[`button`,`cdkStepperPrevious`,``]],hostVars:1,hostBindings:function(n,r){n&1&&Gp(`click`,function(){return r._stepper.previous()}),n&2&&Mp(`type`,r.type)},inputs:{type:`type`}})}return t})();var ft=(()=>{class t{static ɵfac=function(n){return new(n||t)};static ɵmod=kI({type:t});static ɵinj=fl({imports:[I$1]})}return t})();var we=(()=>{class t extends ke{static ɵfac=(()=>{let e;return function(r){return(e||(e=dm(t)))(r||t)}})();static ɵdir=PI({type:t,selectors:[[``,`matStepLabel`,``]],features:[lp]})}return t})();var Mt=(()=>{class t{changes=new S;optionalLabel=`Optional`;completedLabel=`Completed`;editableLabel=`Editable`;static ɵfac=function(n){return new(n||t)};static ɵprov=Lt({token:t,factory:t.ɵfac})}return t})();var De=(()=>{class t extends ze{_intl=E(Mt);_focusMonitor=E(Ze);_intlSubscription;state;label;errorMessage;iconOverrides;index;selected=!1;active=!1;optional=!1;disableRipple=!1;color;constructor(){super();let e=E(w);e.load(Te),e.load(T$1);let n=E(cA);this._intlSubscription=this._intl.changes.subscribe(()=>n.markForCheck())}ngAfterViewInit(){this._focusMonitor.monitor(this._elementRef,!0)}ngOnDestroy(){this._intlSubscription.unsubscribe(),this._focusMonitor.stopMonitoring(this._elementRef)}focus(e,n){e?this._focusMonitor.focusVia(this._elementRef,e,n):this._elementRef.nativeElement.focus(n)}_stringLabel(){return this.label instanceof we?null:this.label}_templateLabel(){return this.label instanceof we?this.label:null}_getHostElement(){return this._elementRef.nativeElement}_getDefaultTextForState(e){return e==`number`?`${this.index+1}`:e==`edit`?`create`:e==`error`?`warning`:e}_hasEmptyLabel(){return!this._stringLabel()&&!this._templateLabel()&&!this._hasOptionalLabel()&&!this._hasErrorLabel()}_hasOptionalLabel(){return this.optional&&this.state!==`error`}_hasErrorLabel(){return this.state===`error`}static ɵfac=function(n){return new(n||t)};static ɵcmp=(function(){let e=(p,b,i)=>({index:p,active:b,optional:i});function n(p,b){if(p&1&&Cp(0,2),p&2){let i=XE();yp(`ngTemplateOutlet`,i.iconOverrides[i.state])(`ngTemplateOutletContext`,qD(2,e,i.index,i.active,i.optional))}}function r(p,b){if(p&1&&($r(0,`span`,7),SD(1),vc()),p&2){let i=XE(2);$v(),ch(i._getDefaultTextForState(i.state))}}function l(p,b){if(p&1&&($r(0,`span`,8),SD(1),vc()),p&2){let i=XE(3);$v(),ch(i._intl.completedLabel)}}function h(p,b){if(p&1&&($r(0,`span`,8),SD(1),vc()),p&2){let i=XE(3);$v(),ch(i._intl.editableLabel)}}function g(p,b){if(p&1&&(rE(0,l,2,1,`span`,8)(1,h,2,1,`span`,8),$r(2,`mat-icon`,7),SD(3),vc()),p&2){let i=XE(2);sE(i.state===`done`?0:i.state===`edit`?1:-1),$v(3),ch(i._getDefaultTextForState(i.state))}}function z(p,b){if(p&1&&rE(0,r,2,1,`span`,7)(1,g,4,2),p&2){let A=XE();sE(A.state===`number`?0:1)}}function D(p,b){p&1&&($r(0,`div`,4),Cp(1,9),vc()),p&2&&($v(),yp(`ngTemplateOutlet`,b.template))}function ve(p,b){if(p&1&&($r(0,`div`,4),SD(1),vc()),p&2){let i=XE();$v(),ch(i.label)}}function ge(p,b){if(p&1&&($r(0,`div`,5),SD(1),vc()),p&2){let i=XE();$v(),ch(i._intl.optionalLabel)}}function _e(p,b){if(p&1&&($r(0,`div`,6),SD(1),vc()),p&2){let i=XE();$v(),ch(i.errorMessage)}}return AI({type:t,selectors:[[`mat-step-header`]],hostAttrs:[`role`,``,1,`mat-step-header`],hostVars:4,hostBindings:function(b,i){b&2&&(yD(`mat-`+(i.color||`primary`)),th(`mat-step-header-empty-label`,i._hasEmptyLabel()))},inputs:{state:`state`,label:`label`,errorMessage:`errorMessage`,iconOverrides:`iconOverrides`,index:`index`,selected:`selected`,active:`active`,optional:`optional`,disableRipple:`disableRipple`,color:`color`},features:[lp],decls:10,vars:17,consts:[[`matRipple`,``,1,`mat-step-header-ripple`,`mat-focus-indicator`,3,`matRippleTrigger`,`matRippleDisabled`],[1,`mat-step-icon-content`],[3,`ngTemplateOutlet`,`ngTemplateOutletContext`],[1,`mat-step-label`],[1,`mat-step-text-label`],[1,`mat-step-optional`],[1,`mat-step-sub-label-error`],[`aria-hidden`,`true`],[1,`cdk-visually-hidden`],[3,`ngTemplateOutlet`]],template:function(b,i){if(b&1&&(Ip(0,`div`,0),$r(1,`div`)(2,`div`,1),rE(3,n,1,6,`ng-container`,2)(4,z,2,1),vc()(),$r(5,`div`,3),rE(6,D,2,1,`div`,4)(7,ve,2,1,`div`,4),rE(8,ge,2,1,`div`,5),rE(9,_e,2,1,`div`,6),vc()),b&2){let A;yp(`matRippleTrigger`,i._getHostElement())(`matRippleDisabled`,i.disableRipple),$v(),yD(jD(`mat-step-icon-state-`,i.state,` mat-step-icon`)),th(`mat-step-icon-selected`,i.selected),$v(2),sE(i.iconOverrides&&i.iconOverrides[i.state]?3:4),$v(2),th(`mat-step-label-active`,i.active)(`mat-step-label-selected`,i.selected)(`mat-step-label-error`,i.state==`error`),$v(),sE((A=i._templateLabel())?6:i._stringLabel()?7:-1,A),$v(2),sE(i._hasOptionalLabel()?8:-1),$v(),sE(i._hasErrorLabel()?9:-1)}},dependencies:[be$1,sn,wt$1],styles:[`.mat-step-header {
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
`],encapsulation:2})})()}return t})();var It=(()=>{class t{templateRef=E(so);name;static ɵfac=function(n){return new(n||t)};static ɵdir=PI({type:t,selectors:[[`ng-template`,`matStepperIcon`,``]],inputs:{name:[0,`matStepperIcon`,`name`]}})}return t})();var zt=(()=>{class t{_template=E(so);static ɵfac=function(n){return new(n||t)};static ɵdir=PI({type:t,selectors:[[`ng-template`,`matStepContent`,``]]})}return t})();var kt=(()=>{class t extends fe{_errorStateMatcher=E(f,{skipSelf:!0});_viewContainerRef=E(ai);_isSelected=I.EMPTY;stepLabel=void 0;color;_lazyContent;_portal;ngAfterContentInit(){this._isSelected=this._stepper.steps.changes.pipe(re(()=>this._stepper.selectionChange.pipe(V(e=>e.selectedStep===this),Un(this._stepper.selected===this)))).subscribe(e=>{e&&this._lazyContent&&!this._portal&&(this._portal=new s(this._lazyContent._template,this._viewContainerRef))})}ngOnDestroy(){this._isSelected.unsubscribe()}isErrorState(e,n){let r=this._errorStateMatcher.isErrorState(e,n),l=!!(e&&e.invalid&&this.interacted);return r||l}isSignalErrorState(e){let n=this._errorStateMatcher.isSignalErrorState?.(e)??!1,r=!!(e&&e().invalid()&&this.interacted);return n||r}static ɵfac=(()=>{let e;return function(r){return(e||(e=dm(t)))(r||t)}})();static ɵcmp=(function(){let e=[`*`];function n(l,h){}function r(l,h){if(l&1&&(nD(0),dp(1,n,0,0,`ng-template`,0)),l&2){let g=XE();$v(),yp(`cdkPortalOutlet`,g._portal)}}return AI({type:t,selectors:[[`mat-step`]],contentQueries:function(h,g,z){if(h&1&&Qp(z,we,5)(z,zt,5),h&2){let D;rD(D=iD())&&(g.stepLabel=D.first),rD(D=iD())&&(g._lazyContent=D.first)}},hostAttrs:[`hidden`,``],inputs:{color:`color`},exportAs:[`matStep`],features:[$D([{provide:f,useExisting:t},{provide:fe,useExisting:t}]),lp],ngContentSelectors:e,decls:1,vars:0,consts:[[3,`cdkPortalOutlet`]],template:function(h,g){h&1&&(tD(),dp(0,r,2,1,`ng-template`))},dependencies:[H],encapsulation:2})})()}return t})();var wt=(()=>{class t extends q{_ngZone=E(Z);_renderer=E(da);_animationsDisabled=Jt();_cleanupTransition;_isAnimating=xe(!1);_stepHeader=void 0;_animatedContainers;_steps=void 0;steps=new Sr;_icons;animationDone=new Pe;disableRipple=!1;color;labelPosition=`end`;headerPosition=`top`;ariaLabel=null;headerPrefix=nA(null);_iconOverrides={};get animationDuration(){return this._animationDuration}set animationDuration(e){/^[0-9]+(?:\.[0-9]+)?$/.test(e)?this._animationDuration=e+`ms`:/^[0-9]+(?:\.[0-9]+)?(?:ms|s)$/.test(e)?this._animationDuration=e:this._animationDuration=``}_animationDuration=``;_isServer=!E(h).isBrowser;constructor(){super();let n=E(ho).nativeElement.nodeName.toLowerCase();this.orientation=n===`mat-vertical-stepper`?`vertical`:`horizontal`}ngAfterContentInit(){super.ngAfterContentInit(),this._icons.forEach(({name:e,templateRef:n})=>this._iconOverrides[e]=n),this.steps.changes.pipe(Yn(this._destroyed)).subscribe(()=>this._stateChanged()),this.selectedIndexChange.pipe(Yn(this._destroyed)).subscribe(()=>{let e=this._getAnimationDuration();e===`0ms`||e===`0s`?this._onAnimationDone():this._isAnimating.set(!0)}),this._ngZone.runOutsideAngular(()=>{this._animationsDisabled||setTimeout(()=>{this._elementRef.nativeElement.classList.add(`mat-stepper-animations-enabled`),this._cleanupTransition=this._renderer.listen(this._elementRef.nativeElement,`transitionend`,this._handleTransitionend)},200)})}ngAfterViewInit(){if(super.ngAfterViewInit(),typeof queueMicrotask==`function`){let e=!1;this._animatedContainers.changes.pipe(Un(null),Yn(this._destroyed)).subscribe(()=>queueMicrotask(()=>{e||(e=!0,this.animationDone.emit()),this._stateChanged()}))}}ngOnDestroy(){super.ngOnDestroy(),this._cleanupTransition?.()}_getAnimationDuration(){return this._animationsDisabled?`0ms`:this.animationDuration?this.animationDuration:this.orientation===`horizontal`?`500ms`:`225ms`}_handleTransitionend=e=>{let n=e.target;if(!n)return;let r=this.orientation===`horizontal`&&e.propertyName===`transform`&&n.classList.contains(`mat-horizontal-stepper-content-current`),l=this.orientation===`vertical`&&e.propertyName===`grid-template-rows`&&n.classList.contains(`mat-vertical-content-container-active`);(r||l)&&this._animatedContainers.find(g=>g.nativeElement===n)&&this._onAnimationDone()};_onAnimationDone(){this._isAnimating.set(!1),this.animationDone.emit()}static ɵfac=function(n){return new(n||t)};static ɵcmp=(function(){let e=[`animatedContainer`],n=[`*`],r=s=>({steps:s}),l=s=>({step:s});function h(s,d){s&1&&nD(0)}function g(s,d){if(s&1&&($r(0,`div`,5),Cp(1,9)(2,6),vc()),s&2){let a=XE(2),o=aD(6);$v(),yp(`ngTemplateOutlet`,a.headerPrefix()),$v(),yp(`ngTemplateOutlet`,o)(`ngTemplateOutletContext`,WD(3,r,a.steps))}}function z(s,d){if(s&1&&Cp(0,6),s&2){let a=XE(2),o=aD(6);yp(`ngTemplateOutlet`,o)(`ngTemplateOutletContext`,WD(2,r,a.steps))}}function D(s,d){if(s&1&&($r(0,`div`,10,2),Cp(2,9),vc()),s&2){let a=d.$implicit,o=d.$index,_=XE(2);yD(`mat-horizontal-stepper-content-`+_._getAnimationDirection(o)),yp(`id`,_._getStepContentId(o)),vp(`aria-labelledby`,_._getStepLabelId(o))(`inert`,_.selectedIndex===o?null:``),$v(2),yp(`ngTemplateOutlet`,a.content)}}function ve(s,d){if(s&1&&($r(0,`div`,3),rE(1,g,3,5,`div`,5)(2,z,1,4,`ng-container`,6),$r(3,`div`,7),lE(4,D,3,6,`div`,8,cE),vc()()),s&2){let a=XE();$v(),sE(a.headerPrefix()?1:2),$v(3),uE(a.steps)}}function ge(s,d){if(s&1&&Cp(0,9),s&2){let a=XE(2);yp(`ngTemplateOutlet`,a.headerPrefix())}}function _e(s,d){if(s&1&&($r(0,`div`,11),Cp(1,6),$r(2,`div`,12,2)(4,`div`,13)(5,`div`,14),Cp(6,9),vc()()()()),s&2){let a=d.$implicit,o=d.$index,_=d.$index,G=d.$count,W=XE(2),vt=aD(4);$v(),yp(`ngTemplateOutlet`,vt)(`ngTemplateOutletContext`,WD(11,l,a)),$v(),th(`mat-stepper-vertical-line`,_!==G-1)(`mat-vertical-content-container-active`,W.selectedIndex===o),vp(`inert`,W.selectedIndex===o?null:``)(`aria-label`,W.ariaLabel),$v(2),yp(`id`,W._getStepContentId(o)),vp(`aria-labelledby`,W._getStepLabelId(o)),$v(2),yp(`ngTemplateOutlet`,a.content)}}function p(s,d){if(s&1&&($r(0,`div`,4),rE(1,ge,1,1,`ng-container`,9),lE(2,_e,7,13,`div`,11,cE),vc()),s&2){let a=XE();$v(),sE(a.headerPrefix()?1:-1),$v(),uE(a.steps)}}function b(s,d){if(s&1){let a=gE();$r(0,`mat-step-header`,15),Gp(`click`,function(){let _=Ll(a).step;return Pl(_.select())})(`keydown`,function(_){Ll(a);let G=XE();return Pl(G._onKeydown(_))}),vc()}if(s&2){let a=d.step,o=XE();th(`mat-horizontal-stepper-header`,o.orientation===`horizontal`)(`mat-vertical-stepper-header`,o.orientation===`vertical`),yp(`tabIndex`,o._getFocusIndex()===a.index()?0:-1)(`id`,o._getStepLabelId(a.index()))(`index`,a.index())(`state`,a.indicatorType())(`label`,a.stepLabel||a.label)(`selected`,a.isSelected())(`active`,a.isNavigable())(`optional`,a.optional)(`errorMessage`,a.errorMessage)(`iconOverrides`,o._iconOverrides)(`disableRipple`,o.disableRipple||!a.isNavigable())(`color`,a.color||o.color),vp(`role`,o.orientation===`horizontal`?`tab`:`button`)(`aria-posinset`,o.orientation===`horizontal`?a.index()+1:null)(`aria-setsize`,o.orientation===`horizontal`?o.steps.length:null)(`aria-selected`,o.orientation===`horizontal`?a.isSelected():null)(`aria-current`,o.orientation===`vertical`&&a.isSelected()?`step`:null)(`aria-disabled`,o.orientation===`vertical`&&a.isSelected()?`true`:null)(`aria-expanded`,o.orientation===`vertical`?a.isSelected():null)(`aria-controls`,o._getStepContentId(a.index()))(`aria-label`,a.ariaLabel||null)(`aria-labelledby`,!a.ariaLabel&&a.ariaLabelledby?a.ariaLabelledby:null)(`aria-disabled`,a.isNavigable()?null:!0)}}function i(s,d){s&1&&Ip(0,`div`,17)}function A(s,d){if(s&1&&(Cp(0,6),rE(1,i,1,0,`div`,17)),s&2){let a=d.$implicit,o=d.$index,_=d.$count;XE(2);let G=aD(4);yp(`ngTemplateOutlet`,G)(`ngTemplateOutletContext`,WD(3,l,a)),$v(),sE(o!==_-1?1:-1)}}function bt(s,d){if(s&1&&($r(0,`div`,16),lE(1,A,2,5,null,null,cE),vc()),s&2){let a=d.steps,o=XE();vp(`aria-label`,o.ariaLabel),$v(),uE(a)}}return AI({type:t,selectors:[[`mat-stepper`],[`mat-vertical-stepper`],[`mat-horizontal-stepper`],[``,`matStepper`,``]],contentQueries:function(d,a,o){if(d&1&&Qp(o,kt,5)(o,It,5),d&2){let _;rD(_=iD())&&(a._steps=_),rD(_=iD())&&(a._icons=_)}},viewQuery:function(d,a){if(d&1&&Zp(De,5)(e,5),d&2){let o;rD(o=iD())&&(a._stepHeader=o),rD(o=iD())&&(a._animatedContainers=o)}},hostVars:14,hostBindings:function(d,a){d&2&&(eh(`--%NS%mat-stepper-animation-duration`,a._getAnimationDuration()),th(`mat-stepper-horizontal`,a.orientation===`horizontal`)(`mat-stepper-vertical`,a.orientation===`vertical`)(`mat-stepper-label-position-end`,a.orientation===`horizontal`&&a.labelPosition==`end`)(`mat-stepper-label-position-bottom`,a.orientation===`horizontal`&&a.labelPosition==`bottom`)(`mat-stepper-header-position-bottom`,a.headerPosition===`bottom`)(`mat-stepper-animating`,a._isAnimating()))},inputs:{disableRipple:`disableRipple`,color:`color`,labelPosition:`labelPosition`,headerPosition:`headerPosition`,ariaLabel:[0,`aria-label`,`ariaLabel`],headerPrefix:[1,`headerPrefix`],animationDuration:`animationDuration`},outputs:{animationDone:`animationDone`},exportAs:[`matStepper`,`matVerticalStepper`,`matHorizontalStepper`],features:[$D([{provide:q,useExisting:t}]),lp],ngContentSelectors:n,decls:7,vars:2,consts:[[`stepTemplate`,``],[`horizontalStepsTemplate`,``],[`animatedContainer`,``],[1,`mat-horizontal-stepper-wrapper`],[1,`mat-vertical-stepper-wrapper`],[1,`mat-horizontal-stepper-header-wrapper`],[3,`ngTemplateOutlet`,`ngTemplateOutletContext`],[1,`mat-horizontal-content-container`],[`role`,`tabpanel`,1,`mat-horizontal-stepper-content`,3,`id`,`class`],[3,`ngTemplateOutlet`],[`role`,`tabpanel`,1,`mat-horizontal-stepper-content`,3,`id`],[1,`mat-step`],[1,`mat-vertical-content-container`],[`role`,`region`,1,`mat-vertical-stepper-content`,3,`id`],[1,`mat-vertical-content`],[3,`click`,`keydown`,`tabIndex`,`id`,`index`,`state`,`label`,`selected`,`active`,`optional`,`errorMessage`,`iconOverrides`,`disableRipple`,`color`],[`aria-orientation`,`horizontal`,`role`,`tablist`,1,`mat-horizontal-stepper-header-container`],[1,`mat-stepper-horizontal-line`]],template:function(d,a){if(d&1&&(tD(),rE(0,h,1,0),rE(1,ve,6,1,`div`,3)(2,p,4,1,`div`,4),dp(3,b,1,27,`ng-template`,null,0,tC)(5,bt,3,1,`ng-template`,null,1,tC)),d&2){let o;sE(a._isServer?0:-1),$v(),sE((o=a.orientation)===`horizontal`?1:o===`vertical`?2:-1)}},dependencies:[sn,De],styles:[`.mat-stepper-vertical,
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
`],encapsulation:2})})()}return t})();var In=(()=>{class t extends ht{static ɵfac=(()=>{let e;return function(r){return(e||(e=dm(t)))(r||t)}})();static ɵdir=PI({type:t,selectors:[[`button`,`matStepperNext`,``]],hostAttrs:[1,`mat-stepper-next`],hostVars:1,hostBindings:function(n,r){n&2&&Mp(`type`,r.type)},features:[lp]})}return t})();var zn=(()=>{class t extends ut{static ɵfac=(()=>{let e;return function(r){return(e||(e=dm(t)))(r||t)}})();static ɵdir=PI({type:t,selectors:[[`button`,`matStepperPrevious`,``]],hostAttrs:[1,`mat-stepper-previous`],hostVars:1,hostBindings:function(n,r){n&2&&Mp(`type`,r.type)},features:[lp]})}return t})();var kn=(()=>{class t{static ɵfac=function(n){return new(n||t)};static ɵmod=kI({type:t});static ɵinj=fl({providers:[f],imports:[T,ft,Mt$1,n,wt,De,I$1]})}return t})();export{wt as a,we as i,kn as n,zn as o,kt as r,In as t};