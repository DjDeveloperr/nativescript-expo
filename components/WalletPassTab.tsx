import { DemoScreen } from './DemoScreen';
import { DemoPassCard } from './DemoPassCard';

export function WalletPassTab() {
  return (
    <DemoScreen
      eyebrow="PassKit"
      scrollEnabled={false}
      title="Wallet"
      showsHeader={false}
    >
      <DemoPassCard />
    </DemoScreen>
  );
}
