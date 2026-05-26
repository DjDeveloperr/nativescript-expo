import { presentNativeViewController } from './view-controller';
import { loadSystemFramework, runOnUIKit } from './native-script';

export type DocumentScanResult = {
  pageCount: number;
  title: string;
};

let scannerDelegateClass: any;
let activeScannerDelegate: any;

function getDocumentCameraController(native: typeof globalThis & Record<string, any>) {
  loadSystemFramework(native, 'VisionKit');

  const Controller = native.VNDocumentCameraViewController;

  if (!Controller) {
    throw new Error('VisionKit document scanner is not available on this OS.');
  }

  if (typeof Controller.isSupported !== 'function' || !Controller.isSupported()) {
    throw new Error('VisionKit document scanner is not supported here.');
  }

  return Controller;
}

function registerScannerDelegate(
  native: Record<string, any>,
  resolve: (result: DocumentScanResult) => void,
  reject: (error: Error) => void,
) {
  if (!scannerDelegateClass) {
    scannerDelegateClass = native.NSObject.extend(
      {
      documentCameraViewControllerDidFinishWithScan(controller: any, scan: any) {
        this.onDone?.(scan, controller);
        },

      documentCameraViewControllerDidCancel(controller: any) {
        this.onCancel?.(controller);
        },

      documentCameraViewControllerDidFailWithError(controller: any, error: any) {
        this.onError?.(error, controller);
        },
      },
      {
        name: `NativeScriptRNDocumentScannerDelegate${Date.now()}`,
        protocols: native.VNDocumentCameraViewControllerDelegate
          ? [native.VNDocumentCameraViewControllerDelegate]
          : [],
      },
    );
  }

  const delegate = scannerDelegateClass.new();

  delegate.onDone = (scan: any, controller: any) => {
    const result = {
      pageCount: scan.pageCount,
      title: scan.title ?? 'Document scan',
    };
    controller.dismissViewControllerAnimatedCompletion(true, null);
    activeScannerDelegate = undefined;
    resolve(result);
  };

  delegate.onCancel = (controller: any) => {
    controller.dismissViewControllerAnimatedCompletion(true, null);
    activeScannerDelegate = undefined;
    reject(new Error('Document scan cancelled.'));
  };

  delegate.onError = (error: any, controller: any) => {
    controller.dismissViewControllerAnimatedCompletion(true, null);
    activeScannerDelegate = undefined;
    reject(new Error(error?.localizedDescription ?? 'Document scan failed.'));
  };

  activeScannerDelegate = delegate;
  return delegate;
}

export async function isDocumentScannerAvailable() {
  return runOnUIKit((native) => {
    try {
      getDocumentCameraController(native);
      return true;
    } catch {
      return false;
    }
  });
}

export async function openDocumentScanner() {
  return new Promise<DocumentScanResult>((resolve, reject) => {
    presentNativeViewController((native) => {
      const Controller = getDocumentCameraController(native);
      const controller = Controller.new();
      controller.delegate = registerScannerDelegate(native, resolve, reject);

      return controller;
    }).catch(reject);
  });
}
