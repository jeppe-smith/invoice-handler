import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import { createInvoiceHandler } from "../../../server/invoiceHandler";
import { stripe } from "../../../server/stripe";
import { prisma } from "../../../server/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const sig = req.headers["stripe-signature"];
    const token = req.query.token;

    if (req.method !== "POST") {
      return res
        .setHeader("Allow", "POST")
        .status(405)
        .end("Method Not Allowed");
    }

    if (typeof sig !== "string") {
      return res.status(400).send("Missing Stripe signature");
    }

    if (typeof token !== "string") {
      return res.status(400).send("Missing token");
    }

    let event: Stripe.Event;
    const buf = await buffer(req);
    const user = await prisma.user.findUnique({
      where: { token },
      select: { settings: true },
    });

    if (!user) {
      return res.status(400).send("Invalid token");
    }

    const stripeApiKey = user.settings.find(
      ({ name }) => name === "stripeApiKey"
    );
    const stripeWebhookSecret = user.settings.find(
      ({ name }) => name === "stripeWebhookSecret"
    );
    const billyApiKey = user.settings.find(
      ({ name }) => name === "billyApiKey"
    );

    if (!stripeWebhookSecret) {
      return res.status(400).send("Missing Stripe webhook secret");
    }

    if (!stripeApiKey) {
      return res.status(400).send("Missing Stripe webhook secret");
    }

    if (!billyApiKey) {
      return res.status(400).send("Missing Stripe webhook secret");
    }

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        stripeWebhookSecret.value
      );
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error}`);
      return;
    }

    const invoiceHandler = createInvoiceHandler(
      billyApiKey.value,
      stripeApiKey.value
    );

    switch (event.type) {
      case "invoice.paid":
        invoiceHandler.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
};

export default handler;
