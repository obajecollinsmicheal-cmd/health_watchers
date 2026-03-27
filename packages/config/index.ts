import { z } from "zod";

const envSchema = z.object({
  API_PORT: z.string().default("4000"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  STELLAR_NETWORK: z.enum(["mainnet", "testnet"]).default("testnet"),
  STELLAR_SECRET_KEY: z.string().min(1, "STELLAR_SECRET_KEY is required"),
  STELLAR_PUBLIC_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

const horizonUrl =
  env.STELLAR_NETWORK === "mainnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";

export const config = {
  apiPort: env.API_PORT,
  mongoUri: env.MONGO_URI,
  stellarNetwork: env.STELLAR_NETWORK,
  stellarHorizonUrl: horizonUrl,
  stellarSecretKey: env.STELLAR_SECRET_KEY,
  stellarPublicKey: env.STELLAR_PUBLIC_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
  jwtSecret: env.JWT_SECRET,
};

export type Config = typeof config;
