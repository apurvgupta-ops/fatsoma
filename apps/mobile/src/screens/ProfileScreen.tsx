import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, radius } from "../theme";

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.body}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.card}>
          <ProfileRow icon="person-outline" label="Name" value={user.name} />
          <View style={styles.divider} />
          <ProfileRow icon="mail-outline" label="Email" value={user.email} />
          <View style={styles.divider} />
          <ProfileRow icon="shield-outline" label="Role" value={user.role} />
          <View style={styles.divider} />
          <ProfileRow
            icon="calendar-outline"
            label="Member since"
            value={new Date(user.createdAt).toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            })}
          />
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.status.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.purple.light} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.purple.DEFAULT,
    marginBottom: spacing.md,
  },
  initials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
  },
  email: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.purple.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  roleText: {
    color: colors.purple.light,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, color: colors.text.dim },
  rowValue: { fontSize: 14, color: colors.text.primary, fontWeight: "500", marginTop: 1 },
  divider: {
    height: 1,
    backgroundColor: colors.border.DEFAULT,
    marginVertical: spacing.xs,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.status.error,
  },
});
