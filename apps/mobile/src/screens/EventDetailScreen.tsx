import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TicketBatch, ResaleListingResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import type { RootStackParamList } from "../navigation/types";
import { useEvent } from "../hooks/useEvents";
import { apiClient } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "EventDetail">;

export function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const { user } = useAuth();
  const { event, loading, error } = useEvent(eventId);
  const [selectedBatch, setSelectedBatch] = useState<TicketBatch | null>(null);
  const [qty, setQty] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.purple.DEFAULT} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error ?? "Event not found"}</Text>
      </View>
    );
  }

  const imageUrl = event.eventImage?.startsWith("http")
    ? event.eventImage
    : `http://10.0.2.2:4000${event.eventImage}`;

  const formattedDate = new Date(event.eventDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const basePrice = selectedBatch?.basePrice ?? 0;
  const feePerTicket = Math.round(basePrice * (BOOKING_FEE_PERCENT / 100) * 100) / 100;
  const totalPerTicket = basePrice + feePerTicket;
  const grandTotal = Math.round(totalPerTicket * qty * 100) / 100;

  const handleBuyNow = async () => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to purchase tickets.",
        [{ text: "OK" }],
      );
      return;
    }

    if (!selectedBatch) {
      Alert.alert("Select Ticket", "Please select a ticket tier first.");
      return;
    }

    try {
      setPurchasing(true);
      const res = await apiClient.createCheckoutSession({
        eventId: event.id,
        batchName: selectedBatch.name,
        quantity: qty,
        capturedFee: feePerTicket,
      });

      if (res.data?.url) {
        await Linking.openURL(res.data.url);
      }
    } catch (err: any) {
      Alert.alert("Checkout Error", err.message ?? "Something went wrong");
    } finally {
      setPurchasing(false);
    }
  };

  const fullAddress = `${event.addressLine}, ${event.city}, ${event.postcode}, ${event.country}`;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.hero} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Title & Category */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.eventCategory}</Text>
          </View>
          <Text style={styles.title}>{event.eventName}</Text>

          {/* Info Chips */}
          <View style={styles.chips}>
            <InfoChip icon="calendar-outline" text={formattedDate} />
            <InfoChip icon="time-outline" text={`${event.startTime} – ${event.endTime}`} />
            <InfoChip icon="location-outline" text={event.venueName} />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{event.eventDescription}</Text>
          </View>

          {/* Booking Fee Info */}
          <View style={styles.feeCard}>
            <View style={styles.feeHeader}>
              <Text style={styles.feeLabel}>Platform Booking Fee</Text>
              <View style={styles.feeValueRow}>
                <Text style={[styles.feeValue, { color: colors.purple.light }]}>
                  {BOOKING_FEE_PERCENT}%
                </Text>
                <View style={[styles.deltaChip, { backgroundColor: colors.purple.dim }]}>
                  <Text style={[styles.deltaText, { color: colors.purple.light }]}>
                    £{feePerTicket.toFixed(2)} / ticket
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Ticket Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Tickets</Text>
            {event.ticketBatches.map((batch) => {
              const isSelected = selectedBatch?.name === batch.name;
              return (
                <Pressable
                  key={batch.name}
                  style={[styles.batchCard, isSelected && styles.batchCardSelected]}
                  onPress={() => setSelectedBatch(batch)}
                >
                  <View>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <Text style={styles.batchQty}>{batch.quantity} available</Text>
                  </View>
                  <Text style={styles.batchPrice}>£{batch.basePrice.toFixed(2)}</Text>
                </Pressable>
              );
            })}

            {selectedBatch && (
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantity</Text>
                <View style={styles.qtyControls}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#fff" />
                  </Pressable>
                  <Text style={styles.qtyValue}>{qty}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => setQty((q) => Math.min(10, q + 1))}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Venue */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Venue</Text>
            <View style={styles.venueCard}>
              <View style={styles.venueRow}>
                <Ionicons name="business-outline" size={18} color={colors.purple.light} />
                <Text style={styles.venueName}>{event.venueName}</Text>
              </View>
              <Text style={styles.venueAddress}>{fullAddress}</Text>
              <Pressable
                style={styles.mapBtn}
                onPress={() =>
                  Linking.openURL(
                    event.mapsLink ??
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
                  )
                }
              >
                <Ionicons name="map-outline" size={16} color={colors.purple.light} />
                <Text style={styles.mapBtnText}>View on Map</Text>
              </Pressable>
            </View>
          </View>

          {/* Resale Listings */}
          {event.allowResale && (
            <ResaleSection eventId={event.id} user={user} />
          )}
        </View>
      </ScrollView>

      {/* Bottom Purchase Bar */}
      {selectedBatch && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>£{grandTotal.toFixed(2)}</Text>
            <Text style={styles.totalBreakdown}>
              {qty} × £{basePrice.toFixed(2)} + £{feePerTicket.toFixed(2)} fee ({BOOKING_FEE_PERCENT}%)
            </Text>
          </View>
          <Pressable
            style={[styles.buyBtn, purchasing && { opacity: 0.6 }]}
            onPress={handleBuyNow}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buyBtnText}>Buy Now</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function ResaleSection({ eventId, user }: { eventId: string; user: any }) {
  const [listings, setListings] = useState<ResaleListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getResaleListings(eventId)
      .then((res) => {
        if (res.ok && res.data) setListings(res.data);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleBuyResale = async (listing: ResaleListingResponse) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to purchase resale tickets.");
      return;
    }
    setBuyingId(listing.id);
    try {
      const fee = Math.round(listing.askingPrice * (BOOKING_FEE_PERCENT / 100) * 100) / 100;
      const res = await apiClient.buyResaleTicket(listing.id, fee);
      if (res.data?.url) {
        await Linking.openURL(res.data.url);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to start checkout");
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator size="small" color={colors.purple.DEFAULT} />
      </View>
    );
  }

  if (listings.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={resaleStyles.header}>
        <Ionicons name="swap-horizontal" size={18} color="#f59e0b" />
        <Text style={styles.sectionTitle}>Resale Tickets</Text>
        <View style={resaleStyles.countBadge}>
          <Text style={resaleStyles.countText}>{listings.length}</Text>
        </View>
      </View>

      {listings.map((listing) => {
        const fee = Math.round(listing.askingPrice * (BOOKING_FEE_PERCENT / 100) * 100) / 100;
        const total = listing.askingPrice + fee;

        return (
          <View key={listing.id} style={resaleStyles.card}>
            <View style={resaleStyles.cardLeft}>
              <Text style={resaleStyles.price}>£{listing.askingPrice.toFixed(2)}</Text>
              <Text style={resaleStyles.feeText}>+ £{fee.toFixed(2)} fee</Text>
              <Text style={resaleStyles.originalText}>
                Originally £{listing.originalPurchasePrice.toFixed(2)}
              </Text>
            </View>
            <Pressable
              style={[resaleStyles.buyBtn, buyingId === listing.id && { opacity: 0.5 }]}
              onPress={() => handleBuyResale(listing)}
              disabled={buyingId === listing.id}
            >
              {buyingId === listing.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={resaleStyles.buyBtnText}>Buy £{total.toFixed(2)}</Text>
              )}
            </Pressable>
          </View>
        );
      })}

      <Text style={resaleStyles.disclaimer}>
        Resale tickets are capped at the current ticket price.
      </Text>
    </View>
  );
}

const resaleStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  countBadge: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  countText: { color: "#f59e0b", fontSize: 12, fontWeight: "700" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
  },
  cardLeft: { flex: 1 },
  price: { color: colors.text.primary, fontSize: 16, fontWeight: "700" },
  feeText: { color: colors.text.muted, fontSize: 12, marginTop: 2 },
  originalText: { color: colors.text.dim, fontSize: 11, marginTop: 2 },
  buyBtn: {
    backgroundColor: "#d97706",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minWidth: 100,
    alignItems: "center",
  },
  buyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  disclaimer: {
    color: colors.text.dim,
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});

function InfoChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={colors.purple.light} />
      <Text style={styles.chipText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: colors.status.error, fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  heroContainer: { height: 280, position: "relative" },
  hero: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  body: { padding: spacing.lg },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.purple.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoryText: {
    color: colors.purple.light,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  chipText: { color: colors.text.secondary, fontSize: 12 },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  description: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
  feeCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginBottom: spacing.xl,
  },
  feeHeader: { marginBottom: spacing.md },
  feeLabel: { color: colors.text.muted, fontSize: 12, marginBottom: 4 },
  feeValueRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  feeValue: { fontSize: 28, fontWeight: "800" },
  deltaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deltaText: { fontSize: 12, fontWeight: "600" },
  batchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  batchCardSelected: {
    borderColor: colors.purple.DEFAULT,
    backgroundColor: colors.purple.dim,
  },
  batchName: { color: colors.text.primary, fontSize: 15, fontWeight: "600" },
  batchQty: { color: colors.text.muted, fontSize: 12, marginTop: 2 },
  batchPrice: { color: colors.purple.light, fontSize: 16, fontWeight: "700" },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  qtyLabel: { color: colors.text.secondary, fontSize: 14 },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.elevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  qtyValue: { color: colors.text.primary, fontSize: 18, fontWeight: "700", minWidth: 28, textAlign: "center" },
  venueCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  venueRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  venueName: { color: colors.text.primary, fontSize: 15, fontWeight: "600" },
  venueAddress: { color: colors.text.muted, fontSize: 13, marginBottom: spacing.md, lineHeight: 20 },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.purple.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  mapBtnText: { color: colors.purple.light, fontSize: 13, fontWeight: "600" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  totalLabel: { color: colors.text.muted, fontSize: 12 },
  totalValue: { color: colors.text.primary, fontSize: 22, fontWeight: "800" },
  totalBreakdown: { color: colors.text.dim, fontSize: 11, marginTop: 2 },
  buyBtn: {
    backgroundColor: colors.purple.DEFAULT,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    minWidth: 120,
    alignItems: "center",
  },
  buyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
