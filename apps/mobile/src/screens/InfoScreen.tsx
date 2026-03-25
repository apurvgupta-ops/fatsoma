import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { BOOKING_FEE_PERCENT, RESALE_FEE_PERCENT } from "@fatsoma/shared";
import { colors, spacing, radius } from "../theme";

type InfoScreenRouteProp = RouteProp<RootStackParamList, "InfoPage">;

function HowItWorks() {
  const steps: {
    num: string;
    title: string;
    desc: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      num: "1",
      title: "Browse & Find",
      desc: "Search events by name, venue, or category. Filter by date and discover what's happening near you.",
      icon: "search",
    },
    {
      num: "2",
      title: "Select & Checkout",
      desc: "Pick your tickets, checkout securely via Stripe. Apple Pay and Google Pay are also supported.",
      icon: "card",
    },
    {
      num: "3",
      title: "Get Your QR",
      desc: "Receive an instant QR code — your entry pass. Show it at the door to get in.",
      icon: "qr-code",
    },
  ];

  const features: {
    title: string;
    desc: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      title: "Secure Resale",
      desc: "Need to sell your ticket? List it at or below the current release price. When it sells, your old QR code is instantly invalidated and a brand-new one is generated for the buyer. No duplicates, no fraud.",
      icon: "shield-checkmark",
    },
    {
      title: "Atomic Transfers",
      desc: "Every resale is an atomic operation — the old ticket is voided and the new one is created in a single step. There is never a moment where two valid tickets exist for the same seat.",
      icon: "swap-horizontal",
    },
    {
      title: "Fair Pricing, Always",
      desc: "Our Smart Timing Fee starts low and rises with demand, but the ticket price itself is always capped at the current release tier. No scalping, ever. You pay what's fair.",
      icon: "pricetag",
    },
  ];

  return (
    <>
      <Text style={styles.pageSubtitle}>How it works in 3 simple steps</Text>
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

      <Text
        style={[
          styles.sectionTitle,
          { marginTop: spacing.xl, marginBottom: spacing.sm },
        ]}
      >
        Built for Fairness
      </Text>
      <Text style={[styles.bodyText, { marginBottom: spacing.md }]}>
        Every feature designed to protect you
      </Text>
      {features.map((f) => (
        <View key={f.title} style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={f.icon} size={22} color={colors.gold.DEFAULT} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>{f.title}</Text>
              <Text style={styles.bodyText}>{f.desc}</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

function TrustSafety() {
  const items: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    desc: string;
    highlights?: string[];
  }[] = [
    {
      icon: "shield-checkmark",
      title: "No Scalping",
      desc: "Resale capped at current release price. Tickets can never be sold above face value on our platform.",
    },
    {
      icon: "qr-code",
      title: "Verified Transfers",
      desc: "Old QR invalidated, new one generated. Every transfer is atomic — no duplicate tickets can exist.",
    },
    {
      icon: "people",
      title: "Student Verification",
      desc: "On The List is built for verified students. Our platform ensures that ticket holders are genuine members of the student community, keeping events safe and authentic.",
      highlights: [
        "Student-only platform",
        "Identity verification",
        "Community trust",
      ],
    },
    {
      icon: "lock-closed",
      title: "Secure Payments",
      desc: "Stripe-powered, PCI DSS Level 1 compliant. Your card details never touch our servers.",
    },
    {
      icon: "server",
      title: "Data Protection",
      desc: "Encrypted data, GDPR compliant. All personal data is encrypted in transit and at rest.",
    },
  ];

  return (
    <>
      {items.map((item) => (
        <View key={item.title} style={styles.card}>
          <View style={styles.stepRow}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={item.icon}
                size={22}
                color={colors.gold.DEFAULT}
              />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Text style={styles.bodyText}>{item.desc}</Text>
              {item.highlights && (
                <View style={styles.highlightRow}>
                  {item.highlights.map((h) => (
                    <View key={h} style={styles.highlightChip}>
                      <Text style={styles.highlightText}>{h}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      ))}

      <View style={[styles.card, styles.ctaCard]}>
        <Text style={styles.ctaTitle}>Something doesn't feel right?</Text>
        <Text style={styles.bodyText}>
          If you encounter any suspicious activity, fraudulent listings, or
          safety concerns, please reach out immediately. We take every report
          seriously.
        </Text>
        <Pressable
          style={styles.ctaBtn}
          onPress={() => Linking.openURL("mailto:support@onthelist.com")}
        >
          <Text style={styles.ctaBtnText}>Contact Support</Text>
        </Pressable>
      </View>
    </>
  );
}

function Pricing() {
  const sections: { title: string; desc: string }[] = [
    {
      title: "Ticket Pricing",
      desc: "Organisers set base prices per batch. Early-bird batches may be cheaper than later releases.",
    },
    {
      title: "Smart Timing Fee",
      desc: `A dynamic booking fee of ${BOOKING_FEE_PERCENT}% adjusts with demand, rewarding early buyers.`,
    },
    {
      title: "Resale Fees",
      desc: `A ${RESALE_FEE_PERCENT}% resale fee applies to resale purchases. Sellers receive the original ticket price back.`,
    },
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
          Base ticket price + Booking fee ({BOOKING_FEE_PERCENT}%) = Total you
          pay
        </Text>
      </View>
      <Text
        style={[
          styles.bodyText,
          { marginTop: spacing.md, textAlign: "center" },
        ]}
      >
        The booking fee is currently a flat {BOOKING_FEE_PERCENT}% applied to
        the ticket base price. This covers payment processing, QR generation,
        and platform maintenance.
      </Text>
    </>
  );
}

function HelpCentre() {
  const faqs: { q: string; a: string }[] = [
    {
      q: "How do I buy tickets?",
      a: "Browse events on our platform, select the event you want to attend, choose your ticket quantity, and proceed to checkout. Payments are processed securely through Stripe. Once your payment is confirmed, a unique QR code is generated and linked to your account — that's your ticket.",
    },
    {
      q: "Can I get a refund?",
      a: "Refund policies are set by individual event organisers. If the organiser allows refunds, you can request one from your tickets page. Alternatively, you can list your ticket for resale on the platform — you'll receive your original purchase price back when it sells.",
    },
    {
      q: "How does resale work?",
      a: "If you can no longer attend an event, you can list your ticket for resale at or below the current release price. When another student buys it, your original QR code is instantly invalidated and a new one is generated for the buyer. You receive your original purchase price back in full.",
    },
    {
      q: "What is the Smart Timing Fee?",
      a: `The Smart Timing Fee is our platform booking fee applied at checkout. It currently operates as a fixed percentage but is designed to adjust dynamically based on demand and proximity to the event — starting low when tickets first go on sale and rising as the event approaches. This encourages early purchases and keeps pricing fair.`,
    },
    {
      q: "How do I list my ticket for resale?",
      a: "Go to your tickets page, find the ticket you want to sell, and tap 'List for Resale'. Set your price (at or below the current release price) and confirm. Your ticket will appear in the resale marketplace. You can cancel the listing at any time before it sells.",
    },
    {
      q: "Is my payment secure?",
      a: "Absolutely. All payments are handled by Stripe, the industry-leading payment processor. Your card details never touch our servers. Stripe is PCI DSS Level 1 compliant — the highest level of security certification available in the payments industry.",
    },
    {
      q: "What happens if an event is cancelled?",
      a: "If an event is cancelled by the organiser, all ticket holders are eligible for a full refund. The organiser will initiate refunds through the platform, and funds will be returned to your original payment method. You'll receive an email notification when the refund is processed.",
    },
    {
      q: "How do I contact support?",
      a: "You can reach our support team by visiting the Contact page and submitting a message. We aim to respond to all enquiries within 24–48 hours. For urgent issues, email us directly at support@onthelist.com.",
    },
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
          <Pressable
            key={idx}
            style={styles.card}
            onPress={() => setOpenIdx(isOpen ? null : idx)}
          >
            <View style={styles.faqRow}>
              <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>
                {faq.q}
              </Text>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.gold.DEFAULT}
              />
            </View>
            {isOpen && (
              <Text style={[styles.bodyText, { marginTop: spacing.sm }]}>
                {faq.a}
              </Text>
            )}
          </Pressable>
        );
      })}
    </>
  );
}

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert("Missing Fields", "Please fill out all fields.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1000);
  };

  if (sent) {
    return (
      <View style={[styles.card, { alignItems: "center" }]}>
        <Ionicons name="checkmark-circle" size={48} color="#34d399" />
        <Text
          style={[
            styles.sectionTitle,
            { marginTop: spacing.md, textAlign: "center" },
          ]}
        >
          Message Sent
        </Text>
        <Text style={[styles.bodyText, { textAlign: "center" }]}>
          Thank you for reaching out. We'll get back to you within 24–48 hours.
        </Text>
        <Pressable
          onPress={() => setSent(false)}
          style={{ marginTop: spacing.md }}
        >
          <Text
            style={{
              color: colors.gold.light,
              fontWeight: "600",
              fontSize: 14,
            }}
          >
            Send another message
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Send a Message</Text>
        <Text style={[styles.bodyText, { marginBottom: spacing.md }]}>
          Fill out the form below and we'll respond as soon as possible.
        </Text>

        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Your full name"
          placeholderTextColor={colors.text.dim}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.formInput}
          placeholder="you@university.ac.uk"
          placeholderTextColor={colors.text.dim}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.inputLabel}>Subject</Text>
        <TextInput
          style={styles.formInput}
          placeholder="What's this about?"
          placeholderTextColor={colors.text.dim}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.inputLabel}>Message</Text>
        <TextInput
          style={[styles.formInput, { height: 100, textAlignVertical: "top" }]}
          placeholder="Tell us more..."
          placeholderTextColor={colors.text.dim}
          multiline
          value={message}
          onChangeText={setMessage}
        />

        <Pressable
          style={[styles.sendBtn, sending && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>Send Message</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.stepRow}>
          <Ionicons name="mail" size={20} color={colors.gold.DEFAULT} />
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Email Us</Text>
            <Pressable
              onPress={() => Linking.openURL("mailto:support@onthelist.com")}
            >
              <Text style={[styles.bodyText, { color: colors.gold.light }]}>
                support@onthelist.com
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.stepRow}>
          <Ionicons name="time" size={20} color={colors.gold.DEFAULT} />
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Response Time</Text>
            <Text style={styles.bodyText}>
              We aim to respond within{" "}
              <Text style={{ fontWeight: "700", color: colors.gold.light }}>
                24–48 hours
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

function Terms() {
  const sections: { title: string; body: string }[] = [
    {
      title: "1. Acceptance of Terms",
      body: 'By accessing or using On The List ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use the Platform. We reserve the right to update these terms at any time, and your continued use of the Platform constitutes acceptance of any modifications.',
    },
    {
      title: "2. User Accounts",
      body: "You must create an account to purchase or sell tickets on the Platform. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate and complete information during registration and keep your account information up to date. We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.",
    },
    {
      title: "3. Ticket Purchases",
      body: "All ticket purchases are subject to availability. Prices are set by event organisers and may vary between ticket batches. A platform booking fee is applied at checkout. Once a purchase is confirmed, a unique QR code is generated and linked to your account. This QR code serves as your entry credential and must not be shared, duplicated, or transferred outside of the Platform's official resale mechanism.",
    },
    {
      title: "4. Resale Policy",
      body: "Tickets may be listed for resale exclusively through the Platform's built-in resale feature. Resale prices are capped at the current release price set by the organiser — tickets may not be listed above this threshold. When a resale transaction is completed, the seller's QR code is immediately invalidated and a new QR code is generated for the buyer. Any attempt to sell tickets outside of the Platform will result in account suspension.",
    },
    {
      title: "5. Fees and Payments",
      body: "All payments are processed through Stripe, a PCI DSS Level 1 compliant payment processor. A booking fee is applied to all ticket purchases and resale transactions. The current fee structure is displayed at checkout before payment is confirmed. Sellers receive their original purchase price when a resale is completed. The Platform does not store payment card details.",
    },
    {
      title: "6. Cancellations and Refunds",
      body: "Refund policies are determined by individual event organisers. If an event is cancelled, all ticket holders are eligible for a full refund, which will be processed to the original payment method. The Platform booking fee may or may not be refundable depending on the circumstances. We recommend listing your ticket for resale as an alternative to requesting a refund.",
    },
    {
      title: "7. Limitation of Liability",
      body: "The Platform acts as an intermediary between event organisers and ticket buyers. We do not organise, host, or manage events listed on the Platform. To the maximum extent permitted by law, On The List shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.",
    },
    {
      title: "8. Privacy",
      body: "We collect and process personal data in accordance with applicable data protection laws, including the UK GDPR. Personal information is used solely for the purpose of providing and improving our services. We do not sell or share your personal data with third parties for marketing purposes. All data is encrypted in transit and at rest.",
    },
    {
      title: "9. Changes to Terms",
      body: "We reserve the right to modify these Terms and Conditions at any time. Material changes will be communicated via email or through a notice on the Platform. Your continued use of the Platform after changes are posted constitutes your acceptance of the revised terms.",
    },
  ];

  return (
    <>
      <Text
        style={[
          styles.bodyText,
          { marginBottom: spacing.md, textAlign: "center" },
        ]}
      >
        Last updated: March 2026
      </Text>
      {sections.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.bodyText}>{s.body}</Text>
        </View>
      ))}
      <Text
        style={[
          styles.bodyText,
          { marginTop: spacing.md, textAlign: "center" },
        ]}
      >
        If you have any questions about these terms, please contact us.
      </Text>
    </>
  );
}

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
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

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

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },

  pageSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

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

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold.dim,
    justifyContent: "center",
    alignItems: "center",
  },

  highlightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  highlightChip: {
    backgroundColor: colors.gold.dim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.gold.light,
  },

  ctaCard: {
    borderColor: colors.gold.border,
    backgroundColor: colors.gold.dim,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gold.DEFAULT,
    marginBottom: spacing.sm,
  },
  ctaBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.gold.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

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

  faqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.bg.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text.primary,
  },
  sendBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
