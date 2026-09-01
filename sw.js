const STATE_CACHE='wolt-shift-local-state-v3', STATE_KEY='./__shift_state__';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
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
    if(local.waitingSince&&local.rules){const mins=(Date.now()-Number(local.waitingSince))/60000,need=data.data.call==='GO HOME'?Number(local.rules.leave):Number(local.rules.move);if(Number.isFinite(need)&&mins<need)return;}
   }
  }
  await self.registration.showNotification(data.title,{body:data.body,tag:data.tag||'wolt-shift',renotify:true,icon:'./icon-192.png',badge:'./icon-192.png',data:data.data||{}});
 })())
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus' in client)return client.focus()}return self.clients.openWindow('./')}))});
