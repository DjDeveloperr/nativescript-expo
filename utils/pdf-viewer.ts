import { presentNativeViewController } from "./view-controller";
import { defineObjCClass, type ObjCClass, loadSystemFramework, runOnUIKit } from "./ns";

type PreviewItemURL = NSURL & QLPreviewItem;

type PreviewDataSource = NSObject &
  QLPreviewControllerDataSource & {
    previewUrl: PreviewItemURL;
  };

let previewDataSourceClass: ObjCClass<PreviewDataSource> | null = null;
let activePreviewDataSources: PreviewDataSource[] = [];

function registerPreviewDataSource(): ObjCClass<PreviewDataSource> {
  if (previewDataSourceClass) {
    return previewDataSourceClass;
  }

  previewDataSourceClass = defineObjCClass<PreviewDataSource>(
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
      protocols: [QLPreviewControllerDataSource],
    },
  );
  return previewDataSourceClass;
}

export async function createSamplePDF() {
  return runOnUIKit(() => {
    const path = `${NSTemporaryDirectory()}nativescript-rn-demo.pdf`;
    const bounds = {
      origin: { x: 0, y: 0 },
      size: { width: 612, height: 792 },
    };

    UIGraphicsBeginPDFContextToFile(path, bounds, {});
    UIGraphicsBeginPDFPage();
    UIColor.whiteColor.setFill();
    UIRectFill(bounds);

    const title = NSString.stringWithString("NativeScript React Native");
    title.drawAtPointWithAttributes(
      { x: 72, y: 96 },
      {
        [NSFontAttributeName]: UIFont.boldSystemFontOfSize(30),
        [NSForegroundColorAttributeName]: UIColor.blackColor,
      },
    );

    const body = NSString.stringWithString(
      "This PDF was generated with UIKit and opened with QuickLook via NativeScript.",
    );
    body.drawInRectWithAttributes(
      {
        origin: { x: 72, y: 152 },
        size: { width: 468, height: 220 },
      },
      {
        [NSFontAttributeName]: UIFont.systemFontOfSize(17),
        [NSForegroundColorAttributeName]: UIColor.darkGrayColor,
      },
    );

    UIGraphicsEndPDFContext();
    return path;
  });
}

export async function openNativePDFViewer(filePath?: string) {
  const path = filePath ?? (await createSamplePDF());

  await presentNativeViewController(() => {
    loadSystemFramework("QuickLook");

    const url = NSURL.fileURLWithPath(path);
    const DataSource = registerPreviewDataSource();
    const source = DataSource.new();
    source.previewUrl = url as PreviewItemURL;
    const controller = QLPreviewController.new();
    controller.dataSource = source;
    activePreviewDataSources.push(source);
    controller.reloadData();

    return controller;
  });

  if (activePreviewDataSources.length > 4) {
    activePreviewDataSources = activePreviewDataSources.slice(-4);
  }
}
