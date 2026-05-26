import { useEffect, useState } from 'react';
import { DemoButton, DemoScreen, StatusText } from './DemoScreen';
import { notification } from '../utils/haptics';
import {
  isDocumentScannerAvailable,
  openDocumentScanner,
} from '../utils/document-scanner';

export function DocumentScannerTab() {
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState('Checking VisionKit availability.');

  useEffect(() => {
    isDocumentScannerAvailable()
      .then((available) => {
        setAvailable(available);
        setStatus(
          available
            ? 'VisionKit document scanner is available.'
            : 'VisionKit document scanner is not available on this device.',
        );
      })
      .catch((error: unknown) => {
        setAvailable(false);
        setStatus(error instanceof Error ? error.message : String(error));
      });
  }, []);

  async function handleScan() {
    if (!available) {
      await notification('warning').catch(() => {});
      setStatus('VisionKit document scanner is not available on this device.');
      return;
    }

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
      <DemoButton
        disabled={!available}
        title={available ? 'Scan Document' : 'Scanner Unavailable'}
        onPress={handleScan}
      />
      <StatusText>{status}</StatusText>
    </DemoScreen>
  );
}
