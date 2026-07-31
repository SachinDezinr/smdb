module.exports = [
"[project]/dyad-apps/SSUS/.next-internal/server/app/api/auth/seed-admin/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/dyad-apps/SSUS/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureTablesExist",
    ()=>ensureTablesExist,
    "sql",
    ()=>sql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f40$neondatabase$2b$serverless$40$0$2e$10$2e$4$2f$node_modules$2f40$neondatabase$2f$serverless$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dyad-apps/SSUS/node_modules/.pnpm/@neondatabase+serverless@0.10.4/node_modules/@neondatabase/serverless/index.mjs [app-route] (ecmascript)");
;
async function sql(strings, ...values) {
    const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || '';
    if (!databaseUrl) {
        throw new Error('Neon DATABASE_URL is missing in environment variables.');
    }
    const queryFn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f40$neondatabase$2b$serverless$40$0$2e$10$2e$4$2f$node_modules$2f40$neondatabase$2f$serverless$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["neon"])(databaseUrl);
    if (typeof strings === 'string') {
        return await queryFn(strings, ...values);
    }
    return await queryFn(strings, ...values);
}
let tablesInitialized = false;
let initPromise = null;
async function ensureTablesExist() {
    if (tablesInitialized) return;
    if (initPromise) return initPromise;
    initPromise = (async ()=>{
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS complaints (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          item_name TEXT NOT NULL,
          class_name TEXT NOT NULL,
          department TEXT NOT NULL,
          floor TEXT NOT NULL,
          description TEXT NOT NULL,
          photo_url TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          priority TEXT NOT NULL DEFAULT 'medium',
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

        CREATE TABLE IF NOT EXISTS lost_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          item_name TEXT NOT NULL,
          color TEXT NOT NULL,
          brand TEXT,
          location TEXT NOT NULL,
          remark TEXT,
          owner_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          image_url TEXT,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS found_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          item_name TEXT NOT NULL,
          color TEXT NOT NULL,
          brand TEXT,
          location TEXT,
          remark TEXT,
          finder_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          image_url TEXT,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS matched_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          lost_item_id UUID REFERENCES lost_items(id) ON DELETE CASCADE,
          found_item_id UUID REFERENCES found_items(id) ON DELETE CASCADE,
          match_score NUMERIC NOT NULL,
          lost_item_data JSONB NOT NULL,
          found_item_data JSONB NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS resources (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          uploader_name TEXT NOT NULL,
          course_name TEXT NOT NULL,
          subject_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_name TEXT NOT NULL,
          tips TEXT,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
            tablesInitialized = true;
        } catch (err) {
            console.error('Failed to ensure Neon database tables exist:', err);
        } finally{
            initPromise = null;
        }
    })();
    return initPromise;
}
}),
"[project]/dyad-apps/SSUS/src/app/api/auth/seed-admin/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dyad-apps/SSUS/node_modules/.pnpm/next@15.5.21_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$3$2e$0$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dyad-apps/SSUS/node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dyad-apps/SSUS/src/lib/db.ts [app-route] (ecmascript)");
;
;
;
async function POST() {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureTablesExist"])();
        const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
        if (existing.length > 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Admin already exists'
            });
        }
        const password_hash = await __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$3$2e$0$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash('Admin@2026', 12);
        await __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sql"]`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('admin@smartstudent.com', ${password_hash}, 'System Admin', 'admin')
    `;
        return __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Admin created successfully'
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Server error';
        return __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: msg
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__92416728._.js.map