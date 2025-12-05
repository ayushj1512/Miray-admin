"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Mail,
  MessageCircle,
  Megaphone,
  Tag,
  Search,
  Users,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

export default function MarketingClient() {
  const router = useRouter();

  const cards = useMemo(
    () => [
      {
        title: "Email Marketing",
        desc: "Import subscribers, choose templates, send campaigns.",
        href: "/marketing/email",
        icon: Mail,
        tone: "blue",
      },
      {
        title: "WhatsApp Broadcasts",
        desc: "Send broadcast messages to segmented audiences.",
        href: "/marketing/whatsapp",
        icon: MessageCircle,
        tone: "green",
      },
      {
        title: "Campaigns",
        desc: "Plan, track, and manage ongoing campaigns.",
        href: "/marketing/campaigns",
        icon: Megaphone,
        tone: "purple",
      },
      {
        title: "Coupons & Discounts",
        desc: "Create coupons and run discount strategies.",
        href: "/marketing/coupons",
        icon: Tag,
        tone: "amber",
      },
      {
        title: "SEO Tools",
        desc: "Optimize meta titles, descriptions, and keywords.",
        href: "/marketing/seo",
        icon: Search,
        tone: "rose",
      },
      {
        title: "Influencer / Collabs",
        desc: "Manage collab leads, briefs, and deliverables.",
        href: "/marketing/collabs",
        icon: Users,
        tone: "slate",
      },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { label: "Subscribers", value: "—", icon: Users },
      { label: "Campaigns Active", value: "—", icon: Megaphone },
      { label: "Coupons Live", value: "—", icon: Tag },
      { label: "Revenue Lift", value: "—", icon: TrendingUp },
    ],
    []
  );

  const Card = ({ children, className = "", onClick }) => (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={[
        "rounded-2xl bg-white shadow-sm ring-1 ring-black/5",
        onClick ? "cursor-pointer hover:shadow-md transition active:scale-[0.99]" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );

  const Badge = ({ children }) => (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-50 ring-1 ring-black/5 text-gray-700">
      <Sparkles className="w-3 h-3" />
      {children}
    </span>
  );

  const toneClasses = (tone) => {
    switch (tone) {
      case "blue":
        return "bg-blue-50 text-blue-700";
      case "green":
        return "bg-green-50 text-green-700";
      case "purple":
        return "bg-purple-50 text-purple-700";
      case "amber":
        return "bg-amber-50 text-amber-800";
      case "rose":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">
            One place to run campaigns, emails, WhatsApp, coupons & growth.
          </p>
        </div>

        <div className="flex gap-2">
          <Badge>Quick Dashboard</Badge>
          <Badge>Admin Tools</Badge>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-3">
                Connect analytics later (Meta/GA/Shopify/Woo).
              </p>
            </Card>
          );
        })}
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card
                onClick={() => router.push(c.href)}
                className="p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div
                      className={[
                        "w-11 h-11 rounded-2xl flex items-center justify-center",
                        toneClasses(c.tone),
                      ].join(" ")}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
                    </div>
                  </div>

                  <div className="mt-1 text-gray-400">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Open module
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-50 ring-1 ring-black/5 text-gray-700">
                    {c.href}
                  </span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-700" />
              Recent Activity
            </h2>

            <span className="text-xs text-gray-500 bg-gray-50 ring-1 ring-black/5 px-2 py-1 rounded-full">
              placeholder
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { t: "Email campaign draft saved", d: "Today" },
              { t: "Coupon created (WINTER10)", d: "Yesterday" },
              { t: "WhatsApp broadcast queued", d: "2 days ago" },
            ].map((x, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl bg-gray-50 ring-1 ring-black/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{x.t}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{x.d}</p>
                </div>
                <span className="text-xs text-gray-500">—</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-700" />
            Quick Actions
          </h2>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => router.push("/marketing/email")}
              className="w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-700 px-4 py-3 text-sm font-medium active:scale-[0.99] transition flex items-center justify-between"
            >
              Create Email Campaign
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => router.push("/marketing/coupons")}
              className="w-full rounded-2xl bg-gray-50 ring-1 ring-black/5 hover:bg-gray-100 px-4 py-3 text-sm font-medium active:scale-[0.99] transition flex items-center justify-between text-gray-900"
            >
              Create Coupon
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </button>

            <button
              onClick={() => router.push("/marketing/whatsapp")}
              className="w-full rounded-2xl bg-gray-50 ring-1 ring-black/5 hover:bg-gray-100 px-4 py-3 text-sm font-medium active:scale-[0.99] transition flex items-center justify-between text-gray-900"
            >
              WhatsApp Broadcast
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </button>

            <div className="mt-3 rounded-2xl bg-gray-50 ring-1 ring-black/5 p-4">
              <p className="text-xs text-gray-600">
                Later we can plug in analytics values into the stats cards.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                For now this is a clean navigation hub ✅
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
