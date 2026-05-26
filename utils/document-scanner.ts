import { presentNativeViewController } from './view-controller';
import { loadSystemFramework, runOnUIKit } from './native-script';

export type DocumentScanResult = {
  pageCount: number;
  title: string;
};

let scannerDelegateClass: any;
let activeScannerDelegate: any;

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

function nativeValue(native: Record<string, any>, key: string) {
  return withNativeStep(`${key} lookup`, () => native[key]);
}

function getDocumentCameraController(
  native: typeof globalThis & Record<string, any>,
) {
  withNativeStep('framework load', () =>
    loadSystemFramework(native, 'VisionKit'),
  );

  const Controller = nativeValue(native, 'VNDocumentCameraViewController');

  if (!Controller) {
    throw new Error('VisionKit document scanner is not available on this OS.');
  }

  return Controller;
}

function createDocumentCameraController(Controller: any) {
  return withNativeStep('controller creation', () => {
    if (typeof Controller.alloc === 'function') {
      return Controller.alloc().init();
    }

    return Controller.new();
  });
}

function getDocumentCameraDelegateProtocol(native: Record<string, any>) {
  try {
    const generatedProtocol = nativeValue(
      native,
      'VNDocumentCameraViewControllerDelegate',
    );

    if (generatedProtocol) {
      return generatedProtocol;
    }
  } catch {
    // Some device builds throw while reading generated protocol globals.
  }

  return withNativeStep('delegate protocol lookup', () =>
    native.NSProtocolFromString?.('VNDocumentCameraViewControllerDelegate') ??
    native.objc_getProtocol?.('VNDocumentCameraViewControllerDelegate'),
  );
}

function registerScannerDelegate(
  native: Record<string, any>,
  resolve: (result: DocumentScanResult) => void,
  reject: (error: Error) => void,
) {
  if (!scannerDelegateClass) {
    const delegateProtocol = getDocumentCameraDelegateProtocol(native);

    if (!delegateProtocol) {
      throw new Error('VisionKit scanner delegate protocol is not available.');
    }

    scannerDelegateClass = withNativeStep('delegate registration', () =>
      native.NSObject.extend(
        {
          documentCameraViewControllerDidFinishWithScan(
            controller: any,
            scan: any,
          ) {
            this.onDone?.(scan, controller);
          },

          documentCameraViewControllerDidCancel(controller: any) {
            this.onCancel?.(controller);
          },

          documentCameraViewControllerDidFailWithError(
            controller: any,
            error: any,
          ) {
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

  const delegate = withNativeStep('delegate creation', () =>
    scannerDelegateClass.new(),
  );

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
  let unavailableReason: unknown;

  try {
    const available = await runOnUIKit((native) => {
      try {
        const Controller = getDocumentCameraController(native);
        createDocumentCameraController(Controller);
        registerScannerDelegate(
          native,
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
    throw new Error('VisionKit document scanner is not available on this device.');
  }

  return new Promise<DocumentScanResult>((resolve, reject) => {
    presentNativeViewController((native) => {
      try {
        const Controller = getDocumentCameraController(native);
        const controller = createDocumentCameraController(Controller);
        const delegate = registerScannerDelegate(native, resolve, reject);
        withNativeStep('delegate assignment', () => {
          controller.delegate = delegate;
        });

        return controller;
      } catch (error) {
        throw new Error(describeNativeError(error));
      }
    }).catch(reject);
  });
}
