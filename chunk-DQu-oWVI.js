import {y,ay as $n,aO as B,aN as l,cc as ns,bH as ht,b8 as m,bs as ne,bC as _o,cd as ee,ce as Nn,aP as Fm,b7 as nt$1,az as T,aS as As,cf as ge,aR as g,bc as Yn,cg as p,ch as Se,ci as st$1,cj as nt$2,B as w,ck as Ag,bO as tt$1,aK as Pv,aq as lf,b4 as LS,A as Av,aL as Ca,cl as Xd,d as Xy,aM as Ta,ad as $y,t as tm,m as mf,J as Jd,ae as nf,af as Sy,ag as by,ca as et$1}from'./main-JWBINLMV.js';var q=["tooltip"],K=20;var J=new T("mat-tooltip-scroll-strategy",{providedIn:"root",factory:()=>{let a=y(ne);return ()=>et$1(a,{scrollThrottle:K})}}),tt=new T("mat-tooltip-default-options",{providedIn:"root",factory:()=>({showDelay:0,hideDelay:0,touchendHideDelay:1500})});var Q="tooltip-panel",et={passive:true},it=8,ot=8,st=24,nt=200,It=(()=>{class a{_elementRef=y($n);_ngZone=y(B);_platform=y(l);_ariaDescriber=y(ns);_focusMonitor=y(ht);_dir=y(m);_injector=y(ne);_viewContainerRef=y(_o);_mediaMatcher=y(ee);_document=y(Nn);_renderer=y(Fm);_animationsDisabled=nt$1();_defaultOptions=y(tt,{optional:true});_overlayRef=null;_tooltipInstance=null;_overlayPanelClass;_portal;_position="below";_positionAtOrigin=false;_disabled=false;_tooltipClass;_viewInitialized=false;_pointerExitEventsInitialized=false;_tooltipComponent=at;_viewportMargin=8;_currentPosition;_cssClassPrefix="mat-mdc";_ariaDescriptionPending=false;_dirSubscribed=false;get position(){return this._position}set position(t){t!==this._position&&(this._position=t,this._overlayRef&&(this._updatePosition(this._overlayRef),this._tooltipInstance?.show(0),this._overlayRef.updatePosition()));}get positionAtOrigin(){return this._positionAtOrigin}set positionAtOrigin(t){this._positionAtOrigin=As(t),this._detach(),this._overlayRef=null;}get disabled(){return this._disabled}set disabled(t){let e=As(t);this._disabled!==e&&(this._disabled=e,e?this.hide(0):this._setupPointerEnterEventsIfNeeded(),this._syncAriaDescription(this.message));}get showDelay(){return this._showDelay}set showDelay(t){this._showDelay=ge(t);}_showDelay;get hideDelay(){return this._hideDelay}set hideDelay(t){this._hideDelay=ge(t),this._tooltipInstance&&(this._tooltipInstance._mouseLeaveHideDelay=this._hideDelay);}_hideDelay;touchGestures="auto";get message(){return this._message}set message(t){let e=this._message;this._message=t!=null?String(t).trim():"",!this._message&&this._isTooltipVisible()?this.hide(0):(this._setupPointerEnterEventsIfNeeded(),this._updateTooltipMessage()),this._syncAriaDescription(e);}_message="";get tooltipClass(){return this._tooltipClass}set tooltipClass(t){this._tooltipClass=t,this._tooltipInstance&&this._setTooltipClass(this._tooltipClass);}_eventCleanups=[];_touchstartTimeout=null;_destroyed=new g;_isDestroyed=false;constructor(){let t=this._defaultOptions;t&&(this._showDelay=t.showDelay,this._hideDelay=t.hideDelay,t.position&&(this.position=t.position),t.positionAtOrigin&&(this.positionAtOrigin=t.positionAtOrigin),t.touchGestures&&(this.touchGestures=t.touchGestures),t.tooltipClass&&(this.tooltipClass=t.tooltipClass)),this._viewportMargin=it;}ngAfterViewInit(){this._viewInitialized=true,this._setupPointerEnterEventsIfNeeded(),this._focusMonitor.monitor(this._elementRef).pipe(Yn(this._destroyed)).subscribe(t=>{t?t==="keyboard"&&this._ngZone.run(()=>this.show()):this._ngZone.run(()=>this.hide(0));});}ngOnDestroy(){let t=this._elementRef.nativeElement;this._touchstartTimeout&&clearTimeout(this._touchstartTimeout),this._overlayRef&&(this._overlayRef.dispose(),this._tooltipInstance=null),this._eventCleanups.forEach(e=>e()),this._eventCleanups.length=0,this._destroyed.next(),this._destroyed.complete(),this._isDestroyed=true,this._ariaDescriber.removeDescription(t,this.message,"tooltip"),this._focusMonitor.stopMonitoring(t);}show(t=this.showDelay,e){if(this.disabled||!this.message||this._isTooltipVisible()){this._tooltipInstance?._cancelPendingAnimations();return}let i=this._createOverlay(e);this._detach(),this._portal=this._portal||new p(this._tooltipComponent,this._viewContainerRef);let o=this._tooltipInstance=i.attach(this._portal).instance;o._triggerElement=this._elementRef.nativeElement,o._mouseLeaveHideDelay=this._hideDelay,o.afterHidden().pipe(Yn(this._destroyed)).subscribe(()=>this._detach()),this._setTooltipClass(this._tooltipClass),this._updateTooltipMessage(),o.show(t);}hide(t=this.hideDelay){let e=this._tooltipInstance;e&&(e.isVisible()?e.hide(t):(e._cancelPendingAnimations(),this._detach()));}toggle(t){this._isTooltipVisible()?this.hide():this.show(void 0,t);}_isTooltipVisible(){return !!this._tooltipInstance&&this._tooltipInstance.isVisible()}_createOverlay(t){if(this._overlayRef){let s=this._overlayRef.getConfig().positionStrategy;if((!this.positionAtOrigin||!t)&&s._origin instanceof $n)return this._overlayRef;this._detach();}let e=this._injector.get(Se).getAncestorScrollContainers(this._elementRef),i=`${this._cssClassPrefix}-${Q}`,o=st$1(this._injector,this.positionAtOrigin?t||this._elementRef:this._elementRef).withTransformOriginOn(`.${this._cssClassPrefix}-tooltip`).withFlexibleDimensions(false).withViewportMargin(this._viewportMargin).withScrollableContainers(e).withPopoverLocation("global");return o.positionChanges.pipe(Yn(this._destroyed)).subscribe(s=>{this._updateCurrentPositionClass(s.connectionPair),this._tooltipInstance&&s.scrollableViewProperties.isOverlayClipped&&this._tooltipInstance.isVisible()&&this._ngZone.run(()=>this.hide(0));}),this._overlayRef=nt$2(this._injector,{direction:this._dir,positionStrategy:o,panelClass:this._overlayPanelClass?[...this._overlayPanelClass,i]:i,scrollStrategy:this._injector.get(J)(),disableAnimations:this._animationsDisabled,eventPredicate:this._overlayEventPredicate}),this._updatePosition(this._overlayRef),this._overlayRef.detachments().pipe(Yn(this._destroyed)).subscribe(()=>this._detach()),this._overlayRef.outsidePointerEvents().pipe(Yn(this._destroyed)).subscribe(()=>this._tooltipInstance?._handleBodyInteraction()),this._overlayRef.keydownEvents().pipe(Yn(this._destroyed)).subscribe(s=>{s.preventDefault(),s.stopPropagation(),this._ngZone.run(()=>this.hide(0));}),this._defaultOptions?.disableTooltipInteractivity&&this._overlayRef.addPanelClass(`${this._cssClassPrefix}-tooltip-panel-non-interactive`),this._dirSubscribed||(this._dirSubscribed=true,this._dir.change.pipe(Yn(this._destroyed)).subscribe(()=>{this._overlayRef&&this._updatePosition(this._overlayRef);})),this._overlayRef}_detach(){this._overlayRef&&this._overlayRef.hasAttached()&&this._overlayRef.detach(),this._tooltipInstance=null;}_updatePosition(t){let e=t.getConfig().positionStrategy,i=this._getOrigin(),o=this._getOverlayPosition();e.withPositions([this._addOffset(w(w({},i.main),o.main)),this._addOffset(w(w({},i.fallback),o.fallback))]);}_addOffset(t){let e=ot,i=!this._dir||this._dir.value=="ltr";return t.originY==="top"?t.offsetY=-e:t.originY==="bottom"?t.offsetY=e:t.originX==="start"?t.offsetX=i?-e:e:t.originX==="end"&&(t.offsetX=i?e:-e),t}_getOrigin(){let t=!this._dir||this._dir.value=="ltr",e=this.position,i;e=="above"||e=="below"?i={originX:"center",originY:e=="above"?"top":"bottom"}:e=="before"||e=="left"&&t||e=="right"&&!t?i={originX:"start",originY:"center"}:(e=="after"||e=="right"&&t||e=="left"&&!t)&&(i={originX:"end",originY:"center"});let{x:o,y:s}=this._invertPosition(i.originX,i.originY);return {main:i,fallback:{originX:o,originY:s}}}_getOverlayPosition(){let t=!this._dir||this._dir.value=="ltr",e=this.position,i;e=="above"?i={overlayX:"center",overlayY:"bottom"}:e=="below"?i={overlayX:"center",overlayY:"top"}:e=="before"||e=="left"&&t||e=="right"&&!t?i={overlayX:"end",overlayY:"center"}:(e=="after"||e=="right"&&t||e=="left"&&!t)&&(i={overlayX:"start",overlayY:"center"});let{x:o,y:s}=this._invertPosition(i.overlayX,i.overlayY);return {main:i,fallback:{overlayX:o,overlayY:s}}}_updateTooltipMessage(){this._tooltipInstance&&(this._tooltipInstance.message=this.message,this._tooltipInstance._markForCheck(),Ag(()=>{this._tooltipInstance&&this._overlayRef.updatePosition();},{injector:this._injector}));}_setTooltipClass(t){this._tooltipInstance&&(this._tooltipInstance.tooltipClass=t instanceof Set?Array.from(t):t,this._tooltipInstance._markForCheck());}_invertPosition(t,e){return this.position==="above"||this.position==="below"?e==="top"?e="bottom":e==="bottom"&&(e="top"):t==="end"?t="start":t==="start"&&(t="end"),{x:t,y:e}}_updateCurrentPositionClass(t){let{overlayY:e,originX:i,originY:o}=t,s;if(e==="center"?this._dir&&this._dir.value==="rtl"?s=i==="end"?"left":"right":s=i==="start"?"left":"right":s=e==="bottom"&&o==="top"?"above":"below",s!==this._currentPosition){let d=this._overlayRef;if(d){let b=`${this._cssClassPrefix}-${Q}-`;d.removePanelClass(b+this._currentPosition),d.addPanelClass(b+s);}this._currentPosition=s;}}_setupPointerEnterEventsIfNeeded(){this._disabled||!this.message||!this._viewInitialized||this._eventCleanups.length||(this._isTouchPlatform()?this.touchGestures!=="off"&&(this._disableNativeGesturesIfNecessary(),this._addListener("touchstart",t=>{let e=t.targetTouches?.[0],i=e?{x:e.clientX,y:e.clientY}:void 0;this._setupPointerExitEventsIfNeeded(),this._touchstartTimeout&&clearTimeout(this._touchstartTimeout);let o=500;this._touchstartTimeout=setTimeout(()=>{this._touchstartTimeout=null,this.show(void 0,i);},this._defaultOptions?.touchLongPressShowDelay??o);})):this._addListener("mouseenter",t=>{this._setupPointerExitEventsIfNeeded();let e;t.x!==void 0&&t.y!==void 0&&(e=t),this.show(void 0,e);}));}_setupPointerExitEventsIfNeeded(){if(!this._pointerExitEventsInitialized){if(this._pointerExitEventsInitialized=true,!this._isTouchPlatform())this._addListener("mouseleave",t=>{let e=t.relatedTarget;(!e||!this._overlayRef?.overlayElement.contains(e))&&this.hide();}),this._addListener("wheel",t=>{if(this._isTooltipVisible()){let e=this._document.elementFromPoint(t.clientX,t.clientY),i=this._elementRef.nativeElement;e!==i&&!i.contains(e)&&this.hide();}});else if(this.touchGestures!=="off"){this._disableNativeGesturesIfNecessary();let t=()=>{this._touchstartTimeout&&clearTimeout(this._touchstartTimeout),this.hide(this._defaultOptions?.touchendHideDelay);};this._addListener("touchend",t),this._addListener("touchcancel",t);}}}_addListener(t,e){this._eventCleanups.push(this._renderer.listen(this._elementRef.nativeElement,t,e,et));}_isTouchPlatform(){let t=this._defaultOptions?.detectHoverCapability;return typeof t=="function"?!t():this._platform.IOS||this._platform.ANDROID?true:this._platform.isBrowser?!!t&&this._mediaMatcher.matchMedia("(any-hover: none)").matches:false}_disableNativeGesturesIfNecessary(){let t=this.touchGestures;if(t!=="off"){let e=this._elementRef.nativeElement,i=e.style;(t==="on"||e.nodeName!=="INPUT"&&e.nodeName!=="TEXTAREA")&&(i.userSelect=i.msUserSelect=i.webkitUserSelect=i.MozUserSelect="none"),(t==="on"||!e.draggable)&&(i.webkitUserDrag="none"),i.touchAction="none",i.webkitTapHighlightColor="transparent";}}_syncAriaDescription(t){this._ariaDescriptionPending||(this._ariaDescriptionPending=true,this._ariaDescriber.removeDescription(this._elementRef.nativeElement,t,"tooltip"),this._isDestroyed||Ag({write:()=>{this._ariaDescriptionPending=false,this.message&&!this.disabled&&this._ariaDescriber.describe(this._elementRef.nativeElement,this.message,"tooltip");}},{injector:this._injector}));}_overlayEventPredicate=t=>t.type==="keydown"?this._isTooltipVisible()&&t.keyCode===27&&!tt$1(t):true;static \u0275fac=function(e){return new(e||a)};static \u0275dir=Pv({type:a,selectors:[["","matTooltip",""]],hostAttrs:[1,"mat-mdc-tooltip-trigger"],hostVars:2,hostBindings:function(e,i){e&2&&lf("mat-mdc-tooltip-disabled",i.disabled);},inputs:{position:[0,"matTooltipPosition","position"],positionAtOrigin:[0,"matTooltipPositionAtOrigin","positionAtOrigin"],disabled:[0,"matTooltipDisabled","disabled"],showDelay:[0,"matTooltipShowDelay","showDelay"],hideDelay:[0,"matTooltipHideDelay","hideDelay"],touchGestures:[0,"matTooltipTouchGestures","touchGestures"],message:[0,"matTooltip","message"],tooltipClass:[0,"matTooltipClass","tooltipClass"]},exportAs:["matTooltip"]})}return a})(),at=(()=>{class a{_changeDetectorRef=y(LS);_elementRef=y($n);_isMultiline=false;message;tooltipClass;_showTimeoutId;_hideTimeoutId;_triggerElement;_mouseLeaveHideDelay;_animationsDisabled=nt$1();_tooltip;_closeOnInteraction=false;_isVisible=false;_onHide=new g;_showAnimation="mat-mdc-tooltip-show";_hideAnimation="mat-mdc-tooltip-hide";constructor(){}show(t){this._hideTimeoutId!=null&&clearTimeout(this._hideTimeoutId),this._showTimeoutId=setTimeout(()=>{this._toggleVisibility(true),this._showTimeoutId=void 0;},t);}hide(t){this._showTimeoutId!=null&&clearTimeout(this._showTimeoutId),this._hideTimeoutId=setTimeout(()=>{this._toggleVisibility(false),this._hideTimeoutId=void 0;},t);}afterHidden(){return this._onHide}isVisible(){return this._isVisible}ngOnDestroy(){this._cancelPendingAnimations(),this._onHide.complete(),this._triggerElement=null;}_handleBodyInteraction(){this._closeOnInteraction&&this.hide(0);}_markForCheck(){this._changeDetectorRef.markForCheck();}_handleMouseLeave({relatedTarget:t}){(!t||!this._triggerElement.contains(t))&&(this.isVisible()?this.hide(this._mouseLeaveHideDelay):this._finalizeAnimation(false));}_onShow(){this._isMultiline=this._isTooltipMultiline(),this._markForCheck();}_isTooltipMultiline(){let t=this._elementRef.nativeElement.getBoundingClientRect();return t.height>st&&t.width>=nt}_handleAnimationEnd({animationName:t}){(t===this._showAnimation||t===this._hideAnimation)&&this._finalizeAnimation(t===this._showAnimation);}_cancelPendingAnimations(){this._showTimeoutId!=null&&clearTimeout(this._showTimeoutId),this._hideTimeoutId!=null&&clearTimeout(this._hideTimeoutId),this._showTimeoutId=this._hideTimeoutId=void 0;}_finalizeAnimation(t){t?this._closeOnInteraction=true:this.isVisible()||this._onHide.next();}_toggleVisibility(t){let e=this._tooltip.nativeElement,i=this._showAnimation,o=this._hideAnimation;if(e.classList.remove(t?o:i),e.classList.add(t?i:o),this._isVisible!==t&&(this._isVisible=t,this._changeDetectorRef.markForCheck()),t&&!this._animationsDisabled&&typeof getComputedStyle=="function"){let s=getComputedStyle(e);(s.getPropertyValue("animation-duration")==="0s"||s.getPropertyValue("animation-name")==="none")&&(this._animationsDisabled=true);}t&&this._onShow(),this._animationsDisabled&&(e.classList.add("_mat-animation-noopable"),this._finalizeAnimation(t));}static \u0275fac=function(e){return new(e||a)};static \u0275cmp=Av({type:a,selectors:[["mat-tooltip-component"]],viewQuery:function(e,i){if(e&1&&nf(q,7),e&2){let o;Sy(o=by())&&(i._tooltip=o.first);}},hostAttrs:["aria-hidden","true"],hostBindings:function(e,i){e&1&&Jd("mouseleave",function(s){return i._handleMouseLeave(s)});},decls:4,vars:5,consts:[["tooltip",""],[1,"mdc-tooltip","mat-mdc-tooltip",3,"animationend"],[1,"mat-mdc-tooltip-surface","mdc-tooltip__surface"]],template:function(e,i){e&1&&(Ca(0,"div",1,0),Xd("animationend",function(s){return i._handleAnimationEnd(s)}),Ca(2,"div",2),Xy(3),Ta()()),e&2&&($y(i.tooltipClass),lf("mdc-tooltip--multiline",i._isMultiline),tm(3),mf(i.message));},styles:[`.mat-mdc-tooltip {
  position: relative;
  transform: scale(0);
  display: inline-flex;
}
.mat-mdc-tooltip::before {
  content: "";
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
  position: absolute;
}
.mat-mdc-tooltip-panel-below .mat-mdc-tooltip::before {
  top: -8px;
}
.mat-mdc-tooltip-panel-above .mat-mdc-tooltip::before {
  bottom: -8px;
}
.mat-mdc-tooltip-panel-right .mat-mdc-tooltip::before {
  left: -8px;
}
.mat-mdc-tooltip-panel-left .mat-mdc-tooltip::before {
  right: -8px;
}
.mat-mdc-tooltip._mat-animation-noopable {
  animation: none;
  transform: scale(1);
}

.mat-mdc-tooltip-surface {
  word-break: normal;
  overflow-wrap: anywhere;
  padding: 4px 8px;
  min-width: 40px;
  max-width: 200px;
  min-height: 24px;
  max-height: 40vh;
  box-sizing: border-box;
  overflow: hidden;
  text-align: center;
  will-change: transform, opacity;
  background-color: var(--mat-tooltip-container-color, var(--mat-sys-inverse-surface));
  color: var(--mat-tooltip-supporting-text-color, var(--mat-sys-inverse-on-surface));
  border-radius: var(--mat-tooltip-container-shape, var(--mat-sys-corner-extra-small));
  font-family: var(--mat-tooltip-supporting-text-font, var(--mat-sys-body-small-font));
  font-size: var(--mat-tooltip-supporting-text-size, var(--mat-sys-body-small-size));
  font-weight: var(--mat-tooltip-supporting-text-weight, var(--mat-sys-body-small-weight));
  line-height: var(--mat-tooltip-supporting-text-line-height, var(--mat-sys-body-small-line-height));
  letter-spacing: var(--mat-tooltip-supporting-text-tracking, var(--mat-sys-body-small-tracking));
}
.mat-mdc-tooltip-surface::before {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 1px solid transparent;
  border-radius: inherit;
  content: "";
  pointer-events: none;
}
.mdc-tooltip--multiline .mat-mdc-tooltip-surface {
  text-align: left;
}
[dir=rtl] .mdc-tooltip--multiline .mat-mdc-tooltip-surface {
  text-align: right;
}

.mat-mdc-tooltip-panel {
  line-height: normal;
}
.mat-mdc-tooltip-panel.mat-mdc-tooltip-panel-non-interactive {
  pointer-events: none;
}

@keyframes mat-mdc-tooltip-show {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes mat-mdc-tooltip-hide {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}
.mat-mdc-tooltip-show {
  animation: mat-mdc-tooltip-show 150ms cubic-bezier(0, 0, 0.2, 1) forwards;
}

.mat-mdc-tooltip-hide {
  animation: mat-mdc-tooltip-hide 75ms cubic-bezier(0.4, 0, 1, 1) forwards;
}
`],encapsulation:2})}return a})();export{It as I};