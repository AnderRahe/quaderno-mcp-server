# Quaderno MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that connects AI assistants to the [Quaderno](https://quaderno.io/) tax compliance API. Calculate taxes, validate tax IDs, manage contacts, and create invoices — all from your AI workflow.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Why

Tax compliance is hard. Quaderno makes it easy — and this MCP server lets any AI assistant tap into Quaderno's tax engine. No more manual lookups for VAT rates, tax ID validation, or invoice creation.

## Tools

| Tool | Description |
|------|-------------|
| `calculate_tax` | Calculate applicable tax rate by country, postal code, and product type |
| `validate_tax_id` | Validate VAT/GST/ABN numbers (EU, UK, Switzerland, Australia, NZ, Canada) |
| `create_contact` | Create a customer or company contact |
| `create_invoice` | Create a tax-compliant invoice with line items |
| `list_invoices` | List and filter invoices by contact, state, or date |

## Quick Start

### 1. Get your Quaderno API key

Sign up at [quaderno.io](https://quaderno.io/) (or use the [sandbox](https://sandbox-quadernoapp.com/) for testing) and get your API key from **Settings > API Keys**.

### 2. Configure Claude Desktop

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "quaderno": {
      "command": "node",
      "args": ["/path/to/quaderno-mcp-server/dist/index.js"],
      "env": {
        "QUADERNO_API_KEY": "your_api_key",
        "QUADERNO_API_URL": "https://YOUR_ACCOUNT.quadernoapp.com/api"
      }
    }
  }
}
```

For the sandbox, use `https://YOUR_ACCOUNT.sandbox-quadernoapp.com/api` as the URL.

### 3. Use with npx (coming soon)

```bash
QUADERNO_API_KEY=your_key QUADERNO_API_URL=https://acct.quadernoapp.com/api npx quaderno-mcp-server
```

## Tool Examples

### Calculate tax for a sale to Germany

> "What's the tax rate for selling a SaaS subscription to a customer in Berlin, Germany?"

The `calculate_tax` tool will be called with:
- `to_country`: `DE`
- `to_postal_code`: `10115`
- `tax_code`: `saas`

Returns the applicable VAT rate (19%), tax name, and whether reverse charge applies.

### Validate a VAT number

> "Is VAT number DE123456789 valid?"

The `validate_tax_id` tool will be called with:
- `country`: `DE`
- `tax_id`: `DE123456789`

Returns validation status and company details if available.

### Create a contact and invoice

> "Create a contact for Acme Corp in Spain and invoice them €500 for consulting"

1. `create_contact` with `kind: company`, `first_name: Acme Corp`, `country: ES`
2. `create_invoice` with the returned contact ID, a line item for €500 consulting

## Development

```bash
git clone https://github.com/YOUR_USER/quaderno-mcp-server.git
cd quaderno-mcp-server
npm install
cp .env.example .env   # Add your API credentials
npm run build
```

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node ./dist/index.js
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `QUADERNO_API_KEY` | Yes | Your Quaderno private API key |
| `QUADERNO_API_URL` | Yes | API base URL (e.g. `https://acct.quadernoapp.com/api`) |

## License

MIT
