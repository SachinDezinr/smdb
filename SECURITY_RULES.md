1. Exposed Secrets / API Keys in Frontend
Scan my entire codebase for hardcoded API keys, secrets, tokens, or credentials 
in frontend code (any file that ships to the browser — React/Vue/Next client 
components, HTML, JS bundles). Move all of them to server-side environment 
variables only. Show me every file where you find an exposed secret before 
changing it. Also check if .env is in .gitignore — if not, add it, and tell me 
if it was ever committed to git history so I know to rotate the keys.

2. No Rate Limiting
Add rate limiting to all my API routes. Use [express-rate-limit / 
@upstash/ratelimit / your framework's equivalent]. Apply stricter limits 
(5 requests/min) on auth routes like login, signup, and password reset, and 
a general limit (100 requests/min) on the rest. Return a proper 429 status 
with a clear error message when limit is hit.

3. No Input Validation
Add strict input validation on every API endpoint using [zod / joi]. Validate 
type, length, format, and required fields for all request body, query, and 
param data before it touches my database or business logic. Reject invalid 
requests with a 400 and a clear validation error message. Show me the schema 
for each endpoint.

4. Broken Authentication on API Routes
Audit every API route in my app and tell me which ones are missing 
server-side authentication checks. Add middleware that verifies the JWT/session 
on every protected route — do not rely on frontend route guards alone. Any 
route handling user data, payments, or admin actions must reject unauthenticated 
requests with a 401.

5. IDOR (Insecure Direct Object Reference)
Check every API route that fetches or modifies a resource by ID (e.g. 
/api/user/:id, /api/order/:id, /api/invoice/:id). For each one, add a server-side 
check that confirms the logged-in user actually owns that resource before 
returning or modifying it. Show me which routes were missing this check.

6. SQL Injection
Find every place in my codebase where SQL queries are built using string 
concatenation or template literals with user input. Replace all of them with 
parameterized queries or my ORM's ([Prisma/Drizzle/Sequelize]) safe query 
methods. Show me a before/after for each fix.

7. CORS Misconfiguration
Check my CORS configuration across all backend routes. Flag any wildcard 
origin ("*") especially where credentials: true is set. Replace it with an 
explicit whitelist of my actual frontend domain(s). Make sure credentialed 
requests only work from whitelisted origins.

8. Insecure File Upload
Review my file upload logic. Add validation for file type (whitelist, not 
blacklist), file size limit, and sanitize/rename the filename to a random 
string before storing. Make sure uploaded files are stored outside the public 
webroot (or in S3/cloud storage) and can't be executed as scripts. Check for 
path traversal risk in the upload path.

9. Verbose Error Messages / Stack Traces Exposed
Find every place my API returns raw error objects, stack traces, or database 
error messages directly to the client. Replace these with generic, safe error 
messages for the client response, while still logging the full error details 
server-side (console/logging service) for debugging.

10. Insecure Cookies / Session Handling
Audit how I set session/auth cookies. Make sure every auth cookie has 
Secure, HttpOnly, and SameSite=Strict (or Lax if needed for OAuth redirects) 
flags set. Add reasonable expiry and make sure sessions rotate/invalidate on 
login and logout.

11. Client-Side Trust (Business Logic on Frontend)
Check if any pricing, discount, permission, or quantity logic is calculated 
on the frontend and just sent to the backend as-is (e.g. total price, role, 
or access level coming from client state/payload). Move all such calculations 
and checks to the server, and revalidate/recompute them there regardless of 
what the client sends.

12. Outdated / Vulnerable Dependencies
Run a dependency audit on my project (npm audit / equivalent). List every 
package with a known vulnerability, its severity, and whether a safe update 
is available. Update the ones that are safe to update, and flag any breaking 
changes I need to review manually. Also remove unused dependencies.
