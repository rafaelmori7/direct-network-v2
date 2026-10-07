import { defineConfig } from "vitest/config";
import path from "node:path";

const integration = process.env.VITEST_INTEGRATION === "1";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    // Os testes usam sempre o gateway mock, mesmo com PAYMENT_PROVIDER=asaas no ambiente.
    env: { PAYMENT_PROVIDER: "mock" },
    ...(integration
      ? { include: ["tests/integration/**/*.test.ts"], fileParallelism: false }
      : { include: ["tests/**/*.test.ts"], exclude: ["tests/integration/**"] }),
  },
});
