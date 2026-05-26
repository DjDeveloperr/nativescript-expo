import { presentNativeViewController } from './view-controller';
import { loadSystemFramework, runOnUIKit } from './native-script';

let previewDataSource: any;
let activePreviewDataSources: any[] = [];

function registerPreviewDataSource(native: Record<string, any>) {
  if (previewDataSource) {
    return previewDataSource;
  }

  previewDataSource = native.NSObject.extend(
    {
      numberOfPreviewItemsInPreviewController() {
      return 1;
      },

      previewControllerPreviewItemAtIndex() {
        return this.previewUrl;
      },
    },
    {
      name: `NativeScriptRNPDFPreviewDataSource${Date.now()}`,
      protocols: [native.QLPreviewControllerDataSource],
    },
  );
  return previewDataSource;
}

export async function createSamplePDF() {
  return runOnUIKit((native) => {
    const path = `${native.NSTemporaryDirectory()}nativescript-rn-demo.pdf`;
    const bounds = {
      origin: { x: 0, y: 0 },
      size: { width: 612, height: 792 },
    };

    native.UIGraphicsBeginPDFContextToFile(path, bounds, {});
    native.UIGraphicsBeginPDFPage();
    native.UIColor.whiteColor.setFill();
    native.UIRectFill(bounds);

    const title = native.NSString.stringWithString('NativeScript React Native');
    title.drawAtPointWithAttributes(
      { x: 72, y: 96 },
      {
        [native.NSFontAttributeName]:
          native.UIFont.boldSystemFontOfSize(30),
        [native.NSForegroundColorAttributeName]:
          native.UIColor.blackColor,
      },
    );

    const body = native.NSString.stringWithString(
      'This PDF was generated with UIKit and opened with QuickLook through the NativeScript native API bridge.',
    );
    body.drawInRectWithAttributes(
      {
        origin: { x: 72, y: 152 },
        size: { width: 468, height: 220 },
      },
      {
        [native.NSFontAttributeName]: native.UIFont.systemFontOfSize(17),
        [native.NSForegroundColorAttributeName]:
          native.UIColor.darkGrayColor,
      },
    );

    native.UIGraphicsEndPDFContext();
    return path;
  });
}

export async function openNativePDFViewer(filePath?: string) {
  const path = filePath ?? (await createSamplePDF());

  await presentNativeViewController((native) => {
    loadSystemFramework(native, 'QuickLook');

    const url = native.NSURL.fileURLWithPath(path);
    const DataSource = registerPreviewDataSource(native);
    const source = DataSource.new();
    source.previewUrl = url;
    const controller = native.QLPreviewController.new();
    controller.dataSource = source;
    activePreviewDataSources.push(source);
    controller.reloadData();

    return controller;
  });

  if (activePreviewDataSources.length > 4) {
    activePreviewDataSources = activePreviewDataSources.slice(-4);
  }
}
