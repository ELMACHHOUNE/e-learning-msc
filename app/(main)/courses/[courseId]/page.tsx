"use client";

import { useState, useEffect } from "react";
import { SidebarNavigation } from "@/components/shared/sidebar-navigation";
import { Badge } from "@/components/ui";
import {
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import LogoSpinner from "@/components/shared/logo-spinner";
import LearningAssistant from "@/components/ai/learning-assistant";

interface LessonNode {
  title: string;
  content: string;
  type: "lesson" | "checkpoint" | "workshop";
  completed?: boolean;
  id?: string;
}

interface ChapterNode {
  title: string;
  lessons: LessonNode[];
}

interface ModuleNode {
  title: string;
  chapters: ChapterNode[];
}

interface CourseContent {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  durationInMonths: number;
  totalSessions: number;
  content: ModuleNode[];
}

type ContentTab = "courses" | "assessment" | "resources" | "assistant";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const [course, setCourse] = useState<CourseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentTab>("courses");
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);

  useEffect(() => {
    async function fetchCourse() {
      const { courseId } = await params;
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data);
        }
      } catch (e) {
        console.error("Failed to fetch course:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [params]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)]">
        <div className="hidden lg:block shrink-0 w-72 border-r border-hairline bg-canvas">
          <LogoSpinner />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center">
            <LogoSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)]">
        <div className="hidden lg:block shrink-0 w-72 border-r border-hairline bg-canvas" />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-body-md text-mute">Course not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transform course content for SidebarNavigation
  const modules: ModuleNode[] = (course.content ?? []).map((mod) => ({
    title: mod.title,
    chapters: (mod.chapters ?? []).map((ch) => ({
      title: ch.title,
      lessons: (ch.lessons ?? []).map((les) => ({
        title: les.title,
        content: les.content ?? "",
        type: les.type,
        completed: les.completed ?? false,
        id: les.id,
      })),
    })),
  }));

  const selectedModule = modules[selectedModuleIndex];
  const selectedChapter = selectedModule?.chapters[selectedChapterIndex];
  const selectedLesson = selectedChapter?.lessons[selectedLessonIndex];

  const handleModuleClick = (index: number) => {
    setSelectedModuleIndex(index);
    setSelectedChapterIndex(0);
    setSelectedLessonIndex(0);
  };

  const handleChapterClick = (moduleIndex: number, chapterIndex: number) => {
    setSelectedModuleIndex(moduleIndex);
    setSelectedChapterIndex(chapterIndex);
    setSelectedLessonIndex(0);
  };

  const handleLessonClick = (
    moduleIndex: number,
    chapterIndex: number,
    lessonIndex: number,
  ) => {
    setSelectedModuleIndex(moduleIndex);
    setSelectedChapterIndex(chapterIndex);
    setSelectedLessonIndex(lessonIndex);
  };

  const hasNextModule = selectedModuleIndex < modules.length - 1;
  const hasPrevModule = selectedModuleIndex > 0;

  const handleNextModule = () => {
    if (hasNextModule) {
      setSelectedModuleIndex(selectedModuleIndex + 1);
      setSelectedChapterIndex(0);
      setSelectedLessonIndex(0);
    }
  };
  const handlePrevModule = () => {
    if (hasPrevModule) {
      setSelectedModuleIndex(selectedModuleIndex - 1);
      setSelectedChapterIndex(0);
      setSelectedLessonIndex(0);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)]">
      <div className="hidden lg:block shrink-0">
        <SidebarNavigation
          modules={modules}
          courseId={course.id}
          onModuleClick={handleModuleClick}
          onChapterClick={handleChapterClick}
          onLessonClick={handleLessonClick}
          selectedModuleIndex={selectedModuleIndex}
          selectedChapterIndex={selectedChapterIndex}
          selectedLessonIndex={selectedLessonIndex}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 lg:gap-4 px-md lg:px-xxl py-lg border-b border-hairline bg-canvas overflow-x-auto">
          {[
            { id: "courses" as const, label: "Courses", icon: BookOpen },
            { id: "assessment" as const, label: "Assessment", icon: FileText },
            {
              id: "resources" as const,
              label: "These Resources Can Help You",
              icon: FileText,
            },
            { id: "assistant" as const, label: "AI Assistant", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-lg py-sm text-button-sm bg-transparent border-none cursor-pointer transition-colors rounded-pill shrink-0 whitespace-nowrap ${
                  isActive
                    ? "bg-surface-dark text-black dark:bg-primary text-black"
                    : "text-charcoal hover:text-ink"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "assistant" && (
          <div className="flex-1 overflow-y-auto px-md lg:px-xxl py-xxl">
            <div className="max-w-3xl mx-auto">
              <LearningAssistant
                courseId={course.id}
                courseTitle={course.title}
                contentId={selectedLesson?.id}
                contentTitle={selectedLesson?.title}
              />
            </div>
          </div>
        )}

        {selectedModule && activeTab === "courses" && (
          <div className="flex-1 overflow-y-auto px-md lg:px-xxl py-xxl">
            <div className="max-w-3xl mx-auto">
              <div className="mb-lg">
                <Badge variant="new" className="mr-2">
                  Module {selectedModuleIndex + 1}
                </Badge>
                <span className="text-caption text-mute">
                  {selectedModuleIndex + 1} of {modules.length}
                </span>
              </div>
              <h1 className="text-display-lg text-ink font-700 leading-[0.95] mb-lg">
                {selectedModule.title}
              </h1>

              <div className="prose prose-sm max-w-none">
                {selectedChapter ? (
                  <>
                    <h2 className="text-heading-md text-ink font-700 mt-xxl mb-md">
                      {selectedChapter.title}
                    </h2>
                    <div className="space-y-md">
                      {selectedChapter.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id ?? lessonIndex}
                          onClick={() =>
                            handleLessonClick(
                              selectedModuleIndex,
                              selectedChapterIndex,
                              lessonIndex,
                            )
                          }
                          className={`w-full flex items-center gap-md p-md rounded-none transition-colors text-left ${
                            selectedLessonIndex === lessonIndex
                              ? "bg-primary/10 border border-primary"
                              : lesson.completed
                                ? "bg-success/10 border border-success"
                                : "bg-canvas border border-hairline hover:bg-surface-soft"
                          }`}
                        >
                          <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            {lesson.type === "checkpoint" && (
                              <span className="text-warning font-bold">◆</span>
                            )}
                            {lesson.type === "workshop" && (
                              <span className="text-info font-bold">⬢</span>
                            )}
                            {lesson.type === "lesson" && (
                              <span className="text-mute">●</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-body-sm text-ink font-600">
                              {lesson.title}
                              {lesson.type !== "lesson" && (
                                <span className="ml-2 text-caption uppercase font-bold">
                                  {lesson.type}
                                </span>
                              )}
                            </p>
                            {lesson.content && (
                              <p className="text-body-sm text-mute mt-1 line-clamp-2">
                                {lesson.content}
                              </p>
                            )}
                          </div>
                          {lesson.completed && (
                            <span className="text-success text-caption font-600">
                              Completed
                            </span>
                          )}
                          {selectedLessonIndex === lessonIndex && (
                            <span className="text-primary text-caption font-600">
                              Active
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {selectedLesson && (
                      <div className="mt-xl p-lg bg-surface-soft border border-hairline rounded-none">
                        <h3 className="text-heading-sm text-ink font-700 mb-md">
                          {selectedLesson.title}
                        </h3>
                        {selectedLesson.type !== "lesson" && (
                          <Badge
                            variant={
                              selectedLesson.type === "checkpoint"
                                ? "warning"
                                : "info"
                            }
                            className="mb-md"
                          >
                            {selectedLesson.type}
                          </Badge>
                        )}
                        <div className="prose prose-sm max-w-none">
                          {selectedLesson.content ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedLesson.content,
                              }}
                            />
                          ) : (
                            <p className="text-body-md text-mute">
                              No content available for this lesson yet.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-md">
                    {selectedModule.chapters.map((chapter, chapterIndex) => (
                      <button
                        key={chapter.title}
                        onClick={() =>
                          handleChapterClick(selectedModuleIndex, chapterIndex)
                        }
                        className={`w-full flex items-center justify-between p-lg rounded-none transition-colors text-left ${
                          selectedChapterIndex === chapterIndex
                            ? "bg-primary/10 border border-primary"
                            : "bg-canvas border border-hairline hover:bg-surface-soft"
                        }`}
                      >
                        <div className="flex items-center gap-md">
                          <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-surface-soft border border-hairline">
                            <BookOpen className="w-5 h-5 text-mute" />
                          </div>
                          <div>
                            <p className="text-body-md text-ink font-600">
                              {chapter.title}
                            </p>
                            <p className="text-caption text-mute">
                              {chapter.lessons.length} lessons
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-mute" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-md px-md lg:px-xxl py-lg border-t border-hairline bg-canvas">
          <button
            onClick={handlePrevModule}
            disabled={!hasPrevModule}
            className="flex items-center gap-2 text-button-md bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Module
          </button>
          <div className="text-caption text-mute">
            {selectedModuleIndex + 1} / {modules.length}
          </div>
          <button
            onClick={handleNextModule}
            disabled={!hasNextModule}
            className="flex items-center gap-2 text-button-md bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Module
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
