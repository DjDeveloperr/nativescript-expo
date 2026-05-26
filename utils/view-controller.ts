import { runOnUIKit } from './native-script';

type NativeGlobals = typeof globalThis & Record<string, any>;

function nativeBool(target: any, key: string) {
  const value = target?.[key];
  return typeof value === 'function' ? Boolean(value.call(target)) : Boolean(value);
}

function visibleViewController(native: NativeGlobals) {
  const application = native.UIApplication.sharedApplication;
  const root = application.keyWindow?.rootViewController;

  if (!root) {
    throw new Error('Unable to find the app root view controller.');
  }

  let current = root;

  while (current.presentedViewController) {
    const presented = current.presentedViewController;

    if (nativeBool(presented, 'isBeingDismissed')) {
      break;
    }

    current = presented;
  }

  if (current.visibleViewController) {
    current = current.visibleViewController;
  }

  if (current.selectedViewController) {
    current = current.selectedViewController;
  }

  return current;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function presentNativeViewController(
  makeViewController: (native: NativeGlobals) => any,
) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const result = await runOnUIKit((native) => {
      const presenter = visibleViewController(native);

      if (presenter.presentedViewController) {
        return false;
      }

      const viewController = makeViewController(native);
      presenter.presentViewControllerAnimatedCompletion(
        viewController,
        true,
        null,
      );

      return true;
    });

    if (result) {
      return;
    }

    await delay(80);
  }

  throw new Error('The previous native sheet is still closing.');
}

export async function dismissNativeViewController(viewController: any) {
  await runOnUIKit(() => {
    viewController.dismissViewControllerAnimatedCompletion(true, null);
  });
}

export async function getTopViewController() {
  return runOnUIKit((native) => visibleViewController(native));
}
