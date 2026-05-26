import { presentNativeViewController } from './view-controller';
import { loadSystemFramework, runOnUIKit } from './native-script';

export type DocumentScanResult = {
  pageCount: number;
  title: string;
};

let scannerDelegateClass: any;
let activeScannerDelegate: any;

function describeNativeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const nativeError = error as Record<string, unknown>;
    if (typeof nativeError.localizedDescription === 'string') {
      return nativeError.localizedDescription;
    }
    if (typeof nativeError.message === 'string') {
      return nativeError.message;
    }
  }

  return String(error);
}

function getDocumentCameraController(native: typeof globalThis & Record<string, any>) {
  loadSystemFramework(native, 'VisionKit');

  const Controller = native.VNDocumentCameraViewController;

  if (!Controller) {
    throw new Error('VisionKit document scanner is not available on this OS.');
  }

  return Controller;
}

function registerScannerDelegate(
  native: Record<string, any>,
  resolve: (result: DocumentScanResult) => void,
  reject: (error: Error) => void,
) {
  if (!scannerDelegateClass) {
    if (!native.VNDocumentCameraViewControllerDelegate) {
      throw new Error('VisionKit scanner delegate protocol is not available.');
    }

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
  try {
    return await runOnUIKit((native) => {
      try {
        getDocumentCameraController(native);
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export async function openDocumentScanner() {
  const available = await isDocumentScannerAvailable();

  if (!available) {
    throw new Error('VisionKit document scanner is not available on this device.');
  }

  return new Promise<DocumentScanResult>((resolve, reject) => {
    presentNativeViewController((native) => {
      try {
        const Controller = getDocumentCameraController(native);
        const controller = Controller.new();
        controller.delegate = registerScannerDelegate(native, resolve, reject);

        return controller;
      } catch (error) {
        throw new Error(describeNativeError(error));
      }
    }).catch(reject);
  });
}
