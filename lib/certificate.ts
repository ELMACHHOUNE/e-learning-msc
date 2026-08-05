import type { CertificateData } from '@/types/certificate'

export function createCertificateFileName(studentName: string): string {
  const sanitized = studentName.trim().replace(/\s+/g, '-')
  return `certificate-${sanitized}.pdf`
}

export async function generateCertificate(
  data: CertificateData
): Promise<Blob> {
  const response = await fetch('/api/certificates/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `Server error: ${response.status}` }))
    throw new Error(err.error ?? `Server error: ${response.status}`)
  }

  return response.blob()
}

export async function downloadCertificate(data: CertificateData): Promise<string> {
  const blob = await generateCertificate(data)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = createCertificateFileName(data.studentFullName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return createCertificateFileName(data.studentFullName)
}
