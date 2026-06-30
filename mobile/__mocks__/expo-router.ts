import React from "react";
export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};
export const Stack = {
  Screen: (props: any) => React.createElement("View", props),
};
export const Tabs = {
  Screen: (props: any) => React.createElement("View", props),
};
export const useRouter = jest.fn(() => router);
export const useLocalSearchParams = jest.fn(() => ({}));
export const useSegments = jest.fn(() => []);
export const Redirect = (props: any) => React.createElement("View", props);
export const Link = (props: any) => React.createElement("View", props);
export default { useRouter, useLocalSearchParams, Stack, Tabs, Redirect, Link };
