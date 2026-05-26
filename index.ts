import 'react-native-simdeck/auto';
import { registerRootComponent } from 'expo';
import NativeScript from '@nativescript/react-native';

import App from './App';

NativeScript.init();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
