import { z } from "zod";

export const cartItemSchema = z.object({
  chunk_id: z.string().uuid(),
  order: z.number().int().nonnegative(),
});

export const savePromptVersionSchema = z.object({
  namespace: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, "namespace may only contain letters, numbers, '-' and '_'"),
  title: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(50_000).default(""),
  cart_items: z.array(cartItemSchema).default([]),
});

export function validate(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return result.data;
}