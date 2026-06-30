export const cacheDirectory = "/cache/";
export const EncodingType = { Base64: "base64" };
export const documentDirectory = "/docs/";
export const writeAsStringAsync = jest.fn(async () => {});
export const readAsStringAsync = jest.fn(async () => "");
export const downloadAsync = jest.fn(async (url: string, uri: string) => ({ uri }));
export const getInfoAsync = jest.fn(async () => ({ exists: true, size: 0 }));
export const deleteAsync = jest.fn(async () => {});
