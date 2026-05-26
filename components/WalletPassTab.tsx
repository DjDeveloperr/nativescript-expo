import { useState } from 'react';
import { DemoButton, DemoScreen, StatusText } from './DemoScreen';
import { DemoPassCard } from './DemoPassCard';
import { notification, selectionChanged } from '../utils/haptics';
import { demoPassStatusText } from '../utils/demo-pass';
import { openAppleWalletAddPassFlow } from '../utils/passkit';
import { nativeScriptRNDemoPassBase64 } from '../assets/demo-pass/NativeScriptRN.pkpass';

export function WalletPassTab() {
  const [status, setStatus] = useState(demoPassStatusText());

  async function handleOpenWallet() {
    try {
      await selectionChanged().catch(() => {});
      setStatus('Presenting the native Apple Wallet add-pass flow.');
      await openAppleWalletAddPassFlow({
        base64PassData: nativeScriptRNDemoPassBase64,
      });
    } catch (error) {
      await notification('error').catch(() => {});
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <DemoScreen eyebrow="PassKit" title="Wallet">
      <DemoPassCard />
      <DemoButton title="Add Demo Pass" onPress={handleOpenWallet} />
      <StatusText>{status}</StatusText>
    </DemoScreen>
  );
}
