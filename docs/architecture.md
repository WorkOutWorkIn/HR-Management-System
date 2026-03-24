# Secure HRMS Foundation

This monorepo separates the React SPA, Express API, and shared constants so authentication, RBAC, and future HRMS modules can evolve without cross-cutting refactors.

- `apps/web` contains the Vite React client, route guards, auth context, and module-ready page groups.
- `apps/api` contains the Express API, Sequelize foundation, central middleware, and placeholder module route groups under `/api/v1`.
- `packages/shared` contains shared roles and route prefix constants so both apps enforce the same access vocabulary.

Security-sensitive concerns such as auth parsing, RBAC checks, audit logging hooks, error shaping, env loading, and migration-based database changes are centralized from day one.
