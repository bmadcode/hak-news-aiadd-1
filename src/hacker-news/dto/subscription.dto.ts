import { z } from 'zod';

/**
 * Schema for email validation
 */
export const EmailSchema = z
  .string()
  .email()
  .transform((email) => email.toLowerCase());

/**
 * Schema for subscription type validation
 */
export const SubscriptionTypeSchema = z
  .string()
  .regex(/^[a-z]+(?::[a-z]+)*$/)
  .refine((type) => type.startsWith('hak') || type.startsWith('ai'), {
    message: 'Subscription type must start with "hak" or "ai"',
  });

/**
 * Schema for subscription request
 */
export const SubscriptionRequestSchema = z.object({
  email: EmailSchema,
  subscriptionType: SubscriptionTypeSchema,
});

/**
 * Type for subscription request
 */
export type SubscriptionRequest = z.infer<typeof SubscriptionRequestSchema>;

/**
 * Schema for subscription response
 */
export const SubscriptionResponseSchema = z.object({
  message: z.string(),
  email: EmailSchema,
  subscriptionType: SubscriptionTypeSchema,
  status: z.enum(['subscribed', 'unsubscribed']),
});

/**
 * Type for subscription response
 */
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;

/**
 * Schema for get subscribers response
 */
export const GetSubscribersResponseSchema = z.object({
  subscriptionType: SubscriptionTypeSchema,
  subscribers: z.array(EmailSchema),
  count: z.number(),
});

/**
 * Type for get subscribers response
 */
export type GetSubscribersResponse = z.infer<
  typeof GetSubscribersResponseSchema
>;
