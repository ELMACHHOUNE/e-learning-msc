import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";

export default async function ProgramsPage() {
  const session = await auth();
  await connectToDatabase();
  const courses = await Course.find().sort({ createdAt: -1 }).lean();

  return (
    <>
      <nav className="h-[60px] bg-canvas border-b border-hairline">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/images/icon.png" alt="" width={28} height={28} className="object-contain" />
            <span className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-ink">e-learning-msc</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/programs" className="text-[14.4px] font-bold uppercase tracking-[0.144px] text-ink no-underline hover:opacity-70 transition-opacity">
              Programs
            </Link>
          </div>
          {session?.user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 border border-hairline-strong bg-canvas text-ink text-xs uppercase font-bold py-2 px-4 rounded-[2px] no-underline hover:bg-surface-soft transition-colors"
            >
              {session.user.image ? (
                <Image src={session.user.image} alt="" width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center font-700 text-button-sm text-on-primary">
                  {session.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
              )}
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="border border-hairline-strong bg-canvas text-ink text-xs uppercase font-bold py-2 px-4 rounded-[2px] no-underline hover:bg-surface-soft transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      <section className="relative h-[70vh] min-h-[500px] overflow-hidden bg-surface-dark">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/coding.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/40 to-transparent" />
        <div className="absolute bottom-16 left-0 right-0 z-10">
          <div className="max-w-[1440px] mx-auto px-6">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">
              Available Programs
            </p>
            <h1 className="text-display-lg text-on-dark font-bold uppercase leading-[0.95] max-w-2xl">
              Choose Your Engineering Pathway
            </h1>
          </div>
        </div>
      </section>

      <section className="bg-canvas py-20">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const id = course._id.toString()
              return (
                <Link
                  key={id}
                  href={`/programs/${id}`}
                  className="group border border-hairline overflow-hidden no-underline hover:border-ink transition-colors"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-surface-soft">
                    <Image
                      src={course.coverImage || "/images/cover.png"}
                      alt={course.title}
                      width={600}
                      height={375}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-heading-sm text-ink font-bold uppercase leading-[0.95] mb-2">
                      {course.title}
                    </h3>
                    <p className="text-body-sm text-mute leading-[1.6] mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-caption text-charcoal">
                      <span>{course.durationInMonths} months</span>
                      <span className="w-px h-3 bg-hairline" />
                      <span>{course.totalSessions} sessions</span>
                      <span className="w-px h-3 bg-hairline" />
                      <span>{course.content.length} modules</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
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