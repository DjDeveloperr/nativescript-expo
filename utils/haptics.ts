import { runOnUIKit } from './native-script';

export type ImpactHapticStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
export type NotificationHapticType = 'success' | 'warning' | 'error';

const impactStyles: Record<ImpactHapticStyle, number> = {
  light: 0,
  medium: 1,
  heavy: 2,
  soft: 3,
  rigid: 4,
};

const notificationTypes: Record<NotificationHapticType, number> = {
  success: 0,
  warning: 1,
  error: 2,
};

export async function impact(style: ImpactHapticStyle = 'medium') {
  await runOnUIKit((native) => {
    const generator = native.UIImpactFeedbackGenerator.alloc().initWithStyle(
      impactStyles[style],
    );
    generator.prepare();
    generator.impactOccurred();
  });
}

export async function selectionChanged() {
  await runOnUIKit((native) => {
    const generator = native.UISelectionFeedbackGenerator.new();
    generator.prepare();
    generator.selectionChanged();
  });
}

export async function notification(type: NotificationHapticType) {
  await runOnUIKit((native) => {
    const generator = native.UINotificationFeedbackGenerator.new();
    generator.prepare();
    generator.notificationOccurred(notificationTypes[type]);
  });
}
