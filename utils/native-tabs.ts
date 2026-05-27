import NativeScript, {
  defineUIKitContainer,
  defineUIViewController,
  type UIKitViewContext,
} from '@nativescript/react-native';
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

type NativeNavigationContainerProps = {
  title: string;
};

type NativeTabBarContext = UIKitViewContext<NativeTabBarProps>;

/** `UITabBarController` augmented with the JS state we stash on each instance. */
type TabBarControllerWithState = UITabBarController & {
  nativeItems?: NativeTabItem[];
  nativeItemSignature?: string;
  nativeAccessory?: UITabAccessory;
  nativeAccessoryButton?: AccessoryButtonWithState;
  nativeSelectedIndex?: number;
};

type AccessoryButtonWithState = UIButton;

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
  ctx?: NativeTabBarContext,
) {
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

  configureBottomAccessory(controller, props.accessory, ctx);
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
  return button;
}

function configureBottomAccessory(
  controller: TabBarControllerWithState,
  accessory: NativeTabAccessory | undefined,
  ctx?: NativeTabBarContext,
) {
  if (!accessory) {
    if (controller.nativeAccessory) {
      controller.setBottomAccessoryAnimated(null, false);
    }
    return;
  }

  if (!controller.nativeAccessory || !controller.nativeAccessoryButton) {
    if (!ctx) {
      throw new Error('Native tab accessory requires a NativeScript view context.');
    }
    const button = createAccessoryButton(accessory);
    const tabAccessory = UITabAccessory.alloc().initWithContentView(button);
    ctx.targetAction(button, UIControlEvents.TouchUpInside, () => {
      const currentAccessory = ctx.props.accessory;
      if (!currentAccessory || currentAccessory.disabled) {
        return;
      }

      void Promise.resolve()
        .then(currentAccessory.onPress)
        .catch((error) => {
          logError(error);
        });
    });

    controller.nativeAccessory = tabAccessory;
    controller.nativeAccessoryButton = button;
    controller.setBottomAccessoryAnimated(tabAccessory, false);
    return;
  }

  configureAccessoryButton(controller.nativeAccessoryButton, accessory);
  controller.setBottomAccessoryAnimated(controller.nativeAccessory, false);
}

function configureNavigationTitle(
  controller: NavigationControllerWithState,
  props: NativeNavigationContainerProps,
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
    configureNavigationTitle(state.navigationController, props);
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
  createController(ctx) {
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

    ctx.delegate<UITabBarControllerDelegate>(
      controller,
      UITabBarControllerDelegate,
      {
        tabBarControllerDidSelectViewController(
          tabController,
        ) {
          const controller = tabController as TabBarControllerWithState;
          const selectedIndex = controller.selectedIndex;
          if (controller.nativeSelectedIndex === selectedIndex) {
            return;
          }

          controller.nativeSelectedIndex = selectedIndex;
          ctx.emit('onSelect', selectedIndex);
        },
      },
    );

    return controller;
  },
  update(controller, props, _previousProps, ctx) {
    configureTabBarController(controller, props, ctx);
  },
  dispose(controller) {
    controller.delegate = null as unknown as UITabBarControllerDelegate;
    controller.setBottomAccessoryAnimated(null, false);
    controller.nativeAccessory = undefined;
    controller.nativeAccessoryButton = undefined;
    controller.nativeSelectedIndex = undefined;
  },
});
