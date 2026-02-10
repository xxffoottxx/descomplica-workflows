# Projetos de Clientes

Client projects and custom implementations.

---

## Overview

This folder contains production-ready implementations and client-specific customizations.

Each client project should include:
- Custom workflows and configurations
- Client-specific documentation
- Deployment instructions
- Maintenance guides

---

## Structure

Organize client projects as:

```
Projetos de Clientes/
├── Cliente A/
│   ├── workflows/
│   ├── docs/
│   ├── config/
│   └── README.md
├── Cliente B/
│   ├── workflows/
│   ├── docs/
│   ├── config/
│   └── README.md
└── ...
```

---

## Best Practices

### Documentation
- Always include a README.md per client
- Document API keys and credentials location (never commit them)
- Include setup and deployment steps
- Add maintenance and troubleshooting guides

### Configuration
- Use environment variables for secrets
- Create `.env.example` files
- Document all required credentials

### Versioning
- Keep client projects in separate branches if needed
- Tag production releases
- Maintain changelog for each client

---

## From MVP to Client Project

When adapting an MVP for a client:

1. Copy relevant MVP folder to `Projetos de Clientes/[Client Name]/`
2. Customize configurations for client needs
3. Update documentation with client-specific details
4. Remove unnecessary files
5. Add deployment scripts
6. Create client-specific test cases

---

## Security

⚠️ **Important:**
- Never commit API keys, passwords, or tokens
- Use `.env` files (add to `.gitignore`)
- Keep sensitive client data in secure locations
- Document credential rotation procedures

---

## Support

For MVP templates, see:
- [../MVP/Chatbot/](../MVP/Chatbot/)
- [../MVP/Assistente de Voz/](../MVP/Assistente%20de%20Voz/)
