import NativeScript from '@nativescript/react-native';

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

type NativeGlobals = typeof globalThis & Record<string, unknown>;
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

/**
 * Helpers for NativeScript types
 */

export type ObjCExposedMethod = {
  returns?: interop.Type;
  params?: interop.Type[];
};

export type ObjCClassOptions = {
  name?: string;
  protocols?: unknown[];
  exposedMethods?: Record<string, ObjCExposedMethod>;
};

/**
 * Instance members supplied to {@link defineObjCClass}.
 */
export type ObjCClassMembers<Instance> = Partial<Instance> & ThisType<Instance>;

/**
 * Constructor for a subclass produced by {@link defineObjCClass}.
 */
export type ObjCClass<Instance extends NSObject> = {
  new: () => Instance;
  alloc: () => Instance;
  /** Extend this subclass into a more specialized one. */
  extend: ObjCExtend;
};

/** Shape of the dynamic `extend` method itself. */
type ObjCExtend = <Instance extends NSObject>(
  members: ObjCClassMembers<Instance>,
  options?: ObjCClassOptions,
) => ObjCClass<Instance>;

/** `NSObject` augmented with the `extend` method the runtime adds at install. */
type ObjCExtendable = { extend: ObjCExtend };

/**
 * Define a new Objective-C subclass from TypeScript
 */
export function defineObjCClass<Instance extends NSObject>(
  members: ObjCClassMembers<Instance>,
  options?: ObjCClassOptions,
): ObjCClass<Instance> {
  return (NSObject as unknown as ObjCExtendable).extend(members, options);
}

