"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import type { ILoginSection } from "@/types";

export function LoginForm({ section }: { section: ILoginSection }) {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") return null;
  if (status === "authenticated") return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-lg">
      <div className="flex w-full max-w-2xl items-center justify-center px-2">
        <div className="w-full">
          <Link
            href="/"
            className="hidden lg:inline-flex items-center gap-1.5 text-caption text-mute hover:text-ink no-underline mb-lg transition-colors"
          >
            &larr; Back to home
          </Link>

          <h1 className="text-display-md text-ink font-bold uppercase leading-[0.95] mb-1">
            {section.title}
          </h1>
          <p className="text-body-md text-mute mb-lg">{section.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {error && (
              <div className="p-sm bg-error/10 border border-error/20">
                <p className="text-body-sm text-error font-medium">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-caption font-bold text-charcoal mb-sm uppercase tracking-[0.06em]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full h-11 bg-canvas text-ink text-body-md px-0 border-b border-ink focus:outline-none focus:border-primary transition-colors placeholder:text-stone"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-caption font-bold text-charcoal mb-sm uppercase tracking-[0.06em]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="w-full h-11 bg-canvas text-ink text-body-md px-0 border-b border-ink focus:outline-none focus:border-primary transition-colors placeholder:text-stone"
              />
              <div className="text-right mt-1">
                <Link
                  href="/forgot-password"
                  className="text-caption font-medium text-ink underline hover:no-underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-sm pt-2">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="h-11 border border-ink bg-canvas text-ink text-caption font-bold uppercase tracking-[0.06em] hover:bg-surface-soft transition-colors cursor-pointer"
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                className="h-11 border border-ink bg-canvas text-ink text-caption font-bold uppercase tracking-[0.06em] hover:bg-surface-soft transition-colors cursor-pointer"
              >
                GitHub
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-on-primary text-button-sm font-bold uppercase tracking-[0.08em] hover:bg-primary-deep transition-colors disabled:opacity-50 cursor-pointer border-none"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
