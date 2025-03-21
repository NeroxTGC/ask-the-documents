import { defineEnvValidationSchema } from "wasp/env";

import * as z from "zod";

export const serverEnvValidation = defineEnvValidationSchema(
  z.object({
    OPENAI_API_KEY: z.string({
      required_error: "OPENAI_API_KEY is required",
    }),
    DEEPSEEK_API_KEY: z.string().optional(),
    DEEPSEEK_API_URL: z.string().optional(),
  })
);
