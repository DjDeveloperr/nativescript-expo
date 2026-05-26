# Demo Pass

This folder contains an unsigned Apple Wallet pass definition for the
NativeScriptRN demo.

To make it addable with `PKAddPassesViewController`, package this `pass.json`
with required pass artwork, generate `manifest.json`, and sign the manifest
with an Apple Pass Type ID certificate. The resulting signed zip should use the
`.pkpass` extension.

Build it from the project root:

```sh
npm run pass:build
```

Without signing material this creates `build/demo-pass/NativeScriptRN.unsigned.zip`
for inspection only. Wallet will reject it.

To create an addable pass, provide either a `.p12` Pass Type ID certificate plus
Apple WWDR certificate:

```sh
PASS_P12=/path/pass.p12 \
PASS_P12_PASSWORD=... \
WWDR_CERT_PEM=/path/wwdr.pem \
npm run pass:build
```

Or provide extracted PEM files:

```sh
PASS_CERT_PEM=/path/pass-cert.pem \
PASS_KEY_PEM=/path/pass-key.pem \
WWDR_CERT_PEM=/path/wwdr.pem \
npm run pass:build
```
