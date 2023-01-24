import Stripe from "stripe";
import got, { Got } from "got";
import {
  DaybookTransactionLineInput,
  DaybookTransactionInput,
} from "../schemas/billy";
import dayjs from "dayjs";

type BillyMeta = {
  meta: {
    statusCode: number;
    success: boolean;
    paging: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
    time: number;
  };
};

type BillyResponse<K extends string, V extends unknown> = {
  [key in K]: V;
} & BillyMeta;

const SALES_ACCOUNT_ID = "27Gci2f4TwiyW1d7BEUjjg";
const STRIPE_ACCOUNT_ID = "fbRyO9UxQxCULcQIxgQ8Eg";

/**
 *
 * @param billyApiKey Billy API key
 * @param stripeApiKey Stripe API key
 * @returns methods to handle Stripe invoice events
 */
export function createInvoiceHandler(
  billyApiKey: string,
  stripeApiKey: string
) {
  const stripe = new Stripe(stripeApiKey, {
    apiVersion: "2022-11-15",
  });
  const billy = got.extend({
    prefixUrl: "https://api.billysbilling.com/v2",
    headers: {
      "X-Access-Token": billyApiKey,
    },
  });

  async function handleInvoicePaid(invoice: Stripe.Invoice) {
    const charge = await stripe.charges.retrieve(invoice.charge as string, {
      expand: ["balance_transaction"],
    });
    const exchangeRate = getExchangeRate(charge);
    const transactionLines = invoice.lines.data.flatMap((lineItem) =>
      getDaybookTransactionLines(lineItem, exchangeRate)
    );
    const transaction: DaybookTransactionInput = {
      apiType: "TEST_API",
      entryDate: formatDate(invoice.created * 1000),
      state: "draft",
      lines: transactionLines,
      description: invoice.id,
      amount: getExchangedAmountRounded(invoice.amount_paid, exchangeRate),
    };

    await billy.post("/daybookTransactions", {
      json: {
        daybookTransactions: [transaction],
      },
    });

    console.log("posted invoice", invoice);
  }

  return {
    handleInvoicePaid,
  };
}

function getDaybookTransactionLines(
  lineItem: Stripe.InvoiceLineItem,
  exchangeRate: number
): [DaybookTransactionLineInput, DaybookTransactionLineInput] {
  const amount = getExchangedAmountRounded(lineItem.amount, exchangeRate);
  const taxRateId = getTaxRateId(lineItem);

  return [
    {
      accountId: SALES_ACCOUNT_ID,
      amount,
      side: "credit",
      taxRateId,
    },
    {
      accountId: STRIPE_ACCOUNT_ID,
      amount,
      side: "debit",
    },
  ];
}

function getExchangeRate(charge: Stripe.Charge) {
  if (
    !charge.balance_transaction ||
    typeof charge.balance_transaction === "string"
  ) {
    throw new Error("charge.balance_transaction is missing or not expanded");
  }

  return charge.balance_transaction.exchange_rate || 1;
}

function getExchangedAmountRounded(cents: number, exchangeRate: number) {
  return Math.round(cents * exchangeRate) / 100;
}

function getTaxRateId(lineItem: Stripe.InvoiceLineItem) {
  const taxAmounts = lineItem.tax_amounts?.filter(
    (taxAmount) => taxAmount.amount > 0
  );

  if (!taxAmounts || taxAmounts.length === 0) {
    return null;
  }

  if (taxAmounts.length > 1) {
    throw new Error("multiple applied tax_rates not supported");
  }

  const taxRate = taxAmounts[0]!.tax_rate;

  if (typeof taxRate === "string") {
    return taxRate;
  } else {
    return taxRate.id;
  }
}

function formatDate(timestamp: number) {
  return dayjs(timestamp * 1000).format("YYYY-MM-DD");
}
