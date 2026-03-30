<p align="center">
  <h1 align="center">Quaderno MCP Server</h1>
  <p align="center">
    Connect any AI assistant to <a href="https://quaderno.io/">Quaderno</a>'s tax compliance engine via the <a href="https://modelcontextprotocol.io/">Model Context Protocol</a>.
    <br />
    Calculate taxes. Validate tax IDs. Create invoices. All from natural language.
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-compatible-brightgreen.svg" alt="MCP Compatible" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-blue.svg" alt="TypeScript" /></a>
</p>

---

## The Problem

Tax compliance across borders is a nightmare. Different VAT rates per country, tax ID validation against government databases, reverse charge rules, digital services taxes... and your AI assistant can't help because it has no access to real-time tax data.

## The Solution

This MCP server gives any AI assistant (Claude, GPT, etc.) direct access to Quaderno's tax engine. Ask in plain English, get accurate, compliant answers.

```
You: "What tax should I charge for a SaaS sale to a customer in Spain?"
AI:  IVA at 21% — status: taxable, currency: EUR
```

## Tools

| Tool | What it does |
|------|-------------|
| **`calculate_tax`** | Real-time tax rate calculation by country, postal code, and product type |
| **`validate_tax_id`** | Validate VAT/GST/ABN numbers against EU VIES, UK HMRC, and more |
| **`create_contact`** | Create customers and companies with full billing details |
| **`create_invoice`** | Generate tax-compliant invoices with automatic tax calculation |
| **`list_invoices`** | Search and filter invoices by contact, status, or date |

## Quick Start

### 1. Get your API key

Sign up at [quaderno.io](https://quaderno.io/) or create a free [sandbox account](https://sandbox-quadernoapp.com/) for testing. Find your API key in **Settings > API Keys**.

### 2. Configure for Claude Desktop

Add to your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "quaderno": {
      "command": "node",
      "args": ["/path/to/quaderno-mcp-server/dist/index.js"],
      "env": {
        "QUADERNO_API_KEY": "sk_live_your_key_here",
        "QUADERNO_API_URL": "https://your-account.quadernoapp.com/api"
      }
    }
  }
}
```

> For sandbox testing, use `https://your-account.sandbox-quadernoapp.com/api`

## Examples

### Tax calculation

> "What's the VAT rate for selling digital services in Spain?"

```json
{
  "country": "ES",
  "name": "IVA",
  "rate": 21.0,
  "tax_code": "eservice",
  "status": "taxable",
  "currency": "EUR"
}
```

### Tax ID validation

> "Is this Spanish tax ID valid? ESB86412491"

```json
{
  "valid": true
}
```

### Full invoicing flow

> "Create a company contact for TechCorp in Madrid and invoice them 500 EUR for consulting"

The AI will chain `create_contact` → `create_invoice` automatically, producing a tax-compliant invoice with the correct Spanish IVA applied.

## Supported Tax Jurisdictions

Quaderno supports **real-time tax calculation** for 200+ countries and tax ID validation for:

- **EU**: All 27 member states (VAT via VIES)
- **United Kingdom**: VAT via HMRC
- **Switzerland**: UID
- **Australia**: ABN/GST
- **New Zealand**: GST
- **Canada**: Quebec QST

## Development

```bash
git clone https://github.com/AnderRahe/quaderno-mcp-server.git
cd quaderno-mcp-server
npm install
cp .env.example .env   # Add your credentials
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
| `QUADERNO_API_URL` | Yes | Full API base URL including `/api` |

## Built With

- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk) — Server framework
- [Quaderno API](https://developers.quaderno.io/api/) — Tax compliance engine
- [Zod](https://zod.dev/) — Schema validation
- TypeScript + stdio transport

## License

[MIT](LICENSE)
