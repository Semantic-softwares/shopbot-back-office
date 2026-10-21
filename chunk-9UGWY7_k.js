import{c as z}from"./chunk-RykAvsdd.js";import{wt as du,x as I}from"./chunk-DMEhUgHW.js";import{$t as aM,An as iM,B as Jm,Cn as eu,Cr as sw,Ct as UL,D as HL,E as Ge,Hr as wm,Jr as y,N as Io,Q as Nm,Qn as nM,Xt as __,Z as N,cn as cM,dn as cv,m as Cm,mn as dT,mr as rN,mt as Rm,nn as au,pr as rM,pt as RM,qt as Ze,rr as nv,ut as Qo,vr as sN,vt as Si}from"./chunk-DTckT2H2.js";import{Kt as ce,Nn as ai,Tn as Qe,Ut as Ae,Wt as Fe,bn as Ie,ir as V,kn as Xe,or as x,qt as de,rr as L}from"./chunk-BsQ53arL.js";import{n as u,t as m}from"./chunk-BesbR_he.js";function Mt(n,r,t){if(t.length){let i=r.toArray(),s=t.toArray(),c=0;for(let m=0;m<n+1;m++)i[m].group&&i[m].group===s[c]&&c++;return c}return 0}function It(n,r,t,i){return n<t?n:n+r>t+i?Math.max(0,n-i+r):t}var rt;var st;var k;var Rt;var mt=z(()=>{"use strict";ai();Xe();__();__();du();de();m();ce();L();rt=new N(`MAT_OPTION_PARENT_COMPONENT`),st=new N(`MatOptgroup`),k=class{source;isUserInput;constructor(r,t=!1){this.source=r,this.isUserInput=t}},Rt=(()=>{class n{_element=y(Qo);_changeDetectorRef=y(HL);_parent=y(rt,{optional:!0});group=y(st,{optional:!0});_signalDisableRipple=!1;_selected=!1;_active=!1;_mostRecentViewValue=``;get multiple(){return this._parent&&this._parent.multiple}get selected(){return this._selected}value;id=y(Ie).getId(`mat-option-`);get disabled(){return this.group&&this.group.disabled||this._disabled()}set disabled(t){this._disabled.set(t)}_disabled=Ge(!1);get disableRipple(){return this._signalDisableRipple?this._parent.disableRipple():!!this._parent?.disableRipple}get hideSingleSelectionIndicator(){return!!(this._parent&&this._parent.hideSingleSelectionIndicator)}onSelectionChange=new Ze;_text;_stateChanges=new I;constructor(){let t=y(x);t.load(Fe),t.load(V),this._signalDisableRipple=!!this._parent&&Io(this._parent.disableRipple)}get active(){return this._active}get viewValue(){return(this._text?.nativeElement.textContent||``).trim()}select(t=!0){this._selected||(this._selected=!0,this._changeDetectorRef.markForCheck(),t&&this._emitSelectionChangeEvent())}deselect(t=!0){this._selected&&(this._selected=!1,this._changeDetectorRef.markForCheck(),t&&this._emitSelectionChangeEvent())}focus(t,i){let s=this._getHostElement();typeof s.focus==`function`&&s.focus(i)}setActiveStyles(){this._active||(this._active=!0,this._changeDetectorRef.markForCheck())}setInactiveStyles(){this._active&&(this._active=!1,this._changeDetectorRef.markForCheck())}getLabel(){return this.viewValue}_handleKeydown(t){(t.keyCode===13||t.keyCode===32)&&!Qe(t)&&(this._selectViaInteraction(),t.preventDefault())}_selectViaInteraction(){this.disabled||(this._selected=this.multiple?!this._selected:!0,this._changeDetectorRef.markForCheck(),this._emitSelectionChangeEvent(!0))}_getTabIndex(){return this.disabled?`-1`:`0`}_getHostElement(){return this._element.nativeElement}ngAfterViewChecked(){if(this._selected){let t=this.viewValue;t!==this._mostRecentViewValue&&(this._mostRecentViewValue&&this._stateChanges.next(),this._mostRecentViewValue=t)}}ngOnDestroy(){this._stateChanges.complete()}_emitSelectionChangeEvent(t=!1){this.onSelectionChange.emit(new k(this,t))}static ɵfac=function(i){return new(i||n)};static ɵcmp=(function(){let t=[`text`],i=[[[`mat-icon`]],`*`],s=[`mat-icon`,`*`];function c(o,a){if(o&1&&Nm(0,`mat-pseudo-checkbox`,1),o&2){let e=nM();wm(`disabled`,e.disabled)(`state`,e.selected?`checked`:`unchecked`)}}function m(o,a){if(o&1&&Nm(0,`mat-pseudo-checkbox`,3),o&2){let e=nM();wm(`disabled`,e.disabled)}}function $(o,a){if(o&1&&(Si(0,`span`,4),RM(1),eu()),o&2){let e=nM();dT(),au(`(`,e.group.label,`)`)}}return sw({type:n,selectors:[[`mat-option`]],viewQuery:function(a,e){if(a&1&&nv(t,7),a&2){let p;aM(p=cM())&&(e._text=p.first)}},hostAttrs:[`role`,`option`,1,`mat-mdc-option`,`mdc-list-item`],hostVars:11,hostBindings:function(a,e){a&1&&Jm(`click`,function(){return e._selectViaInteraction()})(`keydown`,function(J){return e._handleKeydown(J)}),a&2&&(Rm(`id`,e.id),Cm(`aria-selected`,e.selected)(`aria-disabled`,e.disabled.toString()),cv(`mdc-list-item--selected`,e.selected)(`mat-mdc-option-multiple`,e.multiple)(`mat-mdc-option-active`,e.active)(`mdc-list-item--disabled`,e.disabled))},inputs:{value:`value`,id:`id`,disabled:[2,`disabled`,`disabled`,UL]},outputs:{onSelectionChange:`onSelectionChange`},exportAs:[`matOption`],ngContentSelectors:s,decls:8,vars:5,consts:[[`text`,``],[`aria-hidden`,`true`,1,`mat-mdc-option-pseudo-checkbox`,3,`disabled`,`state`],[1,`mdc-list-item__primary-text`],[`state`,`checked`,`aria-hidden`,`true`,`appearance`,`minimal`,1,`mat-mdc-option-pseudo-checkbox`,3,`disabled`],[1,`cdk-visually-hidden`],[`aria-hidden`,`true`,`mat-ripple`,``,1,`mat-mdc-option-ripple`,`mat-focus-indicator`,3,`matRippleTrigger`,`matRippleDisabled`]],template:function(a,e){a&1&&(rM(i),rN(0,c,1,2,`mat-pseudo-checkbox`,1),iM(1),Si(2,`span`,2,0),iM(4,1),eu(),rN(5,m,1,1,`mat-pseudo-checkbox`,3),rN(6,$,2,1,`span`,4),Nm(7,`div`,5)),a&2&&(sN(e.multiple?0:-1),dT(5),sN(!e.multiple&&e.selected&&!e.hideSingleSelectionIndicator?5:-1),dT(),sN(e.group&&e.group._inert?6:-1),dT(),wm(`matRippleTrigger`,e._getHostElement())(`matRippleDisabled`,e.disabled||e.disableRipple))},dependencies:[u,Ae],styles:[`.mat-mdc-option {
  -webkit-user-select: none;
  user-select: none;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  min-height: 48px;
  padding: 0 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  color: var(--%NS%mat-option-label-text-color, var(--%NS%mat-sys-on-surface));
  font-family: var(--%NS%mat-option-label-text-font, var(--%NS%mat-sys-label-large-font));
  line-height: var(--%NS%mat-option-label-text-line-height, var(--%NS%mat-sys-label-large-line-height));
  font-size: var(--%NS%mat-option-label-text-size, var(--%NS%mat-sys-body-large-size));
  letter-spacing: var(--%NS%mat-option-label-text-tracking, var(--%NS%mat-sys-label-large-tracking));
  font-weight: var(--%NS%mat-option-label-text-weight, var(--%NS%mat-sys-body-large-weight));
}
.mat-mdc-option:hover:not(.mdc-list-item--disabled) {
  background-color: var(--%NS%mat-option-hover-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-hover-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-option:focus.mdc-list-item, .mat-mdc-option.mat-mdc-option-active.mdc-list-item {
  background-color: var(--%NS%mat-option-focus-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-focus-state-layer-opacity) * 100%), transparent));
  outline: 0;
}
.mat-mdc-option.mdc-list-item--%NS%selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) {
  background-color: var(--%NS%mat-option-selected-state-layer-color, var(--%NS%mat-sys-secondary-container));
}
.mat-mdc-option.mdc-list-item--%NS%selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) .mdc-list-item__primary-text {
  color: var(--%NS%mat-option-selected-state-label-text-color, var(--%NS%mat-sys-on-secondary-container));
}
.mat-mdc-option .mat-pseudo-checkbox {
  --%NS%mat-pseudo-checkbox-minimal-selected-checkmark-color: var(--%NS%mat-option-selected-state-label-text-color, var(--%NS%mat-sys-on-secondary-container));
}
.mat-mdc-option.mdc-list-item {
  align-items: center;
  background: transparent;
}
.mat-mdc-option.mdc-list-item--disabled {
  cursor: default;
  pointer-events: none;
}
.mat-mdc-option.mdc-list-item--disabled .mat-mdc-option-pseudo-checkbox, .mat-mdc-option.mdc-list-item--disabled .mdc-list-item__primary-text, .mat-mdc-option.mdc-list-item--disabled > mat-icon {
  opacity: 0.38;
}
.mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {
  padding-left: 32px;
}
[dir=rtl] .mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {
  padding-left: 16px;
  padding-right: 32px;
}
.mat-mdc-option .mat-icon,
.mat-mdc-option .mat-pseudo-checkbox-full {
  margin-right: 16px;
  flex-shrink: 0;
}
[dir=rtl] .mat-mdc-option .mat-icon,
[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-full {
  margin-right: 0;
  margin-left: 16px;
}
.mat-mdc-option .mat-pseudo-checkbox-minimal {
  margin-left: 16px;
  flex-shrink: 0;
}
[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-minimal {
  margin-right: 16px;
  margin-left: 0;
}
.mat-mdc-option .mat-mdc-option-ripple {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
}
.mat-mdc-option .mdc-list-item__primary-text {
  white-space: normal;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  font-family: inherit;
  text-decoration: inherit;
  text-transform: inherit;
  margin-right: auto;
}
[dir=rtl] .mat-mdc-option .mdc-list-item__primary-text {
  margin-right: 0;
  margin-left: auto;
}
@media (forced-colors: active) {
  .mat-mdc-option.mdc-list-item--%NS%selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
    width: 10px;
    height: 0;
    border-bottom: solid 10px;
    border-radius: 10px;
  }
  [dir=rtl] .mat-mdc-option.mdc-list-item--%NS%selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {
    right: auto;
    left: 16px;
  }
}

.mat-mdc-option-multiple {
  --%NS%mat-list-list-item-selected-container-color: var(--%NS%mat-list-list-item-container-color, transparent);
}

.mat-mdc-option-active .mat-focus-indicator::before {
  content: "";
}
`],encapsulation:2})})()}return n})()});export{mt as a,k as i,Mt as n,rt as o,Rt as r,st as s,It as t};