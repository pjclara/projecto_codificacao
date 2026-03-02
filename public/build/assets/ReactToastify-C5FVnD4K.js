import{c}from"./createLucideIcon-7jK4aAE1.js";import{j as e}from"./app-BIaS3vyG.js";import{B as p}from"./app-logo-icon-Cybb1-lG.js";import"./app-layout-AYh0gxqI.js";import{u as o}from"./useTranslation-CCuUns17.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],g=c("CircleX",x);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],k=c("Save",h);function v({data:i,columns:l,actions:t=[]}){const{t:n}=o();return e.jsxs("table",{className:"w-full min-w-[700px] sm:min-w-[900px] md:min-w-[1100px] leading-normal text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-gray-100 text-sm leading-normal text-gray-700 uppercase",children:[l.map(r=>e.jsx("th",{className:"px-6 py-3 text-left",children:r.label},r.key)),t.length>0&&e.jsx("th",{className:"px-6 py-3 text-center",children:n("Actions")})]})}),e.jsx("tbody",{children:i.map((r,d)=>e.jsxs("tr",{className:"border-b border-gray-200 transition hover:bg-gray-50",children:[l.map(a=>e.jsx("td",{className:"px-6 py-3 whitespace-nowrap",children:a.render?a.render(r):r[a.key]},a.key)),t.length>0&&e.jsx("td",{className:"px-6 py-3 text-center",children:t.map((a,m)=>{let s="default";return a.label==="delete"?s="destructive":a.label==="edit"&&(s="secondary"),e.jsx(p,{onClick:()=>a.onClick(r),variant:s.toLowerCase(),size:"sm",className:"mx-1",children:n(a.label)},m)})})]},d))})]})}export{g as C,v as G,k as S};
