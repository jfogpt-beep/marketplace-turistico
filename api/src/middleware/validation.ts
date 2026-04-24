import { Context } from "hono";
import { ZodError, ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (value: unknown): Promise<{ success: true; data: T } | { success: false; error: string }> => {
    try {
      const data = schema.parse(value);
      return { success: true, data };
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return { success: false, error: messages };
      }
      return { success: false, error: "Validation failed" };
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (value: Record<string, string | string[]>): Promise<{ success: true; data: T } | { success: false; error: string }> => {
    try {
      const data = schema.parse(value);
      return { success: true, data };
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return { success: false, error: messages };
      }
      return { success: false, error: "Validation failed" };
    }
  };
}

export function validationMiddleware<T>(schema: ZodSchema<T>, source: "body" | "query" = "body") {
  return async (c: Context, next: () => Promise<void>) => {
    const raw = source === "body" ? await c.req.json() : Object.fromEntries(new URL(c.req.url).searchParams);
    const result = source === "body" 
      ? await validateBody(schema)(raw)
      : await validateQuery(schema)(raw);
    
    if (!result.success) {
      return c.json({ success: false, error: "Validation error", details: result.error }, 400);
    }
    
    c.set("validated", result.data);
    await next();
  };
}
