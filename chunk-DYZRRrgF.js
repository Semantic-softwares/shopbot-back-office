import{i as w}from"./chunk-B9dn0NrW.js";import{In as ne,Ot as Z$1,U as M,Y as PI,hn as ho,lr as th,s as AI,v as E}from"./chunk-5XvVQiy2.js";import{i as w$1}from"./chunk-JltcrRJr.js";import{A as ne$1,I as v,N as se$1,_ as Ue,i as C,p as Jt,w as h}from"./chunk-BDr1J6Tf.js";var u;var H=[`color`,`button`,`checkbox`,`date`,`datetime-local`,`email`,`file`,`hidden`,`image`,`month`,`number`,`password`,`radio`,`range`,`reset`,`search`,`submit`,`tel`,`text`,`time`,`url`,`week`];function se(){if(u)return u;if(typeof document!=`object`||!document)return u=new Set(H),u;let s=document.createElement(`input`);return u=new Set(H.filter(e=>(s.setAttribute(`type`,e),s.type===e))),u}var l=(function(s){return s[s.FADING_IN=0]=`FADING_IN`,s[s.VISIBLE=1]=`VISIBLE`,s[s.FADING_OUT=2]=`FADING_OUT`,s[s.HIDDEN=3]=`HIDDEN`,s})(l||{});var T=class{_renderer;element;config;_animationForciblyDisabledThroughCss;state=l.HIDDEN;constructor(e,t,n,i=!1){this._renderer=e,this.element=t,this.config=n,this._animationForciblyDisabledThroughCss=i}fadeOut(){this._renderer.fadeOutRipple(this)}};var z=Ue({passive:!0,capture:!0});var D=class{_events=new Map;addHandler(e,t,n,i){let r=this._events.get(t);if(r){let p=r.get(n);p?p.add(i):r.set(n,new Set([i]))}else this._events.set(t,new Map([[n,new Set([i])]])),e.runOutsideAngular(()=>{document.addEventListener(t,this._delegateEventHandler,z)})}removeHandler(e,t,n){let i=this._events.get(e);if(!i)return;let r=i.get(t);r&&(r.delete(n),r.size===0&&i.delete(t),i.size===0&&(this._events.delete(e),document.removeEventListener(e,this._delegateEventHandler,z)))}_delegateEventHandler=e=>{let t=C(e);t&&this._events.get(e.type)?.forEach((n,i)=>{(i===t||i.contains(t))&&n.forEach(r=>r.handleEvent(e))})}};var B={enterDuration:225,exitDuration:150};var J=800;var G=Ue({passive:!0,capture:!0});var V=[`mousedown`,`touchstart`];var Z=[`mouseup`,`mouseleave`,`touchend`,`touchcancel`];var K=(()=>{class s{static ɵfac=function(n){return new(n||s)};static ɵcmp=AI({type:s,selectors:[[`ng-component`]],hostAttrs:[`mat-ripple-style-loader`,``],decls:0,vars:0,template:function(n,i){},styles:[`.mat-ripple {
  overflow: hidden;
  position: relative;
}
.mat-ripple:not(:empty) {
  transform: translateZ(0);
}

.mat-ripple.mat-ripple-unbounded {
  overflow: visible;
}

.mat-ripple-element {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  transition: opacity, transform 0ms cubic-bezier(0, 0, 0.2, 1);
  transform: scale3d(0, 0, 0);
  background-color: var(--%NS%mat-ripple-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 10%, transparent));
}
@media (forced-colors: active) {
  .mat-ripple-element {
    display: none;
  }
}
.cdk-drag-preview .mat-ripple-element, .cdk-drag-placeholder .mat-ripple-element {
  display: none;
}
`],encapsulation:2})}return s})();var R=class s{_target;_ngZone;_platform;_containerElement;_triggerElement=null;_isPointerDown=!1;_activeRipples=new Map;_mostRecentTransientRipple=null;_lastTouchStartEvent;_pointerUpEventsRegistered=!1;_containerRect=null;static _eventManager=new D;constructor(e,t,n,i,r){this._target=e,this._ngZone=t,this._platform=i,i.isBrowser&&(this._containerElement=v(n)),r&&r.get(w$1).load(K)}fadeInRipple(e,t,n={}){let i=this._containerRect=this._containerRect||this._containerElement.getBoundingClientRect(),r=w(w({},B),n.animation);n.centered&&(e=i.left+i.width/2,t=i.top+i.height/2);let p=n.radius||Q(e,t,i),$=e-i.left,j=t-i.top,m=r.enterDuration,o=document.createElement(`div`);o.classList.add(`mat-ripple-element`),o.style.left=`${$-p}px`,o.style.top=`${j-p}px`,o.style.height=`${p*2}px`,o.style.width=`${p*2}px`,n.color!=null&&(o.style.backgroundColor=n.color),o.style.transitionDuration=`${m}ms`,this._containerElement.appendChild(o);let I=window.getComputedStyle(o),Y=I.transitionProperty,w$2=I.transitionDuration,_=Y===`none`||w$2===`0s`||w$2===`0s, 0s`||i.width===0&&i.height===0,d=new T(this,o,n,_);o.style.transform=`scale3d(1, 1, 1)`,d.state=l.FADING_IN,n.persistent||(this._mostRecentTransientRipple=d);let f=null;return!_&&(m||r.exitDuration)&&this._ngZone.runOutsideAngular(()=>{let M=()=>{f&&(f.fallbackTimer=null),clearTimeout(N),this._finishRippleTransition(d)},v=()=>this._destroyRipple(d),N=setTimeout(v,m+100);o.addEventListener(`transitionend`,M),o.addEventListener(`transitioncancel`,v),f={onTransitionEnd:M,onTransitionCancel:v,fallbackTimer:N}}),this._activeRipples.set(d,f),(_||!m)&&this._finishRippleTransition(d),d}fadeOutRipple(e){if(e.state===l.FADING_OUT||e.state===l.HIDDEN)return;let t=e.element,n=w(w({},B),e.config.animation);t.style.transitionDuration=`${n.exitDuration}ms`,t.style.opacity=`0`,e.state=l.FADING_OUT,(e._animationForciblyDisabledThroughCss||!n.exitDuration)&&this._finishRippleTransition(e)}fadeOutAll(){this._getActiveRipples().forEach(e=>e.fadeOut())}fadeOutAllNonPersistent(){this._getActiveRipples().forEach(e=>{e.config.persistent||e.fadeOut()})}setupTriggerEvents(e){let t=v(e);!this._platform.isBrowser||!t||t===this._triggerElement||(this._removeTriggerEvents(),this._triggerElement=t,V.forEach(n=>{s._eventManager.addHandler(this._ngZone,n,t,this)}))}handleEvent(e){e.type===`mousedown`?this._onMousedown(e):e.type===`touchstart`?this._onTouchStart(e):this._onPointerUp(),this._pointerUpEventsRegistered||(this._ngZone.runOutsideAngular(()=>{Z.forEach(t=>{this._triggerElement.addEventListener(t,this,G)})}),this._pointerUpEventsRegistered=!0)}_finishRippleTransition(e){e.state===l.FADING_IN?this._startFadeOutTransition(e):e.state===l.FADING_OUT&&this._destroyRipple(e)}_startFadeOutTransition(e){let t=e===this._mostRecentTransientRipple,{persistent:n}=e.config;e.state=l.VISIBLE,!n&&(!t||!this._isPointerDown)&&e.fadeOut()}_destroyRipple(e){let t=this._activeRipples.get(e)??null;this._activeRipples.delete(e),this._activeRipples.size||(this._containerRect=null),e===this._mostRecentTransientRipple&&(this._mostRecentTransientRipple=null),e.state=l.HIDDEN,t!==null&&(e.element.removeEventListener(`transitionend`,t.onTransitionEnd),e.element.removeEventListener(`transitioncancel`,t.onTransitionCancel),t.fallbackTimer!==null&&clearTimeout(t.fallbackTimer)),e.element.remove()}_onMousedown(e){let t=se$1(e),n=this._lastTouchStartEvent&&Date.now()<this._lastTouchStartEvent+J;!this._target.rippleDisabled&&!t&&!n&&(this._isPointerDown=!0,this.fadeInRipple(e.clientX,e.clientY,this._target.rippleConfig))}_onTouchStart(e){if(!this._target.rippleDisabled&&!ne$1(e)){this._lastTouchStartEvent=Date.now(),this._isPointerDown=!0;let t=e.changedTouches;if(t)for(let n=0;n<t.length;n++)this.fadeInRipple(t[n].clientX,t[n].clientY,this._target.rippleConfig)}}_onPointerUp(){this._isPointerDown&&(this._isPointerDown=!1,this._getActiveRipples().forEach(e=>{let t=e.state===l.VISIBLE||e.config.terminateOnPointerUp&&e.state===l.FADING_IN;!e.config.persistent&&t&&e.fadeOut()}))}_getActiveRipples(){return Array.from(this._activeRipples.keys())}_removeTriggerEvents(){let e=this._triggerElement;e&&(V.forEach(t=>s._eventManager.removeHandler(t,e,this)),this._pointerUpEventsRegistered&&(Z.forEach(t=>e.removeEventListener(t,this,G)),this._pointerUpEventsRegistered=!1))}};function Q(s,e,t){let n=Math.max(Math.abs(s-t.left),Math.abs(s-t.right)),i=Math.max(Math.abs(e-t.top),Math.abs(e-t.bottom));return Math.sqrt(n*n+i*i)}var W=new M(`mat-ripple-global-options`);var be=(()=>{class s{_elementRef=E(ho);_animationsDisabled=Jt();color;unbounded=!1;centered=!1;radius=0;animation;get disabled(){return this._disabled}set disabled(t){t&&this.fadeOutAllNonPersistent(),this._disabled=t,this._setupTriggerEventsIfEnabled()}_disabled=!1;get trigger(){return this._trigger||this._elementRef.nativeElement}set trigger(t){this._trigger=t,this._setupTriggerEventsIfEnabled()}_trigger;_rippleRenderer;_globalOptions;_isInitialized=!1;constructor(){let t=E(Z$1),n=E(h),i=E(W,{optional:!0}),r=E(ne);this._globalOptions=i||{},this._rippleRenderer=new R(this,t,this._elementRef,n,r)}ngOnInit(){this._isInitialized=!0,this._setupTriggerEventsIfEnabled()}ngOnDestroy(){this._rippleRenderer._removeTriggerEvents()}fadeOutAll(){this._rippleRenderer.fadeOutAll()}fadeOutAllNonPersistent(){this._rippleRenderer.fadeOutAllNonPersistent()}get rippleConfig(){return{centered:this.centered,radius:this.radius,color:this.color,animation:w(w(w({},this._globalOptions.animation),this._animationsDisabled?{enterDuration:0,exitDuration:0}:{}),this.animation),terminateOnPointerUp:this._globalOptions.terminateOnPointerUp}}get rippleDisabled(){return this.disabled||!!this._globalOptions.disabled}_setupTriggerEventsIfEnabled(){!this.disabled&&this._isInitialized&&this._rippleRenderer.setupTriggerEvents(this.trigger)}launch(t,n=0,i){return typeof t==`number`?this._rippleRenderer.fadeInRipple(t,n,w(w({},this.rippleConfig),i)):this._rippleRenderer.fadeInRipple(0,0,w(w({},this.rippleConfig),t))}static ɵfac=function(n){return new(n||s)};static ɵdir=PI({type:s,selectors:[[``,`mat-ripple`,``],[``,`matRipple`,``]],hostAttrs:[1,`mat-ripple`],hostVars:2,hostBindings:function(n,i){n&2&&th(`mat-ripple-unbounded`,i.unbounded)},inputs:{color:[0,`matRippleColor`,`color`],unbounded:[0,`matRippleUnbounded`,`unbounded`],centered:[0,`matRippleCentered`,`centered`],radius:[0,`matRippleRadius`,`radius`],animation:[0,`matRippleAnimation`,`animation`],disabled:[0,`matRippleDisabled`,`disabled`],trigger:[0,`matRippleTrigger`,`trigger`]},exportAs:[`matRipple`]})}return s})();var Te=(()=>{class s{static ɵfac=function(n){return new(n||s)};static ɵcmp=AI({type:s,selectors:[[`structural-styles`]],decls:0,vars:0,template:function(n,i){},styles:[`.mat-focus-indicator {
  position: relative;
}
.mat-focus-indicator::before {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  display: var(--%NS%mat-focus-indicator-display, none);
  border-width: var(--%NS%mat-focus-indicator-border-width, 3px);
  border-style: var(--%NS%mat-focus-indicator-border-style, solid);
  border-color: var(--%NS%mat-focus-indicator-border-color, transparent);
  border-radius: var(--%NS%mat-focus-indicator-border-radius, 4px);
}
.mat-focus-indicator:focus-visible::before {
  content: "";
}

@media (forced-colors: active) {
  html {
    --%NS%mat-focus-indicator-display: block;
    --%NS%mat-focus-indicator-fallback-border-style: none;
  }
}
`],encapsulation:2})}return s})();export{be as a,W as i,R as n,l as o,Te as r,se as s,B as t};