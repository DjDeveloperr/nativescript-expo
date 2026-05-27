import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { TabView } from './components/TabView';
import { DocumentScannerTab } from './components/DocumentScannerTab';
import { PDFViewerTab } from './components/PDFViewerTab';
import { walletAddPassAccessory } from './components/WalletAddPassAccessory';
import { WalletPassTab } from './components/WalletPassTab';
import { notification } from './utils/haptics';
import {
  isDocumentScannerAvailable,
  openDocumentScanner,
} from './utils/document-scanner';
import { openNativePDFViewer } from './utils/pdf-viewer';
import { logError } from './utils/logger';

export default function App() {
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [lastDocumentPath, setLastDocumentPath] = useState<string>();

  useEffect(() => {
    isDocumentScannerAvailable()
      .then(setScannerAvailable)
      .catch((error: unknown) => {
        setScannerAvailable(false);
        logError(error);
      });
  }, []);

  const openPDF = useCallback(async () => {
    try {
      await openNativePDFViewer();
    } catch (error) {
      await notification('error').catch(() => {});
      logError(error);
    }
  }, []);

  const scanDocument = useCallback(async () => {
    if (!scannerAvailable) {
      await notification('warning').catch(() => {});
      return;
    }

    try {
      const result = await openDocumentScanner();
      setLastDocumentPath(result.filePath);
      await notification('success');
    } catch (error) {
      await notification('warning').catch(() => {});
      logError(error);
    }
  }, [scannerAvailable]);

  const openScannedDocument = useCallback(async () => {
    if (!lastDocumentPath) {
      await notification('warning').catch(() => {});
      return;
    }

    try {
      await openNativePDFViewer(lastDocumentPath);
    } catch (error) {
      await notification('warning').catch(() => {});
      logError(error);
    }
  }, [lastDocumentPath]);

  const tabs = useMemo(
    () => [
      {
        key: 'wallet',
        title: 'Wallet',
        systemImage: 'wallet.pass',
        selectedSystemImage: 'wallet.pass.fill',
        accessory: walletAddPassAccessory,
        content: <WalletPassTab />,
      },
      {
        key: 'pdf',
        title: 'PDF',
        systemImage: 'doc.richtext',
        selectedSystemImage: 'doc.richtext',
        accessory: {
          title: 'Open Document',
          systemImage: 'doc.richtext',
          onPress: openPDF,
        },
        content: <PDFViewerTab />,
      },
      {
        key: 'scanner',
        title: 'Scanner',
        systemImage: 'doc.viewfinder',
        selectedSystemImage: 'doc.viewfinder',
        accessory: {
          title: 'Scan Document',
          systemImage: 'doc.viewfinder',
          disabled: !scannerAvailable,
          onPress: scanDocument,
        },
        content: (
          <DocumentScannerTab
            disabled={!scannerAvailable}
            hasScannedDocument={Boolean(lastDocumentPath)}
            onOpenDocument={openScannedDocument}
          />
        ),
      },
    ],
    [
      lastDocumentPath,
      openPDF,
      openScannedDocument,
      scanDocument,
      scannerAvailable,
    ],
  );

  return (
    <>
      <TabView tabs={tabs} />
      <StatusBar style="auto" />
    </>
  );
}
