const React = require("react");

function createHostComponent(name) {
  const Comp = React.forwardRef(({ children, style, ...props }, ref) => {
    return React.createElement(name, { ...props, ref, style }, children);
  });
  Comp.displayName = name;
  return Comp;
}

const ReactNative = {
  StyleSheet: { create: () => ({}), flatten: (style) => style },
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Image: "Image",
  ScrollView: "ScrollView",
  SafeAreaView: "SafeAreaView",
  Modal: "Modal",
  ActivityIndicator: "ActivityIndicator",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  StatusBar: "StatusBar",
  RefreshControl: "RefreshControl",
  Switch: "Switch",

  TouchableOpacity: React.forwardRef(({ onPress, disabled, children, style, ...props }, ref) => {
    const handlePress = (...args) => { if (!disabled && onPress) onPress(...args); };
    return React.createElement("View", { ...props, ref, onPress: handlePress, style }, children);
  }),
  FlatList: createHostComponent("View"),
  TouchableHighlight: React.forwardRef(({ onPress, disabled, children, style, ...props }, ref) => {
    const handlePress = (...args) => { if (!disabled && onPress) onPress(...args); };
    return React.createElement("View", { ...props, ref, onPress: handlePress, style }, children);
  }),
  TouchableWithoutFeedback: React.forwardRef(({ onPress, disabled, children, ...props }, ref) => {
    const handlePress = (...args) => { if (!disabled && onPress) onPress(...args); };
    return React.createElement("View", { ...props, ref, onPress: handlePress }, children);
  }),
  Pressable: React.forwardRef(({ onPress, disabled, children, style, ...props }, ref) => {
    const handlePress = (...args) => { if (!disabled && onPress) onPress(...args); };
    return React.createElement("View", { ...props, ref, onPress: handlePress, style }, children);
  }),
  Animated: { View: "View", Text: "Text", FlatList: createHostComponent("View") },

  Alert: { alert: jest.fn() },
  Platform: { OS: "ios", select: (obj) => obj.ios || obj.default },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  PixelRatio: { get: () => 2 },
  useColorScheme: jest.fn(() => "light"),
  Appearance: { addChangeListener: jest.fn(), removeChangeListener: jest.fn() },
  I18nManager: { isRTL: false },
  NativeModules: {},
  Linking: { addEventListener: jest.fn(), removeEventListener: jest.fn(), openURL: jest.fn(), canOpenURL: jest.fn() },
};

module.exports = ReactNative;
