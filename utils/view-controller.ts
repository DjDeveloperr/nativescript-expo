import { runOnUIKit } from './native-script';

type NativeGlobals = typeof globalThis & Record<string, any>;

function visibleViewController(native: NativeGlobals) {
  const application = native.UIApplication.sharedApplication;
  const root = application.keyWindow?.rootViewController;

  if (!root) {
    throw new Error('Unable to find the app root view controller.');
  }

  let current = root;

  while (current.presentedViewController) {
    current = current.presentedViewController;
  }

  if (current.visibleViewController) {
    current = current.visibleViewController;
  }

  if (current.selectedViewController) {
    current = current.selectedViewController;
  }

  return current;
}

export async function presentNativeViewController(
  makeViewController: (native: NativeGlobals) => any,
) {
  await runOnUIKit((native) => {
    const presenter = visibleViewController(native);
    const viewController = makeViewController(native);
    presenter.presentViewControllerAnimatedCompletion(
      viewController,
      true,
      null,
    );
  });
}

export async function dismissNativeViewController(viewController: any) {
  await runOnUIKit(() => {
    viewController.dismissViewControllerAnimatedCompletion(true, null);
  });
}

export async function getTopViewController() {
  return runOnUIKit((native) => visibleViewController(native));
}
