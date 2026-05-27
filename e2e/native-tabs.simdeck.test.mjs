import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { connect } from 'simdeck/test';

const BUNDLE_ID = process.env.E2E_BUNDLE_ID || 'com.djdev.NativeScriptRN';
const APP_PATH = process.env.E2E_APP_PATH;
const DEVICE_UDID = process.env.SIMDECK_UDID || process.env.SIMDECK_DEVICE;
const USE_SHARED_SERVICE = process.env.SIMDECK_SHARED_SERVICE === '1';
const SIMDECK_CLI = process.env.SIMDECK_CLI || localPath('../node_modules/.bin/simdeck');
const SIMDECK_PACKAGE_ROOT =
  process.env.SIMDECK_PACKAGE_ROOT || localPath('../node_modules/simdeck');
const QUERY_OPTIONS = { maxDepth: 12, source: 'native-ax' };
const TABS = {
  Wallet: { point: [0.17, 0.95], expect: { label: 'Add Pass' } },
  PDF: { point: [0.5, 0.95], expect: { label: 'No PDF open' } },
  Scanner: {
    point: [0.83, 0.95],
    expect: {
      label: 'Ready to scan|Scanner unavailable|Open Document',
      regex: true,
    },
  },
};

test('native tab shell keeps each tab and accessory responsive', {
  timeout: 90_000,
}, async () => {
  let simdeck = await connect({
    cliPath: SIMDECK_CLI,
    isolated: !USE_SHARED_SERVICE,
    keepService: USE_SHARED_SERVICE,
    projectRoot: USE_SHARED_SERVICE ? process.cwd() : SIMDECK_PACKAGE_ROOT,
    udid: DEVICE_UDID,
  });

  try {
    if (!simdeck.udid) {
      simdeck = simdeck.device(await selectBootedIphone(simdeck));
    }

    await simdeck.boot();

    if (APP_PATH) {
      assert.ok(existsSync(APP_PATH), `E2E_APP_PATH does not exist: ${APP_PATH}`);
      await simdeck.install(APP_PATH);
    }

    await simdeck.launch(BUNDLE_ID);
    await simdeck.waitFor(
      { label: 'Add Pass|Open Document|Scan Document', regex: true },
      { ...QUERY_OPTIONS, timeoutMs: 20_000 },
    );
    await selectTab(simdeck, 'Wallet');
    await simdeck.assert({ label: 'NativeScript App.js Pass' }, QUERY_OPTIONS);

    await selectTab(simdeck, 'PDF');
    await simdeck.assert({ label: 'Open Document' }, QUERY_OPTIONS);

    await selectTab(simdeck, 'Scanner');
    await simdeck.assert({ label: 'Scan Document' }, QUERY_OPTIONS);

    for (let cycle = 0; cycle < 4; cycle += 1) {
      for (const label of ['PDF', 'Scanner', 'Wallet']) {
        await tapTab(simdeck, label);
      }
    }

    await simdeck.waitFor(TABS.Wallet.expect, { ...QUERY_OPTIONS, timeoutMs: 10_000 });
    await simdeck.assert({ label: 'Add Pass' }, QUERY_OPTIONS);
    await simdeck.assert({ label: 'NativeScript App.js Pass' }, QUERY_OPTIONS);
  } finally {
    simdeck.close();
  }
});

async function selectTab(simdeck, label) {
  const target = TABS[label];
  assert.ok(target, `Unknown tab: ${label}`);
  await tapTab(simdeck, label);
  await simdeck.waitFor(target.expect, { ...QUERY_OPTIONS, timeoutMs: 10_000 });
}

async function tapTab(simdeck, label) {
  const target = TABS[label];
  assert.ok(target, `Unknown tab: ${label}`);
  await simdeck.tap(target.point[0], target.point[1]);
}

async function selectBootedIphone(simdeck) {
  const devices = await simdeck.list();
  const simulators = Array.isArray(devices?.simulators) ? devices.simulators : [];
  const selected =
    simulators.find((device) => device.isBooted && isIphone(device)) ||
    simulators.find((device) => device.isAvailable && isIphone(device));

  assert.ok(selected, 'No available iPhone simulator found for SimDeck E2E tests.');
  return selected.udid;
}

function isIphone(device) {
  return typeof device?.name === 'string' && device.name.startsWith('iPhone');
}

function localPath(relativePath) {
  return fileURLToPath(new URL(relativePath, import.meta.url));
}
