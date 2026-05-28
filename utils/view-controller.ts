import { runOnUIKit } from './ns';

const nilCompletion = null as unknown as () => void | null;

function visibleViewController(): UIViewController {
  const application = UIApplication.sharedApplication;
  const root = application.keyWindow?.rootViewController;

  if (!root) {
    throw new Error('Unable to find the app root view controller.');
  }

  let current = root;

  while (current.presentedViewController) {
    const presented = current.presentedViewController;

    if (presented.isBeingDismissed()) {
      break;
    }

    current = presented;
  }

  if ((current as UINavigationController).visibleViewController) {
    current = (current as UINavigationController).visibleViewController;
  }

  if ((current as UITabBarController).selectedViewController) {
    current = (current as UITabBarController).selectedViewController;
  }

  return current;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function presentNativeViewController(
  makeViewController: () => UIViewController,
) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const result = await runOnUIKit(() => {
      const presenter = visibleViewController();

      if (presenter.presentedViewController) {
        return false;
      }

      const viewController = makeViewController();
      presenter.presentViewControllerAnimatedCompletion(
        viewController,
        true,
        nilCompletion,
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

export async function dismissNativeViewController(viewController: UIViewController) {
  await runOnUIKit(() => {
    viewController.dismissViewControllerAnimatedCompletion(true, nilCompletion);
  });
}

export async function getTopViewController() {
  return runOnUIKit(() => visibleViewController());
}
