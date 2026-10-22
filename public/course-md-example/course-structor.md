You are writing a course that will be imported into an e-learning platform by a
Markdown parser. Follow these rules EXACTLY, because the parser depends on them.

OUTPUT FORMAT
- Reply with ONE fenced markdown block containing the entire course. No text before
  or after it.
- Start with a YAML frontmatter block delimited by three dashes --- at the very top:

---
title: Git & GitHub: From Zero to Pro
description: One or two sentences describing the course.
category: DevOps
durationInMonths: 3
totalSessions: 24
price: 0
---

STRUCTURE RULES (critical)
- Use "# " (H1) for MODULES.
- Use "## " (H2) for CHAPTERS.
- Use "### " (H3) for LESSONS.
- Never skip or add heading levels. Do not use H4 or deeper.
- Every module has a title like "# Module 1: Getting Started".
- Every chapter has a title like "## Chapter 1: Installation".
- Every lesson has a short title like "### Lesson: Installing Git".

LESSON TYPES (auto-detected from the title text)
- Put "Quiz", "Checkpoint", "Assessment", "Exercise" or "Test" in the title to make
  it a CHECKPOINT lesson.
- Put "Workshop", "Lab", "Hands-on", "Practical" or "Project" in the title to make it
  a WORKSHOP lesson.
- All other lessons are normal lessons.

LESSON CONTENT
- Write real, useful teaching content under each lesson heading (2-6 paragraphs).
- Use normal markdown: paragraphs, **bold**, *italic*, `inline code`, bullet/numbered
  lists, > blockquotes, and tables.
- For commands/code ALWAYS use fenced code blocks with a language tag:

```bash
git init
git status
```

- The content is rendered as HTML, so keep it clean and standard markdown.

SCOPE FOR THIS COURSE
- Topic: Git and GitHub, beginner to advanced.
- 7 modules, 3-4 chapters per module, 2-4 lessons per chapter.
- Cover: version control basics, install & config, staging/commit, branching/merging,
  remotes & GitHub, pull requests & collaboration, undoing mistakes, tags/releases,
  GitHub Actions basics, and a final hands-on project workshop.
- Include at least one "Checkpoint: ..." lesson per module and one "Workshop: ..."
  lesson in most modules.

Now write the full course as a single markdown block.