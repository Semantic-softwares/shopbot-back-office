import{H as Un,L as S,et as ee$1,g as Fe,m as Eo,u as D,x as I}from"./chunk-ZG_ciif-.js";import{$t as dm,Cn as kI,Dn as lE,Dt as Yy,E as Gp,Er as yc,G as Mp,Gn as qg,H as Lt,Hn as ph,In as ne$1,Kn as ql,M as Iv,Mt as Zp,On as lh,Or as yp,Ot as Z,Pn as nD,Rt as ai,S as Ep,Tr as yD,U as M,V as Ll,Wt as cA,X as Pe$1,Xn as rD,Xt as da$1,Y as PI,Yt as dA,Z as Pl,Zn as rE,a as $v,cr as te,en as dp,et as Qn,fn as gE,fr as uE,gr as vc,hn as ho,i as $r,it as SD,j as Ip,jr as zl,k as Ic,kn as lp,lr as th,m as Ce,nr as sE,on as fh,ot as Sh,p as Cc,pt as Uo,q as OD,qn as qp,qt as ch,rn as eh,s as AI,sn as fl,sr as tD,t as $D,tt as Qp,v as E,vn as iD,vr as vp,xr as xe,yt as XE}from"./chunk-5XvVQiy2.js";import{a as p,r as T,t as H}from"./chunk-C2ra7W0i.js";import{i as w,n as T$1}from"./chunk-JltcrRJr.js";import{L as xe$1,M as pt$1,O as le,S as Zs,h as Ot,n as Be$1,o as Dt,p as Jt,w as h}from"./chunk-BDr1J6Tf.js";import{n as y,t as I$1}from"./chunk--TR0RrN-.js";import{c as pe}from"./chunk-CDoV_brl.js";import{d as et,h as te$1,l as Yt,m as st$1,n as D$1,p as ot$1,r as Ht,s as W}from"./chunk-Bu_A3-kn.js";import{r as Te}from"./chunk-DYZRRrgF.js";import{a as dt$1,o as jt,t as Lt$1}from"./chunk-CcO9vZmb.js";import{M as d,N as l,m as s,p as f}from"./main-L7MY4SSX.js";import{D as x$1,E as v$1,T as un,b as m,g as ge,x as on,y as h$1}from"./chunk-DZq9hBzd.js";import{i as Jt$1,l as ot$2,s as at}from"./chunk-BzHQjT9s.js";import{t as ee$2}from"./chunk-DU4RrHjo.js";import{t as It}from"./chunk-B5y4KlAE.js";var oe=(()=>{class r{changes=new S;calendarLabel=`Calendar`;openCalendarLabel=`Open calendar`;closeCalendarLabel=`Close calendar`;prevMonthLabel=`Previous month`;nextMonthLabel=`Next month`;prevYearLabel=`Previous year`;nextYearLabel=`Next year`;prevMultiYearLabel=`Previous 24 years`;nextMultiYearLabel=`Next 24 years`;switchToMonthViewLabel=`Choose date`;switchToMultiYearViewLabel=`Choose month and year`;startDateLabel=`Start date`;endDateLabel=`End date`;comparisonDateLabel=`Comparison range`;formatYearRange(e,t){return`${e} \u2013 ${t}`}formatYearRangeLabel(e,t){return`${e} to ${t}`}static ɵfac=function(t){return new(t||r)};static ɵprov=Lt({token:r,factory:r.ɵfac})}return r})();var fa=0;var De=class{value;displayValue;ariaLabel;enabled;compareValue;rawValue;id=fa++;cssClasses;constructor(p,e,t,a,n,i=p,d){this.value=p,this.displayValue=e,this.ariaLabel=t,this.enabled=a,this.compareValue=i,this.rawValue=d,this.cssClasses=n instanceof Set?Array.from(n):n}};var ya={passive:!1,capture:!0};var Be={passive:!0,capture:!0};var ta={passive:!0};var ne=(()=>{class r{_elementRef=E(ho);_ngZone=E(Z);_platform=E(h);_intl=E(oe);_eventCleanups;_skipNextFocus=!1;_focusActiveCellAfterViewChecked=!1;label;rows;todayValue;startValue;endValue;labelMinRequiredCells;numCols=7;activeCell=0;ngAfterViewChecked(){this._focusActiveCellAfterViewChecked&&(this._focusActiveCell(),this._focusActiveCellAfterViewChecked=!1)}isRange=!1;cellAspectRatio=1;comparisonStart=null;comparisonEnd=null;previewStart=null;previewEnd=null;startDateAccessibleName=null;endDateAccessibleName=null;selectedValueChange=new Pe$1;previewChange=new Pe$1;activeDateChange=new Pe$1;dragStarted=new Pe$1;dragEnded=new Pe$1;_firstRowOffset;_cellPadding;_cellWidth;_startDateLabelId;_endDateLabelId;_comparisonStartDateLabelId;_comparisonEndDateLabelId;_didDragSinceMouseDown=!1;_injector=E(ne$1);comparisonDateAccessibleName=this._intl.comparisonDateLabel;_trackRow=e=>e;constructor(){let e=E(da$1),t=E(le);this._startDateLabelId=t.getId(`mat-calendar-body-start-`),this._endDateLabelId=t.getId(`mat-calendar-body-end-`),this._comparisonStartDateLabelId=t.getId(`mat-calendar-body-comparison-start-`),this._comparisonEndDateLabelId=t.getId(`mat-calendar-body-comparison-end-`),E(w).load(Te),this._ngZone.runOutsideAngular(()=>{let a=this._elementRef.nativeElement,n=[e.listen(a,`touchmove`,this._touchmoveHandler,ya),e.listen(a,`mouseenter`,this._enterHandler,Be),e.listen(a,`focus`,this._enterHandler,Be),e.listen(a,`mouseleave`,this._leaveHandler,Be),e.listen(a,`blur`,this._leaveHandler,Be),e.listen(a,`mousedown`,this._mousedownHandler,ta),e.listen(a,`touchstart`,this._mousedownHandler,ta)];this._platform.isBrowser&&n.push(e.listen(`window`,`mouseup`,this._mouseupHandler),e.listen(`window`,`touchend`,this._touchendHandler)),this._eventCleanups=n})}_cellClicked(e,t){this._didDragSinceMouseDown||e.enabled&&this.selectedValueChange.emit({value:e.value,event:t})}_emitActiveDateChange(e,t){e.enabled&&this.activeDateChange.emit({value:e.value,event:t})}_isSelected(e){return this.startValue===e||this.endValue===e}ngOnChanges(e){let t=e.numCols,{rows:a,numCols:n}=this;(e.rows||t)&&(this._firstRowOffset=a&&a.length&&a[0].length?n-a[0].length:0),(e.cellAspectRatio||t||!this._cellPadding)&&(this._cellPadding=`${50*this.cellAspectRatio/n}%`),(t||!this._cellWidth)&&(this._cellWidth=`${100/n}%`)}ngOnDestroy(){this._eventCleanups.forEach(e=>e())}_isActiveCell(e,t){let a=e*this.numCols+t;return e&&(a-=this._firstRowOffset),a==this.activeCell}_focusActiveCell(e=!0){Iv(()=>{setTimeout(()=>{let t=this._elementRef.nativeElement.querySelector(`.mat-calendar-body-active`);t&&(e||(this._skipNextFocus=!0),t.focus())})},{injector:this._injector})}_scheduleFocusActiveCellAfterViewChecked(){this._focusActiveCellAfterViewChecked=!0}_isRangeStart(e){return st(e,this.startValue,this.endValue)}_isRangeEnd(e){return dt(e,this.startValue,this.endValue)}_isInRange(e){return lt(e,this.startValue,this.endValue,this.isRange)}_isComparisonStart(e){return st(e,this.comparisonStart,this.comparisonEnd)}_isComparisonBridgeStart(e,t,a){if(!this._isComparisonStart(e)||this._isRangeStart(e)||!this._isInRange(e))return!1;let n=this.rows[t][a-1];if(!n){let i=this.rows[t-1];n=i&&i[i.length-1]}return n&&!this._isRangeEnd(n.compareValue)}_isComparisonBridgeEnd(e,t,a){if(!this._isComparisonEnd(e)||this._isRangeEnd(e)||!this._isInRange(e))return!1;let n=this.rows[t][a+1];if(!n){let i=this.rows[t+1];n=i&&i[0]}return n&&!this._isRangeStart(n.compareValue)}_isComparisonEnd(e){return dt(e,this.comparisonStart,this.comparisonEnd)}_isInComparisonRange(e){return lt(e,this.comparisonStart,this.comparisonEnd,this.isRange)}_isComparisonIdentical(e){return this.comparisonStart===this.comparisonEnd&&e===this.comparisonStart}_isPreviewStart(e){return st(e,this.previewStart,this.previewEnd)}_isPreviewEnd(e){return dt(e,this.previewStart,this.previewEnd)}_isInPreview(e){return lt(e,this.previewStart,this.previewEnd,this.isRange)}_getDescribedby(e){if(!this.isRange)return null;if(this.startValue===e&&this.endValue===e)return`${this._startDateLabelId} ${this._endDateLabelId}`;if(this.startValue===e)return this._startDateLabelId;if(this.endValue===e)return this._endDateLabelId;if(this.comparisonStart!==null&&this.comparisonEnd!==null){if(e===this.comparisonStart&&e===this.comparisonEnd)return`${this._comparisonStartDateLabelId} ${this._comparisonEndDateLabelId}`;if(e===this.comparisonStart)return this._comparisonStartDateLabelId;if(e===this.comparisonEnd)return this._comparisonEndDateLabelId}return null}_enterHandler=e=>{if(this._skipNextFocus&&e.type===`focus`){this._skipNextFocus=!1;return}if(e.target&&this.isRange){let t=this._getCellFromElement(e.target);t&&this._ngZone.run(()=>this.previewChange.emit({value:t.enabled?t:null,event:e}))}};_touchmoveHandler=e=>{if(!this.isRange)return;let t=aa(e),a=t?this._getCellFromElement(t):null;t!==e.target&&(this._didDragSinceMouseDown=!0),ot(e.target)&&e.preventDefault(),this._ngZone.run(()=>this.previewChange.emit({value:a?.enabled?a:null,event:e}))};_leaveHandler=e=>{this.previewEnd!==null&&this.isRange&&(e.type!==`blur`&&(this._didDragSinceMouseDown=!0),e.target&&this._getCellFromElement(e.target)&&!(e.relatedTarget&&this._getCellFromElement(e.relatedTarget))&&this._ngZone.run(()=>this.previewChange.emit({value:null,event:e})))};_mousedownHandler=e=>{if(!this.isRange)return;this._didDragSinceMouseDown=!1;let t=e.target&&this._getCellFromElement(e.target);!t||!this._isInRange(t.compareValue)||this._ngZone.run(()=>{this.dragStarted.emit({value:t.rawValue,event:e})})};_mouseupHandler=e=>{if(!this.isRange)return;let t=ot(e.target);if(!t){this._ngZone.run(()=>{this.dragEnded.emit({value:null,event:e})});return}t.closest(`.mat-calendar-body`)===this._elementRef.nativeElement&&this._ngZone.run(()=>{let a=this._getCellFromElement(t);this.dragEnded.emit({value:a?.rawValue??null,event:e})})};_touchendHandler=e=>{let t=aa(e);t&&this._mouseupHandler({target:t})};_getCellFromElement(e){let t=ot(e);if(t){let a=t.getAttribute(`data-mat-row`),n=t.getAttribute(`data-mat-col`);if(a&&n)return this.rows[parseInt(a)]?.[parseInt(n)]||null}return null}static ɵfac=function(t){return new(t||r)};static ɵcmp=(function(){function e(o,c){return this._trackRow(c)}let t=(o,c)=>c.id;function a(o,c){if(o&1&&(yc(0,`tr`,0)(1,`td`,3),SD(2),Ic()()),o&2){let s=XE();$v(),eh(`padding-top`,s._cellPadding)(`padding-bottom`,s._cellPadding),vp(`colspan`,s.numCols),$v(),Cc(` `,s.label,` `)}}function n(o,c){if(o&1&&(yc(0,`td`,3),SD(1),Ic()),o&2){let s=XE(2);eh(`padding-top`,s._cellPadding)(`padding-bottom`,s._cellPadding),vp(`colspan`,s._firstRowOffset),$v(),Cc(` `,s._firstRowOffset>=s.labelMinRequiredCells?s.label:``,` `)}}function i(o,c){if(o&1){let s=gE();yc(0,`td`,6)(1,`button`,7),qp(`click`,function(E){let g=Ll(s).$implicit,He=XE(2);return Pl(He._cellClicked(g,E))})(`focus`,function(E){let g=Ll(s).$implicit,He=XE(2);return Pl(He._emitActiveDateChange(g,E))}),yc(2,`span`,8),SD(3),Ic(),Ep(4,`span`,9),Ic()()}if(o&2){let s=c.$implicit,u=c.$index,E=XE().$index,g=XE();eh(`width`,g._cellWidth)(`padding-top`,g._cellPadding)(`padding-bottom`,g._cellPadding),vp(`data-mat-row`,E)(`data-mat-col`,u),$v(),yD(s.cssClasses),th(`mat-calendar-body-disabled`,!s.enabled)(`mat-calendar-body-active`,g._isActiveCell(E,u))(`mat-calendar-body-range-start`,g._isRangeStart(s.compareValue))(`mat-calendar-body-range-end`,g._isRangeEnd(s.compareValue))(`mat-calendar-body-in-range`,g._isInRange(s.compareValue))(`mat-calendar-body-comparison-bridge-start`,g._isComparisonBridgeStart(s.compareValue,E,u))(`mat-calendar-body-comparison-bridge-end`,g._isComparisonBridgeEnd(s.compareValue,E,u))(`mat-calendar-body-comparison-start`,g._isComparisonStart(s.compareValue))(`mat-calendar-body-comparison-end`,g._isComparisonEnd(s.compareValue))(`mat-calendar-body-in-comparison-range`,g._isInComparisonRange(s.compareValue))(`mat-calendar-body-preview-start`,g._isPreviewStart(s.compareValue))(`mat-calendar-body-preview-end`,g._isPreviewEnd(s.compareValue))(`mat-calendar-body-in-preview`,g._isInPreview(s.compareValue)),Mp(`tabIndex`,g._isActiveCell(E,u)?0:-1),vp(`aria-label`,s.ariaLabel)(`aria-disabled`,!s.enabled||null)(`aria-pressed`,g._isSelected(s.compareValue))(`aria-current`,g.todayValue===s.compareValue?`date`:null)(`aria-describedby`,g._getDescribedby(s.compareValue)),$v(),th(`mat-calendar-body-selected`,g._isSelected(s.compareValue))(`mat-calendar-body-comparison-identical`,g._isComparisonIdentical(s.compareValue))(`mat-calendar-body-today`,g.todayValue===s.compareValue),$v(),Cc(` `,s.displayValue,` `)}}function d(o,c){if(o&1&&(yc(0,`tr`,1),rE(1,n,2,6,`td`,4),lE(2,i,5,49,`td`,5,t),Ic()),o&2){let s=c.$implicit,u=c.$index,E=XE();$v(),sE(u===0&&E._firstRowOffset?1:-1),$v(),uE(s)}}return AI({type:r,selectors:[[``,`mat-calendar-body`,``]],hostAttrs:[1,`mat-calendar-body`],inputs:{label:`label`,rows:`rows`,todayValue:`todayValue`,startValue:`startValue`,endValue:`endValue`,labelMinRequiredCells:`labelMinRequiredCells`,numCols:`numCols`,activeCell:`activeCell`,isRange:`isRange`,cellAspectRatio:`cellAspectRatio`,comparisonStart:`comparisonStart`,comparisonEnd:`comparisonEnd`,previewStart:`previewStart`,previewEnd:`previewEnd`,startDateAccessibleName:`startDateAccessibleName`,endDateAccessibleName:`endDateAccessibleName`},outputs:{selectedValueChange:`selectedValueChange`,previewChange:`previewChange`,activeDateChange:`activeDateChange`,dragStarted:`dragStarted`,dragEnded:`dragEnded`},exportAs:[`matCalendarBody`],features:[qg],decls:11,vars:11,consts:[[`aria-hidden`,`true`],[`role`,`row`],[1,`mat-calendar-body-hidden-label`,3,`id`],[1,`mat-calendar-body-label`],[1,`mat-calendar-body-label`,3,`paddingTop`,`paddingBottom`],[`role`,`gridcell`,1,`mat-calendar-body-cell-container`,3,`width`,`paddingTop`,`paddingBottom`],[`role`,`gridcell`,1,`mat-calendar-body-cell-container`],[`type`,`button`,1,`mat-calendar-body-cell`,3,`click`,`focus`,`tabindex`],[1,`mat-calendar-body-cell-content`,`mat-focus-indicator`],[`aria-hidden`,`true`,1,`mat-calendar-body-cell-preview`]],template:function(c,s){c&1&&(rE(0,a,3,6,`tr`,0),lE(1,d,4,1,`tr`,1,e,!0),yc(3,`span`,2),SD(4),Ic(),yc(5,`span`,2),SD(6),Ic(),yc(7,`span`,2),SD(8),Ic(),yc(9,`span`,2),SD(10),Ic()),c&2&&(sE(s._firstRowOffset<s.labelMinRequiredCells?0:-1),$v(),uE(s.rows),$v(2),Mp(`id`,s._startDateLabelId),$v(),Cc(` `,s.startDateAccessibleName,`
`),$v(),Mp(`id`,s._endDateLabelId),$v(),Cc(` `,s.endDateAccessibleName,`
`),$v(),Mp(`id`,s._comparisonStartDateLabelId),$v(),lh(` `,s.comparisonDateAccessibleName,` `,s.startDateAccessibleName,`
`),$v(),Mp(`id`,s._comparisonEndDateLabelId),$v(),lh(` `,s.comparisonDateAccessibleName,` `,s.endDateAccessibleName,`
`))},styles:[`.mat-calendar-body {
  min-width: 224px;
}

.mat-calendar-body-today:not(.mat-calendar-body-selected):not(.mat-calendar-body-comparison-identical) {
  border-color: var(--%NS%mat-datepicker-calendar-date-today-outline-color, var(--%NS%mat-sys-primary));
}

.mat-calendar-body-label {
  height: 0;
  line-height: 0;
  text-align: start;
  padding-left: 4.7142857143%;
  padding-right: 4.7142857143%;
  font-size: var(--%NS%mat-datepicker-calendar-body-label-text-size, var(--%NS%mat-sys-title-small-size));
  font-weight: var(--%NS%mat-datepicker-calendar-body-label-text-weight, var(--%NS%mat-sys-title-small-weight));
  color: var(--%NS%mat-datepicker-calendar-body-label-text-color, var(--%NS%mat-sys-on-surface));
}

.mat-calendar-body-hidden-label {
  display: none;
}

.mat-calendar-body-cell-container {
  position: relative;
  height: 0;
  line-height: 0;
}

.mat-calendar-body-cell {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: none;
  text-align: center;
  outline: none;
  margin: 0;
  font-family: var(--%NS%mat-datepicker-calendar-text-font, var(--%NS%mat-sys-body-medium-font));
  font-size: var(--%NS%mat-datepicker-calendar-text-size, var(--%NS%mat-sys-body-medium-size));
  -webkit-user-select: none;
  user-select: none;
  cursor: pointer;
  outline: none;
  border: none;
  -webkit-tap-highlight-color: transparent;
}
.mat-calendar-body-cell::-moz-focus-inner {
  border: 0;
}

.mat-calendar-body-cell::before,
.mat-calendar-body-cell::after,
.mat-calendar-body-cell-preview {
  content: "";
  position: absolute;
  top: 5%;
  left: 0;
  z-index: 0;
  box-sizing: border-box;
  display: block;
  height: 90%;
  width: 100%;
}

.mat-calendar-body-range-start:not(.mat-calendar-body-in-comparison-range)::before,
.mat-calendar-body-range-start::after,
.mat-calendar-body-comparison-start:not(.mat-calendar-body-comparison-bridge-start)::before,
.mat-calendar-body-comparison-start::after,
.mat-calendar-body-preview-start .mat-calendar-body-cell-preview {
  left: 5%;
  width: 95%;
  border-top-left-radius: 999px;
  border-bottom-left-radius: 999px;
}
[dir=rtl] .mat-calendar-body-range-start:not(.mat-calendar-body-in-comparison-range)::before,
[dir=rtl] .mat-calendar-body-range-start::after,
[dir=rtl] .mat-calendar-body-comparison-start:not(.mat-calendar-body-comparison-bridge-start)::before,
[dir=rtl] .mat-calendar-body-comparison-start::after,
[dir=rtl] .mat-calendar-body-preview-start .mat-calendar-body-cell-preview {
  left: 0;
  border-radius: 0;
  border-top-right-radius: 999px;
  border-bottom-right-radius: 999px;
}

.mat-calendar-body-range-end:not(.mat-calendar-body-in-comparison-range)::before,
.mat-calendar-body-range-end::after,
.mat-calendar-body-comparison-end:not(.mat-calendar-body-comparison-bridge-end)::before,
.mat-calendar-body-comparison-end::after,
.mat-calendar-body-preview-end .mat-calendar-body-cell-preview {
  width: 95%;
  border-top-right-radius: 999px;
  border-bottom-right-radius: 999px;
}
[dir=rtl] .mat-calendar-body-range-end:not(.mat-calendar-body-in-comparison-range)::before,
[dir=rtl] .mat-calendar-body-range-end::after,
[dir=rtl] .mat-calendar-body-comparison-end:not(.mat-calendar-body-comparison-bridge-end)::before,
[dir=rtl] .mat-calendar-body-comparison-end::after,
[dir=rtl] .mat-calendar-body-preview-end .mat-calendar-body-cell-preview {
  left: 5%;
  border-radius: 0;
  border-top-left-radius: 999px;
  border-bottom-left-radius: 999px;
}

[dir=rtl] .mat-calendar-body-comparison-bridge-start.mat-calendar-body-range-end::after,
[dir=rtl] .mat-calendar-body-comparison-bridge-end.mat-calendar-body-range-start::after {
  width: 95%;
  border-top-right-radius: 999px;
  border-bottom-right-radius: 999px;
}

.mat-calendar-body-comparison-start.mat-calendar-body-range-end::after, [dir=rtl] .mat-calendar-body-comparison-start.mat-calendar-body-range-end::after,
.mat-calendar-body-comparison-end.mat-calendar-body-range-start::after,
[dir=rtl] .mat-calendar-body-comparison-end.mat-calendar-body-range-start::after {
  width: 90%;
}

.mat-calendar-body-in-preview {
  color: var(--%NS%mat-datepicker-calendar-date-preview-state-outline-color, var(--%NS%mat-sys-primary));
}
.mat-calendar-body-in-preview .mat-calendar-body-cell-preview {
  border-top: dashed 1px;
  border-bottom: dashed 1px;
}

.mat-calendar-body-preview-start .mat-calendar-body-cell-preview {
  border-left: dashed 1px;
}
[dir=rtl] .mat-calendar-body-preview-start .mat-calendar-body-cell-preview {
  border-left: 0;
  border-right: dashed 1px;
}

.mat-calendar-body-preview-end .mat-calendar-body-cell-preview {
  border-right: dashed 1px;
}
[dir=rtl] .mat-calendar-body-preview-end .mat-calendar-body-cell-preview {
  border-right: 0;
  border-left: dashed 1px;
}

.mat-calendar-body-disabled {
  cursor: default;
}
.mat-calendar-body-disabled > .mat-calendar-body-cell-content:not(.mat-calendar-body-selected):not(.mat-calendar-body-comparison-identical) {
  color: var(--%NS%mat-datepicker-calendar-date-disabled-state-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-calendar-body-disabled > .mat-calendar-body-today:not(.mat-calendar-body-selected):not(.mat-calendar-body-comparison-identical) {
  border-color: var(--%NS%mat-datepicker-calendar-date-today-disabled-state-outline-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
@media (forced-colors: active) {
  .mat-calendar-body-disabled {
    opacity: 0.5;
  }
}

.mat-calendar-body-cell-content {
  top: 5%;
  left: 5%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 90%;
  height: 90%;
  line-height: 1;
  border-width: 1px;
  border-style: solid;
  border-radius: 999px;
  color: var(--%NS%mat-datepicker-calendar-date-text-color, var(--%NS%mat-sys-on-surface));
  border-color: var(--%NS%mat-datepicker-calendar-date-outline-color, transparent);
}
.mat-calendar-body-cell-content.mat-focus-indicator {
  position: absolute;
}
.mat-calendar-body-cell-content::before {
  border-radius: 50%;
}
@media (forced-colors: active) {
  .mat-calendar-body-cell-content {
    border: none;
  }
}

.cdk-keyboard-focused .mat-calendar-body-active > .mat-calendar-body-cell-content:not(.mat-calendar-body-selected):not(.mat-calendar-body-comparison-identical), .cdk-program-focused .mat-calendar-body-active > .mat-calendar-body-cell-content:not(.mat-calendar-body-selected):not(.mat-calendar-body-comparison-identical) {
  background-color: var(--%NS%mat-datepicker-calendar-date-focus-state-background-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-focus-state-layer-opacity) * 100%), transparent));
}

@media (hover: hover) {
  .mat-calendar-body-cell:not(.mat-calendar-body-disabled):hover > .mat-calendar-body-cell-content:not(.mat-calendar-body-selected):not(.mat-calendar-body-comparison-identical) {
    background-color: var(--%NS%mat-datepicker-calendar-date-hover-state-background-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) calc(var(--%NS%mat-sys-hover-state-layer-opacity) * 100%), transparent));
  }
}
.mat-calendar-body-selected {
  background-color: var(--%NS%mat-datepicker-calendar-date-selected-state-background-color, var(--%NS%mat-sys-primary));
  color: var(--%NS%mat-datepicker-calendar-date-selected-state-text-color, var(--%NS%mat-sys-on-primary));
}
.mat-calendar-body-disabled > .mat-calendar-body-selected {
  background-color: var(--%NS%mat-datepicker-calendar-date-selected-disabled-state-background-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-calendar-body-selected.mat-calendar-body-today {
  box-shadow: inset 0 0 0 1px var(--%NS%mat-datepicker-calendar-date-today-selected-state-outline-color, var(--%NS%mat-sys-primary));
}

.mat-calendar-body-in-range::before {
  background: var(--%NS%mat-datepicker-calendar-date-in-range-state-background-color, var(--%NS%mat-sys-primary-container));
}

.mat-calendar-body-comparison-identical,
.mat-calendar-body-in-comparison-range::before {
  background: var(--%NS%mat-datepicker-calendar-date-in-comparison-range-state-background-color, var(--%NS%mat-sys-tertiary-container));
}

.mat-calendar-body-comparison-identical,
.mat-calendar-body-in-comparison-range::before {
  background: var(--%NS%mat-datepicker-calendar-date-in-comparison-range-state-background-color, var(--%NS%mat-sys-tertiary-container));
}

.mat-calendar-body-comparison-bridge-start::before,
[dir=rtl] .mat-calendar-body-comparison-bridge-end::before {
  background: linear-gradient(to right, var(--%NS%mat-datepicker-calendar-date-in-range-state-background-color, var(--%NS%mat-sys-primary-container)) 50%, var(--%NS%mat-datepicker-calendar-date-in-comparison-range-state-background-color, var(--%NS%mat-sys-tertiary-container)) 50%);
}

.mat-calendar-body-comparison-bridge-end::before,
[dir=rtl] .mat-calendar-body-comparison-bridge-start::before {
  background: linear-gradient(to left, var(--%NS%mat-datepicker-calendar-date-in-range-state-background-color, var(--%NS%mat-sys-primary-container)) 50%, var(--%NS%mat-datepicker-calendar-date-in-comparison-range-state-background-color, var(--%NS%mat-sys-tertiary-container)) 50%);
}

.mat-calendar-body-in-range > .mat-calendar-body-comparison-identical,
.mat-calendar-body-in-comparison-range.mat-calendar-body-in-range::after {
  background: var(--%NS%mat-datepicker-calendar-date-in-overlap-range-state-background-color, var(--%NS%mat-sys-secondary-container));
}

.mat-calendar-body-comparison-identical.mat-calendar-body-selected,
.mat-calendar-body-in-comparison-range > .mat-calendar-body-selected {
  background: var(--%NS%mat-datepicker-calendar-date-in-overlap-range-selected-state-background-color, var(--%NS%mat-sys-secondary));
}

@media (forced-colors: active) {
  .mat-datepicker-popup:not(:empty),
  .mat-calendar-body-cell:not(.mat-calendar-body-in-range) .mat-calendar-body-selected {
    outline: solid 1px;
  }
  .mat-calendar-body-today {
    outline: dotted 1px;
  }
  .mat-calendar-body-cell::before,
  .mat-calendar-body-cell::after,
  .mat-calendar-body-selected {
    background: none;
  }
  .mat-calendar-body-in-range::before,
  .mat-calendar-body-comparison-bridge-start::before,
  .mat-calendar-body-comparison-bridge-end::before {
    border-top: solid 1px;
    border-bottom: solid 1px;
  }
  .mat-calendar-body-range-start::before {
    border-left: solid 1px;
  }
  [dir=rtl] .mat-calendar-body-range-start::before {
    border-left: 0;
    border-right: solid 1px;
  }
  .mat-calendar-body-range-end::before {
    border-right: solid 1px;
  }
  [dir=rtl] .mat-calendar-body-range-end::before {
    border-right: 0;
    border-left: solid 1px;
  }
  .mat-calendar-body-in-comparison-range::before {
    border-top: dashed 1px;
    border-bottom: dashed 1px;
  }
  .mat-calendar-body-comparison-start::before {
    border-left: dashed 1px;
  }
  [dir=rtl] .mat-calendar-body-comparison-start::before {
    border-left: 0;
    border-right: dashed 1px;
  }
  .mat-calendar-body-comparison-end::before {
    border-right: dashed 1px;
  }
  [dir=rtl] .mat-calendar-body-comparison-end::before {
    border-right: 0;
    border-left: dashed 1px;
  }
}
`],encapsulation:2})})()}return r})();function it(r){return r?.nodeName===`TD`}function ot(r){let p;return it(r)?p=r:it(r.parentNode)?p=r.parentNode:it(r.parentNode?.parentNode)&&(p=r.parentNode.parentNode),p?.getAttribute(`data-mat-row`)!=null?p:null}function st(r,p,e){return e!==null&&p!==e&&r<e&&r===p}function dt(r,p,e){return p!==null&&p!==e&&r>=p&&r===e}function lt(r,p,e,t){return t&&p!==null&&e!==null&&p!==e&&r>=p&&r<=e}function aa(r){let p=r.changedTouches[0];return document.elementFromPoint(p.clientX,p.clientY)}var v=class{start;end;_disableStructuralEquivalency;constructor(p,e){this.start=p,this.end=e}};var q=(()=>{class r{selection;_adapter;_selectionChanged=new S;selectionChanged=this._selectionChanged;constructor(e,t){this.selection=e,this._adapter=t,this.selection=e}updateSelection(e,t){let a=this.selection;this.selection=e,this._selectionChanged.next({selection:e,source:t,oldValue:a})}ngOnDestroy(){this._selectionChanged.complete()}_isValidDateInstance(e){return this._adapter.isDateInstance(e)&&this._adapter.isValid(e)}static ɵfac=function(t){Yy()};static ɵprov=te({token:r,factory:r.ɵfac})}return r})();var va=(()=>{class r extends q{constructor(e){super(null,e)}add(e){super.updateSelection(e,this)}isValid(){return this.selection!=null&&this._isValidDateInstance(this.selection)}isComplete(){return this.selection!=null}clone(){let e=new r(this._adapter);return e.updateSelection(this.selection,this),e}static ɵfac=function(t){return new(t||r)(Ce(l))};static ɵprov=te({token:r,factory:r.ɵfac})}return r})();var Da=(()=>{class r extends q{constructor(e){super(new v(null,null),e)}add(e){let{start:t,end:a}=this.selection;t==null?t=e:a==null?a=e:(t=e,a=null),super.updateSelection(new v(t,a),this)}isValid(){let{start:e,end:t}=this.selection;return e==null&&t==null?!0:e!=null&&t!=null?this._isValidDateInstance(e)&&this._isValidDateInstance(t)&&this._adapter.compareDate(e,t)<=0:(e==null||this._isValidDateInstance(e))&&(t==null||this._isValidDateInstance(t))}isComplete(){return this.selection.start!=null&&this.selection.end!=null}clone(){let e=new r(this._adapter);return e.updateSelection(this.selection,this),e}static ɵfac=function(t){return new(t||r)(Ce(l))};static ɵprov=te({token:r,factory:r.ɵfac})}return r})();var da={provide:q,useFactory:()=>E(q,{optional:!0,skipSelf:!0})||new va(E(l))};var Ca={provide:q,useFactory:()=>E(q,{optional:!0,skipSelf:!0})||new Da(E(l))};var Pe=new M(`MAT_DATE_RANGE_SELECTION_STRATEGY`);var wa=(()=>{class r{_dateAdapter;constructor(e){this._dateAdapter=e}selectionFinished(e,t){let{start:a,end:n}=t;return a==null?a=e:n==null&&e&&this._dateAdapter.compareDate(e,a)>=0?n=e:(a=e,n=null),new v(a,n)}createPreview(e,t){let a=null,n=null;return t.start&&!t.end&&e&&(a=t.start,n=e),new v(a,n)}createDrag(e,t,a){let n=t.start,i=t.end;if(!n||!i)return null;let d=this._dateAdapter,o=d.compareDate(n,i)!==0,c=d.getYear(a)-d.getYear(e),s=d.getMonth(a)-d.getMonth(e),u=d.getDate(a)-d.getDate(e);return o&&d.sameDate(e,t.start)?(n=a,d.compareDate(a,i)>0&&(i=d.addCalendarYears(i,c),i=d.addCalendarMonths(i,s),i=d.addCalendarDays(i,u))):o&&d.sameDate(e,t.end)?(i=a,d.compareDate(a,n)<0&&(n=d.addCalendarYears(n,c),n=d.addCalendarMonths(n,s),n=d.addCalendarDays(n,u))):(n=d.addCalendarYears(n,c),n=d.addCalendarMonths(n,s),n=d.addCalendarDays(n,u),i=d.addCalendarYears(i,c),i=d.addCalendarMonths(i,s),i=d.addCalendarDays(i,u)),new v(n,i)}static ɵfac=function(t){return new(t||r)(Ce(l))};static ɵprov=te({token:r,factory:r.ɵfac})}return r})();var ct=7;var ka=0;var na=(()=>{class r{_changeDetectorRef=E(cA);_dateFormats=E(d,{optional:!0});_dateAdapter=E(l,{optional:!0});_dir=E(y,{optional:!0});_rangeStrategy=E(Pe,{optional:!0});_rerenderSubscription=I.EMPTY;_selectionKeyPressed=!1;get activeDate(){return this._activeDate}set activeDate(e){let t=this._activeDate,a=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))||this._dateAdapter.today();this._activeDate=this._dateAdapter.clampDate(a,this.minDate,this.maxDate),this._hasSameMonthAndYear(t,this._activeDate)||this._init()}_activeDate;get selected(){return this._selected}set selected(e){e instanceof v?this._selected=e:this._selected=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e)),this._setRanges(this._selected)}_selected=null;get minDate(){return this._minDate}set minDate(e){this._minDate=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_minDate=null;get maxDate(){return this._maxDate}set maxDate(e){this._maxDate=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_maxDate=null;dateFilter;dateClass;comparisonStart=null;comparisonEnd=null;startDateAccessibleName=null;endDateAccessibleName=null;activeDrag=null;selectedChange=new Pe$1;_userSelection=new Pe$1;dragStarted=new Pe$1;dragEnded=new Pe$1;activeDateChange=new Pe$1;_matCalendarBody;_monthLabel=xe(``);_weeks=xe([]);_firstWeekOffset=xe(0);_rangeStart=xe(null);_rangeEnd=xe(null);_comparisonRangeStart=xe(null);_comparisonRangeEnd=xe(null);_previewStart=xe(null);_previewEnd=xe(null);_isRange=xe(!1);_todayDate=xe(null);_weekdays=xe([]);constructor(){E(w).load(T$1),this._activeDate=this._dateAdapter.today()}ngAfterContentInit(){this._rerenderSubscription=this._dateAdapter.localeChanges.pipe(Un(null)).subscribe(()=>this._init())}ngOnChanges(e){let t=e.comparisonStart||e.comparisonEnd;t&&!t.firstChange&&this._setRanges(this.selected),e.activeDrag&&!this.activeDrag&&this._clearPreview()}ngOnDestroy(){this._rerenderSubscription.unsubscribe()}_dateSelected(e){let t=e.value,a=this._getDateFromDayOfMonth(t),n,i;this._selected instanceof v?(n=this._getDateInCurrentMonth(this._selected.start),i=this._getDateInCurrentMonth(this._selected.end)):n=i=this._getDateInCurrentMonth(this._selected),(n!==t||i!==t)&&this.selectedChange.emit(a),this._userSelection.emit({value:a,event:e.event}),this._clearPreview(),this._changeDetectorRef.markForCheck()}_updateActiveDate(e){let t=e.value,a=this._activeDate;this.activeDate=this._getDateFromDayOfMonth(t),this._dateAdapter.compareDate(a,this.activeDate)&&this.activeDateChange.emit(this._activeDate)}_handleCalendarBodyKeydown(e){let t=this._activeDate,a=this._isRtl();switch(e.keyCode){case 37:this.activeDate=this._dateAdapter.addCalendarDays(this._activeDate,a?1:-1);break;case 39:this.activeDate=this._dateAdapter.addCalendarDays(this._activeDate,a?-1:1);break;case 38:this.activeDate=this._dateAdapter.addCalendarDays(this._activeDate,-7);break;case 40:this.activeDate=this._dateAdapter.addCalendarDays(this._activeDate,7);break;case 36:this.activeDate=this._dateAdapter.addCalendarDays(this._activeDate,1-this._dateAdapter.getDate(this._activeDate));break;case 35:this.activeDate=this._dateAdapter.addCalendarDays(this._activeDate,this._dateAdapter.getNumDaysInMonth(this._activeDate)-this._dateAdapter.getDate(this._activeDate));break;case 33:this.activeDate=e.altKey?this._dateAdapter.addCalendarYears(this._activeDate,-1):this._dateAdapter.addCalendarMonths(this._activeDate,-1);break;case 34:this.activeDate=e.altKey?this._dateAdapter.addCalendarYears(this._activeDate,1):this._dateAdapter.addCalendarMonths(this._activeDate,1);break;case 13:case 32:this._selectionKeyPressed=!0,this._canSelect(this._activeDate)&&e.preventDefault();return;case 27:this._previewEnd()!=null&&!xe$1(e)&&(this._clearPreview(),this.activeDrag?this.dragEnded.emit({value:null,event:e}):(this.selectedChange.emit(null),this._userSelection.emit({value:null,event:e})),e.preventDefault(),e.stopPropagation());return;default:return}this._dateAdapter.compareDate(t,this.activeDate)&&(this.activeDateChange.emit(this.activeDate),this._focusActiveCellAfterViewChecked()),e.preventDefault()}_handleCalendarBodyKeyup(e){(e.keyCode===32||e.keyCode===13)&&(this._selectionKeyPressed&&this._canSelect(this._activeDate)&&this._dateSelected({value:this._dateAdapter.getDate(this._activeDate),event:e}),this._selectionKeyPressed=!1)}_init(){this._setRanges(this.selected),this._todayDate.set(this._getCellCompareValue(this._dateAdapter.today())),this._monthLabel.set(this._dateFormats.display.monthLabel?this._dateAdapter.format(this.activeDate,this._dateFormats.display.monthLabel):this._dateAdapter.getMonthNames(`short`)[this._dateAdapter.getMonth(this.activeDate)].toLocaleUpperCase());let e=this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate),this._dateAdapter.getMonth(this.activeDate),1);this._firstWeekOffset.set((ct+this._dateAdapter.getDayOfWeek(e)-this._dateAdapter.getFirstDayOfWeek())%ct),this._initWeekdays(),this._createWeekCells(),this._changeDetectorRef.markForCheck()}_focusActiveCell(e){this._matCalendarBody._focusActiveCell(e)}_focusActiveCellAfterViewChecked(){this._matCalendarBody._scheduleFocusActiveCellAfterViewChecked()}_previewChanged({event:e,value:t}){if(this._rangeStrategy){let a=t?t.rawValue:null,n=this._rangeStrategy.createPreview(a,this.selected,e);if(this._previewStart.set(this._getCellCompareValue(n.start)),this._previewEnd.set(this._getCellCompareValue(n.end)),this.activeDrag&&a){let i=this._rangeStrategy.createDrag?.(this.activeDrag.value,this.selected,a,e);i&&(this._previewStart.set(this._getCellCompareValue(i.start)),this._previewEnd.set(this._getCellCompareValue(i.end)))}}}_dragEnded(e){if(this.activeDrag)if(e.value){let t=this._rangeStrategy?.createDrag?.(this.activeDrag.value,this.selected,e.value,e.event);this.dragEnded.emit({value:t??null,event:e.event})}else this.dragEnded.emit({value:null,event:e.event})}_getDateFromDayOfMonth(e){return this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate),this._dateAdapter.getMonth(this.activeDate),e)}_initWeekdays(){let e=this._dateAdapter.getFirstDayOfWeek(),t=this._dateAdapter.getDayOfWeekNames(`narrow`),n=this._dateAdapter.getDayOfWeekNames(`long`).map((i,d)=>({long:i,narrow:t[d],id:ka++}));this._weekdays.set(n.slice(e).concat(n.slice(0,e)))}_createWeekCells(){let e=this._dateAdapter.getNumDaysInMonth(this.activeDate),t=this._dateAdapter.getDateNames(),a=[[]];for(let n=0,i=this._firstWeekOffset();n<e;n++,i++){i==ct&&(a.push([]),i=0);let d=this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate),this._dateAdapter.getMonth(this.activeDate),n+1),o=this._shouldEnableDate(d),c=this._dateAdapter.format(d,this._dateFormats.display.dateA11yLabel),s=this.dateClass?this.dateClass(d,`month`):void 0;a[a.length-1].push(new De(n+1,t[n],c,o,s,this._getCellCompareValue(d),d))}this._weeks.set(a)}_shouldEnableDate(e){return!!e&&(!this.minDate||this._dateAdapter.compareDate(e,this.minDate)>=0)&&(!this.maxDate||this._dateAdapter.compareDate(e,this.maxDate)<=0)&&(!this.dateFilter||this.dateFilter(e))}_getDateInCurrentMonth(e){return e&&this._hasSameMonthAndYear(e,this.activeDate)?this._dateAdapter.getDate(e):null}_hasSameMonthAndYear(e,t){return!!(e&&t&&this._dateAdapter.getMonth(e)==this._dateAdapter.getMonth(t)&&this._dateAdapter.getYear(e)==this._dateAdapter.getYear(t))}_getCellCompareValue(e){if(e){let t=this._dateAdapter.getYear(e),a=this._dateAdapter.getMonth(e),n=this._dateAdapter.getDate(e);return new Date(t,a,n).getTime()}return null}_isRtl(){return this._dir&&this._dir.value===`rtl`}_setRanges(e){e instanceof v?(this._rangeStart.set(this._getCellCompareValue(e.start)),this._rangeEnd.set(this._getCellCompareValue(e.end)),this._isRange.set(!0)):(this._rangeStart.set(this._getCellCompareValue(e)),this._rangeEnd.set(this._rangeStart()),this._isRange.set(!1)),this._comparisonRangeStart.set(this._getCellCompareValue(this.comparisonStart)),this._comparisonRangeEnd.set(this._getCellCompareValue(this.comparisonEnd))}_canSelect(e){return!this.dateFilter||this.dateFilter(e)}_clearPreview(){this._previewStart.set(null),this._previewEnd.set(null)}static ɵfac=function(t){return new(t||r)};static ɵcmp=(function(){let e=(a,n)=>n.id;function t(a,n){if(a&1&&($r(0,`th`,2)(1,`span`,6),SD(2),vc(),$r(3,`span`,3),SD(4),vc()()),a&2){let i=n.$implicit;$v(2),ch(i.long),$v(2),ch(i.narrow)}}return AI({type:r,selectors:[[`mat-month-view`]],viewQuery:function(n,i){if(n&1&&Zp(ne,5),n&2){let d;rD(d=iD())&&(i._matCalendarBody=d.first)}},inputs:{activeDate:`activeDate`,selected:`selected`,minDate:`minDate`,maxDate:`maxDate`,dateFilter:`dateFilter`,dateClass:`dateClass`,comparisonStart:`comparisonStart`,comparisonEnd:`comparisonEnd`,startDateAccessibleName:`startDateAccessibleName`,endDateAccessibleName:`endDateAccessibleName`,activeDrag:`activeDrag`},outputs:{selectedChange:`selectedChange`,_userSelection:`_userSelection`,dragStarted:`dragStarted`,dragEnded:`dragEnded`,activeDateChange:`activeDateChange`},exportAs:[`matMonthView`],features:[qg],decls:8,vars:14,consts:[[`role`,`grid`,1,`mat-calendar-table`],[1,`mat-calendar-table-header`],[`scope`,`col`],[`aria-hidden`,`true`],[`colspan`,`7`,1,`mat-calendar-table-header-divider`],[`mat-calendar-body`,``,3,`selectedValueChange`,`activeDateChange`,`previewChange`,`dragStarted`,`dragEnded`,`keyup`,`keydown`,`label`,`rows`,`todayValue`,`startValue`,`endValue`,`comparisonStart`,`comparisonEnd`,`previewStart`,`previewEnd`,`isRange`,`labelMinRequiredCells`,`activeCell`,`startDateAccessibleName`,`endDateAccessibleName`],[1,`cdk-visually-hidden`]],template:function(n,i){n&1&&($r(0,`table`,0)(1,`thead`,1)(2,`tr`),lE(3,t,5,2,`th`,2,e),vc(),$r(5,`tr`,3),Ip(6,`th`,4),vc()(),$r(7,`tbody`,5),Gp(`selectedValueChange`,function(o){return i._dateSelected(o)})(`activeDateChange`,function(o){return i._updateActiveDate(o)})(`previewChange`,function(o){return i._previewChanged(o)})(`dragStarted`,function(o){return i.dragStarted.emit(o)})(`dragEnded`,function(o){return i._dragEnded(o)})(`keyup`,function(o){return i._handleCalendarBodyKeyup(o)})(`keydown`,function(o){return i._handleCalendarBodyKeydown(o)}),vc()()),n&2&&($v(3),uE(i._weekdays()),$v(4),yp(`label`,i._monthLabel())(`rows`,i._weeks())(`todayValue`,i._todayDate())(`startValue`,i._rangeStart())(`endValue`,i._rangeEnd())(`comparisonStart`,i._comparisonRangeStart())(`comparisonEnd`,i._comparisonRangeEnd())(`previewStart`,i._previewStart())(`previewEnd`,i._previewEnd())(`isRange`,i._isRange())(`labelMinRequiredCells`,3)(`activeCell`,i._dateAdapter.getDate(i.activeDate)-1)(`startDateAccessibleName`,i.startDateAccessibleName)(`endDateAccessibleName`,i.endDateAccessibleName))},dependencies:[ne],encapsulation:2})})()}return r})();var x=24;var pt=4;var ra=(()=>{class r{_changeDetectorRef=E(cA);_dateAdapter=E(l,{optional:!0});_dir=E(y,{optional:!0});_rerenderSubscription=I.EMPTY;_selectionKeyPressed=!1;get activeDate(){return this._activeDate}set activeDate(e){let t=this._activeDate,a=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))||this._dateAdapter.today();this._activeDate=this._dateAdapter.clampDate(a,this.minDate,this.maxDate),la(this._dateAdapter,t,this._activeDate,this.minDate,this.maxDate)||this._init()}_activeDate;get selected(){return this._selected}set selected(e){e instanceof v?this._selected=e:this._selected=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e)),this._setSelectedYear(e)}_selected=null;get minDate(){return this._minDate}set minDate(e){this._minDate=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_minDate=null;get maxDate(){return this._maxDate}set maxDate(e){this._maxDate=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_maxDate=null;dateFilter;dateClass;selectedChange=new Pe$1;yearSelected=new Pe$1;activeDateChange=new Pe$1;_matCalendarBody;_years=xe([]);_todayYear=xe(0);_selectedYear=xe(null);constructor(){this._dateAdapter,this._activeDate=this._dateAdapter.today()}ngAfterContentInit(){this._rerenderSubscription=this._dateAdapter.localeChanges.pipe(Un(null)).subscribe(()=>this._init())}ngOnDestroy(){this._rerenderSubscription.unsubscribe()}_init(){this._todayYear.set(this._dateAdapter.getYear(this._dateAdapter.today()));let t=this._dateAdapter.getYear(this._activeDate)-ye(this._dateAdapter,this.activeDate,this.minDate,this.maxDate),a=[];for(let n=0,i=[];n<x;n++)i.push(t+n),i.length==pt&&(a.push(i.map(d=>this._createCellForYear(d))),i=[]);this._years.set(a),this._changeDetectorRef.markForCheck()}_yearSelected(e){let t=e.value,a=this._dateAdapter.createDate(t,0,1),n=this._getDateFromYear(t);this.yearSelected.emit(a),this.selectedChange.emit(n)}_updateActiveDate(e){let t=e.value,a=this._activeDate;this.activeDate=this._getDateFromYear(t),this._dateAdapter.compareDate(a,this.activeDate)&&this.activeDateChange.emit(this.activeDate)}_handleCalendarBodyKeydown(e){let t=this._activeDate,a=this._isRtl();switch(e.keyCode){case 37:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,a?1:-1);break;case 39:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,a?-1:1);break;case 38:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,-pt);break;case 40:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,pt);break;case 36:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,-ye(this._dateAdapter,this.activeDate,this.minDate,this.maxDate));break;case 35:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,x-ye(this._dateAdapter,this.activeDate,this.minDate,this.maxDate)-1);break;case 33:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,e.altKey?-x*10:-x);break;case 34:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,e.altKey?x*10:x);break;case 13:case 32:this._selectionKeyPressed=!0;break;default:return}this._dateAdapter.compareDate(t,this.activeDate)&&this.activeDateChange.emit(this.activeDate),this._focusActiveCellAfterViewChecked(),e.preventDefault()}_handleCalendarBodyKeyup(e){(e.keyCode===32||e.keyCode===13)&&(this._selectionKeyPressed&&this._yearSelected({value:this._dateAdapter.getYear(this._activeDate),event:e}),this._selectionKeyPressed=!1)}_getActiveCell(){return ye(this._dateAdapter,this.activeDate,this.minDate,this.maxDate)}_focusActiveCell(){this._matCalendarBody._focusActiveCell()}_focusActiveCellAfterViewChecked(){this._matCalendarBody._scheduleFocusActiveCellAfterViewChecked()}_getDateFromYear(e){let t=this._dateAdapter.getMonth(this.activeDate),a=this._dateAdapter.getNumDaysInMonth(this._dateAdapter.createDate(e,t,1));return this._dateAdapter.createDate(e,t,Math.min(this._dateAdapter.getDate(this.activeDate),a))}_createCellForYear(e){let t=this._dateAdapter.createDate(e,0,1),a=this._dateAdapter.getYearName(t),n=this.dateClass?this.dateClass(t,`multi-year`):void 0;return new De(e,a,a,this._shouldEnableYear(e),n)}_shouldEnableYear(e){if(e==null||this.maxDate&&e>this._dateAdapter.getYear(this.maxDate)||this.minDate&&e<this._dateAdapter.getYear(this.minDate))return!1;if(!this.dateFilter)return!0;let t=this._dateAdapter.createDate(e,0,1);for(let a=t;this._dateAdapter.getYear(a)==e;a=this._dateAdapter.addCalendarDays(a,1))if(this.dateFilter(a))return!0;return!1}_isRtl(){return this._dir&&this._dir.value===`rtl`}_setSelectedYear(e){if(this._selectedYear.set(null),e instanceof v){let t=e.start||e.end;t&&this._selectedYear.set(this._dateAdapter.getYear(t))}else e&&this._selectedYear.set(this._dateAdapter.getYear(e))}static ɵfac=function(t){return new(t||r)};static ɵcmp=AI({type:r,selectors:[[`mat-multi-year-view`]],viewQuery:function(t,a){if(t&1&&Zp(ne,5),t&2){let n;rD(n=iD())&&(a._matCalendarBody=n.first)}},inputs:{activeDate:`activeDate`,selected:`selected`,minDate:`minDate`,maxDate:`maxDate`,dateFilter:`dateFilter`,dateClass:`dateClass`},outputs:{selectedChange:`selectedChange`,yearSelected:`yearSelected`,activeDateChange:`activeDateChange`},exportAs:[`matMultiYearView`],decls:5,vars:7,consts:[[`role`,`grid`,1,`mat-calendar-table`],[`aria-hidden`,`true`,1,`mat-calendar-table-header`],[`colspan`,`4`,1,`mat-calendar-table-header-divider`],[`mat-calendar-body`,``,3,`selectedValueChange`,`activeDateChange`,`keyup`,`keydown`,`rows`,`todayValue`,`startValue`,`endValue`,`numCols`,`cellAspectRatio`,`activeCell`]],template:function(t,a){t&1&&($r(0,`table`,0)(1,`thead`,1)(2,`tr`),Ip(3,`th`,2),vc()(),$r(4,`tbody`,3),Gp(`selectedValueChange`,function(i){return a._yearSelected(i)})(`activeDateChange`,function(i){return a._updateActiveDate(i)})(`keyup`,function(i){return a._handleCalendarBodyKeyup(i)})(`keydown`,function(i){return a._handleCalendarBodyKeydown(i)}),vc()()),t&2&&($v(4),yp(`rows`,a._years())(`todayValue`,a._todayYear())(`startValue`,a._selectedYear())(`endValue`,a._selectedYear())(`numCols`,4)(`cellAspectRatio`,4/7)(`activeCell`,a._getActiveCell()))},dependencies:[ne],encapsulation:2})}return r})();function la(r,p,e,t,a){let n=r.getYear(p),i=r.getYear(e),d=ca(r,t,a);return Math.floor((n-d)/x)===Math.floor((i-d)/x)}function ye(r,p,e,t){return Aa(r.getYear(p)-ca(r,e,t),x)}function ca(r,p,e){let t=0;return e?t=r.getYear(e)-x+1:p&&(t=r.getYear(p)),t}function Aa(r,p){return(r%p+p)%p}var ia=(()=>{class r{_changeDetectorRef=E(cA);_dateFormats=E(d,{optional:!0});_dateAdapter=E(l,{optional:!0});_dir=E(y,{optional:!0});_rerenderSubscription=I.EMPTY;_selectionKeyPressed=!1;get activeDate(){return this._activeDate}set activeDate(e){let t=this._activeDate,a=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))||this._dateAdapter.today();this._activeDate=this._dateAdapter.clampDate(a,this.minDate,this.maxDate),this._dateAdapter.getYear(t)!==this._dateAdapter.getYear(this._activeDate)&&this._init()}_activeDate;get selected(){return this._selected}set selected(e){e instanceof v?this._selected=e:this._selected=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e)),this._setSelectedMonth(e)}_selected=null;get minDate(){return this._minDate}set minDate(e){this._minDate=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_minDate=null;get maxDate(){return this._maxDate}set maxDate(e){this._maxDate=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_maxDate=null;dateFilter;dateClass;selectedChange=new Pe$1;monthSelected=new Pe$1;activeDateChange=new Pe$1;_matCalendarBody;_months=xe([]);_yearLabel=xe(``);_todayMonth=xe(null);_selectedMonth=xe(null);constructor(){this._activeDate=this._dateAdapter.today()}ngAfterContentInit(){this._rerenderSubscription=this._dateAdapter.localeChanges.pipe(Un(null)).subscribe(()=>this._init())}ngOnDestroy(){this._rerenderSubscription.unsubscribe()}_monthSelected(e){let t=e.value,a=this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate),t,1);this.monthSelected.emit(a);let n=this._getDateFromMonth(t);this.selectedChange.emit(n)}_updateActiveDate(e){let t=e.value,a=this._activeDate;this.activeDate=this._getDateFromMonth(t),this._dateAdapter.compareDate(a,this.activeDate)&&this.activeDateChange.emit(this.activeDate)}_handleCalendarBodyKeydown(e){let t=this._activeDate,a=this._isRtl();switch(e.keyCode){case 37:this.activeDate=this._dateAdapter.addCalendarMonths(this._activeDate,a?1:-1);break;case 39:this.activeDate=this._dateAdapter.addCalendarMonths(this._activeDate,a?-1:1);break;case 38:this.activeDate=this._dateAdapter.addCalendarMonths(this._activeDate,-4);break;case 40:this.activeDate=this._dateAdapter.addCalendarMonths(this._activeDate,4);break;case 36:this.activeDate=this._dateAdapter.addCalendarMonths(this._activeDate,-this._dateAdapter.getMonth(this._activeDate));break;case 35:this.activeDate=this._dateAdapter.addCalendarMonths(this._activeDate,11-this._dateAdapter.getMonth(this._activeDate));break;case 33:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,e.altKey?-10:-1);break;case 34:this.activeDate=this._dateAdapter.addCalendarYears(this._activeDate,e.altKey?10:1);break;case 13:case 32:this._selectionKeyPressed=!0;break;default:return}this._dateAdapter.compareDate(t,this.activeDate)&&(this.activeDateChange.emit(this.activeDate),this._focusActiveCellAfterViewChecked()),e.preventDefault()}_handleCalendarBodyKeyup(e){(e.keyCode===32||e.keyCode===13)&&(this._selectionKeyPressed&&this._monthSelected({value:this._dateAdapter.getMonth(this._activeDate),event:e}),this._selectionKeyPressed=!1)}_init(){this._setSelectedMonth(this.selected),this._todayMonth.set(this._getMonthInCurrentYear(this._dateAdapter.today())),this._yearLabel.set(this._dateAdapter.getYearName(this.activeDate));let e=this._dateAdapter.getMonthNames(`short`);this._months.set([[0,1,2,3],[4,5,6,7],[8,9,10,11]].map(t=>t.map(a=>this._createCellForMonth(a,e[a])))),this._changeDetectorRef.markForCheck()}_focusActiveCell(){this._matCalendarBody._focusActiveCell()}_focusActiveCellAfterViewChecked(){this._matCalendarBody._scheduleFocusActiveCellAfterViewChecked()}_getMonthInCurrentYear(e){return e&&this._dateAdapter.getYear(e)==this._dateAdapter.getYear(this.activeDate)?this._dateAdapter.getMonth(e):null}_getDateFromMonth(e){let t=this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate),e,1),a=this._dateAdapter.getNumDaysInMonth(t);return this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate),e,Math.min(this._dateAdapter.getDate(this.activeDate),a))}_createCellForMonth(e,t){let a=this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate),e,1),n=this._dateAdapter.format(a,this._dateFormats.display.monthYearA11yLabel),i=this.dateClass?this.dateClass(a,`year`):void 0;return new De(e,t.toLocaleUpperCase(),n,this._shouldEnableMonth(e),i)}_shouldEnableMonth(e){let t=this._dateAdapter.getYear(this.activeDate);if(e==null||this._isYearAndMonthAfterMaxDate(t,e)||this._isYearAndMonthBeforeMinDate(t,e))return!1;if(!this.dateFilter)return!0;let a=this._dateAdapter.createDate(t,e,1);for(let n=a;this._dateAdapter.getMonth(n)==e;n=this._dateAdapter.addCalendarDays(n,1))if(this.dateFilter(n))return!0;return!1}_isYearAndMonthAfterMaxDate(e,t){if(this.maxDate){let a=this._dateAdapter.getYear(this.maxDate),n=this._dateAdapter.getMonth(this.maxDate);return e>a||e===a&&t>n}return!1}_isYearAndMonthBeforeMinDate(e,t){if(this.minDate){let a=this._dateAdapter.getYear(this.minDate),n=this._dateAdapter.getMonth(this.minDate);return e<a||e===a&&t<n}return!1}_isRtl(){return this._dir&&this._dir.value===`rtl`}_setSelectedMonth(e){e instanceof v?this._selectedMonth.set(this._getMonthInCurrentYear(e.start)||this._getMonthInCurrentYear(e.end)):this._selectedMonth.set(this._getMonthInCurrentYear(e))}static ɵfac=function(t){return new(t||r)};static ɵcmp=AI({type:r,selectors:[[`mat-year-view`]],viewQuery:function(t,a){if(t&1&&Zp(ne,5),t&2){let n;rD(n=iD())&&(a._matCalendarBody=n.first)}},inputs:{activeDate:`activeDate`,selected:`selected`,minDate:`minDate`,maxDate:`maxDate`,dateFilter:`dateFilter`,dateClass:`dateClass`},outputs:{selectedChange:`selectedChange`,monthSelected:`monthSelected`,activeDateChange:`activeDateChange`},exportAs:[`matYearView`],decls:5,vars:9,consts:[[`role`,`grid`,1,`mat-calendar-table`],[`aria-hidden`,`true`,1,`mat-calendar-table-header`],[`colspan`,`4`,1,`mat-calendar-table-header-divider`],[`mat-calendar-body`,``,3,`selectedValueChange`,`activeDateChange`,`keyup`,`keydown`,`label`,`rows`,`todayValue`,`startValue`,`endValue`,`labelMinRequiredCells`,`numCols`,`cellAspectRatio`,`activeCell`]],template:function(t,a){t&1&&($r(0,`table`,0)(1,`thead`,1)(2,`tr`),Ip(3,`th`,2),vc()(),$r(4,`tbody`,3),Gp(`selectedValueChange`,function(i){return a._monthSelected(i)})(`activeDateChange`,function(i){return a._updateActiveDate(i)})(`keyup`,function(i){return a._handleCalendarBodyKeyup(i)})(`keydown`,function(i){return a._handleCalendarBodyKeydown(i)}),vc()()),t&2&&($v(4),yp(`label`,a._yearLabel())(`rows`,a._months())(`todayValue`,a._todayMonth())(`startValue`,a._selectedMonth())(`endValue`,a._selectedMonth())(`labelMinRequiredCells`,2)(`numCols`,4)(`cellAspectRatio`,4/7)(`activeCell`,a._dateAdapter.getMonth(a.activeDate)))},dependencies:[ne],encapsulation:2})}return r})();var pa=(()=>{class r{_intl=E(oe);calendar=E(mt);_dateAdapter=E(l,{optional:!0});_dateFormats=E(d,{optional:!0});_periodButtonText;_periodButtonDescription;_periodButtonLabel;_prevButtonLabel;_nextButtonLabel;constructor(){E(w).load(T$1);let e=E(cA);this._updateLabels(),this.calendar.stateChanges.subscribe(()=>{this._updateLabels(),e.markForCheck()})}get periodButtonText(){return this._periodButtonText}get periodButtonDescription(){return this._periodButtonDescription}get periodButtonLabel(){return this._periodButtonLabel}get prevButtonLabel(){return this._prevButtonLabel}get nextButtonLabel(){return this._nextButtonLabel}currentPeriodClicked(){this.calendar.currentView=this.calendar.currentView==`month`?`multi-year`:`month`}previousClicked(){this.previousEnabled()&&(this.calendar.activeDate=this.calendar.currentView==`month`?this._dateAdapter.addCalendarMonths(this.calendar.activeDate,-1):this._dateAdapter.addCalendarYears(this.calendar.activeDate,this.calendar.currentView==`year`?-1:-x))}nextClicked(){this.nextEnabled()&&(this.calendar.activeDate=this.calendar.currentView==`month`?this._dateAdapter.addCalendarMonths(this.calendar.activeDate,1):this._dateAdapter.addCalendarYears(this.calendar.activeDate,this.calendar.currentView==`year`?1:x))}previousEnabled(){return this.calendar.minDate?!this.calendar.minDate||!this._isSameView(this.calendar.activeDate,this.calendar.minDate):!0}nextEnabled(){return!this.calendar.maxDate||!this._isSameView(this.calendar.activeDate,this.calendar.maxDate)}_updateLabels(){let e=this.calendar,t=this._intl,a=this._dateAdapter;e.currentView===`month`?(this._periodButtonText=a.format(e.activeDate,this._dateFormats.display.monthYearLabel).toLocaleUpperCase(),this._periodButtonDescription=a.format(e.activeDate,this._dateFormats.display.monthYearLabel).toLocaleUpperCase(),this._periodButtonLabel=t.switchToMultiYearViewLabel,this._prevButtonLabel=t.prevMonthLabel,this._nextButtonLabel=t.nextMonthLabel):e.currentView===`year`?(this._periodButtonText=a.getYearName(e.activeDate),this._periodButtonDescription=a.getYearName(e.activeDate),this._periodButtonLabel=t.switchToMonthViewLabel,this._prevButtonLabel=t.prevYearLabel,this._nextButtonLabel=t.nextYearLabel):(this._periodButtonText=t.formatYearRange(...this._formatMinAndMaxYearLabels()),this._periodButtonDescription=t.formatYearRangeLabel(...this._formatMinAndMaxYearLabels()),this._periodButtonLabel=t.switchToMonthViewLabel,this._prevButtonLabel=t.prevMultiYearLabel,this._nextButtonLabel=t.nextMultiYearLabel)}_isSameView(e,t){return this.calendar.currentView==`month`?this._dateAdapter.getYear(e)==this._dateAdapter.getYear(t)&&this._dateAdapter.getMonth(e)==this._dateAdapter.getMonth(t):this.calendar.currentView==`year`?this._dateAdapter.getYear(e)==this._dateAdapter.getYear(t):la(this._dateAdapter,e,t,this.calendar.minDate,this.calendar.maxDate)}_formatMinAndMaxYearLabels(){let t=this._dateAdapter.getYear(this.calendar.activeDate)-ye(this._dateAdapter,this.calendar.activeDate,this.calendar.minDate,this.calendar.maxDate),a=t+x-1;return[this._dateAdapter.getYearName(this._dateAdapter.createDate(t,0,1)),this._dateAdapter.getYearName(this._dateAdapter.createDate(a,0,1))]}_periodButtonLabelId=E(le).getId(`mat-calendar-period-label-`);static ɵfac=function(t){return new(t||r)};static ɵcmp=(function(){return AI({type:r,selectors:[[`mat-calendar-header`]],exportAs:[`matCalendarHeader`],ngContentSelectors:[`*`],decls:17,vars:13,consts:[[1,`mat-calendar-header`],[1,`mat-calendar-controls`],[`aria-live`,`polite`,1,`cdk-visually-hidden`,3,`id`],[`matButton`,``,`type`,`button`,1,`mat-calendar-period-button`,3,`click`],[`aria-hidden`,`true`],[`viewBox`,`0 0 10 5`,`focusable`,`false`,`aria-hidden`,`true`,1,`mat-calendar-arrow`],[`points`,`0,0 5,5 10,0`],[1,`mat-calendar-spacer`],[`matIconButton`,``,`type`,`button`,`disabledInteractive`,``,1,`mat-calendar-previous-button`,3,`click`,`disabled`,`matTooltip`],[`viewBox`,`0 0 24 24`,`focusable`,`false`,`aria-hidden`,`true`],[`d`,`M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z`],[`matIconButton`,``,`type`,`button`,`disabledInteractive`,``,1,`mat-calendar-next-button`,3,`click`,`disabled`,`matTooltip`],[`d`,`M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z`]],template:function(a,n){a&1&&(tD(),$r(0,`div`,0)(1,`div`,1)(2,`span`,2),SD(3),vc(),$r(4,`button`,3),Gp(`click`,function(){return n.currentPeriodClicked()}),$r(5,`span`,4),SD(6),vc(),ql(),$r(7,`svg`,5),Ip(8,`polygon`,6),vc()(),zl(),Ip(9,`div`,7),nD(10),$r(11,`button`,8),Gp(`click`,function(){return n.previousClicked()}),ql(),$r(12,`svg`,9),Ip(13,`path`,10),vc()(),zl(),$r(14,`button`,11),Gp(`click`,function(){return n.nextClicked()}),ql(),$r(15,`svg`,9),Ip(16,`path`,12),vc()()()()),a&2&&($v(2),yp(`id`,n._periodButtonLabelId),$v(),ch(n.periodButtonDescription),$v(),vp(`aria-label`,n.periodButtonLabel)(`aria-describedby`,n._periodButtonLabelId),$v(2),ch(n.periodButtonText),$v(),th(`mat-calendar-invert`,n.calendar.currentView!==`month`),$v(4),yp(`disabled`,!n.previousEnabled())(`matTooltip`,n.prevButtonLabel),vp(`aria-label`,n.prevButtonLabel),$v(3),yp(`disabled`,!n.nextEnabled())(`matTooltip`,n.nextButtonLabel),vp(`aria-label`,n.nextButtonLabel))},dependencies:[jt,dt$1,It],encapsulation:2})})()}return r})();var mt=(()=>{class r{_dateAdapter=E(l,{optional:!0});_dateFormats=E(d,{optional:!0});_changeDetectorRef=E(cA);_elementRef=E(ho);headerComponent;_calendarHeaderPortal;_intlChanges;_moveFocusOnNextTick=!1;get startAt(){return this._startAt}set startAt(e){this._startAt=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_startAt=null;startView=`month`;get selected(){return this._selected}set selected(e){e instanceof v?this._selected=e:this._selected=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_selected=null;get minDate(){return this._minDate}set minDate(e){this._minDate=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_minDate=null;get maxDate(){return this._maxDate}set maxDate(e){this._maxDate=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_maxDate=null;dateFilter;dateClass;comparisonStart=null;comparisonEnd=null;startDateAccessibleName=null;endDateAccessibleName=null;selectedChange=new Pe$1;yearSelected=new Pe$1;monthSelected=new Pe$1;viewChanged=new Pe$1(!0);_userSelection=new Pe$1;_userDragDrop=new Pe$1;monthView;yearView;multiYearView;get activeDate(){return this._clampedActiveDate}set activeDate(e){this._clampedActiveDate=this._dateAdapter.clampDate(e,this.minDate,this.maxDate),this.stateChanges.next(),this._changeDetectorRef.markForCheck()}_clampedActiveDate;get currentView(){return this._currentView}set currentView(e){let t=this._currentView!==e?e:null;this._currentView=e,this._moveFocusOnNextTick=!0,this._changeDetectorRef.markForCheck(),t&&(this.stateChanges.next(),this.viewChanged.emit(t))}_currentView;_activeDrag=null;stateChanges=new S;constructor(){this._intlChanges=E(oe).changes.subscribe(()=>{this._changeDetectorRef.markForCheck(),this.stateChanges.next()})}ngAfterContentInit(){this._calendarHeaderPortal=new p(this.headerComponent||pa),this.activeDate=this.startAt||this._dateAdapter.today(),this._currentView=this.startView}ngAfterViewChecked(){this._moveFocusOnNextTick&&(this._moveFocusOnNextTick=!1,this.focusActiveCell())}ngOnDestroy(){this._intlChanges.unsubscribe(),this.stateChanges.complete()}ngOnChanges(e){let t=e.minDate&&!this._dateAdapter.sameDate(e.minDate.previousValue,e.minDate.currentValue)?e.minDate:void 0,a=e.maxDate&&!this._dateAdapter.sameDate(e.maxDate.previousValue,e.maxDate.currentValue)?e.maxDate:void 0,n=t||a||e.dateFilter;if(n&&!n.firstChange){let i=this._getCurrentViewComponent();i&&(this._elementRef.nativeElement.contains(Be$1())&&(this._moveFocusOnNextTick=!0),this._changeDetectorRef.detectChanges(),i._init())}this.stateChanges.next()}focusActiveCell(){this._getCurrentViewComponent()?._focusActiveCell(!1)}updateTodaysDate(){this._getCurrentViewComponent()?._init()}_dateSelected(e){let t=e.value;(this.selected instanceof v||t&&!this._dateAdapter.sameDate(t,this.selected))&&this.selectedChange.emit(t),this._userSelection.emit(e)}_yearSelectedInMultiYearView(e){this.yearSelected.emit(e)}_monthSelectedInYearView(e){this.monthSelected.emit(e)}_goToDateInView(e,t){this.activeDate=e,this.currentView=t}_dragStarted(e){this._activeDrag=e}_dragEnded(e){this._activeDrag&&(e.value&&this._userDragDrop.emit(e),this._activeDrag=null)}_getCurrentViewComponent(){return this.monthView||this.yearView||this.multiYearView}static ɵfac=function(t){return new(t||r)};static ɵcmp=(function(){function e(i,d){}function t(i,d){if(i&1){let o=gE();$r(0,`mat-month-view`,4),ph(`activeDateChange`,function(s){Ll(o);let u=XE();return OD(u.activeDate,s)||(u.activeDate=s),Pl(s)}),Gp(`_userSelection`,function(s){Ll(o);let u=XE();return Pl(u._dateSelected(s))})(`dragStarted`,function(s){Ll(o);let u=XE();return Pl(u._dragStarted(s))})(`dragEnded`,function(s){Ll(o);let u=XE();return Pl(u._dragEnded(s))}),vc()}if(i&2){let o=XE();fh(`activeDate`,o.activeDate),yp(`selected`,o.selected)(`dateFilter`,o.dateFilter)(`maxDate`,o.maxDate)(`minDate`,o.minDate)(`dateClass`,o.dateClass)(`comparisonStart`,o.comparisonStart)(`comparisonEnd`,o.comparisonEnd)(`startDateAccessibleName`,o.startDateAccessibleName)(`endDateAccessibleName`,o.endDateAccessibleName)(`activeDrag`,o._activeDrag)}}function a(i,d){if(i&1){let o=gE();$r(0,`mat-year-view`,5),ph(`activeDateChange`,function(s){Ll(o);let u=XE();return OD(u.activeDate,s)||(u.activeDate=s),Pl(s)}),Gp(`monthSelected`,function(s){Ll(o);let u=XE();return Pl(u._monthSelectedInYearView(s))})(`selectedChange`,function(s){Ll(o);let u=XE();return Pl(u._goToDateInView(s,`month`))}),vc()}if(i&2){let o=XE();fh(`activeDate`,o.activeDate),yp(`selected`,o.selected)(`dateFilter`,o.dateFilter)(`maxDate`,o.maxDate)(`minDate`,o.minDate)(`dateClass`,o.dateClass)}}function n(i,d){if(i&1){let o=gE();$r(0,`mat-multi-year-view`,6),ph(`activeDateChange`,function(s){Ll(o);let u=XE();return OD(u.activeDate,s)||(u.activeDate=s),Pl(s)}),Gp(`yearSelected`,function(s){Ll(o);let u=XE();return Pl(u._yearSelectedInMultiYearView(s))})(`selectedChange`,function(s){Ll(o);let u=XE();return Pl(u._goToDateInView(s,`year`))}),vc()}if(i&2){let o=XE();fh(`activeDate`,o.activeDate),yp(`selected`,o.selected)(`dateFilter`,o.dateFilter)(`maxDate`,o.maxDate)(`minDate`,o.minDate)(`dateClass`,o.dateClass)}}return AI({type:r,selectors:[[`mat-calendar`]],viewQuery:function(d,o){if(d&1&&Zp(na,5)(ia,5)(ra,5),d&2){let c;rD(c=iD())&&(o.monthView=c.first),rD(c=iD())&&(o.yearView=c.first),rD(c=iD())&&(o.multiYearView=c.first)}},hostAttrs:[1,`mat-calendar`],inputs:{headerComponent:`headerComponent`,startAt:`startAt`,startView:`startView`,selected:`selected`,minDate:`minDate`,maxDate:`maxDate`,dateFilter:`dateFilter`,dateClass:`dateClass`,comparisonStart:`comparisonStart`,comparisonEnd:`comparisonEnd`,startDateAccessibleName:`startDateAccessibleName`,endDateAccessibleName:`endDateAccessibleName`},outputs:{selectedChange:`selectedChange`,yearSelected:`yearSelected`,monthSelected:`monthSelected`,viewChanged:`viewChanged`,_userSelection:`_userSelection`,_userDragDrop:`_userDragDrop`},exportAs:[`matCalendar`],features:[$D([da]),qg],decls:5,vars:2,consts:[[3,`cdkPortalOutlet`],[`cdkMonitorSubtreeFocus`,``,`tabindex`,`-1`,1,`mat-calendar-content`],[3,`activeDate`,`selected`,`dateFilter`,`maxDate`,`minDate`,`dateClass`,`comparisonStart`,`comparisonEnd`,`startDateAccessibleName`,`endDateAccessibleName`,`activeDrag`],[3,`activeDate`,`selected`,`dateFilter`,`maxDate`,`minDate`,`dateClass`],[3,`activeDateChange`,`_userSelection`,`dragStarted`,`dragEnded`,`activeDate`,`selected`,`dateFilter`,`maxDate`,`minDate`,`dateClass`,`comparisonStart`,`comparisonEnd`,`startDateAccessibleName`,`endDateAccessibleName`,`activeDrag`],[3,`activeDateChange`,`monthSelected`,`selectedChange`,`activeDate`,`selected`,`dateFilter`,`maxDate`,`minDate`,`dateClass`],[3,`activeDateChange`,`yearSelected`,`selectedChange`,`activeDate`,`selected`,`dateFilter`,`maxDate`,`minDate`,`dateClass`]],template:function(d,o){if(d&1&&(dp(0,e,0,0,`ng-template`,0),$r(1,`div`,1),rE(2,t,1,11,`mat-month-view`,2)(3,a,1,6,`mat-year-view`,3)(4,n,1,6,`mat-multi-year-view`,3),vc()),d&2){let c;yp(`cdkPortalOutlet`,o._calendarHeaderPortal),$v(2),sE((c=o.currentView)===`month`?2:c===`year`?3:c===`multi-year`?4:-1)}},dependencies:[H,pt$1,na,ia,ra],styles:[`.mat-calendar {
  display: block;
  line-height: normal;
  font-family: var(--%NS%mat-datepicker-calendar-text-font, var(--%NS%mat-sys-body-medium-font));
  font-size: var(--%NS%mat-datepicker-calendar-text-size, var(--%NS%mat-sys-body-medium-size));
}

.mat-calendar-header {
  padding: 8px 8px 0 8px;
}

.mat-calendar-content {
  padding: 0 8px 8px 8px;
  outline: none;
}

.mat-calendar-controls {
  display: flex;
  align-items: center;
  margin: 5% calc(4.7142857143% - 16px);
}

.mat-calendar-spacer {
  flex: 1 1 auto;
}

.mat-calendar-period-button {
  min-width: 0;
  margin: 0 8px;
  font-size: var(--%NS%mat-datepicker-calendar-period-button-text-size, var(--%NS%mat-sys-title-small-size));
  font-weight: var(--%NS%mat-datepicker-calendar-period-button-text-weight, var(--%NS%mat-sys-title-small-weight));
  --%NS%mat-button-text-label-text-color: var(--%NS%mat-datepicker-calendar-period-button-text-color, var(--%NS%mat-sys-on-surface-variant));
}

.mat-calendar-arrow {
  display: inline-block;
  width: 10px;
  height: 5px;
  margin: 0 0 0 5px;
  vertical-align: middle;
  fill: var(--%NS%mat-datepicker-calendar-period-button-icon-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-calendar-arrow.mat-calendar-invert {
  transform: rotate(180deg);
}
[dir=rtl] .mat-calendar-arrow {
  margin: 0 5px 0 0;
}
@media (forced-colors: active) {
  .mat-calendar-arrow {
    fill: CanvasText;
  }
}

.mat-datepicker-content .mat-calendar-previous-button:not(.mat-mdc-button-disabled),
.mat-datepicker-content .mat-calendar-next-button:not(.mat-mdc-button-disabled) {
  color: var(--%NS%mat-datepicker-calendar-navigation-button-icon-color, var(--%NS%mat-sys-on-surface-variant));
}
[dir=rtl] .mat-calendar-previous-button,
[dir=rtl] .mat-calendar-next-button {
  transform: rotate(180deg);
}

.mat-calendar-table {
  border-spacing: 0;
  border-collapse: collapse;
  width: 100%;
}

.mat-calendar-table-header th {
  text-align: center;
  padding: 0 0 8px 0;
  color: var(--%NS%mat-datepicker-calendar-header-text-color, var(--%NS%mat-sys-on-surface-variant));
  font-size: var(--%NS%mat-datepicker-calendar-header-text-size, var(--%NS%mat-sys-title-small-size));
  font-weight: var(--%NS%mat-datepicker-calendar-header-text-weight, var(--%NS%mat-sys-title-small-weight));
}

.mat-calendar-table-header-divider {
  position: relative;
  height: 1px;
}
.mat-calendar-table-header-divider::after {
  content: "";
  position: absolute;
  top: 0;
  left: -8px;
  right: -8px;
  height: 1px;
  background: var(--%NS%mat-datepicker-calendar-header-divider-color, transparent);
}

.mat-calendar-body-cell-content::before {
  margin: calc(calc(var(--%NS%mat-focus-indicator-border-width, 3px) + 3px) * -1);
}

.mat-calendar-body-cell:focus-visible .mat-focus-indicator::before {
  content: "";
}
`],encapsulation:2})})()}return r})();var Ma=new M(`mat-datepicker-scroll-strategy`,{providedIn:`root`,factory:()=>{let r=E(ne$1);return()=>et(r)}});var ma=(()=>{class r{_elementRef=E(ho);_animationsDisabled=Jt();_changeDetectorRef=E(cA);_globalModel=E(q);_dateAdapter=E(l);_ngZone=E(Z);_rangeSelectionStrategy=E(Pe,{optional:!0});_stateChanges;_model;_eventCleanups;_animationFallback;_calendar;color;datepicker;comparisonStart=null;comparisonEnd=null;startDateAccessibleName=null;endDateAccessibleName=null;_isAbove=!1;_animationDone=new S;_isAnimating=!1;_closeButtonText;_closeButtonFocused=!1;_actionsPortal=null;_dialogLabelId=null;constructor(){if(E(w).load(T$1),this._closeButtonText=E(oe).closeCalendarLabel,!this._animationsDisabled){let e=this._elementRef.nativeElement,t=E(da$1);this._eventCleanups=this._ngZone.runOutsideAngular(()=>[t.listen(e,`animationstart`,this._handleAnimationEvent),t.listen(e,`animationend`,this._handleAnimationEvent),t.listen(e,`animationcancel`,this._handleAnimationEvent)])}}ngAfterViewInit(){this._stateChanges=this.datepicker.stateChanges.subscribe(()=>{this._changeDetectorRef.markForCheck()}),this._calendar.focusActiveCell()}ngOnDestroy(){clearTimeout(this._animationFallback),this._eventCleanups?.forEach(e=>e()),this._stateChanges?.unsubscribe(),this._animationDone.complete()}_handleUserSelection(e){let t=this._model.selection,a=e.value,n=t instanceof v;if(n&&this._rangeSelectionStrategy){let i=this._rangeSelectionStrategy.selectionFinished(a,t,e.event);this._model.updateSelection(i,this)}else a&&(n||!this._dateAdapter.sameDate(a,t))&&this._model.add(a);(!this._model||this._model.isComplete())&&!this._actionsPortal&&this.datepicker.close()}_handleUserDragDrop(e){this._model.updateSelection(e.value,this)}_startExitAnimation(){this._elementRef.nativeElement.classList.add(`mat-datepicker-content-exit`),this._animationsDisabled?this._animationDone.next():(clearTimeout(this._animationFallback),this._animationFallback=setTimeout(()=>{this._isAnimating||this._animationDone.next()},200))}_handleAnimationEvent=e=>{let t=this._elementRef.nativeElement;e.target!==t||!e.animationName.startsWith(`_mat-datepicker-content`)||(clearTimeout(this._animationFallback),this._isAnimating=e.type===`animationstart`,t.classList.toggle(`mat-datepicker-content-animating`,this._isAnimating),this._isAnimating||this._animationDone.next())};_getSelected(){return this._model.selection}_applyPendingSelection(){this._model!==this._globalModel&&this._globalModel.updateSelection(this._model.selection,this)}_assignActions(e,t){this._model=e?this._globalModel.clone():this._globalModel,this._actionsPortal=e,t&&this._changeDetectorRef.detectChanges()}static ɵfac=function(t){return new(t||r)};static ɵcmp=(function(){function e(t,a){}return AI({type:r,selectors:[[`mat-datepicker-content`]],viewQuery:function(a,n){if(a&1&&Zp(mt,5),a&2){let i;rD(i=iD())&&(n._calendar=i.first)}},hostAttrs:[1,`mat-datepicker-content`],hostVars:6,hostBindings:function(a,n){a&2&&(yD(n.color?`mat-`+n.color:``),th(`mat-datepicker-content-touch`,n.datepicker.touchUi)(`mat-datepicker-content-animations-enabled`,!n._animationsDisabled))},inputs:{color:`color`},exportAs:[`matDatepickerContent`],decls:5,vars:26,consts:[[`cdkTrapFocus`,``,`role`,`dialog`,1,`mat-datepicker-content-container`],[3,`yearSelected`,`monthSelected`,`viewChanged`,`_userSelection`,`_userDragDrop`,`id`,`startAt`,`startView`,`minDate`,`maxDate`,`dateFilter`,`headerComponent`,`selected`,`dateClass`,`comparisonStart`,`comparisonEnd`,`startDateAccessibleName`,`endDateAccessibleName`],[3,`cdkPortalOutlet`],[`type`,`button`,`matButton`,`elevated`,1,`mat-datepicker-close-button`,3,`focus`,`blur`,`click`,`color`]],template:function(a,n){a&1&&($r(0,`div`,0)(1,`mat-calendar`,1),Gp(`yearSelected`,function(d){return n.datepicker._selectYear(d)})(`monthSelected`,function(d){return n.datepicker._selectMonth(d)})(`viewChanged`,function(d){return n.datepicker._viewChanged(d)})(`_userSelection`,function(d){return n._handleUserSelection(d)})(`_userDragDrop`,function(d){return n._handleUserDragDrop(d)}),vc(),dp(2,e,0,0,`ng-template`,2),$r(3,`button`,3),Gp(`focus`,function(){return n._closeButtonFocused=!0})(`blur`,function(){return n._closeButtonFocused=!1})(`click`,function(){return n.datepicker.close()}),SD(4),vc()()),a&2&&(th(`mat-datepicker-content-container-with-custom-header`,n.datepicker.calendarHeaderComponent)(`mat-datepicker-content-container-with-actions`,n._actionsPortal),vp(`aria-modal`,!0)(`aria-labelledby`,n._dialogLabelId??void 0),$v(),yD(n.datepicker.panelClass),yp(`id`,n.datepicker.id)(`startAt`,n.datepicker.startAt)(`startView`,n.datepicker.startView)(`minDate`,n.datepicker._getMinDate())(`maxDate`,n.datepicker._getMaxDate())(`dateFilter`,n.datepicker._getDateFilter())(`headerComponent`,n.datepicker.calendarHeaderComponent)(`selected`,n._getSelected())(`dateClass`,n.datepicker.dateClass)(`comparisonStart`,n.comparisonStart)(`comparisonEnd`,n.comparisonEnd)(`startDateAccessibleName`,n.startDateAccessibleName)(`endDateAccessibleName`,n.endDateAccessibleName),$v(),yp(`cdkPortalOutlet`,n._actionsPortal),$v(),th(`cdk-visually-hidden`,!n._closeButtonFocused),yp(`color`,n.color||`primary`),$v(),ch(n._closeButtonText))},dependencies:[Ot,mt,H,jt],styles:[`@keyframes _mat-datepicker-content-dropdown-enter {
  from {
    opacity: 0;
    transform: scaleY(0.8);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes _mat-datepicker-content-dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes _mat-datepicker-content-exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.mat-datepicker-content {
  display: block;
  background-color: var(--%NS%mat-datepicker-calendar-container-background-color, var(--%NS%mat-sys-surface-container-high));
  color: var(--%NS%mat-datepicker-calendar-container-text-color, var(--%NS%mat-sys-on-surface));
  box-shadow: var(--%NS%mat-datepicker-calendar-container-elevation-shadow, 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12));
  border-radius: var(--%NS%mat-datepicker-calendar-container-shape, var(--%NS%mat-sys-corner-large));
}
.mat-datepicker-content.mat-datepicker-content-animations-enabled {
  animation: _mat-datepicker-content-dropdown-enter 120ms cubic-bezier(0, 0, 0.2, 1);
}
.mat-datepicker-content .mat-calendar {
  width: 296px;
  height: 354px;
}
.mat-datepicker-content .mat-datepicker-content-container-with-custom-header .mat-calendar {
  height: auto;
}
.mat-datepicker-content .mat-datepicker-close-button {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
}
.mat-datepicker-content-animating .mat-datepicker-content .mat-datepicker-close-button {
  display: none;
}

.mat-datepicker-content-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mat-datepicker-content-touch {
  display: block;
  max-height: 80vh;
  box-shadow: var(--%NS%mat-datepicker-calendar-container-touch-elevation-shadow, 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12));
  border-radius: var(--%NS%mat-datepicker-calendar-container-touch-shape, var(--%NS%mat-sys-corner-extra-large));
  position: relative;
  overflow: visible;
  min-height: fit-content;
}
.mat-datepicker-content-touch.mat-datepicker-content-animations-enabled {
  animation: _mat-datepicker-content-dialog-enter 150ms cubic-bezier(0, 0, 0.2, 1);
}
.mat-datepicker-content-touch .mat-datepicker-content-container {
  min-height: fit-content;
  max-height: 788px;
  min-width: 250px;
  max-width: 750px;
}
.mat-datepicker-content-touch .mat-calendar {
  width: 100%;
  height: auto;
}

.mat-datepicker-content-exit.mat-datepicker-content-animations-enabled {
  animation: _mat-datepicker-content-exit 100ms linear;
}

@media all and (orientation: landscape) {
  .mat-datepicker-content-touch .mat-datepicker-content-container {
    width: 64vh;
    height: 80vh;
  }
}
@media all and (orientation: portrait) {
  .mat-datepicker-content-touch .mat-datepicker-content-container {
    width: 80vw;
    height: 100vw;
  }
}
`],encapsulation:2})})()}return r})();var Ye=(()=>{class r{_injector=E(ne$1);_viewContainerRef=E(ai);_dateAdapter=E(l,{optional:!0});_dir=E(y,{optional:!0});_model=E(q);_animationsDisabled=Jt();_scrollStrategy=E(Ma);_inputStateChanges=I.EMPTY;_document=E(Qn);calendarHeaderComponent;get startAt(){return this._startAt||(this.datepickerInput?this.datepickerInput.getStartValue():null)}set startAt(e){this._startAt=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e))}_startAt=null;startView=`month`;get color(){return this._color||(this.datepickerInput?this.datepickerInput.getThemePalette():void 0)}set color(e){this._color=e}_color;touchUi=!1;get disabled(){return this._disabled===void 0&&this.datepickerInput?this.datepickerInput.disabled:!!this._disabled}set disabled(e){e!==this._disabled&&(this._disabled=e,this.stateChanges.next(void 0))}_disabled;xPosition=`start`;yPosition=`below`;restoreFocus=!0;yearSelected=new Pe$1;monthSelected=new Pe$1;viewChanged=new Pe$1(!0);dateClass;openedStream=new Pe$1;closedStream=new Pe$1;get panelClass(){return this._panelClass}set panelClass(e){this._panelClass=Zs(e)}_panelClass;get opened(){return this._opened}set opened(e){e?this.open():this.close()}_opened=!1;id=E(le).getId(`mat-datepicker-`);_getMinDate(){return this.datepickerInput&&this.datepickerInput.min}_getMaxDate(){return this.datepickerInput&&this.datepickerInput.max}_getDateFilter(){return this.datepickerInput&&this.datepickerInput.dateFilter}_overlayRef=null;_componentRef=null;_focusedElementBeforeOpen=null;_backdropHarnessClass=`${this.id}-backdrop`;_actionsPortal=null;datepickerInput;stateChanges=new S;_changeDetectorRef=E(cA);constructor(){this._dateAdapter,this._model.selectionChanged.subscribe(()=>{this._changeDetectorRef.markForCheck()})}ngOnChanges(e){let t=e.xPosition||e.yPosition;if(t&&!t.firstChange&&this._overlayRef){let a=this._overlayRef.getConfig().positionStrategy;a instanceof W&&(this._setConnectedPositions(a),this.opened&&this._overlayRef.updatePosition())}this.stateChanges.next(void 0)}ngOnDestroy(){this._destroyOverlay(),this.close(),this._inputStateChanges.unsubscribe(),this.stateChanges.complete()}select(e){this._model.add(e)}_selectYear(e){this.yearSelected.emit(e)}_selectMonth(e){this.monthSelected.emit(e)}_viewChanged(e){this.viewChanged.emit(e)}registerInput(e){return this.datepickerInput,this._inputStateChanges.unsubscribe(),this.datepickerInput=e,this._inputStateChanges=e.stateChanges.subscribe(()=>this.stateChanges.next(void 0)),this._model}registerActions(e){this._actionsPortal,this._actionsPortal=e,this._componentRef?.instance._assignActions(e,!0)}removeActions(e){e===this._actionsPortal&&(this._actionsPortal=null,this._componentRef?.instance._assignActions(null,!0))}open(){this._opened||this.disabled||this._componentRef?.instance._isAnimating||(this.datepickerInput,this._focusedElementBeforeOpen=Be$1(),this._openOverlay(),this._opened=!0,this.openedStream.emit())}close(){if(!this._opened||this._componentRef?.instance._isAnimating)return;let e=this.restoreFocus&&this._focusedElementBeforeOpen&&typeof this._focusedElementBeforeOpen.focus==`function`,t=()=>{this._opened&&(this._opened=!1,this.closedStream.emit())};if(this._componentRef){let{instance:a,location:n}=this._componentRef;a._animationDone.pipe(ee$1(1)).subscribe(()=>{let i=this._document.activeElement;e&&(!i||i===this._document.activeElement||n.nativeElement.contains(i))&&this._focusedElementBeforeOpen.focus(),this._focusedElementBeforeOpen=null,this._destroyOverlay()}),a._startExitAnimation()}e?setTimeout(t):t()}_applyPendingSelection(){this._componentRef?.instance?._applyPendingSelection()}_forwardContentValues(e){e.datepicker=this,e.color=this.color,e._dialogLabelId=this.datepickerInput.getOverlayLabelId(),e._assignActions(this._actionsPortal,!1)}_openOverlay(){this._destroyOverlay();let e=this.touchUi,t=new p(ma,this._viewContainerRef),a=this._overlayRef=st$1(this._injector,new D$1({positionStrategy:e?this._getDialogStrategy():this._getDropdownStrategy(),hasBackdrop:!0,backdropClass:[e?`cdk-overlay-dark-backdrop`:`mat-overlay-transparent-backdrop`,this._backdropHarnessClass],direction:this._dir||`ltr`,scrollStrategy:e?Yt(this._injector):this._scrollStrategy(),panelClass:`mat-datepicker-${e?`dialog`:`popup`}`,disableAnimations:this._animationsDisabled}));this._getCloseStream(a).subscribe(n=>{n&&n.preventDefault(),this.close()}),a.keydownEvents().subscribe(n=>{let i=n.keyCode;(i===38||i===40||i===37||i===39||i===33||i===34)&&n.preventDefault()}),this._componentRef=a.attach(t),this._forwardContentValues(this._componentRef.instance),e||Iv(()=>{a.updatePosition()},{injector:this._injector})}_destroyOverlay(){this._overlayRef&&(this._overlayRef.dispose(),this._overlayRef=this._componentRef=null)}_getDialogStrategy(){return Ht(this._injector).centerHorizontally().centerVertically()}_getDropdownStrategy(){let e=ot$1(this._injector,this.datepickerInput.getConnectedOverlayOrigin()).withTransformOriginOn(`.mat-datepicker-content`).withFlexibleDimensions(!1).withViewportMargin(8).withLockedPosition();return this._setConnectedPositions(e)}_setConnectedPositions(e){let t=this.xPosition===`end`?`end`:`start`,a=t===`start`?`end`:`start`,n=this.yPosition===`above`?`bottom`:`top`,i=n===`top`?`bottom`:`top`;return e.withPositions([{originX:t,originY:i,overlayX:t,overlayY:n},{originX:t,originY:n,overlayX:t,overlayY:i},{originX:a,originY:i,overlayX:a,overlayY:n},{originX:a,originY:n,overlayX:a,overlayY:i}])}_getCloseStream(e){let t=[`ctrlKey`,`shiftKey`,`metaKey`];return Eo(e.backdropClick(),e.detachments(),e.keydownEvents().pipe(D(a=>a.keyCode===27&&!xe$1(a)||this.datepickerInput&&xe$1(a,`altKey`)&&a.keyCode===38&&t.every(n=>!xe$1(a,n)))))}static ɵfac=function(t){return new(t||r)};static ɵdir=PI({type:r,inputs:{calendarHeaderComponent:`calendarHeaderComponent`,startAt:`startAt`,startView:`startView`,color:`color`,touchUi:[2,`touchUi`,`touchUi`,dA],disabled:[2,`disabled`,`disabled`,dA],xPosition:`xPosition`,yPosition:`yPosition`,restoreFocus:[2,`restoreFocus`,`restoreFocus`,dA],dateClass:`dateClass`,panelClass:`panelClass`,opened:[2,`opened`,`opened`,dA]},outputs:{yearSelected:`yearSelected`,monthSelected:`monthSelected`,viewChanged:`viewChanged`,openedStream:`opened`,closedStream:`closed`},features:[qg]})}return r})();var Dn=(()=>{class r extends Ye{static ɵfac=(()=>{let e;return function(a){return(e||(e=dm(r)))(a||r)}})();static ɵcmp=AI({type:r,selectors:[[`mat-datepicker`]],exportAs:[`matDatepicker`],features:[$D([da,{provide:Ye,useExisting:r}]),lp],decls:0,vars:0,template:function(t,a){},encapsulation:2})}return r})();var ee=class{target;targetElement;value=null;constructor(p,e){this.target=p,this.targetElement=e,this.value=this.target.value}};var ua=(()=>{class r{_elementRef=E(ho);_dateAdapter=E(l,{optional:!0});_dateFormats=E(d,{optional:!0});_isInitialized=!1;get value(){return this._model?this._getValueFromModel(this._model.selection):this._pendingValue}set value(e){this._assignValueProgrammatically(e,!0)}_model;get disabled(){return!!this._disabled||this._parentDisabled()}set disabled(e){let t=e,a=this._elementRef.nativeElement;this._disabled!==t&&(this._disabled=t,this.stateChanges.next(void 0)),t&&this._isInitialized&&a.blur&&a.blur()}_disabled;dateChange=new Pe$1;dateInput=new Pe$1;stateChanges=new S;_onTouched=()=>{};_validatorOnChange=()=>{};_cvaOnChange=()=>{};_valueChangesSubscription=I.EMPTY;_localeSubscription=I.EMPTY;_pendingValue=null;_parseValidator=()=>this._lastValueValid?null:{matDatepickerParse:{text:this._elementRef.nativeElement.value}};_filterValidator=e=>{let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e.value));return!t||this._matchesFilter(t)?null:{matDatepickerFilter:!0}};_minValidator=e=>{let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e.value)),a=this._getMinDate();return!a||!t||this._dateAdapter.compareDate(a,t)<=0?null:{matDatepickerMin:{min:a,actual:t}}};_maxValidator=e=>{let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e.value)),a=this._getMaxDate();return!a||!t||this._dateAdapter.compareDate(a,t)>=0?null:{matDatepickerMax:{max:a,actual:t}}};_getValidators(){return[this._parseValidator,this._minValidator,this._maxValidator,this._filterValidator]}_registerModel(e){this._model=e,this._valueChangesSubscription.unsubscribe(),this._pendingValue&&this._assignValue(this._pendingValue),this._valueChangesSubscription=this._model.selectionChanged.subscribe(t=>{if(this._shouldHandleChangeEvent(t)){let a=this._getValueFromModel(t.selection);this._lastValueValid=this._isValidValue(a),this._cvaOnChange(a),this._onTouched(),this._formatValue(a),this.dateInput.emit(new ee(this,this._elementRef.nativeElement)),this.dateChange.emit(new ee(this,this._elementRef.nativeElement))}})}_lastValueValid=!1;constructor(){this._localeSubscription=this._dateAdapter.localeChanges.subscribe(()=>{this._assignValueProgrammatically(this.value,!0)})}ngAfterViewInit(){this._isInitialized=!0}ngOnChanges(e){ha(e,this._dateAdapter)&&this.stateChanges.next(void 0)}ngOnDestroy(){this._valueChangesSubscription.unsubscribe(),this._localeSubscription.unsubscribe(),this.stateChanges.complete()}registerOnValidatorChange(e){this._validatorOnChange=e}validate(e){return this._validator?this._validator(e):null}writeValue(e){this._assignValueProgrammatically(e,e!==this.value)}registerOnChange(e){this._cvaOnChange=e}registerOnTouched(e){this._onTouched=e}setDisabledState(e){this.disabled=e}_onKeydown(e){xe$1(e,`altKey`)&&e.keyCode===40&&[`ctrlKey`,`shiftKey`,`metaKey`].every(n=>!xe$1(e,n))&&!this._elementRef.nativeElement.readOnly&&(this._openPopup(),e.preventDefault())}_onInput(e){let t=e.target.value,a=this._lastValueValid,n=this._dateAdapter.parse(t,this._dateFormats.parse.dateInput);this._lastValueValid=this._isValidValue(n),n=this._dateAdapter.getValidDateOrNull(n);let i=!this._dateAdapter.sameDate(n,this.value);!n||i?this._cvaOnChange(n):(t&&!this.value&&this._cvaOnChange(n),a!==this._lastValueValid&&this._validatorOnChange()),i&&(this._assignValue(n),this.dateInput.emit(new ee(this,this._elementRef.nativeElement)))}_onChange(){this.dateChange.emit(new ee(this,this._elementRef.nativeElement))}_onBlur(){this.value&&this._formatValue(this.value),this._onTouched()}_formatValue(e){this._elementRef.nativeElement.value=e!=null?this._dateAdapter.format(e,this._dateFormats.display.dateInput):``}_assignValue(e){this._model?(this._assignValueToModel(e),this._pendingValue=null):this._pendingValue=e}_isValidValue(e){return!e||this._dateAdapter.isValid(e)}_parentDisabled(){return!1}_assignValueProgrammatically(e,t){e=this._dateAdapter.deserialize(e),this._lastValueValid=this._isValidValue(e),e=this._dateAdapter.getValidDateOrNull(e),this._assignValue(e),t&&this._formatValue(e)}_matchesFilter(e){let t=this._getDateFilter();return!t||t(e)}static ɵfac=function(t){return new(t||r)};static ɵdir=PI({type:r,inputs:{value:`value`,disabled:[2,`disabled`,`disabled`,dA]},outputs:{dateChange:`dateChange`,dateInput:`dateInput`},features:[qg]})}return r})();function ha(r,p){let e=Object.keys(r);for(let t of e){let{previousValue:a,currentValue:n}=r[t];if(p.isDateInstance(a)&&p.isDateInstance(n)){if(!p.sameDate(a,n))return!0}else return!0}return!1}var Sa={provide:x$1,useExisting:Uo(()=>_a),multi:!0};var xa={provide:m,useExisting:Uo(()=>_a),multi:!0};var _a=(()=>{class r extends ua{_formField=E(at,{optional:!0});_closedSubscription=I.EMPTY;_openedSubscription=I.EMPTY;set matDatepicker(e){e&&(this._datepicker=e,this._ariaOwns.set(e.opened?e.id:null),this._closedSubscription=e.closedStream.subscribe(()=>{this._onTouched(),this._ariaOwns.set(null)}),this._openedSubscription=e.openedStream.subscribe(()=>{this._ariaOwns.set(e.id)}),this._registerModel(e.registerInput(this)))}_datepicker;_ariaOwns=xe(null);get min(){return this._min}set min(e){let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e));this._dateAdapter.sameDate(t,this._min)||(this._min=t,this._validatorOnChange())}_min=null;get max(){return this._max}set max(e){let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e));this._dateAdapter.sameDate(t,this._max)||(this._max=t,this._validatorOnChange())}_max=null;get dateFilter(){return this._dateFilter}set dateFilter(e){let t=this._matchesFilter(this.value);this._dateFilter=e,this._matchesFilter(this.value)!==t&&this._validatorOnChange()}_dateFilter;_validator=null;constructor(){super(),this._validator=ge.compose(super._getValidators())}getConnectedOverlayOrigin(){return this._formField?this._formField.getConnectedOverlayOrigin():this._elementRef}getOverlayLabelId(){return this._formField?this._formField.getLabelId():this._elementRef.nativeElement.getAttribute(`aria-labelledby`)}getThemePalette(){return this._formField?this._formField.color:void 0}getStartValue(){return this.value}ngOnDestroy(){super.ngOnDestroy(),this._closedSubscription.unsubscribe(),this._openedSubscription.unsubscribe()}_openPopup(){this._datepicker&&this._datepicker.open()}_getValueFromModel(e){return e}_assignValueToModel(e){this._model&&this._model.updateSelection(e,this)}_getMinDate(){return this._min}_getMaxDate(){return this._max}_getDateFilter(){return this._dateFilter}_shouldHandleChangeEvent(e){return e.source!==this}static ɵfac=function(t){return new(t||r)};static ɵdir=PI({type:r,selectors:[[`input`,`matDatepicker`,``]],hostAttrs:[1,`mat-datepicker-input`],hostVars:6,hostBindings:function(t,a){t&1&&Gp(`input`,function(i){return a._onInput(i)})(`change`,function(){return a._onChange()})(`blur`,function(){return a._onBlur()})(`keydown`,function(i){return a._onKeydown(i)}),t&2&&(Mp(`disabled`,a.disabled),vp(`aria-haspopup`,a._datepicker?`dialog`:null)(`aria-owns`,a._ariaOwns())(`min`,a.min?a._dateAdapter.toIso8601(a.min):null)(`max`,a.max?a._dateAdapter.toIso8601(a.max):null)(`data-mat-calendar`,a._datepicker?a._datepicker.id:null))},inputs:{matDatepicker:`matDatepicker`,min:`min`,max:`max`,dateFilter:[0,`matDatepickerFilter`,`dateFilter`]},exportAs:[`matDatepickerInput`],features:[$D([Sa,xa,{provide:ee$2,useExisting:r}]),lp]})}return r})();var Ia=(()=>{class r{static ɵfac=function(t){return new(t||r)};static ɵdir=PI({type:r,selectors:[[``,`matDatepickerToggleIcon`,``]]})}return r})();var Va=(()=>{class r{_intl=E(oe);_changeDetectorRef=E(cA);_stateChanges=I.EMPTY;datepicker;tabIndex=null;ariaLabel;get disabled(){return this._disabled===void 0&&this.datepicker?this.datepicker.disabled:!!this._disabled}set disabled(e){this._disabled=e}_disabled;disableRipple=!1;_customIcon;_button;constructor(){let e=E(new Sh(`tabindex`),{optional:!0}),t=Number(e);this.tabIndex=t||t===0?t:null}ngOnChanges(e){e.datepicker&&this._watchStateChanges()}ngOnDestroy(){this._stateChanges.unsubscribe()}ngAfterContentInit(){this._watchStateChanges()}_open(e){this.datepicker&&!this.disabled&&(this.datepicker.open(),e.stopPropagation())}_watchStateChanges(){let e=this.datepicker?this.datepicker.stateChanges:Fe(),t=this.datepicker&&this.datepicker.datepickerInput?this.datepicker.datepickerInput.stateChanges:Fe(),a=this.datepicker?Eo(this.datepicker.openedStream,this.datepicker.closedStream):Fe();this._stateChanges.unsubscribe(),this._stateChanges=Eo(this._intl.changes,e,t,a).subscribe(()=>this._changeDetectorRef.markForCheck())}static ɵfac=function(t){return new(t||r)};static ɵcmp=(function(){let e=[`button`],t=[[[``,`matDatepickerToggleIcon`,``]]],a=[`[matDatepickerToggleIcon]`];function n(i,d){i&1&&(ql(),$r(0,`svg`,2),Ip(1,`path`,3),vc())}return AI({type:r,selectors:[[`mat-datepicker-toggle`]],contentQueries:function(d,o,c){if(d&1&&Qp(c,Ia,5),d&2){let s;rD(s=iD())&&(o._customIcon=s.first)}},viewQuery:function(d,o){if(d&1&&Zp(e,5),d&2){let c;rD(c=iD())&&(o._button=c.first)}},hostAttrs:[1,`mat-datepicker-toggle`],hostVars:8,hostBindings:function(d,o){d&1&&Gp(`click`,function(s){return o._open(s)}),d&2&&(vp(`tabindex`,null)(`data-mat-calendar`,o.datepicker?o.datepicker.id:null),th(`mat-datepicker-toggle-active`,o.datepicker&&o.datepicker.opened)(`mat-accent`,o.datepicker&&o.datepicker.color===`accent`)(`mat-warn`,o.datepicker&&o.datepicker.color===`warn`))},inputs:{datepicker:[0,`for`,`datepicker`],tabIndex:`tabIndex`,ariaLabel:[0,`aria-label`,`ariaLabel`],disabled:[2,`disabled`,`disabled`,dA],disableRipple:`disableRipple`},exportAs:[`matDatepickerToggle`],features:[qg],ngContentSelectors:a,decls:4,vars:7,consts:[[`button`,``],[`matIconButton`,``,`type`,`button`,3,`tabIndex`,`disabled`,`disableRipple`],[`viewBox`,`0 0 24 24`,`width`,`24px`,`height`,`24px`,`fill`,`currentColor`,`focusable`,`false`,`aria-hidden`,`true`,1,`mat-datepicker-toggle-default-icon`],[`d`,`M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z`]],template:function(d,o){d&1&&(tD(t),$r(0,`button`,1,0),rE(2,n,2,0,`:svg:svg`,2),nD(3),vc()),d&2&&(yp(`tabIndex`,o.disabled?-1:o.tabIndex)(`disabled`,o.disabled)(`disableRipple`,o.disableRipple),vp(`aria-haspopup`,o.datepicker?`dialog`:null)(`aria-label`,o.ariaLabel||o._intl.openCalendarLabel)(`aria-expanded`,o.datepicker?o.datepicker.opened:null),$v(2),sE(o._customIcon?-1:2))},dependencies:[dt$1],styles:[`.mat-datepicker-toggle {
  pointer-events: auto;
  color: var(--%NS%mat-datepicker-toggle-icon-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-datepicker-toggle button {
  color: inherit;
}

.mat-datepicker-toggle-active {
  color: var(--%NS%mat-datepicker-toggle-active-state-icon-color, var(--%NS%mat-sys-primary));
}

@media (forced-colors: active) {
  .mat-datepicker-toggle-default-icon {
    color: CanvasText;
  }
}
`],encapsulation:2})})()}return r})();var Ea=(()=>{class r{_changeDetectorRef=E(cA);_elementRef=E(ho);_dateAdapter=E(l,{optional:!0});_formField=E(at,{optional:!0});_closedSubscription=I.EMPTY;_openedSubscription=I.EMPTY;_startInput;_endInput;get value(){return this._model?this._model.selection:null}id=E(le).getId(`mat-date-range-input-`);focused=!1;get shouldLabelFloat(){return this.focused||!this.empty}controlType=`mat-date-range-input`;get placeholder(){let e=this._startInput?._getPlaceholder()||``,t=this._endInput?._getPlaceholder()||``;return e||t?`${e} ${this.separator} ${t}`:``}get rangePicker(){return this._rangePicker}set rangePicker(e){e&&(this._model=e.registerInput(this),this._rangePicker=e,this._closedSubscription.unsubscribe(),this._openedSubscription.unsubscribe(),this._ariaOwns.set(this.rangePicker.opened?e.id:null),this._closedSubscription=e.closedStream.subscribe(()=>{this._startInput?._onTouched(),this._endInput?._onTouched(),this._ariaOwns.set(null)}),this._openedSubscription=e.openedStream.subscribe(()=>{this._ariaOwns.set(e.id)}),this._registerModel(this._model))}_rangePicker;_ariaOwns=xe(null);get required(){return this._required??(this._isTargetRequired(this)||this._isTargetRequired(this._startInput)||this._isTargetRequired(this._endInput))??!1}set required(e){this._required=e}_required;get dateFilter(){return this._dateFilter}set dateFilter(e){let t=this._startInput,a=this._endInput,n=t&&t._matchesFilter(t.value),i=a&&a._matchesFilter(t.value);this._dateFilter=e,t&&t._matchesFilter(t.value)!==n&&t._validatorOnChange(),a&&a._matchesFilter(a.value)!==i&&a._validatorOnChange()}_dateFilter;get min(){return this._min}set min(e){let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e));this._dateAdapter.sameDate(t,this._min)||(this._min=t,this._revalidate())}_min=null;get max(){return this._max}set max(e){let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e));this._dateAdapter.sameDate(t,this._max)||(this._max=t,this._revalidate())}_max=null;get disabled(){return this._startInput&&this._endInput?this._startInput.disabled&&this._endInput.disabled:this._groupDisabled}set disabled(e){e!==this._groupDisabled&&(this._groupDisabled=e,this.stateChanges.next(void 0))}_groupDisabled=!1;get errorState(){return this._startInput&&this._endInput?this._startInput.errorState||this._endInput.errorState:!1}get empty(){let e=this._startInput?this._startInput.isEmpty():!1,t=this._endInput?this._endInput.isEmpty():!1;return e&&t}_ariaDescribedBy=null;_model;separator=`–`;comparisonStart=null;comparisonEnd=null;ngControl;stateChanges=new S;disableAutomaticLabeling=!0;constructor(){this._dateAdapter,this._formField?._elementRef.nativeElement.classList.contains(`mat-mdc-form-field`)&&this._elementRef.nativeElement.classList.add(`mat-mdc-input-element`,`mat-mdc-form-field-input-control`,`mdc-text-field__input`),this.ngControl=E(h$1,{optional:!0,self:!0})}get describedByIds(){return this._elementRef.nativeElement.getAttribute(`aria-describedby`)?.split(` `)||[]}setDescribedByIds(e){this._ariaDescribedBy=e.length?e.join(` `):null}onContainerClick(){!this.focused&&!this.disabled&&(!this._model||!this._model.selection.start?this._startInput.focus():this._endInput.focus())}ngAfterContentInit(){this._model&&this._registerModel(this._model),Eo(this._startInput.stateChanges,this._endInput.stateChanges).subscribe(()=>{this.stateChanges.next(void 0)})}ngOnChanges(e){ha(e,this._dateAdapter)&&this.stateChanges.next(void 0)}ngOnDestroy(){this._closedSubscription.unsubscribe(),this._openedSubscription.unsubscribe(),this.stateChanges.complete()}getStartValue(){return this.value?this.value.start:null}getThemePalette(){return this._formField?this._formField.color:void 0}getConnectedOverlayOrigin(){return this._formField?this._formField.getConnectedOverlayOrigin():this._elementRef}getOverlayLabelId(){return this._formField?this._formField.getLabelId():null}_getInputMirrorValue(e){let t=e===`start`?this._startInput:this._endInput;return t?t.getMirrorValue():``}_shouldHidePlaceholders(){return this._startInput?!this._startInput.isEmpty():!1}_handleChildValueChange(){this.stateChanges.next(void 0),this._changeDetectorRef.markForCheck()}_openDatepicker(){this._rangePicker&&this._rangePicker.open()}_shouldHideSeparator(){return(!this._formField||this._formField.getLabelId()&&!this._formField._shouldLabelFloat())&&this.empty}_getAriaLabelledby(){let e=this._formField;return e&&e._hasFloatingLabel()?e._labelId:null}_getStartDateAccessibleName(){return this._startInput._getAccessibleName()}_getEndDateAccessibleName(){return this._endInput._getAccessibleName()}_updateFocus(e){this.focused=e!==null,this.stateChanges.next()}_revalidate(){this._startInput&&this._startInput._validatorOnChange(),this._endInput&&this._endInput._validatorOnChange()}_registerModel(e){this._startInput&&this._startInput._registerModel(e),this._endInput&&this._endInput._registerModel(e)}_isTargetRequired(e){return e?.ngControl?.control?.hasValidator(ge.required)}static ɵfac=function(t){return new(t||r)};static ɵcmp=(function(){let e=[[[`input`,`matStartDate`,``]],[[`input`,`matEndDate`,``]]];return AI({type:r,selectors:[[`mat-date-range-input`]],hostAttrs:[`role`,`group`,1,`mat-date-range-input`],hostVars:8,hostBindings:function(n,i){n&2&&(vp(`id`,i.id)(`aria-labelledby`,i._getAriaLabelledby())(`aria-describedby`,i._ariaDescribedBy)(`data-mat-calendar`,i.rangePicker?i.rangePicker.id:null),th(`mat-date-range-input-hide-placeholders`,i._shouldHidePlaceholders())(`mat-date-range-input-required`,i.required))},inputs:{rangePicker:`rangePicker`,required:[2,`required`,`required`,dA],dateFilter:`dateFilter`,min:`min`,max:`max`,disabled:[2,`disabled`,`disabled`,dA],separator:`separator`,comparisonStart:`comparisonStart`,comparisonEnd:`comparisonEnd`},exportAs:[`matDateRangeInput`],features:[$D([{provide:ot$2,useExisting:r}]),qg],ngContentSelectors:[`input[matStartDate]`,`input[matEndDate]`],decls:11,vars:5,consts:[[`cdkMonitorSubtreeFocus`,``,1,`mat-date-range-input-container`,3,`cdkFocusChange`],[1,`mat-date-range-input-wrapper`],[`aria-hidden`,`true`,1,`mat-date-range-input-mirror`],[1,`mat-date-range-input-separator`],[1,`mat-date-range-input-wrapper`,`mat-date-range-input-end-wrapper`]],template:function(n,i){n&1&&(tD(e),$r(0,`div`,0),Gp(`cdkFocusChange`,function(o){return i._updateFocus(o)}),$r(1,`div`,1),nD(2),$r(3,`span`,2),SD(4),vc()(),$r(5,`span`,3),SD(6),vc(),$r(7,`div`,4),nD(8,1),$r(9,`span`,2),SD(10),vc()()()),n&2&&($v(4),ch(i._getInputMirrorValue(`start`)),$v(),th(`mat-date-range-input-separator-hidden`,i._shouldHideSeparator()),$v(),ch(i.separator),$v(4),ch(i._getInputMirrorValue(`end`)))},dependencies:[pt$1],styles:[`.mat-date-range-input {
  display: block;
  width: 100%;
}

.mat-date-range-input-container {
  display: flex;
  align-items: center;
}

.mat-date-range-input-separator {
  transition: opacity 400ms 133.3333333333ms cubic-bezier(0.25, 0.8, 0.25, 1);
  margin: 0 4px;
  color: var(--%NS%mat-datepicker-range-input-separator-color, var(--%NS%mat-sys-on-surface));
}
.mat-form-field-disabled .mat-date-range-input-separator {
  color: var(--%NS%mat-datepicker-range-input-disabled-state-separator-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
._mat-animation-noopable .mat-date-range-input-separator {
  transition: none;
}

.mat-date-range-input-separator-hidden {
  -webkit-user-select: none;
  user-select: none;
  opacity: 0;
  transition: none;
}

.mat-date-range-input-wrapper {
  position: relative;
  overflow: hidden;
  max-width: calc(50% - 4px);
}

.mat-date-range-input-end-wrapper {
  flex-grow: 1;
}

.mat-date-range-input-inner {
  position: absolute;
  top: 0;
  left: 0;
  font: inherit;
  background: transparent;
  color: currentColor;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  vertical-align: bottom;
  text-align: inherit;
  -webkit-appearance: none;
  width: 100%;
  height: 100%;
}
.mat-date-range-input-inner:-moz-ui-invalid {
  box-shadow: none;
}
.mat-date-range-input-inner::placeholder {
  transition: color 400ms 133.3333333333ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-date-range-input-inner::-moz-placeholder {
  transition: color 400ms 133.3333333333ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-date-range-input-inner::-webkit-input-placeholder {
  transition: color 400ms 133.3333333333ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-date-range-input-inner:-ms-input-placeholder {
  transition: color 400ms 133.3333333333ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-date-range-input-inner[disabled] {
  color: var(--%NS%mat-datepicker-range-input-disabled-state-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
.mat-form-field-hide-placeholder .mat-date-range-input-inner::placeholder, .mat-date-range-input-hide-placeholders .mat-date-range-input-inner::placeholder {
  -webkit-user-select: none;
  user-select: none;
  color: transparent !important;
  -webkit-text-fill-color: transparent;
  transition: none;
}
@media (forced-colors: active) {
  .mat-form-field-hide-placeholder .mat-date-range-input-inner::placeholder, .mat-date-range-input-hide-placeholders .mat-date-range-input-inner::placeholder {
    opacity: 0;
  }
}
.mat-form-field-hide-placeholder .mat-date-range-input-inner::-moz-placeholder, .mat-date-range-input-hide-placeholders .mat-date-range-input-inner::-moz-placeholder {
  -webkit-user-select: none;
  user-select: none;
  color: transparent !important;
  -webkit-text-fill-color: transparent;
  transition: none;
}
@media (forced-colors: active) {
  .mat-form-field-hide-placeholder .mat-date-range-input-inner::-moz-placeholder, .mat-date-range-input-hide-placeholders .mat-date-range-input-inner::-moz-placeholder {
    opacity: 0;
  }
}
.mat-form-field-hide-placeholder .mat-date-range-input-inner::-webkit-input-placeholder, .mat-date-range-input-hide-placeholders .mat-date-range-input-inner::-webkit-input-placeholder {
  -webkit-user-select: none;
  user-select: none;
  color: transparent !important;
  -webkit-text-fill-color: transparent;
  transition: none;
}
@media (forced-colors: active) {
  .mat-form-field-hide-placeholder .mat-date-range-input-inner::-webkit-input-placeholder, .mat-date-range-input-hide-placeholders .mat-date-range-input-inner::-webkit-input-placeholder {
    opacity: 0;
  }
}
.mat-form-field-hide-placeholder .mat-date-range-input-inner:-ms-input-placeholder, .mat-date-range-input-hide-placeholders .mat-date-range-input-inner:-ms-input-placeholder {
  -webkit-user-select: none;
  user-select: none;
  color: transparent !important;
  -webkit-text-fill-color: transparent;
  transition: none;
}
@media (forced-colors: active) {
  .mat-form-field-hide-placeholder .mat-date-range-input-inner:-ms-input-placeholder, .mat-date-range-input-hide-placeholders .mat-date-range-input-inner:-ms-input-placeholder {
    opacity: 0;
  }
}
._mat-animation-noopable .mat-date-range-input-inner::placeholder {
  transition: none;
}
._mat-animation-noopable .mat-date-range-input-inner::-moz-placeholder {
  transition: none;
}
._mat-animation-noopable .mat-date-range-input-inner::-webkit-input-placeholder {
  transition: none;
}
._mat-animation-noopable .mat-date-range-input-inner:-ms-input-placeholder {
  transition: none;
}

.mat-date-range-input-mirror {
  -webkit-user-select: none;
  user-select: none;
  visibility: hidden;
  white-space: nowrap;
  display: inline-block;
  min-width: 2px;
}

.mat-mdc-form-field-type-mat-date-range-input .mat-mdc-form-field-infix {
  width: 200px;
}
`],encapsulation:2})})()}return r})();function Na(r){return ut(r,!0)}function oa(r){return r.nodeType===Node.ELEMENT_NODE}function Ra(r){return r.nodeName===`INPUT`}function Fa(r){return r.nodeName===`TEXTAREA`}function ut(r,p){if(oa(r)&&p){let t=(r.getAttribute?.(`aria-labelledby`)?.split(/\s+/g)||[]).reduce((a,n)=>{let i=document.getElementById(n);return i&&a.push(i),a},[]);if(t.length)return t.map(a=>ut(a,!1)).join(` `)}if(oa(r)){let e=r.getAttribute(`aria-label`)?.trim();if(e)return e}if(Ra(r)||Fa(r)){if(r.labels?.length)return Array.from(r.labels).map(a=>ut(a,!1)).join(` `);let e=r.getAttribute(`placeholder`)?.trim();if(e)return e;let t=r.getAttribute(`title`)?.trim();if(t)return t}return(r.textContent||``).replace(/\s+/g,` `).trim()}var ga=(()=>{class r extends ua{_rangeInput=E(Ea);_elementRef=E(ho);_defaultErrorStateMatcher=E(f);_injector=E(ne$1);_rawValue=xe(``);_parentForm=E(on,{optional:!0});_parentFormGroup=E(un,{optional:!0});ngControl;_dir=E(y,{optional:!0});_errorStateTracker;get errorStateMatcher(){return this._errorStateTracker.matcher}set errorStateMatcher(e){this._errorStateTracker.matcher=e}get errorState(){return this._errorStateTracker.errorState}set errorState(e){this._errorStateTracker.errorState=e}constructor(){super(),this._errorStateTracker=new s(this._defaultErrorStateMatcher,null,this._parentFormGroup,this._parentForm,this.stateChanges)}ngOnInit(){let e=this._injector.get(v$1,null,{optional:!0,self:!0});this._errorStateTracker.formField=this._injector.get(Jt$1,null,{optional:!0,self:!0}),e&&(this.ngControl=e,this._errorStateTracker.ngControl=e)}ngAfterContentInit(){this._register()}ngDoCheck(){this.ngControl&&this.updateErrorState(),this._rawValue.set(this._elementRef.nativeElement.value)}isEmpty(){return this._rawValue().length===0}_getPlaceholder(){return this._elementRef.nativeElement.placeholder}focus(){this._elementRef.nativeElement.focus()}getMirrorValue(){let e=this._rawValue();return e.length>0?e:this._getPlaceholder()}updateErrorState(){this._errorStateTracker.updateErrorState()}_onInput(e){super._onInput(e),this._rangeInput._handleChildValueChange()}_openPopup(){this._rangeInput._openDatepicker()}_getMinDate(){return this._rangeInput.min}_getMaxDate(){return this._rangeInput.max}_getDateFilter(){return this._rangeInput.dateFilter}_parentDisabled(){return this._rangeInput._groupDisabled}_shouldHandleChangeEvent({source:e}){return e!==this._rangeInput._startInput&&e!==this._rangeInput._endInput}_assignValueProgrammatically(e,t){super._assignValueProgrammatically(e,t),(this===this._rangeInput._startInput?this._rangeInput._endInput:this._rangeInput._startInput)?._validatorOnChange(),this._rawValue.set(this._elementRef.nativeElement.value)}_formatValue(e){super._formatValue(e),this._rangeInput._handleChildValueChange()}_getAccessibleName(){return Na(this._elementRef.nativeElement)}static ɵfac=function(t){return new(t||r)};static ɵdir=PI({type:r,inputs:{errorStateMatcher:`errorStateMatcher`},features:[lp]})}return r})();var Cn=(()=>{class r extends ga{_startValidator=e=>{let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e.value)),a=this._model?this._model.selection.end:null;return!t||!a||this._dateAdapter.compareDate(t,a)<=0?null:{matStartDateInvalid:{end:a,actual:t}}};_validator=ge.compose([...super._getValidators(),this._startValidator]);_register(){this._rangeInput._startInput=this}_getValueFromModel(e){return e.start}_shouldHandleChangeEvent(e){return super._shouldHandleChangeEvent(e)?e.oldValue?.start?!e.selection.start||!!this._dateAdapter.compareDate(e.oldValue.start,e.selection.start):!!e.selection.start:!1}_assignValueToModel(e){if(this._model){let t=new v(e,this._model.selection.end);this._model.updateSelection(t,this),this._rangeInput._handleChildValueChange()}}_onKeydown(e){let t=this._rangeInput._endInput,a=this._elementRef.nativeElement,n=this._dir?.value!==`rtl`;(e.keyCode===39&&n||e.keyCode===37&&!n)&&a.selectionStart===a.value.length&&a.selectionEnd===a.value.length?(e.preventDefault(),t._elementRef.nativeElement.setSelectionRange(0,0),t.focus()):super._onKeydown(e)}static ɵfac=(()=>{let e;return function(a){return(e||(e=dm(r)))(a||r)}})();static ɵdir=PI({type:r,selectors:[[`input`,`matStartDate`,``]],hostAttrs:[`type`,`text`,1,`mat-start-date`,`mat-date-range-input-inner`],hostVars:5,hostBindings:function(t,a){t&1&&Gp(`input`,function(i){return a._onInput(i)})(`change`,function(){return a._onChange()})(`keydown`,function(i){return a._onKeydown(i)})(`blur`,function(){return a._onBlur()}),t&2&&(Mp(`disabled`,a.disabled),vp(`aria-haspopup`,a._rangeInput.rangePicker?`dialog`:null)(`aria-owns`,a._rangeInput._ariaOwns()||null)(`min`,a._getMinDate()?a._dateAdapter.toIso8601(a._getMinDate()):null)(`max`,a._getMaxDate()?a._dateAdapter.toIso8601(a._getMaxDate()):null))},outputs:{dateChange:`dateChange`,dateInput:`dateInput`},features:[$D([{provide:x$1,useExisting:r,multi:!0},{provide:m,useExisting:r,multi:!0}]),lp]})}return r})();var wn=(()=>{class r extends ga{_endValidator=e=>{let t=this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(e.value)),a=this._model?this._model.selection.start:null;return!t||!a||this._dateAdapter.compareDate(t,a)>=0?null:{matEndDateInvalid:{start:a,actual:t}}};_register(){this._rangeInput._endInput=this}_validator=ge.compose([...super._getValidators(),this._endValidator]);_getValueFromModel(e){return e.end}_shouldHandleChangeEvent(e){return super._shouldHandleChangeEvent(e)?e.oldValue?.end?!e.selection.end||!!this._dateAdapter.compareDate(e.oldValue.end,e.selection.end):!!e.selection.end:!1}_assignValueToModel(e){if(this._model){let t=new v(this._model.selection.start,e);this._model.updateSelection(t,this)}}_moveCaretToEndOfStartInput(){let e=this._rangeInput._startInput._elementRef.nativeElement,t=e.value;t.length>0&&e.setSelectionRange(t.length,t.length),e.focus()}_onKeydown(e){let t=this._elementRef.nativeElement,a=this._dir?.value!==`rtl`;e.keyCode===8&&!t.value?this._moveCaretToEndOfStartInput():(e.keyCode===37&&a||e.keyCode===39&&!a)&&t.selectionStart===0&&t.selectionEnd===0?(e.preventDefault(),this._moveCaretToEndOfStartInput()):super._onKeydown(e)}static ɵfac=(()=>{let e;return function(a){return(e||(e=dm(r)))(a||r)}})();static ɵdir=PI({type:r,selectors:[[`input`,`matEndDate`,``]],hostAttrs:[`type`,`text`,1,`mat-end-date`,`mat-date-range-input-inner`],hostVars:5,hostBindings:function(t,a){t&1&&Gp(`input`,function(i){return a._onInput(i)})(`change`,function(){return a._onChange()})(`keydown`,function(i){return a._onKeydown(i)})(`blur`,function(){return a._onBlur()}),t&2&&(Mp(`disabled`,a.disabled),vp(`aria-haspopup`,a._rangeInput.rangePicker?`dialog`:null)(`aria-owns`,a._rangeInput._ariaOwns()||null)(`min`,a._getMinDate()?a._dateAdapter.toIso8601(a._getMinDate()):null)(`max`,a._getMaxDate()?a._dateAdapter.toIso8601(a._getMaxDate()):null))},outputs:{dateChange:`dateChange`,dateInput:`dateInput`},features:[$D([{provide:x$1,useExisting:r,multi:!0},{provide:m,useExisting:r,multi:!0}]),lp]})}return r})();var kn=(()=>{class r extends Ye{_forwardContentValues(e){super._forwardContentValues(e);let t=this.datepickerInput;t&&(e.comparisonStart=t.comparisonStart,e.comparisonEnd=t.comparisonEnd,e.startDateAccessibleName=t._getStartDateAccessibleName(),e.endDateAccessibleName=t._getEndDateAccessibleName())}static ɵfac=(()=>{let e;return function(a){return(e||(e=dm(r)))(a||r)}})();static ɵcmp=AI({type:r,selectors:[[`mat-date-range-picker`]],exportAs:[`matDateRangePicker`],features:[$D([Ca,{provide:Pe,useFactory:()=>E(Pe,{optional:!0,skipSelf:!0})||new wa(E(l))},{provide:Ye,useExisting:r}]),lp],decls:0,vars:0,template:function(t,a){},encapsulation:2})}return r})();var An=(()=>{class r{static ɵfac=function(t){return new(t||r)};static ɵmod=kI({type:r});static ɵinj=fl({providers:[oe],imports:[Lt$1,te$1,Dt,T,ma,Va,pa,I$1,pe]})}return r})();export{Va as a,wn as c,Ea as i,Cn as n,_a as o,Dn as r,kn as s,An as t};