import { presentNativeViewController } from './view-controller';
import { loadSystemFramework } from './native-script';

export type AddPassOptions = {
  base64PassData: string;
};

export async function openAppleWalletAddPassFlow(options: AddPassOptions) {
  if (!options.base64PassData.trim()) {
    throw new Error('A signed .pkpass file encoded as base64 is required.');
  }

  await presentNativeViewController(() => {
    loadSystemFramework('PassKit');

    const passData = NSData.alloc().initWithBase64EncodedStringOptions(
      options.base64PassData,
      0,
    );

    if (!passData) {
      throw new Error('The provided pass data is not valid base64.');
    }

    const errorRef = new interop.Reference();
    const pass = PKPass.alloc().initWithDataError(passData, errorRef);

    if (!pass) {
      throw new Error('PassKit could not parse this .pkpass payload.');
    }

    const controller = PKAddPassesViewController.alloc().initWithPass(
      pass,
    );

    if (!controller) {
      throw new Error('This device cannot present the Apple Wallet add-pass UI.');
    }

    return controller;
  });
}
