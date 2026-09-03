import {h as h$1}from'./chunk-DxapGy7f.js';import {aL as yI,aM as el,bN as I$1,N as Nt,bO as f,aN as w,b7 as d,E,av as ei,by as I$2,V as re,a9 as V,bo as Un,bP as s$1,bF as Qg,m as mI,bQ as O,bE as Gf,aY as HE,ac as zf,bc as _D,bx as xp,af as UE,ag as qE,a_ as DI,b2 as W,b3 as Ty,bm as qt,b as be,bR as Eo,aw as Oe,bS as xx,b1 as h,aO as sr,br as Yn,aR as tn,U as UI,aX as HD,q as qI,c as _v,aW as Pp,aC as Fp,ae as Ap,bd as cp,bT as Ze$1,bg as v,bU as Tt$1,bV as _,bj as Px,bW as Et$1,y as yt$1,t as tp,k as ko,s as sc,e as ep,ad as rD,am as TD,a6 as ct$1,aP as N,ba as bg,bb as Vx,bX as Qf,bY as Xn,aZ as BE,j as jE,bn as m,ap as g,b4 as le,bZ as de$1,$ as Fe,b_ as Re,b$ as Be,aS as Hx,z as zI,v as QI,o as XI,_ as _p,w as wl,r as Ml,a5 as Xf,K,aV as op,A as AD,h as hD,d as qp,aj as WE,c0 as bD,aK as WI}from'./main-GWNSJMC4.js';var it=["*"];function rt(t,a){t&1&&BE(0);}var de=(()=>{class t{_elementRef=E(sr);constructor(){}focus(){this._elementRef.nativeElement.focus();}static \u0275fac=function(n){return new(n||t)};static \u0275dir=DI({type:t,selectors:[["","cdkStepHeader",""]],hostAttrs:["role","tab"]})}return t})(),ce=(()=>{class t{template=E(Xn);constructor(){}static \u0275fac=function(n){return new(n||t)};static \u0275dir=DI({type:t,selectors:[["","cdkStepLabel",""]]})}return t})();var I={NUMBER:"number",EDIT:"edit",DONE:"done",ERROR:"error"},at=new N("STEPPER_GLOBAL_OPTIONS"),ne=(()=>{class t{_stepperOptions;_stepper=E(L);_displayDefaultIndicatorType;stepLabel;_childForms;content;stepControl;get interacted(){return this._interacted()}set interacted(e){this._interacted.set(e);}_interacted=be(false);interactedStream=new Oe;label;errorMessage;ariaLabel;ariaLabelledby;get state(){return this._state()}set state(e){this._state.set(e);}_state=be(void 0);get editable(){return this._editable()}set editable(e){this._editable.set(e);}_editable=be(true);optional=false;get completed(){let e=this._completedOverride(),n=this._interacted();return e??(n&&(!this.stepControl||this.stepControl.valid))}set completed(e){this._completedOverride.set(e);}_completedOverride=be(null);index=be(-1);isSelected=ct$1(()=>this._stepper.selectedIndex===this.index());indicatorType=ct$1(()=>{let e=this.isSelected(),n=this.completed,i=this._state()??I.NUMBER,r=this._editable();return this._showError()&&this.hasError&&!e?I.ERROR:this._displayDefaultIndicatorType?!n||e?I.NUMBER:r?I.EDIT:I.DONE:n&&!e?I.DONE:n&&e?i:r&&e?I.EDIT:i});isNavigable=ct$1(()=>{let e=this.isSelected();return this.completed||e||!this._stepper.linear});get hasError(){let e=this._customError();return e??this._getDefaultError()}set hasError(e){this._customError.set(e);}_customError=be(null);_getDefaultError(){return this.interacted&&!!this.stepControl?.invalid}constructor(){let e=E(at,{optional:true});this._stepperOptions=e||{},this._displayDefaultIndicatorType=this._stepperOptions.displayDefaultIndicatorType!==false;}select(){this._stepper.selected=this;}reset(){this._interacted.set(false),this._completedOverride()!=null&&this._completedOverride.set(false),this._customError()!=null&&this._customError.set(false),this.stepControl&&(this._childForms?.forEach(e=>e.resetForm?.()),this.stepControl.reset());}ngOnChanges(){this._stepper._stateChanged();}_markAsInteracted(){this._interacted()||(this._interacted.set(true),this.interactedStream.emit(this));}_showError(){return this._stepperOptions.showError??this._customError()!=null}static \u0275fac=function(n){return new(n||t)};static \u0275cmp=mI({type:t,selectors:[["cdk-step"]],contentQueries:function(n,i,r){if(n&1&&xp(r,ce,5)(r,h$1,5),n&2){let s;UE(s=qE())&&(i.stepLabel=s.first),UE(s=qE())&&(i._childForms=s);}},viewQuery:function(n,i){if(n&1&&Ap(Xn,7),n&2){let r;UE(r=qE())&&(i.content=r.first);}},inputs:{stepControl:"stepControl",label:"label",errorMessage:"errorMessage",ariaLabel:[0,"aria-label","ariaLabel"],ariaLabelledby:[0,"aria-labelledby","ariaLabelledby"],state:"state",editable:[2,"editable","editable",Vx],optional:[2,"optional","optional",Vx],completed:[2,"completed","completed",Vx],hasError:[2,"hasError","hasError",Vx]},outputs:{interactedStream:"interacted"},exportAs:["cdkStep"],features:[bg],ngContentSelectors:it,decls:1,vars:0,template:function(n,i){n&1&&(HE(),Qf(0,rt,1,0,"ng-template"));},encapsulation:2})}return t})(),L=(()=>{class t{_dir=E(m,{optional:true});_changeDetectorRef=E(Px);_elementRef=E(sr);_destroyed=new g;_keyManager;_steps;steps=new Eo;_stepHeader;_sortedHeaders=new Eo;get linear(){return this._linear()}set linear(e){this._linear.set(e);}_linear=be(false);get selectedIndex(){return this._selectedIndex()}set selectedIndex(e){this._steps?(this._isValidIndex(e),this.selectedIndex!==e&&(this.selected?._markAsInteracted(),!this._anyControlsInvalidOrPending(e)&&(e>=this.selectedIndex||this.steps.toArray()[e].editable)&&this._updateSelectedItemIndex(e))):this._selectedIndex.set(e);}_selectedIndex=be(0);get selected(){return this.steps?this.steps.toArray()[this.selectedIndex]:void 0}set selected(e){this.selectedIndex=e&&this.steps?this.steps.toArray().indexOf(e):-1;}selectionChange=new Oe;selectedIndexChange=new Oe;_groupId=E(le).getId("cdk-stepper-");get orientation(){return this._orientation}set orientation(e){this._orientation=e,this._keyManager&&this._keyManager.withVerticalOrientation(e==="vertical");}_orientation="horizontal";constructor(){}ngAfterContentInit(){this._steps.changes.pipe(Un(this._steps),Yn(this._destroyed)).subscribe(e=>{this.steps.reset(e.filter(n=>n._stepper===this)),this.steps.forEach((n,i)=>n.index.set(i)),this.steps.notifyOnChanges();});}ngAfterViewInit(){if(this._stepHeader.changes.pipe(Un(this._stepHeader),Yn(this._destroyed)).subscribe(e=>{this._sortedHeaders.reset(e.toArray().sort((n,i)=>n._elementRef.nativeElement.compareDocumentPosition(i._elementRef.nativeElement)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1)),this._sortedHeaders.notifyOnChanges();}),this._keyManager=new de$1(this._sortedHeaders).withWrap().withHomeAndEnd().withVerticalOrientation(this._orientation==="vertical"),this._keyManager.updateActiveItem(this.selectedIndex),(this._dir?this._dir.change:Fe()).pipe(Un(this._layoutDirection()),Yn(this._destroyed)).subscribe(e=>this._keyManager?.withHorizontalOrientation(e)),this._keyManager.updateActiveItem(this.selectedIndex),this.steps.changes.subscribe(()=>{this.selected||this._selectedIndex.set(Math.max(this.selectedIndex-1,0));}),this._isValidIndex(this.selectedIndex)||this._selectedIndex.set(0),this.linear&&this.selectedIndex>0){let e=this.steps.toArray().slice(0,this._selectedIndex());for(let n of e)n._markAsInteracted();}}ngOnDestroy(){this._keyManager?.destroy(),this.steps.destroy(),this._sortedHeaders.destroy(),this._destroyed.next(),this._destroyed.complete();}next(){this.selectedIndex=Math.min(this._selectedIndex()+1,this.steps.length-1);}previous(){this.selectedIndex=Math.max(this._selectedIndex()-1,0);}reset(){this._updateSelectedItemIndex(0),this.steps.forEach(e=>e.reset()),this._stateChanged();}_getStepLabelId(e){return `${this._groupId}-label-${e}`}_getStepContentId(e){return `${this._groupId}-content-${e}`}_stateChanged(){this._changeDetectorRef.markForCheck();}_getAnimationDirection(e){let n=e-this._selectedIndex();return n<0?this._layoutDirection()==="rtl"?"next":"previous":n>0?this._layoutDirection()==="rtl"?"previous":"next":"current"}_getFocusIndex(){return this._keyManager?this._keyManager.activeItemIndex:this._selectedIndex()}_updateSelectedItemIndex(e){let n=this.steps.toArray(),i=this._selectedIndex();this.selectionChange.emit({selectedIndex:e,previouslySelectedIndex:i,selectedStep:n[e],previouslySelectedStep:n[i]}),this._keyManager&&(this._containsFocus()?this._keyManager.setActiveItem(e):this._keyManager.updateActiveItem(e)),this._selectedIndex.set(e),this.selectedIndexChange.emit(e),this._stateChanged();}_onKeydown(e){let n=Re(e),i=e.keyCode,r=this._keyManager;r?.activeItemIndex!=null&&!n&&(i===32||i===13)?(this.selectedIndex=r.activeItemIndex,e.preventDefault()):r?.setFocusOrigin("keyboard").onKeydown(e);}_anyControlsInvalidOrPending(e){return this.linear&&e>=0?this.steps.toArray().slice(0,e).some(n=>{let i=n.stepControl;return (i?i.invalid||i.pending||!n.interacted:!n.completed)&&!n.optional&&!n._completedOverride()}):false}_layoutDirection(){return this._dir&&this._dir.value==="rtl"?"rtl":"ltr"}_containsFocus(){let e=this._elementRef.nativeElement,n=Be();return e===n||e.contains(n)}_isValidIndex(e){return e>-1&&(!this.steps||e<this.steps.length)}static \u0275fac=function(n){return new(n||t)};static \u0275dir=DI({type:t,selectors:[["","cdkStepper",""]],contentQueries:function(n,i,r){if(n&1&&xp(r,ne,5)(r,de,5),n&2){let s;UE(s=qE())&&(i._steps=s),UE(s=qE())&&(i._stepHeader=s);}},inputs:{linear:[2,"linear","linear",Vx],selectedIndex:[2,"selectedIndex","selectedIndex",Hx],selected:"selected",orientation:"orientation"},outputs:{selectionChange:"selectionChange",selectedIndexChange:"selectedIndexChange"},exportAs:["cdkStepper"]})}return t})(),Ze=(()=>{class t{_stepper=E(L);type="submit";constructor(){}static \u0275fac=function(n){return new(n||t)};static \u0275dir=DI({type:t,selectors:[["button","cdkStepperNext",""]],hostVars:1,hostBindings:function(n,i){n&1&&_p("click",function(){return i._stepper.next()}),n&2&&cp("type",i.type);},inputs:{type:"type"}})}return t})(),Ye=(()=>{class t{_stepper=E(L);type="button";constructor(){}static \u0275fac=function(n){return new(n||t)};static \u0275dir=DI({type:t,selectors:[["button","cdkStepperPrevious",""]],hostVars:1,hostBindings:function(n,i){n&1&&_p("click",function(){return i._stepper.previous()}),n&2&&cp("type",i.type);},inputs:{type:"type"}})}return t})(),Je=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=yI({type:t});static \u0275inj=el({imports:[w]})}return t})();var ot=(t,a,e)=>({index:t,active:a,optional:e});function st(t,a){if(t&1&&op(0,2),t&2){let e=jE();ep("ngTemplateOutlet",e.iconOverrides[e.state])("ngTemplateOutletContext",AD(2,ot,e.index,e.active,e.optional));}}function lt(t,a){if(t&1&&(ko(0,"span",7),hD(1),sc()),t&2){let e=jE(2);_v(),qp(e._getDefaultTextForState(e.state));}}function pt(t,a){if(t&1&&(ko(0,"span",8),hD(1),sc()),t&2){let e=jE(3);_v(),qp(e._intl.completedLabel);}}function dt(t,a){if(t&1&&(ko(0,"span",8),hD(1),sc()),t&2){let e=jE(3);_v(),qp(e._intl.editableLabel);}}function ct(t,a){if(t&1&&(UI(0,pt,2,1,"span",8)(1,dt,2,1,"span",8),ko(2,"mat-icon",7),hD(3),sc()),t&2){let e=jE(2);qI(e.state==="done"?0:e.state==="edit"?1:-1),_v(3),qp(e._getDefaultTextForState(e.state));}}function mt(t,a){if(t&1&&UI(0,lt,2,1,"span",7)(1,ct,4,2),t&2){let n=jE();qI((n.state)==="number"?0:1);}}function ht(t,a){t&1&&(ko(0,"div",4),op(1,9),sc()),t&2&&(_v(),ep("ngTemplateOutlet",a.template));}function ut(t,a){if(t&1&&(ko(0,"div",4),hD(1),sc()),t&2){let e=jE();_v(),qp(e.label);}}function ft(t,a){if(t&1&&(ko(0,"div",5),hD(1),sc()),t&2){let e=jE();_v(),qp(e._intl.optionalLabel);}}function _t(t,a){if(t&1&&(ko(0,"div",6),hD(1),sc()),t&2){let e=jE();_v(),qp(e.errorMessage);}}var Xe=["*"];function vt(t,a){}function gt(t,a){if(t&1&&(BE(0),zf(1,vt,0,0,"ng-template",0)),t&2){let e=jE();_v(),ep("cdkPortalOutlet",e._portal);}}var bt=["animatedContainer"],et=t=>({steps:t}),tt=t=>({step:t});function yt(t,a){t&1&&BE(0);}function xt(t,a){if(t&1&&(ko(0,"div",5),op(1,9)(2,6),sc()),t&2){let e=jE(2),n=WE(6);_v(),ep("ngTemplateOutlet",e.headerPrefix()),_v(),ep("ngTemplateOutlet",n)("ngTemplateOutletContext",bD(3,et,e.steps));}}function Ct(t,a){if(t&1&&op(0,6),t&2){let e=jE(2),n=WE(6);ep("ngTemplateOutlet",n)("ngTemplateOutletContext",bD(2,et,e.steps));}}function St(t,a){if(t&1&&(ko(0,"div",10,2),op(2,9),sc()),t&2){let e=a.$implicit,n=a.$index,i=jE(2);rD("mat-horizontal-stepper-content-"+i._getAnimationDirection(n)),ep("id",i._getStepContentId(n)),Xf("aria-labelledby",i._getStepLabelId(n))("inert",i.selectedIndex===n?null:""),_v(2),ep("ngTemplateOutlet",e.content);}}function Mt(t,a){if(t&1&&(ko(0,"div",3),UI(1,xt,3,5,"div",5)(2,Ct,1,4,"ng-container",6),ko(3,"div",7),zI(4,St,3,6,"div",8,WI),sc()()),t&2){let e=jE();_v(),qI(e.headerPrefix()?1:2),_v(3),QI(e.steps);}}function Dt(t,a){if(t&1&&op(0,9),t&2){let e=jE(2);ep("ngTemplateOutlet",e.headerPrefix());}}function It(t,a){if(t&1&&(ko(0,"div",11),op(1,6),ko(2,"div",12,2)(4,"div",13)(5,"div",14),op(6,9),sc()()()()),t&2){let e=a.$implicit,n=a.$index,i=a.$index,r=a.$count,s=jE(2),ie=WE(4);_v(),ep("ngTemplateOutlet",ie)("ngTemplateOutletContext",bD(11,tt,e)),_v(),Fp("mat-stepper-vertical-line",i!==r-1)("mat-vertical-content-container-active",s.selectedIndex===n),Xf("inert",s.selectedIndex===n?null:"")("aria-label",s.ariaLabel),_v(2),ep("id",s._getStepContentId(n)),Xf("aria-labelledby",s._getStepLabelId(n)),_v(2),ep("ngTemplateOutlet",e.content);}}function Et(t,a){if(t&1&&(ko(0,"div",4),UI(1,Dt,1,1,"ng-container",9),zI(2,It,7,13,"div",11,WI),sc()),t&2){let e=jE();_v(),qI(e.headerPrefix()?1:-1),_v(),QI(e.steps);}}function wt(t,a){if(t&1){let e=XI();ko(0,"mat-step-header",15),_p("click",function(){let i=wl(e).step;return Ml(i.select())})("keydown",function(i){wl(e);let r=jE();return Ml(r._onKeydown(i))}),sc();}if(t&2){let e=a.step,n=jE();Fp("mat-horizontal-stepper-header",n.orientation==="horizontal")("mat-vertical-stepper-header",n.orientation==="vertical"),ep("tabIndex",n._getFocusIndex()===e.index()?0:-1)("id",n._getStepLabelId(e.index()))("index",e.index())("state",e.indicatorType())("label",e.stepLabel||e.label)("selected",e.isSelected())("active",e.isNavigable())("optional",e.optional)("errorMessage",e.errorMessage)("iconOverrides",n._iconOverrides)("disableRipple",n.disableRipple||!e.isNavigable())("color",e.color||n.color),Xf("role",n.orientation==="horizontal"?"tab":"button")("aria-posinset",n.orientation==="horizontal"?e.index()+1:null)("aria-setsize",n.orientation==="horizontal"?n.steps.length:null)("aria-selected",n.orientation==="horizontal"?e.isSelected():null)("aria-current",n.orientation==="vertical"&&e.isSelected()?"step":null)("aria-disabled",n.orientation==="vertical"&&e.isSelected()?"true":null)("aria-expanded",n.orientation==="vertical"?e.isSelected():null)("aria-controls",n._getStepContentId(e.index()))("aria-label",e.ariaLabel||null)("aria-labelledby",!e.ariaLabel&&e.ariaLabelledby?e.ariaLabelledby:null)("aria-disabled",e.isNavigable()?null:true);}}function kt(t,a){t&1&&tp(0,"div",17);}function Tt(t,a){if(t&1&&(op(0,6),UI(1,kt,1,0,"div",17)),t&2){let e=a.$implicit,n=a.$index,i=a.$count;jE(2);let r=WE(4);ep("ngTemplateOutlet",r)("ngTemplateOutletContext",bD(3,tt,e)),_v(),qI(n!==i-1?1:-1);}}function zt(t,a){if(t&1&&(ko(0,"div",16),zI(1,Tt,2,5,null,null,WI),sc()),t&2){let e=a.steps,n=jE();Xf("aria-label",n.ariaLabel),_v(),QI(e);}}var me=(()=>{class t extends ce{static \u0275fac=(()=>{let e;return function(i){return (e||(e=Qg(t)))(i||t)}})();static \u0275dir=DI({type:t,selectors:[["","matStepLabel",""]],features:[Gf]})}return t})(),Ot=(()=>{class t{changes=new g;optionalLabel="Optional";completedLabel="Completed";editableLabel="Editable";static \u0275fac=function(n){return new(n||t)};static \u0275prov=K({token:t,factory:t.\u0275fac,providedIn:"root"})}return t})(),he=(()=>{class t extends de{_intl=E(Ot);_focusMonitor=E(Ze$1);_intlSubscription;state;label;errorMessage;iconOverrides;index;selected=false;active=false;optional=false;disableRipple=false;color;constructor(){super();let e=E(v);e.load(Tt$1),e.load(_);let n=E(Px);this._intlSubscription=this._intl.changes.subscribe(()=>n.markForCheck());}ngAfterViewInit(){this._focusMonitor.monitor(this._elementRef,true);}ngOnDestroy(){this._intlSubscription.unsubscribe(),this._focusMonitor.stopMonitoring(this._elementRef);}focus(e,n){e?this._focusMonitor.focusVia(this._elementRef,e,n):this._elementRef.nativeElement.focus(n);}_stringLabel(){return this.label instanceof me?null:this.label}_templateLabel(){return this.label instanceof me?this.label:null}_getHostElement(){return this._elementRef.nativeElement}_getDefaultTextForState(e){return e=="number"?`${this.index+1}`:e=="edit"?"create":e=="error"?"warning":e}_hasEmptyLabel(){return !this._stringLabel()&&!this._templateLabel()&&!this._hasOptionalLabel()&&!this._hasErrorLabel()}_hasOptionalLabel(){return this.optional&&this.state!=="error"}_hasErrorLabel(){return this.state==="error"}static \u0275fac=function(n){return new(n||t)};static \u0275cmp=mI({type:t,selectors:[["mat-step-header"]],hostAttrs:["role","",1,"mat-step-header"],hostVars:4,hostBindings:function(n,i){n&2&&(rD("mat-"+(i.color||"primary")),Fp("mat-step-header-empty-label",i._hasEmptyLabel()));},inputs:{state:"state",label:"label",errorMessage:"errorMessage",iconOverrides:"iconOverrides",index:"index",selected:"selected",active:"active",optional:"optional",disableRipple:"disableRipple",color:"color"},features:[Gf],decls:10,vars:17,consts:[["matRipple","",1,"mat-step-header-ripple","mat-focus-indicator",3,"matRippleTrigger","matRippleDisabled"],[1,"mat-step-icon-content"],[3,"ngTemplateOutlet","ngTemplateOutletContext"],[1,"mat-step-label"],[1,"mat-step-text-label"],[1,"mat-step-optional"],[1,"mat-step-sub-label-error"],["aria-hidden","true"],[1,"cdk-visually-hidden"],[3,"ngTemplateOutlet"]],template:function(n,i){if(n&1&&(tp(0,"div",0),ko(1,"div")(2,"div",1),UI(3,st,1,6,"ng-container",2)(4,mt,2,1),sc()(),ko(5,"div",3),UI(6,ht,2,1,"div",4)(7,ut,2,1,"div",4),UI(8,ft,2,1,"div",5),UI(9,_t,2,1,"div",6),sc()),n&2){let r;ep("matRippleTrigger",i._getHostElement())("matRippleDisabled",i.disableRipple),_v(),rD(TD("mat-step-icon-state-",i.state," mat-step-icon")),Fp("mat-step-icon-selected",i.selected),_v(2),qI(i.iconOverrides&&i.iconOverrides[i.state]?3:4),_v(2),Fp("mat-step-label-active",i.active)("mat-step-label-selected",i.selected)("mat-step-label-error",i.state=="error"),_v(),qI((r=i._templateLabel())?6:i._stringLabel()?7:-1,r),_v(2),qI(i._hasOptionalLabel()?8:-1),_v(),qI(i._hasErrorLabel()?9:-1);}},dependencies:[Et$1,tn,yt$1],styles:[`.mat-step-header {
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
  background-color: var(--mat-stepper-header-hover-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity) * 100%), transparent));
  border-radius: var(--mat-stepper-header-hover-state-layer-shape, var(--mat-sys-corner-medium));
}
.mat-step-header.cdk-keyboard-focused, .mat-step-header.cdk-program-focused {
  background-color: var(--mat-stepper-header-focus-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-focus-state-layer-opacity) * 100%), transparent));
  border-radius: var(--mat-stepper-header-focus-state-layer-shape, var(--mat-sys-corner-medium));
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
  color: var(--mat-stepper-header-optional-label-text-color, var(--mat-sys-on-surface-variant));
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
  color: var(--mat-stepper-header-icon-foreground-color, var(--mat-sys-surface));
  background-color: var(--mat-stepper-header-icon-background-color, var(--mat-sys-on-surface-variant));
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
  background-color: var(--mat-stepper-header-error-state-icon-background-color, transparent);
  color: var(--mat-stepper-header-error-state-icon-foreground-color, var(--mat-sys-error));
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
  font-family: var(--mat-stepper-header-label-text-font, var(--mat-sys-title-small-font));
  font-size: var(--mat-stepper-header-label-text-size, var(--mat-sys-title-small-size));
  font-weight: var(--mat-stepper-header-label-text-weight, var(--mat-sys-title-small-weight));
  color: var(--mat-stepper-header-label-text-color, var(--mat-sys-on-surface-variant));
}
.mat-step-label.mat-step-label-active {
  color: var(--mat-stepper-header-selected-state-label-text-color, var(--mat-sys-on-surface-variant));
}
.mat-step-label.mat-step-label-error {
  color: var(--mat-stepper-header-error-state-label-text-color, var(--mat-sys-error));
  font-size: var(--mat-stepper-header-error-state-label-text-size, var(--mat-sys-title-small-size));
}
.mat-step-label.mat-step-label-selected {
  font-size: var(--mat-stepper-header-selected-state-label-text-size, var(--mat-sys-title-small-size));
  font-weight: var(--mat-stepper-header-selected-state-label-text-weight, var(--mat-sys-title-small-weight));
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
  background-color: var(--mat-stepper-header-selected-state-icon-background-color, var(--mat-sys-primary));
  color: var(--mat-stepper-header-selected-state-icon-foreground-color, var(--mat-sys-on-primary));
}

.mat-step-icon-state-done {
  background-color: var(--mat-stepper-header-done-state-icon-background-color, var(--mat-sys-primary));
  color: var(--mat-stepper-header-done-state-icon-foreground-color, var(--mat-sys-on-primary));
}

.mat-step-icon-state-edit {
  background-color: var(--mat-stepper-header-edit-state-icon-background-color, var(--mat-sys-primary));
  color: var(--mat-stepper-header-edit-state-icon-foreground-color, var(--mat-sys-on-primary));
}
`],encapsulation:2})}return t})(),Rt=(()=>{class t{templateRef=E(Xn);name;constructor(){}static \u0275fac=function(n){return new(n||t)};static \u0275dir=DI({type:t,selectors:[["ng-template","matStepperIcon",""]],inputs:{name:[0,"matStepperIcon","name"]}})}return t})(),Lt=(()=>{class t{_template=E(Xn);constructor(){}static \u0275fac=function(n){return new(n||t)};static \u0275dir=DI({type:t,selectors:[["ng-template","matStepContent",""]]})}return t})(),Ft=(()=>{class t extends ne{_errorStateMatcher=E(d,{skipSelf:true});_viewContainerRef=E(ei);_isSelected=I$2.EMPTY;stepLabel=void 0;color;_lazyContent;_portal;ngAfterContentInit(){this._isSelected=this._stepper.steps.changes.pipe(re(()=>this._stepper.selectionChange.pipe(V(e=>e.selectedStep===this),Un(this._stepper.selected===this)))).subscribe(e=>{e&&this._lazyContent&&!this._portal&&(this._portal=new s$1(this._lazyContent._template,this._viewContainerRef));});}ngOnDestroy(){this._isSelected.unsubscribe();}isErrorState(e,n){let i=this._errorStateMatcher.isErrorState(e,n),r=!!(e&&e.invalid&&this.interacted);return i||r}static \u0275fac=(()=>{let e;return function(i){return (e||(e=Qg(t)))(i||t)}})();static \u0275cmp=mI({type:t,selectors:[["mat-step"]],contentQueries:function(n,i,r){if(n&1&&xp(r,me,5)(r,Lt,5),n&2){let s;UE(s=qE())&&(i.stepLabel=s.first),UE(s=qE())&&(i._lazyContent=s.first);}},hostAttrs:["hidden",""],inputs:{color:"color"},exportAs:["matStep"],features:[_D([{provide:d,useExisting:t},{provide:ne,useExisting:t}]),Gf],ngContentSelectors:Xe,decls:1,vars:0,consts:[[3,"cdkPortalOutlet"]],template:function(n,i){n&1&&(HE(),zf(0,gt,2,1,"ng-template"));},dependencies:[O],encapsulation:2})}return t})(),Pt=(()=>{class t extends L{_ngZone=E(W);_renderer=E(Ty);_animationsDisabled=qt();_cleanupTransition;_isAnimating=be(false);_stepHeader=void 0;_animatedContainers;_steps=void 0;steps=new Eo;_icons;animationDone=new Oe;disableRipple=false;color;labelPosition="end";headerPosition="top";ariaLabel=null;headerPrefix=xx(null);_iconOverrides={};get animationDuration(){return this._animationDuration}set animationDuration(e){this._animationDuration=/^\d+$/.test(e)?e+"ms":e;}_animationDuration="";_isServer=!E(h).isBrowser;constructor(){super();let n=E(sr).nativeElement.nodeName.toLowerCase();this.orientation=n==="mat-vertical-stepper"?"vertical":"horizontal";}ngAfterContentInit(){super.ngAfterContentInit(),this._icons.forEach(({name:e,templateRef:n})=>this._iconOverrides[e]=n),this.steps.changes.pipe(Yn(this._destroyed)).subscribe(()=>this._stateChanged()),this.selectedIndexChange.pipe(Yn(this._destroyed)).subscribe(()=>{let e=this._getAnimationDuration();e==="0ms"||e==="0s"?this._onAnimationDone():this._isAnimating.set(true);}),this._ngZone.runOutsideAngular(()=>{this._animationsDisabled||setTimeout(()=>{this._elementRef.nativeElement.classList.add("mat-stepper-animations-enabled"),this._cleanupTransition=this._renderer.listen(this._elementRef.nativeElement,"transitionend",this._handleTransitionend);},200);});}ngAfterViewInit(){if(super.ngAfterViewInit(),typeof queueMicrotask=="function"){let e=false;this._animatedContainers.changes.pipe(Un(null),Yn(this._destroyed)).subscribe(()=>queueMicrotask(()=>{e||(e=true,this.animationDone.emit()),this._stateChanged();}));}}ngOnDestroy(){super.ngOnDestroy(),this._cleanupTransition?.();}_getAnimationDuration(){return this._animationsDisabled?"0ms":this.animationDuration?this.animationDuration:this.orientation==="horizontal"?"500ms":"225ms"}_handleTransitionend=e=>{let n=e.target;if(!n)return;let i=this.orientation==="horizontal"&&e.propertyName==="transform"&&n.classList.contains("mat-horizontal-stepper-content-current"),r=this.orientation==="vertical"&&e.propertyName==="grid-template-rows"&&n.classList.contains("mat-vertical-content-container-active");(i||r)&&this._animatedContainers.find(ie=>ie.nativeElement===n)&&this._onAnimationDone();};_onAnimationDone(){this._isAnimating.set(false),this.animationDone.emit();}static \u0275fac=function(n){return new(n||t)};static \u0275cmp=mI({type:t,selectors:[["mat-stepper"],["mat-vertical-stepper"],["mat-horizontal-stepper"],["","matStepper",""]],contentQueries:function(n,i,r){if(n&1&&xp(r,Ft,5)(r,Rt,5),n&2){let s;UE(s=qE())&&(i._steps=s),UE(s=qE())&&(i._icons=s);}},viewQuery:function(n,i){if(n&1&&Ap(he,5)(bt,5),n&2){let r;UE(r=qE())&&(i._stepHeader=r),UE(r=qE())&&(i._animatedContainers=r);}},hostVars:14,hostBindings:function(n,i){n&2&&(Pp("--mat-stepper-animation-duration",i._getAnimationDuration()),Fp("mat-stepper-horizontal",i.orientation==="horizontal")("mat-stepper-vertical",i.orientation==="vertical")("mat-stepper-label-position-end",i.orientation==="horizontal"&&i.labelPosition=="end")("mat-stepper-label-position-bottom",i.orientation==="horizontal"&&i.labelPosition=="bottom")("mat-stepper-header-position-bottom",i.headerPosition==="bottom")("mat-stepper-animating",i._isAnimating()));},inputs:{disableRipple:"disableRipple",color:"color",labelPosition:"labelPosition",headerPosition:"headerPosition",ariaLabel:[0,"aria-label","ariaLabel"],headerPrefix:[1,"headerPrefix"],animationDuration:"animationDuration"},outputs:{animationDone:"animationDone"},exportAs:["matStepper","matVerticalStepper","matHorizontalStepper"],features:[_D([{provide:L,useExisting:t}]),Gf],ngContentSelectors:Xe,decls:7,vars:2,consts:[["stepTemplate",""],["horizontalStepsTemplate",""],["animatedContainer",""],[1,"mat-horizontal-stepper-wrapper"],[1,"mat-vertical-stepper-wrapper"],[1,"mat-horizontal-stepper-header-wrapper"],[3,"ngTemplateOutlet","ngTemplateOutletContext"],[1,"mat-horizontal-content-container"],["role","tabpanel",1,"mat-horizontal-stepper-content",3,"id","class"],[3,"ngTemplateOutlet"],["role","tabpanel",1,"mat-horizontal-stepper-content",3,"id"],[1,"mat-step"],[1,"mat-vertical-content-container"],["role","region",1,"mat-vertical-stepper-content",3,"id"],[1,"mat-vertical-content"],[3,"click","keydown","tabIndex","id","index","state","label","selected","active","optional","errorMessage","iconOverrides","disableRipple","color"],["aria-orientation","horizontal","role","tablist",1,"mat-horizontal-stepper-header-container"],[1,"mat-stepper-horizontal-line"]],template:function(n,i){if(n&1&&(HE(),UI(0,yt,1,0),UI(1,Mt,6,1,"div",3)(2,Et,4,1,"div",4),zf(3,wt,1,27,"ng-template",null,0,HD)(5,zt,3,1,"ng-template",null,1,HD)),n&2){let r;qI(i._isServer?0:-1),_v(),qI((r=i.orientation)==="horizontal"?1:r==="vertical"?2:-1);}},dependencies:[tn,he],styles:[`.mat-stepper-vertical,
.mat-stepper-horizontal {
  display: block;
  font-family: var(--mat-stepper-container-text-font, var(--mat-sys-body-medium-font));
  background: var(--mat-stepper-container-color, var(--mat-sys-surface));
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
  border-top-color: var(--mat-stepper-line-color, var(--mat-sys-outline));
}
.mat-stepper-label-position-bottom .mat-stepper-horizontal-line {
  margin: 0;
  min-width: 0;
  position: relative;
  top: calc(calc((var(--mat-stepper-header-height, 72px) - 24px) / 2) + 12px);
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
  height: var(--mat-stepper-header-height, 72px);
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
  border-top-color: var(--mat-stepper-line-color, var(--mat-sys-outline));
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header {
  padding: calc((var(--mat-stepper-header-height, 72px) - 24px) / 2) 24px;
}
.mat-stepper-label-position-bottom .mat-horizontal-stepper-header::before, .mat-stepper-label-position-bottom .mat-horizontal-stepper-header::after {
  top: calc(calc((var(--mat-stepper-header-height, 72px) - 24px) / 2) + 12px);
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
  padding: calc((var(--mat-stepper-header-height, 72px) - 24px) / 2) 24px;
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
  transition: transform var(--mat-stepper-animation-duration, 0) cubic-bezier(0.35, 0, 0.25, 1);
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
  transition: grid-template-rows var(--mat-stepper-animation-duration, 0) cubic-bezier(0.4, 0, 0.2, 1);
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
  border-left-color: var(--mat-stepper-line-color, var(--mat-sys-outline));
  top: calc(8px - calc((var(--mat-stepper-header-height, 72px) - 24px) / 2));
  bottom: calc(8px - calc((var(--mat-stepper-header-height, 72px) - 24px) / 2));
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
  transition: visibility var(--mat-stepper-animation-duration, 0) linear;
}
.mat-vertical-content-container-active > .mat-vertical-stepper-content {
  visibility: visible;
}

.mat-vertical-content {
  padding: 0 24px 24px 24px;
}
`],encapsulation:2})}return t})(),Ln=(()=>{class t extends Ze{static \u0275fac=(()=>{let e;return function(i){return (e||(e=Qg(t)))(i||t)}})();static \u0275dir=DI({type:t,selectors:[["button","matStepperNext",""]],hostAttrs:[1,"mat-stepper-next"],hostVars:1,hostBindings:function(n,i){n&2&&cp("type",i.type);},features:[Gf]})}return t})(),Fn=(()=>{class t extends Ye{static \u0275fac=(()=>{let e;return function(i){return (e||(e=Qg(t)))(i||t)}})();static \u0275dir=DI({type:t,selectors:[["button","matStepperPrevious",""]],hostAttrs:[1,"mat-stepper-previous"],hostVars:1,hostBindings:function(n,i){n&2&&cp("type",i.type);},features:[Gf]})}return t})(),Pn=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=yI({type:t});static \u0275inj=el({providers:[d],imports:[I$1,Je,Nt,f,Pt,he,w]})}return t})();export{Ft as F,Ln as L,Pn as P,Pt as a,Fn as b,me as m};