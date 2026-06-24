import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    // Vitest resolve .js imports para .ts em tempo de execução —
    // compatível com o padrão ESM do projeto sem alterar tsconfig.
    alias: {
      // Permite imports com extensão .js apontarem para .ts durante os testes
    },
  },
});
