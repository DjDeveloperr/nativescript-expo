import { useEffect, useState } from 'react';
import { DemoButton, DemoScreen, StatusText } from './DemoScreen';
import { notification } from '../utils/haptics';
import {
  isDocumentScannerAvailable,
  openDocumentScanner,
} from '../utils/document-scanner';

export function DocumentScannerTab() {
  const [status, setStatus] = useState('Checking VisionKit availability.');

  useEffect(() => {
    isDocumentScannerAvailable()
      .then((available) => {
        setStatus(
          available
            ? 'VisionKit document scanner is available.'
            : 'VisionKit document scanner is not available on this device.',
        );
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : String(error));
      });
  }, []);

  async function handleScan() {
    try {
      const result = await openDocumentScanner();
      await notification('success');
      setStatus(`Scanned ${result.pageCount} page(s).`);
    } catch (error) {
      await notification('warning').catch(() => {});
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <DemoScreen eyebrow="VisionKit" title="Scanner">
      <DemoButton title="Scan Document" onPress={handleScan} />
      <StatusText>{status}</StatusText>
    </DemoScreen>
  );
}
