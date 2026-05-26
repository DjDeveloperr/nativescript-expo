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
