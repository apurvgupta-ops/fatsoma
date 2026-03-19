"use client";

import { useState, type FormEvent } from "react";
import { Mail, MessageSquare, Clock, Send } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-cream/90">
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-cream/50">
            • Get in Touch
          </p>
          <h1 className="font-serif text-5xl font-bold tracking-tight text-cream sm:text-6xl">
            Contact <span className="text-gold">Us</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/70 sm:text-lg">
            Have a question, concern, or just want to say hello? We&apos;d love
            to hear from you.
          </p>
        </div>
      </section>

      <section className="relative border-t border-border/50">
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-gold/10 blur-[160px]" />
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gold/30 bg-surface/60 p-12">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
                      <Send className="h-7 w-7 text-gold" />
                    </div>
                    <h3 className="mt-6 font-serif text-2xl font-bold text-cream">
                      Message Sent
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-cream/60">
                      Thank you for reaching out. We&apos;ll get back to you
                      within 24–48 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: "", email: "", subject: "", message: "" });
                      }}
                      className="mt-6 cursor-pointer text-sm font-medium text-gold hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-border bg-surface/60 p-8 sm:p-10"
                >
                  <h2 className="font-serif text-2xl font-bold text-cream">
                    Send a Message
                  </h2>
                  <p className="mt-2 text-sm text-cream/60">
                    Fill out the form below and we&apos;ll respond as soon as
                    possible.
                  </p>
                  <div className="mt-8 space-y-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream/60">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full rounded-xl border border-border bg-void/60 px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream/60">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full rounded-xl border border-border bg-void/60 px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                        placeholder="you@university.ac.uk"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream/60">
                        Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) =>
                          setForm({ ...form, subject: e.target.value })
                        }
                        className="w-full rounded-xl border border-border bg-void/60 px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                        placeholder="What's this about?"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cream/60">
                        Message
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        className="w-full resize-none rounded-xl border border-border bg-void/60 px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                        placeholder="Tell us more..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-8 py-3.5 text-sm font-bold text-void transition hover:bg-gold-light"
                    >
                      <Send className="h-4 w-4" />
                      Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-border bg-surface/60 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-void/60">
                  <Mail className="h-6 w-6 text-gold" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-cream">
                  Email Us
                </h3>
                <p className="mt-2 text-sm text-cream/60">
                  Reach us directly at
                </p>
                <a
                  href="mailto:support@onthelist.com"
                  className="mt-1 block text-sm font-medium text-gold hover:underline"
                >
                  support@onthelist.com
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-surface/60 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-void/60">
                  <Clock className="h-6 w-6 text-gold" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-cream">
                  Response Time
                </h3>
                <p className="mt-2 text-sm text-cream/60">
                  We aim to respond to all enquiries within
                </p>
                <p className="mt-1 text-sm font-medium text-gold">
                  24–48 hours
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface/60 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-void/60">
                  <MessageSquare className="h-6 w-6 text-gold" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-cream">
                  Help Centre
                </h3>
                <p className="mt-2 text-sm text-cream/60">
                  Check our FAQ for quick answers
                </p>
                <a
                  href="/help-centre"
                  className="mt-1 block text-sm font-medium text-gold hover:underline"
                >
                  Visit Help Centre →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
