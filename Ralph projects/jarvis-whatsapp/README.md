# Jarvis — Assistente Pessoal WhatsApp

> Sistema de assistente pessoal de produtividade via WhatsApp, construído com n8n e Google Gemini Flash 2.5

## 🎯 Visão Geral

O Jarvis é um assistente inteligente acessível via WhatsApp que integra:
- ✉️ **Gmail** - Gestão completa de emails
- 📅 **Google Calendar** - Agendamento e consulta de eventos
- ✅ **Google Tasks** - Gestão de tarefas
- 📊 **Google Sheets** - Leitura e escrita de dados
- 👥 **Google Contacts** - Acesso a contactos
- 🤖 **Google Gemini Flash 2.5** - IA conversacional avançada
- 💬 **WhatsApp Business API** - Interface de comunicação

## 📁 Estrutura do Projeto

```
jarvis-whatsapp/
├── workflows/
│   └── jarvis-whatsapp-assistant.json   # Workflow principal n8n
├── docs/
│   └── customization-guide.md           # Guia de personalização
├── scripts/
│   └── validate-workflow.js             # Script de validação
├── reference/
│   └── jarvis-inspiration.json          # Workflow de referência
└── README.md
```

## 🚀 Quick Start

### Pré-requisitos

1. **n8n instalado** (self-hosted ou cloud)
2. **WhatsApp Business API** configurado
3. **Google Cloud Project** com APIs habilitadas:
   - Gmail API
   - Google Calendar API
   - Google Tasks API
   - Google Sheets API
   - Google Contacts API
4. **Google Gemini API** key

### Instalação

1. **Clone ou copie o workflow:**
   ```bash
   # Copie o ficheiro workflows/jarvis-whatsapp-assistant.json
   ```

2. **Importe no n8n:**
   - Abra n8n
   - Menu > Import from File
   - Selecione `jarvis-whatsapp-assistant.json`

3. **Configure as credenciais:**
   - Siga o [Guia de Personalização](docs/customization-guide.md)
   - Substitua todos os placeholders `YOUR_*_CREDENTIAL_ID`

4. **Configure o WhatsApp:**
   - Atualize `phoneNumberId` no nó "Enviar Resposta WhatsApp"
   - Gere um novo `webhookId` para o nó "WhatsApp Trigger"
   - Configure o webhook no Meta Business Manager

5. **Personalize o assistente:**
   - Altere o número autorizado no filtro
   - Atualize o nome do utilizador no system prompt
   - Ajuste fuso horário (padrão: Europe/Lisbon)

6. **Valide a configuração:**
   ```bash
   node scripts/validate-workflow.js
   ```

7. **Ative o workflow no n8n**

## 🔧 Configuração Descomplica (Padrão)

**WhatsApp Business:**
- Phone: `+351 923 124 800`
- Phone Number ID: `1005307842661678`
- WABA ID: `1455185509564906`

**Webhook:**
- Base URL: `https://n8n.descomplicador.pt/webhook/`

**Idioma:** Português Europeu (pt-PT)
**Fuso Horário:** Europe/Lisbon

## 🛠️ Arquitetura

### Fluxo Principal

```
WhatsApp Message
    ↓
[WhatsApp Trigger] → Recebe mensagem
    ↓
[Filtro de Remetente] → Valida número autorizado
    ↓
[Switch Tipo Mensagem] → Texto ou Áudio
    ↓
[AI Agent - Jarvis] ← Conectado a:
    ├─ Gemini Flash 2.5 (LLM)
    ├─ Memória de Conversa (Buffer Window)
    └─ 21 Tool Nodes:
        ├─ 6 Gmail Tools
        ├─ 6 Google Calendar Tools
        ├─ 1 Google Contacts Tool
        ├─ 3 Google Sheets Tools
        └─ 5 Google Tasks Tools
    ↓
[Formatar Resposta] → Prepara mensagem
    ↓
[Enviar WhatsApp] → Envia resposta
```

### Diferenças da Referência

| Aspecto | Referência | Jarvis Descomplica |
|---------|-----------|-------------------|
| **LLM** | OpenAI GPT-4 | Google Gemini Flash 2.5 |
| **Arquitetura** | MCP (Model Context Protocol) | Direct Tool Connections |
| **Idioma** | Inglês | Português (pt-PT) |
| **Voz** | ElevenLabs (pago) | Não implementado (TODO) |
| **Timezone** | Asia/Kolkata | Europe/Lisbon |
| **Dados** | Pessoais | Placeholders |

## 📊 Estatísticas do Workflow

- **Total de nós:** 29
- **Conexões:** 28
- **Tool nodes:** 21
- **Conexões AI:** 21
- **Idioma:** Português (pt-PT)
- **Credenciais necessárias:** 6 (Gmail, Calendar, Contacts, Sheets, Tasks, WhatsApp)

## 🧪 Validação

Execute o script de validação antes de fazer deploy:

```bash
node scripts/validate-workflow.js
```

**O script verifica:**
- ✅ Parsing JSON
- ✅ Unicidade de IDs de nós
- ✅ Integridade de conexões
- ✅ Placeholders de credenciais
- ✅ Idioma do system prompt (pt-PT)
- ✅ Configuração do Gemini
- ✅ Configuração do WhatsApp
- ⚠️ Dados pessoais expostos

## 📚 Documentação

### [Guia de Personalização](docs/customization-guide.md)

Instruções completas para:
- Substituir credenciais
- Alterar número autorizado
- Personalizar system prompt
- Mudar idioma/fuso horário
- Trocar Google Tasks por outro sistema
- Adicionar CRM
- Implementar suporte de voz
- Configurar webhook
- LGPD e dados sensíveis

## 🎭 Capacidades do Jarvis

### Gestão de Email
- ✉️ Enviar emails com formatação HTML
- ↩️ Responder a threads
- 📥 Buscar e filtrar emails
- 📝 Criar rascunhos
- 🏷️ Adicionar/listar etiquetas

### Gestão de Calendário
- 📅 Verificar disponibilidade
- ➕ Criar eventos
- 🔄 Atualizar/reagendar
- ❌ Eliminar eventos
- 📋 Listar próximos compromissos

### Gestão de Tarefas
- ✅ Criar tarefas com vencimento
- 📜 Listar tarefas pendentes/concluídas
- ✔️ Marcar como concluído
- 🗑️ Eliminar tarefas
- 📝 Adicionar notas

### Dados Estruturados
- 📊 Ler dados do Google Sheets
- ➕ Adicionar linhas
- 🧹 Limpar intervalos

### Contactos
- 🔍 Pesquisar contactos
- 📧 Obter emails/telefones

## 🔒 Segurança e LGPD

### Dados Armazenados
- **Memória de conversa:** Armazenada temporariamente no n8n (chave: número de telefone)
- **Logs:** Configure para `error` apenas em produção
- **Credenciais:** Use OAuth2, nunca hardcode passwords

### Conformidade LGPD
1. Documente tratamento de dados pessoais
2. Configure retenção de dados no n8n
3. Implemente direito ao esquecimento
4. Não logue conteúdo de mensagens
5. Use HTTPS para webhooks

## 🚦 Limitações Conhecidas

1. **Sem suporte de voz nativo** - Requer implementação manual (ver guia)
2. **Apenas texto WhatsApp** - Imagens/documentos não processados
3. **Um remetente autorizado** - Modificar filtro para múltiplos
4. **Memória por sessão** - Não persistente entre reinicializações
5. **Rate limits Google APIs** - Configurar quotas apropriadas

## 🔄 Manutenção

### Atualizações Recomendadas
- Monitore lançamentos do Gemini para novos modelos
- Atualize `typeVersion` dos nodes conforme n8n evolui
- Verifique mudanças na WhatsApp Business API
- Revise quotas e custos mensalmente

### Troubleshooting
1. **Mensagens não chegam:** Verifique webhook no Meta Business
2. **Credenciais expiradas:** Renovar OAuth2 tokens
3. **Erro no Gemini:** Verificar API key e quotas
4. **Resposta lenta:** Considerar migrar para Gemini Pro

## 📞 Suporte

**Questões técnicas:** andre@descomplicador.pt

**Descomplica:**
- Website: [descomplicador.pt](https://descomplicador.pt)
- WhatsApp: +351 923 124 800

## 📄 Licença

Este projeto é um template adaptável para clientes. Personalize conforme necessário.

## 🙏 Créditos

- Inspirado no workflow original de [referência](reference/jarvis-inspiration.json)
- Construído com [n8n](https://n8n.io)
- Powered by [Google Gemini](https://ai.google.dev)
- WhatsApp Business API by [Meta](https://business.whatsapp.com)

---

**Desenvolvido com ❤️ por Descomplica para automatizar produtividade**