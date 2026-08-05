"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui";
import LogoSpinner from "@/components/shared/logo-spinner";
import { CertificateDialog } from "@/components/certificate/certificate-dialog";
import type { CertificateData } from "@/types/certificate";
import {
  Users,
  BookOpen,
  Layers,
  ArrowUpRight,
  GraduationCap,
  BarChart3,
  Award,
} from "lucide-react";
import {
  UsersByRoleChart,
  CoursesByCategoryChart,
  CourseStatusChart,
  GuildsByCourseChart,
} from "@/components/dashboard/admin-charts";

interface DashboardData {
  role: string;
  stats: Record<string, number>;
  charts?: {
    usersByRole: { name: string; value: number }[];
    coursesByCategory: { name: string; count: number }[];
    courseStatus: { name: string; value: number }[];
    guildsByCourse: { name: string; value: number }[];
  };
  recentUsers?: { id: string; name: string; email: string; role: string }[];
  recentGuilds?: {
    id: string;
    name: string;
    courseTitle: string;
    instructorName: string;
    studentCount: number;
  }[];
  guilds?: {
    id: string;
    name: string;
    courseTitle: string;
    currentSession: number;
    totalSessions: number;
    skillsTotal: number;
    skillsAchieved: number;
    studentCount?: number;
    instructorName?: string;
  }[];
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const forceStudent = searchParams.get("view") === "student";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LogoSpinner />;

  if (forceStudent || data?.role === "student")
    return <StudentDashboard data={data!} />;
  if (data?.role === "admin") return <AdminDashboard data={data} />;
  if (data?.role === "instructor") return <InstructorDashboard data={data} />;
  return <StudentDashboard data={data!} />;
}

function AdminDashboard({ data }: { data: DashboardData }) {
  const statCards = [
    {
      label: "Total Users",
      value: data.stats.totalUsers,
      icon: Users,
      href: "/admin",
      color: "bg-primary",
    },
    {
      label: "Instructors",
      value: data.stats.totalInstructors,
      icon: GraduationCap,
      href: "/admin",
      color: "bg-info",
    },
    {
      label: "Students",
      value: data.stats.totalStudents,
      icon: Users,
      href: "/admin",
      color: "bg-success",
    },
    {
      label: "Courses",
      value: data.stats.totalCourses,
      icon: BookOpen,
      href: "/admin",
      color: "bg-warning",
    },
    {
      label: "Guilds",
      value: data.stats.totalGuilds,
      icon: Layers,
      href: "/admin",
      color: "bg-error",
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">
            Admin Dashboard
          </h1>
          <p className="text-body-md text-mute mt-sm">
            Manage users, courses, and guild assignments
          </p>
        </div>
        <Badge variant="new">Admin Access</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-lg mb-xxl">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="no-underline">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-canvas border border-hairline p-xl hover:border-ink transition-colors"
              >
                <div
                  className={`w-10 h-10 ${stat.color} text-on-primary flex items-center justify-center mb-md`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">
                  {stat.value}
                </p>
                <p className="text-body-sm text-mute">{stat.label}</p>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {data.charts && (
        <section className="mb-xxl">
          <div className="flex items-center gap-2 mb-lg">
            <BarChart3 className="w-4 h-4 text-mute" />
            <h2 className="text-heading-sm text-ink font-700">Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <UsersByRoleChart data={data.charts.usersByRole} />
            <CoursesByCategoryChart data={data.charts.coursesByCategory} />
            <CourseStatusChart data={data.charts.courseStatus} />
            <GuildsByCourseChart data={data.charts.guildsByCourse} />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mt-xxl">
        <Link href="/admin" className="no-underline">
          <div className="bg-canvas border border-hairline p-xl flex items-center gap-lg hover:border-ink transition-colors">
            <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-heading-xs text-ink font-700">
                User Management
              </p>
              <p className="text-caption text-mute">
                Create, edit, and manage all accounts
              </p>
            </div>
          </div>
        </Link>
        <Link href="/admin" className="no-underline">
          <div className="bg-canvas border border-hairline p-xl flex items-center gap-lg hover:border-ink transition-colors">
            <div className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-heading-xs text-ink font-700">
                Course Creator
              </p>
              <p className="text-caption text-mute">
                Design and manage course content
              </p>
            </div>
          </div>
        </Link>
        <Link href="/admin" className="no-underline">
          <div className="bg-canvas border border-hairline p-xl flex items-center gap-lg hover:border-ink transition-colors">
            <div className="w-12 h-12 bg-success text-on-primary flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-heading-xs text-ink font-700">
                Guild Assignment
              </p>
              <p className="text-caption text-mute">
                Assign courses &amp; instructors to guilds
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function InstructorDashboard({ data }: { data: DashboardData }) {
  const statCards = [
    { label: "My Guilds", value: data.stats.totalGuilds, icon: Layers },
    { label: "My Students", value: data.stats.totalStudents, icon: Users },
    {
      label: "Total Sessions",
      value: data.stats.totalSessions,
      icon: BookOpen,
    },
    { label: "Courses", value: data.stats.totalCourses, icon: GraduationCap },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">
            Instructor Dashboard
          </h1>
          <p className="text-body-sm text-mute mt-sm">
            Track your guilds, students, and sessions
          </p>
        </div>
        <Badge variant="info">Instructor View</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xxl">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-canvas border border-hairline p-xl"
            >
              <div className="flex items-center justify-between mb-md">
                <Icon className="w-5 h-5 text-mute" />
              </div>
              <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">
                {stat.value}
              </p>
              <p className="text-body-sm text-mute">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <section>
        <div className="flex items-center justify-between mb-lg">
          <h2 className="text-heading-sm text-ink font-700">My Guilds</h2>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-button-md text-ink underline no-underline"
          >
            View Courses <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid gap-lg">
          {(data.guilds ?? []).map((guild, i) => (
            <motion.div
              key={guild.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-canvas border border-hairline p-xxl"
            >
              <div className="flex items-center justify-between mb-lg">
                <h3 className="text-heading-sm text-ink font-700">
                  {guild.name}
                </h3>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-body-sm text-mute mb-lg">
                {guild.courseTitle} &middot; {guild.studentCount} students
              </p>
              <div className="mb-lg">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-body-sm text-charcoal">
                    Session {guild.currentSession}/{guild.totalSessions}
                  </span>
                  <span className="text-body-sm text-charcoal">
                    {guild.totalSessions > 0
                      ? Math.round(
                          (guild.currentSession / guild.totalSessions) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 bg-surface-soft rounded-none">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${guild.totalSessions > 0 ? (guild.currentSession / guild.totalSessions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              {guild.skillsTotal > 0 && (
                <div className="mb-lg">
                  <div className="flex items-center justify-between mb-sm">
                    <span className="text-body-sm text-charcoal">
                      Skills: {guild.skillsAchieved} of {guild.skillsTotal}
                    </span>
                    <span className="text-body-sm text-success">
                      {Math.round(
                        (guild.skillsAchieved / guild.skillsTotal) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-surface-soft rounded-none">
                    <div
                      className="h-full bg-success transition-all"
                      style={{
                        width: `${(guild.skillsAchieved / guild.skillsTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <Link
                href={`/courses/${guild.id}`}
                className="text-button-md text-ink underline no-underline hover:opacity-70 transition-opacity"
              >
                View Details
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StudentDashboard({ data }: { data: DashboardData }) {
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<
    Array<CertificateData & { courseTitle: string; graduationDate: string }>
  >([]);
  const [selected, setSelected] = useState<CertificateData | null>(null);
  const [loadingCerts, setLoadingCerts] = useState(true);

  useEffect(() => {
    fetch("/api/certificates/mine")
      .then((r) => r.json())
      .then((res) => {
        const certs = (res.certificates ?? []).map(
          (c: {
            studentName: string;
            durationF: string;
            formationDate: string;
            certificateId: string;
            instructorName: string;
            academyName: string;
            courseTitle: string;
            graduatedAt: string;
          }) => ({
            studentFullName: c.studentName,
            durationF: c.durationF,
            formationDate: c.formationDate,
            certificateId: c.certificateId,
            instructorName: c.instructorName,
            academyName: c.academyName,
            courseTitle: c.courseTitle,
            graduationDate: new Date(c.graduatedAt).toLocaleDateString(),
          }),
        );
        setCertificates(certs);
      })
      .catch(() => {})
      .finally(() => setLoadingCerts(false));
  }, []);

  const firstName = (session?.user?.name ?? "").split(" ")[0];
  const latest = certificates[0];

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <div>
          <h1 className="text-display-md text-ink font-700 leading-[0.95]">
            My Dashboard
          </h1>
          <p className="text-body-sm text-mute mt-sm">
            Track your progress and guilds
          </p>
        </div>
        <Badge variant="default">Student View</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xxl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-canvas border border-hairline p-xl"
        >
          <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">
            {data.stats.totalGuilds}
          </p>
          <p className="text-body-sm text-mute">My Guilds</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-canvas border border-hairline p-xl"
        >
          <p className="text-display-lg text-ink font-700 leading-[0.95] mb-xs">
            {data.stats.totalCourses}
          </p>
          <p className="text-body-sm text-mute">Active Courses</p>
        </motion.div>
      </div>

      {loadingCerts ? (
        <section className="mb-xxl">
          <div className="bg-canvas border border-hairline py-xxxl text-center">
            <p className="text-body-sm text-mute">Loading certificates...</p>
          </div>
        </section>
      ) : latest ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-xxl"
        >
          <div className="bg-canvas border border-hairline shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-sm relative">
            <div className="border border-primary/70 p-xl md:p-xxl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-xl">
                <div className="min-w-0">
                  <div className="flex items-center gap-lg mb-lg">
                    <motion.div
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 16,
                        delay: 0.1,
                      }}
                      className="w-16 h-16 rounded-full border-2 border-primary bg-surface-soft flex items-center justify-center shrink-0 relative"
                    >
                      <div className="absolute inset-1 rounded-full border border-primary/50" />
                      <Award className="w-7 h-7 text-ink" />
                    </motion.div>
                    <div>
                      <p className="text-overline text-mute uppercase tracking-[0.25em] font-700">
                        Certificate of Completion
                      </p>
                      <h2 className="text-display-md text-ink font-700 leading-[1.05] mt-xs">
                        Congratulations{firstName ? `, ${firstName}` : ""}
                      </h2>
                      <p className="text-body-sm text-mute mt-sm max-w-3xl leading-relaxed">
                        You have successfully completed the{" "}
                        <span className="font-700 text-ink">
                          {latest.courseTitle}
                        </span>{" "}
                        program ({latest.durationF}).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-lg mt-lg pt-lg border-t border-hairline">
                    <div>
                      <p className="text-overline text-mute uppercase tracking-[0.2em] font-700">
                        Certificate ID
                      </p>
                      <p className="text-body-sm text-ink font-700 font-mono mt-xs">
                        {latest.certificateId}
                      </p>
                    </div>
                    <div>
                      <p className="text-overline text-mute uppercase tracking-[0.2em] font-700">
                        Graduated
                      </p>
                      <p className="text-body-sm text-ink font-700 mt-xs">
                        {latest.graduationDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-overline text-mute uppercase tracking-[0.2em] font-700">
                        Instructor
                      </p>
                      <p className="text-body-sm text-ink font-700 mt-xs">
                        {latest.instructorName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-md shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => setSelected(latest)}
                    className="inline-flex items-center justify-center gap-2 bg-ink text-on-dark text-button-md font-700 uppercase tracking-[0.144px] h-12 px-8 rounded-xs hover:opacity-80 transition-opacity cursor-pointer border-none"
                  >
                    <Award className="w-4 h-4" /> View &amp; Download
                  </button>
                  {certificates.length > 1 && (
                    <p className="text-caption text-mute text-center">
                      +{certificates.length - 1} more certificate(s) below
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      ) : (
        <section className="mb-xxl">
          <div className="bg-canvas border border-hairline py-xxxl text-center">
            <p className="text-body-sm text-mute">
              No certificates yet. Complete a course and a lab phase to
              graduate.
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-heading-sm text-ink font-700 mb-lg">My Guilds</h2>
        <div className="grid gap-lg">
          {(data.guilds ?? []).map((guild, i) => (
            <motion.div
              key={guild.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-canvas border border-hairline p-xxl"
            >
              <h3 className="font-heading-sm text-ink font-700 mb-sm">
                {guild.name}
              </h3>
              <p className="text-body-sm text-mute mb-sm">
                {guild.courseTitle} &middot; {guild.instructorName}
              </p>
              <div className="mb-lg">
                <div className="flex items-center justify-between mb-sm">
                  <span className="text-body-sm text-charcoal">
                    Session {guild.currentSession}/{guild.totalSessions}
                  </span>
                  <span className="text-body-sm text-charcoal">
                    {guild.totalSessions > 0
                      ? Math.round(
                          (guild.currentSession / guild.totalSessions) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 bg-surface-soft rounded-none">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${guild.totalSessions > 0 ? (guild.currentSession / guild.totalSessions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              {guild.skillsTotal > 0 && (
                <div className="mb-lg">
                  <div className="flex items-center justify-between mb-sm">
                    <span className="text-body-sm text-charcoal">
                      Skills: {guild.skillsAchieved} of {guild.skillsTotal}
                    </span>
                    <span className="text-body-sm text-success">
                      {Math.round(
                        (guild.skillsAchieved / guild.skillsTotal) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-surface-soft rounded-none">
                    <div
                      className="h-full bg-success transition-all"
                      style={{
                        width: `${(guild.skillsAchieved / guild.skillsTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {certificates.length > 1 && (
        <section className="mt-xxl">
          <div className="flex items-center gap-2 mb-lg">
            <Award className="w-4 h-4 text-mute" />
            <h2 className="text-heading-sm text-ink font-700">
              All Certificates
            </h2>
            <Badge variant="success">{certificates.length}</Badge>
          </div>
          <div className="grid gap-lg">
            {certificates.map((cert, i) => (
              <motion.div
                key={cert.certificateId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-canvas border border-hairline p-xxl flex flex-wrap items-center justify-between gap-lg"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-md mb-xs">
                    <div className="w-8 h-8 bg-success text-on-primary flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <h3 className="text-heading-sm text-ink font-700">
                      {cert.courseTitle}
                    </h3>
                  </div>
                  <p className="text-body-sm text-mute">
                    Graduated on {cert.graduationDate} &middot; {cert.durationF}
                  </p>
                  <code className="text-caption text-charcoal bg-surface-soft border border-hairline px-sm py-xs mt-sm inline-block">
                    {cert.certificateId}
                  </code>
                </div>
                <button
                  onClick={() => setSelected(cert)}
                  className="flex items-center gap-2 bg-primary text-on-primary text-button-sm font-bold uppercase tracking-[0.144px] py-2.5 px-6 rounded-xs hover:bg-primary-deep transition-colors cursor-pointer border-none"
                >
                  <Award className="w-4 h-4" /> View Certificate
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {selected && (
        <CertificateDialog
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          data={selected}
        />
      )}
    </div>
  );
}
