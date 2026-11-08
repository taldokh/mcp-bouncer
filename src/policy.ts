import * as z from 'zod/v4';

export const PolicyRuleSchema = z.enum(['allow', 'confirm', 'deny']);
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export const PolicySchema = z.record(z.string(), PolicyRuleSchema);
export type Policy = z.infer<typeof PolicySchema>;
