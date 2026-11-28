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
 private boolean autoEnabled, lastOnline=true, requestingPermissions, destroyed;
 private boolean online(){try{android.net.ConnectivityManager cm=(android.net.ConnectivityManager)getSystemService(CONNECTIVITY_SERVICE);android.net.Network n=cm.getActiveNetwork();android.net.NetworkCapabilities c=n==null?null:cm.getNetworkCapabilities(n);return c!=null&&c.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_VALIDATED);}catch(SecurityException e){return true;}}
 private final Runnable networkWatch=new Runnable(){public void run(){boolean now=online();if(autoEnabled&&!now&&!active&&!requestingPermissions){show("Sin internet: activando Puente");start(hostMode);}if(now&&!lastOnline)show("Internet disponible");lastOnline=now;handler.postDelayed(this,3000);}};
 private final android.os.Handler handler=new android.os.Handler(android.os.Looper.getMainLooper());
 private final java.util.LinkedHashMap<String,String> pending=new java.util.LinkedHashMap<>();
 private final java.util.HashSet<String> received=new java.util.HashSet<>();
 private boolean savePending(){org.json.JSONObject j=new org.json.JSONObject(pending);return getPreferences(MODE_PRIVATE).edit().putString("pending",j.toString()).commit();}
 private void retry(){handler.removeCallbacks(reconnect);if(active)handler.postDelayed(reconnect,2500);}
 private final Runnable reconnect=()->{if(active&&peer==null&&!connecting)start(hostMode);};
 private void transmit(String id,String msg){if(peer==null)return;client.sendPayload(peer,Payload.fromBytes(("M:"+id+":"+msg).getBytes(StandardCharsets.UTF_8))).addOnFailureListener(e->show("Pendiente de entrega"));}
 private final Runnable resend=new Runnable(){public void run(){if(active&&peer!=null)for(java.util.Map.Entry<String,String> e:pending.entrySet())transmit(e.getKey(),e.getValue());handler.postDelayed(this,5000);}};
 private void show(String s){runOnUiThread(()->{if(destroyed||log==null)return;log.append(s+"\n");if(log.length()>24000)log.setText(log.getText().subSequence(log.length()-18000,log.length()));});}
 private final PayloadCallback payloads=new PayloadCallback(){
 public void onPayloadReceived(String id,Payload p){if(id.equals(peer)&&p.getType()==Payload.Type.BYTES){byte[] b=p.asBytes();if(b!=null&&b.length<=8192){String m=new String(b,StandardCharsets.UTF_8);if(m.startsWith("A:")){String key=m.substring(2);String old=pending.remove(key);if(old!=null){if(savePending())show("Mensaje entregado: "+key);else pending.put(key,old);}}else if(m.startsWith("M:")){int cut=m.indexOf(':',2);if(cut>2){String key=m.substring(2,cut);if(received.add(key)){if(!getPreferences(MODE_PRIVATE).edit().putStringSet("received",new java.util.HashSet<>(received)).putString("inbox_"+key,m.substring(cut+1)).commit()){received.remove(key);return;}show("Contacto: "+m.substring(cut+1));}client.sendPayload(id,Payload.fromBytes(("A:"+key).getBytes(StandardCharsets.UTF_8)));}}else show("Contacto: "+m);}}}
 public void onPayloadTransferUpdate(String id,PayloadTransferUpdate u){}
 };
 private final ConnectionLifecycleCallback lifecycle=new ConnectionLifecycleCallback(){
 public void onConnectionInitiated(String id,ConnectionInfo info){
 if(destroyed||!active||peer!=null){client.rejectConnection(id);return;} connecting=true;
 new AlertDialog.Builder(PuenteActivity.this).setTitle("Verificar conexión").setMessage("Confirma que ambos teléfonos muestran el mismo código: "+info.getAuthenticationDigits()).setPositiveButton("Coincide",(d,w)->client.acceptConnection(id,payloads).addOnFailureListener(e->{connecting=false;retry();})).setNegativeButton("Rechazar",(d,w)->client.rejectConnection(id)).setOnCancelListener(d->client.rejectConnection(id)).show();
 }
 public void onConnectionResult(String id,ConnectionResolution r){connecting=false;if(destroyed||!active){client.disconnectFromEndpoint(id);return;}if(r.getStatus().isSuccess()){peer=id;client.stopAdvertising();client.stopDiscovery();show("Conectado · envío y recepción");for(java.util.Map.Entry<String,String> e:pending.entrySet())transmit(e.getKey(),e.getValue());}else {show("Conexión no establecida");retry();}}
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
 if(!missing.isEmpty()){if(requestingPermissions)return;requestingPermissions=true;requestPermissions(missing.toArray(new String[0]),1);show("Concede permisos para conectar.");return;}
 client.stopAllEndpoints();client.stopAdvertising();client.stopDiscovery();peer=null;active=true;
 client.startAdvertising("KLK","com.klk.puente.v1",lifecycle,new AdvertisingOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build()).addOnSuccessListener(v->show("Esperando teléfono")).addOnFailureListener(e->{show("Error: "+e.getMessage());retry();});
 client.startDiscovery("com.klk.puente.v1",discovery,new DiscoveryOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build()).addOnSuccessListener(v->show("Buscando teléfono")).addOnFailureListener(e->{show("Error: "+e.getMessage());retry();});
 }
 @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){super.onRequestPermissionsResult(requestCode,permissions,results);if(requestCode!=1)return;requestingPermissions=false;boolean granted=results.length>0;for(int result:results)granted &= result==0;if(granted&&!destroyed)start(hostMode);else{autoEnabled=false;getPreferences(MODE_PRIVATE).edit().putBoolean("auto",false).apply();show("Permisos necesarios no concedidos");}}
 @Override public void onCreate(Bundle b){super.onCreate(b);client=Nearby.getConnectionsClient(this);LinearLayout layout=new LinearLayout(this);layout.setOrientation(1);layout.setPadding(24,24,24,24);TextView title=new TextView(this);title.setText("KLK Puente · Experimental");title.setTextSize(24);layout.addView(title);Button host=new Button(this);host.setText("Recibir conexión");layout.addView(host);host.setOnClickListener(v->start(true));Button search=new Button(this);search.setText("Buscar teléfono");layout.addView(search);search.setOnClickListener(v->start(false));Switch auto=new Switch(this);auto.setText("Activar Puente al perder internet");layout.addView(auto);autoEnabled=getPreferences(MODE_PRIVATE).getBoolean("auto",true);hostMode=getPreferences(MODE_PRIVATE).getBoolean("host",false);auto.setChecked(autoEnabled);auto.setOnCheckedChangeListener((v,enabled)->{autoEnabled=enabled;getPreferences(MODE_PRIVATE).edit().putBoolean("auto",enabled).apply();if(enabled&&!online())start(false);});log=new TextView(this);ScrollView scroll=new ScrollView(this);scroll.addView(log);layout.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));input=new EditText(this);input.setHint("Mensaje");layout.addView(input);Button send=new Button(this);send.setText("Enviar");layout.addView(send);send.setOnClickListener(v->{String msg=input.getText().toString().trim();byte[] bytes=msg.getBytes(StandardCharsets.UTF_8);if(bytes.length==0||bytes.length>4096)return;if(pending.size()>=100){show("Cola llena");return;}String id=java.util.UUID.randomUUID().toString();pending.put(id,msg);if(!savePending()){pending.remove(id);show("No se pudo guardar el mensaje");return;}show("Tú (pendiente): "+msg);input.setText("");transmit(id,msg);if(peer==null)show("Esperando conexión");});setContentView(layout);received.addAll(getPreferences(MODE_PRIVATE).getStringSet("received",java.util.Collections.emptySet()));for(String key:received){String saved=getPreferences(MODE_PRIVATE).getString("inbox_"+key,null);if(saved!=null)show("Contacto: "+saved);}try{org.json.JSONObject j=new org.json.JSONObject(getPreferences(MODE_PRIVATE).getString("pending","{}"));java.util.Iterator<String> it=j.keys();while(it.hasNext()){String k=it.next();pending.put(k,j.getString(k));}}catch(org.json.JSONException e){show("No se pudo restaurar la cola");}handler.postDelayed(resend,5000);handler.post(networkWatch);}
 @Override protected void onDestroy(){destroyed=true;active=false;handler.removeCallbacksAndMessages(null);client.stopAdvertising();client.stopDiscovery();client.stopAllEndpoints();super.onDestroy();}
}
