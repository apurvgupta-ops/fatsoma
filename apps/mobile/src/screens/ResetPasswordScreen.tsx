import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { apiClient } from "../lib/api";
import { colors, spacing, radius } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!password.trim()) {
      Alert.alert("Missing Password", "Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.resetPassword(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error
          ? err.message
          : "Failed to reset password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[styles.orb, styles.orbGold, styles.orbTop]}
          pointerEvents="none"
        />
        <View
          style={[styles.orb, styles.orbGoldLight, styles.orbBottom]}
          pointerEvents="none"
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons
                name="checkmark"
                size={22}
                color={colors.gold.DEFAULT}
              />
            </View>
            <Text style={styles.brandTitle}>On The List</Text>
          </View>

          {success ? (
            <View style={styles.sentContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#34d399" />
              <Text style={styles.heading}>Password Reset</Text>
              <Text style={styles.subheading}>
                Your password has been reset successfully. You can now sign in
                with your new password.
              </Text>
              <Pressable
                style={styles.backLink}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.backLinkText}>Go to Login</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.heading}>Reset Password</Text>
              <Text style={styles.subheading}>
                Enter your new password below
              </Text>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.text.dim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text.dim}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.text.dim}
                  />
                </Pressable>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.text.dim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text.dim}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <Pressable
                style={[styles.btnWrapper, loading && { opacity: 0.6 }]}
                onPress={handleReset}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.gold.DEFAULT, colors.gold.light]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btn}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.cream} />
                  ) : (
                    <Text style={styles.btnText}>Reset Password</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  flex: { flex: 1 },
  orb: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.15,
  },
  orbGold: { backgroundColor: colors.gold.DEFAULT },
  orbGoldLight: { backgroundColor: colors.gold.light },
  orbTop: { top: -120, left: "20%" },
  orbBottom: { bottom: 80, right: "10%" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    alignSelf: "center",
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.gold.dim,
    borderWidth: 1,
    borderColor: colors.gold.border,
    justifyContent: "center",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.cream,
    letterSpacing: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.cream,
    textAlign: "center",
    marginBottom: 4,
    marginTop: spacing.lg,
  },
  subheading: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  sentContainer: {
    alignItems: "center",
  },
  backLink: {
    marginTop: spacing.xl,
    backgroundColor: colors.gold.DEFAULT,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cream,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.input,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  inputIcon: { paddingLeft: spacing.md },
  input: {
    flex: 1,
    color: colors.cream,
    fontSize: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  eyeBtn: { paddingRight: spacing.md, paddingVertical: 14 },
  btnWrapper: { marginTop: spacing.xxl },
  btn: {
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: "700",
  },
});
