import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (
      url.pathname === "/api/download/apk" ||
      url.pathname === "/download.apk" ||
      url.pathname === "/abqor-ludo.apk" ||
      url.pathname === "/ludo.apk"
    ) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const apkPath = path.resolve(process.cwd(), "public/abqor-ludo.apk");
        if (fs.existsSync(apkPath)) {
          const apkBuffer = fs.readFileSync(apkPath);
          return new Response(apkBuffer, {
            status: 200,
            headers: {
              "Content-Type": "application/vnd.android.package-archive",
              "Content-Disposition": 'attachment; filename="abqor-ludo.apk"',
              "Content-Length": String(apkBuffer.length),
              "Cache-Control": "public, max-age=3600",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (err) {
        console.error("Failed to serve apk file:", err);
      }
    }

    // Endpoint to upload and apply custom app icon
    if (url.pathname === "/api/upload-icon" && request.method === "POST") {
      try {
        const fs = await import("fs");
        const { execSync } = await import("child_process");
        const contentType = request.headers.get("content-type") || "";

        let buffer: Buffer;

        if (contentType.includes("application/json")) {
          const body = (await request.json()) as { imageBase64?: string };
          if (!body.imageBase64) {
            return new Response(JSON.stringify({ error: "Missing imageBase64 in payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
          buffer = Buffer.from(base64Data, "base64");
        } else if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          const file = formData.get("icon") as File | null;
          if (!file) {
            return new Response(JSON.stringify({ error: "Missing icon file in form data" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const arrayBuf = await file.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
        } else {
          const arrayBuf = await request.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
        }

        const tempUploadPath = "/tmp/user_uploaded_icon.png";
        fs.writeFileSync(tempUploadPath, buffer);

        // Run Python icon application script
        execSync(`python3 scripts/apply_icon.py ${tempUploadPath}`, {
          encoding: "utf-8",
          timeout: 45000,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "تم تحديث أيقونة التطبيق والـ APK بنجاح!",
            iconUrl: `/app-icon-512.png?v=${Date.now()}`,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      } catch (err: unknown) {
        console.error("Error processing uploaded icon:", err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: "Failed to apply icon", details: errorMsg }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
