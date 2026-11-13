# KLK incoming-call notifications

Deploy after configuring Firebase billing, Cloud Functions, and service-account permissions:

```sh
cd functions && npm install && cd ..
firebase deploy --only functions:notifyIncomingCall --project klk-familia
```

The trigger sends a high-priority data push to registered FCM tokens when a new ringing call is created. Verify that the existing client stores valid FCM tokens at `users/{uid}/pushTokens/{deviceId}` with a `token` field. It does not force a native Android ringtone or bypass OS restrictions. Test web/PWA and Android APK separately. Never put server credentials in the client.
