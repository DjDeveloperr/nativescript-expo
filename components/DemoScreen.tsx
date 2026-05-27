import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/colors';
import { GlassButtonBackground } from './GlassButtonBackground';
import { SFSymbolIcon } from './SFSymbolIcon';

type DemoScreenProps = {
  title: string;
  eyebrow: string;
  children?: ReactNode;
  scrollEnabled?: boolean;
  showsHeader?: boolean;
};

type DemoButtonProps = {
  disabled?: boolean;
  title: string;
  onPress: () => void;
};

type DemoEmptyStateProps = {
  icon: string;
  text: string;
};

type DemoCenteredActionProps = {
  disabled?: boolean;
  glass?: boolean;
  inline?: boolean;
  onPress: () => void;
  systemImage: string;
  title: string;
};

type DemoCenteredStatusProps = {
  systemImage: string;
  text: string;
};

export function DemoScreen({
  title,
  eyebrow,
  children,
  scrollEnabled = true,
  showsHeader = true,
}: DemoScreenProps) {
  const content = (
    <>
      {showsHeader ? (
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      {children}
    </>
  );

  if (!scrollEnabled) {
    return <View style={styles.staticContainer}>{content}</View>;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      scrollIndicatorInsets={styles.scrollIndicatorInsets}
    >
      {content}
    </ScrollView>
  );
}

export function DemoButton({ disabled = false, title, onPress }: DemoButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function DemoEmptyState({ icon, text }: DemoEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function DemoCenteredAction({
  disabled = false,
  glass = false,
  inline = false,
  onPress,
  systemImage,
  title,
}: DemoCenteredActionProps) {
  return (
    <View style={styles.centeredActionContainer}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.centeredAction,
          inline && styles.centeredActionInline,
          glass && styles.centeredActionGlass,
          pressed && !disabled && styles.centeredActionPressed,
          disabled && styles.centeredActionDisabled,
        ]}
      >
        {glass ? <GlassButtonBackground style={styles.glassBackground} /> : null}
        <SFSymbolIcon
          pointSize={inline ? 28 : 54}
          systemImage={systemImage}
          style={[
            styles.centeredActionIcon,
            inline && styles.centeredActionIconInline,
          ]}
        />
        <Text
          style={[
            styles.centeredActionText,
            disabled && styles.centeredActionTextDisabled,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

export function DemoCenteredStatus({
  systemImage,
  text,
}: DemoCenteredStatusProps) {
  return (
    <View style={styles.centeredActionContainer}>
      <View style={styles.centeredStatus}>
        <SFSymbolIcon
          pointSize={54}
          systemImage={systemImage}
          style={styles.centeredActionIcon}
        />
        <Text style={styles.emptyText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 18,
    padding: 22,
    paddingBottom: 128,
  },
  staticContainer: {
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 22,
    paddingBottom: 128,
  },
  scrollIndicatorInsets: {
    bottom: 88,
  },
  header: {
    gap: 8,
    paddingTop: 20,
  },
  eyebrow: {
    color: colors.label,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.buttonBackground,
    borderRadius: 8,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabledBackground,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: colors.buttonDisabledText,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    color: colors.label,
    fontSize: 52,
    fontWeight: '700',
    lineHeight: 60,
    marginBottom: 10,
  },
  emptyText: {
    color: colors.label,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
  },
  centeredActionContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centeredAction: {
    alignItems: 'center',
    borderRadius: 12,
    gap: 14,
    justifyContent: 'center',
    minHeight: 148,
    minWidth: 190,
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  centeredActionInline: {
    alignSelf: 'center',
    borderRadius: 32,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    minWidth: 224,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 0,
  },
  centeredActionGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  centeredActionPressed: {
    opacity: 0.82,
  },
  centeredActionDisabled: {
    opacity: 0.48,
  },
  glassBackground: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  centeredActionIcon: {
    height: 66,
    width: 74,
  },
  centeredActionIconInline: {
    height: 34,
    width: 34,
  },
  centeredActionText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
  },
  centeredActionTextDisabled: {
    color: colors.label,
  },
  centeredStatus: {
    alignItems: 'center',
    gap: 14,
    justifyContent: 'center',
  },
});
