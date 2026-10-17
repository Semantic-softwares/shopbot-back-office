import{c as z}from"./chunk-RykAvsdd.js";import{Cn as cv,Er as sM,F as IM,Ht as Ws,Jr as y,Pr as tv,Un as iw,ar as lw,at as M_,kn as em,pr as oM,ri as zo,u as Bt,un as aM,xr as rM}from"./chunk-BOgKwfio.js";import{At as O,Mt as _,X as G,en as _$1}from"./chunk-BRPMT0PU.js";var R;var U;var L;var D=z(()=>{"use strict";G();M_();M_();_();R=(()=>{class t{static ɵfac=function(o){return new(o||t)};static ɵdir=lw({type:t,selectors:[[`mat-toolbar-row`]],hostAttrs:[1,`mat-toolbar-row`],exportAs:[`matToolbarRow`]})}return t})(),U=(()=>{class t{_elementRef=y(zo);_platform=y(_$1);_document=y(Bt);color;_toolbarRows;ngAfterViewInit(){this._platform.isBrowser&&(this._checkToolbarMixedModes(),this._toolbarRows.changes.subscribe(()=>this._checkToolbarMixedModes()))}_checkToolbarMixedModes(){this._toolbarRows.length}static ɵfac=function(o){return new(o||t)};static ɵcmp=(function(){let r=[`*`,[[`mat-toolbar-row`]]];return iw({type:t,selectors:[[`mat-toolbar`]],contentQueries:function(e,a,T){if(e&1&&tv(T,R,5),e&2){let m;sM(m=aM())&&(a._toolbarRows=m)}},hostAttrs:[1,`mat-toolbar`],hostVars:6,hostBindings:function(e,a){e&2&&(IM(a.color?`mat-`+a.color:``),cv(`mat-toolbar-multiple-rows`,a._toolbarRows.length>0)(`mat-toolbar-single-row`,a._toolbarRows.length===0))},inputs:{color:`color`},exportAs:[`matToolbar`],ngContentSelectors:[`*`,`mat-toolbar-row`],decls:2,vars:0,template:function(e,a){e&1&&(oM(r),rM(0),rM(1,1))},styles:[`.mat-toolbar {
  background: var(--%NS%mat-toolbar-container-background-color, var(--%NS%mat-sys-surface));
  color: var(--%NS%mat-toolbar-container-text-color, var(--%NS%mat-sys-on-surface));
}
.mat-toolbar, .mat-toolbar h1, .mat-toolbar h2, .mat-toolbar h3, .mat-toolbar h4, .mat-toolbar h5, .mat-toolbar h6 {
  font-family: var(--%NS%mat-toolbar-title-text-font, var(--%NS%mat-sys-title-large-font));
  font-size: var(--%NS%mat-toolbar-title-text-size, var(--%NS%mat-sys-title-large-size));
  line-height: var(--%NS%mat-toolbar-title-text-line-height, var(--%NS%mat-sys-title-large-line-height));
  font-weight: var(--%NS%mat-toolbar-title-text-weight, var(--%NS%mat-sys-title-large-weight));
  letter-spacing: var(--%NS%mat-toolbar-title-text-tracking, var(--%NS%mat-sys-title-large-tracking));
  margin: 0;
}
@media (forced-colors: active) {
  .mat-toolbar {
    outline: solid 1px;
  }
}
.mat-toolbar .mat-form-field-underline,
.mat-toolbar .mat-form-field-ripple,
.mat-toolbar .mat-focused .mat-form-field-ripple {
  background-color: currentColor;
}
.mat-toolbar .mat-form-field-label,
.mat-toolbar .mat-focused .mat-form-field-label,
.mat-toolbar .mat-select-value,
.mat-toolbar .mat-select-arrow,
.mat-toolbar .mat-form-field.mat-focused .mat-select-arrow {
  color: inherit;
}
.mat-toolbar .mat-input-element {
  caret-color: currentColor;
}
.mat-toolbar .mat-mdc-button-base.mat-mdc-button-base.mat-unthemed {
  --%NS%mat-button-text-label-text-color: var(--%NS%mat-toolbar-container-text-color, var(--%NS%mat-sys-on-surface));
  --%NS%mat-button-outlined-label-text-color: var(--%NS%mat-toolbar-container-text-color, var(--%NS%mat-sys-on-surface));
}

.mat-toolbar-row, .mat-toolbar-single-row {
  display: flex;
  box-sizing: border-box;
  padding: 0 16px;
  width: 100%;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  height: var(--%NS%mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-row, .mat-toolbar-single-row {
    height: var(--%NS%mat-toolbar-mobile-height, 56px);
  }
}

.mat-toolbar-multiple-rows {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  width: 100%;
  min-height: var(--%NS%mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-multiple-rows {
    min-height: var(--%NS%mat-toolbar-mobile-height, 56px);
  }
}
`],encapsulation:2})})()}return t})(),L=(()=>{class t{static ɵfac=function(o){return new(o||t)};static ɵmod=em({type:t});static ɵinj=Ws({imports:[O]})}return t})()});export{L as n,U as r,D as t};