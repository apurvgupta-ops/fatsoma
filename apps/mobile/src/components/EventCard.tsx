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
import { colors, spacing, radius } from "../theme";

const CARD_WIDTH = Dimensions.get("window").width - spacing.lg * 2;

interface EventCardProps {
  event: EventResponse;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const imageUrl = event.eventImage?.startsWith("http")
    ? event.eventImage
    : `http://10.0.2.2:4000${event.eventImage}`;

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
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{event.eventCategory}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {event.eventName}
          </Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.purple.light} />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.purple.light} />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.venueName}
              </Text>
            </View>
          </View>
          {lowestPrice > 0 && (
            <Text style={styles.price}>From £{lowestPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.bg.card,
    marginBottom: spacing.lg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.purple.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.purple.light,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  info: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  meta: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  price: {
    color: colors.purple.light,
    fontSize: 14,
    fontWeight: "600",
  },
});
