import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center px-6 text-center">
      <Image
        src="/images/icon.png"
        alt="e-learning-msc"
        width={96}
        height={96}
        className="object-contain brightness-0 invert mb-10"
      />
      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">
        Error 404
      </p>
      <h1 className="text-[64px] md:text-[96px] font-bold uppercase leading-[0.9] text-on-dark tracking-[-0.02em] mb-6">
        Not Found
      </h1>
      <p className="text-[16px] text-on-dark-mute font-normal leading-[1.6] max-w-md mb-10">
        The requested resource does not exist within the platform architecture.
        Please verify the URL or return to the home page.
      </p>
      <Link
        href="/"
        className="inline-flex bg-primary text-on-primary text-[14.4px] font-bold uppercase tracking-[0.144px] py-4 px-10 rounded-[2px] hover:bg-primary-deep transition-colors no-underline"
      >
        Return Home
      </Link>
    </div>
  );
}
