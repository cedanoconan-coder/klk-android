package com.klk.puente;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.widget.*;
import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.*;
import java.nio.charset.StandardCharsets;

public class PuenteActivity extends Activity {
 private ConnectionsClient client;
 private String peer;
 private TextView log;
 private EditText input;
 private boolean active, hostMode, connecting;
 private boolean autoEnabled, lastOnline=true;
 private boolean online(){try{android.net.ConnectivityManager cm=(android.net.ConnectivityManager)getSystemService(CONNECTIVITY_SERVICE);android.net.Network n=cm.getActiveNetwork();android.net.NetworkCapabilities c=n==null?null:cm.getNetworkCapabilities(n);return c!=null&&c.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_VALIDATED);}catch(SecurityException e){return true;}}
 private final Runnable networkWatch=new Runnable(){public void run(){boolean now=online();if(autoEnabled&&!now&&lastOnline&&!active){show("Sin internet: activando Puente");start(hostMode);}if(now&&!lastOnline)show("Internet disponible");lastOnline=now;handler.postDelayed(this,3000);}};
 private final android.os.Handler handler=new android.os.Handler(android.os.Looper.getMainLooper());
 private final java.util.LinkedHashMap<String,String> pending=new java.util.LinkedHashMap<>();
 private final java.util.HashSet<String> received=new java.util.HashSet<>();
 private void savePending(){org.json.JSONObject j=new org.json.JSONObject(pending);getPreferences(MODE_PRIVATE).edit().putString("pending",j.toString()).commit();}
 private void retry(){handler.removeCallbacks(reconnect);if(active)handler.postDelayed(reconnect,2500);}
 private final Runnable reconnect=()->{if(active&&peer==null&&!connecting)start(hostMode);};
 private void transmit(String id,String msg){if(peer==null)return;client.sendPayload(peer,Payload.fromBytes(("M:"+id+":"+msg).getBytes(StandardCharsets.UTF_8))).addOnFailureListener(e->show("Pendiente de entrega"));}
 private final Runnable resend=new Runnable(){public void run(){if(active&&peer!=null)for(java.util.Map.Entry<String,String> e:pending.entrySet())transmit(e.getKey(),e.getValue());handler.postDelayed(this,5000);}};
 private void show(String s){runOnUiThread(()->log.append(s+"\n"));}
 private final PayloadCallback payloads=new PayloadCallback(){
 public void onPayloadReceived(String id,Payload p){if(id.equals(peer)&&p.getType()==Payload.Type.BYTES){byte[] b=p.asBytes();if(b!=null&&b.length<=8192){String m=new String(b,StandardCharsets.UTF_8);if(m.startsWith("A:")){if(pending.remove(m.substring(2))!=null){savePending();show("Mensaje entregado: "+m.substring(2));}}else if(m.startsWith("M:")){int cut=m.indexOf(':',2);if(cut>2){String key=m.substring(2,cut);if(received.add(key))show("Contacto: "+m.substring(cut+1));client.sendPayload(id,Payload.fromBytes(("A:"+key).getBytes(StandardCharsets.UTF_8)));}}else show("Contacto: "+m);}}}
 public void onPayloadTransferUpdate(String id,PayloadTransferUpdate u){}
 };
 private final ConnectionLifecycleCallback lifecycle=new ConnectionLifecycleCallback(){
 public void onConnectionInitiated(String id,ConnectionInfo info){
 if(!active||peer!=null){client.rejectConnection(id);return;} connecting=true;
 new AlertDialog.Builder(PuenteActivity.this).setTitle("Verificar conexión").setMessage("Confirma que ambos teléfonos muestran el mismo código: "+info.getAuthenticationDigits()).setPositiveButton("Coincide",(d,w)->client.acceptConnection(id,payloads)).setNegativeButton("Rechazar",(d,w)->client.rejectConnection(id)).setOnCancelListener(d->client.rejectConnection(id)).show();
 }
 public void onConnectionResult(String id,ConnectionResolution r){connecting=false;if(r.getStatus().isSuccess()){peer=id;client.stopAdvertising();client.stopDiscovery();show("Conectado · envío y recepción");for(java.util.Map.Entry<String,String> e:pending.entrySet())transmit(e.getKey(),e.getValue());}else {show("Conexión no establecida");retry();}}
 public void onDisconnected(String id){if(id.equals(peer)){peer=null;connecting=false;show("Desconectado. Reconectando…");retry();}}
 };
 private final EndpointDiscoveryCallback discovery=new EndpointDiscoveryCallback(){
 public void onEndpointFound(String id,DiscoveredEndpointInfo info){if(!active||peer!=null||connecting)return;connecting=true;client.stopDiscovery();client.requestConnection("KLK",id,lifecycle).addOnFailureListener(e->{connecting=false;show("Error al conectar: "+e.getMessage());retry();});}
 public void onEndpointLost(String id){}
 };
 private void start(boolean host){
 if(peer!=null||connecting){show("Conexión activa o en proceso");return;}hostMode=host;
 String[] permissions=android.os.Build.VERSION.SDK_INT>=33?new String[]{"android.permission.BLUETOOTH_SCAN","android.permission.BLUETOOTH_CONNECT","android.permission.BLUETOOTH_ADVERTISE","android.permission.NEARBY_WIFI_DEVICES"}:android.os.Build.VERSION.SDK_INT>=31?new String[]{"android.permission.BLUETOOTH_SCAN","android.permission.BLUETOOTH_CONNECT","android.permission.BLUETOOTH_ADVERTISE","android.permission.ACCESS_FINE_LOCATION"}:new String[]{"android.permission.ACCESS_FINE_LOCATION"};
 java.util.ArrayList<String> missing=new java.util.ArrayList<>();for(String p:permissions)if(checkSelfPermission(p)!=0)missing.add(p);
 if(!missing.isEmpty()){requestPermissions(missing.toArray(new String[0]),1);show("Concede permisos y pulsa nuevamente.");return;}
 client.stopAllEndpoints();client.stopAdvertising();client.stopDiscovery();peer=null;active=true;
 if(host)client.startAdvertising("KLK","com.klk.puente.v1",lifecycle,new AdvertisingOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()).addOnSuccessListener(v->show("Esperando teléfono")).addOnFailureListener(e->{show("Error: "+e.getMessage());retry();});
 else client.startDiscovery("com.klk.puente.v1",discovery,new DiscoveryOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()).addOnSuccessListener(v->show("Buscando teléfono")).addOnFailureListener(e->{show("Error: "+e.getMessage());retry();});
 }
 @Override public void onCreate(Bundle b){super.onCreate(b);client=Nearby.getConnectionsClient(this);LinearLayout layout=new LinearLayout(this);layout.setOrientation(1);layout.setPadding(24,24,24,24);TextView title=new TextView(this);title.setText("KLK Puente · Experimental");title.setTextSize(24);layout.addView(title);Button host=new Button(this);host.setText("Recibir conexión");layout.addView(host);host.setOnClickListener(v->start(true));Button search=new Button(this);search.setText("Buscar teléfono");layout.addView(search);search.setOnClickListener(v->start(false));Switch auto=new Switch(this);auto.setText("Activar Puente al perder internet");layout.addView(auto);auto.setOnCheckedChangeListener((v,enabled)->{autoEnabled=enabled;if(enabled){new AlertDialog.Builder(this).setTitle("Modo automático").setItems(new String[]{"Recibir conexión","Buscar teléfono"},(d,w)->{hostMode=w==0;lastOnline=true;}).setOnCancelListener(d->auto.setChecked(false)).show();}});log=new TextView(this);ScrollView scroll=new ScrollView(this);scroll.addView(log);layout.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));input=new EditText(this);input.setHint("Mensaje");layout.addView(input);Button send=new Button(this);send.setText("Enviar");layout.addView(send);send.setOnClickListener(v->{String msg=input.getText().toString().trim();byte[] bytes=msg.getBytes(StandardCharsets.UTF_8);if(bytes.length==0||bytes.length>4096)return;if(pending.size()>=100){show("Cola llena");return;}String id=java.util.UUID.randomUUID().toString();pending.put(id,msg);savePending();show("Tú (pendiente): "+msg);input.setText("");transmit(id,msg);if(peer==null)show("Esperando conexión");});setContentView(layout);try{org.json.JSONObject j=new org.json.JSONObject(getPreferences(MODE_PRIVATE).getString("pending","{}"));java.util.Iterator<String> it=j.keys();while(it.hasNext()){String k=it.next();pending.put(k,j.getString(k));}}catch(org.json.JSONException e){show("No se pudo restaurar la cola");}handler.postDelayed(resend,5000);handler.postDelayed(networkWatch,3000);}
 @Override protected void onDestroy(){active=false;handler.removeCallbacksAndMessages(null);client.stopAdvertising();client.stopDiscovery();client.stopAllEndpoints();super.onDestroy();}
}
