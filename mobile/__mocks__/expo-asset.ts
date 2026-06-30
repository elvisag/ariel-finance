export class Asset {
  static fromModule = jest.fn(() => ({ uri: "mock://asset" }));
  static fromURI = jest.fn(() => ({ uri: "mock://asset" }));
  downloadAsync = jest.fn();
}
export default { Asset };
