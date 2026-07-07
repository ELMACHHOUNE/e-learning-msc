import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-lg w-full">
        <Image
          src="/images/icon.png"
          alt=""
          width={80}
          height={80}
          className="object-contain mb-10"
        />
        <p className="text-[10px] font-bold text-ink uppercase tracking-[0.2em] mb-4">
          404 — Page Not Found
        </p>
        <h1 className="text-display-lg text-ink font-bold uppercase leading-[0.95] mb-4">
          Page Not Found
        </h1>
        <p className="text-body-md text-mute leading-[1.6] mb-10">
          The page you are looking for does not exist or has been moved to a new location.
        </p>
        <Link
          href="/"
          className="inline-flex bg-primary text-on-primary text-button-md font-bold uppercase tracking-[0.144px] py-3.5 px-8 rounded-[2px] hover:bg-primary-deep transition-colors no-underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
