import { ReactNode, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeTabBar } from '../utils/native-tabs';
import { selectionChanged } from '../utils/haptics';

export type TabViewItem = {
  key: string;
  title: string;
  systemImage: string;
  selectedSystemImage?: string;
  content: ReactNode;
};

type TabViewProps = {
  tabs: TabViewItem[];
};

export function TabView({ tabs }: TabViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

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
    setSelectedIndex(index);
    selectionChanged().catch(() => {});
  }, []);

  const selectedTab = tabs[selectedIndex] ?? tabs[0];

  return (
    <View style={styles.root}>
      <View style={styles.content}>{selectedTab.content}</View>
      <NativeTabBar
        items={nativeItems}
        onSelect={selectTab}
        selectedIndex={selectedIndex}
        style={styles.nativeTabBar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingBottom: 92,
  },
  nativeTabBar: {
    bottom: 0,
    height: 88,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
