import { NativeTabBarAccessoryButton } from '../utils/native-tabs';
import { notification, selectionChanged } from '../utils/haptics';
import { openAppleWalletAddPassFlow } from '../utils/passkit';
import { nativeScriptRNDemoPassBase64 } from '../assets/demo-pass/NativeScriptRN.pkpass';

export function WalletAddPassAccessory() {
  async function handleOpenWallet() {
    try {
      await selectionChanged().catch(() => {});
      await openAppleWalletAddPassFlow({
        base64PassData: nativeScriptRNDemoPassBase64,
      });
    } catch (error) {
      await notification('error').catch(() => {});
      console.log(error);
    }
  }

  return (
    <NativeTabBarAccessoryButton
      systemImage="plus.circle.fill"
      title="Add Demo Pass"
      onPress={handleOpenWallet}
    />
  );
}
