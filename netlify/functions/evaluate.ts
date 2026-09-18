import type { Config } from "@netlify/functions";
import { handleEvaluateRequest } from "../../src/decision/http";

export default async (req: Request) => handleEvaluateRequest(req);

export const config: Config = {
  path: "/api/evaluate",
  method: "POST",
};
