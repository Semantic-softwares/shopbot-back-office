import{a as w,c as z,i as D,o as x}from"./chunk-RykAvsdd.js";import{wt as du,x as I}from"./chunk-DMEhUgHW.js";import{Br as vh,Cn as cv,Dr as sN,Er as sM,Et as Si,F as IM,Fr as uT,Ft as VL,G as Jl,Gr as wm,Gt as XN,Hn as iu,Ht as Ws,Jr as y,Jt as Xi,K as Jm,Mt as UM,O as GL,Pr as tv,Q as Km,Rn as iN,Rt as W,Un as iw,V as JN,Wr as vv,Zn as lN,a as Ad,ar as lw,at as M_,cn as _r,ct as N,dr as nu,dt as Nm,f as Cm,fr as nv,gn as bd,h as Dc,jt as UL,k as Ge$1,kn as em,kr as tM,mr as oN,or as mN,p as Ct,pn as av,pr as oM,qr as xM,ri as zo,rn as Ze$1,t as $L,un as aM,v as EC,xr as rM,yn as cN,zr as vC}from"./chunk-BOgKwfio.js";import{l as Mn,u as Nn,x as fn}from"./chunk-YGfMGMxK.js";import{Ct as m,F as zt,Gn as L,Jn as x$1,M as Dt,N as gt,St as d,Xt as S,Yt as O,Zt as _,_t as de,bt as pe$1,ct as Xt,gt as ce$1,hn as Ut,ht as G,it as Kt,lt as _t,mt as Fe$1,pt as Ae$1,sn as Fi,yn as _$1,yt as l}from"./chunk-B_nmlAP4.js";import{a as be$1,c as li,d as ri,f as si,l as oi,p as w$1,u as pe$2}from"./chunk-bFCR1abA.js";import{C as mn,O as x$2,c as Qn,k as zn,o as Mn$1,p as Ze$2}from"./chunk-B8jAYTIi.js";import{n as ir,r as nr,t as G$1}from"./chunk-i_qK86zf.js";var s;var B;var st;var _e;var Ae;var ce;var Ne;var he;var Pe;var ot;var me;var lt=z(()=>{"use strict";_();G();M_();M_();de();L();Ut();ce$1();Mn$1();du();d();s=(function(n){return n[n.START=1]=`START`,n[n.END=2]=`END`,n})(s||{}),B=(function(n){return n[n.ACTIVE=0]=`ACTIVE`,n[n.INACTIVE=1]=`INACTIVE`,n})(B||{}),st=new N(`_MatSlider`),_e=new N(`_MatSliderThumb`),Ae=new N(`_MatSliderRangeThumb`),ce=new N(`_MatSliderVisualThumb`),Ne=(()=>{class n{_cdr=y(VL);_ngZone=y(W);_slider=y(st);_renderer=y(Dc);_listenerCleanups;discrete=!1;thumbPosition;valueIndicatorText;_ripple;_knob;_valueIndicatorContainer;_sliderInput;_sliderInputEl;_hoverRippleRef;_focusRippleRef;_activeRippleRef;_isHovered=!1;_isActive=!1;_isValueIndicatorVisible=!1;_hostElement=y(zo).nativeElement;_platform=y(_$1);ngAfterViewInit(){let t=this._slider._getInput(this.thumbPosition);t&&(this._ripple.radius=24,this._sliderInput=t,this._sliderInputEl=this._sliderInput._hostElement,this._ngZone.runOutsideAngular(()=>{let e=this._sliderInputEl,i=this._renderer;this._listenerCleanups=[i.listen(e,`pointermove`,this._onPointerMove),i.listen(e,`pointerdown`,this._onDragStart),i.listen(e,`pointerup`,this._onDragEnd),i.listen(e,`pointerleave`,this._onMouseLeave),i.listen(e,`focus`,this._onFocus),i.listen(e,`blur`,this._onBlur)]}))}ngOnDestroy(){this._listenerCleanups?.forEach(t=>t())}_onPointerMove=t=>{if(this._sliderInput._isFocused)return;let e=this._hostElement.getBoundingClientRect(),i=this._slider._isCursorOnSliderThumb(t,e);this._isHovered=i,i?this._showHoverRipple():this._hideRipple(this._hoverRippleRef)};_onMouseLeave=()=>{this._isHovered=!1,this._hideRipple(this._hoverRippleRef)};_onFocus=()=>{this._hideRipple(this._hoverRippleRef),this._showFocusRipple(),this._hostElement.classList.add(`mdc-slider__thumb--focused`)};_onBlur=()=>{this._isActive||this._hideRipple(this._focusRippleRef),this._isHovered&&this._showHoverRipple(),this._hostElement.classList.remove(`mdc-slider__thumb--focused`)};_onDragStart=t=>{t.button===0&&(this._isActive=!0,this._showActiveRipple())};_onDragEnd=()=>{this._isActive=!1,this._hideRipple(this._activeRippleRef),this._sliderInput._isFocused||this._hideRipple(this._focusRippleRef),this._platform.SAFARI&&this._showHoverRipple()};_showHoverRipple(){this._isShowingRipple(this._hoverRippleRef)||(this._hoverRippleRef=this._showRipple({enterDuration:0,exitDuration:0}),this._hoverRippleRef?.element.classList.add(`mat-mdc-slider-hover-ripple`))}_showFocusRipple(){this._isShowingRipple(this._focusRippleRef)||(this._focusRippleRef=this._showRipple({enterDuration:0,exitDuration:0},!0),this._focusRippleRef?.element.classList.add(`mat-mdc-slider-focus-ripple`))}_showActiveRipple(){this._isShowingRipple(this._activeRippleRef)||(this._activeRippleRef=this._showRipple({enterDuration:225,exitDuration:400}),this._activeRippleRef?.element.classList.add(`mat-mdc-slider-active-ripple`))}_isShowingRipple(t){return t?.state===l.FADING_IN||t?.state===l.VISIBLE}_showRipple(t,e){if(!this._slider.disabled&&(this._showValueIndicator(),this._slider._isRange&&this._slider._getThumb(this.thumbPosition===s.START?s.END:s.START)._showValueIndicator(),!(this._slider._globalRippleOptions?.disabled&&!e)))return this._ripple.launch({animation:this._slider._noopAnimations?{enterDuration:0,exitDuration:0}:t,centered:!0,persistent:!0})}_hideRipple(t){if(t?.fadeOut(),this._isShowingAnyRipple())return;this._slider._isRange||this._hideValueIndicator();let e=this._getSibling();e._isShowingAnyRipple()||(this._hideValueIndicator(),e._hideValueIndicator())}_showValueIndicator(){this._hostElement.classList.add(`mdc-slider__thumb--with-indicator`)}_hideValueIndicator(){this._hostElement.classList.remove(`mdc-slider__thumb--with-indicator`)}_getSibling(){return this._slider._getThumb(this.thumbPosition===s.START?s.END:s.START)}_getValueIndicatorContainer(){return this._valueIndicatorContainer?.nativeElement}_getKnob(){return this._knob.nativeElement}_isShowingAnyRipple(){return this._isShowingRipple(this._hoverRippleRef)||this._isShowingRipple(this._focusRippleRef)||this._isShowingRipple(this._activeRippleRef)}static ɵfac=function(e){return new(e||n)};static ɵcmp=(function(){let t=[`knob`],e=[`valueIndicatorContainer`];function i(r,l){if(r&1&&(Si(0,`div`,2,1)(2,`div`,5)(3,`span`,6),xM(4),Jl()()()),r&2){let p=tM();uT(4),vv(p.valueIndicatorText)}}return iw({type:n,selectors:[[`mat-slider-visual-thumb`]],viewQuery:function(l,p){if(l&1&&nv(Ae$1,5)(t,5)(e,5),l&2){let d;sM(d=aM())&&(p._ripple=d.first),sM(d=aM())&&(p._knob=d.first),sM(d=aM())&&(p._valueIndicatorContainer=d.first)}},hostAttrs:[1,`mdc-slider__thumb`,`mat-mdc-slider-visual-thumb`],inputs:{discrete:`discrete`,thumbPosition:`thumbPosition`,valueIndicatorText:`valueIndicatorText`},features:[UM([{provide:ce,useExisting:n}])],decls:4,vars:2,consts:[[`knob`,``],[`valueIndicatorContainer`,``],[1,`mdc-slider__value-indicator-container`],[1,`mdc-slider__thumb-knob`],[`matRipple`,``,1,`mat-focus-indicator`,3,`matRippleDisabled`],[1,`mdc-slider__value-indicator`],[1,`mdc-slider__value-indicator-text`]],template:function(l,p){l&1&&(oN(0,i,5,1,`div`,2),Nm(1,`div`,3,0)(3,`div`,4)),l&2&&(iN(p.discrete?0:-1),uT(3),wm(`matRippleDisabled`,!0))},dependencies:[Ae$1],styles:[`.mat-mdc-slider-visual-thumb .mat-ripple {
  height: 100%;
  width: 100%;
}

.mat-mdc-slider .mdc-slider__tick-marks {
  justify-content: start;
}
.mat-mdc-slider .mdc-slider__tick-marks .mdc-slider__tick-mark--active,
.mat-mdc-slider .mdc-slider__tick-marks .mdc-slider__tick-mark--inactive {
  position: absolute;
  left: 2px;
}
`],encapsulation:2})})()}return n})(),he=(()=>{class n{_ngZone=y(W);_cdr=y(VL);_elementRef=y(zo);_dir=y(S,{optional:!0});_globalRippleOptions=y(pe$1,{optional:!0});_trackActive;_thumbs;_input;_inputs;get disabled(){return this._disabled}set disabled(t){this._disabled=t;let e=this._getInput(s.END),i=this._getInput(s.START);e&&(e.disabled=this._disabled),i&&(i.disabled=this._disabled)}_disabled=!1;get discrete(){return this._discrete}set discrete(t){this._discrete=t,this._updateValueIndicatorUIs()}_discrete=!1;get showTickMarks(){return this._showTickMarks}set showTickMarks(t){this._showTickMarks=t,this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI())}_showTickMarks=!1;get min(){return this._min}set min(t){let e=t==null||isNaN(t)?this._min:t;this._min!==e&&this._updateMin(e)}_min=0;color;disableRipple=!1;_updateMin(t){let e=this._min;this._min=t,this._isRange?this._updateMinRange({old:e,new:t}):this._updateMinNonRange(t),this._onMinMaxOrStepChange()}_updateMinRange(t){let e=this._getInput(s.END),i=this._getInput(s.START),r=e.value,l=i.value;i.min=t.new,e.min=Math.max(t.new,i.value),i.max=Math.min(e.max,e.value),i._updateWidthInactive(),e._updateWidthInactive(),t.new<t.old?this._onTranslateXChangeBySideEffect(e,i):this._onTranslateXChangeBySideEffect(i,e),r!==e.value&&this._onValueChange(e),l!==i.value&&this._onValueChange(i)}_updateMinNonRange(t){let e=this._getInput(s.END);if(e){let i=e.value;e.min=t,e._updateThumbUIByValue(),this._updateTrackUI(e),i!==e.value&&this._onValueChange(e)}}get max(){return this._max}set max(t){let e=t==null||isNaN(t)?this._max:t;this._max!==e&&this._updateMax(e)}_max=100;_updateMax(t){let e=this._max;this._max=t,this._isRange?this._updateMaxRange({old:e,new:t}):this._updateMaxNonRange(t),this._onMinMaxOrStepChange()}_updateMaxRange(t){let e=this._getInput(s.END),i=this._getInput(s.START),r=e.value,l=i.value;e.max=t.new,i.max=Math.min(t.new,e.value),e.min=i.value,e._updateWidthInactive(),i._updateWidthInactive(),t.new>t.old?this._onTranslateXChangeBySideEffect(i,e):this._onTranslateXChangeBySideEffect(e,i),r!==e.value&&this._onValueChange(e),l!==i.value&&this._onValueChange(i)}_updateMaxNonRange(t){let e=this._getInput(s.END);if(e){let i=e.value;e.max=t,e._updateThumbUIByValue(),this._updateTrackUI(e),i!==e.value&&this._onValueChange(e)}}get step(){return this._step}set step(t){let e=isNaN(t)?this._step:t;this._step!==e&&this._updateStep(e)}_step=1;_updateStep(t){this._step=t,this._isRange?this._updateStepRange():this._updateStepNonRange(),this._onMinMaxOrStepChange()}_updateStepRange(){let t=this._getInput(s.END),e=this._getInput(s.START),i=t.value,r=e.value,l=e.value;t.min=this._min,e.max=this._max,t.step=this._step,e.step=this._step,this._platform.SAFARI&&(t.value=t.value,e.value=e.value),t.min=Math.max(this._min,e.value),e.max=Math.min(this._max,t.value),e._updateWidthInactive(),t._updateWidthInactive(),t.value<l?this._onTranslateXChangeBySideEffect(e,t):this._onTranslateXChangeBySideEffect(t,e),i!==t.value&&this._onValueChange(t),r!==e.value&&this._onValueChange(e)}_updateStepNonRange(){let t=this._getInput(s.END);if(t){let e=t.value;t.step=this._step,this._platform.SAFARI&&(t.value=t.value),t._updateThumbUIByValue(),e!==t.value&&this._onValueChange(t)}}displayWith=t=>`${t}`;_tickMarks;_noopAnimations=Fi();_resizeObserver=null;_cachedWidth;_cachedLeft;_rippleRadius=24;startValueIndicatorText=``;endValueIndicatorText=``;_endThumbTransform;_startThumbTransform;_isRange=!1;_isRtl=Ct(()=>this._dir?.valueSignal()===`rtl`);_hasViewInitialized=!1;_tickMarkTrackWidth=0;_hasAnimation=!1;_resizeTimer=null;_platform=y(_$1);constructor(){y(x$1).load(Fe$1);let t=this._isRtl();GL(()=>{let e=this._isRtl();e!==t&&(t=e,this._isRange?this._onDirChangeRange():this._onDirChangeNonRange(),this._updateTickMarkUI())})}_knobRadius=8;_inputPadding;ngAfterViewInit(){this._platform.isBrowser&&this._updateDimensions();let t=this._getInput(s.END),e=this._getInput(s.START);this._isRange=!!t&&!!e,this._cdr.detectChanges();let i=this._getThumb(s.END);this._rippleRadius=i._ripple.radius,this._inputPadding=this._rippleRadius-this._knobRadius,this._isRange?this._initUIRange(t,e):this._initUINonRange(t),this._updateTrackUI(t),this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._observeHostResize(),this._cdr.detectChanges()}_initUINonRange(t){t.initProps(),t.initUI(),this._updateValueIndicatorUI(t),this._hasViewInitialized=!0,t._updateThumbUIByValue()}_initUIRange(t,e){t.initProps(),t.initUI(),e.initProps(),e.initUI(),t._updateMinMax(),e._updateMinMax(),t._updateStaticStyles(),e._updateStaticStyles(),this._updateValueIndicatorUIs(),this._hasViewInitialized=!0,t._updateThumbUIByValue(),e._updateThumbUIByValue()}ngOnDestroy(){this._resizeObserver?.disconnect(),this._resizeObserver=null}_onDirChangeRange(){let t=this._getInput(s.END),e=this._getInput(s.START);t._setIsLeftThumb(),e._setIsLeftThumb(),t.translateX=t._calcTranslateXByValue(),e.translateX=e._calcTranslateXByValue(),t._updateStaticStyles(),e._updateStaticStyles(),t._updateWidthInactive(),e._updateWidthInactive(),t._updateThumbUIByValue(),e._updateThumbUIByValue()}_onDirChangeNonRange(){this._getInput(s.END)._updateThumbUIByValue()}_observeHostResize(){typeof ResizeObserver>`u`||!ResizeObserver||this._ngZone.runOutsideAngular(()=>{this._resizeObserver=new ResizeObserver(()=>{this._isActive()||(this._resizeTimer&&clearTimeout(this._resizeTimer),this._onResize())}),this._resizeObserver.observe(this._elementRef.nativeElement)})}_isActive(){return this._getThumb(s.START)._isActive||this._getThumb(s.END)._isActive}_getValue(t=s.END){let e=this._getInput(t);return e?e.value:this.min}_skipUpdate(){return!!(this._getInput(s.START)?._skipUIUpdate||this._getInput(s.END)?._skipUIUpdate)}_updateDimensions(){this._cachedWidth=this._elementRef.nativeElement.offsetWidth,this._cachedLeft=this._elementRef.nativeElement.getBoundingClientRect().left}_setTrackActiveStyles(t){let e=this._trackActive.nativeElement.style;e.left=t.left,e.right=t.right,e.transformOrigin=t.transformOrigin,e.transform=t.transform}_calcTickMarkTransform(t){let e=t*(this._tickMarkTrackWidth/(this._tickMarks.length-1));return`translateX(${this._isRtl()?this._cachedWidth-6-e:e}px)`}_onTranslateXChange(t){this._hasViewInitialized&&(this._updateThumbUI(t),this._updateTrackUI(t),this._updateOverlappingThumbUI(t))}_onTranslateXChangeBySideEffect(t,e){this._hasViewInitialized&&(t._updateThumbUIByValue(),e._updateThumbUIByValue())}_onValueChange(t){this._hasViewInitialized&&(this._updateValueIndicatorUI(t),this._updateTickMarkUI(),this._cdr.detectChanges())}_onMinMaxOrStepChange(){this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.markForCheck())}_onResize(){if(this._hasViewInitialized){if(this._updateDimensions(),this._isRange){let t=this._getInput(s.END),e=this._getInput(s.START);t._updateThumbUIByValue(),e._updateThumbUIByValue(),t._updateStaticStyles(),e._updateStaticStyles(),t._updateMinMax(),e._updateMinMax(),t._updateWidthInactive(),e._updateWidthInactive()}else{let t=this._getInput(s.END);t&&t._updateThumbUIByValue()}this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.detectChanges()}}_thumbsOverlap=!1;_areThumbsOverlapping(){let t=this._getInput(s.START),e=this._getInput(s.END);return!t||!e?!1:e.translateX-t.translateX<20}_updateOverlappingThumbClassNames(t){let e=t.getSibling(),i=this._getThumb(t.thumbPosition);this._getThumb(e.thumbPosition)._hostElement.classList.remove(`mdc-slider__thumb--top`),i._hostElement.classList.toggle(`mdc-slider__thumb--top`,this._thumbsOverlap)}_updateOverlappingThumbUI(t){!this._isRange||this._skipUpdate()||this._thumbsOverlap!==this._areThumbsOverlapping()&&(this._thumbsOverlap=!this._thumbsOverlap,this._updateOverlappingThumbClassNames(t))}_updateThumbUI(t){if(this._skipUpdate())return;let e=this._getThumb(t.thumbPosition===s.END?s.END:s.START);e._hostElement.style.transform=`translateX(${t.translateX}px)`}_updateValueIndicatorUI(t){if(this._skipUpdate())return;let e=this.displayWith(t.value);if(this._hasViewInitialized?t._valuetext.set(e):t._hostElement.setAttribute(`aria-valuetext`,e),this.discrete){t.thumbPosition===s.START?this.startValueIndicatorText=e:this.endValueIndicatorText=e;let i=this._getThumb(t.thumbPosition);e.length<3?i._hostElement.classList.add(`mdc-slider__thumb--short-value`):i._hostElement.classList.remove(`mdc-slider__thumb--short-value`)}}_updateValueIndicatorUIs(){let t=this._getInput(s.END),e=this._getInput(s.START);t&&this._updateValueIndicatorUI(t),e&&this._updateValueIndicatorUI(e)}_updateTickMarkTrackUI(){if(!this.showTickMarks||this._skipUpdate())return;let t=this._step&&this._step>0?this._step:1,i=(Math.floor(this.max/t)*t-this.min)/(this.max-this.min);this._tickMarkTrackWidth=(this._cachedWidth-6)*i}_updateTrackUI(t){this._skipUpdate()||(this._isRange?this._updateTrackUIRange(t):this._updateTrackUINonRange(t))}_updateTrackUIRange(t){let e=t.getSibling();if(!e||!this._cachedWidth)return;let i=Math.abs(e.translateX-t.translateX)/this._cachedWidth;t._isLeftThumb&&this._cachedWidth?this._setTrackActiveStyles({left:`auto`,right:`${this._cachedWidth-e.translateX}px`,transformOrigin:`right`,transform:`scaleX(${i})`}):this._setTrackActiveStyles({left:`${e.translateX}px`,right:`auto`,transformOrigin:`left`,transform:`scaleX(${i})`})}_updateTrackUINonRange(t){this._isRtl()?this._setTrackActiveStyles({left:`auto`,right:`0px`,transformOrigin:`right`,transform:`scaleX(${1-t.fillPercentage})`}):this._setTrackActiveStyles({left:`0px`,right:`auto`,transformOrigin:`left`,transform:`scaleX(${t.fillPercentage})`})}_updateTickMarkUI(){if(!this.showTickMarks||this.step===void 0||this.min===void 0||this.max===void 0)return;let t=this.step>0?this.step:1;this._isRange?this._updateTickMarkUIRange(t):this._updateTickMarkUINonRange(t)}_updateTickMarkUINonRange(t){let e=this._getValue(),i=Math.max(Math.round((e-this.min)/t),0)+1,r=Math.max(Math.round((this.max-e)/t),0)-1;this._isRtl()?i++:r++,this._tickMarks=Array(i).fill(B.ACTIVE).concat(Array(r).fill(B.INACTIVE))}_updateTickMarkUIRange(t){let e=this._getValue(),i=this._getValue(s.START),r=Math.max(Math.round((i-this.min)/t),0),l=Math.max(Math.round((e-i)/t)+1,0),p=Math.max(Math.round((this.max-e)/t),0);this._tickMarks=Array(r).fill(B.INACTIVE).concat(Array(l).fill(B.ACTIVE),Array(p).fill(B.INACTIVE))}_getInput(t){if(t===s.END&&this._input)return this._input;if(this._inputs?.length)return t===s.START?this._inputs.first:this._inputs.last}_getThumb(t){return t===s.END?this._thumbs?.last:this._thumbs?.first}_setTransition(t){this._hasAnimation=!this._platform.IOS&&t&&!this._noopAnimations,this._elementRef.nativeElement.classList.toggle(`mat-mdc-slider-with-animation`,this._hasAnimation)}_isCursorOnSliderThumb(t,e){let i=e.width/2,r=e.x+i,l=e.y+i,p=t.clientX-r,d=t.clientY-l;return Math.pow(p,2)+Math.pow(d,2)<Math.pow(i,2)}static ɵfac=function(e){return new(e||n)};static ɵcmp=(function(){let t=[`trackActive`],e=[`*`];function i(d,h){if(d&1&&Nm(0,`div`),d&2){let o=h.$implicit,v=h.$index,N=tM(3);IM(o===0?`mdc-slider__tick-mark--active`:`mdc-slider__tick-mark--inactive`),av(`transform`,N._calcTickMarkTransform(v))}}function r(d,h){if(d&1&&cN(0,i,1,4,`div`,8,sN),d&2){let o=tM(2);lN(o._tickMarks)}}function l(d,h){if(d&1&&(Si(0,`div`,6,1),oN(2,r,2,0),Jl()),d&2){let o=tM();uT(2),iN(o._cachedWidth?2:-1)}}function p(d,h){if(d&1&&Nm(0,`mat-slider-visual-thumb`,7),d&2){let o=tM();wm(`discrete`,o.discrete)(`thumbPosition`,1)(`valueIndicatorText`,o.startValueIndicatorText)}}return iw({type:n,selectors:[[`mat-slider`]],contentQueries:function(h,o,v){if(h&1&&tv(v,_e,5)(v,Ae,4),h&2){let N;sM(N=aM())&&(o._input=N.first),sM(N=aM())&&(o._inputs=N)}},viewQuery:function(h,o){if(h&1&&nv(t,5)(ce,5),h&2){let v;sM(v=aM())&&(o._trackActive=v.first),sM(v=aM())&&(o._thumbs=v)}},hostAttrs:[1,`mat-mdc-slider`,`mdc-slider`],hostVars:12,hostBindings:function(h,o){h&2&&(IM(`mat-`+(o.color||`primary`)),cv(`mdc-slider--range`,o._isRange)(`mdc-slider--disabled`,o.disabled)(`mdc-slider--discrete`,o.discrete)(`mdc-slider--tick-marks`,o.showTickMarks)(`_mat-animation-noopable`,o._noopAnimations))},inputs:{disabled:[2,`disabled`,`disabled`,$L],discrete:[2,`discrete`,`discrete`,$L],showTickMarks:[2,`showTickMarks`,`showTickMarks`,$L],min:[2,`min`,`min`,UL],color:`color`,disableRipple:[2,`disableRipple`,`disableRipple`,$L],max:[2,`max`,`max`,UL],step:[2,`step`,`step`,UL],displayWith:`displayWith`},exportAs:[`matSlider`],features:[UM([{provide:st,useExisting:n}])],ngContentSelectors:e,decls:9,vars:5,consts:[[`trackActive`,``],[`tickMarkContainer`,``],[1,`mdc-slider__track`],[1,`mdc-slider__track--inactive`],[1,`mdc-slider__track--active`],[1,`mdc-slider__track--active_fill`],[1,`mdc-slider__tick-marks`],[3,`discrete`,`thumbPosition`,`valueIndicatorText`],[3,`class`,`transform`]],template:function(h,o){h&1&&(oM(),rM(0),Si(1,`div`,2),Nm(2,`div`,3),Si(3,`div`,4),Nm(4,`div`,5,0),Jl(),oN(6,l,3,1,`div`,6),Jl(),oN(7,p,1,3,`mat-slider-visual-thumb`,7),Nm(8,`mat-slider-visual-thumb`,7)),h&2&&(uT(6),iN(o.showTickMarks?6:-1),uT(),iN(o._isRange?7:-1),uT(),wm(`discrete`,o.discrete)(`thumbPosition`,2)(`valueIndicatorText`,o.endValueIndicatorText))},dependencies:[Ne],styles:[`.mdc-slider__track {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  pointer-events: none;
  height: var(--%NS%mat-slider-inactive-track-height, 4px);
}

.mdc-slider__track--active,
.mdc-slider__track--inactive {
  display: flex;
  height: 100%;
  position: absolute;
  width: 100%;
}

.mdc-slider__track--active {
  overflow: hidden;
  border-radius: var(--%NS%mat-slider-active-track-shape, var(--%NS%mat-sys-corner-full));
  height: var(--%NS%mat-slider-active-track-height, 4px);
  top: calc((var(--%NS%mat-slider-inactive-track-height, 4px) - var(--%NS%mat-slider-active-track-height, 4px)) / 2);
}

.mdc-slider__track--active_fill {
  border-top-style: solid;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  position: relative;
  transform-origin: left;
  transition: transform 80ms ease;
  border-color: var(--%NS%mat-slider-active-track-color, var(--%NS%mat-sys-primary));
  border-top-width: var(--%NS%mat-slider-active-track-height, 4px);
}
.mdc-slider--disabled .mdc-slider__track--active_fill {
  border-color: var(--%NS%mat-slider-disabled-active-track-color, var(--%NS%mat-sys-on-surface));
}
[dir=rtl] .mdc-slider__track--active_fill {
  -webkit-transform-origin: right;
  transform-origin: right;
}

.mdc-slider__track--inactive {
  left: 0;
  top: 0;
  opacity: 0.24;
  background-color: var(--%NS%mat-slider-inactive-track-color, var(--%NS%mat-sys-surface-variant));
  height: var(--%NS%mat-slider-inactive-track-height, 4px);
  border-radius: var(--%NS%mat-slider-inactive-track-shape, var(--%NS%mat-sys-corner-full));
}
.mdc-slider--disabled .mdc-slider__track--inactive {
  background-color: var(--%NS%mat-slider-disabled-inactive-track-color, var(--%NS%mat-sys-on-surface));
  opacity: 0.24;
}
.mdc-slider__track--%NS%inactive::before {
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
@media (forced-colors: active) {
  .mdc-slider__track--%NS%inactive::before {
    border-color: CanvasText;
  }
}

.mdc-slider__value-indicator-container {
  bottom: 44px;
  left: 50%;
  pointer-events: none;
  position: absolute;
  transform: var(--%NS%mat-slider-value-indicator-container-transform, translateX(-50%) rotate(-45deg));
}
.mdc-slider__thumb--with-indicator .mdc-slider__value-indicator-container {
  pointer-events: auto;
}

.mdc-slider__value-indicator {
  display: flex;
  align-items: center;
  transform: scale(0);
  transform-origin: var(--%NS%mat-slider-value-indicator-transform-origin, 0 28px);
  transition: transform 100ms cubic-bezier(0.4, 0, 1, 1);
  word-break: normal;
  background-color: var(--%NS%mat-slider-label-container-color, var(--%NS%mat-sys-primary));
  color: var(--%NS%mat-slider-label-label-text-color, var(--%NS%mat-sys-on-primary));
  width: var(--%NS%mat-slider-value-indicator-width, 28px);
  height: var(--%NS%mat-slider-value-indicator-height, 28px);
  padding: var(--%NS%mat-slider-value-indicator-padding, 0);
  opacity: var(--%NS%mat-slider-value-indicator-opacity, 1);
  border-radius: var(--%NS%mat-slider-value-indicator-border-radius, 50% 50% 50% 0);
}
.mdc-slider__thumb--with-indicator .mdc-slider__value-indicator {
  transition: transform 100ms cubic-bezier(0, 0, 0.2, 1);
  transform: scale(1);
}
.mdc-slider__value-indicator::before {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid;
  bottom: -5px;
  content: "";
  height: 0;
  left: 50%;
  position: absolute;
  transform: translateX(-50%);
  width: 0;
  display: var(--%NS%mat-slider-value-indicator-caret-display, none);
  border-top-color: var(--%NS%mat-slider-label-container-color, var(--%NS%mat-sys-primary));
}
.mdc-slider__value-indicator::after {
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
@media (forced-colors: active) {
  .mdc-slider__value-indicator::after {
    border-color: CanvasText;
  }
}

.mdc-slider__value-indicator-text {
  text-align: center;
  width: var(--%NS%mat-slider-value-indicator-width, 28px);
  transform: var(--%NS%mat-slider-value-indicator-text-transform, rotate(45deg));
  font-family: var(--%NS%mat-slider-label-label-text-font, var(--%NS%mat-sys-label-medium-font));
  font-size: var(--%NS%mat-slider-label-label-text-size, var(--%NS%mat-sys-label-medium-size));
  font-weight: var(--%NS%mat-slider-label-label-text-weight, var(--%NS%mat-sys-label-medium-weight));
  line-height: var(--%NS%mat-slider-label-label-text-line-height, var(--%NS%mat-sys-label-medium-line-height));
  letter-spacing: var(--%NS%mat-slider-label-label-text-tracking, var(--%NS%mat-sys-label-medium-tracking));
}

.mdc-slider__thumb {
  -webkit-user-select: none;
  user-select: none;
  display: flex;
  left: -24px;
  outline: none;
  position: absolute;
  height: 48px;
  width: 48px;
  pointer-events: none;
}
.mdc-slider--discrete .mdc-slider__thumb {
  transition: transform 80ms ease;
}
.mdc-slider--disabled .mdc-slider__thumb {
  pointer-events: none;
}

.mdc-slider__thumb--top {
  z-index: 1;
}

.mdc-slider__thumb-knob {
  position: absolute;
  box-sizing: border-box;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-style: solid;
  width: var(--%NS%mat-slider-handle-width, 20px);
  height: var(--%NS%mat-slider-handle-height, 20px);
  border-width: calc(var(--%NS%mat-slider-handle-height, 20px) / 2) calc(var(--%NS%mat-slider-handle-width, 20px) / 2);
  box-shadow: var(--%NS%mat-slider-handle-elevation, var(--%NS%mat-sys-level1));
  background-color: var(--%NS%mat-slider-handle-color, var(--%NS%mat-sys-primary));
  border-color: var(--%NS%mat-slider-handle-color, var(--%NS%mat-sys-primary));
  border-radius: var(--%NS%mat-slider-handle-shape, var(--%NS%mat-sys-corner-full));
}
.mdc-slider__thumb:hover .mdc-slider__thumb-knob {
  background-color: var(--%NS%mat-slider-hover-handle-color, var(--%NS%mat-sys-primary));
  border-color: var(--%NS%mat-slider-hover-handle-color, var(--%NS%mat-sys-primary));
}
.mdc-slider__thumb--focused .mdc-slider__thumb-knob {
  background-color: var(--%NS%mat-slider-focus-handle-color, var(--%NS%mat-sys-primary));
  border-color: var(--%NS%mat-slider-focus-handle-color, var(--%NS%mat-sys-primary));
}
.mdc-slider--disabled .mdc-slider__thumb-knob {
  background-color: var(--%NS%mat-slider-disabled-handle-color, var(--%NS%mat-sys-on-surface));
  border-color: var(--%NS%mat-slider-disabled-handle-color, var(--%NS%mat-sys-on-surface));
}
.mdc-slider__thumb--top .mdc-slider__thumb-knob, .mdc-slider__thumb--top.mdc-slider__thumb:hover .mdc-slider__thumb-knob, .mdc-slider__thumb--top.mdc-slider__thumb--focused .mdc-slider__thumb-knob {
  border: solid 1px #fff;
  box-sizing: content-box;
  border-color: var(--%NS%mat-slider-with-overlap-handle-outline-color, var(--%NS%mat-sys-on-primary));
  border-width: var(--%NS%mat-slider-with-overlap-handle-outline-width, 1px);
}

.mdc-slider__tick-marks {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  height: 100%;
  justify-content: space-between;
  padding: 0 1px;
  position: absolute;
  width: 100%;
}

.mdc-slider__tick-mark--active,
.mdc-slider__tick-mark--inactive {
  width: var(--%NS%mat-slider-with-tick-marks-container-size, 2px);
  height: var(--%NS%mat-slider-with-tick-marks-container-size, 2px);
  border-radius: var(--%NS%mat-slider-with-tick-marks-container-shape, var(--%NS%mat-sys-corner-full));
}

.mdc-slider__tick-mark--inactive {
  opacity: var(--%NS%mat-slider-with-tick-marks-inactive-container-opacity, 0.38);
  background-color: var(--%NS%mat-slider-with-tick-marks-inactive-container-color, var(--%NS%mat-sys-on-surface-variant));
}
.mdc-slider--disabled .mdc-slider__tick-mark--inactive {
  opacity: var(--%NS%mat-slider-with-tick-marks-inactive-container-opacity, 0.38);
  background-color: var(--%NS%mat-slider-with-tick-marks-disabled-container-color, var(--%NS%mat-sys-on-surface));
}

.mdc-slider__tick-mark--active {
  opacity: var(--%NS%mat-slider-with-tick-marks-active-container-opacity, 0.38);
  background-color: var(--%NS%mat-slider-with-tick-marks-active-container-color, var(--%NS%mat-sys-on-primary));
}

.mdc-slider__input {
  cursor: pointer;
  left: 2px;
  margin: 0;
  height: 44px;
  opacity: 0;
  position: absolute;
  top: 2px;
  width: 44px;
  box-sizing: content-box;
}
.mdc-slider__input.mat-mdc-slider-input-no-pointer-events {
  pointer-events: none;
}
.mdc-slider__input.mat-slider__right-input {
  left: auto;
  right: 0;
}

.mat-mdc-slider {
  display: inline-block;
  box-sizing: border-box;
  outline: none;
  vertical-align: middle;
  cursor: pointer;
  height: 48px;
  margin: 0 8px;
  position: relative;
  touch-action: pan-y;
  width: auto;
  min-width: 112px;
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-slider.mdc-slider--disabled {
  cursor: auto;
  opacity: 0.38;
}
.mat-mdc-slider.mdc-slider--disabled .mdc-slider__input {
  cursor: auto;
}
.mat-mdc-slider .mdc-slider__thumb,
.mat-mdc-slider .mdc-slider__track--active_fill {
  transition-duration: 0ms;
}
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__thumb,
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__track--active_fill {
  transition-duration: 80ms;
}
.mat-mdc-slider.mdc-slider--discrete .mdc-slider__thumb,
.mat-mdc-slider.mdc-slider--discrete .mdc-slider__track--active_fill {
  transition-duration: 0ms;
}
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__thumb,
.mat-mdc-slider.mat-mdc-slider-with-animation .mdc-slider__track--active_fill {
  transition-duration: 80ms;
}
.mat-mdc-slider .mat-ripple .mat-ripple-element {
  background-color: var(--%NS%mat-slider-ripple-color, var(--%NS%mat-sys-primary));
}
.mat-mdc-slider .mat-ripple .mat-mdc-slider-hover-ripple {
  background-color: var(--%NS%mat-slider-hover-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-primary) 5%, transparent));
}
.mat-mdc-slider .mat-ripple .mat-mdc-slider-focus-ripple,
.mat-mdc-slider .mat-ripple .mat-mdc-slider-active-ripple {
  background-color: var(--%NS%mat-slider-focus-state-layer-color, color-mix(in srgb, var(--%NS%mat-sys-primary) 20%, transparent));
}
.mat-mdc-slider._mat-animation-noopable.mdc-slider--discrete .mdc-slider__thumb, .mat-mdc-slider._mat-animation-noopable.mdc-slider--discrete .mdc-slider__track--active_fill,
.mat-mdc-slider._mat-animation-noopable .mdc-slider__value-indicator {
  transition: none;
}
.mat-mdc-slider .mat-focus-indicator::before {
  border-radius: 50%;
}

.mdc-slider__thumb--focused .mat-focus-indicator::before {
  content: "";
}
`],encapsulation:2})})()}return n})(),Pe={provide:x$2,useExisting:_r(()=>ot),multi:!0},ot=(()=>{class n{_ngZone=y(W);_elementRef=y(zo);_cdr=y(VL);_slider=y(st);_platform=y(_$1);_listenerCleanups;get value(){return UL(this._hostElement.value,0)}set value(t){t===null&&(t=this._getDefaultValue()),t=isNaN(t)?0:t;let e=t+``;if(!this._hasSetInitialValue){this._initialValue=e;return}this._isActive||this._setValue(e)}_setValue(t){this._hostElement.value=t,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges(),this._slider._cdr.markForCheck()}valueChange=new Ze$1;dragStart=new Ze$1;dragEnd=new Ze$1;get translateX(){return this._slider.min>=this._slider.max?(this._translateX=this._tickMarkOffset,this._translateX):(this._translateX===void 0&&(this._translateX=this._calcTranslateXByValue()),this._translateX)}set translateX(t){this._translateX=t}_translateX;thumbPosition=s.END;get min(){return UL(this._hostElement.min,0)}set min(t){this._hostElement.min=t+``,this._cdr.detectChanges()}get max(){return UL(this._hostElement.max,0)}set max(t){this._hostElement.max=t+``,this._cdr.detectChanges()}get step(){return UL(this._hostElement.step,0)}set step(t){this._hostElement.step=t+``,this._cdr.detectChanges()}get disabled(){return $L(this._hostElement.disabled)}set disabled(t){this._hostElement.disabled=t,this._cdr.detectChanges(),this._slider.disabled!==this.disabled&&(this._slider.disabled=this.disabled)}get percentage(){return this._slider.min>=this._slider.max?this._slider._isRtl()?1:0:(this.value-this._slider.min)/(this._slider.max-this._slider.min)}get fillPercentage(){return this._slider._cachedWidth?this._translateX===0?0:this.translateX/this._slider._cachedWidth:this._slider._isRtl()?1:0}_hostElement=this._elementRef.nativeElement;_valuetext=Ge$1(``);_knobRadius=8;_tickMarkOffset=3;_isActive=!1;_isFocused=!1;_setIsFocused(t){this._isFocused=t}_hasSetInitialValue=!1;_initialValue;_formControl;_destroyed=new I;_skipUIUpdate=!1;_onChangeFn;_onTouchedFn=()=>{};_isControlInitialized=!1;constructor(){let t=y(Dc);this._ngZone.runOutsideAngular(()=>{this._listenerCleanups=[t.listen(this._hostElement,`pointerdown`,this._onPointerDown.bind(this)),t.listen(this._hostElement,`pointermove`,this._onPointerMove.bind(this)),t.listen(this._hostElement,`pointerup`,this._onPointerUp.bind(this))]})}ngOnDestroy(){this._listenerCleanups.forEach(t=>t()),this._destroyed.next(),this._destroyed.complete(),this.dragStart.complete(),this.dragEnd.complete()}initProps(){this._updateWidthInactive(),this.disabled!==this._slider.disabled&&(this._slider.disabled=!0),this.step=this._slider.step,this.min=this._slider.min,this.max=this._slider.max,this._initValue()}initUI(){this._updateThumbUIByValue()}_initValue(){this._hasSetInitialValue=!0,this._initialValue===void 0?this.value=this._getDefaultValue():(this._hostElement.value=this._initialValue,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges())}_getDefaultValue(){return this.min}_onBlur(){this._setIsFocused(!1),this._onTouchedFn()}_onFocus(){this._slider._setTransition(!1),this._slider._updateTrackUI(this),this._setIsFocused(!0)}_onChange(){this.valueChange.emit(this.value),this._isActive&&this._updateThumbUIByValue({withAnimation:!0})}_onInput(){this._onChangeFn?.(this.value),(this._slider.step||!this._isActive)&&this._updateThumbUIByValue({withAnimation:!this._isActive}),this._slider._onValueChange(this)}_onNgControlValueChange(){(!this._isActive||!this._isFocused)&&(this._slider._onValueChange(this),this._updateThumbUIByValue()),this._slider.disabled=this._formControl.disabled}_onPointerDown(t){if(!(this.disabled||t.button!==0)){if(this._platform.IOS){let e=this._slider._isCursorOnSliderThumb(t,this._slider._getThumb(this.thumbPosition)._hostElement.getBoundingClientRect());this._isActive=e,this._updateWidthActive(),this._slider._updateDimensions();return}this._isActive=!0,this._setIsFocused(!0),this._updateWidthActive(),this._slider._updateDimensions(),this._slider.step||this._updateThumbUIByPointerEvent(t,{withAnimation:!0}),this.disabled||(this._handleValueCorrection(t),this.dragStart.emit({source:this,parent:this._slider,value:this.value}))}}_handleValueCorrection(t){this._skipUIUpdate=!0,setTimeout(()=>{this._skipUIUpdate=!1,this._fixValue(t)},0)}_fixValue(t){let e=t.clientX-this._slider._cachedLeft,i=this._slider._cachedWidth,r=this._slider.step===0?1:this._slider.step,l=Math.floor((this._slider.max-this._slider.min)/r),p=this._slider._isRtl()?1-e/i:e/i,h=Math.round(p*l)/l*(this._slider.max-this._slider.min)+this._slider.min,o=Math.round(h/r)*r;if(o===this.value){this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(t,{withAnimation:this._slider._hasAnimation});return}this.value=o,this.valueChange.emit(this.value),this._onChangeFn?.(this.value),this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(t,{withAnimation:this._slider._hasAnimation})}_onPointerMove(t){!this._slider.step&&this._isActive&&this._updateThumbUIByPointerEvent(t)}_onPointerUp(){this._isActive&&(this._isActive=!1,this._platform.SAFARI&&this._setIsFocused(!1),this.dragEnd.emit({source:this,parent:this._slider,value:this.value}),setTimeout(()=>this._updateWidthInactive(),this._platform.IOS?10:0))}_clamp(t){let e=this._tickMarkOffset,i=this._slider._cachedWidth-this._tickMarkOffset;return Math.max(Math.min(t,i),e)}_calcTranslateXByValue(){return this._slider._isRtl()?(1-this.percentage)*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset:this.percentage*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset}_calcTranslateXByPointerEvent(t){return t.clientX-this._slider._cachedLeft}_updateWidthActive(){}_updateWidthInactive(){this._hostElement.style.padding=`0 ${this._slider._inputPadding}px`,this._hostElement.style.width=`calc(100% + ${this._slider._inputPadding-this._tickMarkOffset*2}px)`,this._hostElement.style.left=`-${this._slider._rippleRadius-this._tickMarkOffset}px`}_updateThumbUIByValue(t){this.translateX=this._clamp(this._calcTranslateXByValue()),this._updateThumbUI(t)}_updateThumbUIByPointerEvent(t,e){this.translateX=this._clamp(this._calcTranslateXByPointerEvent(t)),this._updateThumbUI(e)}_updateThumbUI(t){this._slider._setTransition(!!t?.withAnimation),this._slider._onTranslateXChange(this)}writeValue(t){(this._isControlInitialized||t!==null)&&(this.value=t)}registerOnChange(t){this._onChangeFn=t,this._isControlInitialized=!0}registerOnTouched(t){this._onTouchedFn=t}setDisabledState(t){this.disabled=t}focus(){this._hostElement.focus()}blur(){this._hostElement.blur()}static ɵfac=function(e){return new(e||n)};static ɵdir=lw({type:n,selectors:[[`input`,`matSliderThumb`,``]],hostAttrs:[`type`,`range`,1,`mdc-slider__input`],hostVars:1,hostBindings:function(e,i){e&1&&Jm(`change`,function(){return i._onChange()})(`input`,function(){return i._onInput()})(`blur`,function(){return i._onBlur()})(`focus`,function(){return i._onFocus()}),e&2&&Cm(`aria-valuetext`,i._valuetext())},inputs:{value:[2,`value`,`value`,UL]},outputs:{valueChange:`valueChange`,dragStart:`dragStart`,dragEnd:`dragEnd`},exportAs:[`matSliderThumb`],features:[UM([Pe,{provide:_e,useExisting:n}])]})}return n})(),me=(()=>{class n{static ɵfac=function(e){return new(e||n)};static ɵmod=em({type:n});static ɵinj=Ws({imports:[m,O]})}return n})()});function ue(n,a){if(!n.width||!n.height)return{width:0,height:0};if(!a)return{width:n.width,height:n.height};let t=n.width,e=t/a;return e>n.height&&(e=n.height,t=e*a),{width:t,height:e}}function pe(n,a){return dt({x:n.width/2,y:n.height/2,width:0,height:0},n,.86,a)}function dt(n,a,t,e){let i=ue(a,e);if(!i.width)return{x:0,y:0,width:0,height:0};let r=i.width*t,l=i.height*t,p=n.x+n.width/2,d=n.y+n.height/2;return{x:q(p-r/2,0,a.width-r),y:q(d-l/2,0,a.height-l),width:r,height:l}}function ge(n,a,t){let e=ue(a,t);return e.width?n.width/e.width:1}function ve(n,a,t,e){return x(w({},n),{x:q(n.x+a,0,e.width-n.width),y:q(n.y+t,0,e.height-n.height)})}function fe(n,a,t,e,i,r){let l=a.x+a.width,p=a.y+a.height,d=n===`nw`||n===`sw`,h=n===`nw`||n===`ne`,o=d?l:a.x,v=h?p:a.y,N=d?o:i.width-o,Ee=h?v:i.height-v,P=d?l-(a.x+t):a.width+t,D=h?p-(a.y+e):a.height+e;if(r&&(D=P/r),P<=0||D<=0)return a;let J=Math.min(1,N/P,Ee/D);return J<1&&(P*=J,D*=J),P<40||D<40?a:{x:d?o-P:o,y:h?v-D:v,width:P,height:D}}function be(n,a){let t=Math.min(1,a/Math.max(n.width,n.height));return{width:Math.max(1,Math.round(n.width*t)),height:Math.max(1,Math.round(n.height*t))}}function q(n,a,t){return Math.min(Math.max(n,a),t)}var Se=z(()=>{"use strict";});function Ue(n,a){if(n&1&&(nu(0),xM(1),Xi()),n&2){let t=tM();uT(),vv(t.data.title)}}function Le(n,a){n&1&&(nu(0),JN(1,2),Xi())}function Be(n,a){if(n&1&&(Si(0,`p`,12),xM(1),Jl()),n&2){let t=tM();uT(),vv(t.data.hint)}}function Fe(n,a){n&1&&(Si(0,`div`,13),xM(1),Jl()),n&2&&(uT(),vv(a))}function ze(n,a){n&1&&(Si(0,`div`,18),Nm(1,`mat-spinner`,30),Jl())}function Ge(n,a){if(n&1){let t=mN();Si(0,`img`,31),Jm(`load`,function(){bd(t);let i=tM(2);return Ad(i.measure())}),Jl(),Si(1,`div`,32),Jm(`pointerdown`,function(i){bd(t);let r=tM(2);return Ad(r.onPointerDown(i,`move`))}),Si(2,`div`,33),Nm(3,`div`,34)(4,`div`,35)(5,`div`,36)(6,`div`,37),Jl(),Si(7,`span`,38),Jm(`pointerdown`,function(i){bd(t);let r=tM(2);return Ad(r.onPointerDown(i,`nw`))}),Jl(),Si(8,`span`,39),Jm(`pointerdown`,function(i){bd(t);let r=tM(2);return Ad(r.onPointerDown(i,`ne`))}),Jl(),Si(9,`span`,40),Jm(`pointerdown`,function(i){bd(t);let r=tM(2);return Ad(r.onPointerDown(i,`sw`))}),Jl(),Si(10,`span`,41),Jm(`pointerdown`,function(i){bd(t);let r=tM(2);return Ad(r.onPointerDown(i,`se`))}),Jl()()}if(n&2){let t=tM(2);wm(`src`,a,vh),uT(),wm(`ngStyle`,t.cropStyle())}}function Xe(n,a){n&1&&(nu(0),JN(1,6),Xi())}function He(n,a){n&1&&(nu(0),JN(1,7),Xi())}function We(n,a){if(n&1){let t=mN();Si(0,`button`,27),Jm(`click`,function(){bd(t);let i=tM(2);return Ad(i.toggleLock())}),Si(1,`mat-icon`,28),xM(2),Jl(),oN(3,Xe,2,0,`ng-container`)(4,He,2,0,`ng-container`),Jl()}if(n&2){let t=tM(2);uT(2),vv(t.lockAspect()?`lock`:`lock_open`),uT(),iN(t.lockAspect()?3:4)}}function $e(n,a){if(n&1){let t=mN();Si(0,`div`,17,0),Jm(`pointermove`,function(i){bd(t);let r=tM();return Ad(r.onPointerMove(i))})(`pointerup`,function(){bd(t);let i=tM();return Ad(i.onPointerUp())})(`pointercancel`,function(){bd(t);let i=tM();return Ad(i.onPointerUp())}),oN(2,ze,2,0,`div`,18),oN(3,Ge,11,2),Jl(),Si(4,`div`,19)(5,`span`,20),nu(6),JN(7,3),Xi(),Jl(),Si(8,`mat-slider`,21)(9,`input`,22),vC(),Jm(`ngModelChange`,function(i){bd(t);let r=tM();return Ad(r.setCropScale(i))}),Jl()(),Si(10,`span`,23),xM(11),Jl()(),Si(12,`div`,24)(13,`span`,25),nu(14),JN(15,4),Xi(),Jl(),Si(16,`div`,26)(17,`button`,27),Jm(`click`,function(){bd(t);let i=tM();return Ad(i.resetCrop())}),Si(18,`mat-icon`,28),xM(19,`restart_alt`),Jl(),nu(20),JN(21,5),Xi(),Jl(),oN(22,We,5,2,`button`,29),Jl()()}if(n&2){let t,e=tM();uT(2),iN(e.loading()?2:-1),uT(),iN((t=e.imageUrl())?3:-1,t),uT(5),wm(`min`,20)(`max`,100)(`step`,1),uT(),wm(`ngModel`,e.cropScale()),EC(),uT(2),iu(``,e.cropScale(),`%`),uT(4),Km(e.outputSize()),XN(15),uT(7),iN(e.data.aspectRatio?22:-1)}}function Ke(n,a){n&1&&(nu(0),JN(1,8),Xi())}function Ze(n,a){n&1&&(nu(0),JN(1,9),Xi())}var Ve;var Ce;var je=z(()=>{"use strict";M_();Nn();Mn$1();be$1();_t();gt();lt();G$1();Se();M_();Nn();Mn$1();be$1();_t();gt();lt();G$1();Ve=[`stage`];Ce=class n{dialogRef=y(w$1);data=y(pe$2);stageRef;imageUrl=Ge$1(null);loading=Ge$1(!0);working=Ge$1(!1);error=Ge$1(null);natural=Ge$1({width:0,height:0});fitted=Ge$1({left:0,top:0,width:0,height:0},{equal:(a,t)=>a.left===t.left&&a.top===t.top&&a.width===t.width&&a.height===t.height});crop=Ge$1({x:0,y:0,width:0,height:0});lockAspect=Ge$1(!0);get aspect(){return this.lockAspect()?this.data.aspectRatio:void 0}objectUrl=null;image=null;resize=null;drag=null;cropStyle=Ct(()=>{let a=this.fitted(),t=this.natural(),e=this.crop();if(!t.width||!a.width)return{display:`none`};let i=a.width/t.width;return{left:`${a.left+e.x*i}px`,top:`${a.top+e.y*i}px`,width:`${e.width*i}px`,height:`${e.height*i}px`}});cropScale=Ct(()=>Math.round(ge(this.crop(),this.natural(),this.aspect)*100));setCropScale(a){this.crop.set(dt(this.crop(),this.natural(),a/100,this.aspect))}outputSize=Ct(()=>{let a=this.crop();return`${Math.round(a.width)} \xD7 ${Math.round(a.height)}`});constructor(){this.load()}load(){let a=URL.createObjectURL(this.data.file);this.objectUrl=a,this.imageUrl.set(a);let t=new Image;t.onload=()=>{this.image=t,this.natural.set({width:t.naturalWidth,height:t.naturalHeight}),this.resetCrop(),this.loading.set(!1),requestAnimationFrame(()=>this.measure())},t.onerror=()=>{this.error.set(`That file couldn't be read as an image.`),this.loading.set(!1)},t.src=a}resetCrop(){this.crop.set(pe(this.natural(),this.aspect))}toggleLock(){this.lockAspect.update(a=>!a),this.resetCrop()}measure(){let a=this.stageRef?.nativeElement,t=this.natural();if(!a||!t.width)return;let e={width:a.clientWidth,height:a.clientHeight};if(!e.width||!e.height)return;let i=Math.min(e.width/t.width,e.height/t.height),r=t.width*i,l=t.height*i;this.fitted.set({left:(e.width-r)/2,top:(e.height-l)/2,width:r,height:l}),this.watchStage(a)}watchStage(a){this.resize||typeof ResizeObserver>`u`||(this.resize=new ResizeObserver(()=>this.measure()),this.resize.observe(a))}onPointerDown(a,t){a.preventDefault(),a.stopPropagation(),this.measure(),a.target.setPointerCapture?.(a.pointerId),this.drag={mode:t,startX:a.clientX,startY:a.clientY,origin:w({},this.crop())}}onPointerMove(a){if(!this.drag)return;let t=this.fitted(),e=this.natural();if(!t.width)return;let i=e.width/t.width,r=(a.clientX-this.drag.startX)*i,l=(a.clientY-this.drag.startY)*i;this.crop.set(this.drag.mode===`move`?ve(this.drag.origin,r,l,e):fe(this.drag.mode,this.drag.origin,r,l,e,this.aspect))}onPointerUp(){this.drag=null}confirm(){return D(this,null,function*(){if(!this.image)return;this.working.set(!0);let a=this.crop(),t=be(a,2e3),e=document.createElement(`canvas`);e.width=t.width,e.height=t.height;let i=e.getContext(`2d`);if(!i){this.error.set(`Your browser could not process this image.`),this.working.set(!1);return}i.drawImage(this.image,a.x,a.y,a.width,a.height,0,0,e.width,e.height);let r=yield new Promise(l=>e.toBlob(l,this.data.outputType??`image/jpeg`,.9));if(this.working.set(!1),!r){this.error.set(`Could not produce the cropped image.`);return}this.dialogRef.close(r)})}cancel(){this.dialogRef.close(null)}ngOnDestroy(){this.resize?.disconnect(),this.objectUrl&&URL.revokeObjectURL(this.objectUrl)}static ɵfac=function(t){return new(t||n)};static ɵcmp=iw({type:n,selectors:[[`app-image-cropper-dialog`]],viewQuery:function(t,e){if(t&1&&nv(Ve,5),t&2){let i;sM(i=aM())&&(e.stageRef=i.first)}},decls:14,vars:5,consts:()=>{let a;a=$localize`Cancel`;let t;t=$localize`Crop photo`;let e;e=$localize`Frame size`;let i;i=$localize`Output ${`�0�`}:INTERPOLATION: px`;let r;r=$localize`Reset`;let l;l=$localize`Card shape`;let p;p=$localize`Free crop`;let d;d=$localize`Cropping…`;let h;return h=$localize`Use photo`,[[`stage`,``],a,t,e,i,r,l,p,d,h,[`mat-dialog-title`,``,1,`!mb-1`,`text-lg`,`font-semibold`,`text-gray-900`],[1,`!pt-1`],[1,`mb-3`,`text-xs`,`text-gray-500`],[1,`rounded-lg`,`border`,`border-red-200`,`bg-red-50`,`p-4`,`text-sm`,`text-red-700`],[1,`flex`,`justify-end`,`gap-2`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`,`disabled`],[1,`relative`,`select-none`,`overflow-hidden`,`rounded-lg`,`bg-gray-900`,2,`height`,`60vh`,`max-height`,`26rem`,`touch-action`,`none`,3,`pointermove`,`pointerup`,`pointercancel`],[1,`absolute`,`inset-0`,`flex`,`items-center`,`justify-center`],[1,`mt-3`,`flex`,`items-center`,`gap-3`],[1,`shrink-0`,`text-xs`,`text-gray-500`],[`discrete`,``,1,`flex-1`,3,`min`,`max`,`step`],[`matSliderThumb`,``,3,`ngModelChange`,`ngModel`],[1,`w-10`,`shrink-0`,`text-right`,`font-mono`,`text-xs`,`text-gray-600`],[1,`mt-2`,`flex`,`flex-wrap`,`items-center`,`justify-between`,`gap-2`],[1,`text-xs`,`text-gray-500`],[1,`flex`,`items-center`,`gap-2`],[`mat-stroked-button`,``,`type`,`button`,3,`click`],[1,`mr-1`],[`mat-stroked-button`,``,`type`,`button`],[`diameter`,`32`],[`alt`,``,1,`pointer-events-none`,`absolute`,`inset-0`,`h-full`,`w-full`,`object-contain`,3,`load`,`src`],[1,`absolute`,`cursor-move`,2,`box-shadow`,`0 0 0 9999px rgba(0, 0, 0, 0.55)`,`outline`,`1px solid rgba(255,255,255,0.9)`,3,`pointerdown`,`ngStyle`],[1,`pointer-events-none`,`absolute`,`inset-0`,2,`opacity`,`0.35`],[1,`absolute`,`inset-y-0`,`left-1/3`,`w-px`,`bg-white`],[1,`absolute`,`inset-y-0`,`left-2/3`,`w-px`,`bg-white`],[1,`absolute`,`inset-x-0`,`top-1/3`,`h-px`,`bg-white`],[1,`absolute`,`inset-x-0`,`top-2/3`,`h-px`,`bg-white`],[1,`absolute`,`-left-1.5`,`-top-1.5`,`h-3.5`,`w-3.5`,`cursor-nwse-resize`,`rounded-sm`,`bg-white`,`shadow`,3,`pointerdown`],[1,`absolute`,`-right-1.5`,`-top-1.5`,`h-3.5`,`w-3.5`,`cursor-nesw-resize`,`rounded-sm`,`bg-white`,`shadow`,3,`pointerdown`],[1,`absolute`,`-bottom-1.5`,`-left-1.5`,`h-3.5`,`w-3.5`,`cursor-nesw-resize`,`rounded-sm`,`bg-white`,`shadow`,3,`pointerdown`],[1,`absolute`,`-bottom-1.5`,`-right-1.5`,`h-3.5`,`w-3.5`,`cursor-nwse-resize`,`rounded-sm`,`bg-white`,`shadow`,3,`pointerdown`]]},template:function(t,e){if(t&1&&(Si(0,`h2`,10),oN(1,Ue,2,1,`ng-container`)(2,Le,2,0,`ng-container`),Jl(),Si(3,`mat-dialog-content`,11),oN(4,Be,2,1,`p`,12),oN(5,Fe,2,1,`div`,13)(6,$e,23,9),Jl(),Si(7,`mat-dialog-actions`,14)(8,`button`,15),Jm(`click`,function(){return e.cancel()}),nu(9),JN(10,1),Xi(),Jl(),Si(11,`button`,16),Jm(`click`,function(){return e.confirm()}),oN(12,Ke,2,0,`ng-container`)(13,Ze,2,0,`ng-container`),Jl()()),t&2){let i;uT(),iN(e.data.title?1:2),uT(3),iN(e.data.hint?4:-1),uT(),iN((i=e.error())?5:6,i),uT(6),wm(`disabled`,e.loading()||e.working()||!!e.error()),uT(),iN(e.working()?12:13)}},dependencies:[Mn,fn,Qn,Ze$2,zn,mn,li,oi,ri,si,Xt,Kt,Dt,zt,me,he,ot,ir,nr],encapsulation:2})}});export{me as a,lt as i,he as n,ot as o,je as r,Ce as t};