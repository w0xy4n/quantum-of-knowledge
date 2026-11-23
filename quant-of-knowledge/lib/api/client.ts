export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        ...(init.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    throw new ApiRequestError("Не удалось связаться с сервером. Проверьте подключение и повторите.", 0);
  }

  const body = (await response.json().catch(() => null)) as { error?: string } | T | null;
  if (!response.ok) {
    const fallback = response.status === 401 ? "Сессия истекла. Войдите снова." : "Не удалось выполнить запрос.";
    const message = body && typeof body === "object" && "error" in body && body.error ? body.error : fallback;
    throw new ApiRequestError(message, response.status);
  }
  return body as T;
}
