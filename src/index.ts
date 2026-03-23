#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.QUADERNO_API_KEY;
const API_URL = process.env.QUADERNO_API_URL;

if (!API_KEY || !API_URL) {
  console.error(
    "Missing environment variables. Set QUADERNO_API_KEY and QUADERNO_API_URL."
  );
  process.exit(1);
}

const AUTH_HEADER =
  "Basic " + Buffer.from(`${API_KEY}:x`).toString("base64");

async function quadernoFetch(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: AUTH_HEADER,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  let data: unknown;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { ok: response.ok, status: response.status, data };
}

function formatResult(result: { ok: boolean; status: number; data: unknown }) {
  if (!result.ok) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error ${result.status}: ${JSON.stringify(result.data, null, 2)}`,
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(result.data, null, 2) },
    ],
  };
}

// --- Server ---

const server = new McpServer({
  name: "quaderno",
  version: "1.0.0",
});

// Tool 1: Calculate Tax
server.registerTool(
  "calculate_tax",
  {
    title: "Calculate Tax",
    description:
      "Calculate the applicable tax rate for a transaction based on customer location, product type, and optionally a tax ID. Returns the tax rate, tax name, and whether reverse charge applies.",
    inputSchema: {
      to_country: z
        .string()
        .describe("ISO 3166-1 alpha-2 country code of the customer (e.g. DE, US, GB)"),
      to_postal_code: z
        .string()
        .optional()
        .describe("Customer postal code — required for US tax calculations"),
      to_city: z.string().optional().describe("Customer city"),
      tax_code: z
        .string()
        .optional()
        .describe(
          "Tax code for the product/service (e.g. eservice, saas, ebook, standard)"
        ),
      tax_id: z
        .string()
        .optional()
        .describe(
          "Customer tax ID (e.g. VAT number). If valid, reverse charge may apply"
        ),
      amount: z
        .number()
        .optional()
        .describe("Transaction amount — used to calculate the tax amount"),
    },
  },
  async (params) => {
    const query = new URLSearchParams();
    query.set("to_country", params.to_country);
    if (params.to_postal_code) query.set("to_postal_code", params.to_postal_code);
    if (params.to_city) query.set("to_city", params.to_city);
    if (params.tax_code) query.set("tax_code", params.tax_code);
    if (params.tax_id) query.set("tax_id", params.tax_id);
    if (params.amount !== undefined) query.set("amount", String(params.amount));

    const result = await quadernoFetch(`/tax_rates/calculate?${query}`);
    return formatResult(result);
  }
);

// Tool 2: Validate Tax ID
server.registerTool(
  "validate_tax_id",
  {
    title: "Validate Tax ID",
    description:
      "Validate a tax identification number (VAT, GST, ABN, etc.). Supports EU VAT numbers, UK VAT, Switzerland, Australia, New Zealand, and Canada (Quebec).",
    inputSchema: {
      country: z
        .string()
        .describe("ISO 3166-1 alpha-2 country code (e.g. DE, GB, AU)"),
      tax_id: z.string().describe("Tax identification number to validate"),
    },
  },
  async (params) => {
    const query = new URLSearchParams();
    query.set("country", params.country);
    query.set("tax_id", params.tax_id);

    const result = await quadernoFetch(`/tax_ids/validate?${query}`);
    return formatResult(result);
  }
);

// Tool 3: Create Contact
server.registerTool(
  "create_contact",
  {
    title: "Create Contact",
    description:
      "Create a new contact (customer or company) in Quaderno. The contact can later be referenced when creating invoices.",
    inputSchema: {
      kind: z
        .enum(["person", "company"])
        .describe("Whether the contact is a person or a company"),
      first_name: z.string().describe("First name (or company name if kind=company)"),
      last_name: z.string().optional().describe("Last name"),
      email: z.string().optional().describe("Email address"),
      tax_id: z.string().optional().describe("Tax identification number (VAT, NIF, etc.)"),
      country: z
        .string()
        .optional()
        .describe("ISO 3166-1 alpha-2 country code"),
      postal_code: z.string().optional().describe("Postal code"),
      city: z.string().optional().describe("City"),
      street_line_1: z.string().optional().describe("Street address line 1"),
      street_line_2: z.string().optional().describe("Street address line 2"),
      region: z.string().optional().describe("State or region"),
      phone_1: z.string().optional().describe("Phone number"),
      language: z
        .string()
        .optional()
        .describe("Two-letter language code for invoices (e.g. en, es, de)"),
    },
  },
  async (params) => {
    const result = await quadernoFetch("/contacts", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return formatResult(result);
  }
);

// Tool 4: Create Invoice
server.registerTool(
  "create_invoice",
  {
    title: "Create Invoice",
    description:
      "Create a tax-compliant invoice in Quaderno. You can reference an existing contact by ID or provide a contact name. Items include description, quantity, and unit price.",
    inputSchema: {
      contact_id: z
        .number()
        .optional()
        .describe("ID of an existing Quaderno contact"),
      contact_name: z
        .string()
        .optional()
        .describe("Contact name — used if contact_id is not provided"),
      currency: z
        .string()
        .optional()
        .describe("ISO 4217 currency code (e.g. USD, EUR). Defaults to account currency"),
      items_attributes: z
        .array(
          z.object({
            description: z.string().describe("Item description"),
            quantity: z.number().default(1).describe("Quantity"),
            unit_price: z.number().describe("Unit price (before tax)"),
            discount_rate: z
              .number()
              .optional()
              .describe("Discount percentage (0-100)"),
            tax_code: z
              .string()
              .optional()
              .describe("Tax code (e.g. eservice, saas)"),
          })
        )
        .describe("Line items for the invoice"),
      po_number: z.string().optional().describe("Purchase order number"),
      notes: z.string().optional().describe("Notes to appear on the invoice"),
      payment_details: z
        .string()
        .optional()
        .describe("Payment instructions"),
      tag_list: z.string().optional().describe("Comma-separated tags"),
    },
  },
  async (params) => {
    const result = await quadernoFetch("/invoices", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return formatResult(result);
  }
);

// Tool 5: List Invoices
server.registerTool(
  "list_invoices",
  {
    title: "List Invoices",
    description:
      "List invoices from your Quaderno account. Supports filtering by contact name, state, and date.",
    inputSchema: {
      q: z
        .string()
        .optional()
        .describe("Search by contact name"),
      state: z
        .string()
        .optional()
        .describe("Filter by state (e.g. outstanding, paid, late, archived)"),
      date: z
        .string()
        .optional()
        .describe("Filter by date (YYYY-MM-DD format)"),
      page: z
        .number()
        .optional()
        .describe("Page number for pagination (25 results per page)"),
    },
  },
  async (params) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.state) query.set("state", params.state);
    if (params.date) query.set("date", params.date);
    if (params.page) query.set("page", String(params.page));

    const qs = query.toString();
    const path = qs ? `/invoices?${qs}` : "/invoices";
    const result = await quadernoFetch(path);
    return formatResult(result);
  }
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
