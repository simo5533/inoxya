import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],
  environment: process.env['NODE_ENV'],
  enabled: process.env['NODE_ENV'] === "production",
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend(event) {
    // Strip sensitive data before sending
    if (event.request?.cookies) {
      event.request.cookies = {}
    }
    if (event.request?.headers) {
      delete event.request.headers["authorization"]
      delete event.request.headers["cookie"]
    }
    return event
  },
})

