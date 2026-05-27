import { DemoCenteredStatus, DemoScreen } from './DemoScreen';

export function PDFViewerTab() {
  return (
    <DemoScreen
      eyebrow="QuickLook"
      scrollEnabled={false}
      title="PDF"
      showsHeader={false}
    >
      <DemoCenteredStatus
        systemImage="doc.richtext"
        text="No PDF open"
      />
    </DemoScreen>
  );
}
