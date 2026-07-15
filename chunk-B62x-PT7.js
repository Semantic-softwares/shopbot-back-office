import {aS as As,A as Av,a5 as qd,aq as lf,av as kv,aw as dc,ax as w}from'./main-PLHEK74B.js';var u=(()=>{class t{get vertical(){return this._vertical}set vertical(i){this._vertical=As(i);}_vertical=false;get inset(){return this._inset}set inset(i){this._inset=As(i);}_inset=false;static \u0275fac=function(e){return new(e||t)};static \u0275cmp=Av({type:t,selectors:[["mat-divider"]],hostAttrs:["role","separator",1,"mat-divider"],hostVars:7,hostBindings:function(e,r){e&2&&(qd("aria-orientation",r.vertical?"vertical":"horizontal"),lf("mat-divider-vertical",r.vertical)("mat-divider-horizontal",!r.vertical)("mat-divider-inset",r.inset));},inputs:{vertical:"vertical",inset:"inset"},decls:0,vars:0,template:function(e,r){},styles:[`.mat-divider {
  display: block;
  margin: 0;
  border-top-style: solid;
  border-top-color: var(--mat-divider-color, var(--mat-sys-outline-variant));
  border-top-width: var(--mat-divider-width, 1px);
}
.mat-divider.mat-divider-vertical {
  border-top: 0;
  border-right-style: solid;
  border-right-color: var(--mat-divider-color, var(--mat-sys-outline-variant));
  border-right-width: var(--mat-divider-width, 1px);
}
.mat-divider.mat-divider-inset {
  margin-left: 80px;
}
[dir=rtl] .mat-divider.mat-divider-inset {
  margin-left: auto;
  margin-right: 80px;
}
`],encapsulation:2})}return t})(),f=(()=>{class t{static \u0275fac=function(e){return new(e||t)};static \u0275mod=kv({type:t});static \u0275inj=dc({imports:[w]})}return t})();export{f,u};