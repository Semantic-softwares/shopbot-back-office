import {b5 as Vs,m as mI,a5 as Xf,aC as Fp,aL as yI,aM as el,aN as w}from'./main-KI5VEYFK.js';var u=(()=>{class t{get vertical(){return this._vertical}set vertical(i){this._vertical=Vs(i);}_vertical=false;get inset(){return this._inset}set inset(i){this._inset=Vs(i);}_inset=false;static \u0275fac=function(e){return new(e||t)};static \u0275cmp=mI({type:t,selectors:[["mat-divider"]],hostAttrs:["role","separator",1,"mat-divider"],hostVars:7,hostBindings:function(e,r){e&2&&(Xf("aria-orientation",r.vertical?"vertical":"horizontal"),Fp("mat-divider-vertical",r.vertical)("mat-divider-horizontal",!r.vertical)("mat-divider-inset",r.inset));},inputs:{vertical:"vertical",inset:"inset"},decls:0,vars:0,template:function(e,r){},styles:[`.mat-divider {
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
`],encapsulation:2})}return t})(),f=(()=>{class t{static \u0275fac=function(e){return new(e||t)};static \u0275mod=yI({type:t});static \u0275inj=el({imports:[w]})}return t})();export{f,u};