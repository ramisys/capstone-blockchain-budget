# Git Workflow

## Branching Strategy

This project follows a **Git Flow-inspired workflow** optimized for collaborative development.

```
main
│
├── develop
│
├── feature/phase-4.1-budget-request
├── feature/phase-4.2-budget-allocation
├── feature/phase-4.3-budget-approval
├── feature/phase-4.4-expense-management
├── feature/phase-4.5-fund-disbursement
├── feature/phase-4.6-reporting-analytics
├── feature/phase-4.7-blockchain-audit
│
├── bugfix/*
├── hotfix/*
└── docs/*
```

---

# Branch Purpose

| Branch | Purpose |
|---------|----------|
| `main` | Production-ready code. Only stable, tested releases are merged here. |
| `develop` | Main integration branch where completed features are merged. |
| `feature/*` | New features or subphases under development. |
| `bugfix/*` | Fixes for issues found during development before release. |
| `hotfix/*` | Critical fixes applied directly to production. |
| `docs/*` | Documentation updates that do not modify application logic. |

---

# Development Workflow

## 1. Update your local repository

Always synchronize with the latest changes before starting work.

```bash
git checkout develop
git pull origin develop
```

---

## 2. Create a feature branch

Branch from `develop`.

```bash
git checkout -b feature/phase-4.3-budget-approval
```

Branch naming examples:

```text
feature/phase-4.1-budget-request
feature/phase-4.2-budget-allocation
feature/phase-4.3-budget-approval
feature/phase-4.4-expense-management
feature/phase-4.5-fund-disbursement
feature/phase-4.6-reporting-analytics
feature/phase-4.7-blockchain-audit
```

For non-feature work:

```text
bugfix/fix-budget-validation
bugfix/report-filter

hotfix/login-error
hotfix/blockchain-sync

docs/design-system-update
docs/api-documentation
```

---

## 3. Develop the feature

Commit frequently with meaningful commit messages.

Examples:

```bash
git add .
git commit -m "feat(budget): implement approval workflow"
```

---

## 4. Keep your branch updated

If `develop` has changed:

```bash
git checkout develop
git pull origin develop

git checkout feature/phase-4.3-budget-approval
git merge develop
```

Resolve conflicts immediately.

---

## 5. Push your branch

```bash
git push -u origin feature/phase-4.3-budget-approval
```

Subsequent pushes:

```bash
git push
```

---

## 6. Open a Pull Request

Create a Pull Request from:

```
feature/* → develop
bugfix/* → develop
docs/* → develop
```

Ensure the PR includes:

- Clear description
- Screenshots (if UI changes)
- Related issue/task
- Testing summary

---

## 7. Code Review

Before merging:

- Code follows project architecture
- Documentation updated if necessary
- No merge conflicts
- CI checks pass
- Tests pass
- UI verified (if applicable)

---

## 8. Merge into Develop

Use **Squash and Merge** or **Merge Commit**, depending on the team's preference.

After merging:

```bash
git checkout develop
git pull origin develop

git branch -d feature/phase-4.3-budget-approval
```

Delete the remote branch:

```bash
git push origin --delete feature/phase-4.3-budget-approval
```

---

## 9. Release to Production

When a milestone or release is complete:

```bash
git checkout main
git pull origin main

git merge develop

git push origin main
```

Tag the release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

# Commit Message Convention

Follow the Conventional Commits specification.

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code refactoring |
| `style` | Formatting or styling changes |
| `docs` | Documentation changes |
| `test` | Add or update tests |
| `perf` | Performance improvements |
| `chore` | Maintenance tasks |
| `build` | Build system changes |
| `ci` | CI/CD configuration |

Examples:

```text
feat(budget): implement approval workflow

fix(allocation): prevent duplicate allocations

refactor(api): simplify controller logic

docs: update component library

style(ui): improve dashboard spacing

test(service): add allocation service tests
```

---

# Pull Request Checklist

Before opening a Pull Request:

- [ ] Latest `develop` branch merged
- [ ] Code builds successfully
- [ ] No console errors
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Screenshots included (UI changes)
- [ ] Self-review completed
- [ ] No unnecessary files committed

---

# Rules

- Never commit directly to `main`.
- Never develop directly on `develop`.
- Every task must use its own branch.
- Keep commits small and focused.
- Pull before starting new work.
- Resolve merge conflicts before requesting review.
- Rebase or merge `develop` regularly to reduce conflicts.
- Delete merged branches.
- Keep documentation synchronized with implementation.
- All production releases must be tagged.
- Every Pull Request should be reviewed before merging.

---

# Recommended Workflow

```
Start Task
    │
    ▼
Update develop
    │
    ▼
Create feature branch
    │
    ▼
Implement feature
    │
    ▼
Commit changes
    │
    ▼
Push branch
    │
    ▼
Open Pull Request
    │
    ▼
Code Review
    │
    ▼
Merge into develop
    │
    ▼
Testing
    │
    ▼
Release
    │
    ▼
Merge develop → main
    │
    ▼
Create Version Tag
```