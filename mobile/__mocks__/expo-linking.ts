export const createURL = jest.fn((path) => `exp://test/${path}`);
export const resolveScheme = jest.fn(() => "exp");
export const addEventListener = jest.fn(() => ({ remove: jest.fn() }));
export const removeEventListener = jest.fn();
export const openURL = jest.fn();
export const canOpenURL = jest.fn(async () => true);
export default { createURL, resolveScheme, addEventListener, removeEventListener, openURL, canOpenURL };
