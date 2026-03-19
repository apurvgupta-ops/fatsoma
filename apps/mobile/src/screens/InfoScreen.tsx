import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import { colors, spacing, radius } from "../theme";

type InfoScreenRouteProp = RouteProp<RootStackParamList, "InfoPage">;

/* ------------------------------------------------------------------ */
/*  Page-specific content renderers                                    */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps: { num: string; title: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { num: "1", title: "Browse & Find", desc: "Search events by name, venue, or category.", icon: "search" },
    { num: "2", title: "Select & Checkout", desc: "Pick your tickets, checkout securely via Stripe.", icon: "card" },
    { num: "3", title: "Get Your QR", desc: "Receive an instant QR code — your entry pass.", icon: "qr-code" },
  ];

  return (
    <>
      {steps.map((s) => (
        <View key={s.num} style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Ionicons name={s.icon} size={20} color={colors.gold.DEFAULT} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>
                {s.num}. {s.title}
              </Text>
              <Text style={styles.bodyText}>{s.desc}</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

function TrustSafety() {
  const items: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
    { icon: "shield-checkmark", title: "No Scalping", desc: "Resale capped at current release price." },
    { icon: "qr-code", title: "Verified Transfers", desc: "Old QR invalidated, new one generated." },
    { icon: "lock-closed", title: "Secure Payments", desc: "Stripe-powered, PCI compliant." },
    { icon: "server", title: "Data Protection", desc: "Encrypted data, GDPR compliant." },
  ];

  return (
    <>
      {items.map((item) => (
        <View key={item.title} style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={22} color={colors.gold.DEFAULT} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Text style={styles.bodyText}>{item.desc}</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

function Pricing() {
  const sections: { title: string; desc: string }[] = [
    { title: "Ticket Pricing", desc: "Organisers set base prices per batch. Early-bird batches may be cheaper than later releases." },
    { title: "Smart Timing Fee", desc: `A dynamic booking fee of ${BOOKING_FEE_PERCENT}% adjusts with demand, rewarding early buyers.` },
    { title: "Resale Fees", desc: "The same booking fee applies to resale. Sellers receive the original ticket price back." },
  ];

  return (
    <>
      {sections.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.bodyText}>{s.desc}</Text>
        </View>
      ))}
      <View style={[styles.card, styles.summaryCard]}>
        <Text style={styles.summaryText}>
          Base ticket price + Booking fee ({BOOKING_FEE_PERCENT}%) = Total you pay
        </Text>
      </View>
    </>
  );
}

function HelpCentre() {
  const faqs: { q: string; a: string }[] = [
    { q: "How do I buy tickets?", a: "Browse events on the Explore tab, select your tickets, and complete checkout via Stripe." },
    { q: "Can I get a refund?", a: "Refunds are handled on a case-by-case basis. Contact support for assistance." },
    { q: "How does resale work?", a: "List your ticket for resale at the current release price. The old QR is invalidated and a new one is generated for the buyer." },
    { q: "What is the Smart Timing Fee?", a: `A dynamic ${BOOKING_FEE_PERCENT}% booking fee that adjusts with demand, incentivising early purchases.` },
    { q: "How do I contact support?", a: "Email us at support@onthelist.com. We respond within 24-48 hours." },
  ];

  return <FAQList faqs={faqs} />;
}

function FAQList({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <>
      {faqs.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <Pressable key={idx} style={styles.card} onPress={() => setOpenIdx(isOpen ? null : idx)}>
            <View style={styles.faqRow}>
              <Text style={styles.sectionTitle}>{faq.q}</Text>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.gold.DEFAULT}
              />
            </View>
            {isOpen && <Text style={[styles.bodyText, { marginTop: spacing.sm }]}>{faq.a}</Text>}
          </Pressable>
        );
      })}
    </>
  );
}

function Contact() {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.bodyText}>
          For any questions or issues, reach out to our support team.
        </Text>
      </View>
      <View style={styles.card}>
        <View style={styles.stepRow}>
          <Ionicons name="mail" size={20} color={colors.gold.DEFAULT} />
          <Pressable onPress={() => Linking.openURL("mailto:support@onthelist.com")}>
            <Text style={[styles.sectionTitle, { marginLeft: spacing.sm }]}>support@onthelist.com</Text>
          </Pressable>
        </View>
        <Text style={[styles.bodyText, { marginTop: spacing.sm }]}>
          Response time: 24-48 hours
        </Text>
      </View>
    </>
  );
}

function Terms() {
  const sections: { title: string; body: string }[] = [
    { title: "1. Acceptance of Terms", body: "By accessing and using On The List, you agree to be bound by these terms and conditions." },
    { title: "2. User Accounts", body: "You are responsible for maintaining the confidentiality of your account credentials. All activity under your account is your responsibility." },
    { title: "3. Ticket Purchases & Resale", body: "Tickets are sold subject to availability. Resale is permitted only through the platform at the current release price." },
    { title: "4. Fees and Payments", body: "All payments are processed through Stripe. A booking fee is applied at checkout. Fees are non-refundable." },
    { title: "5. Limitation of Liability", body: "On The List is not liable for event cancellations, changes, or any indirect damages arising from use of the platform." },
    { title: "6. Privacy & Changes", body: "We may update these terms at any time. Your data is handled in accordance with our Privacy Policy and applicable GDPR regulations." },
  ];

  return (
    <>
      {sections.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.bodyText}>{s.body}</Text>
        </View>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main InfoScreen                                                    */
/* ------------------------------------------------------------------ */

export function InfoScreen() {
  const route = useRoute<InfoScreenRouteProp>();
  const navigation = useNavigation();
  const { pageId, title } = route.params;

  const renderContent = () => {
    switch (pageId) {
      case "how-it-works":
        return <HowItWorks />;
      case "trust-safety":
        return <TrustSafety />;
      case "pricing":
        return <Pricing />;
      case "help-centre":
        return <HelpCentre />;
      case "contact":
        return <Contact />;
      case "terms":
        return <Terms />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  /* Header */
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    paddingHorizontal: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 36,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },

  /* Card */
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  /* Typography */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gold.DEFAULT,
    marginBottom: spacing.xs,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.muted,
  },

  /* Steps (how-it-works) */
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gold.dim,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContent: {
    flex: 1,
  },

  /* Trust-safety icon circle */
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold.dim,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Pricing summary */
  summaryCard: {
    borderColor: colors.gold.border,
    backgroundColor: colors.gold.dim,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.gold.light,
    textAlign: "center",
  },

  /* FAQ */
  faqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
