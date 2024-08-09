async function s(t,e){const n=await fetch(t,e);if(!n.ok)throw new Error(`HTTP ${n.status} fetching ${t} ${await n.text()}`);return n}async function o(t,e){return(await s(t,e)).text()}async function r(t,e){return(await s(t,e)).json()}function a(t){return new Promise(e=>setTimeout(e,t))}export{a,r as j,o as t};
//# sourceMappingURL=fetchUtils-iNLkv-IC.js.map
