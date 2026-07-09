"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button, Badge, Avatar } from "@/components/ui";
import {
  Search,
  Plus,
  Users,
  BookOpen,
  Layers,
  X,
  Save,
  Trash2,
  Filter,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "users" | "courses" | "guilds";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: string;
}
interface CourseData {
  id: string;
  title: string;
  description: string;
  durationInMonths: number;
  totalSessions: number;
  content: unknown[];
  createdAt?: string;
}
interface GuildData {
  id: string;
  name: string;
  courseId: string;
  course?: { _id: string; title: string };
  instructorId: string;
  instructor?: { _id: string; name: string };
  studentIds: string[];
  students?: { _id: string; name: string }[];
  currentSession: number;
  skillsTotal: number;
  skillsAchieved: number;
}

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "users", label: "User Management", icon: Users },
  { id: "courses", label: "Course Creator", icon: BookOpen },
  { id: "guilds", label: "Guild Assignment", icon: Layers },
];

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] bg-black/45 px-4 py-8 grid place-items-center"
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return
        onClose()
      }}
    >
      <div
        ref={contentRef}
        className="bg-canvas border border-hairline shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col"
        style={{
          width: "min(42rem, calc(100vw - 2rem))",
          maxHeight: "calc(100vh - 4rem)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface-soft">
          <h2 className="text-heading-xs text-ink font-bold uppercase">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-mute hover:text-ink"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [guilds, setGuilds] = useState<GuildData[]>([]);

  const [modal, setModal] = useState<"user" | "course" | "guild" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [formUser, setFormUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [formCourse, setFormCourse] = useState({
    title: "",
    description: "",
    coverImage: "",
    durationInMonths: 0,
    totalSessions: 0,
  });
  const [formGuild, setFormGuild] = useState({
    name: "",
    courseId: "",
    instructorId: "",
    studentIds: [] as string[],
  });

  const [allInstructors, setAllInstructors] = useState<UserData[]>([]);
  const [allStudents, setAllStudents] = useState<UserData[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  function fetchAll() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers);
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then(setCourses);
    fetch("/api/admin/guilds")
      .then((r) => r.json())
      .then(setGuilds);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function openCreate(tab: Tab) {
    setEditId(null);
    if (tab === "users") {
      setFormUser({ name: "", email: "", password: "", role: "student" });
      setModal("user");
    }
    if (tab === "courses") {
      setFormCourse({
        title: "",
        description: "",
        coverImage: "",
        durationInMonths: 0,
        totalSessions: 0,
      });
      setModal("course");
    }
    if (tab === "guilds") {
      setFormGuild({
        name: "",
        courseId: "",
        instructorId: "",
        studentIds: [],
      });
      setStudentSearch("");
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then((data) => {
          setAllInstructors(
            data.filter((u: UserData) => u.role === "instructor"),
          );
          setAllStudents(data.filter((u: UserData) => u.role === "student"));
        });
      setModal("guild");
    }
  }

  function openEdit(type: "user" | "course" | "guild", id: string) {
    setEditId(id);
    if (type === "user") {
      const u = users.find((x) => x.id === id);
      if (!u) return;
      setFormUser({ name: u.name, email: u.email, password: "", role: u.role });
      setModal("user");
    }
    if (type === "course") {
      const c = courses.find((x) => x.id === id);
      if (!c) return;
      setFormCourse({
        title: c.title,
        description: c.description,
        coverImage: (c as any).coverImage ?? "",
        durationInMonths: c.durationInMonths,
        totalSessions: c.totalSessions,
      });
      setModal("course");
    }
    if (type === "guild") {
      const g = guilds.find((x) => x.id === id);
      if (!g) return;
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then((data) => {
          setAllInstructors(
            data.filter((u: UserData) => u.role === "instructor"),
          );
          setAllStudents(data.filter((u: UserData) => u.role === "student"));
        });
      setStudentSearch("");
      setFormGuild({
        name: g.name,
        courseId: g.courseId,
        instructorId: g.instructorId,
        studentIds: g.studentIds,
      });
      setModal("guild");
    }
  }

  async function saveUser() {
    const url = editId ? `/api/admin/users/${editId}` : "/api/admin/users";
    const method = editId ? "PUT" : "POST";
    const body: Record<string, unknown> = {
      name: formUser.name,
      email: formUser.email,
      role: formUser.role,
    };
    if (formUser.password) body.password = formUser.password;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setModal(null);
    fetchAll();
  }

  async function saveCourse() {
    const url = editId ? `/api/admin/courses/${editId}` : "/api/admin/courses";
    const method = editId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formCourse),
    });
    setModal(null);
    fetchAll();
  }

  async function saveGuild() {
    const url = editId ? `/api/admin/guilds/${editId}` : "/api/admin/guilds";
    const method = editId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formGuild),
    });
    setModal(null);
    fetchAll();
  }

  async function deleteItem(type: "user" | "course" | "guild", id: string) {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/admin/${type}s/${id}`, { method: "DELETE" });
    fetchAll();
  }

  function toggleStudent(id: string) {
    setFormGuild((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));
  }

  const filteredStudents = allStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()),
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-[1440px] mx-auto px-xl py-xxl">
      <div className="flex items-center justify-between mb-xxl">
        <h1 className="text-display-md text-ink font-700 leading-[0.95]">
          Admin Portal
        </h1>
        <Badge variant="new">Admin Access</Badge>
      </div>

      <div className="flex gap-lg mb-xxl border-b border-hairline">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-lg py-md text-button-md bg-transparent border-none cursor-pointer transition-colors",
                isActive
                  ? "text-ink border-b-2 border-ink -mb-px"
                  : "text-mute hover:text-charcoal",
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Users Tab ── */}
      {activeTab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-lg">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                autoComplete="off"
                className="w-full h-10 pl-10 pr-md bg-surface-soft text-ink text-body-sm rounded-none border-b border-hairline-strong focus-visible:outline-none"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openCreate("users")}
            >
              <Plus className="w-4 h-4 mr-1" /> Add User
            </Button>
          </div>
          <div className="bg-canvas border border-hairline overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft">
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">
                    User
                  </th>
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">
                    Email
                  </th>
                  <th className="text-left px-lg py-md text-caption text-charcoal font-600">
                    Role
                  </th>
                  <th className="text-right px-lg py-md text-caption text-charcoal font-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-hairline hover:bg-surface-soft/50"
                  >
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <Avatar name={user.name} size="sm" />
                        <span className="text-body-sm text-ink">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-body-sm text-mute">
                      {user.email}
                    </td>
                    <td className="px-lg py-md">
                      <Badge
                        variant={
                          user.role === "admin"
                            ? "new"
                            : user.role === "instructor"
                              ? "info"
                              : "default"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-lg py-md text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => openEdit("user", user.id)}
                        >
                          Edit
                        </Button>
                        <button
                          onClick={() => deleteItem("user", user.id)}
                          className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Courses Tab ── */}
      {activeTab === "courses" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-heading-sm text-ink font-700">All Courses</h2>
            <Link
              href="/admin/courses/new"
              className="flex items-center gap-1 bg-primary text-on-primary text-button-sm font-bold uppercase tracking-[0.144px] py-2 px-4 rounded-[2px] hover:bg-primary-deep transition-colors no-underline"
            >
              <Plus className="w-4 h-4" /> Create Course
            </Link>
          </div>
          <div className="grid gap-lg">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-canvas border border-hairline p-xxl flex items-center justify-between"
              >
                <div>
                  <h3 className="text-heading-sm text-ink font-700">
                    {course.title}
                  </h3>
                  <p className="text-body-sm text-mute mt-xs">
                    {course.durationInMonths} months &middot;{" "}
                    {course.totalSessions} sessions &middot;{" "}
                    {course.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="flex items-center gap-1 border border-hairline-strong bg-canvas text-ink text-button-sm font-bold uppercase py-2 px-3 rounded-[2px] no-underline hover:bg-surface-soft transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => deleteItem("course", course.id)}
                    className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Guilds Tab ── */}
      {activeTab === "guilds" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-heading-sm text-ink font-700">
              Guild Assignment
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openCreate("guilds")}
            >
              <Plus className="w-4 h-4 mr-1" /> Create Guild
            </Button>
          </div>
          <div className="grid gap-lg">
            {guilds.map((guild, i) => (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-canvas border border-hairline p-xxl"
              >
                <div className="flex items-center justify-between mb-lg">
                  <div>
                    <h3 className="text-heading-sm text-ink font-700">
                      {guild.name}
                    </h3>
                    <p className="text-body-sm text-mute mt-xs">
                      Course:{" "}
                      {guild.course && "title" in guild.course
                        ? (guild.course as any).title
                        : guild.courseId}{" "}
                      &middot; Instructor:{" "}
                      {guild.instructor && "name" in guild.instructor
                        ? (guild.instructor as any).name
                        : guild.instructorId}{" "}
                      &middot; {guild.studentIds.length} students
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => openEdit("guild", guild.id)}
                    >
                      Edit
                    </Button>
                    <button
                      onClick={() => deleteItem("guild", guild.id)}
                      className="text-mute hover:text-error bg-transparent border-none cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── User Modal ── */}
      <Modal
        open={modal === "user"}
        onClose={() => setModal(null)}
        title={editId ? "Edit User" : "Create User"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Name
            </label>
            <input
              type="text"
              value={formUser.name}
              onChange={(e) =>
                setFormUser((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={formUser.email}
              onChange={(e) =>
                setFormUser((p) => ({ ...p, email: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Password {editId && "(leave blank to keep)"}
            </label>
            <input
              type="password"
              value={formUser.password}
              onChange={(e) =>
                setFormUser((p) => ({ ...p, password: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Role
            </label>
            <select
              value={formUser.role}
              onChange={(e) =>
                setFormUser((p) => ({ ...p, role: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-md pt-4 border-t border-hairline">
            <Button variant="outline-dark" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveUser}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Course Modal ── */}
      <Modal
        open={modal === "course"}
        onClose={() => setModal(null)}
        title={editId ? "Edit Course" : "Create Course"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Title
            </label>
            <input
              type="text"
              value={formCourse.title}
              onChange={(e) =>
                setFormCourse((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Description
            </label>
            <textarea
              rows={3}
              value={formCourse.description}
              onChange={(e) =>
                setFormCourse((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink resize-none"
            />
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Cover Image URL
            </label>
            <input
              type="url"
              value={formCourse.coverImage}
              onChange={(e) =>
                setFormCourse((p) => ({ ...p, coverImage: e.target.value }))
              }
              placeholder="/images/cover.png"
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            />
            {formCourse.coverImage && (
              <div className="mt-2 relative w-full aspect-[16/9] overflow-hidden bg-surface-soft border border-hairline">
                <Image
                  src={formCourse.coverImage}
                  alt="Cover preview"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                Duration (months)
              </label>
              <input
                type="number"
                value={String(formCourse.durationInMonths ?? "")}
                onChange={(e) =>
                  setFormCourse((p) => ({
                    ...p,
                    durationInMonths: e.target.value
                      ? Number(e.target.value)
                      : 0,
                  }))
                }
                className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
                Total Sessions
              </label>
              <input
                type="number"
                value={String(formCourse.totalSessions ?? "")}
                onChange={(e) =>
                  setFormCourse((p) => ({
                    ...p,
                    totalSessions: e.target.value ? Number(e.target.value) : 0,
                  }))
                }
                className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
              />
            </div>
          </div>
          <div className="flex justify-end gap-md pt-4 border-t border-hairline">
            <Button variant="outline-dark" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveCourse}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Guild Modal ── */}
      <Modal
        open={modal === "guild"}
        onClose={() => setModal(null)}
        title={editId ? "Edit Guild" : "Create Guild"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Guild Name
            </label>
            <input
              type="text"
              value={formGuild.name}
              onChange={(e) =>
                setFormGuild((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Course
            </label>
            <select
              value={formGuild.courseId}
              onChange={(e) =>
                setFormGuild((p) => ({ ...p, courseId: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            >
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Instructor
            </label>
            <select
              value={formGuild.instructorId}
              onChange={(e) =>
                setFormGuild((p) => ({ ...p, instructorId: e.target.value }))
              }
              className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2 rounded-[2px] outline-none focus:border-ink"
            >
              <option value="">Select instructor...</option>
              {allInstructors.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-caption text-mute uppercase tracking-[0.1em] font-600 mb-1.5 block">
              Students ({formGuild.studentIds.length} selected)
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mute" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                autoComplete="off"
                className="w-full h-9 pl-9 pr-3 border border-hairline bg-canvas text-ink text-body-sm rounded-none focus:outline-none focus:border-ink transition-colors"
              />
            </div>
            <div className="border border-hairline max-h-48 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="text-caption text-mute text-center py-lg">No students found</p>
              ) : (
                filteredStudents.map((s) => (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 hover:bg-surface-soft cursor-pointer text-body-sm",
                      formGuild.studentIds.includes(s.id) && "bg-primary/10",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formGuild.studentIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="accent-ink"
                    />
                    <Avatar name={s.name} size="sm" />
                    {s.name}
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-md pt-4 border-t border-hairline">
            <Button variant="outline-dark" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveGuild}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
