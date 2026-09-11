import { eq } from 'drizzle-orm';
import type { APIContext } from 'astro';
import { getDatabase } from '../database/client';
import { newId } from '../security/crypto';
import { csrfFromForm, verifyCsrf } from '../security/csrf';
import { fieldErrors, formToObject } from '../validation/schemas';
import type { ResourceDef } from './resources';

export interface HandleResult {
  errors: Record<string, string>;
  values: Record<string, string>;
  /** Set when the mutation succeeded and the caller should redirect. */
  redirectTo?: string;
}

/**
 * Shared create/update handling for every admin resource: CSRF check,
 * validation against the resource's schema, then a single insert or update.
 */
export async function handleResourceSubmit(
  context: Pick<APIContext, 'request' | 'cookies' | 'locals'>,
  resource: ResourceDef,
  existingId: string | null,
): Promise<HandleResult> {
  const form = await context.request.formData();
  const values = formToObject(form);

  if (!verifyCsrf(context.request, context.cookies, csrfFromForm(form))) {
    return { errors: { _form: 'Your session expired. Please submit the form again.' }, values };
  }

  const database = getDatabase(context.locals);
  if (!database) {
    return { errors: { _form: 'No database is configured.' }, values };
  }

  // Unchecked checkboxes are simply absent from FormData; normalise them.
  for (const field of resource.fields) {
    if (field.type === 'checkbox') values[field.name] = values[field.name] ? 'true' : '';
  }

  const parsed = resource.schema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const row = resource.toRow(values);

  try {
    if (existingId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const idColumn = (resource.table as any).id;
      // The primary key is never rewritten by an update.
      const { id: _ignored, ...updates } = row as Record<string, unknown>;
      await database.update(resource.table).set(updates).where(eq(idColumn, existingId));
      return { errors: {}, values, redirectTo: `/admin/${resource.key}?status=saved` };
    }

    const id = resource.idPrefix ? newId(resource.idPrefix) : String(row.id ?? newId('row'));
    await database.insert(resource.table).values({ ...row, id });
    return { errors: {}, values, redirectTo: `/admin/${resource.key}?status=created` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Surface the common case (duplicate slug/key) as a field error.
    if (/UNIQUE constraint/i.test(message)) {
      return {
        errors: { _form: 'An entry with this slug or key already exists.' },
        values,
      };
    }
    return { errors: { _form: 'The entry could not be saved.' }, values };
  }
}
