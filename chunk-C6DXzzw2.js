import{c as z}from"./chunk-RykAvsdd.js";import{Et as du,N as Mf,p as Fe,x as I}from"./chunk-CgfKpzS6.js";import{A as Ge,An as em,Bn as ir,Ir as uw,Kr as y,Mn as eu,P as Hd,Rn as iM,Sn as dT,Sr as sN,Tr as sw,Tt as S_,_r as rN,at as Mm,gr as rM,mn as cI,mr as qL,ni as zo,nn as Ze,ot as N,p as Cm,q as Jm,qt as Xl,t as $L,xn as cv,zt as Ws}from"./chunk-B6U3JfLt.js";import{An as cn,Bt as ce,Dn as ai,Qn as L,Rt as Fe$1,dn as Fi,qn as ut,rn as _,tn as O,tr as x,xn as Ut}from"./chunk-CkovQuke.js";import{c as j,n as Je}from"./chunk-DIn3XUkK.js";function ae(t,q){let e=[`asc`,`desc`];return t==`desc`&&e.reverse(),q||e.push(``),e}var Z;var re;var Ie;var ke;var ne=z(()=>{"use strict";S_();S_();du();ai();L();Je();Ut();ce();_();Z=new N(`MAT_SORT_DEFAULT_OPTIONS`),re=(()=>{class t{_defaultOptions;_initializedStream=new Fe(1);sortables=new Map;_stateChanges=new I;active;start=`asc`;get direction(){return this._direction}set direction(e){this._direction=e}_direction=``;disableClear;disabled=!1;sortChange=new Ze;initialized=this._initializedStream;constructor(e){this._defaultOptions=e}register(e){this.sortables.set(e.id,e)}deregister(e){this.sortables.delete(e.id)}sort(e){this.active!=e.id?(this.active=e.id,this.direction=e.start?e.start:this.start):this.direction=this.getNextSortDirection(e),this.sortChange.emit({active:this.active,direction:this.direction})}getNextSortDirection(e){if(!e)return``;let a=e?.disableClear??this.disableClear??!!this._defaultOptions?.disableClear,i=ae(e.start||this.start,a),s=i.indexOf(this.direction)+1;return s>=i.length&&(s=0),i[s]}ngOnInit(){this._initializedStream.next()}ngOnChanges(){this._stateChanges.next()}ngOnDestroy(){this._stateChanges.complete(),this._initializedStream.complete()}static ɵfac=function(a){return new(a||t)(ir(Z,8))};static ɵdir=uw({type:t,selectors:[[``,`matSort`,``]],hostAttrs:[1,`mat-sort`],inputs:{active:[0,`matSortActive`,`active`],start:[0,`matSortStart`,`start`],direction:[0,`matSortDirection`,`direction`],disableClear:[2,`matSortDisableClear`,`disableClear`,qL],disabled:[2,`matSortDisabled`,`disabled`,qL]},outputs:{sortChange:`matSortChange`},exportAs:[`matSort`],features:[cI]})}return t})();Ie=(()=>{class t{_sort=y(re,{optional:!0});_columnDef=y(j,{optional:!0});_changeDetectorRef=y($L);_focusMonitor=y(ut);_elementRef=y(zo);_ariaDescriber=y(cn,{optional:!0});_renderChanges;_animationsDisabled=Fi();_recentlyCleared=Ge(null);_sortButton;id;arrowPosition=`after`;start;disabled=!1;get sortActionDescription(){return this._sortActionDescription}set sortActionDescription(e){this._updateSortActionDescription(e)}_sortActionDescription=`Sort`;disableClear;constructor(){y(x).load(Fe$1);let e=y(Z,{optional:!0});this._sort,e?.arrowPosition&&(this.arrowPosition=e?.arrowPosition)}ngOnInit(){!this.id&&this._columnDef&&(this.id=this._columnDef.name),this._sort.register(this),this._renderChanges=Mf(this._sort._stateChanges,this._sort.sortChange).subscribe(()=>this._changeDetectorRef.markForCheck()),this._sortButton=this._elementRef.nativeElement.querySelector(`.mat-sort-header-container`),this._updateSortActionDescription(this._sortActionDescription)}ngAfterViewInit(){this._focusMonitor.monitor(this._elementRef,!0).subscribe(()=>{Promise.resolve().then(()=>this._recentlyCleared.set(null))})}ngOnDestroy(){this._focusMonitor.stopMonitoring(this._elementRef),this._sort.deregister(this),this._renderChanges?.unsubscribe(),this._sortButton&&this._ariaDescriber?.removeDescription(this._sortButton,this._sortActionDescription)}_toggleOnInteraction(){if(!this._isDisabled()){let e=this._isSorted(),a=this._sort.direction;this._sort.sort(this),this._recentlyCleared.set(e&&!this._isSorted()?a:null)}}_handleKeydown(e){(e.keyCode===32||e.keyCode===13)&&(e.preventDefault(),this._toggleOnInteraction())}_isSorted(){return this._sort.active==this.id&&(this._sort.direction===`asc`||this._sort.direction===`desc`)}_isDisabled(){return this._sort.disabled||this.disabled}_getAriaSortAttribute(){return this._isSorted()?this._sort.direction==`asc`?`ascending`:`descending`:`none`}_renderArrow(){return!this._isDisabled()||this._isSorted()}_updateSortActionDescription(e){this._sortButton&&(this._ariaDescriber?.removeDescription(this._sortButton,this._sortActionDescription),this._ariaDescriber?.describe(this._sortButton,e)),this._sortActionDescription=e}static ɵfac=function(a){return new(a||t)};static ɵcmp=(function(){let e=[`*`,[[``,`matSortHeaderIcon`,``]]],a=[`*`,`[matSortHeaderIcon]`];function i(d,o){d&1&&(Hd(),Xl(0,`svg`,3),Mm(1,`path`,4),eu())}function s(d,o){d&1&&(Xl(0,`div`,2),iM(1,1,null,i,2,0),eu())}return sw({type:t,selectors:[[``,`mat-sort-header`,``]],hostAttrs:[1,`mat-sort-header`],hostVars:3,hostBindings:function(o,r){o&1&&Jm(`click`,function(){return r._toggleOnInteraction()})(`keydown`,function(K){return r._handleKeydown(K)})(`mouseleave`,function(){return r._recentlyCleared.set(null)}),o&2&&(Cm(`aria-sort`,r._getAriaSortAttribute()),cv(`mat-sort-header-disabled`,r._isDisabled()))},inputs:{id:[0,`mat-sort-header`,`id`],arrowPosition:`arrowPosition`,start:`start`,disabled:[2,`disabled`,`disabled`,qL],sortActionDescription:`sortActionDescription`,disableClear:[2,`disableClear`,`disableClear`,qL]},exportAs:[`matSortHeader`],ngContentSelectors:a,decls:4,vars:17,consts:[[1,`mat-sort-header-container`,`mat-focus-indicator`],[1,`mat-sort-header-content`],[1,`mat-sort-header-arrow`],[`viewBox`,`0 -960 960 960`,`focusable`,`false`,`aria-hidden`,`true`],[`d`,`M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z`]],template:function(o,r){o&1&&(rM(e),Xl(0,`div`,0)(1,`div`,1),iM(2),eu(),rN(3,s,3,0,`div`,2),eu()),o&2&&(cv(`mat-sort-header-sorted`,r._isSorted())(`mat-sort-header-position-before`,r.arrowPosition===`before`)(`mat-sort-header-descending`,r._sort.direction===`desc`)(`mat-sort-header-ascending`,r._sort.direction===`asc`)(`mat-sort-header-recently-cleared-ascending`,r._recentlyCleared()===`asc`)(`mat-sort-header-recently-cleared-descending`,r._recentlyCleared()===`desc`)(`mat-sort-header-animations-disabled`,r._animationsDisabled),Cm(`tabindex`,r._isDisabled()?null:0)(`role`,r._isDisabled()?null:`button`),dT(3),sN(r._renderArrow()?3:-1))},styles:[`.mat-sort-header {
  cursor: pointer;
}

.mat-sort-header-disabled {
  cursor: default;
}

.mat-sort-header-container {
  display: flex;
  align-items: center;
  letter-spacing: normal;
  outline: 0;
}
[mat-sort-header].cdk-keyboard-focused .mat-sort-header-container, [mat-sort-header].cdk-program-focused .mat-sort-header-container {
  border-bottom: var(--%NS%mat-focus-indicator-fallback-border-style, solid) 1px currentColor;
}
.mat-sort-header-container::before {
  margin: calc(calc(var(--%NS%mat-focus-indicator-border-width, 3px) + 4px) * -1);
}

.mat-sort-header-content {
  display: flex;
  align-items: center;
}

.mat-sort-header-position-before {
  flex-direction: row-reverse;
}

@keyframes _mat-sort-header-recently-cleared-ascending {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-25%);
    opacity: 0;
  }
}
@keyframes _mat-sort-header-recently-cleared-descending {
  from {
    transform: translateY(0) rotate(180deg);
    opacity: 1;
  }
  to {
    transform: translateY(25%) rotate(180deg);
    opacity: 0;
  }
}
.mat-sort-header-arrow {
  height: 12px;
  width: 12px;
  position: relative;
  transition: transform 225ms cubic-bezier(0.4, 0, 0.2, 1), opacity 225ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  overflow: visible;
  color: var(--%NS%mat-sort-arrow-color, var(--%NS%mat-sys-on-surface));
}
.mat-sort-header.cdk-keyboard-focused .mat-sort-header-arrow, .mat-sort-header.cdk-program-focused .mat-sort-header-arrow, .mat-sort-header:hover .mat-sort-header-arrow {
  opacity: 0.54;
}
.mat-sort-header .mat-sort-header-sorted .mat-sort-header-arrow {
  opacity: 1;
}
.mat-sort-header-descending .mat-sort-header-arrow {
  transform: rotate(180deg);
}
.mat-sort-header-recently-cleared-ascending .mat-sort-header-arrow {
  transform: translateY(-25%);
}
.mat-sort-header-recently-cleared-ascending .mat-sort-header-arrow {
  transition: none;
  animation: _mat-sort-header-recently-cleared-ascending 225ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.mat-sort-header-recently-cleared-descending .mat-sort-header-arrow {
  transition: none;
  animation: _mat-sort-header-recently-cleared-descending 225ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.mat-sort-header-animations-disabled .mat-sort-header-arrow {
  transition-duration: 0ms;
  animation-duration: 0ms;
}
.mat-sort-header-arrow > svg, .mat-sort-header-arrow [matSortHeaderIcon] {
  width: 24px;
  height: 24px;
  fill: currentColor;
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -12px 0 0 -12px;
  transform: translateZ(0);
}
.mat-sort-header-arrow, [dir=rtl] .mat-sort-header-position-before .mat-sort-header-arrow {
  margin: 0 0 0 6px;
}
.mat-sort-header-position-before .mat-sort-header-arrow, [dir=rtl] .mat-sort-header-arrow {
  margin: 0 6px 0 0;
}
`],encapsulation:2})})()}return t})(),ke=(()=>{class t{static ɵfac=function(a){return new(a||t)};static ɵmod=em({type:t});static ɵinj=Ws({imports:[O]})}return t})()});export{re as i,ke as n,ne as r,Ie as t};