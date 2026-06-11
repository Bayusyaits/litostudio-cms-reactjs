type RequestMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

type RequestConfig = {
  method: RequestMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any> | string;
  data?: BodyInit | object | null;
  timeout?: number;
  signal?: AbortSignal;
  responseType?: 'json' | 'text' | 'blob';
};

type ResponseShape = {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
};

const DEFAULT_TIMEOUT = 60 * 2 * 1000;

const ABSOLUTE_HTTP_URL_RE = /^https?:\/\//i;
const inflightGetRequests = new Map<string, Promise<ResponseShape>>();

const buildQueryString = (params?: Record<string, any> | string) => {
  if (!params) {
    return '';
  }
  if (typeof params === 'string') {
    return params;
  }

  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .map((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        return value
          .map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
          .join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .filter(Boolean)
    .join('&');
};

const buildUrl = (url: string, params?: Record<string, any> | string) => {
  const query = buildQueryString(params);
  if (!query) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
};

const resolveRequestUrl = (url: string) => {
  const normalizedUrl = `${url || ''}`.trim();
  if (!normalizedUrl) {
    throw new Error('Request URL is empty');
  }

  if (ABSOLUTE_HTTP_URL_RE.test(normalizedUrl)) {
    return normalizedUrl;
  }

  if (globalThis.window?.location?.origin) {
    return new URL(normalizedUrl, globalThis.window.location.origin).toString();
  }

  const serverBaseUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    'http://localhost';

  return new URL(normalizedUrl, serverBaseUrl).toString();
};

const normalizeHeaders = (headers?: Record<string, string>, data?: RequestConfig['data']) => {
  const nextHeaders: Record<string, string> = {};

  Object.entries(headers || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      nextHeaders[key] = String(value);
    }
  });

  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    delete nextHeaders['Content-Type'];
  }

  return nextHeaders;
};

const stripCorsBlockedHeadersForDev = (
  requestUrl: string,
  headers: Record<string, string>
) => {
  if (globalThis.window === undefined || import.meta.env.MODE === 'production') {
    return headers;
  }

  const currentOrigin = globalThis.window.location?.origin;
  if (!currentOrigin) {
    return headers;
  }

  let targetOrigin = '';
  try {
    targetOrigin = new URL(requestUrl).origin;
  } catch {
    return headers;
  }

  // Prevent local dev CORS preflight failures when backend doesn't allow X-Ref-Code.
  if (targetOrigin !== currentOrigin) {
    Object.keys(headers).forEach((key) => {
      if (key.toLowerCase() === 'x-ref-code') {
        delete headers[key];
      }
    });
  }

  return headers;
};

const parseResponse = async (
  response: Response,
  responseType: RequestConfig['responseType']
) => {
  if (responseType === 'blob') {
    return response.blob();
  }

  if (responseType === 'text') {
    return response.text();
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const buildResponseHeaders = (headers: Headers) => {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

const buildRequestCacheKey = (
  method: string,
  requestUrl: string,
  headers: Record<string, string>
) => {
  const normalizedHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}`)
    .join('|');

  return `${method}:${requestUrl}:${normalizedHeaders}`;
};

const buildRequestBody = (
  method: string,
  data?: RequestConfig['data']
): BodyInit | undefined => {
  if (['GET', 'DELETE'].includes(method) || data === undefined || data === null) {
    return undefined;
  }

  if (data instanceof FormData || typeof data === 'string') {
    return data as BodyInit;
  }

  return JSON.stringify(data);
};

const createResponseShape = async (
  response: Response,
  config: RequestConfig
): Promise<ResponseShape> => {
  const data = await parseResponse(response, config.responseType);
  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: buildResponseHeaders(response.headers),
    config,
  };
};

export class FetchHttpError extends Error {
  response: ResponseShape;

  constructor(message: string, response: ResponseShape) {
    super(message);
    this.name = 'FetchHttpError';
    this.response = response;
  }
}

export const createAbortController = () => new AbortController();

export const request = async (config: RequestConfig): Promise<ResponseShape> => {
  const controller = new AbortController();
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const onAbort = () => controller.abort();
  config.signal?.addEventListener('abort', onAbort);

  try {
    const method = config.method.toUpperCase();
    const requestUrl = resolveRequestUrl(buildUrl(config.url, config.params));
    const normalizedHeaders = stripCorsBlockedHeadersForDev(
      requestUrl,
      normalizeHeaders(config.headers, config.data)
    );
    const executeRequest = async () => {
      const response = await fetch(requestUrl, {
        method,
        headers: normalizedHeaders,
        body: buildRequestBody(method, config.data),
        signal: controller.signal,
      });

      const shapedResponse = await createResponseShape(response, config);
      if (!response.ok) {
        throw new FetchHttpError(
          shapedResponse?.data?.message || response.statusText || 'Request failed',
          shapedResponse
        );
      }

      return shapedResponse;
    };

    if (method === 'GET') {
      const cacheKey = buildRequestCacheKey(method, requestUrl, normalizedHeaders);
      const inflight = inflightGetRequests.get(cacheKey);
      if (inflight) {
        return await inflight;
      }

      const pendingRequest = executeRequest().finally(() => {
        inflightGetRequests.delete(cacheKey);
      });
      inflightGetRequests.set(cacheKey, pendingRequest);
      return await pendingRequest;
    }

    return await executeRequest();
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    config.signal?.removeEventListener('abort', onAbort);
  }
};
