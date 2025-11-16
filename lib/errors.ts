// Custom error classes for better error handling

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message)
    this.name = "APIError"
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message)
    this.name = "ValidationError"
  }
}
