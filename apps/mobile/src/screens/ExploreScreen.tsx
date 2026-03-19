import React, { useMemo, useState, useRef } from "react";
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
import type { RootStackParamList, TabParamList, InfoPageId } from "../navigation/types";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import { useEvents } from "../hooks/useEvents";
import { EventCard } from "../components/EventCard";
import { colors, spacing, radius } from "../theme";

type ExploreNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "ExploreTab">,
  NativeStackNavigationProp<RootStackParamList, "Main">
>;

type Props = { navigation: ExploreNavProp };

const HEADER_ESTIMATE = 500;

export function ExploreScreen({ navigation }: Props) {
  const { events, loading, error, refetch } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const flatListRef = useRef<FlatList>(null);
  const [headerHeight, setHeaderHeight] = useState(HEADER_ESTIMATE);

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

  const renderListHeader = () => (
    <View
      onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      collapsable={false}
    >
      {/* Hero - matches design */}
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>On The List</Text>
        </View>
        <Text style={styles.heroTagline}>SECURE STUDENT TICKET PLATFORM</Text>
        <Text style={styles.heroHeadline}>
          You&apos;re <Text style={styles.heroHeadlineGold}>on the list</Text>
        </Text>
        <Text style={styles.heroDesc}>
          The only student ticket platform with secure, no-scalping resale. You
          always pay the current release price — never a penny more.
        </Text>
        <View style={styles.heroButtons}>
          <Pressable
            style={styles.heroBtnPrimary}
            onPress={() =>
              flatListRef.current?.scrollToOffset({
                offset: headerHeight,
                animated: true,
              })
            }
          >
            <Text style={styles.heroBtnPrimaryText}>Browse Events</Text>
          </Pressable>
          <Pressable
            style={styles.heroBtnSecondary}
            onPress={() =>
              navigation.navigate("Main", { screen: "TicketsTab" })
            }
          >
            <Text style={styles.heroBtnSecondaryText}>My Tickets</Text>
          </Pressable>
        </View>
      </View>

      {/* Featured Events section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Events</Text>
        <Text style={styles.sectionSubtitle}>
          The ones everyone&apos;s talking about
        </Text>
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
      <View style={styles.categoryRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          style={styles.categoryContainer}
        >
          <Pressable
            style={[
              styles.categoryAll,
              selectedCategory === "all" && styles.categoryAllActive,
            ]}
            onPress={() => setSelectedCategory("all")}
          >
            <Text
              style={[
                styles.categoryAllText,
                selectedCategory === "all" && styles.categoryAllTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat && styles.categoryPillTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.feeTag}>
          <Text style={styles.feeTagText}>{BOOKING_FEE_PERCENT}% fee</Text>
        </View>
      </View>
    </View>
  );

  const footerLinks: { section: string; items: { label: string; pageId: InfoPageId; title: string }[] }[] = [
    {
      section: "PLATFORM",
      items: [
        { label: "How It Works", pageId: "how-it-works", title: "How It Works" },
        { label: "Trust & Safety", pageId: "trust-safety", title: "Trust & Safety" },
        { label: "Pricing", pageId: "pricing", title: "Pricing" },
      ],
    },
    {
      section: "SUPPORT",
      items: [
        { label: "Help Centre", pageId: "help-centre", title: "Help Centre" },
        { label: "Contact", pageId: "contact", title: "Contact" },
        { label: "Terms", pageId: "terms", title: "Terms" },
      ],
    },
  ];

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.footerColumns}>
        {footerLinks.map((col) => (
          <View key={col.section} style={styles.footerColumn}>
            <Text style={styles.footerSectionTitle}>{col.section}</Text>
            {col.items.map((link) => (
              <Pressable
                key={link.pageId}
                onPress={() => navigation.navigate("InfoPage", { pageId: link.pageId, title: link.title })}
                style={styles.footerLink}
              >
                <Text style={styles.footerLinkText}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.footerCopy}>
        &copy; {new Date().getFullYear()} On The List. All rights reserved.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Decorative blur orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <FlatList
        ref={flatListRef}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
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
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroTagline: {
    fontSize: 10,
    color: colors.text.dim,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  heroHeadline: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  heroHeadlineGold: {
    color: colors.gold.DEFAULT,
  },
  heroDesc: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  heroButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  heroBtnPrimary: {
    flex: 1,
    backgroundColor: colors.gold.DEFAULT,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: "center",
  },
  heroBtnPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.bg.primary,
  },
  heroBtnSecondary: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gold.DEFAULT,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: "center",
  },
  heroBtnSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.gold.DEFAULT,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.text.dim,
    marginTop: 4,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gold.DEFAULT,
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
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  categoryContainer: {
    flex: 1,
    maxHeight: 44,
  },
  categoryScroll: {
    paddingRight: spacing.sm,
  },
  categoryAll: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  categoryAllActive: {
    borderBottomColor: colors.gold.DEFAULT,
  },
  categoryAllText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.text.dim,
  },
  categoryAllTextActive: {
    color: colors.gold.DEFAULT,
  },
  categoryPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  categoryPillActive: {
    borderColor: colors.gold.DEFAULT,
    backgroundColor: colors.gold.dim,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.text.primary,
  },
  categoryPillTextActive: {
    color: colors.gold.DEFAULT,
  },
  feeTag: {
    backgroundColor: colors.gold.DEFAULT,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  feeTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.bg.primary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
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

  /* Footer */
  footer: {
    marginTop: spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    paddingTop: spacing.xl,
  },
  footerColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerColumn: {
    flex: 1,
  },
  footerSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.dim,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  footerLink: {
    paddingVertical: spacing.xs,
  },
  footerLinkText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  footerCopy: {
    fontSize: 12,
    color: colors.text.dim,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
