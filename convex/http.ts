import { httpRouter } from "convex/server";
import { betterAuthComponent, createAuth } from "./auth";

const http = httpRouter();

betterAuthComponent.registerRoutes(http, createAuth, {
  allowedOrigins: [process.env.SITE_URL!],
});

export default http;
