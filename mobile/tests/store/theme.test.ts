import { useThemeStore, useEffectiveTheme, THEME_VARIABLES } from "../../store/theme";

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  useColorScheme: jest.fn(() => "light"),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("theme.ts — Theme store", () => {
  beforeEach(() => {
    useThemeStore.setState({ preference: "system" });
  });

  it("starts with system preference", () => {
    expect(useThemeStore.getState().preference).toBe("system");
  });

  it("setPreference changes the preference", () => {
    useThemeStore.getState().setPreference("dark");
    expect(useThemeStore.getState().preference).toBe("dark");

    useThemeStore.getState().setPreference("light");
    expect(useThemeStore.getState().preference).toBe("light");

    useThemeStore.getState().setPreference("system");
    expect(useThemeStore.getState().preference).toBe("system");
  });

  it("useEffectiveTheme returns light when system is light", () => {
    const { useColorScheme } = require("react-native");
    useColorScheme.mockReturnValue("light");
    expect(useEffectiveTheme()).toBe("light");
  });

  it("useEffectiveTheme returns dark when preference is dark", () => {
    useThemeStore.getState().setPreference("dark");
    expect(useEffectiveTheme()).toBe("dark");
  });

  it("useEffectiveTheme returns light when preference is light", () => {
    useThemeStore.getState().setPreference("light");
    expect(useEffectiveTheme()).toBe("light");
  });
});

describe("theme.ts — CSS variables", () => {
  it("dark theme has all required keys", () => {
    const keys = Object.keys(THEME_VARIABLES.dark);
    expect(keys).toContain("--color-bg");
    expect(keys).toContain("--color-bg-surface");
    expect(keys).toContain("--color-text-primary");
    expect(keys).toContain("--color-text-secondary");
    expect(keys).toContain("--color-border");
  });

  it("light theme has all required keys", () => {
    const keys = Object.keys(THEME_VARIABLES.light);
    expect(keys).toContain("--color-bg");
    expect(keys).toContain("--color-bg-surface");
    expect(keys).toContain("--color-text-primary");
    expect(keys).toContain("--color-border");
  });

  it("dark and light themes have the same keys", () => {
    expect(Object.keys(THEME_VARIABLES.dark).sort()).toEqual(
      Object.keys(THEME_VARIABLES.light).sort()
    );
  });
});
