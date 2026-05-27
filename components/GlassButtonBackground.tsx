import NativeScript, { defineUIKitView } from '@nativescript/react-native';

const nativeScriptReady = NativeScript.init();

export const GlassButtonBackground = defineUIKitView<{}, UIVisualEffectView>({
  name: 'GlassButtonBackground',
  layout: {
    sizing: 'fill',
    defaultSize: { width: 230, height: 70 },
  },
  create() {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const effect = UIBlurEffect.effectWithStyle(
      UIBlurEffectStyle.SystemThinMaterialDark,
    );
    const view = UIVisualEffectView.alloc().initWithEffect(effect);
    view.userInteractionEnabled = false;
    view.layer.borderColor = UIColor.colorWithWhiteAlpha(1, 0.2).CGColor;
    view.layer.borderWidth = 1;
    view.layer.cornerRadius = 32;
    view.layer.masksToBounds = true;

    return view;
  },
});
