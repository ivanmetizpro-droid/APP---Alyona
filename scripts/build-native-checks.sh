#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME=/workspace/toolchains/jdk-21.0.8+9
sdk="${ANDROID_HOME:-/workspace/toolchains/android-sdk}"
bt="$sdk/build-tools/35.0.0"
build="$PWD/.cache/native-checks"
key_dir="${ELEKTROSMETA_SIGNING_DIR:-/workspace/private-signing}"
mkdir -p "$build/classes" "$build/dex"
"$bt/aapt2" link -o "$build/base.apk" -I "$sdk/platforms/android-34/android.jar" --manifest android/tests/AndroidManifest.xml
"$JAVA_HOME/bin/javac" --release 8 -encoding UTF-8 -classpath "$sdk/platforms/android-34/android.jar" -d "$build/classes" android/tests/NativeChecks.java
"$bt/d8" --release --min-api 26 --lib "$sdk/platforms/android-34/android.jar" --output "$build/dex" "$build/classes/ru/elektrosmeta/tests/NativeChecks.class"
cp "$build/base.apk" "$build/unsigned.apk"
(cd "$build/dex" && zip -q -X "$build/unsigned.apk" classes.dex)
"$bt/zipalign" -f 4 "$build/unsigned.apk" "$build/aligned.apk"
"$bt/apksigner" sign --ks "$key_dir/release.p12" --ks-key-alias elektrosmeta --ks-pass "file:$key_dir/password" --out "$build/checks.apk" "$build/aligned.apk"
