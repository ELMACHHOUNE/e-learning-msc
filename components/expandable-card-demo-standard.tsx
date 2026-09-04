"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import type { ITechStackCard } from "@/types";

type ExpandableCard = ITechStackCard;

export default function ExpandableCardDemo({
  cards,
}: {
  cards: ExpandableCard[];
}) {
  const [active, setActive] = useState<(typeof cards)[number] | boolean | null>(
    null,
  );
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-6">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.05 },
              }}
              className="flex absolute top-4 right-4 items-center justify-center bg-ink text-on-dark h-8 w-8 hover:opacity-70 transition-opacity"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[600px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-canvas border border-hairline overflow-hidden"
            >
              <motion.div layoutId={`image-${active.title}-${id}`}>
                <img
                  width={600}
                  height={338}
                  src={active.src}
                  alt={active.title}
                  className="w-full aspect-[16/9] object-cover"
                />
              </motion.div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="text-heading-sm text-ink font-700 uppercase leading-[1]"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="text-body-sm text-mute mt-1"
                    >
                      {active.description}
                    </motion.p>
                  </div>

                  <motion.a
                    layoutId={`button-${active.title}-${id}`}
                    href={active.ctaLink}
                    target="_blank"
                    className="bg-primary-deep text-on-primary text-button-md font-bold uppercase tracking-[0.144px] py-3 px-6 hover:opacity-70 transition-opacity no-underline"
                  >
                    {active.ctaText}
                  </motion.a>
                </div>
                <div className="relative">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-body-md text-body leading-[1.4] h-40 md:h-fit pb-10 overflow-auto [mask:linear-gradient(to_bottom,black,black,transparent)] [scrollbar-width:none]"
                  >
                    {Array.isArray(active.content)
                      ? active.content.map((paragraph, i) => (
                          <p key={i} className={i > 0 ? "mt-4" : ""}>
                            {paragraph}
                          </p>
                        ))
                      : active.content}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.title}-${id}`}
            key={`card-${card.title}-${id}`}
            onClick={() => setActive(card)}
            className="border border-hairline bg-canvas flex flex-col group hover:border-ink transition-colors cursor-pointer"
          >
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-surface-soft">
              <motion.div layoutId={`image-${card.title}-${id}`}>
                <img
                  width={400}
                  height={225}
                  src={card.src}
                  alt={card.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <motion.h3
                layoutId={`title-${card.title}-${id}`}
                className="text-heading-sm text-ink font-700 uppercase leading-[1] mb-2"
              >
                {card.title}
              </motion.h3>
              <motion.p
                layoutId={`description-${card.description}-${id}`}
                className="text-body-sm text-mute mb-4"
              >
                {card.description}
              </motion.p>
              <div className="inline-flex items-center gap-2 text-button-md font-bold uppercase tracking-[0.144px] text-ink group-hover:opacity-70 transition-opacity mt-auto">
                View Details <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.05 },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
