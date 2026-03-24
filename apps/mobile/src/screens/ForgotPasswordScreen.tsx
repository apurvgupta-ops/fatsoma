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

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
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

          {sent ? (
            <View style={styles.sentContainer}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark-circle" size={48} color="#34d399" />
              </View>
              <Text style={styles.heading}>Check your email</Text>
              <Text style={styles.subheading}>
                If an account exists for{" "}
                <Text style={styles.emailHighlight}>{email}</Text>, we've sent a
                password reset link.
              </Text>
              <Pressable
                style={styles.backLink}
                onPress={() => navigation.navigate("Login")}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={colors.gold.light}
                />
                <Text style={styles.backLinkText}>Back to login</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.heading}>Forgot password?</Text>
              <Text style={styles.subheading}>
                Enter your email and we'll send you a reset link
              </Text>

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.text.dim}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text.dim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <Pressable
                style={[styles.btnWrapper, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
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
                    <Text style={styles.btnText}>Send Reset Link</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <View style={styles.switchRow}>
                <Pressable onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.switchLink}>Back to login</Text>
                </Pressable>
              </View>
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
  checkCircle: {
    marginBottom: spacing.lg,
  },
  emailHighlight: {
    fontWeight: "600",
    color: colors.text.secondary,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gold.light,
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  switchLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.gold.light,
  },
});
