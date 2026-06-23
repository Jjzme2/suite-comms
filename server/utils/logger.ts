export interface Logger {
  info(msg: string, data?: Record<string, unknown>): void
  warn(msg: string, data?: Record<string, unknown>): void
  error(msg: string, err?: unknown, data?: Record<string, unknown>): void
  debug(msg: string, data?: Record<string, unknown>): void
  /** Returns elapsed ms since the logger was created */
  elapsed(): number
}

export function createLogger(context: string): Logger {
  const start = Date.now()

  function serialize(level: string, msg: string, extra?: Record<string, unknown>) {
    return JSON.stringify({ ts: new Date().toISOString(), level, context, msg, ...extra })
  }

  return {
    info(msg, data) {
      console.info(serialize('info', msg, data))
    },
    warn(msg, data) {
      console.warn(serialize('warn', msg, data))
    },
    error(msg, err, data) {
      const errData = err instanceof Error
        ? { error: err.message, stack: err.stack }
        : err !== undefined ? { error: String(err) } : {}
      console.error(serialize('error', msg, { ...errData, ...data }))
    },
    debug(msg, data) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(serialize('debug', msg, data))
      }
    },
    elapsed() {
      return Date.now() - start
    }
  }
}
