import React, { useState } from "react";
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
import type { TicketBatch } from "@fatsoma/shared";
import type { RootStackParamList } from "../navigation/types";
import { useEvent } from "../hooks/useEvents";
import { useLiveFee } from "../hooks/useLiveFee";
import { SparkLine } from "../components/SparkLine";
import { apiClient } from "../lib/api";
import { colors, spacing, radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "EventDetail">;

export function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const { event, loading, error } = useEvent(eventId);
  const { fee, delta, history } = useLiveFee(event?.bookingFee ?? 5);
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

  const isUp = delta >= 0;
  const feeColor = isUp ? colors.stock.green : colors.stock.red;

  const basePrice = selectedBatch?.basePrice ?? 0;
  const totalPerTicket = basePrice + fee;
  const grandTotal = totalPerTicket * qty;

  const handleBuyNow = async () => {
    if (!selectedBatch) {
      Alert.alert("Select Ticket", "Please select a ticket tier first.");
      return;
    }

    const capturedFee = fee;

    try {
      setPurchasing(true);
      const res = await apiClient.createCheckoutSession({
        eventId: event.id,
        batchName: selectedBatch.name,
        quantity: qty,
        capturedFee,
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

          {/* Live Booking Fee */}
          <View style={styles.feeCard}>
            <View style={styles.feeHeader}>
              <Text style={styles.feeLabel}>Live Booking Fee</Text>
              <View style={styles.feeValueRow}>
                <Text style={[styles.feeValue, { color: feeColor }]}>
                  £{fee.toFixed(2)}
                </Text>
                <View style={[styles.deltaChip, { backgroundColor: isUp ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }]}>
                  <Ionicons
                    name={isUp ? "trending-up" : "trending-down"}
                    size={14}
                    color={feeColor}
                  />
                  <Text style={[styles.deltaText, { color: feeColor }]}>
                    {isUp ? "+" : ""}
                    {delta.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
            <SparkLine data={history} max={event.bookingFee} width={280} height={50} />
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
        </View>
      </ScrollView>

      {/* Bottom Purchase Bar */}
      {selectedBatch && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>£{grandTotal.toFixed(2)}</Text>
            <Text style={styles.totalBreakdown}>
              {qty} × £{basePrice.toFixed(2)} + £{fee.toFixed(2)} fee
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
