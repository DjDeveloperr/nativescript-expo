import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  NativeNavigationContainer,
  NativeTabBarController,
  type NativeTabAccessory,
} from '../utils/native-tabs';
import { selectionChanged } from '../utils/haptics';
import { colors } from '../utils/colors';

export type TabViewItem = {
  key: string;
  title: string;
  systemImage: string;
  selectedSystemImage?: string;
  accessory?: NativeTabAccessory;
  content: ReactNode;
};

type TabViewProps = {
  tabs: TabViewItem[];
};

export function TabView({ tabs }: TabViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shellVisible, setShellVisible] = useState(false);

  const nativeItems = useMemo(
    () =>
      tabs.map((tab) => ({
        title: tab.title,
        systemImage: tab.systemImage,
        selectedSystemImage: tab.selectedSystemImage,
      })),
    [tabs],
  );

  const selectTab = useCallback((index: number) => {
    setSelectedIndex((currentIndex) => {
      if (currentIndex === index) {
        return currentIndex;
      }

      selectionChanged().catch(() => {});
      return index;
    });
  }, []);

  const selectedTab = tabs[selectedIndex] ?? tabs[0];

  useEffect(() => {
    let mounted = true;
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (mounted) {
          setShellVisible(true);
        }
      });
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <View style={[styles.root, !shellVisible && styles.hidden]}>
      <NativeNavigationContainer
        title={selectedTab.title}
        style={styles.content}
      >
        {selectedTab.content}
      </NativeNavigationContainer>
      <NativeTabBarController
        accessory={selectedTab.accessory}
        items={nativeItems}
        onSelect={selectTab}
        selectedIndex={selectedIndex}
        style={styles.nativeTabController}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  hidden: {
    opacity: 0,
  },
  content: {
    flex: 1,
  },
  nativeTabController: {
    backgroundColor: colors.transparent,
    bottom: 0,
    height: 168,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
