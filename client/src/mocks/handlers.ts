import { http, HttpResponse, passthrough } from "msw";
import { isMocked } from "./config";

export const handlers = [
  http.get("/api/hello", () => {
    if (!isMocked("GET", "/hello")) return passthrough();
    return new HttpResponse("hello world (mock)", {
      headers: { "Content-Type": "text/plain" },
    });
  }),
  // Future handlers follow same pattern
];
