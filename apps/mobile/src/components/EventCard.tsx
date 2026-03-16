import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { EventResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import { colors, spacing, radius } from "../theme";
import { API_BASE_URL } from "../lib/api";

const CARD_WIDTH = Dimensions.get("window").width - spacing.lg * 2;

interface EventCardProps {
  event: EventResponse;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const isPlaceholder = event.eventImage?.startsWith("placeholder-");
  const imageUrl = event.eventImage?.startsWith("http")
    ? event.eventImage
    : isPlaceholder
      ? `https://placehold.co/400x300/141414/C9A96E.png?text=${encodeURIComponent(event.eventName)}`
      : `${API_BASE_URL}${event.eventImage}`;

  const formattedDate = new Date(event.eventDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const lowestPrice = event.ticketBatches?.length
    ? Math.min(...event.ticketBatches.map((b) => b.basePrice))
    : 0;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.overlay} />
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{event.eventCategory}</Text>
      </View>
      <View style={styles.feeBadge}>
        <Text style={styles.feeText}>{BOOKING_FEE_PERCENT}% fee</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.eventName}
        </Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.gold.light} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={colors.gold.light} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.venueName}
            </Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Tickets from</Text>
            <Text style={styles.price}>£{lowestPrice.toFixed(2)}</Text>
          </View>
          <Text style={styles.feeLabel}>+{BOOKING_FEE_PERCENT}% fee</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    minHeight: 320,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.bg.card,
    marginBottom: spacing.lg,
  },
  image: {
    width: "100%",
    height: 180,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    height: 180,
  },
  categoryBadge: {
    position: "absolute",
    left: spacing.lg,
    top: spacing.lg,
    backgroundColor: "rgba(8,8,8,0.8)",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  categoryText: {
    color: colors.text.secondary,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  feeBadge: {
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg,
    backgroundColor: colors.gold.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.gold.border,
  },
  feeText: {
    color: colors.gold.DEFAULT,
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
    fontStyle: "italic",
  },
  meta: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: colors.text.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  priceLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.text.dim,
  },
  price: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  feeLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.gold.DEFAULT,
    fontWeight: "600",
  },
});
