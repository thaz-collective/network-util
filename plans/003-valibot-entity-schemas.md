# 003 — Valibot entity schemas

Source only. Depends on: `002-valibot-primitive-schemas.md`. No `test/` files (later plan).

## Goal

Port the entity audit-field schemas into `src/valibot/entity/`, updating imports from the legacy
`#src/valibot/schema/*` alias paths to this package's own `#src/valibot/schema/*` (same alias
shape, different package).

## Files to create

### `src/valibot/entity/base-entity.ts`

Port from `thaz-utils/packages/network-util/src/valibot/entity/base-entity.ts`:

```ts
import * as v from 'valibot';

import { instant } from '#src/valibot/schema/instant';

export const baseEntity = v.object({
  created_at_timestamp: instant,
  created_by: v.string(),
  updated_at_timestamp: instant,
  updated_by: v.string(),
});
```

### `src/valibot/entity/active-entity.ts`

Port from legacy `entity/active-entity.ts`:

```ts
import * as v from 'valibot';

import { instant } from '#src/valibot/schema/instant';
import { responseNullable } from '#src/valibot/schema/nullable';

export const activeEntity = v.object({
  active_at_timestamp: instant,
  expired_at_timestamp: responseNullable(instant),
});
```

### `src/valibot/entity/extended-audit-entity.ts`

Port from legacy `entity/extended-audit-entity.ts`:

```ts
import * as v from 'valibot';

import { responseNullable } from '#src/valibot/schema/nullable';

export const extendedAuditEntity = v.object({
  created_by_process: responseNullable(v.string()),
  created_by_user_id: responseNullable(v.string()),
  updated_by_process: responseNullable(v.string()),
  updated_by_user_id: responseNullable(v.string()),
});
```

### `src/valibot/entity/soft-deleted-entity.ts`

Port from legacy `entity/soft-deleted-entity.ts`:

```ts
import * as v from 'valibot';

import { instant } from '#src/valibot/schema/instant';
import { responseNullable } from '#src/valibot/schema/nullable';

export const softDeletedEntity = v.object({
  soft_deleted_at_timestamp: responseNullable(instant),
});
```

### `src/valibot/entity/index.ts`

```ts
export * from './active-entity';
export * from './base-entity';
export * from './extended-audit-entity';
export * from './soft-deleted-entity';
```

Keep the original JSDoc comment on each schema (they document what each entity mixin represents).

## Verification

- Each entity file type-checks against the `instant`/`responseNullable` primitives from task 002.
