import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { colors } from "./src/theme";

const DarkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.gold.DEFAULT,
    background: colors.bg.primary,
    card: colors.bg.secondary,
    text: colors.text.primary,
    border: colors.border.DEFAULT,
    notification: colors.gold.DEFAULT,
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={DarkNavTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
