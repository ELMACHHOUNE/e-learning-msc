"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { ImageUpload } from "@/components/ui/image-upload";
import { confirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/alert";
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  LayoutTemplate,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const KEY_HERO = "home.hero";
const KEY_OVERVIEW = "home.overview";
const KEY_ROLES = "home.roles";
const KEY_TECH_STACK = "home.tech_stack";
const KEY_NAVBAR = "home.navbar";
const KEY_FOOTER = "home.footer";
const KEY_CONTACT = "home.contact";
const KEY_FEATURED = "home.featured_courses";
const KEY_LOGIN = "auth.login";
const KEY_FORGOT = "auth.forgot_password";

const ROLE_ICON_OPTIONS = [
  { value: "shield", label: "Shield" },
  { value: "terminal", label: "Terminal" },
  { value: "book", label: "Book" },
  { value: "users", label: "Users" },
  { value: "rocket", label: "Rocket" },
  { value: "check", label: "Check" },
];

const fieldClass =
  "w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink";

interface HeroForm {
  image: string;
  heading: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface OverviewStatForm {
  value: string;
  label: string;
}

interface OverviewForm {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  stats: OverviewStatForm[];
}

interface RoleCardForm {
  title: string;
  description: string;
  icon: string;
}

interface RolesForm {
  title: string;
  cards: RoleCardForm[];
}

interface CardForm {
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  contentText: string;
}

interface TechStackForm {
  sectionEyebrow: string;
  sectionTitle: string;
  cards: CardForm[];
}

interface NavLinkForm {
  label: string;
  href: string;
}

interface NavbarForm {
  brandName: string;
  brandImage: string;
  navLinks: NavLinkForm[];
}

interface FooterForm {
  brandName: string;
  brandImage: string;
  tagline: string;
  portalTitle: string;
  portals: NavLinkForm[];
  legalTitle: string;
  legalLinksText: string;
  copyright: string;
  credit: string;
}

interface ContactForm {
  eyebrow: string;
  title: string;
  heading: string;
  description: string;
  image: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  email: string;
}

interface FeaturedCoursesForm {
  eyebrow: string;
  title: string;
  courseIds: string[];
}

interface LoginForm {
  eyebrow: string;
  tagline: string;
  image: string;
  title: string;
  subtitle: string;
}

interface ForgotPasswordForm {
  leftTitle: string;
  title: string;
  description: string;
  successTitle: string;
  successDescription: string;
}

interface SectionDraft {
  key: string;
  label: string;
  description: string;
  content: Record<string, unknown>;
  hasStored: boolean;
}

function toHeroForm(raw: Record<string, unknown>): HeroForm {
  return {
    image: typeof raw.image === "string" ? raw.image : "",
    heading: typeof raw.heading === "string" ? raw.heading : "",
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : "",
    ctaText: typeof raw.ctaText === "string" ? raw.ctaText : "",
    ctaLink: typeof raw.ctaLink === "string" ? raw.ctaLink : "",
  };
}

function toOverviewForm(raw: Record<string, unknown>): OverviewForm {
  const stats = Array.isArray(raw.stats) ? raw.stats : [];
  return {
    eyebrow: typeof raw.eyebrow === "string" ? raw.eyebrow : "",
    title: typeof raw.title === "string" ? raw.title : "",
    description: typeof raw.description === "string" ? raw.description : "",
    image: typeof raw.image === "string" ? raw.image : "",
    stats: stats
      .filter(
        (s): s is Record<string, unknown> =>
          typeof s === "object" && s !== null,
      )
      .map((s) => ({
        value: typeof s.value === "string" ? s.value : "",
        label: typeof s.label === "string" ? s.label : "",
      })),
  };
}

function toRolesForm(raw: Record<string, unknown>): RolesForm {
  const cards = Array.isArray(raw.cards) ? raw.cards : [];
  return {
    title: typeof raw.title === "string" ? raw.title : "",
    cards: cards
      .filter(
        (c): c is Record<string, unknown> =>
          typeof c === "object" && c !== null,
      )
      .map((c) => ({
        title: typeof c.title === "string" ? c.title : "",
        description: typeof c.description === "string" ? c.description : "",
        icon: typeof c.icon === "string" ? c.icon : "terminal",
      })),
  };
}

function toCardForm(card: {
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  content: string[];
}): CardForm {
  return {
    title: card.title,
    description: card.description,
    src: card.src,
    ctaText: card.ctaText,
    ctaLink: card.ctaLink,
    contentText: (card.content ?? []).join("\n"),
  };
}

function toTechStackForm(raw: Record<string, unknown>): TechStackForm {
  const cards = Array.isArray(raw.cards) ? raw.cards : [];
  return {
    sectionEyebrow:
      typeof raw.sectionEyebrow === "string" ? raw.sectionEyebrow : "",
    sectionTitle: typeof raw.sectionTitle === "string" ? raw.sectionTitle : "",
    cards: cards
      .filter(
        (c): c is Record<string, unknown> =>
          typeof c === "object" && c !== null,
      )
      .map((c) =>
        toCardForm({
          title: typeof c.title === "string" ? c.title : "",
          description: typeof c.description === "string" ? c.description : "",
          src: typeof c.src === "string" ? c.src : "",
          ctaText: typeof c.ctaText === "string" ? c.ctaText : "Learn More",
          ctaLink: typeof c.ctaLink === "string" ? c.ctaLink : "",
          content: Array.isArray(c.content) ? c.content.map(String) : [],
        }),
      ),
  };
}

function toNavLink(raw: Record<string, unknown>): NavLinkForm {
  return {
    label: typeof raw.label === "string" ? raw.label : "",
    href: typeof raw.href === "string" ? raw.href : "",
  };
}

function toNavbarForm(raw: Record<string, unknown>): NavbarForm {
  const navLinks = Array.isArray(raw.navLinks) ? raw.navLinks : [];
  return {
    brandName: typeof raw.brandName === "string" ? raw.brandName : "",
    brandImage: typeof raw.brandImage === "string" ? raw.brandImage : "",
    navLinks: navLinks
      .filter(
        (l): l is Record<string, unknown> =>
          typeof l === "object" && l !== null,
      )
      .map(toNavLink),
  };
}

function toFooterForm(raw: Record<string, unknown>): FooterForm {
  const portals = Array.isArray(raw.portals) ? raw.portals : [];
  const legalLinks = Array.isArray(raw.legalLinks) ? raw.legalLinks : [];
  return {
    brandName: typeof raw.brandName === "string" ? raw.brandName : "",
    brandImage: typeof raw.brandImage === "string" ? raw.brandImage : "",
    tagline: typeof raw.tagline === "string" ? raw.tagline : "",
    portalTitle: typeof raw.portalTitle === "string" ? raw.portalTitle : "",
    portals: portals
      .filter(
        (l): l is Record<string, unknown> =>
          typeof l === "object" && l !== null,
      )
      .map(toNavLink),
    legalTitle: typeof raw.legalTitle === "string" ? raw.legalTitle : "",
    legalLinksText: legalLinks.map(String).join("\n"),
    copyright: typeof raw.copyright === "string" ? raw.copyright : "",
    credit: typeof raw.credit === "string" ? raw.credit : "",
  };
}

function toContactForm(raw: Record<string, unknown>): ContactForm {
  return {
    eyebrow: typeof raw.eyebrow === "string" ? raw.eyebrow : "",
    title: typeof raw.title === "string" ? raw.title : "",
    heading: typeof raw.heading === "string" ? raw.heading : "",
    description: typeof raw.description === "string" ? raw.description : "",
    image: typeof raw.image === "string" ? raw.image : "",
    whatsappNumber: typeof raw.whatsappNumber === "string" ? raw.whatsappNumber : "",
    whatsappDisplay: typeof raw.whatsappDisplay === "string" ? raw.whatsappDisplay : "",
    email: typeof raw.email === "string" ? raw.email : "",
  };
}

function toFeaturedCoursesForm(raw: Record<string, unknown>): FeaturedCoursesForm {
  const courseIds = Array.isArray(raw.courseIds)
    ? raw.courseIds.filter((id): id is string => typeof id === "string")
    : [];
  return {
    eyebrow: typeof raw.eyebrow === "string" ? raw.eyebrow : "",
    title: typeof raw.title === "string" ? raw.title : "",
    courseIds,
  };
}

function toLoginForm(raw: Record<string, unknown>): LoginForm {
  return {
    eyebrow: typeof raw.eyebrow === "string" ? raw.eyebrow : "",
    tagline: typeof raw.tagline === "string" ? raw.tagline : "",
    image: typeof raw.image === "string" ? raw.image : "",
    title: typeof raw.title === "string" ? raw.title : "",
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : "",
  };
}

function toForgotPasswordForm(raw: Record<string, unknown>): ForgotPasswordForm {
  return {
    leftTitle: typeof raw.leftTitle === "string" ? raw.leftTitle : "",
    title: typeof raw.title === "string" ? raw.title : "",
    description: typeof raw.description === "string" ? raw.description : "",
    successTitle: typeof raw.successTitle === "string" ? raw.successTitle : "",
    successDescription:
      typeof raw.successDescription === "string" ? raw.successDescription : "",
  };
}

function toSectionForm(
  key: string,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  switch (key) {
    case KEY_HERO:
      return toHeroForm(raw) as unknown as Record<string, unknown>;
    case KEY_OVERVIEW:
      return toOverviewForm(raw) as unknown as Record<string, unknown>;
    case KEY_ROLES:
      return toRolesForm(raw) as unknown as Record<string, unknown>;
    case KEY_TECH_STACK:
      return toTechStackForm(raw) as unknown as Record<string, unknown>;
    case KEY_NAVBAR:
      return toNavbarForm(raw) as unknown as Record<string, unknown>;
    case KEY_FOOTER:
      return toFooterForm(raw) as unknown as Record<string, unknown>;
    case KEY_CONTACT:
      return toContactForm(raw) as unknown as Record<string, unknown>;
    case KEY_FEATURED:
      return toFeaturedCoursesForm(raw) as unknown as Record<string, unknown>;
    case KEY_LOGIN:
      return toLoginForm(raw) as unknown as Record<string, unknown>;
    case KEY_FORGOT:
      return toForgotPasswordForm(raw) as unknown as Record<string, unknown>;
    default:
      return {};
  }
}

function buildPayload(
  key: string,
  content: Record<string, unknown>,
): Record<string, unknown> {
  if (key === KEY_TECH_STACK) {
    const form = content as unknown as TechStackForm;
    const cards = form.cards
      .filter((c) => c.title.trim())
      .map((c) => ({
        title: c.title.trim(),
        description: c.description.trim(),
        src: c.src.trim(),
        ctaText: c.ctaText.trim() || "Learn More",
        ctaLink: c.ctaLink.trim(),
        content: c.contentText
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean),
      }));
    return {
      sectionEyebrow: form.sectionEyebrow.trim(),
      sectionTitle: form.sectionTitle.trim(),
      cards,
    };
  }
  if (key === KEY_NAVBAR) {
    const form = content as unknown as NavbarForm;
    return {
      brandName: form.brandName.trim(),
      brandImage: form.brandImage.trim(),
      navLinks: form.navLinks
        .filter((l) => l.label.trim())
        .map((l) => ({ label: l.label.trim(), href: l.href.trim() })),
    };
  }
  if (key === KEY_FOOTER) {
    const form = content as unknown as FooterForm;
    return {
      brandName: form.brandName.trim(),
      brandImage: form.brandImage.trim(),
      tagline: form.tagline.trim(),
      portalTitle: form.portalTitle.trim(),
      portals: form.portals
        .filter((l) => l.label.trim())
        .map((l) => ({ label: l.label.trim(), href: l.href.trim() })),
      legalTitle: form.legalTitle.trim(),
      legalLinks: form.legalLinksText
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean),
      copyright: form.copyright.trim(),
      credit: form.credit.trim(),
    };
  }
  if (key === KEY_CONTACT) {
    const form = content as unknown as ContactForm;
    return {
      eyebrow: form.eyebrow.trim(),
      title: form.title.trim(),
      heading: form.heading.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      whatsappNumber: form.whatsappNumber.trim(),
      whatsappDisplay: form.whatsappDisplay.trim(),
      email: form.email.trim(),
    };
  }
  if (key === KEY_FEATURED) {
    const form = content as unknown as FeaturedCoursesForm;
    return {
      eyebrow: form.eyebrow.trim(),
      title: form.title.trim(),
      courseIds: form.courseIds.filter(Boolean),
    };
  }
  if (key === KEY_LOGIN) {
    const form = content as unknown as LoginForm;
    return {
      eyebrow: form.eyebrow.trim(),
      tagline: form.tagline.trim(),
      image: form.image.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
    };
  }
  if (key === KEY_FORGOT) {
    const form = content as unknown as ForgotPasswordForm;
    return {
      leftTitle: form.leftTitle.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      successTitle: form.successTitle.trim(),
      successDescription: form.successDescription.trim(),
    };
  }
  return content;
}

function emptyCard(): CardForm {
  return {
    title: "",
    description: "",
    src: "/images/cover.png",
    ctaText: "Learn More",
    ctaLink: "",
    contentText: "",
  };
}

function moveItem<T>(items: T[], index: number, dir: -1 | 1): T[] {
  const next = [...items];
  const target = index + dir;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
      {children}
    </label>
  );
}

function HeroSectionForm({
  value,
  onChange,
}: {
  value: HeroForm;
  onChange: (v: HeroForm) => void;
}) {
  const set = (patch: Partial<HeroForm>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-lg">
      <div>
        <ImageUpload
          value={value.image}
          onChange={(url) => set({ image: url })}
          folder="site-content"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Headline (optional, shown above the button)</Label>
          <input
            type="text"
            value={value.heading}
            onChange={(e) => set({ heading: e.target.value })}
            placeholder="LEARN DIFFERENT. LEARN BETTER."
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Highlight Text</Label>
          <input
            type="text"
            value={value.ctaText}
            onChange={(e) => set({ ctaText: e.target.value })}
            placeholder="Explore the Platform"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Subtitle</Label>
          <textarea
            rows={3}
            value={value.subtitle}
            onChange={(e) => set({ subtitle: e.target.value })}
            placeholder="A short line under the headline."
            className={cn(fieldClass, "resize-none")}
          />
        </div>
        <div>
          <Label>Button Link</Label>
          <input
            type="text"
            value={value.ctaLink}
            onChange={(e) => set({ ctaLink: e.target.value })}
            placeholder="#elearning"
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}

function OverviewSectionForm({
  value,
  onChange,
}: {
  value: OverviewForm;
  onChange: (v: OverviewForm) => void;
}) {
  const set = (patch: Partial<OverviewForm>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Eyebrow</Label>
          <input
            type="text"
            value={value.eyebrow}
            onChange={(e) => set({ eyebrow: e.target.value })}
            placeholder="PLATFORM OVERVIEW"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Heading</Label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="STRUCTURED LEARNING. MEASURABLE OUTCOMES."
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          rows={4}
          value={value.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Long description text..."
          className={cn(fieldClass, "resize-y")}
        />
      </div>
      <div>
        <ImageUpload
          value={value.image}
          onChange={(url) => set({ image: url })}
          folder="site-content"
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-md mb-4">
          <Label>Stats ({value.stats.length})</Label>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() =>
              set({ stats: [...value.stats, { value: "", label: "" }] })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Add Stat
          </Button>
        </div>
        {value.stats.length === 0 && (
          <p className="text-body-sm text-mute">
            No stats — the stats row will be hidden.
          </p>
        )}
        <div className="space-y-lg">
          {value.stats.map((stat, index) => (
            <div
              key={index}
              className="border border-hairline bg-surface-soft/50 p-lg flex items-end gap-lg"
            >
              <div className="flex-1">
                <Label>Value</Label>
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) =>
                    set({
                      stats: value.stats.map((s, i) =>
                        i === index ? { ...s, value: e.target.value } : s,
                      ),
                    })
                  }
                  placeholder="194"
                  className={fieldClass}
                />
              </div>
              <div className="flex-1">
                <Label>Label</Label>
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) =>
                    set({
                      stats: value.stats.map((s, i) =>
                        i === index ? { ...s, label: e.target.value } : s,
                      ),
                    })
                  }
                  placeholder="Sessions"
                  className={fieldClass}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() =>
                    set({
                      stats: value.stats.map((s, i) => (i === index ? s : s)),
                    })
                  }
                  disabled
                  className="hidden"
                  aria-hidden="true"
                />
                <button
                  onClick={() =>
                    set({ stats: moveItem(value.stats, index, -1) })
                  }
                  disabled={index === 0}
                  className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  onClick={() =>
                    set({ stats: moveItem(value.stats, index, 1) })
                  }
                  disabled={index === value.stats.length - 1}
                  className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                >
                  Down
                </button>
                <button
                  onClick={() =>
                    set({ stats: value.stats.filter((_, i) => i !== index) })
                  }
                  className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1"
                  aria-label="Remove stat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RolesSectionForm({
  value,
  onChange,
}: {
  value: RolesForm;
  onChange: (v: RolesForm) => void;
}) {
  const set = (patch: Partial<RolesForm>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-lg">
      <div>
        <Label>Heading</Label>
        <input
          type="text"
          value={value.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="ROLE CONFIGURATOR &amp; MANAGEMENT"
          className={fieldClass}
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-md mb-4">
          <Label>Role Cards ({value.cards.length})</Label>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() =>
              set({
                cards: [
                  ...value.cards,
                  { title: "", description: "", icon: "terminal" },
                ],
              })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Add Card
          </Button>
        </div>
        <div className="space-y-lg">
          {value.cards.map((card, index) => (
            <div
              key={index}
              className="border border-hairline bg-surface-soft/50 p-lg"
            >
              <div className="flex items-center justify-between gap-md mb-4">
                <span className="text-caption text-charcoal uppercase tracking-[0.1em] font-600">
                  Card {index + 1}
                </span>
                <button
                  onClick={() =>
                    set({ cards: value.cards.filter((_, i) => i !== index) })
                  }
                  className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1"
                  aria-label="Remove card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div>
                  <Label>Title</Label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) =>
                      set({
                        cards: value.cards.map((c, i) =>
                          i === index ? { ...c, title: e.target.value } : c,
                        ),
                      })
                    }
                    placeholder="Admin Layer"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <select
                    value={card.icon}
                    onChange={(e) =>
                      set({
                        cards: value.cards.map((c, i) =>
                          i === index ? { ...c, icon: e.target.value } : c,
                        ),
                      })
                    }
                    className={cn(fieldClass, "cursor-pointer")}
                  >
                    {ROLE_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-lg">
                <Label>Description</Label>
                <textarea
                  rows={4}
                  value={card.description}
                  onChange={(e) =>
                    set({
                      cards: value.cards.map((c, i) =>
                        i === index ? { ...c, description: e.target.value } : c,
                      ),
                    })
                  }
                  placeholder="Describe the role capabilities..."
                  className={cn(fieldClass, "resize-y")}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TechStackSectionForm({
  value,
  onChange,
}: {
  value: TechStackForm;
  onChange: (v: TechStackForm) => void;
}) {
  const set = (patch: Partial<TechStackForm>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-xxl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Section Eyebrow</Label>
          <input
            type="text"
            value={value.sectionEyebrow}
            onChange={(e) => set({ sectionEyebrow: e.target.value })}
            placeholder="TECHNOLOGY STACK"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Section Heading</Label>
          <input
            type="text"
            value={value.sectionTitle}
            onChange={(e) => set({ sectionTitle: e.target.value })}
            placeholder="BUILT WITH MODERN TECHNOLOGIES"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-md mb-4">
          <Label>Technology Cards ({value.cards.length})</Label>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() => set({ cards: [...value.cards, emptyCard()] })}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Card
          </Button>
        </div>

        <div className="space-y-lg">
          {value.cards.map((card, index) => (
            <div
              key={index}
              className="border border-hairline bg-surface-soft/50 p-lg"
            >
              <div className="flex items-center justify-between gap-md mb-4">
                <span className="text-caption text-charcoal uppercase tracking-[0.1em] font-600">
                  Card {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      set({ cards: moveItem(value.cards, index, -1) })
                    }
                    disabled={index === 0}
                    className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    onClick={() =>
                      set({ cards: moveItem(value.cards, index, 1) })
                    }
                    disabled={index === value.cards.length - 1}
                    className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                  >
                    Down
                  </button>
                  <button
                    onClick={() => {
                      if (value.cards.length <= 1) {
                        toast({
                          variant: "error",
                          title: "At least one card is required",
                        });
                        return;
                      }
                      confirm({
                        title: "Remove card",
                        message: `Remove "${card.title || `Card ${index + 1}`}"?`,
                        variant: "danger",
                        confirmLabel: "Remove",
                        onConfirm() {
                          set({
                            cards: value.cards.filter((_, i) => i !== index),
                          });
                        },
                      });
                    }}
                    className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1"
                    aria-label="Remove card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div>
                  <Label>Title</Label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) =>
                      set({
                        cards: value.cards.map((c, i) =>
                          i === index ? { ...c, title: e.target.value } : c,
                        ),
                      })
                    }
                    placeholder="Next.js 16"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label>Short Description</Label>
                  <input
                    type="text"
                    value={card.description}
                    onChange={(e) =>
                      set({
                        cards: value.cards.map((c, i) =>
                          i === index
                            ? { ...c, description: e.target.value }
                            : c,
                        ),
                      })
                    }
                    placeholder="Full-stack Framework"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label>CTA Label</Label>
                  <input
                    type="text"
                    value={card.ctaText}
                    onChange={(e) =>
                      set({
                        cards: value.cards.map((c, i) =>
                          i === index ? { ...c, ctaText: e.target.value } : c,
                        ),
                      })
                    }
                    placeholder="Learn More"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label>CTA Link</Label>
                  <input
                    type="url"
                    value={card.ctaLink}
                    onChange={(e) =>
                      set({
                        cards: value.cards.map((c, i) =>
                          i === index ? { ...c, ctaLink: e.target.value } : c,
                        ),
                      })
                    }
                    placeholder="https://nextjs.org"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="mt-lg">
                <ImageUpload
                  value={card.src}
                  onChange={(url) =>
                    set({
                      cards: value.cards.map((c, i) =>
                        i === index ? { ...c, src: url } : c,
                      ),
                    })
                  }
                  folder="site-content"
                />
              </div>

              <div className="mt-lg">
                <Label>Expanded Body (one paragraph per line)</Label>
                <textarea
                  rows={6}
                  value={card.contentText}
                  onChange={(e) =>
                    set({
                      cards: value.cards.map((c, i) =>
                        i === index ? { ...c, contentText: e.target.value } : c,
                      ),
                    })
                  }
                  placeholder={`React is the industry-standard library for building user interfaces.\n\nThis platform leverages React's component model...`}
                  className={cn(fieldClass, "resize-y")}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavbarSectionForm({
  value,
  onChange,
}: {
  value: NavbarForm;
  onChange: (v: NavbarForm) => void;
}) {
  const set = (patch: Partial<NavbarForm>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Brand Name</Label>
          <input
            type="text"
            value={value.brandName}
            onChange={(e) => set({ brandName: e.target.value })}
            placeholder="e-Teaching"
            className={fieldClass}
          />
        </div>
        <div>
          <ImageUpload
            value={value.brandImage}
            onChange={(url) => set({ brandImage: url })}
            folder="site-content"
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-md mb-4">
          <Label>Navigation Links ({value.navLinks.length})</Label>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() =>
              set({ navLinks: [...value.navLinks, { label: "", href: "" }] })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Add Link
          </Button>
        </div>
        <div className="space-y-lg">
          {value.navLinks.map((link, index) => (
            <div
              key={index}
              className="border border-hairline bg-surface-soft/50 p-lg flex items-end gap-lg"
            >
              <div className="flex-1">
                <Label>Label</Label>
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) =>
                    set({
                      navLinks: value.navLinks.map((l, i) =>
                        i === index ? { ...l, label: e.target.value } : l,
                      ),
                    })
                  }
                  placeholder="Programs"
                  className={fieldClass}
                />
              </div>
              <div className="flex-1">
                <Label>Link</Label>
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) =>
                    set({
                      navLinks: value.navLinks.map((l, i) =>
                        i === index ? { ...l, href: e.target.value } : l,
                      ),
                    })
                  }
                  placeholder="/programs"
                  className={fieldClass}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() =>
                    set({ navLinks: moveItem(value.navLinks, index, -1) })
                  }
                  disabled={index === 0}
                  className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  onClick={() =>
                    set({ navLinks: moveItem(value.navLinks, index, 1) })
                  }
                  disabled={index === value.navLinks.length - 1}
                  className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                >
                  Down
                </button>
                <button
                  onClick={() =>
                    set({ navLinks: value.navLinks.filter((_, i) => i !== index) })
                  }
                  className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1"
                  aria-label="Remove link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FooterSectionForm({
  value,
  onChange,
}: {
  value: FooterForm;
  onChange: (v: FooterForm) => void;
}) {
  const set = (patch: Partial<FooterForm>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Brand Name</Label>
          <input
            type="text"
            value={value.brandName}
            onChange={(e) => set({ brandName: e.target.value })}
            placeholder="e-Teaching"
            className={fieldClass}
          />
        </div>
        <div>
          <ImageUpload
            value={value.brandImage}
            onChange={(url) => set({ brandImage: url })}
            folder="site-content"
          />
        </div>
      </div>
      <div>
        <Label>Tagline</Label>
        <textarea
          rows={3}
          value={value.tagline}
          onChange={(e) => set({ tagline: e.target.value })}
          placeholder="Geometric precision in technical education..."
          className={cn(fieldClass, "resize-y")}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div>
          <Label>Portal Column Title</Label>
          <input
            type="text"
            value={value.portalTitle}
            onChange={(e) => set({ portalTitle: e.target.value })}
            placeholder="System Portals"
            className={fieldClass}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Legal Column Title</Label>
          <input
            type="text"
            value={value.legalTitle}
            onChange={(e) => set({ legalTitle: e.target.value })}
            placeholder="Legal &amp; Compliance"
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-md mb-4">
          <Label>Portal Links ({value.portals.length})</Label>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() =>
              set({ portals: [...value.portals, { label: "", href: "" }] })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Add Link
          </Button>
        </div>
        <div className="space-y-lg">
          {value.portals.map((link, index) => (
            <div
              key={index}
              className="border border-hairline bg-surface-soft/50 p-lg flex items-end gap-lg"
            >
              <div className="flex-1">
                <Label>Label</Label>
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) =>
                    set({
                      portals: value.portals.map((l, i) =>
                        i === index ? { ...l, label: e.target.value } : l,
                      ),
                    })
                  }
                  placeholder="Admin Registry"
                  className={fieldClass}
                />
              </div>
              <div className="flex-1">
                <Label>Link</Label>
                <input
                  type="text"
                  value={link.href}
                  onChange={(e) =>
                    set({
                      portals: value.portals.map((l, i) =>
                        i === index ? { ...l, href: e.target.value } : l,
                      ),
                    })
                  }
                  placeholder="/admin"
                  className={fieldClass}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    set({ portals: moveItem(value.portals, index, -1) })
                  }
                  disabled={index === 0}
                  className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  onClick={() =>
                    set({ portals: moveItem(value.portals, index, 1) })
                  }
                  disabled={index === value.portals.length - 1}
                  className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                >
                  Down
                </button>
                <button
                  onClick={() =>
                    set({ portals: value.portals.filter((_, i) => i !== index) })
                  }
                  className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1"
                  aria-label="Remove link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Legal Links (one per line)</Label>
        <textarea
          rows={4}
          value={value.legalLinksText}
          onChange={(e) => set({ legalLinksText: e.target.value })}
          placeholder={"Privacy Policy\nTerms of Service\nData Processing\nCookie Policy"}
          className={cn(fieldClass, "resize-y")}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Copyright Line</Label>
          <input
            type="text"
            value={value.copyright}
            onChange={(e) => set({ copyright: e.target.value })}
            placeholder="e-Teaching. All rights reserved."
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Credit Line</Label>
          <input
            type="text"
            value={value.credit}
            onChange={(e) => set({ credit: e.target.value })}
            placeholder="Built by ELMACHHOUNE"
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}

function ContactSectionForm({
  value,
  onChange,
}: {
  value: ContactForm;
  onChange: (v: ContactForm) => void;
}) {
  const set = (patch: Partial<ContactForm>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Eyebrow</Label>
          <input
            type="text"
            value={value.eyebrow}
            onChange={(e) => set({ eyebrow: e.target.value })}
            placeholder="GET IN TOUCH"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Title</Label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="LET&apos;S CONNECT"
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <Label>Heading</Label>
        <input
          type="text"
          value={value.heading}
          onChange={(e) => set({ heading: e.target.value })}
          placeholder="CONTACT US"
          className={fieldClass}
        />
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          rows={4}
          value={value.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="We'd love to hear from you..."
          className={cn(fieldClass, "resize-y")}
        />
      </div>
      <div>
        <ImageUpload
          value={value.image}
          onChange={(url) => set({ image: url })}
          folder="site-content"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>WhatsApp Number (digits only)</Label>
          <input
            type="text"
            value={value.whatsappNumber}
            onChange={(e) => set({ whatsappNumber: e.target.value })}
            placeholder="212649455082"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>WhatsApp Display Text</Label>
          <input
            type="text"
            value={value.whatsappDisplay}
            onChange={(e) => set({ whatsappDisplay: e.target.value })}
            placeholder="+212 649 455 082"
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <input
          type="text"
          value={value.email}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="business@example.com"
          className={fieldClass}
        />
      </div>
    </div>
  );
}

function FeaturedCoursesSectionForm({
  value,
  onChange,
}: {
  value: FeaturedCoursesForm;
  onChange: (v: FeaturedCoursesForm) => void;
}) {
  const set = (patch: Partial<FeaturedCoursesForm>) =>
    onChange({ ...value, ...patch });
  const [allCourses, setAllCourses] = useState<
    { id: string; title: string }[]
  >([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/courses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed")))
      )
      .then((data: { id: string; title: string }[]) => {
        if (!cancelled) setAllCourses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCoursesError("Could not load courses");
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleCourse(id: string) {
    const selected = value.courseIds;
    if (selected.includes(id)) {
      set({ courseIds: selected.filter((c) => c !== id) });
      return;
    }
    if (selected.length >= 3) {
      toast({
        variant: "error",
        title: "Up to 3 courses can be featured",
      });
      return;
    }
    set({ courseIds: [...selected, id] });
  }

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Eyebrow</Label>
          <input
            type="text"
            value={value.eyebrow}
            onChange={(e) => set({ eyebrow: e.target.value })}
            placeholder="FEATURED COURSES"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Heading</Label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="EXPLORE OUR PROGRAMS"
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-md mb-4">
          <Label>
            Featured Courses ({value.courseIds.length}/3)
          </Label>
          <span className="text-caption text-mute">
            Pick the courses to show on the landing page (max 3).
          </span>
        </div>

        {coursesLoading ? (
          <p className="text-body-sm text-mute">Loading courses...</p>
        ) : coursesError ? (
          <p className="text-body-sm text-error">{coursesError}</p>
        ) : allCourses.length === 0 ? (
          <p className="text-body-sm text-mute">
            No courses available yet.
          </p>
        ) : (
          <div className="border border-hairline divide-y divide-hairline">
            {allCourses.map((course) => {
              const isSelected = value.courseIds.includes(course.id);
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => toggleCourse(course.id)}
                  className="w-full flex items-center justify-between gap-md px-lg py-md text-left cursor-pointer bg-transparent border-none hover:bg-surface-soft/50 transition-colors"
                >
                  <span className="text-body-md text-ink">{course.title}</span>
                  <span
                    className={cn(
                      "shrink-0 w-5 h-5 rounded-[2px] border flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-on-primary"
                        : "border-hairline-strong bg-canvas",
                    )}
                  >
                    {isSelected && <span className="text-button-sm font-700">✓</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {value.courseIds.length === 0 && (
          <p className="text-caption text-mute mt-2">
            No courses selected — the section will show the 3 most recent
            courses.
          </p>
        )}
      </div>
    </div>
  );
}

function LoginSectionForm({
  value,
  onChange,
}: {
  value: LoginForm;
  onChange: (v: LoginForm) => void;
}) {
  const set = (patch: Partial<LoginForm>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Left Panel Eyebrow</Label>
          <input
            type="text"
            value={value.eyebrow}
            onChange={(e) => set({ eyebrow: e.target.value })}
            placeholder="E-TEACHING"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Left Panel Tagline</Label>
          <input
            type="text"
            value={value.tagline}
            onChange={(e) => set({ tagline: e.target.value })}
            placeholder="Structured learning. Measurable outcomes."
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <ImageUpload
          value={value.image}
          onChange={(url) => set({ image: url })}
          folder="site-content"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Form Heading</Label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Welcome back"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Form Subtitle</Label>
          <input
            type="text"
            value={value.subtitle}
            onChange={(e) => set({ subtitle: e.target.value })}
            placeholder="Sign in to your account"
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordSectionForm({
  value,
  onChange,
}: {
  value: ForgotPasswordForm;
  onChange: (v: ForgotPasswordForm) => void;
}) {
  const set = (patch: Partial<ForgotPasswordForm>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Left Panel Title</Label>
          <input
            type="text"
            value={value.leftTitle}
            onChange={(e) => set({ leftTitle: e.target.value })}
            placeholder="Reset Password"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Form Heading</Label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Forgot password?"
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <Label>Form Description</Label>
        <textarea
          rows={3}
          value={value.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="No worries. Enter your email and we'll send you reset instructions."
          className={cn(fieldClass, "resize-y")}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <Label>Success Heading</Label>
          <input
            type="text"
            value={value.successTitle}
            onChange={(e) => set({ successTitle: e.target.value })}
            placeholder="Check your email"
            className={fieldClass}
          />
        </div>
        <div>
          <Label>Success Description</Label>
          <input
            type="text"
            value={value.successDescription}
            onChange={(e) => set({ successDescription: e.target.value })}
            placeholder="If an account exists with that email, we've sent password reset instructions."
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}

function SectionBody({
  section,
  onChange,
}: {
  section: SectionDraft;
  onChange: (content: Record<string, unknown>) => void;
}) {
  switch (section.key) {
    case KEY_HERO:
      return (
        <HeroSectionForm
          value={section.content as unknown as HeroForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_OVERVIEW:
      return (
        <OverviewSectionForm
          value={section.content as unknown as OverviewForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_ROLES:
      return (
        <RolesSectionForm
          value={section.content as unknown as RolesForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_TECH_STACK:
      return (
        <TechStackSectionForm
          value={section.content as unknown as TechStackForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_NAVBAR:
      return (
        <NavbarSectionForm
          value={section.content as unknown as NavbarForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_FOOTER:
      return (
        <FooterSectionForm
          value={section.content as unknown as FooterForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_CONTACT:
      return (
        <ContactSectionForm
          value={section.content as unknown as ContactForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_FEATURED:
      return (
        <FeaturedCoursesSectionForm
          value={section.content as unknown as FeaturedCoursesForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_LOGIN:
      return (
        <LoginSectionForm
          value={section.content as unknown as LoginForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    case KEY_FORGOT:
      return (
        <ForgotPasswordSectionForm
          value={section.content as unknown as ForgotPasswordForm}
          onChange={(v) => onChange(v as unknown as Record<string, unknown>)}
        />
      );
    default:
      return null;
  }
}

export default function SiteContentEditor() {
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  async function loadSections() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/site-content", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load site content");
      const data = await res.json();
      const drafts: SectionDraft[] = (data.sections ?? []).map(
        (s: {
          key: string;
          label: string;
          description: string;
          content: Record<string, unknown>;
          hasStored?: boolean;
        }) => ({
          key: s.key,
          label: s.label,
          description: s.description,
          content: toSectionForm(s.key, s.content ?? {}),
          hasStored: !!s.hasStored,
        }),
      );
      setSections(drafts);
      if (activeKey === null && drafts.length > 0) setActiveKey(drafts[0].key);
    } catch {
      toast({ variant: "error", title: "Failed to load site content" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setContent(key: string, content: Record<string, unknown>) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, content } : s)),
    );
  }

  async function saveSection(section: SectionDraft) {
    if (
      section.key === KEY_TECH_STACK ||
      section.key === KEY_OVERVIEW ||
      section.key === KEY_ROLES ||
      section.key === KEY_NAVBAR ||
      section.key === KEY_FOOTER ||
      section.key === KEY_CONTACT ||
      section.key === KEY_FEATURED ||
      section.key === KEY_LOGIN ||
      section.key === KEY_FORGOT
    ) {
      const hasTitle =
        section.key === KEY_TECH_STACK
          ? Boolean(
              (
                (section.content as unknown as TechStackForm).sectionTitle || ""
              ).trim(),
            )
          : section.key === KEY_OVERVIEW
            ? Boolean(
                (
                  (section.content as unknown as OverviewForm).title || ""
                ).trim(),
              )
            : section.key === KEY_ROLES
              ? Boolean(
                  ((section.content as unknown as RolesForm).title || "").trim(),
                )
              : section.key === KEY_NAVBAR
                ? Boolean(
                    (
                      (section.content as unknown as NavbarForm).brandName || ""
                    ).trim(),
                  )
                : section.key === KEY_FOOTER
                  ? Boolean(
                      (
                        (section.content as unknown as FooterForm).brandName || ""
                      ).trim(),
                    )
                  : section.key === KEY_CONTACT
                    ? Boolean(
                        (
                          (section.content as unknown as ContactForm).title || ""
                        ).trim(),
                      )
                    : section.key === KEY_FEATURED
                      ? Boolean(
                          (
                            (section.content as unknown as FeaturedCoursesForm)
                              .title || ""
                          ).trim(),
                        )
                      : section.key === KEY_FORGOT
                        ? Boolean(
                            (
                              (section.content as unknown as ForgotPasswordForm)
                                .title || ""
                            ).trim(),
                          )
                        : Boolean(
                            (section.content as unknown as LoginForm).title || ""
                              .trim(),
                          );
      if (!hasTitle) {
        toast({
          variant: "error",
          title: "Section heading is required",
          message:
            section.key === KEY_NAVBAR || section.key === KEY_FOOTER
              ? "The brand name field is required."
              : undefined,
        });
        return;
      }
    }

    if (section.key === KEY_TECH_STACK || section.key === KEY_ROLES) {
      const cards =
        section.key === KEY_TECH_STACK
          ? (section.content as unknown as TechStackForm).cards
          : (section.content as unknown as RolesForm).cards;
      if (cards.filter((c) => c.title.trim()).length === 0) {
        toast({
          variant: "error",
          title: "At least one card with a title is required",
        });
        return;
      }
    }

    setSavingKey(section.key);
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: section.key,
          content: buildPayload(section.key, section.content),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast({
          variant: "error",
          title: "Failed to save",
          message: err.error,
        });
        return;
      }
      toast({ variant: "success", title: "Home page content saved" });
      await loadSections();
    } catch {
      toast({ variant: "error", title: "Failed to save home page content" });
    } finally {
      setSavingKey(null);
    }
  }

  function resetSection(section: SectionDraft) {
    confirm({
      title: "Reset to defaults",
      message:
        "This restores the original section content. This cannot be undone.",
      variant: "danger",
      confirmLabel: "Reset",
      async onConfirm() {
        try {
          const res = await fetch(
            `/api/admin/site-content?key=${section.key}`,
            { method: "DELETE" },
          );
          if (!res.ok) {
            const err = await res
              .json()
              .catch(() => ({ error: "Request failed" }));
            toast({
              variant: "error",
              title: "Failed to reset",
              message: err.error,
            });
            return;
          }
          toast({ variant: "success", title: "Section reset to defaults" });
          await loadSections();
        } catch {
          toast({ variant: "error", title: "Failed to reset section" });
        }
      },
    });
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="bg-canvas border border-hairline flex items-center justify-center py-xxxl">
          <div className="flex flex-col items-center gap-lg">
            <div className="animate-spin" style={{ animationDuration: "2s" }}>
              <LayoutTemplate className="w-8 h-8 text-mute" />
            </div>
            <p className="text-caption text-mute tracking-[0.1em]">
              Loading site content...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h2 className="text-heading-sm text-ink font-700">Site Content</h2>
          <p className="text-body-sm text-mute mt-xs">
            Edit text, images, and links shown on public pages. Changes publish
            immediately.
          </p>
        </div>
        <Button variant="outline-dark" size="sm" onClick={loadSections}>
          <RotateCcw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {sections.map((section) => {
        const isOpen = activeKey === section.key;
        return (
          <div key={section.key} className="bg-canvas border border-hairline">
            <button
              onClick={() => setActiveKey(isOpen ? null : section.key)}
              className="w-full flex items-center justify-between gap-md px-xxl py-lg bg-surface-soft hover:bg-surface-deep/50 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-md min-w-0">
                <LayoutTemplate className="w-5 h-5 text-ink shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-heading-sm text-ink font-700">
                      {section.label}
                    </h3>
                    {!section.hasStored && (
                      <span className="text-caption text-mute uppercase tracking-[0.1em] font-600">
                        Using defaults
                      </span>
                    )}
                  </div>
                  <p className="text-body-sm text-mute mt-xs">
                    {section.description}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-mute shrink-0 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen && (
              <div className="p-xxl space-y-xxl border-t border-hairline">
                <SectionBody
                  section={section}
                  onChange={(content) => setContent(section.key, content)}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pt-xxl border-t border-hairline">
                  <div className="text-caption text-mute tracking-[0.1em] uppercase font-600">
                    {section.hasStored
                      ? "Custom content"
                      : "Defaults in use — publish to customize"}
                  </div>
                  <div className="flex items-center gap-md">
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => resetSection(section)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" /> Reset to Defaults
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveSection(section)}
                      disabled={savingKey === section.key}
                    >
                      {savingKey === section.key ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="bg-canvas border border-hairline py-xxxl text-center">
          <p className="text-body-md text-mute">
            No configurable sections found
          </p>
        </div>
      )}
    </motion.div>
  );
}
