import NativeScript, { defineUIKitView } from '@nativescript/react-native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';
import { demoPass } from '../utils/demo-pass';
import {
  NativeMetalPassShine,
  PASS_SHINE_WIDTH,
} from './MetalPassShine';

type WalletPassView = UIView & {
  nativeCardView?: UIView;
};

const nativeScriptReady = NativeScript.init();
const CARD_WIDTH = 358;
const CARD_HEIGHT = 414;
const CONTENT_INSET = 20;
const AnimatedView = Animated.View;

export function DemoPassCard() {
  const tilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const gyroTilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const frame = useRef<number | null>(null);
  const pendingTilt = useRef({ x: 0, y: 0 });

  const resetTilt = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }

    Animated.spring(tilt, {
      friction: 7,
      tension: 70,
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  }, [tilt]);

  const setTiltFromGesture = useCallback(
    (dx: number, dy: number) => {
      pendingTilt.current = {
        x: clamp(dx, -120, 120),
        y: clamp(dy, -120, 120),
      };

      if (frame.current !== null) {
        return;
      }

      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        tilt.setValue(pendingTilt.current);
      });
    },
    [tilt],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderMove: (_, gesture) => {
          setTiltFromGesture(gesture.dx, gesture.dy);
        },
        onPanResponderRelease: resetTilt,
        onPanResponderTerminate: resetTilt,
      }),
    [resetTilt, setTiltFromGesture],
  );

  useEffect(
    () => () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!nativeScriptReady || typeof CMMotionManager === 'undefined') {
      return;
    }

    const motionManager = CMMotionManager.alloc().init();
    if (!motionManager.deviceMotionAvailable) {
      return;
    }

    motionManager.deviceMotionUpdateInterval = 1 / 24;
    motionManager.startDeviceMotionUpdates();

    const current = { x: 0, y: 0 };
    let animationFrame: number | null = null;

    const updateGyroTilt = () => {
      const attitude = motionManager.deviceMotion?.attitude;
      const target = attitude
        ? {
            x: clamp(attitude.roll * 96, -74, 74),
            y: clamp(-attitude.pitch * 82, -64, 64),
          }
        : { x: 0, y: 0 };

      current.x += (target.x - current.x) * 0.16;
      current.y += (target.y - current.y) * 0.16;

      if (Math.abs(target.x - current.x) < 0.01) {
        current.x = target.x;
      }
      if (Math.abs(target.y - current.y) < 0.01) {
        current.y = target.y;
      }

      gyroTilt.setValue(current);
      animationFrame = requestAnimationFrame(updateGyroTilt);
    };

    updateGyroTilt();

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      motionManager.stopDeviceMotionUpdates();
      gyroTilt.setValue({ x: 0, y: 0 });
    };
  }, [gyroTilt]);

  const combinedX = Animated.add(tilt.x, gyroTilt.x);
  const combinedY = Animated.add(tilt.y, gyroTilt.y);

  const cardStyle = {
    transform: [
      { perspective: 900 },
      {
        rotateX: combinedY.interpolate({
          inputRange: [-184, 184],
          outputRange: ['12deg', '-12deg'],
          extrapolate: 'clamp',
        }),
      },
      {
        rotateY: combinedX.interpolate({
          inputRange: [-194, 194],
          outputRange: ['-14deg', '14deg'],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const primaryShineStyle = {
    opacity: combinedX.interpolate({
      inputRange: [-160, 0, 160],
      outputRange: [0.4, 0.62, 0.9],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateX: combinedX.interpolate({
          inputRange: [-194, 194],
          outputRange: [-214, 216],
          extrapolate: 'clamp',
        }),
      },
      {
        translateY: combinedY.interpolate({
          inputRange: [-184, 184],
          outputRange: [-70, 72],
          extrapolate: 'clamp',
        }),
      },
      {
        rotateZ: combinedX.interpolate({
          inputRange: [-194, 194],
          outputRange: ['-34deg', '-7deg'],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const bloomStyle = {
    opacity: combinedY.interpolate({
      inputRange: [-150, 0, 150],
      outputRange: [0.56, 0.28, 0.48],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateX: combinedX.interpolate({
          inputRange: [-194, 194],
          outputRange: [92, -58],
          extrapolate: 'clamp',
        }),
      },
      {
        translateY: combinedY.interpolate({
          inputRange: [-184, 184],
          outputRange: [42, -48],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  return (
    <AnimatedView
      {...panResponder.panHandlers}
      style={[styles.nativePass, cardStyle]}
    >
      <NativeWalletPassCard
        pointerEvents="none"
        style={styles.nativePassFill}
      />
      <AnimatedView pointerEvents="none" style={[styles.shineBloom, bloomStyle]} />
      <AnimatedView
        pointerEvents="none"
        style={[styles.shineBeam, primaryShineStyle]}
      >
        <NativeMetalPassShine pointerEvents="none" style={styles.shineBeamFill} />
      </AnimatedView>
    </AnimatedView>
  );
}

const NativeWalletPassCard = defineUIKitView<{}, WalletPassView>({
  name: 'NativeWalletPassCard',
  layout: {
    sizing: 'fill',
    defaultSize: { width: CARD_WIDTH, height: CARD_HEIGHT },
  },
  create() {
    if (!nativeScriptReady) {
      throw new Error('NativeScript Native API is not ready.');
    }

    const rootView = UIView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: CARD_WIDTH, height: CARD_HEIGHT },
    }) as WalletPassView;
    rootView.backgroundColor = UIColor.clearColor;
    rootView.userInteractionEnabled = false;

    const cardView = UIView.alloc().initWithFrame(rootView.bounds);
    cardView.backgroundColor = color(23, 25, 35, 1);
    cardView.layer.borderColor = color(255, 255, 255, 0.14).CGColor;
    cardView.layer.borderWidth = 1;
    cardView.layer.cornerRadius = 18;
    cardView.layer.masksToBounds = true;
    cardView.layer.shadowColor = UIColor.blackColor.CGColor;
    cardView.layer.shadowOpacity = 0.32;
    cardView.layer.shadowOffset = { width: 0, height: 18 };
    cardView.layer.shadowRadius = 26;
    cardView.layer.allowsEdgeAntialiasing = true;
    cardView.userInteractionEnabled = false;
    cardView.autoresizingMask =
      UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
    rootView.addSubview(cardView);

    addMetalBand(cardView, -32, 10, CARD_WIDTH + 64, 68, color(255, 255, 255, 0.08));
    addMetalBand(cardView, -32, 132, CARD_WIDTH + 64, 92, color(112, 130, 155, 0.16));
    addMetalBand(cardView, -32, 318, CARD_WIDTH + 64, 78, color(255, 255, 255, 0.06));

    addHeader(cardView);
    addPrimary(cardView);
    addFields(cardView);
    addQrPanel(cardView);

    rootView.nativeCardView = cardView;
    rootView.accessibilityLabel = 'NativeScript App.js Pass';

    return rootView;
  },
  dispose(view) {
    view.nativeCardView = undefined;
  },
});

function addHeader(cardView: UIView) {
  const icon = UIImageView.alloc().initWithImage(UIImage.systemImageNamed('wallet.pass'));
  icon.frame = frame(CONTENT_INSET, 21, 34, 30);
  icon.contentMode = UIViewContentMode.ScaleAspectFit;
  icon.tintColor = UIColor.whiteColor;
  cardView.addSubview(icon);

  const logo = label(demoPass.logoText, 18, UIColor.whiteColor, true);
  logo.frame = frame(64, 21, 214, 30);
  cardView.addSubview(logo);

  const badge = label('DEMO', 12, color(203, 213, 225, 1), true);
  badge.textAlignment = NSTextAlignment.Right;
  badge.frame = frame(284, 23, 54, 24);
  cardView.addSubview(badge);
}

function addPrimary(cardView: UIView) {
  const [primary] = demoPass.storeCard.primaryFields;
  const labelView = label(primary.label, 11, color(203, 213, 225, 1), true);
  labelView.frame = frame(CONTENT_INSET, 81, 318, 14);
  cardView.addSubview(labelView);

  const valueView = label(primary.value, 24, UIColor.whiteColor, true);
  valueView.frame = frame(CONTENT_INSET, 98, 318, 32);
  cardView.addSubview(valueView);
}

function addFields(cardView: UIView) {
  const [member, level] = demoPass.storeCard.secondaryFields;
  const [stack] = demoPass.storeCard.auxiliaryFields;
  const fields = [member, level, stack];

  fields.forEach((field, index) => {
    const x = CONTENT_INSET + index * 110;
    const labelView = label(field.label.toUpperCase(), 11, color(203, 213, 225, 1), true);
    labelView.frame = frame(x, 148, 96, 14);
    cardView.addSubview(labelView);

    const valueView = label(field.value, 16, UIColor.whiteColor, true);
    valueView.frame = frame(x, 166, 96, 22);
    cardView.addSubview(valueView);
  });
}

function addQrPanel(cardView: UIView) {
  const panel = UIView.alloc().initWithFrame(frame(CONTENT_INSET, 216, 318, 178));
  panel.backgroundColor = UIColor.whiteColor;
  panel.layer.cornerRadius = 10;
  panel.layer.masksToBounds = true;
  panel.userInteractionEnabled = false;
  cardView.addSubview(panel);

  const qrImage = createQrImage(demoPass.barcode.message);
  const qrView = UIImageView.alloc().initWithImage(qrImage);
  qrView.frame = frame(88, 18, 142, 142);
  qrView.contentMode = UIViewContentMode.ScaleAspectFit;
  qrView.accessibilityLabel = `${demoPass.barcode.message} QR code`;
  panel.addSubview(qrView);
}

function addMetalBand(
  view: UIView,
  x: number,
  y: number,
  width: number,
  height: number,
  backgroundColor: UIColor,
) {
  const band = UIView.alloc().initWithFrame(frame(x, y, width, height));
  band.backgroundColor = backgroundColor;
  band.transform = CGAffineTransformMakeRotation(-0.209);
  band.userInteractionEnabled = false;
  view.addSubview(band);
}

function createQrImage(message: string) {
  const filter = CIFilter.filterWithName('CIQRCodeGenerator');
  const data = NSString.stringWithString(message).dataUsingEncoding(
    NSUTF8StringEncoding,
  );
  filter.setValueForKey(data, 'inputMessage');
  filter.setValueForKey('M' as unknown as NSString, 'inputCorrectionLevel');

  const outputImage = filter.outputImage.imageByApplyingTransform(
    CGAffineTransformMakeScale(8, 8),
  );
  return UIImage.imageWithCIImage(outputImage);
}

function label(
  text: string,
  fontSize: number,
  textColor: UIColor,
  bold = false,
) {
  const view = UILabel.alloc().initWithFrame(CGRectZero);
  view.text = text;
  view.textColor = textColor;
  view.font = bold
    ? UIFont.boldSystemFontOfSize(fontSize)
    : UIFont.systemFontOfSize(fontSize);
  view.adjustsFontSizeToFitWidth = true;
  view.minimumScaleFactor = 0.72;
  return view;
}

function color(red: number, green: number, blue: number, alpha: number) {
  return UIColor.colorWithRedGreenBlueAlpha(
    red / 255,
    green / 255,
    blue / 255,
    alpha,
  );
}

function frame(x: number, y: number, width: number, height: number) {
  return {
    origin: { x, y },
    size: { width, height },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  nativePass: {
    alignSelf: 'center',
    borderRadius: 18,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  nativePassFill: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
  },
  shineBeam: {
    bottom: -118,
    left: 18,
    position: 'absolute',
    top: -118,
    width: PASS_SHINE_WIDTH,
  },
  shineBeamFill: {
    flex: 1,
  },
  shineBloom: {
    backgroundColor: 'rgba(164, 199, 255, 0.34)',
    borderRadius: 180,
    height: 360,
    left: -110,
    position: 'absolute',
    shadowColor: '#dbeafe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 46,
    top: -72,
    width: 360,
  },
});
