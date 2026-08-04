# Commit Convention

This project follows the **Conventional Commits** specification to maintain a clean and readable Git history.

---

# Commit Message Format

Use the following format:

```text
<type>(<scope>): <short description>
```

The **scope** is optional but highly recommended.

Examples:

```text
feat(budget): implement approval workflow

fix(allocation): prevent duplicate budget allocation

docs(api): update authentication endpoints

refactor(service): simplify approval validation
```

If no scope is needed:

```text
feat: add notification system

fix: resolve login redirect issue
```

---

# Commit Types

## feat

A new feature.

```text
feat(budget): implement budget approval workflow

feat(expense): add expense attachment upload
```

---

## fix

A bug fix.

```text
fix(auth): prevent unauthorized dashboard access

fix(report): correct monthly totals
```

---

## docs

Documentation changes only.

```text
docs: update API documentation

docs(git): improve workflow guide
```

---

## style

Formatting, whitespace, or UI styling changes that do not affect functionality.

```text
style(ui): improve dashboard spacing

style(table): align action buttons
```

---

## refactor

Code improvements without changing external behavior.

```text
refactor(service): simplify approval validation

refactor(repository): optimize allocation queries
```

---

## perf

Performance improvements.

```text
perf(report): optimize dashboard statistics query

perf(api): reduce blockchain verification time
```

---

## test

Adding or updating tests.

```text
test(service): add allocation service tests

test(api): add authentication integration tests
```

---

## build

Changes affecting the build system or dependencies.

```text
build: update Vite configuration

build: upgrade Prisma client
```

---

## ci

Changes to CI/CD pipelines or automation.

```text
ci: add GitHub Actions deployment workflow

ci: improve test pipeline
```

---

## chore

Maintenance tasks that do not modify application behavior.

```text
chore: update project dependencies

chore: remove unused assets
```

---

## revert

Revert a previous commit.

```text
revert: revert approval workflow changes
```

---

# Recommended Scopes

Use scopes whenever possible to indicate the affected module.

| Scope | Description |
|--------|-------------|
| `auth` | Authentication |
| `users` | User Management |
| `roles` | Role & Permission Management |
| `budget` | Budget Request |
| `allocation` | Budget Allocation |
| `approval` | Budget Approval |
| `expense` | Expense Management |
| `disbursement` | Fund Disbursement |
| `report` | Reports & Analytics |
| `blockchain` | Blockchain Integration |
| `dashboard` | Dashboard |
| `notification` | Notifications |
| `api` | Backend API |
| `ui` | User Interface |
| `database` | Database |
| `service` | Business Logic |
| `repository` | Repository Layer |
| `validation` | Validation |
| `middleware` | Middleware |
| `config` | Configuration |
| `docs` | Documentation |
| `security` | Security Features |
| `testing` | Tests |

---

# Good Commit Messages

### Features

```text
feat(budget): implement budget approval workflow

feat(expense): add receipt upload

feat(blockchain): store allocation hashes
```

---

### Bug Fixes

```text
fix(auth): prevent unauthorized access

fix(allocation): prevent duplicate allocations

fix(report): correct yearly statistics
```

---

### Refactoring

```text
refactor(service): simplify approval logic

refactor(repository): reduce duplicate queries
```

---

### Documentation

```text
docs: update project knowledge

docs(api): add endpoint documentation

docs(component): update component library
```

---

### Maintenance

```text
chore: update dependencies

build: upgrade Prisma

ci: improve deployment workflow
```

---

# Bad Commit Messages

❌

```text
update

fix

done

new

changes

asdf

test

final

working

commit
```

---

# Commit Best Practices

- Write commit messages in the **imperative mood**.
- Keep the summary under **72 characters**.
- Make each commit represent **one logical change**.
- Commit frequently during development.
- Use scopes whenever possible.
- Avoid mixing unrelated changes in a single commit.
- Do not commit generated files unless required.
- Ensure the project builds successfully before committing.

---

# Examples by Development Layer

### Frontend

```text
feat(ui): redesign dashboard cards

fix(ui): correct responsive navbar

style(ui): improve button spacing
```

### Backend

```text
feat(api): add budget approval endpoint

refactor(service): simplify approval workflow

fix(repository): prevent duplicate queries
```

### Database

```text
feat(database): add expense attachments table

fix(database): correct foreign key constraint
```

### Blockchain

```text
feat(blockchain): verify transaction hashes

fix(blockchain): handle RPC timeout

perf(blockchain): cache verification results
```

### Documentation

```text
docs: update design system

docs(git): revise branching strategy

docs(api): add OpenAPI examples
```