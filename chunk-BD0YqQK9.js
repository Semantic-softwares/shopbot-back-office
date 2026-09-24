import{L as S,vt as se}from"./chunk-ZG_ciif-.js";import{Cn as kI,Dn as lE,E as Gp,Ft as aD,Gt as cE,H as Lt,Kn as ql,Or as yp,U as M,V as Ll,Wt as cA,X as Pe,Yt as dA,Z as Pl,Zn as rE,a as $v,fn as gE,fr as uE,gr as vc,i as $r,in as fA,it as SD,j as Ip,jn as mp,jr as zl,nr as sE,p as Cc,qt as ch,s as AI,sn as fl,v as E,vr as vp,yt as XE}from"./chunk-5XvVQiy2.js";import{O as le}from"./chunk-BDr1J6Tf.js";import{a as dt,t as Lt$1}from"./chunk-CcO9vZmb.js";import{_ as Z}from"./main-L7MY4SSX.js";import{o as Tn}from"./chunk-BzHQjT9s.js";import{t as c}from"./chunk-BIC9z6FB.js";import{n as Nt,r as Pt}from"./chunk-BHeFxZ_w.js";import{t as It$1}from"./chunk-B5y4KlAE.js";var it=(()=>{class o{changes=new S;itemsPerPageLabel=`Items per page:`;nextPageLabel=`Next page`;previousPageLabel=`Previous page`;firstPageLabel=`First page`;lastPageLabel=`Last page`;getRangeLabel=(e,a,s)=>{if(s==0||a==0)return`0 of ${s}`;s=Math.max(s,0);let d=e*a,b=d<s?Math.min(d+a,s):d+a;return`${d+1} \u2013 ${b} of ${s}`};static ɵfac=function(a){return new(a||o)};static ɵprov=Lt({token:o,factory:o.ɵfac})}return o})();var nt=50;var ot=new M(`MAT_PAGINATOR_DEFAULT_OPTIONS`);var rt=(()=>{class o{_intl=E(it);_changeDetectorRef=E(cA);_formFieldAppearance;_pageSizeLabelId=E(le).getId(`mat-paginator-page-size-label-`);_intlChanges;_isInitialized=!1;_initializedStream=new se(1);color;get pageIndex(){return this._pageIndex}set pageIndex(e){this._pageIndex=Math.max(e||0,0),this._changeDetectorRef.markForCheck()}_pageIndex=0;get length(){return this._length}set length(e){this._length=e||0,this._changeDetectorRef.markForCheck()}_length=0;get pageSize(){return this._pageSize}set pageSize(e){this._pageSize=Math.max(e||0,0),this._updateDisplayedPageSizeOptions()}_pageSize;get pageSizeOptions(){return this._pageSizeOptions}set pageSizeOptions(e){this._pageSizeOptions=(e||[]).map(a=>fA(a,0)),this._updateDisplayedPageSizeOptions()}_pageSizeOptions=[];hidePageSize=!1;showFirstLastButtons=!1;selectConfig={};disabled=!1;page=new Pe;_displayedPageSizeOptions;initialized=this._initializedStream;constructor(){let e=this._intl,a=E(ot,{optional:!0});if(this._intlChanges=e.changes.subscribe(()=>this._changeDetectorRef.markForCheck()),a){let{pageSize:s,pageSizeOptions:d,hidePageSize:b,showFirstLastButtons:M}=a;s!=null&&(this._pageSize=s),d!=null&&(this._pageSizeOptions=d),b!=null&&(this.hidePageSize=b),M!=null&&(this.showFirstLastButtons=M)}this._formFieldAppearance=a?.formFieldAppearance||`outline`}ngOnInit(){this._isInitialized=!0,this._updateDisplayedPageSizeOptions(),this._initializedStream.next()}ngOnDestroy(){this._initializedStream.complete(),this._intlChanges.unsubscribe()}nextPage(){this.hasNextPage()&&this._navigate(this.pageIndex+1)}previousPage(){this.hasPreviousPage()&&this._navigate(this.pageIndex-1)}firstPage(){this.hasPreviousPage()&&this._navigate(0)}lastPage(){this.hasNextPage()&&this._navigate(this.getNumberOfPages()-1)}hasPreviousPage(){return this.pageIndex>=1&&this.pageSize!=0}hasNextPage(){let e=this.getNumberOfPages()-1;return this.pageIndex<e&&this.pageSize!=0}getNumberOfPages(){return this.pageSize?Math.ceil(this.length/this.pageSize):0}_changePageSize(e){let a=this.pageIndex*this.pageSize,s=this.pageIndex;this.pageIndex=Math.floor(a/e)||0,this.pageSize=e,this._emitPageEvent(s)}_nextButtonsDisabled(){return this.disabled||!this.hasNextPage()}_previousButtonsDisabled(){return this.disabled||!this.hasPreviousPage()}_updateDisplayedPageSizeOptions(){this._isInitialized&&(this.pageSize||(this._pageSize=this.pageSizeOptions.length!=0?this.pageSizeOptions[0]:nt),this._displayedPageSizeOptions=this.pageSizeOptions.slice(),this._displayedPageSizeOptions.indexOf(this.pageSize)===-1&&this._displayedPageSizeOptions.push(this.pageSize),this._displayedPageSizeOptions.sort((e,a)=>e-a),this._changeDetectorRef.markForCheck())}_emitPageEvent(e){this.page.emit({previousPageIndex:e,pageIndex:this.pageIndex,pageSize:this.pageSize,length:this.length})}_navigate(e){let a=this.pageIndex;e!==a&&(this.pageIndex=e,this._emitPageEvent(a))}_buttonClicked(e,a){a||this._navigate(e)}static ɵfac=function(a){return new(a||o)};static ɵcmp=(function(){function e(i,g){if(i&1&&($r(0,`mat-option`,17),SD(1),vc()),i&2){let t=g.$implicit;yp(`value`,t),$v(),Cc(` `,t,` `)}}function a(i,g){if(i&1){let t=gE();$r(0,`mat-form-field`,14)(1,`mat-select`,16,0),Gp(`selectionChange`,function(p){Ll(t);let at=XE(2);return Pl(at._changePageSize(p.value))}),lE(3,e,2,2,`mat-option`,17,cE),vc(),$r(5,`div`,18),Gp(`click`,function(){Ll(t);let p=aD(2);return Pl(p.open())}),vc()()}if(i&2){let t=XE(2);yp(`appearance`,t._formFieldAppearance)(`color`,t.color),$v(),yp(`value`,t.pageSize)(`disabled`,t.disabled),mp(`aria-labelledby`,t._pageSizeLabelId),yp(`panelClass`,t.selectConfig.panelClass||``)(`disableOptionCentering`,t.selectConfig.disableOptionCentering),$v(2),uE(t._displayedPageSizeOptions)}}function s(i,g){if(i&1&&($r(0,`div`,15),SD(1),vc()),i&2){let t=XE(2);$v(),ch(t.pageSize)}}function d(i,g){if(i&1&&($r(0,`div`,3)(1,`div`,13),SD(2),vc(),rE(3,a,6,7,`mat-form-field`,14),rE(4,s,2,1,`div`,15),vc()),i&2){let t=XE();$v(),vp(`id`,t._pageSizeLabelId),$v(),Cc(` `,t._intl.itemsPerPageLabel,` `),$v(),sE(t._displayedPageSizeOptions.length>1?3:-1),$v(),sE(t._displayedPageSizeOptions.length<=1?4:-1)}}function b(i,g){if(i&1){let t=gE();$r(0,`button`,19),Gp(`click`,function(){Ll(t);let p=XE();return Pl(p._buttonClicked(0,p._previousButtonsDisabled()))}),ql(),$r(1,`svg`,8),Ip(2,`path`,20),vc()()}if(i&2){let t=XE();yp(`matTooltip`,t._intl.firstPageLabel)(`matTooltipDisabled`,t._previousButtonsDisabled())(`disabled`,t._previousButtonsDisabled())(`tabindex`,t._previousButtonsDisabled()?-1:null),vp(`aria-label`,t._intl.firstPageLabel)}}function M(i,g){if(i&1){let t=gE();$r(0,`button`,21),Gp(`click`,function(){Ll(t);let p=XE();return Pl(p._buttonClicked(p.getNumberOfPages()-1,p._nextButtonsDisabled()))}),ql(),$r(1,`svg`,8),Ip(2,`path`,22),vc()()}if(i&2){let t=XE();yp(`matTooltip`,t._intl.lastPageLabel)(`matTooltipDisabled`,t._nextButtonsDisabled())(`disabled`,t._nextButtonsDisabled())(`tabindex`,t._nextButtonsDisabled()?-1:null),vp(`aria-label`,t._intl.lastPageLabel)}}return AI({type:o,selectors:[[`mat-paginator`]],hostAttrs:[`role`,`group`,1,`mat-mdc-paginator`],inputs:{color:`color`,pageIndex:[2,`pageIndex`,`pageIndex`,fA],length:[2,`length`,`length`,fA],pageSize:[2,`pageSize`,`pageSize`,fA],pageSizeOptions:`pageSizeOptions`,hidePageSize:[2,`hidePageSize`,`hidePageSize`,dA],showFirstLastButtons:[2,`showFirstLastButtons`,`showFirstLastButtons`,dA],selectConfig:`selectConfig`,disabled:[2,`disabled`,`disabled`,dA]},outputs:{page:`page`},exportAs:[`matPaginator`],decls:14,vars:14,consts:[[`selectRef`,``],[1,`mat-mdc-paginator-outer-container`],[1,`mat-mdc-paginator-container`],[1,`mat-mdc-paginator-page-size`],[1,`mat-mdc-paginator-range-actions`],[`aria-atomic`,`true`,`aria-live`,`polite`,`role`,`status`,1,`mat-mdc-paginator-range-label`],[`matIconButton`,``,`type`,`button`,`matTooltipPosition`,`above`,`disabledInteractive`,``,1,`mat-mdc-paginator-navigation-first`,3,`matTooltip`,`matTooltipDisabled`,`disabled`,`tabindex`],[`matIconButton`,``,`type`,`button`,`matTooltipPosition`,`above`,`disabledInteractive`,``,1,`mat-mdc-paginator-navigation-previous`,3,`click`,`matTooltip`,`matTooltipDisabled`,`disabled`,`tabindex`],[`viewBox`,`0 0 24 24`,`focusable`,`false`,`aria-hidden`,`true`,1,`mat-mdc-paginator-icon`],[`d`,`M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z`],[`matIconButton`,``,`type`,`button`,`matTooltipPosition`,`above`,`disabledInteractive`,``,1,`mat-mdc-paginator-navigation-next`,3,`click`,`matTooltip`,`matTooltipDisabled`,`disabled`,`tabindex`],[`d`,`M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z`],[`matIconButton`,``,`type`,`button`,`matTooltipPosition`,`above`,`disabledInteractive`,``,1,`mat-mdc-paginator-navigation-last`,3,`matTooltip`,`matTooltipDisabled`,`disabled`,`tabindex`],[`aria-hidden`,`true`,1,`mat-mdc-paginator-page-size-label`],[1,`mat-mdc-paginator-page-size-select`,3,`appearance`,`color`],[1,`mat-mdc-paginator-page-size-value`],[`hideSingleSelectionIndicator`,``,3,`selectionChange`,`value`,`disabled`,`aria-labelledby`,`panelClass`,`disableOptionCentering`],[3,`value`],[1,`mat-mdc-paginator-touch-target`,3,`click`],[`matIconButton`,``,`type`,`button`,`matTooltipPosition`,`above`,`disabledInteractive`,``,1,`mat-mdc-paginator-navigation-first`,3,`click`,`matTooltip`,`matTooltipDisabled`,`disabled`,`tabindex`],[`d`,`M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z`],[`matIconButton`,``,`type`,`button`,`matTooltipPosition`,`above`,`disabledInteractive`,``,1,`mat-mdc-paginator-navigation-last`,3,`click`,`matTooltip`,`matTooltipDisabled`,`disabled`,`tabindex`],[`d`,`M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z`]],template:function(g,t){g&1&&($r(0,`div`,1)(1,`div`,2),rE(2,d,5,4,`div`,3),$r(3,`div`,4)(4,`div`,5),SD(5),vc(),rE(6,b,3,5,`button`,6),$r(7,`button`,7),Gp(`click`,function(){return t._buttonClicked(t.pageIndex-1,t._previousButtonsDisabled())}),ql(),$r(8,`svg`,8),Ip(9,`path`,9),vc()(),zl(),$r(10,`button`,10),Gp(`click`,function(){return t._buttonClicked(t.pageIndex+1,t._nextButtonsDisabled())}),ql(),$r(11,`svg`,8),Ip(12,`path`,11),vc()(),rE(13,M,3,5,`button`,12),vc()()()),g&2&&($v(2),sE(t.hidePageSize?-1:2),$v(3),Cc(` `,t._intl.getRangeLabel(t.pageIndex,t.pageSize,t.length),` `),$v(),sE(t.showFirstLastButtons?6:-1),$v(),yp(`matTooltip`,t._intl.previousPageLabel)(`matTooltipDisabled`,t._previousButtonsDisabled())(`disabled`,t._previousButtonsDisabled())(`tabindex`,t._previousButtonsDisabled()?-1:null),vp(`aria-label`,t._intl.previousPageLabel),$v(3),yp(`matTooltip`,t._intl.nextPageLabel)(`matTooltipDisabled`,t._nextButtonsDisabled())(`disabled`,t._nextButtonsDisabled())(`tabindex`,t._nextButtonsDisabled()?-1:null),vp(`aria-label`,t._intl.nextPageLabel),$v(3),sE(t.showFirstLastButtons?13:-1))},dependencies:[Tn,Nt,Z,dt,It$1],styles:[`.mat-mdc-paginator {
  display: block;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  color: var(--%NS%mat-paginator-container-text-color, var(--%NS%mat-sys-on-surface));
  background-color: var(--%NS%mat-paginator-container-background-color, var(--%NS%mat-sys-surface));
  font-family: var(--%NS%mat-paginator-container-text-font, var(--%NS%mat-sys-body-small-font));
  line-height: var(--%NS%mat-paginator-container-text-line-height, var(--%NS%mat-sys-body-small-line-height));
  font-size: var(--%NS%mat-paginator-container-text-size, var(--%NS%mat-sys-body-small-size));
  font-weight: var(--%NS%mat-paginator-container-text-weight, var(--%NS%mat-sys-body-small-weight));
  letter-spacing: var(--%NS%mat-paginator-container-text-tracking, var(--%NS%mat-sys-body-small-tracking));
  --%NS%mat-form-field-container-height: var(--%NS%mat-paginator-form-field-container-height, 40px);
  --%NS%mat-form-field-container-vertical-padding: var(--%NS%mat-paginator-form-field-container-vertical-padding, 8px);
}
.mat-mdc-paginator .mat-mdc-select-value {
  font-size: var(--%NS%mat-paginator-select-trigger-text-size, var(--%NS%mat-sys-body-small-size));
}
.mat-mdc-paginator .mat-mdc-form-field-subscript-wrapper {
  display: none;
}
.mat-mdc-paginator .mat-mdc-select {
  line-height: 1.5;
}

.mat-mdc-paginator-outer-container {
  display: flex;
}

.mat-mdc-paginator-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  flex-wrap: wrap;
  width: 100%;
  min-height: var(--%NS%mat-paginator-container-size, 56px);
}

.mat-mdc-paginator-page-size {
  display: flex;
  align-items: baseline;
  margin-right: 8px;
}
[dir=rtl] .mat-mdc-paginator-page-size {
  margin-right: 0;
  margin-left: 8px;
}

.mat-mdc-paginator-page-size-label {
  margin: 0 4px;
}

.mat-mdc-paginator-page-size-select {
  margin: 0 4px;
  width: var(--%NS%mat-paginator-page-size-select-width, 84px);
}

.mat-mdc-paginator-range-label {
  margin: 0 32px 0 24px;
}

.mat-mdc-paginator-range-actions {
  display: flex;
  align-items: center;
}

.mat-mdc-paginator-icon {
  display: inline-block;
  width: 28px;
  fill: var(--%NS%mat-paginator-enabled-icon-color, var(--%NS%mat-sys-on-surface-variant));
}
.mat-mdc-icon-button[aria-disabled] .mat-mdc-paginator-icon {
  fill: var(--%NS%mat-paginator-disabled-icon-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));
}
[dir=rtl] .mat-mdc-paginator-icon {
  transform: rotate(180deg);
}

@media (forced-colors: active) {
  .mat-mdc-icon-button[aria-disabled] .mat-mdc-paginator-icon,
  .mat-mdc-paginator-icon {
    fill: currentColor;
  }
  .mat-mdc-paginator-range-actions .mat-mdc-icon-button {
    outline: solid 1px;
  }
  .mat-mdc-paginator-range-actions .mat-mdc-icon-button[aria-disabled] {
    color: GrayText;
  }
}
.mat-mdc-paginator-touch-target {
  display: var(--%NS%mat-paginator-touch-target-display, block);
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--%NS%mat-paginator-page-size-select-width, 84px);
  height: var(--%NS%mat-paginator-page-size-select-touch-target-height, 48px);
  background-color: transparent;
  transform: translate(-50%, -50%);
  cursor: pointer;
}
`],encapsulation:2})})()}return o})();var It=(()=>{class o{static ɵfac=function(a){return new(a||o)};static ɵmod=kI({type:o});static ɵinj=fl({imports:[Lt$1,Pt,c,rt]})}return o})();export{rt as n,It as t};