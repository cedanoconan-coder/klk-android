#!/usr/bin/env python3
"""Enable Android picture-in-picture only while a KLK video call is visible."""
from pathlib import Path
import re

manifest = Path("android/app/src/main/AndroidManifest.xml")
xml = manifest.read_text()
xml, count = re.subn(r'(<activity\b[^>]*android:name="\.MainActivity"[^>]*)(>)',
    lambda m: m.group(1) + ' android:supportsPictureInPicture="true" android:resizeableActivity="true"' + m.group(2)
    if 'supportsPictureInPicture' not in m.group(1) else m.group(0), xml, count=1, flags=re.S)
if count != 1:
    raise SystemExit("MainActivity not found in AndroidManifest.xml")
manifest.write_text(xml)

activity = Path("android/app/src/main/java/com/klk/familia/MainActivity.java")
if not activity.exists():
    raise SystemExit("Generated Capacitor MainActivity not found")
activity.write_text("""package com.klk.familia;

import android.app.PictureInPictureParams;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Rational;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean videoCallVisible = false;
    private final Runnable monitor = new Runnable() {
        @Override public void run() {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(
                    "(function(){var individual=document.getElementById('callOverlay');" +
                    "var group=document.getElementById('klkGroupOverlay');" +
                    "var individualVisible=individual && individual.classList.contains('visible');" +
                    "var groupVisible=group && getComputedStyle(group).display!=='none';" +
                    "var active=individualVisible?individual:(groupVisible?group:null);" +
                    "return !!(active && Array.from(active.querySelectorAll('video')).some(v=>" +
                    "v.srcObject && v.srcObject.getVideoTracks().some(t=>t.readyState==='live')));})()",
                    result -> {
                        videoCallVisible = "true".equals(result);
                        if (Build.VERSION.SDK_INT >= 26) {
                            PictureInPictureParams.Builder params = new PictureInPictureParams.Builder()
                                .setAspectRatio(new Rational(9, 16));
                            if (Build.VERSION.SDK_INT >= 31) params.setAutoEnterEnabled(videoCallVisible);
                            setPictureInPictureParams(params.build());
                        }
                    });
            }
            handler.postDelayed(this, 900);
        }
    };

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        handler.post(monitor);
    }

    @Override public void onUserLeaveHint() {
        if (Build.VERSION.SDK_INT >= 26 && Build.VERSION.SDK_INT < 31 && videoCallVisible) {
            enterPictureInPictureMode(new PictureInPictureParams.Builder()
                .setAspectRatio(new Rational(9, 16)).build());
        }
        super.onUserLeaveHint();
    }

    @Override public void onPictureInPictureModeChanged(boolean inPip, android.content.res.Configuration config) {
        super.onPictureInPictureModeChanged(inPip, config);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "document.documentElement.classList.toggle('klk-native-pip'," + inPip + ")", null);
        }
    }

    @Override public void onDestroy() {
        handler.removeCallbacks(monitor);
        super.onDestroy();
    }
}
""")
print("Android video PiP enabled")
