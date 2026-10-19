# Android APK

This is a small native Android container for the existing HTML game. The APK
bundles the complete game and art, loads it using AndroidX WebViewAssetLoader,
and works offline immediately. It has no internet or device-data permissions,
no JavaScript-to-native bridge, and uses Android System WebView for rendering.
Requires Android 8.0 or newer. Newer System WebView versions are recommended.

## Build

Install Java 17+ and the Android SDK (platform 36, build tools 35/36). From the
repository root in PowerShell:

```powershell
.\scripts\build-android.ps1
```

The Gradle wrapper downloads its pinned Gradle distribution and dependencies
on the first build. Output: `dist/EscapeRoom-0.9.0.apk`. The build includes
Android lint and signature verification. Use `-Offline` for a cached build.

The first build creates a signing key and random password under
`android/.signing/`. **Back up this folder privately.** It is excluded from Git
and the APK. Losing the key means later builds cannot update an existing
installation. Never share the key or password with APK downloads. Increase
`versionCode` in `app/build.gradle` for every subsequent distributed APK.

Only the explicit web-file/art allowlist in `app/build.gradle` is bundled.
Root source image exports, tests, Git history and private keys are excluded.
To update the app, rebuild and reinstall an APK signed with the same key.
The installed APK does not download website changes automatically.

## Install and behavior

Download the APK on an Android phone, open it, and allow that browser or file
manager to install apps when Android asks. This is a directly installed build,
not a Google Play listing. Completed decks, records and sound preferences are
saved separately from the browser/PWA; existing browser progress is not copied.
Reinstalling an update keeps app data; uninstalling clears it. An active game
is not restored if Android closes the app process. Rotation preserves the
running page. Back closes code/discard/item dialogs or a puzzle, returns from the gallery or mini-games,
and asks before abandoning a deck or exiting.

For native WebView inspection, build `assembleDebug` and inspect the debug
app with Chrome's Android remote debugger. Release APKs disable WebView
debugging. The web game test suite remains `npm test`.

With an authorized emulator running, `node scripts/test-android.cjs` checks the
signed release APK's offline screens, persisted sound preference, Story deal,
mini-game, gallery, and native Back behavior. It only accepts emulator serials;
set `ANDROID_SERIAL` to choose one (default `emulator-5556`). Test screenshots
are saved under `.qa-output/`. It temporarily disables the emulator's network
and re-enables it on exit.
