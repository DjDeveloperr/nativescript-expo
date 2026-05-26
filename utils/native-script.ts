import NativeScript from '@nativescript/react-native';

type NativeGlobals = typeof globalThis & Record<string, any>;

let installed = false;

export function ensureNativeScript() {
  if (!installed) {
    installed = NativeScript.init();
  }

  if (!installed) {
    throw new Error('NativeScript Native API is not available.');
  }
}

export async function runOnUIKit<T>(work: (native: NativeGlobals) => T) {
  ensureNativeScript();

  let result: T | undefined;
  let thrown: unknown;

  await NativeScript.runOnUI(() => {
    try {
      result = work(globalThis as NativeGlobals);
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

export function loadSystemFramework(native: NativeGlobals, framework: string) {
  const existingClass = native[`${framework}VersionNumber`];
  if (existingClass !== undefined) {
    return;
  }

  const bundle = native.NSBundle.bundleWithPath(
    `/System/Library/Frameworks/${framework}.framework`,
  );

  if (!bundle?.load()) {
    throw new Error(`${framework}.framework could not be loaded.`);
  }
}
