"use client";

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
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../lib/api";
import type { TicketResponse, ResaleListingResponse } from "@fatsoma/shared";
import { colors, spacing, radius } from "../theme";

type TabId = "active" | "resale" | "sold" | "history";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(52,211,153,0.12)", text: "#34d399" },
  listed: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24" },
  transferred: { bg: "rgba(232,213,163,0.12)", text: colors.gold.light },
  used: { bg: "rgba(42,42,42,0.5)", text: colors.text.muted },
  cancelled: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
};

export function TicketsScreen() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [soldListings, setSoldListings] = useState<ResaleListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("active");

  const [resaleTicket, setResaleTicket] = useState<TicketResponse | null>(null);
  const [askingPrice, setAskingPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showQr, setShowQr] = useState<TicketResponse | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const [ticketRes, listingRes] = await Promise.all([
        apiClient.getMyTickets(),
        apiClient.getMyResaleListings(),
      ]);
      if (ticketRes.ok && ticketRes.data) setTickets(ticketRes.data);
      if (listingRes.ok && listingRes.data)
        setSoldListings(listingRes.data.filter((l) => l.status === "sold"));
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
      Alert.alert(
        "Price Too High",
        `Maximum price is £${resaleTicket.currentBatchPrice.toFixed(2)}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.listTicketForResale({
        ticketId: resaleTicket.id,
        askingPrice: price,
      });
      setResaleTicket(null);
      setAskingPrice("");
      setSuccessMessage("Ticket listed for resale!");
      setTimeout(() => setSuccessMessage(""), 4000);
      fetchTickets();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to list ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelListing = async (ticket: TicketResponse) => {
    Alert.alert(
      "Cancel Listing",
      "Are you sure you want to cancel this listing?",
      [
        { text: "Keep Listed", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const listings = await apiClient.getResaleListings(
                ticket.eventId,
              );
              const myListing = listings.data?.find(
                (l) => l.ticketId === ticket.id && l.sellerId === user?.id,
              );
              if (!myListing) return;
              await apiClient.cancelResaleListing(myListing.id);
              setSuccessMessage("Listing cancelled!");
              setTimeout(() => setSuccessMessage(""), 4000);
              fetchTickets();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to cancel listing");
            }
          },
        },
      ],
    );
  };

  const activeTickets = tickets.filter((t) => t.status === "active");
  const resaleTickets = tickets.filter((t) => t.status === "listed");
  const historyTickets = tickets.filter((t) =>
    ["transferred", "used", "cancelled"].includes(t.status),
  );

  const displayedTickets =
    activeTab === "active"
      ? activeTickets
      : activeTab === "resale"
        ? resaleTickets
        : activeTab === "history"
          ? historyTickets
          : [];

  const renderTicket = ({ item }: { item: TicketResponse }) => {
    const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.active;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(item.qrCode)}`;
    const venue = [item.venueName, item.city].filter(Boolean).join(", ");
    const dateStr = item.eventDate
      ? new Date(item.eventDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.eventName} numberOfLines={1}>
            {item.eventName}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {item.status === "active" ? "Valid" : item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Pressable style={styles.qrContainer} onPress={() => setShowQr(item)}>
            <View style={styles.qrBox}>
              <Image
                source={{ uri: qrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <View style={styles.qrOverlay}>
                <Ionicons name="expand-outline" size={16} color="#fff" />
              </View>
            </View>
            <Text style={styles.qrCode} numberOfLines={1}>
              {item.qrCode.slice(0, 12)}...
            </Text>
          </Pressable>

          <View style={styles.cardDetails}>
            {venue ? <Text style={styles.metaText}>{venue}</Text> : null}
            <Text style={styles.metaText}>
              {dateStr} · {item.ticketBatchName} · £
              {item.purchasePrice.toFixed(2)}
            </Text>

            <View style={styles.cardActions}>
              {item.status === "active" && item.allowResale && (
                <Pressable
                  style={styles.resaleBtn}
                  onPress={() => {
                    setResaleTicket(item);
                    setAskingPrice(String(item.purchasePrice));
                  }}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={14}
                    color={colors.gold.DEFAULT}
                  />
                  <Text style={styles.resaleBtnText}>List for Resale</Text>
                </Pressable>
              )}
              {item.status === "listed" && (
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => handleCancelListing(item)}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={14}
                    color="#ef4444"
                  />
                  <Text style={styles.cancelBtnText}>Cancel Listing</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSoldListing = ({ item }: { item: ResaleListingResponse }) => {
    const soldDate = item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

    const refundLabel =
      item.sellerRefundStatus === "succeeded"
        ? "Refunded"
        : item.sellerRefundStatus === "pending"
          ? "Processing"
          : item.sellerRefundStatus === "failed"
            ? "Refund Failed"
            : "Pending";

    const refundColor =
      item.sellerRefundStatus === "succeeded"
        ? { bg: "rgba(52,211,153,0.12)", text: "#34d399" }
        : item.sellerRefundStatus === "pending"
          ? { bg: "rgba(251,191,36,0.12)", text: "#fbbf24" }
          : item.sellerRefundStatus === "failed"
            ? { bg: "rgba(239,68,68,0.12)", text: "#ef4444" }
            : { bg: "rgba(255,255,255,0.08)", text: colors.text.muted };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.eventName} numberOfLines={1}>
            Event #{item.eventId.slice(-6)}
          </Text>
          <View
            style={[styles.badge, { backgroundColor: "rgba(52,211,153,0.12)" }]}
          >
            <Text style={[styles.badgeText, { color: "#34d399" }]}>Sold</Text>
          </View>
        </View>

        {soldDate ? (
          <Text style={styles.soldDate}>Sold on {soldDate}</Text>
        ) : null}

        <View style={styles.soldGrid}>
          <View style={styles.soldCell}>
            <Text style={styles.soldCellLabel}>Sale Price</Text>
            <Text style={styles.soldCellValue}>
              £{item.askingPrice.toFixed(2)}
            </Text>
          </View>
          <View style={styles.soldCell}>
            <Text style={styles.soldCellLabel}>Original Price</Text>
            <Text style={styles.soldCellValue}>
              £{item.originalPurchasePrice.toFixed(2)}
            </Text>
          </View>
          <View style={styles.soldCell}>
            <Text style={styles.soldCellLabel}>Your Payout</Text>
            <Text style={[styles.soldCellValue, { color: "#34d399" }]}>
              £{item.sellerPayout.toFixed(2)}
            </Text>
          </View>
          <View style={styles.soldCell}>
            <Text style={styles.soldCellLabel}>Payout Status</Text>
            <View
              style={[styles.refundBadge, { backgroundColor: refundColor.bg }]}
            >
              <Text
                style={[styles.refundBadgeText, { color: refundColor.text }]}
              >
                {refundLabel}
              </Text>
            </View>
          </View>
        </View>

        {item.sellerRefundStatus === "succeeded" && (
          <Text style={styles.refundNote}>
            Refund sent to your original payment method. It may take 5–10
            business days to appear.
          </Text>
        )}
        {item.sellerRefundStatus === "failed" && (
          <Text style={[styles.refundNote, { color: "rgba(239,68,68,0.8)" }]}>
            The automatic refund could not be processed. Please contact support.
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gold.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "active", label: "Active", count: activeTickets.length },
    { id: "resale", label: "Resale" },
    { id: "sold", label: "Sold", count: soldListings.length },
    { id: "history", label: "History", count: historyTickets.length },
  ];

  const emptyMessages: Record<TabId, { title: string; text: string }> = {
    active: {
      title: "No active tickets",
      text: "Browse events and purchase tickets to see them here.",
    },
    resale: {
      title: "No resale listings",
      text: "List your active tickets for resale.",
    },
    sold: {
      title: "No sold tickets",
      text: "When your resale tickets are purchased, they'll appear here with payout details.",
    },
    history: {
      title: "No history yet",
      text: "Your transferred or used tickets will appear here.",
    },
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="ticket" size={20} color={colors.gold.DEFAULT} />
        </View>
        <View>
          <Text style={styles.title}>My Tickets</Text>
          <Text style={styles.subtitle}>
            Manage your tickets and resale listings
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
              {tab.count !== undefined ? ` (${tab.count})` : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      {successMessage ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#34d399" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {activeTab === "sold" ? (
        soldListings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cash-outline" size={48} color={colors.text.dim} />
            <Text style={styles.emptyTitle}>{emptyMessages.sold.title}</Text>
            <Text style={styles.emptyText}>{emptyMessages.sold.text}</Text>
          </View>
        ) : (
          <FlatList
            data={soldListings}
            keyExtractor={(item) => item.id}
            renderItem={renderSoldListing}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.gold.DEFAULT}
              />
            }
          />
        )
      ) : displayedTickets.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="ticket-outline" size={48} color={colors.text.dim} />
          <Text style={styles.emptyTitle}>
            {emptyMessages[activeTab].title}
          </Text>
          <Text style={styles.emptyText}>{emptyMessages[activeTab].text}</Text>
        </View>
      ) : (
        <FlatList
          data={displayedTickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.gold.DEFAULT}
            />
          }
        />
      )}

      {/* QR Code Modal */}
      <Modal visible={!!showQr} transparent animationType="fade">
        <Pressable
          style={styles.qrModalOverlay}
          onPress={() => setShowQr(null)}
        >
          <Pressable
            style={styles.qrModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              style={styles.qrModalClose}
              onPress={() => setShowQr(null)}
            >
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
            {showQr && (
              <>
                <Text style={styles.qrModalTitle}>Your Ticket QR Code</Text>
                <Text style={styles.qrModalSubtitle}>{showQr.eventName}</Text>
                <View style={styles.qrModalImageBox}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(showQr.qrCode)}`,
                    }}
                    style={styles.qrModalImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.qrModalCode}>{showQr.qrCode}</Text>
                <Text style={styles.qrModalMeta}>
                  {showQr.ticketBatchName} · £{showQr.purchasePrice.toFixed(2)}
                </Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Resale Modal */}
      <Modal visible={!!resaleTicket} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>List for Resale</Text>
              <TouchableOpacity onPress={() => setResaleTicket(null)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
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
                  <Text
                    style={[
                      styles.modalInfoValue,
                      { color: colors.gold.DEFAULT },
                    ]}
                  >
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
                    style={[
                      styles.modalSubmitBtn,
                      submitting && { opacity: 0.5 },
                    ]}
                    onPress={handleListForResale}
                    disabled={submitting}
                  >
                    <LinearGradient
                      colors={[colors.gold.DEFAULT, colors.gold.light]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gold.dim,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gold.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },

  /* Tabs */
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bg.surface,
  },
  tabActive: {
    backgroundColor: colors.gold.DEFAULT,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.bg.primary,
  },

  /* Success banner */
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "rgba(52,211,153,0.08)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.2)",
  },
  successText: {
    fontSize: 13,
    color: "#34d399",
    fontWeight: "500",
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
    textAlign: "center",
    paddingHorizontal: spacing.xxl,
  },

  /* Card */
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
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  /* Card body with QR */
  cardBody: {
    flexDirection: "row",
    gap: spacing.md,
  },
  qrContainer: {
    alignItems: "center",
  },
  qrBox: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  qrOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderTopLeftRadius: radius.sm,
    padding: 3,
  },
  qrCode: {
    fontSize: 9,
    color: colors.text.dim,
    marginTop: 3,
    fontFamily: "monospace",
    maxWidth: 80,
  },
  cardDetails: {
    flex: 1,
    justifyContent: "center",
  },
  metaText: {
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: 3,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  resaleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gold.dim,
    borderWidth: 1,
    borderColor: colors.gold.border,
  },
  resaleBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gold.DEFAULT,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  cancelBtnText: { fontSize: 12, fontWeight: "600", color: "#ef4444" },

  /* Sold listings */
  soldDate: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  soldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    overflow: "hidden",
  },
  soldCell: {
    width: "50%",
    padding: spacing.md,
  },
  soldCellLabel: {
    fontSize: 11,
    color: colors.text.dim,
    marginBottom: 3,
  },
  soldCellValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  refundBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  refundBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  refundNote: {
    fontSize: 11,
    color: colors.text.dim,
    marginTop: spacing.md,
  },

  /* QR Modal */
  qrModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrModalContent: {
    width: "85%",
    backgroundColor: colors.bg.secondary,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: "center",
  },
  qrModalClose: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  qrModalSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  qrModalImageBox: {
    width: 220,
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: "#fff",
    padding: spacing.sm,
    overflow: "hidden",
  },
  qrModalImage: {
    width: "100%",
    height: "100%",
  },
  qrModalCode: {
    fontSize: 10,
    color: colors.text.dim,
    fontFamily: "monospace",
    marginTop: spacing.md,
    textAlign: "center",
  },
  qrModalMeta: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },

  /* Resale Modal */
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
  modalInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
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
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.muted,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
