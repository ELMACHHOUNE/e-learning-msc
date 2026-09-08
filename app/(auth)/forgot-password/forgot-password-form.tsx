"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { IForgotPasswordSection } from "@/types";

export function ForgotPasswordForm({
  section,
}: {
  section: IForgotPasswordSection;
}) {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-xl bg-canvas">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-2xl"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-body-sm text-mute hover:text-ink no-underline mb-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {!submitted ? (
          <>
            <h2 className="text-heading-lg text-ink font-bold mb-xs">
              {section.title}
            </h2>
            <p className="text-body-md text-mute mb-xxl">
              {section.description}
            </p>

            <form onSubmit={handleSubmit} className="space-y-lg">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                required
              />

              <Button type="submit" variant="primary" className="w-full">
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-heading-lg text-ink font-bold mb-xs">
              {section.successTitle}
            </h2>
            <p className="text-body-md text-mute mb-xxl">
              {section.successDescription}
            </p>
            <Button
              type="button"
              variant="outline-dark"
              className="w-full"
              onClick={() => setSubmitted(false)}
            >
              Send again
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
