import NativeScript, { defineUIKitView } from '@nativescript/react-native';
import { defineObjCClass } from './ns';

export type NativeTabItem = {
  title: string;
  systemImage: string;
  selectedSystemImage?: string;
};

type NativeTabBarProps = {
  items: NativeTabItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

type NativeTabBarAccessoryButtonProps = {
  title: string;
  systemImage: string;
  onPress: () => void;
};

/** `UITabBar` augmented with the JS state we stash on each instance. */
type TabBarWithState = UITabBar & {
  nativeOnSelect?: (index: number) => void;
  nativeTabTitles?: string[];
  nativeTabBarDelegate?: NSObject;
  // Available since iOS 15 but absent from the generated `UITabBar` typings.
  scrollEdgeAppearance?: UITabBarAppearance;
};

/** `UITabBarItem` augmented with its resolved index. */
type TabBarItemWithIndex = UITabBarItem & {
  nativeIndex?: number;
};

/** `UIButton` augmented with the accessory press handler and its target. */
type AccessoryButtonWithState = UIButton & {
  nativeOnPress?: () => void;
  nativeAccessoryTarget?: AccessoryButtonTarget;
};

/** Delegate subclass instance that forwards tab selection back to JS. */
type TabBarDelegate = NSObject & {
  tabBarDidSelectItem(tabBar: TabBarWithState, item: TabBarItemWithIndex): void;
};

/** Target subclass instance that forwards accessory button taps back to JS. */
type AccessoryButtonTarget = NSObject & {
  nativeOnPress?: () => void;
  accessoryButtonPressed(): void;
};

const nativeScriptReady = NativeScript.init();
const nativeRetainers: NSObject[] = [];

const TabBarDelegateClass = defineObjCClass<TabBarDelegate>(
  {
    tabBarDidSelectItem(tabBar, item) {
      const title = item.title || 'Tab';
      const index =
        typeof item.nativeIndex === 'number'
          ? item.nativeIndex
          : typeof item.tag === 'number'
            ? item.tag
            : (tabBar.nativeTabTitles ?? []).indexOf(title);

      tabBar.accessibilityValue = `${title} selected`;
      if (index >= 0) {
        tabBar.nativeOnSelect?.(index);
      }
    },
  },
  {
    name: `NativeScriptRNTabBarDelegate${Date.now()}`,
    protocols: [UITabBarDelegate],
  },
);

const AccessoryButtonTargetClass = defineObjCClass<AccessoryButtonTarget>(
  {
    accessoryButtonPressed() {
      this.nativeOnPress?.();
    },
  },
  {
    name: `NativeScriptRNTabBarAccessoryTarget${Date.now()}`,
    // Custom target-action selector: allows connection to UIControl
    exposedMethods: {
      accessoryButtonPressed: { returns: interop.types.void, params: [] },
    },
  },
);

function createNativeItems(items: NativeTabItem[]) {
  return items.map((item, index) => {
    const image = UIImage.systemImageNamed(item.systemImage);
    const selectedImage = UIImage.systemImageNamed(
      item.selectedSystemImage ?? `${item.systemImage}.fill`,
    );
    const tabItem = UITabBarItem.alloc().initWithTitleImageSelectedImage(
      item.title,
      image,
      selectedImage,
    ) as TabBarItemWithIndex;
    tabItem.tag = index;
    tabItem.nativeIndex = index;
    return tabItem;
  });
}

function configureAccessoryButton(
  button: AccessoryButtonWithState,
  props: NativeTabBarAccessoryButtonProps,
) {
  const image = UIImage.systemImageNamed(props.systemImage);

  button.nativeOnPress = props.onPress;
  button.setTitleForState(props.title, UIControlState.Normal);
  button.setImageForState(image, UIControlState.Normal);
  button.setTitleColorForState(UIColor.whiteColor, UIControlState.Normal);
  button.tintColor = UIColor.whiteColor;
  button.backgroundColor = UIColor.systemBlueColor;
  button.titleLabel.font = UIFont.boldSystemFontOfSize(17);
  button.contentEdgeInsets = { top: 0, left: 18, bottom: 0, right: 20 };
  button.imageEdgeInsets = { top: 0, left: -4, bottom: 0, right: 8 };
  button.layer.cornerRadius = 27;
  button.clipsToBounds = true;
  button.accessibilityLabel = props.title;
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

export const NativeTabBar = defineUIKitView<NativeTabBarProps, TabBarWithState>({
  name: 'NativeTabBar',
  create(props) {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const tabBar = UITabBar.alloc().initWithFrame(CGRectZero) as TabBarWithState;
    tabBar.autoresizingMask =
      UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
    tabBar.accessibilityIdentifier = 'native-uikit-tab-bar';
    tabBar.accessibilityLabel = 'Native UIKit tab bar';
    tabBar.tintColor = UIColor.systemBlueColor;
    tabBar.unselectedItemTintColor = UIColor.secondaryLabelColor;
    tabBar.backgroundColor = UIColor.clearColor;
    tabBar.opaque = false;
    tabBar.translucent = true;
    if (typeof UITabBarAppearance !== 'undefined') {
      const appearance = UITabBarAppearance.new();
      appearance.configureWithDefaultBackground();
      tabBar.standardAppearance = appearance;
      tabBar.scrollEdgeAppearance = appearance;
    }
    tabBar.nativeOnSelect = props.onSelect;
    tabBar.nativeTabTitles = props.items.map((item) => item.title);

    const items = createNativeItems(props.items);
    tabBar.setItemsAnimated(items, false);
    tabBar.selectedItem = items[props.selectedIndex];
    tabBar.accessibilityValue =
      `${props.items[props.selectedIndex]?.title ?? 'Tab'} selected`;

    const delegate = TabBarDelegateClass.new();
    nativeRetainers.push(delegate);
    tabBar.delegate = delegate;
    tabBar.nativeTabBarDelegate = delegate;

    return tabBar;
  },
  update(tabBar, props) {
    tabBar.nativeOnSelect = props.onSelect;
    tabBar.nativeTabTitles = props.items.map((item) => item.title);
    tabBar.accessibilityValue =
      `${props.items[props.selectedIndex]?.title ?? 'Tab'} selected`;

    if (tabBar.items?.count !== props.items.length) {
      tabBar.setItemsAnimated(createNativeItems(props.items), false);
    }

    const selectedItem = tabBar.items?.objectAtIndex(props.selectedIndex);
    if (selectedItem) {
      tabBar.selectedItem = selectedItem;
    }
  },
  dispose(tabBar) {
    releaseRetainer(tabBar.nativeTabBarDelegate);
  },
});

export const NativeTabBarAccessoryButton = defineUIKitView<
  NativeTabBarAccessoryButtonProps,
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
