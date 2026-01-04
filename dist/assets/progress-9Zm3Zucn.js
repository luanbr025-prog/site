import{c as f,l as I,j as l,P as m,g as w}from"./index-mXCqq1OC.js";import{r as u}from"./vendor-FSxQ-XKV.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=f("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=f("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);var c="Progress",d=100,[E,D]=I(c),[R,T]=E(c),g=u.forwardRef((e,r)=>{const{__scopeProgress:n,value:o=null,max:a,getValueLabel:b=j,...h}=e;(a||a===0)&&!p(a)&&console.error(_(`${a}`,"Progress"));const s=p(a)?a:d;o!==null&&!v(o,s)&&console.error(k(`${o}`,"Progress"));const t=v(o,s)?o:null,$=i(t)?b(t,s):void 0;return l.jsx(R,{scope:n,value:t,max:s,children:l.jsx(m.div,{"aria-valuemax":s,"aria-valuemin":0,"aria-valuenow":i(t)?t:void 0,"aria-valuetext":$,role:"progressbar","data-state":y(t,s),"data-value":t??void 0,"data-max":s,...h,ref:r})})});g.displayName=c;var x="ProgressIndicator",P=u.forwardRef((e,r)=>{const{__scopeProgress:n,...o}=e,a=T(x,n);return l.jsx(m.div,{"data-state":y(a.value,a.max),"data-value":a.value??void 0,"data-max":a.max,...o,ref:r})});P.displayName=x;function j(e,r){return`${Math.round(e/r*100)}%`}function y(e,r){return e==null?"indeterminate":e===r?"complete":"loading"}function i(e){return typeof e=="number"}function p(e){return i(e)&&!isNaN(e)&&e>0}function v(e,r){return i(e)&&!isNaN(e)&&e<=r&&e>=0}function _(e,r){return`Invalid prop \`max\` of value \`${e}\` supplied to \`${r}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${d}\`.`}function k(e,r){return`Invalid prop \`value\` of value \`${e}\` supplied to \`${r}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${d} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`}var N=g,M=P;const V=u.forwardRef(({className:e,value:r,...n},o)=>l.jsx(N,{ref:o,className:w("relative h-4 w-full overflow-hidden rounded-full bg-secondary",e),...n,children:l.jsx(M,{className:"h-full w-full flex-1 bg-primary transition-all",style:{transform:`translateX(-${100-(r||0)}%)`}})}));V.displayName=N.displayName;export{V as P,S as T,C as a};
