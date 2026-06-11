/**
 * client.ts — public HTTP client API.
 *
 * Thin facade over executeRequest that exposes the five standard HTTP methods
 * plus a FormData upload helper. All methods are fully generic and type-safe.
 *
 * Usage:
 *   import { http } from '@/lib/http'
 *
 *   const user  = await http.get<User>('/api/v1/auth/me')
 *   const token = await http.post<LoginResponse>('/api/v1/auth/sign-in', { email, password })
 *   const list  = await http.get<ApiResponse<Post[]>>('/api/v1/cms/posts', { params: { limit: 20 } })
 */

import type { RequestOptions } from './types'
import { HTTP_METHODS } from './types'
import { executeRequest } from './request'
import { uploadFormData } from './upload'

export const http = {
  /**
   * HTTP GET
   * Concurrent identical GETs are deduplicated — only one network request
   * is sent until the first resolves.
   */
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(HTTP_METHODS.GET, endpoint, undefined, options)
  },

  /** HTTP POST with optional JSON body */
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(HTTP_METHODS.POST, endpoint, body, options)
  },

  /** HTTP PUT — full resource replacement */
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(HTTP_METHODS.PUT, endpoint, body, options)
  },

  /** HTTP PATCH — partial resource update */
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(HTTP_METHODS.PATCH, endpoint, body, options)
  },

  /**
   * HTTP DELETE
   * Pass `body` when the endpoint requires a request body
   * (e.g. bulk-delete: `http.delete('/api/v1/cms/posts/bulk', { ids })`)
   */
  delete<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(HTTP_METHODS.DELETE, endpoint, body, options)
  },

  /**
   * FormData upload via POST.
   * Content-Type is omitted so the browser sets multipart/form-data + boundary.
   *
   * For direct uploads to presigned URLs (Cloudflare R2 / S3), use `uploadFile`
   * from `@/lib/http/upload` instead.
   */
  upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return uploadFormData<T>(endpoint, formData, options)
  },
} as const
