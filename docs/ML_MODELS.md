# Offline model packages

The app ships with **mock engines** so every screen and the full translation
pipeline can be exercised without trained models. This document describes how
the real on-device models plug in and how they fit the size budget.

| Budget item | Target | Notes |
|---|---|---|
| Initial APK (per ABI, arm64-v8a) | < 80 MB | Release build, minified, ARM-only ABIs, no bundled models |
| Optional model pack | < 200 MB | Downloaded once over Wi‑Fi, or side-loaded from SD card / SHAREit-style transfer |
| Gesture inference | ≥ 15–20 FPS | INT8 landmark models, 256×256 input, every frame on a worker thread |

## 1. Sign → Speech (gesture recognition)

Interface: `src/engines/gesture/types.ts` (`GestureRecognizer`). The UI and the
parser (`src/translation/gestureParser.ts`) only see a stream of
`GesturePrediction { label, confidence, timestamp }`, so the mock can be
swapped for a real engine without touching the UI.

Recommended pipeline (all on-device):

```
front camera (VisionCamera frame processor, 15–20 FPS, 480p)
  → MediaPipe Hand Landmarker  (hand_landmarker.task, INT8, ~7.5 MB)
  → MediaPipe Pose / Face Landmarker (optional, for non-manual markers, ~5–10 MB)
  → frameFeatures()  — src/engines/gesture/landmarks.ts (wrist-relative, scale-normalised)
  → FeatureWindow    — sliding window of N frames
  → ZSL sequence classifier (.tflite, INT8 or FP16, 1–5 MB)
  → decode()         — softmax → GesturePrediction
  → GestureStreamParser → glosses → glossesToText() → native TTS
```

Steps to enable:

1. Collect and annotate ZSL clips **with Deaf ZSL signers** from both Harare and
   Bulawayo, labelled with the gloss ids in `src/db/seed.ts` (regional variants
   use the `GLOSS@bulawayo` label form; fingerspelled letters use `FS:A` … `FS:Z`).
2. Extract landmarks with MediaPipe, train a small temporal model (1D-CNN/GRU),
   and export with post-training INT8 quantisation (`tf.lite.Optimize.DEFAULT`
   + representative dataset). Keep the label order in a `labels.json`.
3. Add `react-native-vision-camera` + `react-native-fast-tflite` (or a MediaPipe
   Tasks config plugin) via `npx expo install`, and implement a
   `TfliteGestureRecognizer` that feeds `FeatureWindow` → model → `decode()`.
4. Return it from `createGestureRecognizer()` in `src/engines/gesture/index.ts`
   when the model files are present, falling back to the mock otherwise.

Budget tips for 2 GB devices: run the classifier only every 2nd frame if FPS
drops, use the GPU/NNAPI delegate where available and fall back to XNNPACK
CPU, and keep camera resolution at 480p.

## 2. Speech → Sign (speech recognition)

Interface: `src/engines/speech/stt.ts`. `getSpeechRecognizer()` prefers Vosk
when the native module and the model for the selected language exist, otherwise
the scripted mock.

1. `npx expo install react-native-vosk` and add its config plugin to `app.json`
   with the model folders listed in `VOSK_MODELS`
   (`src/engines/speech/VoskSpeechRecognizer.ts`):
   - `model-en` — `vosk-model-small-en-us-0.15` (~40 MB). An English model
     adapted to Zimbabwean accents is recommended for production.
   - `model-sn`, `model-nd` — no public small Vosk models exist yet. Train a
     Kaldi model on Shona/Ndebele speech data (Mozilla Common Voice, local radio
     corpora, community recordings). Until then the adapter passes the
     dictionary vocabulary as a **grammar**, giving keyword recognition.
2. Alternative: whisper.cpp `ggml-tiny-q5_1` (~31 MB) via `whisper.rn`; quality
   for Shona/Ndebele requires fine-tuning.

## 3. Sign rendering

The avatar (`src/components/SignAvatar.tsx`) is a procedural SVG driven by
keyframes generated from each sign's descriptor (`src/translation/keyframes.ts`)
and stored as JSON in SQLite — a few hundred bytes per sign instead of video.
If recorded clips are preferred, add a `media` column to the `signs` table with
compressed WEBP/MP4 files under 100 KB each (≈ 1,000 signs ≈ 100 MB, which fits
the optional pack).

## 4. Delivering the model pack offline

- Ship the APK without models (< 80 MB).
- On first launch, offer: "Download over Wi‑Fi" (optional), or import a
  `zsl-models.zip` from local storage/SD card, which can be shared phone-to-phone
  without data via Bluetooth/Wi‑Fi Direct.
- Unpack into `FileSystem.documentDirectory/models/` and point the engines there.
