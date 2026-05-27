import NativeScript, {
  defineUIKitContainer,
  defineUIKitView,
  defineUIViewController,
} from '@nativescript/react-native';
import { defineObjCClass } from './ns';
import { logError } from './logger';

export type NativeTabItem = {
  title: string;
  systemImage: string;
  selectedSystemImage?: string;
};

export type NativeTabAccessory = {
  title: string;
  systemImage: string;
  disabled?: boolean;
  onPress: () => void | Promise<void>;
};

type NativeTabBarProps = {
  items: NativeTabItem[];
  accessory?: NativeTabAccessory;
  selectedIndex: number;
  onSelect: (index: number) => void;
};

type NativeNavigationStackProps = {
  title: string;
};

type NativeNavigationContainerProps = {
  title: string;
};

/** `UITabBarController` augmented with the JS state we stash on each instance. */
type TabBarControllerWithState = UITabBarController & {
  nativeOnSelect?: (index: number) => void;
  nativeItems?: NativeTabItem[];
  nativeItemSignature?: string;
  nativeAccessory?: UITabAccessory;
  nativeAccessoryButton?: AccessoryButtonWithState;
  nativeAccessoryTarget?: AccessoryButtonTarget;
  nativeAccessorySignature?: string;
  nativePendingSelectedIndex?: number;
  nativeSelectedIndex?: number;
  nativeSelectionTimer?: ReturnType<typeof setTimeout>;
  nativeTabControllerDelegate?: UITabBarControllerDelegate;
  nativeTabControllerRetainer?: ReturnType<typeof NativeScript.createRetainer>;
};

type AccessoryButtonWithState = UIButton & {
  nativeAccessoryTarget?: AccessoryButtonTarget;
};

type AccessoryButtonTarget = NSObject & {
  nativeOnPress?: () => void | Promise<void>;
  accessoryButtonPressed(): void;
};

type NavigationControllerWithState = UINavigationController & {
  nativeRootController?: UIViewController;
  nativeTitle?: string;
};

type NativeNavigationContainerState = {
  childrenView: UIView;
  navigationController: NavigationControllerWithState;
  retainer: ReturnType<typeof NativeScript.createRetainer>;
  rootView: UIView;
};

const nativeScriptReady = NativeScript.init();
const nativeRetainers: NSObject[] = [];

const AccessoryButtonTargetClass = defineObjCClass<AccessoryButtonTarget>(
  {
    accessoryButtonPressed: NativeScript.eventBridge(function accessoryButtonPressed(
      this: AccessoryButtonTarget,
    ) {
      const onPress = this.nativeOnPress;
      if (!onPress) {
        return;
      }

      void Promise.resolve()
        .then(onPress)
        .catch((error) => {
          logError(error);
        });
    }, 'js'),
  },
  {
    name: `NativeScriptRNTabBarAccessoryTarget${Date.now()}`,
    exposedMethods: {
      accessoryButtonPressed: { returns: interop.types.void, params: [] },
    },
  },
);

function createNativeControllers(items: NativeTabItem[]) {
  return items.map((item, index) => {
    const image = UIImage.systemImageNamed(item.systemImage);
    const selectedImage = UIImage.systemImageNamed(
      item.selectedSystemImage ?? `${item.systemImage}.fill`,
    );
    const controller = UIViewController.new();
    controller.view.backgroundColor = UIColor.clearColor;
    controller.tabBarItem = UITabBarItem.alloc().initWithTitleImageSelectedImage(
      item.title,
      image,
      selectedImage,
    );
    controller.tabBarItem.tag = index;
    return controller;
  });
}

function nativeItemSignature(items: NativeTabItem[]) {
  return items
    .map((item) =>
      [item.title, item.systemImage, item.selectedSystemImage ?? ''].join('\u0000'),
    )
    .join('\u0001');
}

function selectedAccessibilityValue(items: NativeTabItem[], selectedIndex: number) {
  return `${items[selectedIndex]?.title ?? 'Tab'} selected`;
}

function clampSelectedIndex(selectedIndex: number, itemCount: number) {
  return Math.min(Math.max(selectedIndex, 0), Math.max(itemCount - 1, 0));
}

function configureTabBarController(
  controller: TabBarControllerWithState,
  props: NativeTabBarProps,
) {
  controller.nativeOnSelect = props.onSelect;
  controller.nativeItems = props.items;
  controller.view.accessibilityValue = selectedAccessibilityValue(
    props.items,
    props.selectedIndex,
  );

  const itemSignature = nativeItemSignature(props.items);
  const didRebuildItems = controller.nativeItemSignature !== itemSignature;
  if (didRebuildItems) {
    controller.setViewControllersAnimated(
      NSArray.arrayWithArray(createNativeControllers(props.items)),
      false,
    );
    controller.nativeItemSignature = itemSignature;
  }

  if (props.items.length > 0) {
    const selectedIndex = clampSelectedIndex(
      props.selectedIndex,
      props.items.length,
    );
    const needsNativeSelection =
      didRebuildItems ||
      controller.nativeSelectedIndex === undefined ||
      controller.nativeSelectedIndex >= props.items.length;

    if (needsNativeSelection && controller.selectedIndex !== selectedIndex) {
      controller.selectedIndex = selectedIndex;
    }
    if (needsNativeSelection) {
      controller.nativeSelectedIndex = selectedIndex;
    }
  }

  configureBottomAccessory(controller, props.accessory);
}

function configureAccessoryButton(
  button: AccessoryButtonWithState,
  props: NativeTabAccessory,
) {
  const image = UIImage.systemImageNamed(props.systemImage);
  const enabled = props.disabled !== true;
  const foregroundColor = enabled ? UIColor.labelColor : UIColor.secondaryLabelColor;

  button.enabled = enabled;
  button.setTitleForState(props.title, UIControlState.Normal);
  button.setImageForState(image, UIControlState.Normal);
  button.setTitleColorForState(foregroundColor, UIControlState.Normal);
  button.tintColor = foregroundColor;
  button.titleLabel.font = UIFont.systemFontOfSize(17);
  button.contentEdgeInsets = { top: 0, left: 16, bottom: 0, right: 16 };
  button.imageEdgeInsets = { top: 0, left: -4, bottom: 0, right: 8 };
  button.layer.cornerRadius = 24;
  button.clipsToBounds = true;
  button.accessibilityLabel = props.title;
  button.userInteractionEnabled = true;
}

function createAccessoryButton(props: NativeTabAccessory) {
  const button = UIButton.buttonWithType(
    UIButtonType.System,
  ) as AccessoryButtonWithState;
  button.frame = {
    origin: { x: 0, y: 0 },
    size: { width: 358, height: 54 },
  };
  button.autoresizingMask =
    UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
  configureAccessoryButton(button, props);

  const target = AccessoryButtonTargetClass.new();
  target.nativeOnPress = props.onPress;
  nativeRetainers.push(target);
  button.nativeAccessoryTarget = target;
  button.addTargetActionForControlEvents(
    target,
    'accessoryButtonPressed',
    UIControlEvents.TouchUpInside,
  );

  return button;
}

function accessorySignature(accessory: NativeTabAccessory) {
  return [
    accessory.title,
    accessory.systemImage,
    accessory.disabled === true ? 'disabled' : 'enabled',
  ].join('\u0000');
}

function configureBottomAccessory(
  controller: TabBarControllerWithState,
  accessory: NativeTabAccessory | undefined,
) {
  if (!accessory) {
    if (controller.nativeAccessory) {
      controller.setBottomAccessoryAnimated(null, false);
      releaseRetainer(controller.nativeAccessoryTarget);
      controller.nativeAccessory = undefined;
      controller.nativeAccessoryButton = undefined;
      controller.nativeAccessoryTarget = undefined;
      controller.nativeAccessorySignature = undefined;
    }
    return;
  }

  const signature = accessorySignature(accessory);
  if (
    !controller.nativeAccessory ||
    !controller.nativeAccessoryButton ||
    !controller.nativeAccessoryTarget
  ) {
    releaseRetainer(controller.nativeAccessoryTarget);

    const button = createAccessoryButton(accessory);
    const tabAccessory = UITabAccessory.alloc().initWithContentView(button);

    controller.nativeAccessory = tabAccessory;
    controller.nativeAccessoryButton = button;
    controller.nativeAccessoryTarget = button.nativeAccessoryTarget;
    controller.nativeAccessorySignature = signature;
    controller.setBottomAccessoryAnimated(tabAccessory, false);
    return;
  }

  configureAccessoryButton(controller.nativeAccessoryButton, accessory);
  if (controller.nativeAccessoryTarget) {
    controller.nativeAccessoryTarget.nativeOnPress = accessory.onPress;
  }
  controller.nativeAccessorySignature = signature;
}

function releaseRetainer(retainer: NSObject | undefined) {
  if (!retainer) {
    return;
  }

  const index = nativeRetainers.indexOf(retainer);
  if (index >= 0) {
    nativeRetainers.splice(index, 1);
  }
}

function configureNavigationStack(
  controller: NavigationControllerWithState,
  props: NativeNavigationStackProps,
) {
  const rootController = controller.nativeRootController;
  if (!rootController) {
    return;
  }

  if (controller.nativeTitle !== props.title) {
    rootController.navigationItem.title = props.title;
    controller.nativeTitle = props.title;
  }
}

function configureNavigationBarBlur(navigationBar: UINavigationBar) {
  navigationBar.translucent = true;
  navigationBar.opaque = false;
  navigationBar.backgroundColor = UIColor.clearColor;

  if (typeof UINavigationBarAppearance === 'undefined') {
    return;
  }

  const appearance = UINavigationBarAppearance.new();
  appearance.configureWithDefaultBackground();

  navigationBar.standardAppearance = appearance;
  navigationBar.compactAppearance = appearance;
  navigationBar.scrollEdgeAppearance = appearance;
  navigationBar.compactScrollEdgeAppearance = appearance;
}

export const NativeNavigationStack = defineUIViewController<
  NativeNavigationStackProps,
  NavigationControllerWithState
>({
  name: 'NativeNavigationStack',
  layout: { sizing: 'fill' },
  createController() {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const rootController = UIViewController.new();
    rootController.view.backgroundColor = UIColor.clearColor;
    rootController.navigationItem.largeTitleDisplayMode =
      UINavigationItemLargeTitleDisplayMode.Never;

    const controller = UINavigationController.alloc().initWithRootViewController(
      rootController,
    ) as NavigationControllerWithState;
    controller.nativeRootController = rootController;
    controller.view.backgroundColor = UIColor.clearColor;
    controller.view.opaque = false;
    controller.view.accessibilityIdentifier = 'native-uikit-navigation-stack';
    controller.view.accessibilityLabel = 'Native UIKit navigation stack';
    controller.navigationBar.prefersLargeTitles = false;
    controller.navigationBar.opaque = false;
    configureNavigationBarBlur(controller.navigationBar);

    return controller;
  },
  update(controller, props) {
    configureNavigationStack(controller, props);
  },
  dispose(controller) {
    controller.nativeRootController = undefined;
  },
});

export const NativeNavigationContainer = defineUIKitContainer<
  NativeNavigationContainerProps,
  UIView,
  UIView
>({
  name: 'NativeNavigationContainer',
  layout: { sizing: 'fill' },
  create() {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const rootController = UIViewController.new();
    rootController.view.backgroundColor = UIColor.clearColor;
    rootController.view.opaque = false;
    rootController.edgesForExtendedLayout = 15;
    rootController.extendedLayoutIncludesOpaqueBars = true;
    rootController.navigationItem.largeTitleDisplayMode =
      UINavigationItemLargeTitleDisplayMode.Never;

    const navigationController = UINavigationController.alloc().initWithRootViewController(
      rootController,
    ) as NavigationControllerWithState;
    navigationController.nativeRootController = rootController;
    navigationController.view.backgroundColor = UIColor.clearColor;
    navigationController.view.opaque = false;
    navigationController.view.accessibilityIdentifier =
      'native-uikit-navigation-container';
    navigationController.view.accessibilityLabel =
      'Native UIKit navigation container';
    navigationController.navigationBar.prefersLargeTitles = false;
    configureNavigationBarBlur(navigationController.navigationBar);

    const retainer = NativeScript.createRetainer();
    retainer.retain(navigationController);

    return {
      rootView: navigationController.view,
      childrenView: rootController.view,
      navigationController,
      retainer,
    } as NativeNavigationContainerState;
  },
  update(view, props) {
    const state = view as NativeNavigationContainerState;
    configureNavigationStack(state.navigationController, props);
  },
  dispose(view) {
    const state = view as NativeNavigationContainerState;
    state.navigationController.nativeRootController = undefined;
    state.retainer.dispose();
  },
});

export const NativeTabBarController = defineUIViewController<
  NativeTabBarProps,
  TabBarControllerWithState
>({
  name: 'NativeTabBarController',
  layout: { sizing: 'fill' },
  createController() {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const controller = UITabBarController.new() as TabBarControllerWithState;
    controller.mode = UITabBarControllerMode.TabBar;
    controller.view.autoresizingMask =
      UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
    controller.view.accessibilityIdentifier = 'native-uikit-tab-controller';
    controller.view.accessibilityLabel = 'Native UIKit tab controller';
    controller.view.backgroundColor = UIColor.clearColor;
    controller.tabBar.tintColor = UIColor.systemBlueColor;
    controller.tabBar.unselectedItemTintColor = UIColor.secondaryLabelColor;
    controller.tabBar.backgroundColor = UIColor.clearColor;
    controller.tabBar.opaque = false;
    controller.tabBar.translucent = true;

    if (typeof UITabBarAppearance !== 'undefined') {
      const appearance = UITabBarAppearance.new();
      appearance.configureWithDefaultBackground();
      controller.tabBar.standardAppearance = appearance;
      (
        controller.tabBar as UITabBar & {
          scrollEdgeAppearance?: UITabBarAppearance;
        }
      ).scrollEdgeAppearance = appearance;
    }

    const retainer = NativeScript.createRetainer();
    const delegate = NativeScript.createDelegate<UITabBarControllerDelegate>(
      UITabBarControllerDelegate,
      {
        tabBarControllerDidSelectViewController: NativeScript.eventBridge(function tabBarControllerDidSelectViewController(
          tabController,
        ) {
          const controller = tabController as TabBarControllerWithState;
          const selectedIndex = controller.selectedIndex;
          if (controller.nativeSelectedIndex === selectedIndex) {
            return;
          }

          controller.nativeSelectedIndex = selectedIndex;
          controller.nativePendingSelectedIndex = selectedIndex;
          if (controller.nativeSelectionTimer) {
            return;
          }

          controller.nativeSelectionTimer = setTimeout(() => {
            controller.nativeSelectionTimer = undefined;
            const pendingIndex = controller.nativePendingSelectedIndex;
            controller.nativePendingSelectedIndex = undefined;
            if (pendingIndex === undefined) {
              return;
            }

            controller.nativeOnSelect?.(pendingIndex);
          }, 0);
        }, 'js'),
      },
      { retainer },
    );

    controller.delegate = delegate;
    controller.nativeTabControllerDelegate = delegate;
    controller.nativeTabControllerRetainer = retainer;

    return controller;
  },
  update(controller, props) {
    configureTabBarController(controller, props);
  },
  dispose(controller) {
    controller.delegate = null as unknown as UITabBarControllerDelegate;
    controller.setBottomAccessoryAnimated(null, false);
    releaseRetainer(controller.nativeAccessoryTarget);
    controller.nativeAccessory = undefined;
    controller.nativeAccessoryButton = undefined;
    controller.nativeAccessoryTarget = undefined;
    controller.nativePendingSelectedIndex = undefined;
    controller.nativeSelectedIndex = undefined;
    if (controller.nativeSelectionTimer) {
      clearTimeout(controller.nativeSelectionTimer);
      controller.nativeSelectionTimer = undefined;
    }
    controller.nativeTabControllerRetainer?.dispose();
    controller.nativeTabControllerDelegate = undefined;
    controller.nativeTabControllerRetainer = undefined;
  },
});

export const NativeTabBarAccessoryButton = defineUIKitView<
  NativeTabAccessory,
  AccessoryButtonWithState
>({
  name: 'NativeTabBarAccessoryButton',
  create(props) {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const button = UIButton.buttonWithType(
      UIButtonType.System,
    ) as AccessoryButtonWithState;
    button.autoresizingMask =
      UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
    configureAccessoryButton(button, props);

    const target = AccessoryButtonTargetClass.new();
    target.nativeOnPress = props.onPress;
    nativeRetainers.push(target);
    button.nativeAccessoryTarget = target;
    button.addTargetActionForControlEvents(
      target,
      'accessoryButtonPressed',
      UIControlEvents.TouchUpInside,
    );

    return button;
  },
  update(button, props) {
    configureAccessoryButton(button, props);
    if (button.nativeAccessoryTarget) {
      button.nativeAccessoryTarget.nativeOnPress = props.onPress;
    }
  },
  dispose(button) {
    releaseRetainer(button.nativeAccessoryTarget);
  },
});
