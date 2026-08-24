import {V as V$1}from'./chunk-BLinVcPb.js';import {av as kv,aw as dc,ax as w,cV as se,aR as g,br as xe,bo as Qn,az as T,aK as Pv,aX as Xp,aY as jS,y,b4 as LS,bH as ht,ay as $n,cc as ns,b7 as nt,b as Me,b1 as v,bI as Hs,bd as Eo,A as Av,aI as My,aL as Ca,aJ as Ny,aM as Ta,o as oy,aq as lf,a5 as qd,t as tm,i as iy,J as Jd,aD as zc,bk as zd}from'./main-374WDBS3.js';var V=["*",[["","matSortHeaderIcon",""]]],q=["*","[matSortHeaderIcon]"];function K(e,c){e&1&&(zc(),Ca(0,"svg",3),zd(1,"path",4),Ta());}function U(e,c){e&1&&(Ca(0,"div",2),Ny(1,1,null,K,2,0),Ta());}var L=new T("MAT_SORT_DEFAULT_OPTIONS"),W=(()=>{class e{_defaultOptions;_initializedStream=new se(1);sortables=new Map;_stateChanges=new g;active;start="asc";get direction(){return this._direction}set direction(t){this._direction=t;}_direction="";disableClear;disabled=false;sortChange=new xe;initialized=this._initializedStream;constructor(t){this._defaultOptions=t;}register(t){this.sortables.set(t.id,t);}deregister(t){this.sortables.delete(t.id);}sort(t){this.active!=t.id?(this.active=t.id,this.direction=t.start?t.start:this.start):this.direction=this.getNextSortDirection(t),this.sortChange.emit({active:this.active,direction:this.direction});}getNextSortDirection(t){if(!t)return "";let i=t?.disableClear??this.disableClear??!!this._defaultOptions?.disableClear,r=Z(t.start||this.start,i),n=r.indexOf(this.direction)+1;return n>=r.length&&(n=0),r[n]}ngOnInit(){this._initializedStream.next();}ngOnChanges(){this._stateChanges.next();}ngOnDestroy(){this._stateChanges.complete(),this._initializedStream.complete();}static \u0275fac=function(i){return new(i||e)(Qn(L,8))};static \u0275dir=Pv({type:e,selectors:[["","matSort",""]],hostAttrs:[1,"mat-sort"],inputs:{active:[0,"matSortActive","active"],start:[0,"matSortStart","start"],direction:[0,"matSortDirection","direction"],disableClear:[2,"matSortDisableClear","disableClear",jS],disabled:[2,"matSortDisabled","disabled",jS]},outputs:{sortChange:"matSortChange"},exportAs:["matSort"],features:[Xp]})}return e})();function Z(e,c){let t=["asc","desc"];return e=="desc"&&t.reverse(),c||t.push(""),t}var gt=(()=>{class e{_sort=y(W,{optional:true});_columnDef=y(V$1,{optional:true});_changeDetectorRef=y(LS);_focusMonitor=y(ht);_elementRef=y($n);_ariaDescriber=y(ns,{optional:true});_renderChanges;_animationsDisabled=nt();_recentlyCleared=Me(null);_sortButton;id;arrowPosition="after";start;disabled=false;get sortActionDescription(){return this._sortActionDescription}set sortActionDescription(t){this._updateSortActionDescription(t);}_sortActionDescription="Sort";disableClear;constructor(){y(v).load(Hs);let t=y(L,{optional:true});this._sort,t?.arrowPosition&&(this.arrowPosition=t?.arrowPosition);}ngOnInit(){!this.id&&this._columnDef&&(this.id=this._columnDef.name),this._sort.register(this),this._renderChanges=Eo(this._sort._stateChanges,this._sort.sortChange).subscribe(()=>this._changeDetectorRef.markForCheck()),this._sortButton=this._elementRef.nativeElement.querySelector(".mat-sort-header-container"),this._updateSortActionDescription(this._sortActionDescription);}ngAfterViewInit(){this._focusMonitor.monitor(this._elementRef,true).subscribe(()=>{Promise.resolve().then(()=>this._recentlyCleared.set(null));});}ngOnDestroy(){this._focusMonitor.stopMonitoring(this._elementRef),this._sort.deregister(this),this._renderChanges?.unsubscribe(),this._sortButton&&this._ariaDescriber?.removeDescription(this._sortButton,this._sortActionDescription);}_toggleOnInteraction(){if(!this._isDisabled()){let t=this._isSorted(),i=this._sort.direction;this._sort.sort(this),this._recentlyCleared.set(t&&!this._isSorted()?i:null);}}_handleKeydown(t){(t.keyCode===32||t.keyCode===13)&&(t.preventDefault(),this._toggleOnInteraction());}_isSorted(){return this._sort.active==this.id&&(this._sort.direction==="asc"||this._sort.direction==="desc")}_isDisabled(){return this._sort.disabled||this.disabled}_getAriaSortAttribute(){return this._isSorted()?this._sort.direction=="asc"?"ascending":"descending":"none"}_renderArrow(){return !this._isDisabled()||this._isSorted()}_updateSortActionDescription(t){this._sortButton&&(this._ariaDescriber?.removeDescription(this._sortButton,this._sortActionDescription),this._ariaDescriber?.describe(this._sortButton,t)),this._sortActionDescription=t;}static \u0275fac=function(i){return new(i||e)};static \u0275cmp=Av({type:e,selectors:[["","mat-sort-header",""]],hostAttrs:[1,"mat-sort-header"],hostVars:3,hostBindings:function(i,r){i&1&&Jd("click",function(){return r._toggleOnInteraction()})("keydown",function(Y){return r._handleKeydown(Y)})("mouseleave",function(){return r._recentlyCleared.set(null)}),i&2&&(qd("aria-sort",r._getAriaSortAttribute()),lf("mat-sort-header-disabled",r._isDisabled()));},inputs:{id:[0,"mat-sort-header","id"],arrowPosition:"arrowPosition",start:"start",disabled:[2,"disabled","disabled",jS],sortActionDescription:"sortActionDescription",disableClear:[2,"disableClear","disableClear",jS]},exportAs:["matSortHeader"],ngContentSelectors:q,decls:4,vars:17,consts:[[1,"mat-sort-header-container","mat-focus-indicator"],[1,"mat-sort-header-content"],[1,"mat-sort-header-arrow"],["viewBox","0 -960 960 960","focusable","false","aria-hidden","true"],["d","M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z"]],template:function(i,r){i&1&&(My(V),Ca(0,"div",0)(1,"div",1),Ny(2),Ta(),oy(3,U,3,0,"div",2),Ta()),i&2&&(lf("mat-sort-header-sorted",r._isSorted())("mat-sort-header-position-before",r.arrowPosition==="before")("mat-sort-header-descending",r._sort.direction==="desc")("mat-sort-header-ascending",r._sort.direction==="asc")("mat-sort-header-recently-cleared-ascending",r._recentlyCleared()==="asc")("mat-sort-header-recently-cleared-descending",r._recentlyCleared()==="desc")("mat-sort-header-animations-disabled",r._animationsDisabled),qd("tabindex",r._isDisabled()?null:0)("role",r._isDisabled()?null:"button"),tm(3),iy(r._renderArrow()?3:-1));},styles:[`.mat-sort-header {
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
  border-bottom: solid 1px currentColor;
}
.mat-sort-header-container::before {
  margin: calc(calc(var(--mat-focus-indicator-border-width, 3px) + 2px) * -1);
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
  color: var(--mat-sort-arrow-color, var(--mat-sys-on-surface));
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
`],encapsulation:2})}return e})(),bt=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=kv({type:e});static \u0275inj=dc({imports:[w]})}return e})();export{W,bt as b,gt as g};