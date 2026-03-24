import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../lib/api";
import type { OrderResponse } from "@fatsoma/api-client";
import { colors, spacing, radius } from "../theme";

const PAGE_SIZE = 10;

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiClient.getMyOrders();
      if (res.ok && res.data) setOrders(res.data);
    } catch {
      // silently fail — profile still works without orders
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchOrders();
    else setLoadingOrders(false);
  }, [user, fetchOrders]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const totalSpent = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const paginatedOrders = orders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.orb1} pointerEvents="none" />
        <View style={styles.orb2} pointerEvents="none" />

        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.body}>
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

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {orders.filter((o) => o.status === "paid").length}
              </Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>£{totalSpent.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: user.isActive ? "#34d399" : "#ef4444" },
                ]}
              />
              <Text style={styles.statLabel}>
                {user.isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>

          {/* Purchase History */}
          <View style={styles.sectionHeader}>
            <Ionicons
              name="receipt-outline"
              size={18}
              color={colors.gold.DEFAULT}
            />
            <Text style={styles.sectionTitle}>Purchase History</Text>
            <Text style={styles.sectionCount}>{orders.length}</Text>
          </View>

          {loadingOrders && (
            <ActivityIndicator
              size="small"
              color={colors.gold.DEFAULT}
              style={{ marginVertical: spacing.lg }}
            />
          )}

          {!loadingOrders && orders.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="bag-outline" size={32} color={colors.text.dim} />
              <Text style={styles.emptyText}>No purchases yet</Text>
              <Text style={styles.emptySubtext}>
                Your booking history will appear here.
              </Text>
            </View>
          )}
        </View>

        {/* Order cards */}
        {!loadingOrders &&
          paginatedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}

        {/* Pagination */}
        {orders.length > PAGE_SIZE && (
          <View style={[styles.body, styles.pagination]}>
            <Pressable
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={[
                styles.pageBtn,
                currentPage === 1 && styles.pageBtnDisabled,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={
                  currentPage === 1 ? colors.text.dim : colors.text.primary
                }
              />
            </Pressable>
            <Text style={styles.pageText}>
              {currentPage} / {totalPages}
            </Text>
            <Pressable
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={[
                styles.pageBtn,
                currentPage === totalPages && styles.pageBtnDisabled,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={
                  currentPage === totalPages
                    ? colors.text.dim
                    : colors.text.primary
                }
              />
            </Pressable>
          </View>
        )}

        {/* Logout */}
        <View style={styles.body}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={colors.status.error}
            />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderCard({ order }: { order: OrderResponse }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const statusColor =
    order.status === "paid"
      ? colors.status.success
      : order.status === "pending"
        ? colors.status.warning
        : colors.status.error;

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderEvent} numberOfLines={1}>
            {order.eventName}
          </Text>
          <Text style={styles.orderMeta}>
            {order.ticketBatchName} · ×{order.quantity} · {date}
          </Text>
        </View>
        <View
          style={[
            styles.orderStatusBadge,
            { backgroundColor: statusColor + "20" },
          ]}
        >
          <Text style={[styles.orderStatusText, { color: statusColor }]}>
            {order.status}
          </Text>
        </View>
      </View>
      <View style={styles.orderBottom}>
        <Text style={styles.orderType}>
          {order.type === "resale" ? "Resale" : "Primary"}
        </Text>
        <Text style={styles.orderAmount}>£{order.totalAmount.toFixed(2)}</Text>
      </View>
    </View>
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
      <Ionicons name={icon} size={18} color={colors.gold.light} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  orb1: {
    position: "absolute",
    top: -100,
    left: "25%",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(201,169,110,0.15)",
  },
  orb2: {
    position: "absolute",
    right: 0,
    top: 80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(232,213,163,0.15)",
  },
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
  body: { paddingHorizontal: spacing.lg },
  avatarContainer: { alignItems: "center", marginBottom: spacing.xxl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gold.DEFAULT,
    marginBottom: spacing.md,
  },
  initials: { fontSize: 28, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "700", color: colors.text.primary },
  email: { fontSize: 13, color: colors.text.muted, marginTop: 2 },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.gold.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  roleText: {
    color: colors.gold.light,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
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
  rowValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "500",
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.DEFAULT,
    marginVertical: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.gold.DEFAULT,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  emptyCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.text.dim,
    marginTop: 4,
  },
  orderCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  orderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  orderEvent: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  orderMeta: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 3,
  },
  orderStatusBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  orderType: {
    fontSize: 11,
    color: colors.text.dim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gold.DEFAULT,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  pageText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  logoutText: { fontSize: 14, fontWeight: "600", color: colors.status.error },
});
