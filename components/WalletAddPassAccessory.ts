import type { NativeTabAccessory } from '../utils/native-tabs';
import { notification, selectionChanged } from '../utils/haptics';
import { openAppleWalletAddPassFlow } from '../utils/passkit';
import { nativeScriptRNDemoPassBase64 } from '../assets/demo-pass/NativeScriptRN.pkpass';
import { logError } from '../utils/logger';

export const walletAddPassAccessory: NativeTabAccessory = {
  title: 'Add Pass',
  systemImage: 'plus.circle.fill',
  async onPress() {
    try {
      await selectionChanged().catch(() => {});
      await openAppleWalletAddPassFlow({
        base64PassData: nativeScriptRNDemoPassBase64,
      });
    } catch (error) {
      await notification('error').catch(() => {});
      logError(error);
    }
  },
};
