import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { safeUrl } from "@/lib/utils";
import type { INavbarSection } from "@/types";

type SiteNavbarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function SiteNavbar({
  user,
  section,
}: {
  user?: SiteNavbarUser;
  section: INavbarSection;
}) {
  return (
    <nav className="h-[60px] bg-canvas border-b border-hairline">
      <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src={section.brandImage || "/images/icon.png"}
            alt={section.brandName || "e-Teaching"}
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-ink">
            {section.brandName || "e-Teaching"}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {section.navLinks.map((item) => (
            <Link
              key={item.href}
              href={safeUrl(item.href) || "/programs"}
              className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-ink no-underline hover:opacity-70 transition-opacity"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 border border-hairline-strong bg-canvas text-ink text-xs uppercase font-bold py-2 px-4 rounded-[2px] no-underline hover:bg-surface-soft transition-colors"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center font-700 text-button-sm text-on-primary">
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
              )}
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-ink no-underline hover:opacity-70 transition-opacity"
              >
                <User className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="border border-hairline-strong bg-canvas text-ink text-xs uppercase font-bold py-2 px-4 rounded-[2px] no-underline hover:bg-surface-soft transition-colors"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}