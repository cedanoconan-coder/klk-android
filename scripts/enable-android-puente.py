from pathlib import Path
import shutil
import xml.etree.ElementTree as ET
root=Path("android/app/src/main")
dest=root/"java/com/klk/puente/PuenteActivity.java"
dest.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile("native/puente/PuenteActivity.java",dest)
gradle=Path("android/app/build.gradle")
s=gradle.read_text()
gradle.write_text(s+"\ndependencies { implementation 'com.google.android.gms:play-services-nearby:19.3.0' }\n")
ns="http://schemas.android.com/apk/res/android"
ET.register_namespace("android",ns)
a=lambda x:"{"+ns+"}"+x
manifest=root/"AndroidManifest.xml"
tree=ET.parse(manifest)
r=tree.getroot()
for name,limit in [("BLUETOOTH",30),("BLUETOOTH_ADMIN",30),("ACCESS_FINE_LOCATION",32),("ACCESS_WIFI_STATE",None),("CHANGE_WIFI_STATE",None),("BLUETOOTH_SCAN",None),("BLUETOOTH_CONNECT",None),("BLUETOOTH_ADVERTISE",None),("NEARBY_WIFI_DEVICES",None)]:
    attrs={a("name"):"android.permission."+name}
    if limit: attrs[a("maxSdkVersion")]=str(limit)
    if name in ("BLUETOOTH_SCAN","NEARBY_WIFI_DEVICES"): attrs[a("usesPermissionFlags")]="neverForLocation"
    if not any(e.get(a("name"))==attrs[a("name")] for e in r.findall("uses-permission")): r.insert(0,ET.Element("uses-permission",attrs))
activity=ET.SubElement(r.find("application"),"activity",{a("name"):"com.klk.puente.PuenteActivity",a("exported"):"true",a("label"):"KLK Puente (prueba)"})
f=ET.SubElement(activity,"intent-filter")
ET.SubElement(f,"action",{a("name"):"android.intent.action.MAIN"})
ET.SubElement(f,"category",{a("name"):"android.intent.category.LAUNCHER"})
tree.write(manifest,encoding="utf-8",xml_declaration=True)
