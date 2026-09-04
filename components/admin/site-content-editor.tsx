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

interface SectionDraft {
  key: string;
  label: string;
  description: string;
  content: TechStackForm;
  hasStored: boolean;
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

function moveCard(cards: CardForm[], index: number, dir: -1 | 1): CardForm[] {
  const next = [...cards];
  const target = index + dir;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
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
      const drafts: SectionDraft[] = (data.sections ?? [])
        .filter((s: { key: string }) => s.key === "home.tech_stack")
        .map(
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
            content: toTechStackForm(s.content ?? {}),
            hasStored: !!s.hasStored,
          }),
        );
      setSections(drafts);
      if (!activeKey && drafts.length > 0) setActiveKey(drafts[0].key);
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

  function updateSection(key: string, next: Partial<TechStackForm>) {
    setSections((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, content: { ...s.content, ...next } } : s,
      ),
    );
  }

  function updateCard(
    section: SectionDraft,
    index: number,
    patch: Partial<CardForm>,
  ) {
    updateSection(section.key, {
      cards: section.content.cards.map((c, i) =>
        i === index ? { ...c, ...patch } : c,
      ),
    });
  }

  async function saveSection(section: SectionDraft) {
    if (!section.content.sectionTitle.trim()) {
      toast({ variant: "error", title: "Section title is required" });
      return;
    }
    const validCards = section.content.cards.filter((c) => c.title.trim());
    if (validCards.length === 0) {
      toast({
        variant: "error",
        title: "At least one card with a title is required",
      });
      return;
    }
    setSavingKey(section.key);
    try {
      const payload = {
        key: section.key,
        content: {
          sectionEyebrow: section.content.sectionEyebrow.trim(),
          sectionTitle: section.content.sectionTitle.trim(),
          cards: validCards.map((c) => ({
            title: c.title.trim(),
            description: c.description.trim(),
            src: c.src.trim(),
            ctaText: c.ctaText.trim() || "Learn More",
            ctaLink: c.ctaLink.trim(),
            content: c.contentText
              .split(/\n+/)
              .map((p) => p.trim())
              .filter(Boolean),
          })),
        },
      };
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        const saved = section.hasStored;
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
                    {!saved && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <div>
                    <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                      Section Eyebrow
                    </label>
                    <input
                      type="text"
                      value={section.content.sectionEyebrow}
                      onChange={(e) =>
                        updateSection(section.key, {
                          sectionEyebrow: e.target.value,
                        })
                      }
                      placeholder="TECHNOLOGY STACK"
                      className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={section.content.sectionTitle}
                      onChange={(e) =>
                        updateSection(section.key, {
                          sectionTitle: e.target.value,
                        })
                      }
                      placeholder="BUILT WITH MODERN TECHNOLOGIES"
                      className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-md mb-4">
                    <label className="text-caption text-mute uppercase tracking-[0.1em] font-600">
                      Technology Cards ({section.content.cards.length})
                    </label>
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() =>
                        updateSection(section.key, {
                          cards: [...section.content.cards, emptyCard()],
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Card
                    </Button>
                  </div>

                  <div className="space-y-lg">
                    {section.content.cards.map((card, index) => (
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
                                updateSection(section.key, {
                                  cards: moveCard(
                                    section.content.cards,
                                    index,
                                    -1,
                                  ),
                                })
                              }
                              disabled={index === 0}
                              className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                            >
                              Up
                            </button>
                            <button
                              onClick={() =>
                                updateSection(section.key, {
                                  cards: moveCard(
                                    section.content.cards,
                                    index,
                                    1,
                                  ),
                                })
                              }
                              disabled={
                                index === section.content.cards.length - 1
                              }
                              className="bg-transparent border border-hairline-strong text-mute hover:text-ink rounded-[2px] text-button-sm font-bold uppercase px-2 py-1 cursor-pointer disabled:opacity-40"
                            >
                              Down
                            </button>
                            <button
                              onClick={() => {
                                if (section.content.cards.length <= 1) {
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
                                    updateSection(section.key, {
                                      cards: section.content.cards.filter(
                                        (_, i) => i !== index,
                                      ),
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
                            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                              Title
                            </label>
                            <input
                              type="text"
                              value={card.title}
                              onChange={(e) =>
                                updateCard(section, index, {
                                  title: e.target.value,
                                })
                              }
                              placeholder="Next.js 16"
                              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
                            />
                          </div>
                          <div>
                            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                              Short Description
                            </label>
                            <input
                              type="text"
                              value={card.description}
                              onChange={(e) =>
                                updateCard(section, index, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Full-stack Framework"
                              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                            <div>
                              <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                                CTA Label
                              </label>
                              <input
                                type="text"
                                value={card.ctaText}
                                onChange={(e) =>
                                  updateCard(section, index, {
                                    ctaText: e.target.value,
                                  })
                                }
                                placeholder="Learn More"
                                className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
                              />
                            </div>
                            <div>
                              <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                                CTA Link
                              </label>
                              <input
                                type="url"
                                value={card.ctaLink}
                                onChange={(e) =>
                                  updateCard(section, index, {
                                    ctaLink: e.target.value,
                                  })
                                }
                                placeholder="https://nextjs.org"
                                className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-lg">
                          <ImageUpload
                            value={card.src}
                            onChange={(url) =>
                              updateCard(section, index, { src: url })
                            }
                            folder="site-content"
                          />
                        </div>

                        <div className="mt-lg">
                          <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                            Expanded Body (one paragraph per line)
                          </label>
                          <textarea
                            rows={6}
                            value={card.contentText}
                            onChange={(e) =>
                              updateCard(section, index, {
                                contentText: e.target.value,
                              })
                            }
                            placeholder={
                              "React is the industry-standard library for building user interfaces.\n\nThis platform leverages React's component model..."
                            }
                            className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink resize-y"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pt-xxl border-t border-hairline">
                  <div className="text-caption text-mute tracking-[0.1em] uppercase font-600">
                    {saved
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
