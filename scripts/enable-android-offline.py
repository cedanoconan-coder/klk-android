from pathlib import Path
import shutil
root=Path("android/app/src/main")
dest=root/"java/klk/offline/KlkOfflinePlugin.java"
dest.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile("native-offline/KlkOfflinePlugin.java",dest)
activity=root/"java/com/klk/familia/MainActivity.java"
s=activity.read_text()
anchor="extends BridgeActivity {"
assert anchor in s
s=s.replace(anchor,anchor+"""
    @Override
    public void onCreate(android.os.Bundle state) {
        registerPlugin(klk.offline.KlkOfflinePlugin.class);
        super.onCreate(state);
    }
""",1)
activity.write_text(s)
gradle=Path("android/app/build.gradle")
s=gradle.read_text()
assert "dependencies {" in s
gradle.write_text(s.replace("dependencies {","dependencies {\n    implementation 'com.google.android.gms:play-services-nearby:19.3.0'",1))
manifest=root/"AndroidManifest.xml"
s=manifest.read_text()
permissions={"BLUETOOTH":' android:maxSdkVersion="30"',"BLUETOOTH_ADMIN":' android:maxSdkVersion="30"',"ACCESS_FINE_LOCATION":' android:maxSdkVersion="32"',"ACCESS_WIFI_STATE":"","CHANGE_WIFI_STATE":"","BLUETOOTH_SCAN":' android:usesPermissionFlags="neverForLocation"',"BLUETOOTH_CONNECT":"","BLUETOOTH_ADVERTISE":"","NEARBY_WIFI_DEVICES":' android:usesPermissionFlags="neverForLocation"'}
lines="".join(f'<uses-permission android:name="android.permission.{p}"{a} />\n' for p,a in permissions.items() if f'android.permission.{p}"' not in s)
manifest.write_text(s.replace("<application",lines+"<application",1))
