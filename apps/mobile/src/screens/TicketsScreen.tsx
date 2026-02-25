import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme";

export function TicketsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
      </View>
      <View style={styles.empty}>
        <Ionicons name="ticket-outline" size={48} color={colors.text.dim} />
        <Text style={styles.emptyTitle}>No Tickets Yet</Text>
        <Text style={styles.emptyText}>
          Your purchased tickets will appear here
        </Text>
      </View>
    </SafeAreaView>
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
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: 80,
  },
  emptyTitle: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 14,
  },
});
