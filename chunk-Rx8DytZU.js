import{c as z}from"./chunk-RykAvsdd.js";import{wt as du,x as I}from"./chunk-BlIjUhyR.js";import{$t as aM,An as iM,B as Jm,Cn as eu,Cr as sw,Ct as UL,D as HL,Dr as tu,E as Ge,Hr as wm,Jr as y,N as Io,Q as Nm,Qn as nM,Xt as __,Z as N,cn as cM,dn as cv,m as Cm,mn as dT,mr as rN,mt as Rm,nn as au,nr as nu,pr as rM,pt as RM,qt as Ze,rr as nv,ur as qM,ut as Qo,vr as sN,vt as Si}from"./chunk-Bq7UxBjW.js";import{$t as ai,Bt as Ie,Cn as L,Ct as Fe,En as x,Et as de,Gt as Qe,St as Ae,Tt as ce,Yt as Xe,wn as V}from"./chunk-4cHYXQHv.js";import{n as u,t as m}from"./chunk-DhP_2oLP.js";function It(n,c,t){if(t.length){let o=c.toArray(),m=t.toArray(),r=0;for(let i=0;i<n+1;i++)o[i].group&&o[i].group===m[r]&&r++;return r}return 0}function Et(n,c,t,o){return n<t?n:n+c>t+o?Math.max(0,n-o+c):t}var X;var Z;var Rt;var E;var Mt;var pt=z(()=>{"use strict";ai();Xe();__();__();du();de();m();ce();L();X=new N(`MAT_OPTION_PARENT_COMPONENT`),Z=new N(`MatOptgroup`),Rt=(()=>{class n{label;disabled=!1;_labelId=y(Ie).getId(`mat-optgroup-label-`);_inert;constructor(){let t=y(X,{optional:!0});this._inert=t?.inertGroups??!1}static ɵfac=function(o){return new(o||n)};static ɵcmp=(function(){let t=[`*`,[[`mat-option`],[`ng-container`]]];return sw({type:n,selectors:[[`mat-optgroup`]],hostAttrs:[1,`mat-mdc-optgroup`],hostVars:3,hostBindings:function(r,i){r&2&&Cm(`role`,i._inert?null:`group`)(`aria-disabled`,i._inert?null:i.disabled.toString())(`aria-labelledby`,i._inert?null:i._labelId)},inputs:{label:`label`,disabled:[2,`disabled`,`disabled`,UL]},exportAs:[`matOptgroup`],features:[qM([{provide:Z,useExisting:n}])],ngContentSelectors:[`*`,`mat-option, ng-container`],decls:5,vars:4,consts:[[`role`,`presentation`,1,`mat-mdc-optgroup-label`,3,`id`],[1,`mdc-list-item__primary-text`]],template:function(r,i){r&1&&(rM(t),tu(0,`span`,0)(1,`span`,1),RM(2),iM(3),nu()(),iM(4,1)),r&2&&(cv(`mdc-list-item--disabled`,i.disabled),Rm(`id`,i._labelId),dT(2),au(``,i.label,` `))},styles:[`.mat-mdc-optgroup {
  color: var(--%NS%mat-optgroup-label-text-color, var(--%NS%mat-sys-on-surface-variant));
  font-family: var(--%NS%mat-optgroup-label-text-font, var(--%NS%mat-sys-title-small-font));
  line-height: var(--%NS%mat-optgroup-label-text-line-height, var(--%NS%mat-sys-title-small-line-height));
  font-size: var(--%NS%mat-optgroup-label-text-size, var(--%NS%mat-sys-title-small-size));
  letter-spacing: var(--%NS%mat-optgroup-label-text-tracking, var(--%NS%mat-sys-title-small-tracking));
  font-weight: var(--%NS%mat-optgroup-label-text-weight, var(--%NS%mat-sys-title-small-weight));
}

.mat-mdc-optgroup-label {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  min-height: 48px;
  padding: 0 16px;
  outline: none;
}
.mat-mdc-optgroup-label.mdc-list-item--disabled {
  opacity: 0.38;
}
.mat-mdc-optgroup-label .mdc-list-item__primary-text {
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  font-family: inherit;
  text-decoration: inherit;
  text-transform: inherit;
  white-space: normal;
  color: inherit;
}
`],encapsulation:2})})()}return n})(),E=class{source;isUserInput;constructor(c,t=!1){this.source=c,this.isUserInput=t}},Mt=(()=>{class n{_element=y(Qo);_changeDetectorRef=y(HL);_parent=y(X,{optional:!0});group=y(Z,{optional:!0});_signalDisableRipple=!1;_selected=!1;_active=!1;_mostRecentViewValue=``;get multiple(){return this._parent&&this._parent.multiple}get selected(){return this._selected}value;id=y(Ie).getId(`mat-option-`);get disabled(){return this.group&&this.group.disabled||this._disabled()}set disabled(t){this._disabled.set(t)}_disabled=Ge(!1);get disableRipple(){return this._signalDisableRipple?this._parent.disableRipple():!!this._parent?.disableRipple}get hideSingleSelectionIndicator(){return!!(this._parent&&this._parent.hideSingleSelectionIndicator)}onSelectionChange=new Ze;_text;_stateChanges=new I;constructor(){let t=y(x);t.load(Fe),t.load(V),this._signalDisableRipple=!!this._parent&&Io(this._parent.disableRipple)}get active(){return this._active}get viewValue(){return(this._text?.nativeElement.textContent||``).trim()}select(t=!0){this._selected||(this._selected=!0,this._changeDetectorRef.markForCheck(),t&&this._emitSelectionChangeEvent())}deselect(t=!0){this._selected&&(this._selected=!1,this._changeDetectorRef.markForCheck(),t&&this._emitSelectionChangeEvent())}focus(t,o){let m=this._getHostElement();typeof m.focus==`function`&&m.focus(o)}setActiveStyles(){this._active||(this._active=!0,this._changeDetectorRef.markForCheck())}setInactiveStyles(){this._active&&(this._active=!1,this._changeDetectorRef.markForCheck())}getLabel(){return this.viewValue}_handleKeydown(t){(t.keyCode===13||t.keyCode===32)&&!Qe(t)&&(this._selectViaInteraction(),t.preventDefault())}_selectViaInteraction(){this.disabled||(this._selected=this.multiple?!this._selected:!0,this._changeDetectorRef.markForCheck(),this._emitSelectionChangeEvent(!0))}_getTabIndex(){return this.disabled?`-1`:`0`}_getHostElement(){return this._element.nativeElement}ngAfterViewChecked(){if(this._selected){let t=this.viewValue;t!==this._mostRecentViewValue&&(this._mostRecentViewValue&&this._stateChanges.next(),this._mostRecentViewValue=t)}}ngOnDestroy(){this._stateChanges.complete()}_emitSelectionChangeEvent(t=!1){this.onSelectionChange.emit(new E(this,t))}static ɵfac=function(o){return new(o||n)};static ɵcmp=(function(){let t=[`text`],o=[[[`mat-icon`]],`*`],m=[`mat-icon`,`*`];function r(a,l){if(a&1&&Nm(0,`mat-pseudo-checkbox`,1),a&2){let e=nM();wm(`disabled`,e.disabled)(`state`,e.selected?`checked`:`unchecked`)}}function i(a,l){if(a&1&&Nm(0,`mat-pseudo-checkbox`,3),a&2){let e=nM();wm(`disabled`,e.disabled)}}function tt(a,l){if(a&1&&(Si(0,`span`,4),RM(1),eu()),a&2){let e=nM();dT(),au(`(`,e.group.label,`)`)}}return sw({type:n,selectors:[[`mat-option`]],viewQuery:function(l,e){if(l&1&&nv(t,7),l&2){let u;aM(u=cM())&&(e._text=u.first)}},hostAttrs:[`role`,`option`,1,`mat-mdc-option`,`mdc-list-item`],hostVars:11,hostBindings:function(l,e){l&1&&Jm(`click`,function(){return e._selectViaInteraction()})(`keydown`,function(et){return e._handleKeydown(et)}),l&2&&(Rm(`id`,e.id),Cm(`aria-selected`,e.selected)(`aria-disabled`,e.disabled.toString()),cv(`mdc-list-item--selected`,e.selected)(`mat-mdc-option-multiple`,e.multiple)(`mat-mdc-option-active`,e.active)(`mdc-list-item--disabled`,e.disabled))},inputs:{value:`value`,id:`id`,disabled:[2,`disabled`,`disabled`,UL]},outputs:{onSelectionChange:`onSelectionChange`},exportAs:[`matOption`],ngContentSelectors:m,decls:8,vars:5,consts:[[`text`,``],[`aria-hidden`,`true`,1,`mat-mdc-option-pseudo-checkbox`,3,`disabled`,`state`],[1,`mdc-list-item__primary-text`],[`state`,`checked`,`aria-hidden`,`true`,`appearance`,`minimal`,1,`mat-mdc-option-pseudo-checkbox`,3,`disabled`],[1,`cdk-visually-hidden`],[`aria-hidden`,`true`,`mat-ripple`,``,1,`mat-mdc-option-ripple`,`mat-focus-indicator`,3,`matRippleTrigger`,`matRippleDisabled`]],template:function(l,e){l&1&&(rM(o),rN(0,r,1,2,`mat-pseudo-checkbox`,1),iM(1),Si(2,`span`,2,0),iM(4,1),eu(),rN(5,i,1,1,`mat-pseudo-checkbox`,3),rN(6,tt,2,1,`span`,4),Nm(7,`div`,5)),l&2&&(sN(e.multiple?0:-1),dT(5),sN(!e.multiple&&e.selected&&!e.hideSingleSelectionIndicator?5:-1),dT(),sN(e.group&&e.group._inert?6:-1),dT(),wm(`matRippleTrigger`,e._getHostElement())(`matRippleDisabled`,e.disabled||e.disableRipple))},dependencies:[u,Ae],styles:[`.mat-mdc-option {
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
`],encapsulation:2})})()}return n})()});export{Rt as a,pt as c,Mt as i,Et as n,X as o,It as r,Z as s,E as t};