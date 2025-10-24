<!--
Sync Impact Report - Constitution Update
=========================================
Version Change: 0.0.0 → 1.0.0
Date: 2025-10-25

Modified Principles:
- NEW: I. Code Quality Standards
- NEW: II. Testing Standards (NON-NEGOTIABLE)
- NEW: III. User Experience Consistency
- NEW: IV. Performance Requirements

Added Sections:
- Core Principles (4 principles focused on quality, testing, UX, performance)
- Quality Gates
- Development Workflow
- Governance

Removed Sections: None (initial version)

Templates Status:
✅ plan-template.md - Constitution Check section compatible
✅ spec-template.md - User scenarios and requirements align with principles
✅ tasks-template.md - Task structure supports quality gates and testing discipline
⚠️  Command prompts - Review recommended to ensure alignment with new principles

Follow-up TODOs: None
-->

# FantasyOS Constitution

## Core Principles

### I. Code Quality Standards

**Code MUST meet the following non-negotiable quality criteria:**

- **Readability First**: Code is written for humans first, machines second. Clear naming, logical structure, and self-documenting code are mandatory.
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion MUST guide all design decisions.
- **No Magic Numbers**: All constants MUST be named and their purpose documented.
- **Error Handling**: ALL error paths MUST be explicitly handled - no silent failures allowed.
- **Code Review Required**: No code reaches production without peer review. Reviewer MUST verify adherence to all constitution principles.
- **Linting Compliance**: Zero linter warnings/errors before commit. Configure appropriate linters (ESLint, Pylint, RuboCop, etc.) per language.
- **Documentation**: Public APIs, complex algorithms, and non-obvious business logic MUST have inline documentation.

**Rationale**: Technical debt compounds exponentially. Quality standards enforced from day one prevent costly rewrites and ensure long-term maintainability. Code is read 10x more than it's written.

### II. Testing Standards (NON-NEGOTIABLE)

**Test-Driven Development (TDD) is MANDATORY for all feature work:**

- **Red-Green-Refactor Cycle**: Write failing test → Make it pass → Refactor for quality.
- **Test First, Then Implement**: Tests MUST be written before implementation code. Tests MUST fail initially, proving they test the right behavior.
- **Coverage Minimums**:
  - Unit Tests: 80% code coverage minimum for business logic
  - Integration Tests: All API contracts and inter-service communication MUST have integration tests
  - Contract Tests: Required for all public APIs and library interfaces
- **Test Organization**:
  - `tests/unit/` - Fast, isolated unit tests (no I/O, no network)
  - `tests/integration/` - Component integration tests (database, APIs, services)
  - `tests/contract/` - API contract and interface compliance tests
- **Test Quality**:
  - Tests MUST be deterministic (no flaky tests)
  - Tests MUST be independent (can run in any order)
  - Test names MUST clearly describe what is being tested and expected behavior
  - Given-When-Then structure for acceptance tests
- **CI/CD Gates**: All tests MUST pass before merge. No exceptions.

**Rationale**: Testing is not optional. TDD prevents bugs, improves design, serves as living documentation, and enables confident refactoring. The cost of fixing bugs increases exponentially from development through production.

### III. User Experience Consistency

**User-facing features MUST provide a consistent, predictable experience:**

- **Design System Compliance**: All UI components MUST use approved design system patterns, colors, typography, and spacing.
- **Accessibility (a11y) is Mandatory**:
  - WCAG 2.1 Level AA compliance minimum
  - Keyboard navigation for all interactive elements
  - Screen reader support with appropriate ARIA labels
  - Color contrast ratios MUST meet accessibility standards
  - Focus indicators clearly visible
- **Responsive Design**: Interfaces MUST work across device sizes (mobile, tablet, desktop) with appropriate breakpoints.
- **Error Messages**: User-facing errors MUST be:
  - Human-readable (no stack traces or error codes shown to end users)
  - Actionable (tell users what to do next)
  - Consistent in tone and format
- **Loading States**: All async operations MUST show appropriate loading indicators.
- **Feedback Mechanisms**: User actions MUST receive immediate feedback (button press states, form validation, success confirmations).
- **Internationalization (i18n) Ready**: Text MUST be externalized for translation, not hardcoded.

**Rationale**: Inconsistent UX creates confusion, increases support costs, and damages user trust. Accessibility is a legal requirement and moral obligation. Users judge quality by the interface, not the code underneath.

### IV. Performance Requirements

**Performance is a feature, not an afterthought. All code MUST meet these standards:**

- **Response Time Budgets**:
  - API endpoints: p95 < 200ms for read operations, < 500ms for write operations
  - Page loads: First Contentful Paint < 1.5s, Time to Interactive < 3.5s
  - UI interactions: Feedback within 100ms, complete action within 1s
- **Resource Constraints**:
  - Memory: No unbounded growth, proper cleanup of resources
  - Database: N+1 query prevention, use connection pooling, index all queried fields
  - Network: Minimize requests, implement caching strategies, use pagination for large datasets
- **Scalability Considerations**:
  - Algorithms MUST be analyzed for time/space complexity
  - O(n²) or worse MUST be justified and approved
  - Batch operations for bulk processing
  - Async/background jobs for long-running tasks
- **Performance Testing**:
  - Baseline performance metrics MUST be established for critical paths
  - Load testing required for endpoints expected to handle > 100 req/s
  - Performance regression tests in CI for critical operations
- **Monitoring & Profiling**:
  - Application Performance Monitoring (APM) required in production
  - Slow query logging enabled
  - Performance budgets enforced in CI

**Rationale**: Poor performance directly impacts user satisfaction, conversion rates, and operational costs. Performance problems are expensive to fix after launch. Users abandon slow applications - 53% of mobile users leave sites that take > 3s to load.

## Quality Gates

**These gates MUST be passed before code can proceed to the next phase:**

### Before Implementation:
- [ ] Feature specification approved with clear acceptance criteria
- [ ] Tests written and failing (proving they test the right behavior)
- [ ] Performance budget defined for new features
- [ ] Accessibility requirements identified
- [ ] Design system components identified/approved

### Before Code Review:
- [ ] All tests passing (unit, integration, contract)
- [ ] Linter passes with zero warnings/errors
- [ ] Code coverage meets minimums (80% for business logic)
- [ ] Documentation complete for public APIs
- [ ] Self-review completed using constitution checklist

### Before Merge:
- [ ] Peer review approved by at least one reviewer
- [ ] Constitution compliance verified by reviewer
- [ ] CI/CD pipeline passes all checks
- [ ] Performance tests pass (no regressions)
- [ ] Accessibility audit passed for UI changes
- [ ] Security scan passes (no critical/high vulnerabilities)

### Before Production:
- [ ] Integration tests pass in staging environment
- [ ] Load testing completed for high-traffic features
- [ ] Monitoring/alerting configured
- [ ] Rollback plan documented
- [ ] User documentation updated (if applicable)

## Development Workflow

**Standard development cycle for all features:**

1. **Specification Phase**: Create detailed spec with user stories, acceptance criteria, and success metrics (`/speckit.specify`)
2. **Planning Phase**: Technical design, architecture decisions, complexity analysis (`/speckit.plan`)
3. **Test-First Development**:
   - Write tests based on acceptance criteria
   - Verify tests fail
   - Implement minimum code to pass tests
   - Refactor for quality
4. **Review Phase**: Peer review verifying constitution compliance
5. **Integration Phase**: Merge to main branch after all gates pass
6. **Deployment Phase**: Deploy to staging → production with monitoring

**Complexity Justification Required**: Any violation of simplicity principles (e.g., introducing new frameworks, architectural patterns, or dependencies) MUST be documented with:
- Why the complexity is needed
- What simpler alternative was rejected and why
- Approval from tech lead

## Governance

**Constitution Authority**: This constitution supersedes all other development practices, conventions, and guidelines. In case of conflict, constitution principles take precedence.

**Amendment Process**:
- Amendments MUST be proposed with clear rationale
- Breaking changes require tech lead and team approval
- Version bumping follows semantic versioning:
  - **MAJOR**: Backward-incompatible governance changes (principle removals/redefinitions)
  - **MINOR**: New principles added or material expansions
  - **PATCH**: Clarifications, wording improvements, non-semantic refinements
- All amendments MUST include migration plan for existing code
- Amendments MUST be propagated to all template files

**Compliance Enforcement**:
- All code reviews MUST verify constitution compliance
- Automated CI checks enforce quality gates
- Quarterly constitution audits to ensure ongoing alignment
- Non-compliance requires documented justification or remediation plan

**Version History**: All constitution versions tracked in git history with clear change documentation.

**Version**: 1.0.0 | **Ratified**: 2025-10-25 | **Last Amended**: 2025-10-25
