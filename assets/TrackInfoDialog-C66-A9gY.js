import{m as c,o as s,r as i,R as e,u as d,D as u,B as r,e as m}from"./index-lPGyvoX4.js";import{c as p}from"./index-Ds00izCo.js";const f=c()(a=>({textArea:{padding:a.spacing(2),overflow:"auto",background:"#ddd",wordBreak:"break-word"}})),b=s(function({model:a,onClose:t}){const[n,o]=i.useState("Copy to clipboard"),{classes:l}=f();return e.createElement(d.Dialog,{open:!0,onClose:t,fullWidth:!0,maxWidth:"lg",title:`Track info - ${a.name}`},e.createElement(u,null,e.createElement(r,{variant:"contained",color:"primary",onClick:()=>{p(a.data),o("Copied!"),setTimeout(()=>{o("Copy to clipboard")},300)}},n),e.createElement("pre",{className:l.textArea},a.data)),e.createElement(m,null,e.createElement(r,{variant:"contained",onClick:t,color:"secondary"},"Close")))});export{b as default};
//# sourceMappingURL=TrackInfoDialog-C66-A9gY.js.map