import { presentNativeViewController } from "./view-controller";
import {
  loadSystemFramework,
  runOnUIKit,
  nativeGlobals,
  defineObjCClass,
  type ObjCClass,
} from "./ns";

export type DocumentScanResult = {
  filePath: string;
  pageCount: number;
  title: string;
};

/** Delegate subclass instance that bridges VisionKit scan callbacks to JS. */
type ScannerDelegate = NSObject & {
  onDone?: (
    scan: VNDocumentCameraScan,
    controller: VNDocumentCameraViewController,
  ) => void;
  onCancel?: (controller: VNDocumentCameraViewController) => void;
  onError?: (
    error: NSError,
    controller: VNDocumentCameraViewController,
  ) => void;
  documentCameraViewControllerDidFinishWithScan(
    controller: VNDocumentCameraViewController,
    scan: VNDocumentCameraScan,
  ): void;
  documentCameraViewControllerDidCancel(
    controller: VNDocumentCameraViewController,
  ): void;
  documentCameraViewControllerDidFailWithError(
    controller: VNDocumentCameraViewController,
    error: NSError,
  ): void;
};

let scannerDelegateClass: ObjCClass<ScannerDelegate> | undefined;
let activeScannerDelegate: ScannerDelegate | undefined;

function withNativeStep<T>(step: string, work: () => T) {
  try {
    return work();
  } catch (error) {
    throw new Error(`VisionKit ${step} failed: ${describeNativeError(error)}`);
  }
}

function describeNativeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const nativeError = error as Record<string, unknown>;
    if (typeof nativeError.localizedDescription === "string") {
      return nativeError.localizedDescription;
    }
    if (typeof nativeError.message === "string") {
      return nativeError.message;
    }
  }

  return String(error);
}

function nativeValue(key: string) {
  return withNativeStep(`${key} lookup`, () => nativeGlobals()[key]);
}

function getDocumentCameraController() {
  withNativeStep("framework load", () =>
    loadSystemFramework("VisionKit"),
  );

  const Controller = nativeValue( "VNDocumentCameraViewController");

  if (!Controller) {
    throw new Error("VisionKit document scanner is not available on this OS.");
  }

  return Controller;
}

function createDocumentCameraController(Controller: any) {
  return withNativeStep("controller creation", () => {
    if (typeof Controller.alloc === "function") {
      return Controller.alloc().init();
    }

    return Controller.new();
  });
}

function isDocumentCameraSupported(Controller: any) {
  return withNativeStep("support check", () => {
    if (typeof Controller.isSupported === "function") {
      return Boolean(Controller.isSupported());
    }

    return Boolean(Controller.supported);
  });
}

function writeScanToPDF(scan: any) {
  const pageCount = Number(scan.pageCount ?? 0);
  const path = `${NSTemporaryDirectory()}nativescript-rn-scan-${Date.now()}.pdf`;
  const defaultBounds = {
    origin: { x: 0, y: 0 },
    size: { width: 612, height: 792 },
  };

  UIGraphicsBeginPDFContextToFile(path, defaultBounds, {});

  for (let index = 0; index < pageCount; index += 1) {
    const image = scan.imageOfPageAtIndex(index);
    const size = image?.size ?? defaultBounds.size;
    const bounds = {
      origin: { x: 0, y: 0 },
      size,
    };

    UIGraphicsBeginPDFPageWithInfo(bounds, {});
    image.drawInRect(bounds);
  }

  UIGraphicsEndPDFContext();
  return path;
}

function getDocumentCameraDelegateProtocol() {
  try {
    const generatedProtocol = nativeValue(
      "VNDocumentCameraViewControllerDelegate",
    );

    if (generatedProtocol) {
      return generatedProtocol;
    }
  } catch {
    // Some device builds throw while reading generated protocol globals.
  }

  return withNativeStep(
    "delegate protocol lookup",
    () =>
      NSProtocolFromString?.("VNDocumentCameraViewControllerDelegate") ??
      objc_getProtocol?.("VNDocumentCameraViewControllerDelegate"),
  );
}

function registerScannerDelegate(
  resolve: (result: DocumentScanResult) => void,
  reject: (error: Error) => void,
) {
  if (!scannerDelegateClass) {
    const delegateProtocol = getDocumentCameraDelegateProtocol();

    if (!delegateProtocol) {
      throw new Error("VisionKit scanner delegate protocol is not available.");
    }

    scannerDelegateClass = withNativeStep("delegate registration", () =>
      defineObjCClass<ScannerDelegate>(
        {
          documentCameraViewControllerDidFinishWithScan(controller, scan) {
            this.onDone?.(scan, controller);
          },

          documentCameraViewControllerDidCancel(controller) {
            this.onCancel?.(controller);
          },

          documentCameraViewControllerDidFailWithError(controller, error) {
            this.onError?.(error, controller);
          },
        },
        {
          name: `NativeScriptRNDocumentScannerDelegate${Date.now()}`,
          protocols: [delegateProtocol],
        },
      ),
    );
  }

  const delegateClass = scannerDelegateClass;
  const delegate = withNativeStep("delegate creation", () =>
    delegateClass.new(),
  );

  delegate.onDone = (scan, controller) => {
    completeScan(scan, controller).then(resolve).catch(reject);
  };

  delegate.onCancel = (controller) => {
    dismissScan(controller)
      .catch(() => {})
      .finally(() => reject(new Error("Document scan cancelled.")));
  };

  delegate.onError = (error, controller) => {
    const message = error?.localizedDescription ?? "Document scan failed.";
    dismissScan(controller)
      .catch(() => {})
      .finally(() => reject(new Error(message)));
  };

  activeScannerDelegate = delegate;
  return delegate;
}

async function completeScan(scan: any, controller: any) {
  return runOnUIKit(() => {
    const pageCount = Number(scan.pageCount ?? 0);
    const result = {
      filePath: writeScanToPDF(scan),
      pageCount,
      title: scan.title ?? "Document scan",
    };
    controller.dismissViewControllerAnimatedCompletion(true, null);
    activeScannerDelegate = undefined;
    return result;
  });
}

async function dismissScan(controller: any) {
  await runOnUIKit(() => {
    controller.dismissViewControllerAnimatedCompletion(true, null);
    activeScannerDelegate = undefined;
  });
}

export async function isDocumentScannerAvailable() {
  let unavailableReason: unknown;

  try {
    const available = await runOnUIKit(() => {
      try {
        const Controller = getDocumentCameraController();
        if (!isDocumentCameraSupported(Controller)) {
          return false;
        }

        registerScannerDelegate(
          () => {},
          () => {},
        );
        return true;
      } catch (error) {
        unavailableReason = error;
        return false;
      }
    });

    if (!available && unavailableReason) {
      console.log(describeNativeError(unavailableReason));
    }

    return available;
  } catch (error) {
    console.log(describeNativeError(error));
    return false;
  }
}

export async function openDocumentScanner() {
  const available = await isDocumentScannerAvailable();

  if (!available) {
    throw new Error(
      "VisionKit document scanner is not available on this device.",
    );
  }

  return new Promise<DocumentScanResult>((resolve, reject) => {
    presentNativeViewController(() => {
      try {
        const Controller = getDocumentCameraController();
        const controller = createDocumentCameraController(Controller);
        const delegate = registerScannerDelegate(resolve, reject);
        withNativeStep("delegate assignment", () => {
          controller.delegate = delegate;
        });

        return controller;
      } catch (error) {
        throw new Error(describeNativeError(error));
      }
    }).catch(reject);
  });
}
