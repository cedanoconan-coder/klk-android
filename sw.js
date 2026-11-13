self.addEventListener("notificationclick", event => {
  event.notification.close();
  const info = event.notification.data || {};
  const target = new URL(info.url || "./", self.location.origin).href;
  if (event.action === "decline") return;
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientsList) {
      if (client.url.startsWith(self.registration.scope) && "focus" in client) { await client.focus(); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAgMkDOS77y-jHnzCEteQW1UgC90gShjuU",
  authDomain: "klk-familia.firebaseapp.com",
  projectId: "klk-familia",
  storageBucket: "klk-familia.firebasestorage.app",
  messagingSenderId: "184754934059",
  appId: "1:184754934059:web:1d385677b2c7c00699b56e",
  measurementId: "G-DXX2PHDNN0"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const data = payload && payload.data ? payload.data : {};
  if (data.type === "incoming_call" && typeof data.callId === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(data.callId)) {
    const video = data.mode === "video";
    const caller = typeof data.callerName === "string" ? data.callerName.slice(0,80) : "Un contacto";
    return self.registration.showNotification("KLK · Llamada entrante", {
      body: caller + (video ? " te está videollamando" : " te está llamando"),
      icon: "./icon.svg", badge: "./icon.svg",
      tag: "klk-call-" + data.callId, renotify: true,
      requireInteraction: true,
      vibrate: [350,150,350,150,350],
      data: { url: "./?incomingCall=" + encodeURIComponent(data.callId) },
      actions: [{action:"answer",title:"Abrir llamada"},{action:"decline",title:"Cerrar aviso"}]
    });
  }
  const title = data.title || "klk · Nuevo mensaje";
  const body = typeof data.body === "string" && data.body.trim() ? data.body.trim().slice(0,240) : "Tienes un mensaje nuevo";
  return self.registration.showNotification(title, {
    body,
    icon: "./icon.svg",
    badge: "./icon.svg",
    tag: "klk-" + (data.conversationId || "message"),
    data: { url: "./?from=notification" },
    actions: [{action:"open",title:"Ver conversación"}],
    timestamp: Date.now(),
    renotify: true,
    vibrate: [180, 80, 180]
  });
});
const CACHE_NAME = "klk-shell-v150";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./calls.js?v=139", "./navigation.js", "./chat-camera.js"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(APP_SHELL.map(path => cache.add(path)))));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("klk-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET")return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin)return;
  // No almacenar invitaciones ni respuestas de servicios privados.
  if(url.searchParams.has("invite"))return;
  const isShell = request.mode === "navigate" || /\.(?:js|css|svg|webmanifest|html)$/.test(url.pathname) || url.pathname.endsWith("/");
  if(!isShell)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(request.mode==="navigate"){
      try{const fresh=await fetch(request,{cache:"no-store"});if(fresh.ok)await cache.put(request,fresh.clone());return fresh;}catch(error){return (await cache.match(request))||(await cache.match("./index.html"))||Response.error();}
    }
    const cached=await cache.match(request);
    const update=fetch(request).then(async fresh=>{if(fresh.ok)await cache.put(request,fresh.clone());return fresh;});
    if(cached){event.waitUntil(update.catch(()=>{}));return cached;}
    try{return await update;}catch(error){return Response.error();}
  })());
});
