const NativeModules = {};
const mockImageLoader = {
  prefetchImage: jest.fn(),
  getSize: jest.fn((uri, success) => process.nextTick(() => success(320, 240))),
};
NativeModules.ImageLoader = mockImageLoader;
NativeModules.ImageViewManager = mockImageLoader;
NativeModules.LinkingManager = {};
NativeModules.Linking = {};
module.exports = { default: NativeModules };
