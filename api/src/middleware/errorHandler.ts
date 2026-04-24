import { Context, ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  const isDev = c.env.ENVIRONMENT !== "production";
  
  console.error("[API Error]", err);
  
  if (err instanceof SyntaxError && err.message.includes("JSON")) {
    return c.json(
      { success: false, error: "Invalid JSON in request body" },
      400
    );
  }
  
  // Zod validation errors handled in validation middleware
  if (err.name === "ZodError") {
    return c.json(
      { success: false, error: "Validation failed", details: err.message },
      400
    );
  }
  
  // JWT errors
  if (err.name === "JWTExpired") {
    return c.json(
      { success: false, error: "Token expired", code: "TOKEN_EXPIRED" },
      401
    );
  }
  
  if (err.name === "JWTInvalid" || err.name === "JWSSignatureVerificationFailed") {
    return c.json(
      { success: false, error: "Invalid token" },
      401
    );
  }
  
  // D1 / Database errors
  if (err.message?.includes("D1") || err.message?.includes("SQLITE")) {
    return c.json(
      { 
        success: false, 
        error: "Database error", 
        ...(isDev && { details: err.message })
      },
      500
    );
  }
  
  // Generic fallback
  return c.json(
    { 
      success: false, 
      error: isDev ? err.message : "Internal server error",
      ...(isDev && { stack: err.stack })
    },
    500
  );
};
