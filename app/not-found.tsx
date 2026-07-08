import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="relative overflow-hidden border-b border-hairline-strong bg-surface-dark text-on-dark">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,237,0,0.22),transparent_42%),radial-gradient(circle_at_85%_70%,rgba(255,255,255,0.1),transparent_35%)]" />
        <div className="relative max-w-360 mx-auto px-6 py-8 md:py-12 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 no-underline text-on-dark"
          >
            <Image
              src="/images/icon.png"
              alt="e-learning-msc"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-button-md font-700 uppercase tracking-[0.144px]">
              e-learning-msc
            </span>
          </Link>
          <p className="text-caption uppercase tracking-[0.18em] text-on-dark-mute">
            Error 404
          </p>
        </div>
      </section>

      <section className="max-w-360 mx-auto px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] border border-hairline-strong">
          <div className="bg-canvas p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-hairline">
            <p className="text-overline uppercase tracking-[0.2em] text-mute mb-4">
              Navigation Failure
            </p>
            <h1 className="text-display-lg md:text-display-xl font-700 leading-[0.95] uppercase mb-4">
              We Could Not Find This Page
            </h1>
            <p className="text-[18px] font-normal leading-[1.6] text-body max-w-150">
              The URL may be outdated, the page might have moved, or access may
              no longer be available from this route.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary text-button-md font-700 uppercase tracking-[0.144px] px-6 py-3 rounded-xs no-underline hover:bg-primary-deep transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 border border-hairline-strong bg-canvas text-ink text-button-md font-700 uppercase tracking-[0.144px] px-6 py-3 rounded-xs no-underline hover:bg-surface-soft transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
            </div>
          </div>

          <aside className="bg-surface-soft p-8 md:p-12 flex flex-col justify-between">
            <div>
              <p className="text-display-xl font-700 leading-[0.9] text-ink/15 select-none">
                404
              </p>
              <h2 className="text-heading-lg font-700 uppercase leading-[0.95] mt-4">
                Quick Recovery
              </h2>
              <ul className="mt-4 space-y-2 text-body-md text-charcoal">
                <li>Check the URL spelling in your browser bar.</li>
                <li>Use the top navigation to return to a known section.</li>
                <li>
                  If this keeps happening, contact support from the chat button.
                </li>
              </ul>
            </div>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 text-button-md font-700 uppercase tracking-[0.144px] text-ink no-underline hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Safety
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
