import { StyleSheet } from 'react-native';
import { NativeTabBarAccessoryButton } from '../utils/native-tabs';
import { notification, selectionChanged } from '../utils/haptics';
import { openAppleWalletAddPassFlow } from '../utils/passkit';
import { nativeScriptRNDemoPassBase64 } from '../assets/demo-pass/NativeScriptRN.pkpass';

export function WalletAddPassAccessory() {
  async function handleOpenWallet() {
    try {
      await selectionChanged().catch(() => {});
      await openAppleWalletAddPassFlow({
        base64PassData: nativeScriptRNDemoPassBase64,
      });
    } catch (error) {
      await notification('error').catch(() => {});
      console.log(error);
    }
  }

  return (
    <NativeTabBarAccessoryButton
      systemImage="plus.circle.fill"
      title="Add Pass"
      onPress={handleOpenWallet}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
  },
});
