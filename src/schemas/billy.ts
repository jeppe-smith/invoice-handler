import { z } from "zod"

export type DaybookTransactionLine = z.infer<typeof daybookTransactionLineSchema>
export type DaybookTransaction = z.infer<typeof daybookTransactionSchema>
export type DaybookTransactionInput = z.infer<typeof daybookTransactionInputSchema>
export type DaybookTransactionLineInput = z.infer<typeof daybookTransactionLineInputSchema>

const daybookTransactionLineSchema = z.object({
  accountId: z.string(),
  amount: z.number(),
  contraAccountId: z.string().nullable(),
  currencyId: z.string().nullable(),
  priority: z.number().nullable(),
  side: z.union([z.literal("debit"), z.literal("credit")]),
  taxRateId: z.string().nullable(),
  text: z.string().nullable(),
})

const daybookTransactionLineInputSchema = z.object({
  accountId: z.string(),
  amount: z.number(),
  contraAccountId: z.string().nullish(),
  currencyId: z.string().nullish(),
  priority: z.number().nullish(),
  side: z.union([z.literal("debit"), z.literal("credit")]),
  taxRateId: z.string().nullish(),
  text: z.string().nullish(),
})

const daybookTransactionSchema = z.object({
  apiType: z.literal("TEST_API").nullable(),
  daybookId: z.string(),
  entryDate: z.string(),
  id: z.string(),
  lines: z.array(daybookTransactionLineSchema),
  description: z.string().nullable(),
  amount: z.number().nullable(),
  state: z.union([
    z.literal("approved"),
    z.literal("draft"),
    z.literal("voided")
  ]),
  voucherNo: z.string().nullable(),
})


const daybookTransactionInputSchema = z.object({
  apiType: z.literal("TEST_API"),
  daybookId: z.string().nullish(),
  entryDate: z.string(),
  id: z.string().nullish(),
  lines: z.array(daybookTransactionLineInputSchema),
  description: z.string(),
  amount: z.number(),
  state: z.union([
    z.literal("approved"),
    z.literal("draft"),
    z.literal("voided")
  ]),
  voucherNo: z.string().nullish(),
})
