#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'assets', 'demo-pass');
const buildDir = path.join(root, 'build', 'demo-pass');
const bundleDir = path.join(buildDir, 'NativeScriptRN.pass');
const outputPath = path.join(buildDir, 'NativeScriptRN.pkpass');
const unsignedPath = path.join(buildDir, 'NativeScriptRN.unsigned.zip');

function rmrf(target) {
  fs.rmSync(target, { force: true, recursive: true });
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function sha1(filePath) {
  return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');
}

function writeManifest() {
  const manifest = {};
  for (const fileName of fs.readdirSync(bundleDir).sort()) {
    if (fileName === 'manifest.json' || fileName === 'signature') {
      continue;
    }

    const filePath = path.join(bundleDir, fileName);
    if (fs.statSync(filePath).isFile()) {
      manifest[fileName] = sha1(filePath);
    }
  }

  fs.writeFileSync(
    path.join(bundleDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

function makeArtwork() {
  const sourceIcon = path.join(root, 'assets', 'icon.png');
  const outputs = [
    ['icon.png', 29],
    ['icon@2x.png', 58],
    ['icon@3x.png', 87],
    ['logo.png', 160],
    ['logo@2x.png', 320],
  ];

  for (const [name, size] of outputs) {
    const destination = path.join(bundleDir, name);
    const result = spawnSync(
      'sips',
      ['-z', String(size), String(size), sourceIcon, '--out', destination],
      { encoding: 'utf8' },
    );

    if (result.status !== 0) {
      copyFile(sourceIcon, destination);
    }
  }
}

function signWithPem() {
  const cert = process.env.PASS_CERT_PEM;
  const key = process.env.PASS_KEY_PEM;
  const wwdr = process.env.WWDR_CERT_PEM;

  if (!cert || !key || !wwdr) {
    return false;
  }

  execFileSync('openssl', [
    'smime',
    '-binary',
    '-sign',
    '-certfile',
    wwdr,
    '-signer',
    cert,
    '-inkey',
    key,
    '-in',
    path.join(bundleDir, 'manifest.json'),
    '-out',
    path.join(bundleDir, 'signature'),
    '-outform',
    'DER',
  ]);

  return true;
}

function signWithP12() {
  const p12 = process.env.PASS_P12;
  const password = process.env.PASS_P12_PASSWORD ?? '';
  const wwdr = process.env.WWDR_CERT_PEM;

  if (!p12 || !wwdr) {
    return false;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nativescriptrn-pass-'));
  const cert = path.join(tempDir, 'pass-cert.pem');
  const key = path.join(tempDir, 'pass-key.pem');

  try {
    execFileSync('openssl', [
      'pkcs12',
      '-in',
      p12,
      '-clcerts',
      '-nokeys',
      '-out',
      cert,
      '-passin',
      `pass:${password}`,
    ]);
    execFileSync('openssl', [
      'pkcs12',
      '-in',
      p12,
      '-nocerts',
      '-nodes',
      '-out',
      key,
      '-passin',
      `pass:${password}`,
    ]);
    process.env.PASS_CERT_PEM = cert;
    process.env.PASS_KEY_PEM = key;
    return signWithPem();
  } finally {
    rmrf(tempDir);
  }
}

function zipPackage(targetPath) {
  rmrf(targetPath);
  execFileSync('zip', ['-qr', targetPath, '.'], { cwd: bundleDir });
}

rmrf(buildDir);
fs.mkdirSync(bundleDir, { recursive: true });
copyFile(path.join(sourceDir, 'pass.json'), path.join(bundleDir, 'pass.json'));
makeArtwork();
writeManifest();

const signed = signWithPem() || signWithP12();

if (signed) {
  zipPackage(outputPath);
  console.log(`Created signed pass: ${outputPath}`);
} else {
  zipPackage(unsignedPath);
  console.log(`Created unsigned pass bundle: ${unsignedPath}`);
  console.log('');
  console.log('Wallet will not accept this yet.');
  console.log('Set one of these signing configurations and rerun:');
  console.log(
    '  PASS_P12=/path/pass.p12 PASS_P12_PASSWORD=... WWDR_CERT_PEM=/path/wwdr.pem npm run pass:build',
  );
  console.log(
    '  PASS_CERT_PEM=/path/pass-cert.pem PASS_KEY_PEM=/path/pass-key.pem WWDR_CERT_PEM=/path/wwdr.pem npm run pass:build',
  );
  process.exitCode = 2;
}
