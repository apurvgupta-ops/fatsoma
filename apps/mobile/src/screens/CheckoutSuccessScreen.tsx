import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/Ionicons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { apiClient } from "../lib/api";
import { colors, spacing, radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "CheckoutSuccess">;

export function CheckoutSuccessScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<{
    eventName: string;
    ticketBatchName: string;
    quantity: number;
    totalAmount: number;
    status: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const confirm = async () => {
      try {
        const res = await apiClient.confirmCheckoutSession(sessionId);
        if (res.data) {
          setOrder(res.data);
        }
      } catch (err: unknown) {
        try {
          const res = await apiClient.getCheckoutSession(sessionId);
          if (res.data) setOrder(res.data);
          else setError("Could not load order details.");
        } catch {
          setError("Could not load order details.");
        }
      } finally {
        setLoading(false);
      }
    };
    confirm();
  }, [sessionId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gold.DEFAULT} />
          <Text style={styles.loadingText}>Confirming your payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.status.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.primaryBtnText}>Go Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.orb1} pointerEvents="none" />
      <View style={styles.orb2} pointerEvents="none" />

      <View style={styles.centered}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>

        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your tickets are ready</Text>

        {order && (
          <View style={styles.card}>
            <Text style={styles.eventName}>{order.eventName}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ticket</Text>
              <Text style={styles.detailValue}>{order.ticketBatchName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>{order.quantity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Paid</Text>
              <Text style={styles.detailValueGold}>
                £{order.totalAmount.toFixed(2)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                order.status === "paid"
                  ? styles.statusPaid
                  : styles.statusPending,
              ]}
            >
              <Text style={styles.statusText}>
                {order.status === "paid" ? "Payment Confirmed" : order.status}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() =>
              navigation.navigate("Main", { screen: "TicketsTab" } as any)
            }
          >
            <Ionicons name="ticket-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>View My Tickets</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.secondaryBtnText}>Browse More Events</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
    top: 200,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(232,213,163,0.15)",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    color: colors.text.muted,
    fontSize: 14,
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: "center",
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#34d399",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 4,
    marginBottom: spacing.xxl,
  },
  card: {
    width: "100%",
    backgroundColor: colors.bg.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginBottom: spacing.xxl,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.text.muted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
  },
  detailValueGold: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.gold.DEFAULT,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: spacing.md,
  },
  statusPaid: {
    backgroundColor: "rgba(52,211,153,0.15)",
  },
  statusPending: {
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#34d399",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actions: {
    width: "100%",
    gap: spacing.md,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.gold.DEFAULT,
    borderRadius: radius.lg,
    paddingVertical: 15,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    paddingVertical: 15,
  },
  secondaryBtnText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
});
