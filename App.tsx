import { StatusBar } from 'expo-status-bar';
import { TabView } from './components/TabView';
import { DocumentScannerTab } from './components/DocumentScannerTab';
import { PDFViewerTab } from './components/PDFViewerTab';
import { WalletPassTab } from './components/WalletPassTab';

export default function App() {
  return (
    <>
      <TabView
        tabs={[
          {
            key: 'wallet',
            title: 'Wallet',
            systemImage: 'wallet.pass',
            selectedSystemImage: 'wallet.pass.fill',
            content: <WalletPassTab />,
          },
          {
            key: 'pdf',
            title: 'PDF',
            systemImage: 'doc.richtext',
            selectedSystemImage: 'doc.richtext',
            content: <PDFViewerTab />,
          },
          {
            key: 'scanner',
            title: 'Scanner',
            systemImage: 'doc.viewfinder',
            selectedSystemImage: 'doc.viewfinder',
            content: <DocumentScannerTab />,
          },
        ]}
      />
      <StatusBar style="auto" />
    </>
  );
}
