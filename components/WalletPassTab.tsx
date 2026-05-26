import { DemoScreen } from './DemoScreen';
import { DemoPassCard } from './DemoPassCard';

export function WalletPassTab() {
  return (
    <DemoScreen eyebrow="PassKit" title="Wallet">
      <DemoPassCard />
    </DemoScreen>
  );
}
