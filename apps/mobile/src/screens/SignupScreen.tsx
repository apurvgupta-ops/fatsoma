"use client";

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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, radius } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export function SignupScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
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
      await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.blurOrbs}>
        <View style={[styles.orb, styles.orbTop]} />
        <View style={[styles.orb, styles.orbBottom]} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="checkmark" size={22} color={colors.gold.DEFAULT} />
            </View>
            <Text style={styles.brandTitle}>On The List</Text>
          </View>

          <Text style={styles.heading}>Create an account</Text>
          <Text style={styles.subheading}>Join to discover and book events</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={colors.text.dim}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.text.dim}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.text.dim}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.text.dim} />
            </Pressable>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat your password"
            placeholderTextColor={colors.text.dim}
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Pressable style={styles.gradientBtn} onPress={handleSignup} disabled={loading}>
            <LinearGradient
              colors={[colors.gold.DEFAULT, colors.gold.light]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientInner}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.replace("Login")}>
              <Text style={styles.switchLink}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  flex: { flex: 1 },
  blurOrbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  orb: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.5,
  },
  orbTop: {
    top: -120,
    left: "20%",
    backgroundColor: colors.gold.DEFAULT,
  },
  orbBottom: {
    bottom: -100,
    right: "10%",
    backgroundColor: colors.gold.light,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold.border,
    backgroundColor: colors.gold.dim,
    justifyContent: "center",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.text.primary,
    letterSpacing: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.text.primary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.text.primary,
  },
  eyeBtn: { paddingRight: spacing.lg },
  gradientBtn: {
    marginTop: spacing.xxl,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  gradientInner: {
    paddingVertical: 15,
    alignItems: "center",
  },
  btnText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  switchText: { fontSize: 13, color: colors.text.muted },
  switchLink: { fontSize: 13, fontWeight: "600", color: colors.gold.light },
});
