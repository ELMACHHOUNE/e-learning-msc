import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, Terminal, MessageSquare, User } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      <ComponentA_NavBar />
      <ComponentB_Hero />
      <ComponentB1_ElearningSection />
      <ComponentC_Capabilities />
      <ComponentD_Accent />
      <ComponentE_Footer />
      <ComponentF_SupportWidget />
    </>
  );
}

function ComponentA_NavBar() {
  return (
    <nav className="h-[60px] bg-canvas border-b border-hairline">
      <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src="/images/icon.png"
            alt="e-learning-msc"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-ink">
            e-learning-msc
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Modeller", "Hizmetler", "MyRenault Framework"].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-ink no-underline hover:opacity-70 transition-opacity"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </nav>
  );
}

function ComponentB_Hero() {
  return (
    <section className="relative min-h-screen flex items-end justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/cover.png"
          alt="Platform workspace UI"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/60 to-transparent" />
      </div>
      <div className="relative z-10 text-center pb-16 md:pb-20">
        <Link
          href="#elearning"
          className="inline-flex bg-primary text-on-primary text-[14.4px] font-bold uppercase tracking-[0.144px] py-4 px-10 rounded-[2px] hover:bg-primary-deep transition-colors no-underline"
        >
          Explore the Platform
        </Link>
      </div>
    </section>
  );
}

function ComponentB1_ElearningSection() {
  return (
    <section id="elearning" className="bg-canvas py-20 md:py-28">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <div className="w-full md:w-[30%] shrink-0 flex justify-center">
            <Image
              src="/images/icon.png"
              alt="e-learning-msc icon"
              width={240}
              height={240}
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-ink uppercase mb-3 tracking-[0.2em]">
              PLATFORM OVERVIEW
            </p>
            <h2 className="text-3xl md:text-[40px] font-bold uppercase leading-[0.95] tracking-normal text-ink mb-6">
              STRUCTURED LEARNING. MEASURABLE OUTCOMES.
            </h2>
            <p className="text-[18px] font-normal leading-[1.6] text-body max-w-[600px]">
              e-learning-msc delivers a disciplined, three-role architecture for
              technical education. Administrators define programs with
              precision. Instructors execute curriculum through live cohort
              tracking, attendance logging, and milestone validation. Students
              progress through modular pathways with clear metrics at every
              stage.
            </p>
            <div className="flex items-center gap-6 mt-8">
              <div>
                <p className="text-display-md text-ink font-bold leading-[0.95]">
                  3
                </p>
                <p className="text-caption text-mute mt-1">Platform Roles</p>
              </div>
              <div className="w-px h-10 bg-hairline" />
              <div>
                <p className="text-display-md text-ink font-bold leading-[0.95]">
                  194
                </p>
                <p className="text-caption text-mute mt-1">Sessions</p>
              </div>
              <div className="w-px h-10 bg-hairline" />
              <div>
                <p className="text-display-md text-ink font-bold leading-[0.95]">
                  12
                </p>
                <p className="text-caption text-mute mt-1">Modules</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComponentC_Capabilities() {
  return (
    <section className="bg-surface-dark py-20">
      <div className="max-w-[1440px] mx-auto px-6">
        <h2 className="text-3xl md:text-[40px] font-bold uppercase leading-[0.95] tracking-normal text-on-dark mb-12">
          ROLE CONFIGURATOR &amp; MANAGEMENT
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-divider-dark">
          <div className="bg-surface-deep p-8 border-r-0 md:border-r border-b md:border-b-0 border-divider-dark">
            <ShieldAlert className="w-8 h-8 text-on-dark mb-4" />
            <h3 className="text-2xl font-bold uppercase text-on-dark mb-4 leading-[0.95]">
              Admin Layer
            </h3>
            <p className="text-[16px] font-normal leading-[1.4] text-on-dark-mute">
              Create and manage student and instructor accounts. Craft courses
              with defined durations, map session volumes, and compose nested
              module schemas. Assign students into Guild groupings and designate
              primary instructors — all from a single command surface.
            </p>
          </div>

          <div className="bg-surface-dark p-8">
            <Terminal className="w-8 h-8 text-on-dark mb-4" />
            <h3 className="text-2xl font-bold uppercase text-on-dark mb-4 leading-[0.95]">
              Instructor Console
            </h3>
            <p className="text-[16px] font-normal leading-[1.4] text-on-dark-mute">
              Track students through a high-performance matrix interface.
              Oversee LabPhase progression, validate project submissions at
              milestone checkpoints, and run live attendance panels per session.
              One-to-one booking and earnings analytics complete the command
              suite.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComponentD_Accent() {
  return (
    <section className="bg-primary py-16 px-6 md:px-24 rounded-none">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="max-w-2xl">
          <p className="text-[24px] md:text-[32px] font-bold uppercase leading-[0.95] text-on-primary">
            FEATURED SYLLABUS: 15-MONTH SOFTWARE ENGINEERING PATHWAY.
          </p>
          <p className="text-[16px] font-normal leading-[1.4] text-on-primary/80 mt-4">
            194 sessions across 12 modules &middot; 3 Guild tracks &middot;
            Full-stack frontend to DevOps &middot; Real-time progress analytics
          </p>
        </div>
        <Link
          href="/courses"
          className="bg-surface-dark text-on-dark text-[14.4px] font-bold uppercase tracking-[0.144px] py-4 px-8 rounded-[2px] hover:bg-surface-deep transition-colors whitespace-nowrap h-fit no-underline shrink-0"
        >
          View Syllabus
        </Link>
      </div>
    </section>
  );
}

function ComponentE_Footer() {
  return (
    <footer className="bg-surface-dark border-t border-divider-dark pt-16 pb-8 px-6">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/icon.png"
                alt="e-learning-msc"
                width={28}
                height={28}
                className="object-contain brightness-0 invert opacity-80"
              />
              <span className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-on-dark">
                e-learning-msc
              </span>
            </div>
            <p className="text-[14px] font-normal leading-[1.57] text-on-dark-mute">
              Geometric precision in technical education. Built for
              administrators, instructors, and students who demand structure.
            </p>
          </div>

          <div>
            <h4 className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-on-dark mb-4">
              System Portals
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Admin Registry", href: "/admin" },
                { label: "Instructor Console", href: "/dashboard" },
                { label: "Student Workspace", href: "/courses" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-on-dark-mute hover:text-on-dark no-underline transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-on-dark mb-4">
              Legal &amp; Compliance
            </h4>
            <ul className="space-y-2">
              {[
                "Privacy Policy",
                "Terms of Service",
                "Data Processing",
                "Cookie Policy",
              ].map((item) => (
                <li key={item}>
                  <span className="text-[14px] text-on-dark-mute cursor-default">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-divider-dark mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-zinc-500 font-normal">
            &copy; {new Date().getFullYear()} e-learning-msc. All rights
            reserved.
          </p>
          <p className="text-[12px] text-zinc-500 font-normal">
            Designed with structural precision.
          </p>
        </div>
      </div>
    </footer>
  );
}

function ComponentF_SupportWidget() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        className="rounded-full h-12 w-12 bg-surface-dark border border-divider-dark flex items-center justify-center text-on-dark shadow-md hover:bg-surface-deep transition-all cursor-pointer"
        aria-label="Open support chat"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    </div>
  );
}
