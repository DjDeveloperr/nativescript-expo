import NativeScript from '@nativescript/react-native';

type NativeGlobals = typeof globalThis & Record<string, unknown>;

let installed = false;

export function ensureNativeScript() {
  if (!installed) {
    installed = NativeScript.init();
  }

  if (!installed) {
    throw new Error('NativeScript Native API is not available.');
  }
}

export async function runOnUIKit<T>(work: () => T) {
  ensureNativeScript();

  let result: T | undefined;
  let thrown: unknown;

  await NativeScript.runOnUI(() => {
    try {
      result = work();
    } catch (error) {
      thrown = error;
    }
  });

  if (thrown) {
    throw thrown;
  }

  return result as T;
}

export function nativeGlobals() {
  ensureNativeScript();
  return globalThis as NativeGlobals;
}

export function loadSystemFramework(framework: string) {
  const existingClass = nativeGlobals()[`${framework}VersionNumber`];
  if (existingClass !== undefined) {
    return;
  }

  const bundle = NSBundle.bundleWithPath(
    `/System/Library/Frameworks/${framework}.framework`,
  );

  if (!bundle?.load()) {
    throw new Error(`${framework}.framework could not be loaded.`);
  }
}
