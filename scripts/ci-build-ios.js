#!/usr/bin/env node

const { execFileSync, spawnSync } = require('child_process');
const { writeFileSync } = require('fs');

const workspace = process.env.IOS_WORKSPACE || 'ios/NativeScriptRN.xcworkspace';
const scheme = process.env.IOS_SCHEME || 'NativeScriptRN';
const configuration = process.env.IOS_CONFIGURATION || 'Debug';

function runtimeSortKey(runtimeId) {
  const match = runtimeId.match(/SimRuntime\.iOS-([0-9-]+)$/);
  if (!match) {
    return [];
  }

  return match[1].split('-').map((part) => Number(part));
}

function compareVersionParts(a, b) {
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const left = a[index] || 0;
    const right = b[index] || 0;

    if (left !== right) {
      return right - left;
    }
  }

  return 0;
}

function preferredNameRank(name) {
  if (/Pro Max/.test(name)) {
    return 3;
  }

  if (/Pro/.test(name)) {
    return 2;
  }

  return 1;
}

function loadAvailableIphones() {
  const output = execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], {
    encoding: 'utf8',
  });
  const payload = JSON.parse(output);
  const devices = [];

  for (const [runtime, runtimeDevices] of Object.entries(payload.devices || {})) {
    for (const device of runtimeDevices) {
      if (device.isAvailable && /^iPhone\b/.test(device.name)) {
        devices.push({
          ...device,
          runtime,
          runtimeSortKey: runtimeSortKey(runtime),
        });
      }
    }
  }

  return devices.sort((left, right) => {
    if (left.state === 'Booted' && right.state !== 'Booted') {
      return -1;
    }

    if (right.state === 'Booted' && left.state !== 'Booted') {
      return 1;
    }

    const runtimeResult = compareVersionParts(left.runtimeSortKey, right.runtimeSortKey);
    if (runtimeResult !== 0) {
      return runtimeResult;
    }

    return preferredNameRank(right.name) - preferredNameRank(left.name);
  });
}

function selectSimulator() {
  if (process.env.IOS_SIMULATOR_UDID) {
    return {
      name: 'provided simulator',
      udid: process.env.IOS_SIMULATOR_UDID,
      runtime: 'provided runtime',
      state: 'Provided',
    };
  }

  const iphones = loadAvailableIphones();
  const selected = iphones[0];

  if (!selected) {
    throw new Error('No available iPhone simulator was found.');
  }

  return selected;
}

const selected = selectSimulator();
console.log(
  `Building ${scheme} for ${selected.name} (${selected.udid}) on ${selected.runtime} [${selected.state}]`,
);

if (process.env.IOS_SIMULATOR_UDID_FILE) {
  writeFileSync(process.env.IOS_SIMULATOR_UDID_FILE, `${selected.udid}\n`);
}

const buildSettings = [
  'CODE_SIGNING_ALLOWED=NO',
  'CODE_SIGNING_REQUIRED=NO',
  'ONLY_ACTIVE_ARCH=YES',
];

if (process.arch === 'arm64') {
  buildSettings.push('ARCHS=arm64');
}

const args = [
  '-workspace',
  workspace,
  '-scheme',
  scheme,
  '-configuration',
  configuration,
  '-sdk',
  'iphonesimulator',
  '-destination',
  `id=${selected.udid}`,
  ...buildSettings,
  'build',
];

const result = spawnSync('xcodebuild', args, { stdio: 'inherit' });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.signal) {
  console.error(`xcodebuild terminated by signal: ${result.signal}`);
  process.exit(1);
}

process.exit(typeof result.status === 'number' ? result.status : 1);
