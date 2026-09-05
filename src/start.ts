import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // For server functions or JSON API calls, rethrow the error so TanStack Start RPC handles it
    // instead of returning an HTML document which causes the client to crash or navigate to the error page
    const accept = request?.headers?.get?.("accept") ?? "";
    const isServerFn =
      accept.includes("application/json") ||
      Boolean(request?.headers?.get?.("x-tanstack-start-action")) ||
      Boolean(request?.url?.includes("_serverFn"));

    if (isServerFn) {
      console.error("[serverFn error]", error);
      throw error;
    }

    console.error("[SSR error]", error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
