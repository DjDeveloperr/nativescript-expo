import { presentNativeViewController } from './view-controller';
import { loadSystemFramework, runOnUIKit } from './native-script';

export type DocumentScanResult = {
  pageCount: number;
  title: string;
};

let scannerDelegateClass: any;
let activeScannerDelegate: any;

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
        protocols: [native.VNDocumentCameraViewControllerDelegate],
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
    loadSystemFramework(native, 'VisionKit');
    return native.VNDocumentCameraViewController.isSupported();
  });
}

export async function openDocumentScanner() {
  return new Promise<DocumentScanResult>((resolve, reject) => {
    presentNativeViewController((native) => {
      loadSystemFramework(native, 'VisionKit');

      if (!native.VNDocumentCameraViewController.isSupported()) {
        throw new Error('VisionKit document scanner is not supported here.');
      }

      const controller = native.VNDocumentCameraViewController.new();
      controller.delegate = registerScannerDelegate(native, resolve, reject);

      return controller;
    }).catch(reject);
  });
}
