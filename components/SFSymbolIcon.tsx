import NativeScript, { defineUIKitView } from '@nativescript/react-native';

type SFSymbolIconProps = {
  pointSize?: number;
  systemImage: string;
};

const nativeScriptReady = NativeScript.init();

export const SFSymbolIcon = defineUIKitView<SFSymbolIconProps, UIImageView>({
  name: 'SFSymbolIcon',
  layout: {
    sizing: 'fill',
    defaultSize: { width: 72, height: 72 },
  },
  create() {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const imageView = UIImageView.alloc().initWithFrame(CGRectZero);
    imageView.contentMode = UIViewContentMode.ScaleAspectFit;
    imageView.tintColor = UIColor.secondaryLabelColor;
    imageView.userInteractionEnabled = false;
    return imageView;
  },
  update(imageView, props) {
    const configuration = UIImageSymbolConfiguration.configurationWithPointSizeWeight(
      props.pointSize ?? 56,
      UIImageSymbolWeight.Semibold,
    );
    imageView.preferredSymbolConfiguration = configuration;
    imageView.image = UIImage.systemImageNamed(props.systemImage);
  },
});
