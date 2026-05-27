import {
  DemoCenteredAction,
  DemoCenteredStatus,
  DemoScreen,
} from './DemoScreen';

type DocumentScannerTabProps = {
  disabled?: boolean;
  hasScannedDocument: boolean;
  onOpenDocument: () => void;
};

export function DocumentScannerTab({
  disabled = false,
  hasScannedDocument,
  onOpenDocument,
}: DocumentScannerTabProps) {
  return (
    <DemoScreen
      eyebrow="VisionKit"
      scrollEnabled={false}
      title="Scanner"
      showsHeader={false}
    >
      {hasScannedDocument ? (
        <DemoCenteredAction
          glass
          inline
          onPress={onOpenDocument}
          systemImage="doc.richtext"
          title="Open Document"
        />
      ) : (
        <DemoCenteredStatus
          systemImage="doc.viewfinder"
          text={disabled ? 'Scanner unavailable' : 'Ready to scan'}
        />
      )}
    </DemoScreen>
  );
}
