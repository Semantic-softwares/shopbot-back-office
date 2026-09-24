import{H as Lt,In as ne,Lt as ae,Sn as k,dt as To,mn as hA,s as AI,v as E}from"./chunk-5XvVQiy2.js";var r=new WeakMap;var w=(()=>{class e{_appRef;_injector=E(ne);_environmentInjector=E(ae);load(t){let n=this._appRef=this._appRef||this._injector.get(To),o=r.get(n);o||(o={loaders:new Set,refs:[]},r.set(n,o),n.onDestroy(()=>{r.get(n)?.refs.forEach(m=>m.destroy()),r.delete(n)})),o.loaders.has(t)||(o.loaders.add(t),o.refs.push(hA(t,{environmentInjector:this._environmentInjector})))}static ɵfac=function(n){return new(n||e)};static ɵprov=Lt({token:e,factory:e.ɵfac})}return e})();var T=(()=>{class e{static ɵfac=function(n){return new(n||e)};static ɵcmp=AI({type:e,selectors:[[`ng-component`]],exportAs:[`cdkVisuallyHidden`],decls:0,vars:0,template:function(n,o){},styles:[`.cdk-visually-hidden {
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  white-space: nowrap;
  outline: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  left: 0;
}
[dir=rtl] .cdk-visually-hidden {
  left: auto;
  right: 0;
}
`],encapsulation:2})}return e})();var a;function g(){if(a===void 0&&(a=null,typeof window<`u`)){let e=window;if(e.trustedTypes!==void 0)try{a=e.trustedTypes.createPolicy(`angular#components`,{createHTML:i=>i})}catch(i){console.error(i)}}return a}function M(e){return g()?.createHTML(e)||e}function j(e,i,t){e.innerHTML=M(t.sanitize(k.HTML,i)||``)}export{w as i,T as n,j as r,M as t};