import{o,R as e,u as r,D as c,a as s,f as i,F as m,C as u,e as d,B as p}from"./index-lPGyvoX4.js";const E=o(function({model:t,onClose:n}){const{tracks:l}=t;return e.createElement(r.Dialog,{onClose:()=>n(),open:!0,title:"Add track"},e.createElement(c,null,e.createElement(s,null,"Open relevant per-alignment tracks e.g. protein domains"),e.createElement(i,null,l.map(a=>e.createElement(m,{key:a.model.id,control:e.createElement(u,{checked:!t.turnedOffTracks.has(a.model.id),onChange:()=>{t.toggleTrack(a.model.id)}}),label:a.model.name}))),e.createElement(d,null,e.createElement(p,{onClick:()=>n(),variant:"contained",color:"primary"},"Close"))))});export{E as default};
//# sourceMappingURL=TracklistDialog-CEpOKT_s.js.map