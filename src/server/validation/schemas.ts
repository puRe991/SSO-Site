import { z } from 'zod';

/** Shared validation. Every mutating route parses input through these. */

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));
const optionalUrl = () => z.string().trim().pipe(z.url().max(500)).optional().or(z.literal(''));

export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email().max(254)),
  password: z.string().min(1).max(200),
  next: z.string().max(300).optional(),
});

export const registerSchema = z
  .object({
    email: z.string().trim().pipe(z.email().max(254)),
    password: z
      .string()
      .min(12, 'Use at least 12 characters.')
      .max(200)
      .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), 'Mix letters and numbers.'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match.',
    path: ['passwordConfirm'],
  });

export const applicationSchema = z.object({
  username: trimmed(2, 40),
  displayName: optionalText(60),
  country: optionalText(60),
  games: optionalText(300),
  mainGame: optionalText(80),
  discordUsername: trimmed(2, 60),
  motivation: trimmed(20, 2000),
  referral: optionalText(200),
  /**
   * Honeypot. Real users never see this field; bots fill it in. It is accepted
   * by the schema so the request can be silently discarded afterwards — an
   * error message would tell the bot what tripped it.
   */
  website: z.string().max(300).optional(),
});

export const contactSchema = z.object({
  name: trimmed(2, 80),
  email: z.string().trim().pipe(z.email().max(254)),
  subject: trimmed(3, 120),
  message: trimmed(10, 2000),
  /** Honeypot — see applicationSchema. */
  website: z.string().max(300).optional(),
});

export const memberSchema = z.object({
  slug: trimmed(2, 60).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only.'),
  username: trimmed(2, 40),
  displayName: optionalText(60),
  rank: optionalText(40),
  status: z.enum(['online', 'away', 'dnd', 'offline']),
  role: optionalText(60),
  bio: optionalText(2000),
  avatarUrl: optionalUrl(),
  mainGame: optionalText(80),
  joinedAt: optionalText(30),
  isVisible: z.coerce.boolean().optional(),
  isDemo: z.coerce.boolean().optional(),
});

export const gameSchema = z.object({
  slug: trimmed(2, 60).regex(/^[a-z0-9-]+$/),
  name: trimmed(1, 80),
  genre: optionalText(60),
  platforms: optionalText(200),
  coverUrl: optionalUrl(),
  description: optionalText(2000),
  status: z.enum(['active', 'casual', 'inactive', 'planned']),
  isDemo: z.coerce.boolean().optional(),
});

export const eventSchema = z.object({
  slug: trimmed(2, 80).regex(/^[a-z0-9-]+$/),
  title: trimmed(2, 120),
  description: optionalText(4000),
  gameId: optionalText(40),
  startsAt: z.string().trim().min(10).max(30),
  endsAt: optionalText(30),
  hostName: optionalText(80),
  participantLimit: z.coerce.number().int().min(0).max(10000).optional(),
  status: z.enum(['upcoming', 'live', 'completed', 'cancelled']),
  isDemo: z.coerce.boolean().optional(),
});

export const newsSchema = z.object({
  slug: trimmed(2, 100).regex(/^[a-z0-9-]+$/),
  title: trimmed(2, 160),
  teaser: optionalText(300),
  content: optionalText(40000),
  categoryId: optionalText(40),
  imageUrl: optionalUrl(),
  tags: optionalText(300),
  status: z.enum(['draft', 'published']),
  isDemo: z.coerce.boolean().optional(),
});

export const mediaSchema = z.object({
  title: trimmed(2, 120),
  category: z.enum(['screenshots', 'clan', 'events', 'games', 'videos', 'artwork']),
  kind: z.enum(['image', 'video']),
  url: z.string().trim().pipe(z.url().max(500)),
  thumbnailUrl: optionalUrl(),
  provider: z.enum(['youtube', 'twitch', 'local']).optional().or(z.literal('')),
  isDemo: z.coerce.boolean().optional(),
});

export const achievementSchema = z.object({
  slug: trimmed(2, 80).regex(/^[a-z0-9-]+$/),
  title: trimmed(2, 120),
  description: optionalText(1000),
  icon: optionalText(20),
  gameId: optionalText(40),
  achievedAt: optionalText(30),
  isDemo: z.coerce.boolean().optional(),
});

export const rankSchema = z.object({
  id: trimmed(2, 40).regex(/^[a-z0-9_]+$/),
  label: trimmed(1, 40),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  tone: z.enum(['primary', 'secondary', 'accent', 'neutral']),
});

export const profileSchema = z.object({
  displayName: optionalText(60),
  bio: optionalText(2000),
  avatarUrl: optionalUrl(),
  status: z.enum(['online', 'away', 'dnd', 'offline']),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    password: z.string().min(12, 'Use at least 12 characters.').max(200),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'Passwords do not match.',
    path: ['passwordConfirm'],
  });

/** Flattens a Zod error into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export function formToObject(form: FormData): Record<string, string> {
  const object: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') object[key] = value;
  }
  return object;
}
