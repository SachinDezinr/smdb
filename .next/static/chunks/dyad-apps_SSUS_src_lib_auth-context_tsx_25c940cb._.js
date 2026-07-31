(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/dyad-apps/SSUS/src/lib/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dyad-apps/SSUS/node_modules/.pnpm/next@15.5.21_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dyad-apps/SSUS/node_modules/.pnpm/next@15.5.21_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function AuthProvider(param) {
    let { children } = param;
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [token, setToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const saved = localStorage.getItem('auth_token');
            if (saved) {
                setToken(saved);
                fetch('/api/auth/me', {
                    headers: {
                        Authorization: "Bearer ".concat(saved)
                    }
                }).then({
                    "AuthProvider.useEffect": (r)=>r.json()
                }["AuthProvider.useEffect"]).then({
                    "AuthProvider.useEffect": (data)=>{
                        if (data.user) setUser(data.user);
                        else {
                            localStorage.removeItem('auth_token');
                            setToken(null);
                        }
                    }
                }["AuthProvider.useEffect"]).catch({
                    "AuthProvider.useEffect": ()=>{
                        localStorage.removeItem('auth_token');
                        setToken(null);
                    }
                }["AuthProvider.useEffect"]).finally({
                    "AuthProvider.useEffect": ()=>setLoading(false)
                }["AuthProvider.useEffect"]);
            } else {
                setLoading(false);
            }
        }
    }["AuthProvider.useEffect"], []);
    const login = async (email, password)=>{
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        const data = await res.json();
        if (!res.ok) return {
            error: data.error
        };
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return {};
    };
    const register = async (email, password, name)=>{
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                name
            })
        });
        const data = await res.json();
        if (!res.ok) return {
            error: data.error
        };
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return {};
    };
    const logout = ()=>{
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    };
    const authFetch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[authFetch]": async function(url) {
            let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
            return fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    ...token ? {
                        Authorization: "Bearer ".concat(token)
                    } : {}
                }
            });
        }
    }["AuthProvider.useCallback[authFetch]"], [
        token
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        "data-orchids-id": "src\\lib\\auth-context.tsx:91:4",
        "data-orchids-name": "AuthContext.Provider",
        value: {
            user,
            token,
            loading,
            login,
            register,
            logout,
            authFetch
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/dyad-apps/SSUS/src/lib/auth-context.tsx",
        lineNumber: 91,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "fa/koE92TywZZrqSDvTWyD2HdXw=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$dyad$2d$apps$2f$SSUS$2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$21_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
_s1(useAuth, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=dyad-apps_SSUS_src_lib_auth-context_tsx_25c940cb._.js.map