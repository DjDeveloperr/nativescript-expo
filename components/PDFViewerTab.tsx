import { DemoButton, DemoScreen } from './DemoScreen';
import { notification } from '../utils/haptics';
import { openNativePDFViewer } from '../utils/pdf-viewer';

export function PDFViewerTab() {
  async function handleOpenPDF() {
    try {
      await openNativePDFViewer();
      await notification('success');
    } catch (error) {
      await notification('error').catch(() => {});
      console.log(error);
    }
  }

  return (
    <DemoScreen eyebrow="QuickLook" title="PDF">
      <DemoButton title="Open PDF" onPress={handleOpenPDF} />
    </DemoScreen>
  );
}
