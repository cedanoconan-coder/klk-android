package klk.offline;
import android.Manifest;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.*;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name="KlkOffline", permissions={
 @Permission(alias="nearby",strings={Manifest.permission.BLUETOOTH_SCAN,Manifest.permission.BLUETOOTH_CONNECT,Manifest.permission.BLUETOOTH_ADVERTISE}),
 @Permission(alias="wifi",strings={"android.permission.NEARBY_WIFI_DEVICES"}),
 @Permission(alias="location",strings={Manifest.permission.ACCESS_FINE_LOCATION})
})
public class KlkOfflinePlugin extends Plugin {
 private final Set<String> connected=new HashSet<>();
 private final Set<String> pending=new HashSet<>();
 private ConnectionsClient client(){return Nearby.getConnectionsClient(getContext());}
 private void event(String type,String id,String value){
  JSObject o=new JSObject();o.put("type",type);o.put("id",id);o.put("value",value);notifyListeners("offlineEvent",o);
 }
 private final PayloadCallback payloads=new PayloadCallback(){
  @Override public void onPayloadReceived(String id,Payload p){
   if(connected.contains(id)&&p.getType()==Payload.Type.BYTES&&p.asBytes()!=null)
    event("message",id,new String(p.asBytes(),StandardCharsets.UTF_8));
  }
  @Override public void onPayloadTransferUpdate(String id,PayloadTransferUpdate u){}
 };
 private final ConnectionLifecycleCallback lifecycle=new ConnectionLifecycleCallback(){
  @Override public void onConnectionInitiated(String id,ConnectionInfo info){
   pending.add(id);event("verify",id,info.getAuthenticationDigits());
  }
  @Override public void onConnectionResult(String id,ConnectionResolution result){
   pending.remove(id);
   if(result.getStatus().isSuccess()){connected.add(id);event("connected",id,"");}
   else event("failed",id,"");
  }
  @Override public void onDisconnected(String id){connected.remove(id);pending.remove(id);event("disconnected",id,"");}
 };
 @PluginMethod public void start(PluginCall call){
  String[] aliases=android.os.Build.VERSION.SDK_INT>=33?new String[]{"nearby","wifi"}:android.os.Build.VERSION.SDK_INT>=31?new String[]{"nearby","location"}:new String[]{"location"};
  requestPermissionForAliases(aliases,call,"permissionResult");
 }
 @PermissionCallback private void permissionResult(PluginCall call){
  String[] aliases=android.os.Build.VERSION.SDK_INT>=33?new String[]{"nearby","wifi"}:android.os.Build.VERSION.SDK_INT>=31?new String[]{"nearby","location"}:new String[]{"location"};
  for(String a:aliases)if(getPermissionState(a)!=PermissionState.GRANTED){call.reject("Permiso requerido");return;}
  String name=call.getString("name","KLK");
  client().startAdvertising(name,"klk.offline.v1",lifecycle,new AdvertisingOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build())
   .addOnSuccessListener(v->client().startDiscovery("klk.offline.v1",new EndpointDiscoveryCallback(){
    @Override public void onEndpointFound(String id,DiscoveredEndpointInfo info){event("found",id,info.getEndpointName());}
    @Override public void onEndpointLost(String id){event("lost",id,"");}
   },new DiscoveryOptions.Builder().setStrategy(Strategy.P2P_CLUSTER).build()).addOnSuccessListener(x->call.resolve()).addOnFailureListener(e->{client().stopAdvertising();call.reject(e.getMessage());}))
   .addOnFailureListener(e->call.reject(e.getMessage()));
 }
 @PluginMethod public void connect(PluginCall call){
  String id=call.getString("id");if(id==null){call.reject("ID requerido");return;}
  client().requestConnection("KLK",id,lifecycle).addOnSuccessListener(v->call.resolve()).addOnFailureListener(e->call.reject(e.getMessage()));
 }
 @PluginMethod public void verify(PluginCall call){
  String id=call.getString("id");if(!pending.contains(id)){call.reject("Sin solicitud");return;}
  if(Boolean.TRUE.equals(call.getBoolean("accept")))client().acceptConnection(id,payloads).addOnSuccessListener(v->call.resolve()).addOnFailureListener(e->call.reject(e.getMessage()));
  else client().rejectConnection(id).addOnSuccessListener(v->call.resolve()).addOnFailureListener(e->call.reject(e.getMessage()));
 }
 @PluginMethod public void send(PluginCall call){
  String id=call.getString("id"),message=call.getString("message","");
  if(!connected.contains(id)||message.getBytes(StandardCharsets.UTF_8).length>16000){call.reject("Conexión o mensaje inválido");return;}
  client().sendPayload(id,Payload.fromBytes(message.getBytes(StandardCharsets.UTF_8))).addOnSuccessListener(v->call.resolve()).addOnFailureListener(e->call.reject(e.getMessage()));
 }
 @PluginMethod public void stop(PluginCall call){cleanup();call.resolve();}
 private void cleanup(){client().stopAdvertising();client().stopDiscovery();client().stopAllEndpoints();connected.clear();pending.clear();}
 @Override protected void handleOnDestroy(){cleanup();}
}
