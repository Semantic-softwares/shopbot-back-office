import{L as S}from"./chunk-ZG_ciif-.js";import{a as x,i as w,r as C}from"./chunk-B9dn0NrW.js";import{Bn as pA,Cn as kI,Dn as lE,E as Gp,It as aE,Mt as Zp,Or as yp,Ot as Z,Pn as nD,Tr as yD,U as M,V as Ll,Wt as cA,X as Pe,Xn as rD,Xt as da,Y as PI,Yt as dA,Z as Pl,Zn as rE,_t as Wy,a as $v,fn as gE,fr as uE,gr as vc,hn as ho,hr as ut,i as $r,in as fA,it as SD,j as Ip,lr as th,n as $d,nr as sE,o as $y,p as Cc,pt as Uo,qt as ch,rn as eh,s as AI,sn as fl,sr as tD,t as $D,tt as Qp,v as E,vn as iD,vr as vp,xr as xe,yt as XE}from"./chunk-5XvVQiy2.js";import{S as rn,o as Fn}from"./chunk-C6VwEn-p.js";import{i as w$1}from"./chunk-JltcrRJr.js";import{p as Jt$1,w as h}from"./chunk-DGUqj5N-.js";import{n as y,t as I}from"./chunk--TR0RrN-.js";import{t as n}from"./chunk-9GOaJjbF.js";import{a as be$1,i as W,o as l,r as Te}from"./chunk-CbKfoocL.js";import{o as jt,t as Lt}from"./chunk-DJSFudeY.js";import{c as wt,s as Mt}from"./main-EUYCFL46.js";import{D as x$1,d as Wn,f as Xe,h as cn,n as Bn}from"./chunk-DZq9hBzd.js";import{n as Z$1,t as J}from"./chunk-BdWMOAbt.js";import{c as je,d as ze,n as Be,o as Ve,t as $t,u as w$2}from"./chunk-D3rK1n3k.js";var s=(function(n){return n[n.START=1]=`START`,n[n.END=2]=`END`,n})(s||{});var O=(function(n){return n[n.ACTIVE=0]=`ACTIVE`,n[n.INACTIVE=1]=`INACTIVE`,n})(O||{});var et=new M(`_MatSlider`);var Gt=new M(`_MatSliderThumb`);var de=new M(`_MatSliderRangeThumb`);var Zt=new M(`_MatSliderVisualThumb`);var ce=(()=>{class n{_cdr=E(cA);_ngZone=E(Z);_slider=E(et);_renderer=E(da);_listenerCleanups;discrete=!1;thumbPosition;valueIndicatorText;_ripple;_knob;_valueIndicatorContainer;_sliderInput;_sliderInputEl;_hoverRippleRef;_focusRippleRef;_activeRippleRef;_isHovered=!1;_isActive=!1;_isValueIndicatorVisible=!1;_hostElement=E(ho).nativeElement;_platform=E(h);ngAfterViewInit(){let t=this._slider._getInput(this.thumbPosition);t&&(this._ripple.radius=24,this._sliderInput=t,this._sliderInputEl=this._sliderInput._hostElement,this._ngZone.runOutsideAngular(()=>{let e=this._sliderInputEl,i=this._renderer;this._listenerCleanups=[i.listen(e,`pointermove`,this._onPointerMove),i.listen(e,`pointerdown`,this._onDragStart),i.listen(e,`pointerup`,this._onDragEnd),i.listen(e,`pointerleave`,this._onMouseLeave),i.listen(e,`focus`,this._onFocus),i.listen(e,`blur`,this._onBlur)]}))}ngOnDestroy(){this._listenerCleanups?.forEach(t=>t())}_onPointerMove=t=>{if(this._sliderInput._isFocused)return;let e=this._hostElement.getBoundingClientRect(),i=this._slider._isCursorOnSliderThumb(t,e);this._isHovered=i,i?this._showHoverRipple():this._hideRipple(this._hoverRippleRef)};_onMouseLeave=()=>{this._isHovered=!1,this._hideRipple(this._hoverRippleRef)};_onFocus=()=>{this._hideRipple(this._hoverRippleRef),this._showFocusRipple(),this._hostElement.classList.add(`mdc-slider__thumb--focused`)};_onBlur=()=>{this._isActive||this._hideRipple(this._focusRippleRef),this._isHovered&&this._showHoverRipple(),this._hostElement.classList.remove(`mdc-slider__thumb--focused`)};_onDragStart=t=>{t.button===0&&(this._isActive=!0,this._showActiveRipple())};_onDragEnd=()=>{this._isActive=!1,this._hideRipple(this._activeRippleRef),this._sliderInput._isFocused||this._hideRipple(this._focusRippleRef),this._platform.SAFARI&&this._showHoverRipple()};_showHoverRipple(){this._isShowingRipple(this._hoverRippleRef)||(this._hoverRippleRef=this._showRipple({enterDuration:0,exitDuration:0}),this._hoverRippleRef?.element.classList.add(`mat-mdc-slider-hover-ripple`))}_showFocusRipple(){this._isShowingRipple(this._focusRippleRef)||(this._focusRippleRef=this._showRipple({enterDuration:0,exitDuration:0},!0),this._focusRippleRef?.element.classList.add(`mat-mdc-slider-focus-ripple`))}_showActiveRipple(){this._isShowingRipple(this._activeRippleRef)||(this._activeRippleRef=this._showRipple({enterDuration:225,exitDuration:400}),this._activeRippleRef?.element.classList.add(`mat-mdc-slider-active-ripple`))}_isShowingRipple(t){return t?.state===l.FADING_IN||t?.state===l.VISIBLE}_showRipple(t,e){if(!this._slider.disabled&&(this._showValueIndicator(),this._slider._isRange&&this._slider._getThumb(this.thumbPosition===s.START?s.END:s.START)._showValueIndicator(),!(this._slider._globalRippleOptions?.disabled&&!e)))return this._ripple.launch({animation:this._slider._noopAnimations?{enterDuration:0,exitDuration:0}:t,centered:!0,persistent:!0})}_hideRipple(t){if(t?.fadeOut(),this._isShowingAnyRipple())return;this._slider._isRange||this._hideValueIndicator();let e=this._getSibling();e._isShowingAnyRipple()||(this._hideValueIndicator(),e._hideValueIndicator())}_showValueIndicator(){this._hostElement.classList.add(`mdc-slider__thumb--with-indicator`)}_hideValueIndicator(){this._hostElement.classList.remove(`mdc-slider__thumb--with-indicator`)}_getSibling(){return this._slider._getThumb(this.thumbPosition===s.START?s.END:s.START)}_getValueIndicatorContainer(){return this._valueIndicatorContainer?.nativeElement}_getKnob(){return this._knob.nativeElement}_isShowingAnyRipple(){return this._isShowingRipple(this._hoverRippleRef)||this._isShowingRipple(this._focusRippleRef)||this._isShowingRipple(this._activeRippleRef)}static ɵfac=function(e){return new(e||n)};static ɵcmp=(function(){let t=[`knob`],e=[`valueIndicatorContainer`];function i(r,o){if(r&1&&($r(0,`div`,2,1)(2,`div`,5)(3,`span`,6),SD(4),vc()()()),r&2){let g=XE();$v(4),ch(g.valueIndicatorText)}}return AI({type:n,selectors:[[`mat-slider-visual-thumb`]],viewQuery:function(o,g){if(o&1&&Zp(be$1,5)(t,5)(e,5),o&2){let d;rD(d=iD())&&(g._ripple=d.first),rD(d=iD())&&(g._knob=d.first),rD(d=iD())&&(g._valueIndicatorContainer=d.first)}},hostAttrs:[1,`mdc-slider__thumb`,`mat-mdc-slider-visual-thumb`],inputs:{discrete:`discrete`,thumbPosition:`thumbPosition`,valueIndicatorText:`valueIndicatorText`},features:[$D([{provide:Zt,useExisting:n}])],decls:4,vars:2,consts:[[`knob`,``],[`valueIndicatorContainer`,``],[1,`mdc-slider__value-indicator-container`],[1,`mdc-slider__thumb-knob`],[`matRipple`,``,1,`mat-focus-indicator`,3,`matRippleDisabled`],[1,`mdc-slider__value-indicator`],[1,`mdc-slider__value-indicator-text`]],template:function(o,g){o&1&&(rE(0,i,5,1,`div`,2),Ip(1,`div`,3,0)(3,`div`,4)),o&2&&(sE(g.discrete?0:-1),$v(3),yp(`matRippleDisabled`,!0))},dependencies:[be$1],styles:[`.mat-mdc-slider-visual-thumb .mat-ripple {
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
`],encapsulation:2})})()}return n})();var Kt=(()=>{class n{_ngZone=E(Z);_cdr=E(cA);_elementRef=E(ho);_dir=E(y,{optional:!0});_globalRippleOptions=E(W,{optional:!0});_trackActive;_thumbs;_input;_inputs;get disabled(){return this._disabled}set disabled(t){this._disabled=t;let e=this._getInput(s.END),i=this._getInput(s.START);e&&(e.disabled=this._disabled),i&&(i.disabled=this._disabled)}_disabled=!1;get discrete(){return this._discrete}set discrete(t){this._discrete=t,this._updateValueIndicatorUIs()}_discrete=!1;get showTickMarks(){return this._showTickMarks}set showTickMarks(t){this._showTickMarks=t,this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI())}_showTickMarks=!1;get min(){return this._min}set min(t){let e=t==null||isNaN(t)?this._min:t;this._min!==e&&this._updateMin(e)}_min=0;color;disableRipple=!1;_updateMin(t){let e=this._min;this._min=t,this._isRange?this._updateMinRange({old:e,new:t}):this._updateMinNonRange(t),this._onMinMaxOrStepChange()}_updateMinRange(t){let e=this._getInput(s.END),i=this._getInput(s.START),r=e.value,o=i.value;i.min=t.new,e.min=Math.max(t.new,i.value),i.max=Math.min(e.max,e.value),i._updateWidthInactive(),e._updateWidthInactive(),t.new<t.old?this._onTranslateXChangeBySideEffect(e,i):this._onTranslateXChangeBySideEffect(i,e),r!==e.value&&this._onValueChange(e),o!==i.value&&this._onValueChange(i)}_updateMinNonRange(t){let e=this._getInput(s.END);if(e){let i=e.value;e.min=t,e._updateThumbUIByValue(),this._updateTrackUI(e),i!==e.value&&this._onValueChange(e)}}get max(){return this._max}set max(t){let e=t==null||isNaN(t)?this._max:t;this._max!==e&&this._updateMax(e)}_max=100;_updateMax(t){let e=this._max;this._max=t,this._isRange?this._updateMaxRange({old:e,new:t}):this._updateMaxNonRange(t),this._onMinMaxOrStepChange()}_updateMaxRange(t){let e=this._getInput(s.END),i=this._getInput(s.START),r=e.value,o=i.value;e.max=t.new,i.max=Math.min(t.new,e.value),e.min=i.value,e._updateWidthInactive(),i._updateWidthInactive(),t.new>t.old?this._onTranslateXChangeBySideEffect(i,e):this._onTranslateXChangeBySideEffect(e,i),r!==e.value&&this._onValueChange(e),o!==i.value&&this._onValueChange(i)}_updateMaxNonRange(t){let e=this._getInput(s.END);if(e){let i=e.value;e.max=t,e._updateThumbUIByValue(),this._updateTrackUI(e),i!==e.value&&this._onValueChange(e)}}get step(){return this._step}set step(t){let e=isNaN(t)?this._step:t;this._step!==e&&this._updateStep(e)}_step=1;_updateStep(t){this._step=t,this._isRange?this._updateStepRange():this._updateStepNonRange(),this._onMinMaxOrStepChange()}_updateStepRange(){let t=this._getInput(s.END),e=this._getInput(s.START),i=t.value,r=e.value,o=e.value;t.min=this._min,e.max=this._max,t.step=this._step,e.step=this._step,this._platform.SAFARI&&(t.value=t.value,e.value=e.value),t.min=Math.max(this._min,e.value),e.max=Math.min(this._max,t.value),e._updateWidthInactive(),t._updateWidthInactive(),t.value<o?this._onTranslateXChangeBySideEffect(e,t):this._onTranslateXChangeBySideEffect(t,e),i!==t.value&&this._onValueChange(t),r!==e.value&&this._onValueChange(e)}_updateStepNonRange(){let t=this._getInput(s.END);if(t){let e=t.value;t.step=this._step,this._platform.SAFARI&&(t.value=t.value),t._updateThumbUIByValue(),e!==t.value&&this._onValueChange(t)}}displayWith=t=>`${t}`;_tickMarks;_noopAnimations=Jt$1();_resizeObserver=null;_cachedWidth;_cachedLeft;_rippleRadius=24;startValueIndicatorText=``;endValueIndicatorText=``;_endThumbTransform;_startThumbTransform;_isRange=!1;_isRtl=ut(()=>this._dir?.valueSignal()===`rtl`);_hasViewInitialized=!1;_tickMarkTrackWidth=0;_hasAnimation=!1;_resizeTimer=null;_platform=E(h);constructor(){E(w$1).load(Te);let t=this._isRtl();pA(()=>{let e=this._isRtl();e!==t&&(t=e,this._isRange?this._onDirChangeRange():this._onDirChangeNonRange(),this._updateTickMarkUI())})}_knobRadius=8;_inputPadding;ngAfterViewInit(){this._platform.isBrowser&&this._updateDimensions();let t=this._getInput(s.END),e=this._getInput(s.START);this._isRange=!!t&&!!e,this._cdr.detectChanges();let i=this._getThumb(s.END);this._rippleRadius=i._ripple.radius,this._inputPadding=this._rippleRadius-this._knobRadius,this._isRange?this._initUIRange(t,e):this._initUINonRange(t),this._updateTrackUI(t),this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._observeHostResize(),this._cdr.detectChanges()}_initUINonRange(t){t.initProps(),t.initUI(),this._updateValueIndicatorUI(t),this._hasViewInitialized=!0,t._updateThumbUIByValue()}_initUIRange(t,e){t.initProps(),t.initUI(),e.initProps(),e.initUI(),t._updateMinMax(),e._updateMinMax(),t._updateStaticStyles(),e._updateStaticStyles(),this._updateValueIndicatorUIs(),this._hasViewInitialized=!0,t._updateThumbUIByValue(),e._updateThumbUIByValue()}ngOnDestroy(){this._resizeObserver?.disconnect(),this._resizeObserver=null}_onDirChangeRange(){let t=this._getInput(s.END),e=this._getInput(s.START);t._setIsLeftThumb(),e._setIsLeftThumb(),t.translateX=t._calcTranslateXByValue(),e.translateX=e._calcTranslateXByValue(),t._updateStaticStyles(),e._updateStaticStyles(),t._updateWidthInactive(),e._updateWidthInactive(),t._updateThumbUIByValue(),e._updateThumbUIByValue()}_onDirChangeNonRange(){this._getInput(s.END)._updateThumbUIByValue()}_observeHostResize(){typeof ResizeObserver>`u`||!ResizeObserver||this._ngZone.runOutsideAngular(()=>{this._resizeObserver=new ResizeObserver(()=>{this._isActive()||(this._resizeTimer&&clearTimeout(this._resizeTimer),this._onResize())}),this._resizeObserver.observe(this._elementRef.nativeElement)})}_isActive(){return this._getThumb(s.START)._isActive||this._getThumb(s.END)._isActive}_getValue(t=s.END){let e=this._getInput(t);return e?e.value:this.min}_skipUpdate(){return!!(this._getInput(s.START)?._skipUIUpdate||this._getInput(s.END)?._skipUIUpdate)}_updateDimensions(){this._cachedWidth=this._elementRef.nativeElement.offsetWidth,this._cachedLeft=this._elementRef.nativeElement.getBoundingClientRect().left}_setTrackActiveStyles(t){let e=this._trackActive.nativeElement.style;e.left=t.left,e.right=t.right,e.transformOrigin=t.transformOrigin,e.transform=t.transform}_calcTickMarkTransform(t){let e=t*(this._tickMarkTrackWidth/(this._tickMarks.length-1));return`translateX(${this._isRtl()?this._cachedWidth-6-e:e}px)`}_onTranslateXChange(t){this._hasViewInitialized&&(this._updateThumbUI(t),this._updateTrackUI(t),this._updateOverlappingThumbUI(t))}_onTranslateXChangeBySideEffect(t,e){this._hasViewInitialized&&(t._updateThumbUIByValue(),e._updateThumbUIByValue())}_onValueChange(t){this._hasViewInitialized&&(this._updateValueIndicatorUI(t),this._updateTickMarkUI(),this._cdr.detectChanges())}_onMinMaxOrStepChange(){this._hasViewInitialized&&(this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.markForCheck())}_onResize(){if(this._hasViewInitialized){if(this._updateDimensions(),this._isRange){let t=this._getInput(s.END),e=this._getInput(s.START);t._updateThumbUIByValue(),e._updateThumbUIByValue(),t._updateStaticStyles(),e._updateStaticStyles(),t._updateMinMax(),e._updateMinMax(),t._updateWidthInactive(),e._updateWidthInactive()}else{let t=this._getInput(s.END);t&&t._updateThumbUIByValue()}this._updateTickMarkUI(),this._updateTickMarkTrackUI(),this._cdr.detectChanges()}}_thumbsOverlap=!1;_areThumbsOverlapping(){let t=this._getInput(s.START),e=this._getInput(s.END);return!t||!e?!1:e.translateX-t.translateX<20}_updateOverlappingThumbClassNames(t){let e=t.getSibling(),i=this._getThumb(t.thumbPosition);this._getThumb(e.thumbPosition)._hostElement.classList.remove(`mdc-slider__thumb--top`),i._hostElement.classList.toggle(`mdc-slider__thumb--top`,this._thumbsOverlap)}_updateOverlappingThumbUI(t){!this._isRange||this._skipUpdate()||this._thumbsOverlap!==this._areThumbsOverlapping()&&(this._thumbsOverlap=!this._thumbsOverlap,this._updateOverlappingThumbClassNames(t))}_updateThumbUI(t){if(this._skipUpdate())return;let e=this._getThumb(t.thumbPosition===s.END?s.END:s.START);e._hostElement.style.transform=`translateX(${t.translateX}px)`}_updateValueIndicatorUI(t){if(this._skipUpdate())return;let e=this.displayWith(t.value);if(this._hasViewInitialized?t._valuetext.set(e):t._hostElement.setAttribute(`aria-valuetext`,e),this.discrete){t.thumbPosition===s.START?this.startValueIndicatorText=e:this.endValueIndicatorText=e;let i=this._getThumb(t.thumbPosition);e.length<3?i._hostElement.classList.add(`mdc-slider__thumb--short-value`):i._hostElement.classList.remove(`mdc-slider__thumb--short-value`)}}_updateValueIndicatorUIs(){let t=this._getInput(s.END),e=this._getInput(s.START);t&&this._updateValueIndicatorUI(t),e&&this._updateValueIndicatorUI(e)}_updateTickMarkTrackUI(){if(!this.showTickMarks||this._skipUpdate())return;let t=this._step&&this._step>0?this._step:1,i=(Math.floor(this.max/t)*t-this.min)/(this.max-this.min);this._tickMarkTrackWidth=(this._cachedWidth-6)*i}_updateTrackUI(t){this._skipUpdate()||(this._isRange?this._updateTrackUIRange(t):this._updateTrackUINonRange(t))}_updateTrackUIRange(t){let e=t.getSibling();if(!e||!this._cachedWidth)return;let i=Math.abs(e.translateX-t.translateX)/this._cachedWidth;t._isLeftThumb&&this._cachedWidth?this._setTrackActiveStyles({left:`auto`,right:`${this._cachedWidth-e.translateX}px`,transformOrigin:`right`,transform:`scaleX(${i})`}):this._setTrackActiveStyles({left:`${e.translateX}px`,right:`auto`,transformOrigin:`left`,transform:`scaleX(${i})`})}_updateTrackUINonRange(t){this._isRtl()?this._setTrackActiveStyles({left:`auto`,right:`0px`,transformOrigin:`right`,transform:`scaleX(${1-t.fillPercentage})`}):this._setTrackActiveStyles({left:`0px`,right:`auto`,transformOrigin:`left`,transform:`scaleX(${t.fillPercentage})`})}_updateTickMarkUI(){if(!this.showTickMarks||this.step===void 0||this.min===void 0||this.max===void 0)return;let t=this.step>0?this.step:1;this._isRange?this._updateTickMarkUIRange(t):this._updateTickMarkUINonRange(t)}_updateTickMarkUINonRange(t){let e=this._getValue(),i=Math.max(Math.round((e-this.min)/t),0)+1,r=Math.max(Math.round((this.max-e)/t),0)-1;this._isRtl()?i++:r++,this._tickMarks=Array(i).fill(O.ACTIVE).concat(Array(r).fill(O.INACTIVE))}_updateTickMarkUIRange(t){let e=this._getValue(),i=this._getValue(s.START),r=Math.max(Math.round((i-this.min)/t),0),o=Math.max(Math.round((e-i)/t)+1,0),g=Math.max(Math.round((this.max-e)/t),0);this._tickMarks=Array(r).fill(O.INACTIVE).concat(Array(o).fill(O.ACTIVE),Array(g).fill(O.INACTIVE))}_getInput(t){if(t===s.END&&this._input)return this._input;if(this._inputs?.length)return t===s.START?this._inputs.first:this._inputs.last}_getThumb(t){return t===s.END?this._thumbs?.last:this._thumbs?.first}_setTransition(t){this._hasAnimation=!this._platform.IOS&&t&&!this._noopAnimations,this._elementRef.nativeElement.classList.toggle(`mat-mdc-slider-with-animation`,this._hasAnimation)}_isCursorOnSliderThumb(t,e){let i=e.width/2,r=e.x+i,o=e.y+i,g=t.clientX-r,d=t.clientY-o;return Math.pow(g,2)+Math.pow(d,2)<Math.pow(i,2)}static ɵfac=function(e){return new(e||n)};static ɵcmp=(function(){let t=[`trackActive`],e=[`*`];function i(d,u){if(d&1&&Ip(0,`div`),d&2){let l=u.$implicit,v=u.$index,E=XE(3);yD(l===0?`mdc-slider__tick-mark--active`:`mdc-slider__tick-mark--inactive`),eh(`transform`,E._calcTickMarkTransform(v))}}function r(d,u){if(d&1&&lE(0,i,1,4,`div`,8,aE),d&2){let l=XE(2);uE(l._tickMarks)}}function o(d,u){if(d&1&&($r(0,`div`,6,1),rE(2,r,2,0),vc()),d&2){let l=XE();$v(2),sE(l._cachedWidth?2:-1)}}function g(d,u){if(d&1&&Ip(0,`mat-slider-visual-thumb`,7),d&2){let l=XE();yp(`discrete`,l.discrete)(`thumbPosition`,1)(`valueIndicatorText`,l.startValueIndicatorText)}}return AI({type:n,selectors:[[`mat-slider`]],contentQueries:function(u,l,v){if(u&1&&Qp(v,Gt,5)(v,de,4),u&2){let E;rD(E=iD())&&(l._input=E.first),rD(E=iD())&&(l._inputs=E)}},viewQuery:function(u,l){if(u&1&&Zp(t,5)(Zt,5),u&2){let v;rD(v=iD())&&(l._trackActive=v.first),rD(v=iD())&&(l._thumbs=v)}},hostAttrs:[1,`mat-mdc-slider`,`mdc-slider`],hostVars:12,hostBindings:function(u,l){u&2&&(yD(`mat-`+(l.color||`primary`)),th(`mdc-slider--range`,l._isRange)(`mdc-slider--disabled`,l.disabled)(`mdc-slider--discrete`,l.discrete)(`mdc-slider--tick-marks`,l.showTickMarks)(`_mat-animation-noopable`,l._noopAnimations))},inputs:{disabled:[2,`disabled`,`disabled`,dA],discrete:[2,`discrete`,`discrete`,dA],showTickMarks:[2,`showTickMarks`,`showTickMarks`,dA],min:[2,`min`,`min`,fA],color:`color`,disableRipple:[2,`disableRipple`,`disableRipple`,dA],max:[2,`max`,`max`,fA],step:[2,`step`,`step`,fA],displayWith:`displayWith`},exportAs:[`matSlider`],features:[$D([{provide:et,useExisting:n}])],ngContentSelectors:e,decls:9,vars:5,consts:[[`trackActive`,``],[`tickMarkContainer`,``],[1,`mdc-slider__track`],[1,`mdc-slider__track--inactive`],[1,`mdc-slider__track--active`],[1,`mdc-slider__track--active_fill`],[1,`mdc-slider__tick-marks`],[3,`discrete`,`thumbPosition`,`valueIndicatorText`],[3,`class`,`transform`]],template:function(u,l){u&1&&(tD(),nD(0),$r(1,`div`,2),Ip(2,`div`,3),$r(3,`div`,4),Ip(4,`div`,5,0),vc(),rE(6,o,3,1,`div`,6),vc(),rE(7,g,1,3,`mat-slider-visual-thumb`,7),Ip(8,`mat-slider-visual-thumb`,7)),u&2&&($v(6),sE(l.showTickMarks?6:-1),$v(),sE(l._isRange?7:-1),$v(),yp(`discrete`,l.discrete)(`thumbPosition`,2)(`valueIndicatorText`,l.endValueIndicatorText))},dependencies:[ce],styles:[`.mdc-slider__track {
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
`],encapsulation:2})})()}return n})();var he={provide:x$1,useExisting:Uo(()=>it),multi:!0};var it=(()=>{class n{_ngZone=E(Z);_elementRef=E(ho);_cdr=E(cA);_slider=E(et);_platform=E(h);_listenerCleanups;get value(){return fA(this._hostElement.value,0)}set value(t){t===null&&(t=this._getDefaultValue()),t=isNaN(t)?0:t;let e=t+``;if(!this._hasSetInitialValue){this._initialValue=e;return}this._isActive||this._setValue(e)}_setValue(t){this._hostElement.value=t,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges(),this._slider._cdr.markForCheck()}valueChange=new Pe;dragStart=new Pe;dragEnd=new Pe;get translateX(){return this._slider.min>=this._slider.max?(this._translateX=this._tickMarkOffset,this._translateX):(this._translateX===void 0&&(this._translateX=this._calcTranslateXByValue()),this._translateX)}set translateX(t){this._translateX=t}_translateX;thumbPosition=s.END;get min(){return fA(this._hostElement.min,0)}set min(t){this._hostElement.min=t+``,this._cdr.detectChanges()}get max(){return fA(this._hostElement.max,0)}set max(t){this._hostElement.max=t+``,this._cdr.detectChanges()}get step(){return fA(this._hostElement.step,0)}set step(t){this._hostElement.step=t+``,this._cdr.detectChanges()}get disabled(){return dA(this._hostElement.disabled)}set disabled(t){this._hostElement.disabled=t,this._cdr.detectChanges(),this._slider.disabled!==this.disabled&&(this._slider.disabled=this.disabled)}get percentage(){return this._slider.min>=this._slider.max?this._slider._isRtl()?1:0:(this.value-this._slider.min)/(this._slider.max-this._slider.min)}get fillPercentage(){return this._slider._cachedWidth?this._translateX===0?0:this.translateX/this._slider._cachedWidth:this._slider._isRtl()?1:0}_hostElement=this._elementRef.nativeElement;_valuetext=xe(``);_knobRadius=8;_tickMarkOffset=3;_isActive=!1;_isFocused=!1;_setIsFocused(t){this._isFocused=t}_hasSetInitialValue=!1;_initialValue;_formControl;_destroyed=new S;_skipUIUpdate=!1;_onChangeFn;_onTouchedFn=()=>{};_isControlInitialized=!1;constructor(){let t=E(da);this._ngZone.runOutsideAngular(()=>{this._listenerCleanups=[t.listen(this._hostElement,`pointerdown`,this._onPointerDown.bind(this)),t.listen(this._hostElement,`pointermove`,this._onPointerMove.bind(this)),t.listen(this._hostElement,`pointerup`,this._onPointerUp.bind(this))]})}ngOnDestroy(){this._listenerCleanups.forEach(t=>t()),this._destroyed.next(),this._destroyed.complete(),this.dragStart.complete(),this.dragEnd.complete()}initProps(){this._updateWidthInactive(),this.disabled!==this._slider.disabled&&(this._slider.disabled=!0),this.step=this._slider.step,this.min=this._slider.min,this.max=this._slider.max,this._initValue()}initUI(){this._updateThumbUIByValue()}_initValue(){this._hasSetInitialValue=!0,this._initialValue===void 0?this.value=this._getDefaultValue():(this._hostElement.value=this._initialValue,this._updateThumbUIByValue(),this._slider._onValueChange(this),this._cdr.detectChanges())}_getDefaultValue(){return this.min}_onBlur(){this._setIsFocused(!1),this._onTouchedFn()}_onFocus(){this._slider._setTransition(!1),this._slider._updateTrackUI(this),this._setIsFocused(!0)}_onChange(){this.valueChange.emit(this.value),this._isActive&&this._updateThumbUIByValue({withAnimation:!0})}_onInput(){this._onChangeFn?.(this.value),(this._slider.step||!this._isActive)&&this._updateThumbUIByValue({withAnimation:!this._isActive}),this._slider._onValueChange(this)}_onNgControlValueChange(){(!this._isActive||!this._isFocused)&&(this._slider._onValueChange(this),this._updateThumbUIByValue()),this._slider.disabled=this._formControl.disabled}_onPointerDown(t){if(!(this.disabled||t.button!==0)){if(this._platform.IOS){let e=this._slider._isCursorOnSliderThumb(t,this._slider._getThumb(this.thumbPosition)._hostElement.getBoundingClientRect());this._isActive=e,this._updateWidthActive(),this._slider._updateDimensions();return}this._isActive=!0,this._setIsFocused(!0),this._updateWidthActive(),this._slider._updateDimensions(),this._slider.step||this._updateThumbUIByPointerEvent(t,{withAnimation:!0}),this.disabled||(this._handleValueCorrection(t),this.dragStart.emit({source:this,parent:this._slider,value:this.value}))}}_handleValueCorrection(t){this._skipUIUpdate=!0,setTimeout(()=>{this._skipUIUpdate=!1,this._fixValue(t)},0)}_fixValue(t){let e=t.clientX-this._slider._cachedLeft,i=this._slider._cachedWidth,r=this._slider.step===0?1:this._slider.step,o=Math.floor((this._slider.max-this._slider.min)/r),g=this._slider._isRtl()?1-e/i:e/i,u=Math.round(g*o)/o*(this._slider.max-this._slider.min)+this._slider.min,l=Math.round(u/r)*r;if(l===this.value){this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(t,{withAnimation:this._slider._hasAnimation});return}this.value=l,this.valueChange.emit(this.value),this._onChangeFn?.(this.value),this._slider._onValueChange(this),this._slider.step>0?this._updateThumbUIByValue():this._updateThumbUIByPointerEvent(t,{withAnimation:this._slider._hasAnimation})}_onPointerMove(t){!this._slider.step&&this._isActive&&this._updateThumbUIByPointerEvent(t)}_onPointerUp(){this._isActive&&(this._isActive=!1,this._platform.SAFARI&&this._setIsFocused(!1),this.dragEnd.emit({source:this,parent:this._slider,value:this.value}),setTimeout(()=>this._updateWidthInactive(),this._platform.IOS?10:0))}_clamp(t){let e=this._tickMarkOffset,i=this._slider._cachedWidth-this._tickMarkOffset;return Math.max(Math.min(t,i),e)}_calcTranslateXByValue(){return this._slider._isRtl()?(1-this.percentage)*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset:this.percentage*(this._slider._cachedWidth-this._tickMarkOffset*2)+this._tickMarkOffset}_calcTranslateXByPointerEvent(t){return t.clientX-this._slider._cachedLeft}_updateWidthActive(){}_updateWidthInactive(){this._hostElement.style.padding=`0 ${this._slider._inputPadding}px`,this._hostElement.style.width=`calc(100% + ${this._slider._inputPadding-this._tickMarkOffset*2}px)`,this._hostElement.style.left=`-${this._slider._rippleRadius-this._tickMarkOffset}px`}_updateThumbUIByValue(t){this.translateX=this._clamp(this._calcTranslateXByValue()),this._updateThumbUI(t)}_updateThumbUIByPointerEvent(t,e){this.translateX=this._clamp(this._calcTranslateXByPointerEvent(t)),this._updateThumbUI(e)}_updateThumbUI(t){this._slider._setTransition(!!t?.withAnimation),this._slider._onTranslateXChange(this)}writeValue(t){(this._isControlInitialized||t!==null)&&(this.value=t)}registerOnChange(t){this._onChangeFn=t,this._isControlInitialized=!0}registerOnTouched(t){this._onTouchedFn=t}setDisabledState(t){this.disabled=t}focus(){this._hostElement.focus()}blur(){this._hostElement.blur()}static ɵfac=function(e){return new(e||n)};static ɵdir=PI({type:n,selectors:[[`input`,`matSliderThumb`,``]],hostAttrs:[`type`,`range`,1,`mdc-slider__input`],hostVars:1,hostBindings:function(e,i){e&1&&Gp(`change`,function(){return i._onChange()})(`input`,function(){return i._onInput()})(`blur`,function(){return i._onBlur()})(`focus`,function(){return i._onFocus()}),e&2&&vp(`aria-valuetext`,i._valuetext())},inputs:{value:[2,`value`,`value`,fA]},outputs:{valueChange:`valueChange`,dragStart:`dragStart`,dragEnd:`dragEnd`},exportAs:[`matSliderThumb`],features:[$D([he,{provide:Gt,useExisting:n}])]})}return n})();var Jt=(()=>{class n$1{static ɵfac=function(e){return new(e||n$1)};static ɵmod=kI({type:n$1});static ɵinj=fl({imports:[n,I]})}return n$1})();function te(n,a){if(!n.width||!n.height)return{width:0,height:0};if(!a)return{width:n.width,height:n.height};let t=n.width,e=t/a;return e>n.height&&(e=n.height,t=e*a),{width:t,height:e}}function ee(n,a){return nt({x:n.width/2,y:n.height/2,width:0,height:0},n,.86,a)}function nt(n,a,t,e){let i=te(a,e);if(!i.width)return{x:0,y:0,width:0,height:0};let r=i.width*t,o=i.height*t,g=n.x+n.width/2,d=n.y+n.height/2;return{x:q(g-r/2,0,a.width-r),y:q(d-o/2,0,a.height-o),width:r,height:o}}function ie(n,a,t){let e=te(a,t);return e.width?n.width/e.width:1}function ne(n,a,t,e){return x(w({},n),{x:q(n.x+a,0,e.width-n.width),y:q(n.y+t,0,e.height-n.height)})}function ae(n,a,t,e,i,r){let o=a.x+a.width,g=a.y+a.height,d=n===`nw`||n===`sw`,u=n===`nw`||n===`ne`,l=d?o:a.x,v=u?g:a.y,E=d?l:i.width-l,oe=u?v:i.height-v,V=d?o-(a.x+t):a.width+t,A=u?g-(a.y+e):a.height+e;if(r&&(A=V/r),V<=0||A<=0)return a;let G=Math.min(1,E/V,oe/A);return G<1&&(V*=G,A*=G),V<40||A<40?a:{x:d?l-V:l,y:u?v-A:v,width:V,height:A}}function re(n,a){let t=Math.min(1,a/Math.max(n.width,n.height));return{width:Math.max(1,Math.round(n.width*t)),height:Math.max(1,Math.round(n.height*t))}}function q(n,a,t){return Math.min(Math.max(n,a),t)}var ue=[`stage`];function _e(n,a){if(n&1&&($r(0,`p`,3),SD(1),vc()),n&2){let t=XE();$v(),ch(t.data.hint)}}function pe(n,a){n&1&&($r(0,`div`,4),SD(1),vc()),n&2&&($v(),ch(a))}function ge(n,a){n&1&&($r(0,`div`,9),Ip(1,`mat-spinner`,21),vc())}function ve(n,a){if(n&1){let t=gE();$r(0,`img`,22),Gp(`load`,function(){Ll(t);let i=XE(2);return Pl(i.measure())}),vc(),$r(1,`div`,23),Gp(`pointerdown`,function(i){Ll(t);let r=XE(2);return Pl(r.onPointerDown(i,`move`))}),$r(2,`div`,24),Ip(3,`div`,25)(4,`div`,26)(5,`div`,27)(6,`div`,28),vc(),$r(7,`span`,29),Gp(`pointerdown`,function(i){Ll(t);let r=XE(2);return Pl(r.onPointerDown(i,`nw`))}),vc(),$r(8,`span`,30),Gp(`pointerdown`,function(i){Ll(t);let r=XE(2);return Pl(r.onPointerDown(i,`ne`))}),vc(),$r(9,`span`,31),Gp(`pointerdown`,function(i){Ll(t);let r=XE(2);return Pl(r.onPointerDown(i,`sw`))}),vc(),$r(10,`span`,32),Gp(`pointerdown`,function(i){Ll(t);let r=XE(2);return Pl(r.onPointerDown(i,`se`))}),vc()()}if(n&2){let t=XE(2);yp(`src`,a,$d),$v(),yp(`ngStyle`,t.cropStyle())}}function be(n,a){if(n&1){let t=gE();$r(0,`button`,18),Gp(`click`,function(){Ll(t);let i=XE(2);return Pl(i.toggleLock())}),$r(1,`mat-icon`,19),SD(2),vc(),SD(3),vc()}if(n&2){let t=XE(2);$v(2),ch(t.lockAspect()?`lock`:`lock_open`),$v(),Cc(` `,t.lockAspect()?`Card shape`:`Free crop`,` `)}}function fe(n,a){if(n&1){let t=gE();$r(0,`div`,8,0),Gp(`pointermove`,function(i){Ll(t);let r=XE();return Pl(r.onPointerMove(i))})(`pointerup`,function(){Ll(t);let i=XE();return Pl(i.onPointerUp())})(`pointercancel`,function(){Ll(t);let i=XE();return Pl(i.onPointerUp())}),rE(2,ge,2,0,`div`,9),rE(3,ve,11,2),vc(),$r(4,`div`,10)(5,`span`,11),SD(6,`Frame size`),vc(),$r(7,`mat-slider`,12)(8,`input`,13),$y(),Gp(`ngModelChange`,function(i){Ll(t);let r=XE();return Pl(r.setCropScale(i))}),vc()(),$r(9,`span`,14),SD(10),vc()(),$r(11,`div`,15)(12,`span`,16),SD(13),vc(),$r(14,`div`,17)(15,`button`,18),Gp(`click`,function(){Ll(t);let i=XE();return Pl(i.resetCrop())}),$r(16,`mat-icon`,19),SD(17,`restart_alt`),vc(),SD(18,`Reset `),vc(),rE(19,be,4,2,`button`,20),vc()()}if(n&2){let t,e=XE();$v(2),sE(e.loading()?2:-1),$v(),sE((t=e.imageUrl())?3:-1,t),$v(4),yp(`min`,20)(`max`,100)(`step`,1),$v(),yp(`ngModel`,e.cropScale()),Wy(),$v(2),Cc(``,e.cropScale(),`%`),$v(3),Cc(`Output `,e.outputSize(),` px`),$v(6),sE(e.data.aspectRatio?19:-1)}}var se=class n{dialogRef=E(w$2);data=E($t);stageRef;imageUrl=xe(null);loading=xe(!0);working=xe(!1);error=xe(null);natural=xe({width:0,height:0});fitted=xe({left:0,top:0,width:0,height:0},{equal:(a,t)=>a.left===t.left&&a.top===t.top&&a.width===t.width&&a.height===t.height});crop=xe({x:0,y:0,width:0,height:0});lockAspect=xe(!0);get aspect(){return this.lockAspect()?this.data.aspectRatio:void 0}objectUrl=null;image=null;resize=null;drag=null;cropStyle=ut(()=>{let a=this.fitted(),t=this.natural(),e=this.crop();if(!t.width||!a.width)return{display:`none`};let i=a.width/t.width;return{left:`${a.left+e.x*i}px`,top:`${a.top+e.y*i}px`,width:`${e.width*i}px`,height:`${e.height*i}px`}});cropScale=ut(()=>Math.round(ie(this.crop(),this.natural(),this.aspect)*100));setCropScale(a){this.crop.set(nt(this.crop(),this.natural(),a/100,this.aspect))}outputSize=ut(()=>{let a=this.crop();return`${Math.round(a.width)} \xD7 ${Math.round(a.height)}`});constructor(){this.load()}load(){let a=URL.createObjectURL(this.data.file);this.objectUrl=a,this.imageUrl.set(a);let t=new Image;t.onload=()=>{this.image=t,this.natural.set({width:t.naturalWidth,height:t.naturalHeight}),this.resetCrop(),this.loading.set(!1),requestAnimationFrame(()=>this.measure())},t.onerror=()=>{this.error.set(`That file couldn't be read as an image.`),this.loading.set(!1)},t.src=a}resetCrop(){this.crop.set(ee(this.natural(),this.aspect))}toggleLock(){this.lockAspect.update(a=>!a),this.resetCrop()}measure(){let a=this.stageRef?.nativeElement,t=this.natural();if(!a||!t.width)return;let e={width:a.clientWidth,height:a.clientHeight};if(!e.width||!e.height)return;let i=Math.min(e.width/t.width,e.height/t.height),r=t.width*i,o=t.height*i;this.fitted.set({left:(e.width-r)/2,top:(e.height-o)/2,width:r,height:o}),this.watchStage(a)}watchStage(a){this.resize||typeof ResizeObserver>`u`||(this.resize=new ResizeObserver(()=>this.measure()),this.resize.observe(a))}onPointerDown(a,t){a.preventDefault(),a.stopPropagation(),this.measure(),a.target.setPointerCapture?.(a.pointerId),this.drag={mode:t,startX:a.clientX,startY:a.clientY,origin:w({},this.crop())}}onPointerMove(a){if(!this.drag)return;let t=this.fitted(),e=this.natural();if(!t.width)return;let i=e.width/t.width,r=(a.clientX-this.drag.startX)*i,o=(a.clientY-this.drag.startY)*i;this.crop.set(this.drag.mode===`move`?ne(this.drag.origin,r,o,e):ae(this.drag.mode,this.drag.origin,r,o,e,this.aspect))}onPointerUp(){this.drag=null}confirm(){return C(this,null,function*(){if(!this.image)return;this.working.set(!0);let a=this.crop(),t=re(a,2e3),e=document.createElement(`canvas`);e.width=t.width,e.height=t.height;let i=e.getContext(`2d`);if(!i){this.error.set(`Your browser could not process this image.`),this.working.set(!1);return}i.drawImage(this.image,a.x,a.y,a.width,a.height,0,0,e.width,e.height);let r=yield new Promise(o=>e.toBlob(o,this.data.outputType??`image/jpeg`,.9));if(this.working.set(!1),!r){this.error.set(`Could not produce the cropped image.`);return}this.dialogRef.close(r)})}cancel(){this.dialogRef.close(null)}ngOnDestroy(){this.resize?.disconnect(),this.objectUrl&&URL.revokeObjectURL(this.objectUrl)}static ɵfac=function(t){return new(t||n)};static ɵcmp=AI({type:n,selectors:[[`app-image-cropper-dialog`]],viewQuery:function(t,e){if(t&1&&Zp(ue,5),t&2){let i;rD(i=iD())&&(e.stageRef=i.first)}},decls:11,vars:5,consts:[[`stage`,``],[`mat-dialog-title`,``,1,`!mb-1`,`text-lg`,`font-semibold`,`text-gray-900`],[1,`!pt-1`],[1,`mb-3`,`text-xs`,`text-gray-500`],[1,`rounded-lg`,`border`,`border-red-200`,`bg-red-50`,`p-4`,`text-sm`,`text-red-700`],[1,`flex`,`justify-end`,`gap-2`],[`mat-button`,``,`type`,`button`,3,`click`],[`mat-flat-button`,``,`color`,`primary`,`type`,`button`,3,`click`,`disabled`],[1,`relative`,`select-none`,`overflow-hidden`,`rounded-lg`,`bg-gray-900`,2,`height`,`60vh`,`max-height`,`26rem`,`touch-action`,`none`,3,`pointermove`,`pointerup`,`pointercancel`],[1,`absolute`,`inset-0`,`flex`,`items-center`,`justify-center`],[1,`mt-3`,`flex`,`items-center`,`gap-3`],[1,`shrink-0`,`text-xs`,`text-gray-500`],[`discrete`,``,1,`flex-1`,3,`min`,`max`,`step`],[`matSliderThumb`,``,3,`ngModelChange`,`ngModel`],[1,`w-10`,`shrink-0`,`text-right`,`font-mono`,`text-xs`,`text-gray-600`],[1,`mt-2`,`flex`,`flex-wrap`,`items-center`,`justify-between`,`gap-2`],[1,`text-xs`,`text-gray-500`],[1,`flex`,`items-center`,`gap-2`],[`mat-stroked-button`,``,`type`,`button`,3,`click`],[1,`mr-1`],[`mat-stroked-button`,``,`type`,`button`],[`diameter`,`32`],[`alt`,``,1,`pointer-events-none`,`absolute`,`inset-0`,`h-full`,`w-full`,`object-contain`,3,`load`,`src`],[1,`absolute`,`cursor-move`,2,`box-shadow`,`0 0 0 9999px rgba(0, 0, 0, 0.55)`,`outline`,`1px solid rgba(255,255,255,0.9)`,3,`pointerdown`,`ngStyle`],[1,`pointer-events-none`,`absolute`,`inset-0`,2,`opacity`,`0.35`],[1,`absolute`,`inset-y-0`,`left-1/3`,`w-px`,`bg-white`],[1,`absolute`,`inset-y-0`,`left-2/3`,`w-px`,`bg-white`],[1,`absolute`,`inset-x-0`,`top-1/3`,`h-px`,`bg-white`],[1,`absolute`,`inset-x-0`,`top-2/3`,`h-px`,`bg-white`],[1,`absolute`,`-left-1.5`,`-top-1.5`,`h-3.5`,`w-3.5`,`cursor-nwse-resize`,`rounded-sm`,`bg-white`,`shadow`,3,`pointerdown`],[1,`absolute`,`-right-1.5`,`-top-1.5`,`h-3.5`,`w-3.5`,`cursor-nesw-resize`,`rounded-sm`,`bg-white`,`shadow`,3,`pointerdown`],[1,`absolute`,`-bottom-1.5`,`-left-1.5`,`h-3.5`,`w-3.5`,`cursor-nesw-resize`,`rounded-sm`,`bg-white`,`shadow`,3,`pointerdown`],[1,`absolute`,`-bottom-1.5`,`-right-1.5`,`h-3.5`,`w-3.5`,`cursor-nwse-resize`,`rounded-sm`,`bg-white`,`shadow`,3,`pointerdown`]],template:function(t,e){if(t&1&&($r(0,`h2`,1),SD(1),vc(),$r(2,`mat-dialog-content`,2),rE(3,_e,2,1,`p`,3),rE(4,pe,2,1,`div`,4)(5,fe,20,9),vc(),$r(6,`mat-dialog-actions`,5)(7,`button`,6),Gp(`click`,function(){return e.cancel()}),SD(8,`Cancel`),vc(),$r(9,`button`,7),Gp(`click`,function(){return e.confirm()}),SD(10),vc()()),t&2){let i;$v(),Cc(` `,e.data.title||`Crop photo`,`
`),$v(2),sE(e.data.hint?3:-1),$v(),sE((i=e.error())?4:5,i),$v(5),yp(`disabled`,e.loading()||e.working()||!!e.error()),$v(),Cc(` `,e.working()?`Cropping…`:`Use photo`,` `)}},dependencies:[Fn,rn,Wn,Xe,Bn,cn,Ve,Be,ze,je,Lt,jt,Mt,wt,Jt,Kt,it,J,Z$1],encapsulation:2})};export{se as i,Kt as n,it as r,Jt as t};