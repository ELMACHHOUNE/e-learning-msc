import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Layers, Clock, Calendar } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await connectToDatabase();

  const course = await Course.findById(courseId).lean();
  if (!course) notFound();

  const totalLessons = course.content.reduce(
    (sum: number, m: any) =>
      sum + m.chapters.reduce(
        (s: number, c: any) => s + (c.lessons?.length ?? 0),
        0,
      ),
    0,
  );

  return (
    <>
      <nav className="h-[60px] bg-canvas border-b border-hairline">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/images/icon.png" alt="" width={28} height={28} className="object-contain" />
            <span className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-ink">e-learning-msc</span>
          </Link>
          <Link href="/programs" className="flex items-center gap-2 text-button-sm font-bold uppercase tracking-[0.144px] text-ink no-underline hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-4 h-4" /> Back to Programs
          </Link>
        </div>
      </nav>

      {/* Hero section */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden bg-surface-dark">
        <Image
          src={course.coverImage || "/images/cover.png"}
          alt={course.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-12">
          <div className="max-w-[1440px] mx-auto px-6">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">
              Program Overview
            </p>
            <h1 className="text-display-xl text-on-dark font-bold uppercase leading-[0.95] max-w-3xl">
              {course.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-hairline bg-canvas">
        <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-mute" />
            <div>
              <p className="text-heading-sm text-ink font-700">{course.durationInMonths}</p>
              <p className="text-caption text-mute">Months</p>
            </div>
          </div>
          <div className="w-px h-8 bg-hairline" />
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-mute" />
            <div>
              <p className="text-heading-sm text-ink font-700">{course.totalSessions}</p>
              <p className="text-caption text-mute">Sessions</p>
            </div>
          </div>
          <div className="w-px h-8 bg-hairline" />
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-mute" />
            <div>
              <p className="text-heading-sm text-ink font-700">{course.content.length}</p>
              <p className="text-caption text-mute">Modules</p>
            </div>
          </div>
          <div className="w-px h-8 bg-hairline" />
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-mute" />
            <div>
              <p className="text-heading-sm text-ink font-700">{totalLessons}</p>
              <p className="text-caption text-mute">Lessons</p>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="bg-canvas py-16">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold text-ink uppercase mb-3 tracking-[0.2em]">About This Program</p>
            <p className="text-body-lg text-body leading-relaxed">{course.description}</p>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="bg-surface-soft py-16">
        <div className="max-w-[1440px] mx-auto px-6">
          <h2 className="text-heading-lg text-ink font-bold uppercase leading-[0.95] mb-10">
            Curriculum
          </h2>

          <div className="grid gap-4">
            {course.content.map((module: any, mi: number) => (
              <div key={mi} className="border border-hairline bg-canvas overflow-hidden">
                <div className="bg-surface-soft px-6 py-4 border-b border-hairline">
                  <div className="flex items-center justify-between">
                    <h3 className="text-button-md font-bold uppercase tracking-[0.144px] text-ink">
                      Module {mi + 1}: {module.title}
                    </h3>
                    <span className="text-caption text-mute">
                      {module.chapters.reduce((s: number, c: any) => s + (c.lessons?.length ?? 0), 0)} lessons
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-hairline">
                  {module.chapters.map((chapter: any, ci: number) => (
                    <div key={ci} className="px-6 py-3">
                      <p className="text-body-sm font-600 text-charcoal mb-2">
                        {chapter.title}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {chapter.lessons?.map((lesson: any, li: number) => (
                          <span
                            key={li}
                            className={`text-caption uppercase tracking-[0.08em] font-bold px-2 py-0.5 rounded-[2px] ${
                              lesson.type === "checkpoint"
                                ? "bg-warning/20 text-warning"
                                : lesson.type === "workshop"
                                  ? "bg-primary text-on-primary"
                                  : "bg-surface-soft text-charcoal"
                            }`}
                          >
                            {lesson.type === "checkpoint"
                              ? "Checkpoint"
                              : lesson.type === "workshop"
                                ? "Workshop"
                                : lesson.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-display-md font-bold uppercase leading-[0.95] text-on-primary">
              Ready to Start This Journey?
            </p>
            <p className="text-body-md text-on-primary/80 mt-4">
              {course.content.length} modules &middot; {totalLessons} lessons &middot; {course.totalSessions} sessions
            </p>
          </div>
          <a
            href="https://wa.me/212649455082?text=I%20want%20to%20enroll%20in%20the%20program:%20${encodeURIComponent(course.title)}"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-surface-dark text-on-dark text-button-md font-bold uppercase tracking-[0.144px] py-4 px-8 rounded-[2px] hover:bg-surface-deep transition-colors whitespace-nowrap h-fit no-underline shrink-0 inline-flex items-center gap-2"
          >
            Enroll via WhatsApp
          </a>
        </div>
      </section>

      <footer className="bg-surface-dark border-t border-divider-dark pt-16 pb-8 px-6">
        <div className="max-w-[1440px] mx-auto">
          <div className="border-t border-divider-dark pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-zinc-500 font-normal">
              &copy; {new Date().getFullYear()} e-learning-msc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}