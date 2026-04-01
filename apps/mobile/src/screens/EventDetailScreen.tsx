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
  Dimensions,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/Ionicons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TicketBatch, ResaleListingResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT, RESALE_FEE_PERCENT } from "@fatsoma/shared";
import type { RootStackParamList } from "../navigation/types";
import { useEvent } from "../hooks/useEvents";
import { apiClient, API_BASE_URL } from "../lib/api";
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
        <ActivityIndicator size="large" color={colors.gold.DEFAULT} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error ?? "Event not found"}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to events</Text>
        </Pressable>
      </View>
    );
  }

  const isPlaceholder = event.eventImage?.startsWith("placeholder-");
  const imageUrl = event.eventImage?.startsWith("http")
    ? event.eventImage
    : isPlaceholder
      ? `https://placehold.co/1200x500/141414/c9a96e.png?text=${encodeURIComponent(event.eventName)}`
      : `${API_BASE_URL}${event.eventImage}`;

  const formattedDate = new Date(event.eventDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const basePrice = selectedBatch?.basePrice ?? 0;
  const feePerTicket =
    Math.round(basePrice * (BOOKING_FEE_PERCENT / 100) * 100) / 100;
  const totalPerTicket = basePrice + feePerTicket;
  const grandTotal = Math.round(totalPerTicket * qty * 100) / 100;

  const handleBuyNow = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to purchase tickets.", [
        { text: "OK" },
      ]);
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
      if (res.data?.url) await Linking.openURL(res.data.url);
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
        {/* Decorative blur orbs */}
        <View style={styles.orb1} pointerEvents="none" />
        <View style={styles.orb2} pointerEvents="none" />

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.hero}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(15,15,15,0.4)", "#0f0f0f"]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.eventCategory}</Text>
          </View>
          <Text style={styles.title}>{event.eventName}</Text>

          <View style={styles.chips}>
            <InfoChip icon="calendar-outline" text={formattedDate} />
            <InfoChip
              icon="time-outline"
              text={`${event.startTime} – ${event.endTime}`}
            />
            <InfoChip icon="location-outline" text={event.venueName} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{event.eventDescription}</Text>
          </View>

          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>Platform Booking Fee</Text>
            <View style={styles.feeValueRow}>
              <Text style={styles.feeValue}>{BOOKING_FEE_PERCENT}%</Text>
              <View style={styles.feeChip}>
                <Text style={styles.feeChipText}>
                  £{feePerTicket.toFixed(2)} / ticket
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Tickets</Text>
            {event.ticketBatches.map((batch) => {
              const isSelected = selectedBatch?.name === batch.name;
              const batchRemaining = batch.remaining ?? batch.quantity;
              const soldOut = batchRemaining <= 0;
              return (
                <Pressable
                  key={batch.name}
                  style={[
                    styles.batchCard,
                    isSelected && styles.batchCardSelected,
                    soldOut && { opacity: 0.4 },
                  ]}
                  onPress={() => {
                    if (soldOut) return;
                    setSelectedBatch(batch);
                    if (qty > batchRemaining)
                      setQty(Math.max(1, batchRemaining));
                  }}
                  disabled={soldOut}
                >
                  <View>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <Text style={styles.batchQty}>
                      {soldOut ? "Sold out" : `${batchRemaining} available`}
                    </Text>
                  </View>
                  <Text style={styles.batchPrice}>
                    £{batch.basePrice.toFixed(2)}
                  </Text>
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
                    <Ionicons
                      name="remove"
                      size={18}
                      color={colors.text.primary}
                    />
                  </Pressable>
                  <Text style={styles.qtyValue}>{qty}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() =>
                      setQty((q) =>
                        Math.min(
                          Math.min(
                            10,
                            selectedBatch?.remaining ??
                              selectedBatch?.quantity ??
                              10,
                          ),
                          q + 1,
                        ),
                      )
                    }
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={colors.text.primary}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Venue</Text>
            <View style={styles.venueCard}>
              <View style={styles.venueRow}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={colors.gold.light}
                />
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
                <Ionicons
                  name="map-outline"
                  size={16}
                  color={colors.gold.light}
                />
                <Text style={styles.mapBtnText}>View on Map</Text>
              </Pressable>
            </View>
          </View>

          {event.allowResale && (
            <ResaleSection eventId={event.id} user={user} />
          )}
        </View>
      </ScrollView>

      {selectedBatch && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>£{grandTotal.toFixed(2)}</Text>
            <Text style={styles.totalBreakdown}>
              {qty} × £{basePrice.toFixed(2)} + £{feePerTicket.toFixed(2)} fee (
              {BOOKING_FEE_PERCENT}%)
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

function ResaleSection({
  eventId,
  user,
}: {
  eventId: string;
  user: { id: string } | null;
}) {
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
      Alert.alert(
        "Sign In Required",
        "Please sign in to purchase resale tickets.",
      );
      return;
    }
    setBuyingId(listing.id);
    try {
      const fee =
        Math.round(listing.askingPrice * (RESALE_FEE_PERCENT / 100) * 100) /
        100;
      const res = await apiClient.buyResaleTicket(listing.id, fee);
      if (res.data?.url) await Linking.openURL(res.data.url);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to start checkout");
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator size="small" color={colors.gold.DEFAULT} />
      </View>
    );
  }
  if (listings.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={resaleStyles.header}>
        <Ionicons
          name="swap-horizontal"
          size={18}
          color={colors.gold.DEFAULT}
        />
        <Text style={styles.sectionTitle}>Resale Tickets</Text>
        <View style={resaleStyles.countBadge}>
          <Text style={resaleStyles.countText}>{listings.length}</Text>
        </View>
      </View>

      {listings.map((listing) => {
        const fee =
          Math.round(listing.askingPrice * (RESALE_FEE_PERCENT / 100) * 100) /
          100;
        const total = listing.askingPrice + fee;
        return (
          <View key={listing.id} style={resaleStyles.card}>
            <View style={resaleStyles.cardLeft}>
              <Text style={resaleStyles.price}>
                £{listing.askingPrice.toFixed(2)}
              </Text>
              <Text style={resaleStyles.feeText}>+ £{fee.toFixed(2)} fee</Text>
              <Text style={resaleStyles.originalText}>
                Originally £{listing.originalPurchasePrice.toFixed(2)}
              </Text>
            </View>
            <Pressable
              style={[
                resaleStyles.buyBtn,
                buyingId === listing.id && { opacity: 0.5 },
              ]}
              onPress={() => handleBuyResale(listing)}
              disabled={buyingId === listing.id}
            >
              {buyingId === listing.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={resaleStyles.buyBtnText}>
                  Buy £{total.toFixed(2)}
                </Text>
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

function InfoChip({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={colors.gold.light} />
      <Text style={styles.chipText} numberOfLines={1}>
        {text}
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
    backgroundColor: colors.gold.dim,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  countText: { color: colors.gold.DEFAULT, fontSize: 12, fontWeight: "700" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold.border,
  },
  cardLeft: { flex: 1 },
  price: { color: colors.text.primary, fontSize: 16, fontWeight: "700" },
  feeText: { color: colors.text.muted, fontSize: 12, marginTop: 2 },
  originalText: { color: colors.text.dim, fontSize: 11, marginTop: 2 },
  buyBtn: {
    backgroundColor: colors.gold.DEFAULT,
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.primary },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: colors.status.error, fontSize: 14 },
  backLink: { marginTop: spacing.md },
  backLinkText: { color: colors.gold.DEFAULT, fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 160 },
  orb1: {
    position: "absolute",
    top: -120,
    left: "25%",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(206,166,85,0.15)",
    zIndex: 0,
  },
  orb2: {
    position: "absolute",
    top: 80,
    right: 0,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(232,213,163,0.15)",
    zIndex: 0,
  },
  heroContainer: { height: 240, position: "relative", zIndex: 1 },
  hero: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    top: 50,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  body: { padding: spacing.lg, zIndex: 1 },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.gold.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoryText: {
    color: colors.gold.light,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
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
  description: { color: colors.text.secondary, fontSize: 14, lineHeight: 22 },
  feeCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginBottom: spacing.xl,
  },
  feeLabel: { color: colors.text.muted, fontSize: 12, marginBottom: 4 },
  feeValueRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  feeValue: { fontSize: 28, fontWeight: "800", color: colors.gold.DEFAULT },
  feeChip: {
    backgroundColor: colors.gold.dim,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  feeChipText: { fontSize: 12, fontWeight: "600", color: colors.gold.light },
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
    borderColor: colors.gold.DEFAULT,
    backgroundColor: colors.gold.dim,
  },
  batchName: { color: colors.text.primary, fontSize: 15, fontWeight: "600" },
  batchQty: { color: colors.text.muted, fontSize: 12, marginTop: 2 },
  batchPrice: { color: colors.gold.light, fontSize: 16, fontWeight: "700" },
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
  qtyValue: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center",
  },
  venueCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  venueName: { color: colors.text.primary, fontSize: 15, fontWeight: "600" },
  venueAddress: {
    color: colors.text.muted,
    fontSize: 13,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.gold.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  mapBtnText: { color: colors.gold.light, fontSize: 13, fontWeight: "600" },
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
    paddingBottom: 48,
  },
  totalLabel: { color: colors.text.muted, fontSize: 12 },
  totalValue: { color: colors.text.primary, fontSize: 22, fontWeight: "800" },
  totalBreakdown: { color: colors.text.dim, fontSize: 11, marginTop: 2 },
  buyBtn: {
    backgroundColor: colors.gold.DEFAULT,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    minWidth: 120,
    alignItems: "center",
  },
  buyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
