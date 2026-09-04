'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

interface QuizData {
  title: string
  description: string
  questions: QuizQuestion[]
}

interface QuizGeneratorProps {
  courseId: string
  courseTitle: string
  contentId?: string
  contentTitle?: string
  onSaved?: () => void
}

export default function QuizGenerator({
  courseId,
  courseTitle,
  contentId,
  contentTitle,
  onSaved,
}: QuizGeneratorProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          contentId,
          questionCount,
          difficulty,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      setQuiz(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  function handleRegenerate() {
    setQuiz(null)
    handleGenerate()
  }

  function handleEditQuestion(index: number, field: keyof QuizQuestion, value: string | string[]) {
    if (!quiz) return
    const updated = { ...quiz }
    updated.questions = [...quiz.questions]
    updated.questions[index] = { ...updated.questions[index], [field]: value }
    setQuiz(updated)
  }

  function handleEditOption(questionIndex: number, optionIndex: number, value: string) {
    if (!quiz) return
    const updated = { ...quiz }
    updated.questions = [...quiz.questions]
    const question = { ...updated.questions[questionIndex] }
    question.options = [...question.options]
    question.options[optionIndex] = value
    updated.questions[questionIndex] = question
    setQuiz(updated)
  }

  function handleSetCorrectAnswer(questionIndex: number, answer: string) {
    if (!quiz) return
    const updated = { ...quiz }
    updated.questions = [...quiz.questions]
    updated.questions[questionIndex] = {
      ...updated.questions[questionIndex],
      correctAnswer: answer,
    }
    setQuiz(updated)
  }

  async function handleSaveDraft() {
    if (!quiz) return
    setSaving(true)

    try {
      const response = await fetch('/api/ai/quiz/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          contentId,
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions,
          difficulty,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      setSaved(true)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">AI Quiz Generator</h3>
          <p className="text-sm text-muted-foreground">
            Generate quiz questions from course content for review
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Course:</strong> {courseTitle}</p>
            {contentTitle && <p><strong>Lesson:</strong> {contentTitle}</p>}
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Questions</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Quiz'}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {quiz && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Input
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  className="text-lg font-semibold border-0 p-0 h-auto bg-transparent focus-visible:ring-0"
                />
                <Input
                  value={quiz.description}
                  onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                  className="text-sm text-muted-foreground border-0 p-0 h-auto bg-transparent focus-visible:ring-0"
                />
              </div>
              <Badge variant="info">AI Generated — Draft</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.questions.map((q, qi) => (
              <div key={qi} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground mt-1">Q{qi + 1}.</span>
                  <Input
                    value={q.question}
                    onChange={(e) => handleEditQuestion(qi, 'question', e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="ml-6 space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctAnswer === opt}
                        onChange={() => handleSetCorrectAnswer(qi, opt)}
                        className="accent-primary"
                      />
                      <Input
                        value={opt}
                        onChange={(e) => handleEditOption(qi, oi, e.target.value)}
                        className="flex-1 text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="ml-6">
                  <label className="text-xs font-medium text-muted-foreground">Explanation</label>
                  <Input
                    value={q.explanation}
                    onChange={(e) => handleEditQuestion(qi, 'explanation', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline-dark" onClick={handleRegenerate} disabled={loading}>
                Regenerate
              </Button>
              <Button onClick={handleSaveDraft} disabled={saving || saved}>
                {saved ? 'Saved as Draft' : saving ? 'Saving...' : 'Save as Draft'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              This quiz is an AI-generated draft. Review and edit before publishing to students.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
