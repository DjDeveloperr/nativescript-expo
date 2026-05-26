export const demoPass = {
  formatVersion: 1,
  passTypeIdentifier: 'pass.com.djdev.NativeScriptRN.demo',
  serialNumber: 'NSRN-DEMO-0001',
  teamIdentifier: 'B55DTZ6VSU',
  organizationName: 'NativeScriptRN',
  description: 'NativeScriptRN Demo Pass',
  logoText: 'NativeScriptRN',
  foregroundColor: 'rgb(255,255,255)',
  backgroundColor: 'rgb(17,24,39)',
  labelColor: 'rgb(203,213,225)',
  barcode: {
    message: 'NSRN-DEMO-0001',
    format: 'PKBarcodeFormatQR',
    messageEncoding: 'iso-8859-1',
  },
  storeCard: {
    primaryFields: [
      {
        key: 'demo',
        label: 'Native Bridge',
        value: 'UIKit + PassKit',
      },
    ],
    secondaryFields: [
      {
        key: 'member',
        label: 'Member',
        value: 'DJ',
      },
      {
        key: 'level',
        label: 'Level',
        value: 'Demo',
      },
    ],
    auxiliaryFields: [
      {
        key: 'stack',
        label: 'Stack',
        value: 'Expo 56',
      },
    ],
    backFields: [
      {
        key: 'note',
        label: 'Signing note',
        value:
          'Wallet requires this pass package to be signed with a Pass Type ID certificate before PKAddPassesViewController can present it.',
      },
    ],
  },
} as const;

export function demoPassStatusText() {
  return [
    'Demo pass.json is ready.',
    `passTypeIdentifier: ${demoPass.passTypeIdentifier}`,
    `serialNumber: ${demoPass.serialNumber}`,
    'To add it to Wallet, package it with icons, manifest.json, and a Pass Type ID signature.',
  ].join('\n');
}
