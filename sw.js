self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("push",event=>{
  let data={title:"Wolt Shift",body:"Check your shift.",tag:"wolt-shift"};
  try{data={...data,...event.data.json()}}catch{}
  event.waitUntil(self.registration.showNotification(data.title,{
    body:data.body,tag:data.tag||"wolt-shift",renotify:true,
    icon:"./icon.svg",badge:"./icon.svg",data:data.data||{}
  }));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){if("focus" in client)return client.focus()}
    return self.clients.openWindow("./");
  }));
});