import type { AnalyticsDeviceType } from '@/types/analytics'

const BOT_PATTERN =
  /(bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|twitterbot|linkedinbot|embedly|quora link preview|pinterest|applebot|headlesschrome|lighthouse|pingdom|uptimerobot|monitoring|datadog|gtmetrix|ahrefs|semrush|phantomjs|curl\/|wget\/|python-requests|httpclient|go-http-client|okhttp|java\/|axios|node-fetch)/i

const BROWSERS: { family: string; pattern: RegExp }[] = [
  { family: 'Edge', pattern: /edg(?:e|a|ios)?\//i },
  { family: 'Opera', pattern: /(opr|opera)\//i },
  { family: 'Samsung Internet', pattern: /samsungbrowser\//i },
  { family: 'Firefox', pattern: /(firefox|fxios)\//i },
  { family: 'Chrome', pattern: /(chrome|crios|chromium)\//i },
  { family: 'Safari', pattern: /safari\//i },
]

const OPERATING_SYSTEMS: { family: string; pattern: RegExp }[] = [
  { family: 'Windows', pattern: /windows|win32|win64/i },
  { family: 'Android', pattern: /android/i },
  { family: 'iOS', pattern: /(iphone|ipad|ipod)/i },
  { family: 'macOS', pattern: /(mac os x|macintosh)/i },
  { family: 'ChromeOS', pattern: /cros/i },
  { family: 'Linux', pattern: /(linux|x11|ubuntu|fedora|debian)/i },
]

const TABLET_PATTERN = /(ipad|tablet|playbook|silk|android(?!.*mobile))/i

export function detectBot(userAgent: string | null | undefined) {
  if (!userAgent) return true
  if (userAgent.length > 512) return true
  return BOT_PATTERN.test(userAgent)
}

export function parseDeviceType(userAgent: string | null | undefined): AnalyticsDeviceType {
  const ua = userAgent ?? ''
  if (!ua) return 'unknown'
  if (/bot|crawler|spider|slurp|headless|phantomjs/i.test(ua)) return 'bot'
  if (/mobile|iphone|android.*mobile|windows phone|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile'
  if (TABLET_PATTERN.test(ua)) return 'tablet'
  return 'desktop'
}

export function parseBrowserFamily(userAgent: string | null | undefined) {
  const ua = userAgent ?? ''
  if (!ua || ua.length > 512) return undefined
  const match = BROWSERS.find((browser) => browser.pattern.test(ua))
  return match?.family
}

export function parseOsFamily(userAgent: string | null | undefined) {
  const ua = userAgent ?? ''
  if (!ua || ua.length > 512) return undefined
  const match = OPERATING_SYSTEMS.find((os) => os.pattern.test(ua))
  return match?.family
}