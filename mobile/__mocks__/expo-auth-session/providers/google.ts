export const useIdTokenAuthRequest = jest.fn(() => [
  { type: "success", params: { id_token: "mock-google-id-token" } },
  null,
  jest.fn().mockResolvedValue(undefined),
]);

export const GoogleAuthProvider = {};
