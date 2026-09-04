# API Documentation — AI Endpoints

## POST /api/ai/assistant

AI Learning Assistant — answer student questions about course material.

**Authentication:** Required (student role)

**Request Body:**
```json
{
  "message": "What is a closure in JavaScript?",
  "courseId": "course_id_here",
  "contentId": "optional_lesson_title"
}
```

**Validation:**
- `message`: string, 1-2000 characters, required
- `courseId`: string, required
- `contentId`: string, optional

**Response (200):**
```json
{
  "answer": "A closure is a function that...",
  "confidence": "high",
  "relevantTopics": ["closures", "scope"],
  "suggestedFollowUp": ["How do closures differ from regular functions?"]
}
```

**Error Responses:**
- `400` — Invalid input (validation errors)
- `401` — Not authenticated
- `403` — Not enrolled in course
- `404` — Course not found
- `502` — AI response validation failed
- `503` — AI provider unavailable
- `504` — AI request timed out

---

## POST /api/ai/quiz

AI Quiz Generator — generate quiz questions from course content.

**Authentication:** Required (instructor or admin role)

**Request Body:**
```json
{
  "courseId": "course_id_here",
  "contentId": "optional_lesson_title",
  "questionCount": 5,
  "difficulty": "medium"
}
```

**Validation:**
- `courseId`: string, required
- `contentId`: string, optional
- `questionCount`: integer, 1-20, default 5
- `difficulty`: "easy" | "medium" | "hard", default "medium"

**Response (200):**
```json
{
  "title": "JavaScript Fundamentals Quiz",
  "description": "Test your understanding of JavaScript closures",
  "questions": [
    {
      "question": "What is a closure?",
      "options": ["A function with access to outer scope", "A type of loop", "A variable", "A class"],
      "correctAnswer": "A function with access to outer scope",
      "explanation": "A closure is a function that..."
    }
  ]
}
```

**Error Responses:**
- `400` — Invalid input
- `401` — Not authenticated
- `403` — Insufficient permissions (not instructor/admin)
- `502` — AI response validation failed
- `503` — AI provider unavailable

---

## POST /api/ai/project-review

AI Project Feedback — analyze student project submissions.

**Authentication:** Required (instructor or admin role)

**Request Body:**
```json
{
  "projectApplicationId": "project_id_here"
}
```

**Validation:**
- `projectApplicationId`: string, required

**Response (200):**
```json
{
  "summary": "The student demonstrated strong understanding of...",
  "strengths": ["Well-structured code", "Good documentation"],
  "issues": ["Missing error handling"],
  "recommendations": ["Add input validation", "Include unit tests"],
  "score": {
    "value": 75,
    "max": 100,
    "reasoning": "The project shows solid fundamentals..."
  }
}
```

**Error Responses:**
- `400` — Invalid input
- `401` — Not authenticated
- `403` — Insufficient permissions
- `404` — Project application not found
- `502` — AI response validation failed
- `503` — AI provider unavailable

---

## GET /api/ai/health

Check AI service health status.

**Authentication:** None (internal endpoint)

**Response (200):**
```json
{
  "available": true,
  "provider": "ollama",
  "model": "phi3:mini",
  "modelLoaded": true
}
```

**Response (503):**
```json
{
  "available": false,
  "provider": "unknown",
  "model": "unknown",
  "modelLoaded": false
}
```

---

## GET /api/ai/quiz/drafts

List saved quiz drafts for the current instructor.

**Authentication:** Required (instructor or admin role)

**Response (200):**
```json
[
  {
    "_id": "draft_id",
    "title": "Generated Quiz",
    "description": "Quiz about closures",
    "questions": [...],
    "difficulty": "medium",
    "status": "draft",
    "aiModel": "phi3:mini",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

---

## POST /api/ai/quiz/drafts

Save a quiz draft for instructor review.

**Authentication:** Required (instructor or admin role)

**Request Body:**
```json
{
  "courseId": "course_id_here",
  "contentId": "optional",
  "title": "Quiz Title",
  "description": "Quiz description",
  "questions": [...],
  "difficulty": "medium"
}
```

**Response (201):** Created draft object
