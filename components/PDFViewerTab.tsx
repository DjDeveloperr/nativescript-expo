import { useState } from 'react';
import { DemoButton, DemoScreen, StatusText } from './DemoScreen';
import { notification } from '../utils/haptics';
import { openNativePDFViewer } from '../utils/pdf-viewer';

export function PDFViewerTab() {
  const [status, setStatus] = useState('Ready to generate a sample PDF.');

  async function handleOpenPDF() {
    try {
      await openNativePDFViewer();
      await notification('success');
      setStatus('Opened sample PDF in QuickLook.');
    } catch (error) {
      await notification('error').catch(() => {});
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <DemoScreen eyebrow="QuickLook" title="PDF">
      <DemoButton title="Open PDF" onPress={handleOpenPDF} />
      <StatusText>{status}</StatusText>
    </DemoScreen>
  );
}
