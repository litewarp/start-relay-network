import { createMiddleware } from "@tanstack/react-start";

export const loggingMiddleware = createMiddleware().server(
  async ({ next, context, request }) => {
    console.log("Incoming request:", {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });
    const res = await next();
    console.log("Outgoing response:", res);
    return res;
  },
);
