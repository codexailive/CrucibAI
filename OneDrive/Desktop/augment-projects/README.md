# CrucibAI Project

CrucibAI is a comprehensive AI orchestration platform integrating multimodal AI services, voice processing, video processing, AR/VR environments, and more. It includes a backend API, frontend interface, and VSCode extension for development.

## Project Structure

- `apps/backend/`: Node.js TypeScript backend with services for AI, voice, video, documents, AR/VR.
- `apps/frontend/`: Frontend application (likely React).
- `extensions/vscode-crucibai/`: VSCode extension for AI-powered coding assistance.
- `services/`: Shared services for AI orchestration, API gateway, collaboration, etc.
- `tests/`: E2E and unit tests.
- Docker and deployment configs for production.

## Prerequisites

- Node.js 20+ (LTS)
- npm or yarn
- Docker and Docker Compose for containerization
- VSCode for development (optional extension)

## Installation

1. Clone the repository:
   ```
   git clone <repo-url>
   cd augment-projects
   ```

2. Install dependencies:
   ```
   npm install
   ```
   Or for monorepo (if using nx or turbo):
   ```
   npx nx install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in root and apps/backend/.
   - Configure API keys for OpenAI, other providers (e.g., `OPENAI_API_KEY`).

4. Database setup (Prisma):
   ```
   cd apps/backend
   npx prisma generate
   npx prisma db push
   ```

## Running Locally

### Backend
```
cd apps/backend
npm run dev
```
Starts the server on http://localhost:3000.

### Frontend
```
cd apps/frontend
npm run dev
```
Starts the frontend on http://localhost:3001.

### VSCode Extension
```
cd extensions/vscode-crucibai
npm run watch
```
Load in VSCode via Extensions > ... > Install from VSIX or F5 for debugging.

### Full Stack with Docker
```
docker-compose up
```

## Testing

- Unit tests:
  ```
  npm test
  ```
- E2E tests:
  ```
  npm run test:e2e
  ```
- Extension tests:
  ```
  cd extensions/vscode-crucibai
  npm run test
  ```

## Onboarding for New Developers

1. Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.
2. Explore `apps/backend/src/services/` for core AI logic.
3. Use the VSCode extension for AI-assisted coding: Run "Hello CrucibAI" command.
4. Contribute: Follow ESLint/TypeScript standards; add tests for new features.

## Advanced Usage

- Custom AI Models: Configure in `.env` (e.g., `AI_PROVIDER=openai`, `MODEL=gpt-4o`).
- Scaling: Use docker-compose.production.yml for multi-container setup.
- Monitoring: Integrate with tools like Prometheus (add in docker-compose).
- Contributing: Fork, branch, PR to main. Run `npm run lint` and `npm test` before pushing.

For issues, see [troubleshooting](#troubleshooting) below.

## Troubleshooting

- Dependency issues: Delete node_modules and package-lock.json, then `npm install`.
- Type errors: Ensure `@types/node` matches Node version.
- Docker build fails: Check Dockerfile.prod for base image vulnerabilities; rebuild with `docker build --no-cache`.
- Extension not loading: Reload VSCode window after install.

## License

MIT License. See LICENSE for details.