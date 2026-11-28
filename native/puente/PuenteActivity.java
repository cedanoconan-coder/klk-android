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
 private boolean active;
 private void show(String s){runOnUiThread(()->log.append(s+"\n"));}
 private final PayloadCallback payloads=new PayloadCallback(){
 public void onPayloadReceived(String id,Payload p){if(id.equals(peer)&&p.getType()==Payload.Type.BYTES){byte[] b=p.asBytes();if(b!=null&&b.length<=4096)show("Contacto: "+new String(b,StandardCharsets.UTF_8));}}
 public void onPayloadTransferUpdate(String id,PayloadTransferUpdate u){}
 };
 private final ConnectionLifecycleCallback lifecycle=new ConnectionLifecycleCallback(){
 public void onConnectionInitiated(String id,ConnectionInfo info){
 if(!active||peer!=null){client.rejectConnection(id);return;}
 new AlertDialog.Builder(PuenteActivity.this).setTitle("Verificar conexión").setMessage("Confirma que ambos teléfonos muestran el mismo código: "+info.getAuthenticationDigits()).setPositiveButton("Coincide",(d,w)->client.acceptConnection(id,payloads)).setNegativeButton("Rechazar",(d,w)->client.rejectConnection(id)).setOnCancelListener(d->client.rejectConnection(id)).show();
 }
 public void onConnectionResult(String id,ConnectionResolution r){if(r.getStatus().isSuccess()){peer=id;client.stopAdvertising();client.stopDiscovery();show("Conectado");}else show("Conexión no establecida");}
 public void onDisconnected(String id){if(id.equals(peer)){peer=null;show("Desconectado. Pulsa buscar o recibir para reconectar.");}}
 };
 private final EndpointDiscoveryCallback discovery=new EndpointDiscoveryCallback(){
 public void onEndpointFound(String id,DiscoveredEndpointInfo info){if(!active||peer!=null)return;client.stopDiscovery();client.requestConnection("KLK",id,lifecycle).addOnFailureListener(e->show("Error al conectar: "+e.getMessage()));}
 public void onEndpointLost(String id){}
 };
 private void start(boolean host){
 String[] permissions=android.os.Build.VERSION.SDK_INT>=33?new String[]{"android.permission.BLUETOOTH_SCAN","android.permission.BLUETOOTH_CONNECT","android.permission.BLUETOOTH_ADVERTISE","android.permission.NEARBY_WIFI_DEVICES"}:android.os.Build.VERSION.SDK_INT>=31?new String[]{"android.permission.BLUETOOTH_SCAN","android.permission.BLUETOOTH_CONNECT","android.permission.BLUETOOTH_ADVERTISE","android.permission.ACCESS_FINE_LOCATION"}:new String[]{"android.permission.ACCESS_FINE_LOCATION"};
 java.util.ArrayList<String> missing=new java.util.ArrayList<>();for(String p:permissions)if(checkSelfPermission(p)!=0)missing.add(p);
 if(!missing.isEmpty()){requestPermissions(missing.toArray(new String[0]),1);show("Concede permisos y pulsa nuevamente.");return;}
 client.stopAllEndpoints();client.stopAdvertising();client.stopDiscovery();peer=null;active=true;
 if(host)client.startAdvertising("KLK","com.klk.puente.v1",lifecycle,new AdvertisingOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()).addOnSuccessListener(v->show("Esperando teléfono")).addOnFailureListener(e->show("Error: "+e.getMessage()));
 else client.startDiscovery("com.klk.puente.v1",discovery,new DiscoveryOptions.Builder().setStrategy(Strategy.P2P_POINT_TO_POINT).build()).addOnSuccessListener(v->show("Buscando teléfono")).addOnFailureListener(e->show("Error: "+e.getMessage()));
 }
 @Override public void onCreate(Bundle b){super.onCreate(b);client=Nearby.getConnectionsClient(this);LinearLayout layout=new LinearLayout(this);layout.setOrientation(1);layout.setPadding(24,24,24,24);TextView title=new TextView(this);title.setText("KLK Puente · Experimental");title.setTextSize(24);layout.addView(title);Button host=new Button(this);host.setText("Recibir conexión");layout.addView(host);host.setOnClickListener(v->start(true));Button search=new Button(this);search.setText("Buscar teléfono");layout.addView(search);search.setOnClickListener(v->start(false));log=new TextView(this);ScrollView scroll=new ScrollView(this);scroll.addView(log);layout.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));input=new EditText(this);input.setHint("Mensaje");layout.addView(input);Button send=new Button(this);send.setText("Enviar");layout.addView(send);send.setOnClickListener(v->{String msg=input.getText().toString().trim();byte[] bytes=msg.getBytes(StandardCharsets.UTF_8);if(peer==null){show("Conecta primero");return;}if(bytes.length==0||bytes.length>4096)return;client.sendPayload(peer,Payload.fromBytes(bytes)).addOnSuccessListener(x->{show("Tú (envío iniciado): "+msg);input.setText("");}).addOnFailureListener(e->show("No enviado: "+e.getMessage()));});setContentView(layout);}
 @Override protected void onDestroy(){active=false;client.stopAdvertising();client.stopDiscovery();client.stopAllEndpoints();super.onDestroy();}
}
