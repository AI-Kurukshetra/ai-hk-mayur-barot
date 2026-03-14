export function getApiMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const maybePayload = payload as {
    message?: unknown;
    issues?: { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] };
  };

  if (typeof maybePayload.message === "string" && maybePayload.message.trim().length > 0) {
    return maybePayload.message;
  }

  const fieldErrors = maybePayload.issues?.fieldErrors ?? {};
  for (const key of Object.keys(fieldErrors)) {
    const first = fieldErrors[key]?.[0];
    if (first) return `${key.replace(/_/g, " ")}: ${first}`;
  }

  const formError = maybePayload.issues?.formErrors?.[0];
  if (formError) return formError;

  return fallback;
}
