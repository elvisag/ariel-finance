const mockImageLoader = {
  prefetchImage: jest.fn(),
  getSize: jest.fn((uri, success) => process.nextTick(() => success(320, 240))),
};

const NativeModules = {
  ImageLoader: mockImageLoader,
  ImageViewManager: mockImageLoader,
  LinkingManager: {},
  Linking: {},
};

module.exports = { default: NativeModules };
