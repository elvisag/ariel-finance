import { render, fireEvent } from "@testing-library/react-native";
import Button from "../../components/Button";

describe("Button component", () => {
  it("renders title text", async () => {
    const { getByText } = await render(<Button title="Hola" onPress={() => {}} />);
    expect(getByText("Hola")).toBeDefined();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Click" onPress={onPress} />);
    fireEvent.press(getByText("Click"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Button title="Click" onPress={onPress} disabled />
    );
    fireEvent.press(getByText("Click"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not call onPress when loading", async () => {
    const onPress = jest.fn();
    const { queryByText } = await render(
      <Button title="Click" onPress={onPress} loading />
    );
    expect(queryByText("Click")).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it("applies different variant classes", async () => {
    const { getByText } = await render(
      <Button title="Danger" onPress={() => {}} variant="danger" />
    );
    expect(getByText("Danger")).toBeDefined();
  });

  it("applies different size classes", async () => {
    const { getByText } = await render(
      <Button title="Small" onPress={() => {}} size="sm" />
    );
    expect(getByText("Small")).toBeDefined();
  });
});
