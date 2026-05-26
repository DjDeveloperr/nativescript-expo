import { DemoButton, DemoScreen } from './DemoScreen';
import { DemoPassCard } from './DemoPassCard';
import { notification, selectionChanged } from '../utils/haptics';
import { openAppleWalletAddPassFlow } from '../utils/passkit';
import { nativeScriptRNDemoPassBase64 } from '../assets/demo-pass/NativeScriptRN.pkpass';

export function WalletPassTab() {
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
    <DemoScreen eyebrow="PassKit" title="Wallet">
      <DemoPassCard />
      <DemoButton title="Add Demo Pass" onPress={handleOpenWallet} />
    </DemoScreen>
  );
}
