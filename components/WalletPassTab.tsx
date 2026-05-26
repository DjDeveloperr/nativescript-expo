import { useState } from 'react';
import { DemoButton, DemoScreen, StatusText } from './DemoScreen';
import { DemoPassCard } from './DemoPassCard';
import { notification } from '../utils/haptics';
import { demoPassStatusText } from '../utils/demo-pass';

export function WalletPassTab() {
  const [status, setStatus] = useState(demoPassStatusText());

  async function handleOpenWallet() {
    await notification('warning').catch(() => {});
    setStatus(
      'This demo pass needs a Pass Type ID certificate before Wallet can add it. Drop in a signed .pkpass payload and PKAddPassesViewController will present the native add flow.',
    );
  }

  return (
    <DemoScreen eyebrow="PassKit" title="Wallet">
      <DemoPassCard />
      <DemoButton title="Add Demo Pass" onPress={handleOpenWallet} />
      <StatusText>{status}</StatusText>
    </DemoScreen>
  );
}
