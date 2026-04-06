---
name: single-component
description: Use when creating new React components. Each component should be small and in its own file. One component per file - avoid big monolithic files.
license: Complete terms in LICENSE.txt
---

This skill enforces small, focused React components - one component per file.

## Rules

1. **One component per file** - Never define multiple components in the same file
2. **Keep it small** - Components should be focused and under ~80 lines
3. **Each gets its own file** - `StudentList.tsx`, `StudentRow.tsx`, etc.

## Why

- **Composability**: Small components compose better
- **Testability**: Easier to unit test
- **Maintainability**: Easier to understand
- **Reusability**: Small components are more reusable

## Anti-Patterns

```tsx
// BAD - multiple components in one file
export function StudentList({ classId }) {
  return <table>...</table>;
}

function StudentRow({ student }) {
  return <tr>...</tr>;
}

function calculateAge(birthDate) { /* ... */ }
```

## Correct Pattern

Each component in its own file:

```tsx
// StudentList.tsx
export function StudentList({ classId }) {
  const { data: students } = useClassStudents(classId);
  return (
    <table>
      {students?.map((student) => (
        <StudentRow key={student.id} student={student} />
      ))}
    </table>
  );
}
```

```tsx
// StudentRow.tsx
interface StudentRowProps {
  student: Student;
}
export function StudentRow({ student }: StudentRowProps) {
  return <tr>...</tr>;
}
```

```tsx
// utils.ts or hooks/
export function calculateAge(birthDate: string): number { /* ... */ }
```

## Implementation

- Separate components into their own files
- Extract pure functions to `utils.ts` or custom hooks
- If a component grows beyond ~80 lines, split it
- Share types in `types.ts` files
