import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../lib/api";
import type { TicketResponse } from "@fatsoma/shared";
import { colors, spacing, radius } from "../theme";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  listed: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
  transferred: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6" },
  used: { bg: "rgba(113,113,122,0.12)", text: "#71717a" },
  cancelled: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
};

export function TicketsScreen() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [resaleTicket, setResaleTicket] = useState<TicketResponse | null>(null);
  const [askingPrice, setAskingPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await apiClient.getMyTickets();
      if (res.ok && res.data) setTickets(res.data);
    } catch {
      Alert.alert("Error", "Failed to load tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTickets();
    else setLoading(false);
  }, [user, fetchTickets]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleListForResale = async () => {
    if (!resaleTicket) return;
    const price = parseFloat(askingPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price");
      return;
    }
    if (price > resaleTicket.currentBatchPrice) {
      Alert.alert("Price Too High", `Maximum price is £${resaleTicket.currentBatchPrice.toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.listTicketForResale({ ticketId: resaleTicket.id, askingPrice: price });
      setResaleTicket(null);
      setAskingPrice("");
      fetchTickets();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to list ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelListing = async (ticket: TicketResponse) => {
    Alert.alert("Cancel Listing", "Are you sure you want to cancel this listing?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            const listings = await apiClient.getResaleListings(ticket.eventId);
            const myListing = listings.data?.find(
              (l) => l.ticketId === ticket.id && l.sellerId === user?.id,
            );
            if (!myListing) return;
            await apiClient.cancelResaleListing(myListing.id);
            fetchTickets();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to cancel listing");
          }
        },
      },
    ]);
  };

  const renderTicket = ({ item }: { item: TicketResponse }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.active;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.eventName} numberOfLines={1}>
            {item.eventName}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="pricetag-outline" size={14} color={colors.text.muted} />
            <Text style={styles.metaText}>{item.ticketBatchName}</Text>
          </View>
          {item.eventDate && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
              <Text style={styles.metaText}>
                {new Date(item.eventDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}
          {item.venueName && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.text.muted} />
              <Text style={styles.metaText}>
                {item.venueName}{item.city ? `, ${item.city}` : ""}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Paid</Text>
          <Text style={styles.priceValue}>£{item.purchasePrice.toFixed(2)}</Text>
        </View>

        <View style={styles.cardActions}>
          <View style={styles.qrBox}>
            <Ionicons name="qr-code-outline" size={28} color={colors.text.dim} />
          </View>

          {item.status === "active" && item.allowResale && (
            <TouchableOpacity
              style={styles.resaleBtn}
              onPress={() => {
                setResaleTicket(item);
                setAskingPrice(String(item.purchasePrice));
              }}
            >
              <Ionicons name="swap-horizontal" size={16} color="#f59e0b" />
              <Text style={styles.resaleBtnText}>List for Resale</Text>
            </TouchableOpacity>
          )}

          {item.status === "listed" && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelListing(item)}
            >
              <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.cancelBtnText}>Cancel Listing</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.purple.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
        <Text style={styles.subtitle}>
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {tickets.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="ticket-outline" size={48} color={colors.text.dim} />
          <Text style={styles.emptyTitle}>No Tickets Yet</Text>
          <Text style={styles.emptyText}>
            Your purchased tickets will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.purple.DEFAULT}
            />
          }
        />
      )}

      {/* Resale Modal */}
      <Modal visible={!!resaleTicket} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>List for Resale</Text>
              <TouchableOpacity onPress={() => setResaleTicket(null)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {resaleTicket && (
              <>
                <Text style={styles.modalSubtitle}>
                  {resaleTicket.eventName} — {resaleTicket.ticketBatchName}
                </Text>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Your purchase price</Text>
                  <Text style={styles.modalInfoValue}>
                    £{resaleTicket.purchasePrice.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Max resale price</Text>
                  <Text style={[styles.modalInfoValue, { color: "#f59e0b" }]}>
                    £{resaleTicket.currentBatchPrice.toFixed(2)}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Asking Price (£)</Text>
                <TextInput
                  style={styles.input}
                  value={askingPrice}
                  onChangeText={setAskingPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.text.dim}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setResaleTicket(null)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, submitting && { opacity: 0.5 }]}
                    onPress={handleListForResale}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalSubmitText}>
                        List for £{parseFloat(askingPrice || "0").toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  subtitle: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
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
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  eventName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  cardMeta: { gap: 6, marginBottom: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: colors.text.muted },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    marginBottom: spacing.sm,
  },
  priceLabel: { fontSize: 13, color: colors.text.muted },
  priceValue: { fontSize: 16, fontWeight: "700", color: colors.text.primary },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  qrBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
  },
  resaleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  resaleBtnText: { fontSize: 13, fontWeight: "600", color: "#f59e0b" },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: "#ef4444" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalInfoLabel: { fontSize: 14, color: colors.text.muted },
  modalInfoValue: { fontSize: 14, fontWeight: "600", color: colors.text.primary },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 14, fontWeight: "600", color: colors.text.muted },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: "#d97706",
    alignItems: "center",
  },
  modalSubmitText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
