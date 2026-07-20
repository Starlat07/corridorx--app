import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  country: z.string().trim().min(2, "Select a country").max(60),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});

export const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const resetSchema = z.object({
  password: z.string().min(8, "At least 8 characters").max(72),
});
