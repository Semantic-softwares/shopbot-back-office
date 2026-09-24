import{Cn as kI,Ft as aD,Kn as ql,Mt as Zp,Or as yp,Tr as yD,U as M,Xn as rD,a as $v,en as dp,g as Cp,gr as vc,hn as ho,i as $r,in as fA,j as Ip,jr as zl,lr as th,or as tC,rn as eh,s as AI,sn as fl,v as E,vn as iD,vr as vp,yt as XE}from"./chunk-5XvVQiy2.js";import{C as sn}from"./chunk-C6VwEn-p.js";import{k as mt}from"./chunk-BDr1J6Tf.js";import{t as I$1}from"./chunk--TR0RrN-.js";var I=new M(`mat-progress-spinner-default-options`,{providedIn:`root`,factory:()=>({diameter:R})});var R=100;var D=10;var Z=(()=>{class n{_elementRef=E(ho);_noopAnimations;get color(){return this._color||this._defaultColor}set color(r){this._color=r}_color;_defaultColor=`primary`;_determinateCircle;constructor(){let r=E(I),i=mt(),t=this._elementRef.nativeElement;this._noopAnimations=i===`di-disabled`&&!!r&&!r._forceAnimations,this.mode=t.nodeName.toLowerCase()===`mat-spinner`?`indeterminate`:`determinate`,!this._noopAnimations&&i===`reduced-motion`&&t.classList.add(`mat-progress-spinner-reduced-motion`),r&&(r.color&&(this.color=this._defaultColor=r.color),r.diameter&&(this.diameter=r.diameter),r.strokeWidth&&(this.strokeWidth=r.strokeWidth))}mode;get value(){return this.mode===`determinate`?this._value:0}set value(r){this._value=Math.max(0,Math.min(100,r||0))}_value=0;get diameter(){return this._diameter}set diameter(r){this._diameter=r||0}_diameter=R;get strokeWidth(){return this._strokeWidth??this.diameter/10}set strokeWidth(r){this._strokeWidth=r||0}_strokeWidth;_circleRadius(){return(this.diameter-D)/2}_viewBox(){let r=this._circleRadius()*2+this.strokeWidth;return`0 0 ${r} ${r}`}_strokeCircumference(){return 2*Math.PI*this._circleRadius()}_strokeDashOffset(){return this.mode===`determinate`?this._strokeCircumference()*(100-this._value)/100:null}_circleStrokeWidth(){return this.strokeWidth/this.diameter*100}static ɵfac=function(i){return new(i||n)};static ɵcmp=(function(){let r=[`determinateSpinner`];function i(t,a){if(t&1&&(ql(),$r(0,`svg`,11),Ip(1,`circle`,12),vc()),t&2){let e=XE();vp(`viewBox`,e._viewBox()),$v(),eh(`stroke-dasharray`,e._strokeCircumference(),`px`)(`stroke-dashoffset`,e._strokeCircumference()/2,`px`)(`stroke-width`,e._circleStrokeWidth(),`%`),vp(`r`,e._circleRadius())}}return AI({type:n,selectors:[[`mat-progress-spinner`],[`mat-spinner`]],viewQuery:function(a,e){if(a&1&&Zp(r,5),a&2){let o;rD(o=iD())&&(e._determinateCircle=o.first)}},hostAttrs:[`role`,`progressbar`,`tabindex`,`-1`,1,`mat-mdc-progress-spinner`,`mdc-circular-progress`],hostVars:18,hostBindings:function(a,e){a&2&&(vp(`aria-valuemin`,0)(`aria-valuemax`,100)(`aria-valuenow`,e.mode===`determinate`?e.value:null)(`mode`,e.mode),yD(`mat-`+e.color),eh(`width`,e.diameter,`px`)(`height`,e.diameter,`px`)(`--%NS%mat-progress-spinner-size`,e.diameter+`px`)(`--%NS%mat-progress-spinner-active-indicator-width`,e.diameter+`px`),th(`_mat-animation-noopable`,e._noopAnimations)(`mdc-circular-progress--indeterminate`,e.mode===`indeterminate`))},inputs:{color:`color`,mode:`mode`,value:[2,`value`,`value`,fA],diameter:[2,`diameter`,`diameter`,fA],strokeWidth:[2,`strokeWidth`,`strokeWidth`,fA]},exportAs:[`matProgressSpinner`],decls:14,vars:11,consts:[[`circle`,``],[`determinateSpinner`,``],[`aria-hidden`,`true`,1,`mdc-circular-progress__determinate-container`],[`xmlns`,`http://www.w3.org/2000/svg`,`focusable`,`false`,1,`mdc-circular-progress__determinate-circle-graphic`],[`cx`,`50%`,`cy`,`50%`,1,`mdc-circular-progress__determinate-circle`],[`aria-hidden`,`true`,1,`mdc-circular-progress__indeterminate-container`],[1,`mdc-circular-progress__spinner-layer`],[1,`mdc-circular-progress__circle-clipper`,`mdc-circular-progress__circle-left`],[3,`ngTemplateOutlet`],[1,`mdc-circular-progress__gap-patch`],[1,`mdc-circular-progress__circle-clipper`,`mdc-circular-progress__circle-right`],[`xmlns`,`http://www.w3.org/2000/svg`,`focusable`,`false`,1,`mdc-circular-progress__indeterminate-circle-graphic`],[`cx`,`50%`,`cy`,`50%`]],template:function(a,e){if(a&1&&(dp(0,i,2,8,`ng-template`,null,0,tC),$r(2,`div`,2,1),ql(),$r(4,`svg`,3),Ip(5,`circle`,4),vc()(),zl(),$r(6,`div`,5)(7,`div`,6)(8,`div`,7),Cp(9,8),vc(),$r(10,`div`,9),Cp(11,8),vc(),$r(12,`div`,10),Cp(13,8),vc()()()),a&2){let o=aD(1);$v(4),vp(`viewBox`,e._viewBox()),$v(),eh(`stroke-dasharray`,e._strokeCircumference(),`px`)(`stroke-dashoffset`,e._strokeDashOffset(),`px`)(`stroke-width`,e._circleStrokeWidth(),`%`),vp(`r`,e._circleRadius()),$v(4),yp(`ngTemplateOutlet`,o),$v(2),yp(`ngTemplateOutlet`,o),$v(2),yp(`ngTemplateOutlet`,o)}},dependencies:[sn],styles:[`.mat-mdc-progress-spinner {
  --%NS%mat-progress-spinner-animation-multiplier: 1;
  display: block;
  overflow: hidden;
  line-height: 0;
  position: relative;
  direction: ltr;
  transition: opacity 250ms cubic-bezier(0.4, 0, 0.6, 1);
}
.mat-mdc-progress-spinner circle {
  stroke-width: var(--%NS%mat-progress-spinner-active-indicator-width, 4px);
}
.mat-mdc-progress-spinner._mat-animation-noopable, .mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__determinate-circle {
  transition: none !important;
}
.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-circle-graphic,
.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__spinner-layer,
.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-container {
  animation: none !important;
}
.mat-mdc-progress-spinner._mat-animation-noopable .mdc-circular-progress__indeterminate-container circle {
  stroke-dasharray: 0 !important;
}
@media (forced-colors: active) {
  .mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic,
  .mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle {
    stroke: currentColor;
    stroke: CanvasText;
  }
}

.mat-progress-spinner-reduced-motion {
  --%NS%mat-progress-spinner-animation-multiplier: 1.25;
}

.mdc-circular-progress__determinate-container,
.mdc-circular-progress__indeterminate-circle-graphic,
.mdc-circular-progress__indeterminate-container,
.mdc-circular-progress__spinner-layer {
  position: absolute;
  width: 100%;
  height: 100%;
}

.mdc-circular-progress__determinate-container {
  transform: rotate(-90deg);
}
.mdc-circular-progress--indeterminate .mdc-circular-progress__determinate-container {
  opacity: 0;
}

.mdc-circular-progress__indeterminate-container {
  font-size: 0;
  letter-spacing: 0;
  white-space: nowrap;
  opacity: 0;
}
.mdc-circular-progress--indeterminate .mdc-circular-progress__indeterminate-container {
  opacity: 1;
  animation: mdc-circular-progress-container-rotate calc(1568.2352941176ms * var(--%NS%mat-progress-spinner-animation-multiplier)) linear infinite;
}

.mdc-circular-progress__determinate-circle-graphic,
.mdc-circular-progress__indeterminate-circle-graphic {
  fill: transparent;
}

.mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle,
.mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic {
  stroke: var(--%NS%mat-progress-spinner-active-indicator-color, var(--%NS%mat-sys-primary));
}
@media (forced-colors: active) {
  .mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle,
  .mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic {
    stroke: CanvasText;
  }
}

.mdc-circular-progress__determinate-circle {
  transition: stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);
}

.mdc-circular-progress__gap-patch {
  position: absolute;
  top: 0;
  left: 47.5%;
  box-sizing: border-box;
  width: 5%;
  height: 100%;
  overflow: hidden;
}

.mdc-circular-progress__gap-patch .mdc-circular-progress__indeterminate-circle-graphic {
  left: -900%;
  width: 2000%;
  transform: rotate(180deg);
}
.mdc-circular-progress__circle-clipper .mdc-circular-progress__indeterminate-circle-graphic {
  width: 200%;
}
.mdc-circular-progress__circle-right .mdc-circular-progress__indeterminate-circle-graphic {
  left: -100%;
}
.mdc-circular-progress--indeterminate .mdc-circular-progress__circle-left .mdc-circular-progress__indeterminate-circle-graphic {
  animation: mdc-circular-progress-left-spin calc(1333ms * var(--%NS%mat-progress-spinner-animation-multiplier)) cubic-bezier(0.4, 0, 0.2, 1) infinite both;
}
.mdc-circular-progress--indeterminate .mdc-circular-progress__circle-right .mdc-circular-progress__indeterminate-circle-graphic {
  animation: mdc-circular-progress-right-spin calc(1333ms * var(--%NS%mat-progress-spinner-animation-multiplier)) cubic-bezier(0.4, 0, 0.2, 1) infinite both;
}

.mdc-circular-progress__circle-clipper {
  display: inline-flex;
  position: relative;
  width: 50%;
  height: 100%;
  overflow: hidden;
}

.mdc-circular-progress--indeterminate .mdc-circular-progress__spinner-layer {
  animation: mdc-circular-progress-spinner-layer-rotate calc(5332ms * var(--%NS%mat-progress-spinner-animation-multiplier)) cubic-bezier(0.4, 0, 0.2, 1) infinite both;
}

@keyframes mdc-circular-progress-container-rotate {
  to {
    transform: rotate(360deg);
  }
}
@keyframes mdc-circular-progress-spinner-layer-rotate {
  12.5% {
    transform: rotate(135deg);
  }
  25% {
    transform: rotate(270deg);
  }
  37.5% {
    transform: rotate(405deg);
  }
  50% {
    transform: rotate(540deg);
  }
  62.5% {
    transform: rotate(675deg);
  }
  75% {
    transform: rotate(810deg);
  }
  87.5% {
    transform: rotate(945deg);
  }
  100% {
    transform: rotate(1080deg);
  }
}
@keyframes mdc-circular-progress-left-spin {
  from {
    transform: rotate(265deg);
  }
  50% {
    transform: rotate(130deg);
  }
  to {
    transform: rotate(265deg);
  }
}
@keyframes mdc-circular-progress-right-spin {
  from {
    transform: rotate(-265deg);
  }
  50% {
    transform: rotate(-130deg);
  }
  to {
    transform: rotate(-265deg);
  }
}
`],encapsulation:2})})()}return n})();var J=(()=>{class n{static ɵfac=function(i){return new(i||n)};static ɵmod=kI({type:n});static ɵinj=fl({imports:[I$1]})}return n})();export{Z as n,J as t};