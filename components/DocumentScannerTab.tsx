import { useEffect, useState } from 'react';
import { DemoButton, DemoScreen } from './DemoScreen';
import { notification } from '../utils/haptics';
import {
  isDocumentScannerAvailable,
  openDocumentScanner,
} from '../utils/document-scanner';
import { openNativePDFViewer } from '../utils/pdf-viewer';

export function DocumentScannerTab() {
  const [available, setAvailable] = useState(false);
  const [lastDocumentPath, setLastDocumentPath] = useState<string>();

  useEffect(() => {
    isDocumentScannerAvailable()
      .then(setAvailable)
      .catch((error: unknown) => {
        setAvailable(false);
        console.log(error);
      });
  }, []);

  async function handleScan() {
    if (!available) {
      await notification('warning').catch(() => {});
      return;
    }

    try {
      const result = await openDocumentScanner();
      setLastDocumentPath(result.filePath);
      await notification('success');
    } catch (error) {
      await notification('warning').catch(() => {});
      console.log(error);
    }
  }

  async function handleOpenDocument() {
    if (!lastDocumentPath) {
      await notification('warning').catch(() => {});
      return;
    }

    try {
      await openNativePDFViewer(lastDocumentPath);
    } catch (error) {
      await notification('warning').catch(() => {});
      console.log(error);
    }
  }

  return (
    <DemoScreen eyebrow="VisionKit" title="Scanner">
      <DemoButton
        disabled={!available}
        title={available ? 'Scan Document' : 'Scanner Unavailable'}
        onPress={handleScan}
      />
      {lastDocumentPath ? (
        <DemoButton title="Open Document" onPress={handleOpenDocument} />
      ) : null}
    </DemoScreen>
  );
}
