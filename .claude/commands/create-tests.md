# Generic Test Generation Prompt

Create comprehensive tests for the files I just created, modified, or refactored. Follow existing test patterns in the codebase and only create tests where they add meaningful value.

## Test Strategy:
- **Unit Tests**: For domain logic, business rules, and pure functions
- **Integration Tests**: For service interactions and data flow
- **Component Tests**: For React hooks and UI logic (if applicable)
- **E2E Tests**: Only for critical user workflows

## Requirements:
- Follow existing test framework and patterns in the codebase
- Place tests in `__tests__` directories alongside source files
- Mock external dependencies appropriately
- Focus on business logic and error conditions
- Ensure tests are maintainable and not brittle

## Skip Testing If:
- Code is simple CRUD operations
- Logic is trivial or just data transformation
- Tests would be mostly mocking with little business value
- Existing tests already cover the functionality

Only create tests that meaningfully improve code quality and catch real bugs.