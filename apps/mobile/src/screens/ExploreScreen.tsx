import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import { useEvents } from "../hooks/useEvents";
import { EventCard } from "../components/EventCard";
import { colors, spacing } from "../theme";

type ExploreNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "ExploreTab">,
  NativeStackNavigationProp<RootStackParamList, "Main">
>;

type Props = { navigation: ExploreNavProp };

export function ExploreScreen({ navigation }: Props) {
  const { events, loading, error, refetch } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    const cats = [...new Set(events.map((e) => e.eventCategory))];
    return cats.sort();
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (selectedCategory !== "all" && e.eventCategory !== selectedCategory)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.eventName.toLowerCase().includes(q) ||
          e.venueName.toLowerCase().includes(q) ||
          (e.eventDescription?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [events, searchQuery, selectedCategory]);

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold.DEFAULT} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No events found</Text>
        <Text style={styles.emptySubtext}>
          Try a different search or category
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Decorative blur orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Ionicons name="checkmark" size={20} color={colors.gold.DEFAULT} />
          </View>
          <View>
            <Text style={styles.brandTitle}>On The List</Text>
            <Text style={styles.brandSubtitle}>Discover events</Text>
          </View>
        </View>
        <Text style={styles.pageTitle}>Explore Events</Text>
        <Text style={styles.pageSubtitle}>
          Browse upcoming events • Live booking-fee trends
        </Text>
        <View style={styles.countRow}>
          <Text style={styles.countValue}>{filtered.length}</Text>
          <Text style={styles.countLabel}>live events</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={18}
          color={colors.text.muted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor={colors.text.dim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryContainer}
      >
        <Pressable
          style={[
            styles.categoryChip,
            selectedCategory === "all" && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory("all")}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === "all" && styles.categoryChipTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() =>
              navigation.navigate("EventDetail", { eventId: item.id })
            }
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={colors.gold.DEFAULT}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Booking fee: {BOOKING_FEE_PERCENT}% · Powered by{" "}
          <Text style={styles.footerBrand}>On The List</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  orb1: {
    position: "absolute",
    top: -160,
    left: "25%",
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: "rgba(201,169,110,0.15)",
  },
  orb2: {
    position: "absolute",
    top: 80,
    right: 0,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(232,213,163,0.15)",
  },
  orb3: {
    position: "absolute",
    bottom: 100,
    left: "50%",
    marginLeft: -144,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: "rgba(99,102,241,0.1)",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.gold.dim,
    borderWidth: 1,
    borderColor: colors.gold.border,
    justifyContent: "center",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.text.primary,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 11,
    color: colors.text.dim,
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 10,
    color: colors.text.dim,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  countValue: {
    fontSize: 24,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.gold.DEFAULT,
  },
  countLabel: {
    fontSize: 9,
    color: colors.text.dim,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  searchIcon: {
    paddingBottom: spacing.md,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
  },
  categoryContainer: {
    maxHeight: 44,
    marginBottom: spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  categoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  categoryChipActive: {
    borderBottomColor: colors.gold.DEFAULT,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.text.dim,
  },
  categoryChipTextActive: {
    color: colors.gold.DEFAULT,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: colors.text.muted,
    fontSize: 13,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  footerText: {
    fontSize: 11,
    color: colors.text.dim,
  },
  footerBrand: {
    color: colors.gold.DEFAULT,
    fontWeight: "600",
  },
});
