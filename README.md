# ZSL Translator — Offline Zimbabwean Sign Language & Speech Translator

Two-way, **100 % offline** translator between Zimbabwean Sign Language (ZSL)
and English / ChiShona / isiNdebele, built with Expo (React Native +
TypeScript) for budget Android phones (2–4 GB RAM).

> **Linguistic disclaimer** — the starter dictionary in `src/db/seed.ts`
> (sign descriptors, regional variants, Shona/Ndebele translations) is a
> placeholder for development. It **must be reviewed by Deaf ZSL signers and
> Shona/Ndebele speakers** before any real-world use.

## Features

| | |
|---|---|
| **Camera Mode (Sign → Speech)** | Front camera, on-device gesture recognition (mock engine by default, TFLite/MediaPipe interface ready), gesture-sequence parser → structured phrases, output toggle EN / SN / ND, native Android TextToSpeech |
| **Mic Mode (Speech → Sign)** | Offline speech recognition (Vosk adapter, mock fallback), text input fallback for noisy kombis, text → ZSL gloss conversion with fingerspelling for unknown words/names, vector avatar playback at 0.5× / 1× / 1.5× with frame-by-frame stepping and scrubbing |
| **Dictionary** | Searchable SQLite dictionary with Harare/Bulawayo variants and per-sign avatar preview |
| **Zimbabwe-ready UI** | Persistent "Offline active · 0 MB data" badge, one-tap Camera/Mic switch, large icon buttons, pure-black low-power dark mode for load shedding, high-contrast outdoor mode, UI in English / ChiShona / isiNdebele |
| **No network** | No network calls anywhere in the app; all data in an embedded SQLite DB |

## Project structure

```
src/
  app/               Expo Router screens: index (translator), dictionary, settings
  components/        CameraPanel, MicPanel, SignPlayer, SignAvatar, Scrubber, OfflineBadge, ModeSwitch, ui
  db/                SQLite schema + migrations (database.ts), starter ZSL dataset (seed.ts)
  engines/
    gesture/         GestureRecognizer interface, MockGestureRecognizer, landmark features for TFLite
    speech/          native TTS (expo-speech), SpeechRecognizer interface, Vosk adapter, mock STT
  translation/       gestureParser (gesture stream → glosses), glossToText, textToGloss,
                     fingerspelling, keyframes + signSequence (avatar animation)
  state/             Settings (persisted in expo-sqlite kv-store) and Dictionary contexts
  theme/, i18n/      dark/outdoor themes, UI strings (en/sn/nd)
docs/ML_MODELS.md    how to plug in real TFLite/MediaPipe and Vosk models + size budget
```

## Prerequisites

- **Node.js 20 or 22 LTS** and npm
- **JDK 17** (e.g. `sudo apt install openjdk-17-jdk`, or the JBR that ships with Android Studio)
- **Android SDK** — easiest via [Android Studio](https://developer.android.com/studio):
  SDK Platform 36, Build-Tools, Platform-Tools, Emulator, and NDK (Gradle will install the NDK version it needs)
- Environment variables (add to `~/.bashrc` / `~/.zshrc`):
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk          # macOS: $HOME/Library/Android/sdk
  export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH
  ```

> Expo Go is **not** supported: the app uses native modules (SQLite, camera,
> and later TFLite/Vosk), so it runs as a development or release build.

## Run on an Android emulator — step by step

1. **Install dependencies**
   ```bash
   git clone <this-repo> zsl-translator && cd zsl-translator
   npm install
   ```
2. **Create an emulator** (Android Studio → Device Manager → *Create device* →
   e.g. Pixel 4a, system image API 34 **x86_64**, RAM 2048 MB to mimic a budget phone),
   or from the command line:
   ```bash
   sdkmanager "system-images;android-34;google_apis;x86_64"
   avdmanager create avd -n zsl -k "system-images;android-34;google_apis;x86_64"
   emulator -avd zsl -memory 2048 &
   adb devices        # should list emulator-5554  device
   ```
3. **Build, install and start** (generates `android/` with Expo CNG, compiles, installs, starts Metro):
   ```bash
   npx expo run:android
   ```
   The first build takes 5–15 min (Gradle + NDK downloads). Subsequent JS changes hot-reload.
4. **Allow the camera/microphone** permissions when prompted. On the emulator the
   front camera is a virtual scene — the mock recogniser does not use pixels, so
   the pipeline works regardless.

### Release build on the emulator (no Metro, fully offline)

`app.json` restricts release builds to ARM ABIs (real phones). For an x86_64
emulator, override the architecture:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=x86_64
adb install -r app/build/outputs/apk/release/app-release.apk
```

## Run on a physical Android phone

1. Enable **Developer options** (Settings → About phone → tap *Build number* 7×),
   then enable **USB debugging**.
2. Connect via USB, accept the RSA prompt, check `adb devices`.
3. Either run a dev build: `npx expo run:android --device`,
   or build and install the offline release APK:
   ```bash
   npm run android:build          # = expo prebuild + gradlew assembleRelease
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```
   The APK can also be copied to the phone and installed directly (allow
   *Install unknown apps*), or shared phone-to-phone offline.
4. Turn on **Airplane mode** and use the app — everything keeps working.

> The release build is signed with the debug keystore generated by Expo
> prebuild. For Play Store distribution, configure your own keystore
> (see https://docs.expo.dev/guides/local-app-production/).

## Using the app

1. **Camera Mode** — tap *Start*. The mock engine replays scripted ZSL sentences
   (with realistic noise) at 15 FPS; the live gloss, FPS, recognised tokens and the
   translated sentence appear, and are spoken aloud with the device TTS
   (toggle output language EN / SN / ND; auto-speak can be switched off in Settings).
2. **Mic Mode** — tap the microphone (mock or Vosk STT) or type text, e.g.
   *"Hello, I need a doctor"*, *"Mhoro, ndinoda chiremba"*, *"Sawubona, ngifuna udokotela"*.
   The avatar signs the glosses; use 0.5× / 1× / 1.5×, ⏮ ⏭ for single frames,
   or drag the scrubber. Unknown words (names) are fingerspelled.
3. **Dictionary** (book icon) — search in any language, tap a sign to preview it.
4. **Settings** (gear icon) — dark / outdoor theme, UI language, Harare /
   Bulawayo regional variants, auto-speak.

Shona/Ndebele TTS voices are rarely installed on Android; the app falls back to
a related voice (e.g. isiZulu for Ndebele) or English and shows which voice was
used. Install extra voices via *Settings → System → Languages → Text-to-speech*.

## Development commands

```bash
npm test             # Jest unit tests (gesture parser, text→gloss, engines)
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
npx expo-doctor      # dependency/config checks
```

## Size & performance budget

- Release APK is ARM-only (`armeabi-v7a`, `arm64-v8a`) with R8 minification and
  resource shrinking (`expo-build-properties` in `app.json`). Build per-ABI APKs or an
  AAB for the Play Store to keep downloads small.
- No ML weights are bundled; the optional model pack (< 200 MB) and how to
  build/deliver it are described in [docs/ML_MODELS.md](docs/ML_MODELS.md).
- The gesture parser is O(1) per frame and the avatar renders at 12 FPS with
  simple SVG primitives, keeping CPU and battery use low.

## Replacing the mocks with real models

See [docs/ML_MODELS.md](docs/ML_MODELS.md). In short: implement
`GestureRecognizer` with VisionCamera + TFLite/MediaPipe and return it from
`src/engines/gesture/index.ts`; install `react-native-vosk` and bundle models
named in `VOSK_MODELS` to enable real offline speech recognition.
