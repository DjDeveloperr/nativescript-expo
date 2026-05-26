import NativeScript, { defineUIKitView } from '@nativescript/react-native';

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

const nativeScriptReady = NativeScript.init();
const nativeRetainers: any[] = [];

const NativeTabBarDelegate = (NSObject as any).extend(
  {
    tabBarDidSelectItem(tabBar: any, item: any) {
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

const NativeAccessoryButtonTarget = (NSObject as any).extend(
  {
    accessoryButtonPressed() {
      this.nativeOnPress?.();
    },
  },
  {
    name: `NativeScriptRNTabBarAccessoryTarget${Date.now()}`,
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
    );
    tabItem.tag = index;
    (tabItem as UITabBarItem & { nativeIndex?: number }).nativeIndex = index;
    return tabItem;
  });
}

function configureAccessoryButton(
  button: UIButton & { nativeOnPress?: () => void },
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
  button.layer.cornerRadius = 24;
  button.clipsToBounds = true;
  button.accessibilityLabel = props.title;
}

export const NativeTabBar = defineUIKitView<NativeTabBarProps, UITabBar>({
  name: 'NativeTabBar',
  create(props) {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const tabBar = UITabBar.alloc().initWithFrame(CGRectZero);
    const tabBarState = tabBar as UITabBar & {
      nativeOnSelect?: (index: number) => void;
      nativeTabBarDelegate?: unknown;
    };
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
      (tabBar as UITabBar & { scrollEdgeAppearance?: UITabBarAppearance })
        .scrollEdgeAppearance = appearance;
    }
    tabBarState.nativeOnSelect = props.onSelect;
    (tabBarState as any).nativeTabTitles = props.items.map((item) => item.title);

    const items = createNativeItems(props.items);
    tabBar.setItemsAnimated(items, false);
    tabBar.selectedItem = items[props.selectedIndex];
    tabBar.accessibilityValue =
      `${props.items[props.selectedIndex]?.title ?? 'Tab'} selected`;

    const delegate = NativeTabBarDelegate.new();
    nativeRetainers.push(delegate);
    tabBar.delegate = delegate;
    tabBarState.nativeTabBarDelegate = delegate;

    return tabBar;
  },
  update(tabBar, props) {
    const tabBarState = tabBar as UITabBar & {
      nativeOnSelect?: (index: number) => void;
      nativeTabBarDelegate?: unknown;
    };
    tabBarState.nativeOnSelect = props.onSelect;
    (tabBarState as any).nativeTabTitles = props.items.map((item) => item.title);
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
    const delegate = (tabBar as UITabBar & {
      nativeTabBarDelegate?: unknown;
    }).nativeTabBarDelegate;
    const index = nativeRetainers.indexOf(delegate);
    if (index >= 0) {
      nativeRetainers.splice(index, 1);
    }
  },
});

export const NativeTabBarAccessoryButton = defineUIKitView<
  NativeTabBarAccessoryButtonProps,
  UIButton
>({
  name: 'NativeTabBarAccessoryButton',
  create(props) {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const button = UIButton.buttonWithType(UIButtonType.System) as UIButton & {
      nativeAccessoryTarget?: unknown;
      nativeOnPress?: () => void;
    };
    button.autoresizingMask =
      UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
    configureAccessoryButton(button, props);

    const target = NativeAccessoryButtonTarget.new();
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
    const buttonState = button as UIButton & {
      nativeAccessoryTarget?: { nativeOnPress?: () => void };
      nativeOnPress?: () => void;
    };
    configureAccessoryButton(buttonState, props);
    if (buttonState.nativeAccessoryTarget) {
      buttonState.nativeAccessoryTarget.nativeOnPress = props.onPress;
    }
  },
  dispose(button) {
    const target = (button as UIButton & {
      nativeAccessoryTarget?: unknown;
    }).nativeAccessoryTarget;
    const index = nativeRetainers.indexOf(target);
    if (index >= 0) {
      nativeRetainers.splice(index, 1);
    }
  },
});
