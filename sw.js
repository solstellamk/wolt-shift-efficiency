const APP_CACHE='wolt-app-shell-v5.0-beta1';
const APP_SHELL=['./','./index.html','./config.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
const STATE_CACHE='wolt-shift-local-state-v3', STATE_KEY='./__shift_state__';

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const c=await caches.open(APP_CACHE);await c.addAll(APP_SHELL);await self.skipWaiting()})());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('wolt-app-shell-')&&k!==APP_CACHE).map(k=>caches.delete(k)));await self.clients.claim()})());
});

self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{try{const fresh=await fetch(req);if(fresh?.ok){const c=await caches.open(APP_CACHE);c.put('./index.html',fresh.clone()).catch(()=>{})}return fresh}catch{return (await caches.match('./index.html'))||(await caches.match('./'))||Response.error()}})());
  return;
 }
 if(APP_SHELL.some(x=>{try{return new URL(x,self.location.href).pathname===url.pathname}catch{return false}})){
  event.respondWith((async()=>{const cached=await caches.match(req);const refresh=fetch(req).then(async r=>{if(r?.ok){const c=await caches.open(APP_CACHE);await c.put(req,r.clone())}return r}).catch(()=>null);return cached||await refresh||Response.error()})());
 }
});

async function saveState(state){const c=await caches.open(STATE_CACHE);await c.put(STATE_KEY,new Response(JSON.stringify(state),{headers:{'content-type':'application/json'}}))}
async function readState(){try{const c=await caches.open(STATE_CACHE),r=await c.match(STATE_KEY);return r?await r.json():null}catch{return null}}
self.addEventListener('message',event=>{if(event.data?.type==='SHIFT_STATE'&&event.data.state)event.waitUntil(saveState(event.data.state))});
self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  let data={title:'Wolt Shift',body:'Check your shift.',tag:'wolt-shift'};try{data={...data,...event.data.json()}}catch{}
  if(data.data?.type==='decision'){
   const local=await readState();
   if(local){
    if(local.shiftId&&data.data.shiftId&&local.shiftId!==data.data.shiftId)return;
    if(local.paused||local.ended||local.onDelivery)return;
    if(local.waitingSince&&data.data.waitingSince&&Number(local.waitingSince)!==Number(data.data.waitingSince))return;
    if(local.waitingSince&&local.rules&&data.data.reason!=='battery'){const mins=(Date.now()-Number(local.waitingSince))/60000,need=data.data.call==='GO HOME'?Number(local.rules.leave):Number(local.rules.move);if(Number.isFinite(need)&&mins<need)return;}
   }
  }
  await self.registration.showNotification(data.title,{body:data.body,tag:data.tag||'wolt-shift',renotify:true,icon:'./icon-192.png',badge:'./icon-192.png',data:data.data||{}});
 })());
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus' in client)return client.focus()}return self.clients.openWindow('./')}))});
