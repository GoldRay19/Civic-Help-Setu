# Contributing to CivicBridge

First off, thank you for considering contributing to CivicBridge! It's people like you that make this open-source civic-tech platform possible.

## How Can I Contribute?

### Reporting Bugs
If you find a bug, please create an issue using the Bug Report template.

### Suggesting Enhancements
If you have an idea for a new feature or improvement, please use the Feature Request template.

### Updating Civic Information
Public service information changes frequently. If you notice outdated or incorrect information in our mock data or service guides, please open an issue using the Incorrect Information template, or submit a Pull Request.

## Pull Request Process
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code adheres to our code style (we use ESLint/Prettier).
5. Run the security checks (see below) before you push.
6. Update documentation if necessary.
7. Issue that pull request!

## Security checks
Every PR runs a secret scan, a dependency audit and a lint for unsafe HTML/JS patterns. Locally:
```bash
npm run lint:security
node scripts/security/audit-report.mjs --omit-dev --level high
gitleaks dir . --config .gitleaks.toml --redact --no-banner   # needs gitleaks installed
```
Never commit real keys (frontend `VITE_` variables are public). What each check does, what to do when one fails, and how to handle false positives: [docs/SECURITY_CHECKS.md](docs/SECURITY_CHECKS.md).

## Code Style
- We use standard React conventions.
- Use functional components and hooks.
- Semantic HTML is required for accessibility.
- CSS is handled via Vanilla CSS in `index.css`. Please use existing CSS variables for colors, typography, and spacing.
