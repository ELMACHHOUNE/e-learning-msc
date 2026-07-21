"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useOutsideClick } from "@/hooks/use-outside-click";

export default function ExpandableCardDemo() {
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
                    {typeof active.content === "function"
                      ? active.content()
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

const cards = [
  {
    description: "Full-stack Framework",
    title: "Next.js 16",
    src: "/images/cover.png",
    ctaText: "Learn More",
    ctaLink: "https://nextjs.org",
    content: () => {
      return (
        <p>
          Next.js is the leading React framework for production-grade
          applications. It provides server-side rendering, static site
          generation, and API routes all in one unified framework. With the App
          Router, it offers a powerful paradigm for building modern web
          applications with React Server Components, streaming, and partial
          prerendering. The framework powers this entire platform, handling
          routing, data fetching, and rendering with precision.
        </p>
      );
    },
  },
  {
    description: "User Interface Library",
    title: "React 19",
    src: "/images/cover.png",
    ctaText: "Learn More",
    ctaLink: "https://react.dev",
    content: () => {
      return (
        <p>
          React is the industry-standard library for building user interfaces.
          Version 19 introduces enhanced concurrent features, improved server
          components, and a streamlined hook API. This platform leverages
          React&apos;s component model to create a cohesive, maintainable UI
          architecture where each piece—from navigation to course cards—is a
          reusable building block.
        </p>
      );
    },
  },
  {
    description: "Static Typing",
    title: "TypeScript 6",
    src: "/images/cover.png",
    ctaText: "Learn More",
    ctaLink: "https://typescriptlang.org",
    content: () => {
      return (
        <p>
          TypeScript brings static type checking to JavaScript, catching errors
          at compile time rather than runtime. This codebase is fully typed,
          ensuring that data flows predictably between components, models, and
          API routes. TypeScript 6 offers faster compilation, improved type
          inference, and richer editor tooling—making the development experience
          both safer and more productive.
        </p>
      );
    },
  },
  {
    description: "Utility-first CSS",
    title: "Tailwind CSS v4",
    src: "/images/cover.png",
    ctaText: "Learn More",
    ctaLink: "https://tailwindcss.com",
    content: () => {
      return (
        <p>
          Tailwind CSS is a utility-first framework that enables rapid UI
          development without leaving your HTML. Version 4 introduces a
          CSS-first configuration model using the `@theme` directive,
          eliminating the need for a separate JavaScript config file. Every
          component on this platform is styled with Tailwind utilities, ensuring
          consistency, responsiveness, and a clean, geometric aesthetic.
        </p>
      );
    },
  },
  {
    description: "Database & ODM",
    title: "MongoDB & Mongoose",
    src: "/images/cover.png",
    ctaText: "Learn More",
    ctaLink: "https://mongoosejs.com",
    content: () => {
      return (
        <p>
          MongoDB provides a flexible, document-oriented database that scales
          naturally with the platform&apos;s data model. Mongoose acts as the ODM
          layer, enforcing schema validation and providing a rich query API.
          Together they power the course catalog, user management, attendance
          tracking, and project submission pipelines that form the backbone of
          this educational platform.
        </p>
      );
    },
  },
];
