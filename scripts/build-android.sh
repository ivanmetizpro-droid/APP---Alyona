#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"
export JAVA_HOME="${ELEKTROSMETA_JAVA_HOME:-/workspace/toolchains/jdk-21.0.8+9}"
sdk="${ANDROID_HOME:-/workspace/toolchains/android-sdk}"
tools="$sdk/build-tools/34.0.0"
platform="$sdk/platforms/android-34/android.jar"
build="$project_root/.cache/android"
key_dir="${ELEKTROSMETA_SIGNING_DIR:-/workspace/private-signing}"
for tool in "$JAVA_HOME/bin/javac" "$tools/aapt2" "$tools/d8" "$tools/apksigner" "$platform"; do [[ -f "$tool" ]] || { echo "Missing tool: $tool" >&2; exit 1; }; done
[[ -f "$key_dir/release.p12" && -f "$key_dir/password" ]] || { echo 'Signing key required outside checkout; see scripts/create-signing-key.sh' >&2; exit 1; }
mkdir -p "$build/res" "$build/classes" "$build/dex" "$build/assets/www" artifacts
# Only allowlisted application resources, never personal data, test outputs or signing keys.
cp index.html manifest.webmanifest "$build/assets/www/"
for path in js css assets; do rm -rf "$build/assets/www/$path"; cp -R "$path" "$build/assets/www/"; done
"$tools/aapt2" compile --dir android/app/src/main/res -o "$build/resources.zip"
"$tools/aapt2" link -o "$build/base.apk" -I "$platform" --manifest android/app/src/main/AndroidManifest.xml --min-sdk-version 26 --target-sdk-version 34 --version-code 1 --version-name 1.0.0 -R "$build/resources.zip" -A "$build/assets"
"$JAVA_HOME/bin/javac" --release 8 -encoding UTF-8 -classpath "$platform" -d "$build/classes" android/app/src/main/java/ru/elektrosmeta/app/*.java
"$tools/d8" --release --min-api 26 --lib "$platform" --output "$build/dex" "$build"/classes/ru/elektrosmeta/app/*.class
cp "$build/base.apk" "$build/unsigned.apk"
(cd "$build/dex" && zip -q -X "$build/unsigned.apk" classes.dex)
"$tools/zipalign" -f 4 "$build/unsigned.apk" "$build/aligned.apk"
"$tools/apksigner" sign --ks "$key_dir/release.p12" --ks-key-alias elektrosmeta --ks-pass "file:$key_dir/password" --key-pass "file:$key_dir/password" --out artifacts/Elektrosmeta-1.0.0.apk "$build/aligned.apk"
"$tools/apksigner" verify --verbose --print-certs artifacts/Elektrosmeta-1.0.0.apk
"$tools/aapt2" dump badging artifacts/Elektrosmeta-1.0.0.apk
sha256sum artifacts/Elektrosmeta-1.0.0.apk > artifacts/Elektrosmeta-1.0.0.apk.sha256
