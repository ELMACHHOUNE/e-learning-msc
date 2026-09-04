'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

interface ProjectFeedbackData {
  summary: string
  strengths: string[]
  issues: string[]
  recommendations: string[]
  score: {
    value: number
    max: number
    reasoning: string
  }
}

interface ProjectFeedbackProps {
  projectApplicationId: string
  studentName: string
  labPhaseTitle: string
}

export default function ProjectFeedback({
  projectApplicationId,
  studentName,
  labPhaseTitle,
}: ProjectFeedbackProps) {
  const [feedback, setFeedback] = useState<ProjectFeedbackData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReview() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/project-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectApplicationId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      setFeedback(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate feedback')
    } finally {
      setLoading(false)
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {!feedback && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Get AI-powered feedback for <strong>{studentName}</strong>&apos;s submission
                on <strong>{labPhaseTitle}</strong>.
              </p>
              <Button onClick={handleReview} disabled={loading}>
                {loading ? 'Analyzing...' : 'Generate AI Feedback'}
              </Button>
              <p className="text-xs text-muted-foreground">
                This feedback is advisory — the instructor makes the final evaluation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {feedback && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Project Review</h3>
              <Badge variant="info">AI Generated</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className={`text-3xl font-bold ${getScoreColor(feedback.score.value)}`}>
                {feedback.score.value}<span className="text-lg text-muted-foreground">/{feedback.score.max}</span>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{feedback.score.reasoning}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">{feedback.summary}</p>
            </div>

            {feedback.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-green-600">Strengths</h4>
                <ul className="space-y-1">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-red-600">Issues</h4>
                <ul className="space-y-1">
                  {feedback.issues.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">-</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">Recommendations</h4>
                <ul className="space-y-1">
                  {feedback.recommendations.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">*</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button variant="outline-dark" onClick={() => setFeedback(null)}>
                Generate New Review
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This is AI-generated feedback for instructor review. The instructor remains responsible for the final evaluation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
