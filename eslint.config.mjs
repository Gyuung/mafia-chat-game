import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next의 기본 제외 규칙을 재정의합니다.
  globalIgnores([
    // eslint-config-next의 기본 제외 항목과 프로젝트 제외 항목입니다.
    ".next/**",
    "out/**",
    "build/**",
    "docs-site/**",
    "docs-site/.docusaurus/**",
    "docs-site/build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
