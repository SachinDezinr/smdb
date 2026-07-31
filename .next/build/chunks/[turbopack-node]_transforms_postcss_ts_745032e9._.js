module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/dyad-apps/SSUS/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "build/chunks/2c18b__pnpm_1499c894._.js",
  "build/chunks/[root-of-the-server]__8f377045._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/dyad-apps/SSUS/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];