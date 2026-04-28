export interface ApiClientConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
}

export class BaseApiClient {
  protected baseUrl: string
  protected apiKey?: string
  protected timeout: number

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.timeout = config.timeout ??30000
  }

  protected async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey)
    }

    const response = await fetch(url.toString(), {
      ...options,
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      throw new ApiError(response.status, await response.text())
    }

    return response.json()
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(`API Error ${status}: ${message}`)
    this.name = 'ApiError'
  }
}