#!/usr/bin/env bash
set -euo pipefail
key_dir="${ELEKTROSMETA_SIGNING_DIR:-/workspace/private-signing}"
java_home="${ELEKTROSMETA_JAVA_HOME:-/workspace/toolchains/jdk-21.0.8+9}"
[[ ! -e "$key_dir/release.p12" ]] || { echo 'Existing key preserved'; exit 0; }
umask 077
mkdir -p "$key_dir"
openssl rand -base64 36 > "$key_dir/password"
"$java_home/bin/keytool" -genkeypair -keystore "$key_dir/release.p12" -storetype PKCS12 -alias elektrosmeta -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Elektrosmeta Release, O=Elektrosmeta' -storepass:file "$key_dir/password" -keypass:file "$key_dir/password" >/dev/null 2>&1
(cd "$key_dir" && zip -q Elektrosmeta-signing-backup.zip release.p12 password)
echo 'Signing key created outside repository; preserve its private backup for updates.'
