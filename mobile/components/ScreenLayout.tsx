import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

interface ScreenLayoutProps {
  children: ReactNode;
  className?: string;
  safeArea?: boolean;
}

export default function ScreenLayout({ children, className = "", safeArea = true }: ScreenLayoutProps) {
  const Container = safeArea ? SafeAreaView : View;
  return (
    <Container className={`flex-1 bg-bg ${className}`}>
      {children}
    </Container>
  );
}
