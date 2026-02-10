# Guia de Personalização - Jarvis WhatsApp Assistant

## Visão Geral
Este guia explica como personalizar e adaptar o assistente Jarvis WhatsApp para diferentes clientes e casos de uso.

## 1. Configuração de Credenciais

### 1.1 Gmail
Substitua os placeholders de credenciais Gmail em todos os nós de email:
```json
"credentials": {
  "gmailOAuth2": {
    "id": "YOUR_GMAIL_CREDENTIAL_ID",
    "name": "YOUR_GMAIL_CREDENTIAL_NAME"
  }
}
```

**Passos:**
1. No n8n, vá para **Credentials** > **Add Credential**
2. Selecione **Gmail OAuth2**
3. Configure a autenticação OAuth com a conta Google do cliente
4. Copie o ID e nome da credencial
5. Substitua nos nós: `Enviar Email`, `Responder Email`, `Obter Emails`, `Rascunhar Email`, `Adicionar Etiqueta`, `Obter Etiquetas`

### 1.2 Google Calendar
```json
"credentials": {
  "googleCalendarOAuth2": {
    "id": "YOUR_GCAL_CREDENTIAL_ID",
    "name": "YOUR_GCAL_CREDENTIAL_NAME"
  }
}
```

**Substitua nos nós:** `Verificar Disponibilidade`, `Obter Eventos`, `Criar Evento`, `Atualizar Evento`, `Eliminar Evento`, `Obter Evento`

Também altere o email do calendário:
```json
"calendar": {
  "__rl": true,
  "mode": "list",
  "value": "YOUR_CALENDAR_EMAIL",  // <- Altere para email do cliente
  "cachedResultName": "YOUR_CALENDAR_EMAIL"
}
```

### 1.3 Google Contacts
```json
"credentials": {
  "googleContactsOAuth2": {
    "id": "YOUR_GCONTACTS_CREDENTIAL_ID",
    "name": "YOUR_GCONTACTS_CREDENTIAL_NAME"
  }
}
```

**Substitua no nó:** `Obter Contactos`

### 1.4 Google Sheets
```json
"credentials": {
  "googleSheetsOAuth2": {
    "id": "YOUR_GSHEETS_CREDENTIAL_ID",
    "name": "YOUR_GSHEETS_CREDENTIAL_NAME"
  }
}
```

**Substitua nos nós:** `Ler Folha`, `Adicionar Linha`, `Limpar Linhas`

### 1.5 Google Tasks
```json
"credentials": {
  "googleTasksOAuth2": {
    "id": "YOUR_GTASKS_CREDENTIAL_ID",
    "name": "YOUR_GTASKS_CREDENTIAL_NAME"
  }
}
```

**Substitua nos nós:** `Criar Tarefa`, `Obter Tarefas`, `Obter Tarefa`, `Completar Tarefa`, `Eliminar Tarefa`

### 1.6 WhatsApp Business API
```json
"credentials": {
  "whatsAppApi": {
    "id": "YOUR_WHATSAPP_CREDENTIAL_ID",
    "name": "YOUR_WHATSAPP_CREDENTIAL_NAME"
  }
}
```

**Substitua no nó:** `Enviar Resposta WhatsApp`

**Configure também:**
- `phoneNumberId` no nó `Enviar Resposta WhatsApp`: atualmente `1005307842661678` (Descomplica)
- `webhookId` no nó `WhatsApp Trigger`: gere um novo UUID para cada instalação

## 2. Filtro de Número de Telefone

No nó **"Filtro de Remetente Autorizado"**, altere o número autorizado:

```json
{
  "leftValue": "={{ $json.messages[0].from }}",
  "rightValue": "YOUR_PHONE_NUMBER"  // <- Substitua pelo número do cliente (formato: 351923124800)
}
```

**Formato:** Apenas dígitos, sem `+` ou espaços. Exemplo:
- Portugal: `351923124800`
- Brasil: `5511999887766`

**Múltiplos números:** Para autorizar vários remetentes, adicione condições extras com combinator `"or"`.

## 3. Personalização do Sistema Prompt

### 3.1 Nome do Utilizador
No nó **Jarvis**, altere todas as referências ao nome:

Busque por: `André` ou `"André"`
Substitua por: Nome do cliente

### 3.2 Fuso Horário
```
- Fuso horário: Europe/Lisbon
```
Altere para o fuso horário do cliente: `America/Sao_Paulo`, `America/New_York`, etc.

Também altere nos nós de calendário:
```json
"timezone": {
  "__rl": true,
  "mode": "list",
  "value": "Europe/Lisbon",  // <- Altere aqui
  "cachedResultName": "Europe/Lisbon"
}
```

### 3.3 Idioma
O sistema prompt atual está em **Português Europeu (pt-PT)**.

Para outros idiomas:
- **Português Brasileiro:** Substitua `"utilizador"` → `"usuário"`, ajuste formalidade
- **Inglês:** Traduza todo o `systemMessage` no nó Jarvis
- **Espanhol:** Traduza conforme necessário

### 3.4 Tom e Personalidade
Ajuste as diretrizes no prompt:
```
## Identidade Principal
- Você é profissional, prestativo e proativo
- Sempre mantenha um tom de assistente pessoal - atencioso mas não excessivamente casual
```

Exemplos de personalização:
- **Formal corporativo:** "Você é extremamente profissional e formal, usa linguagem corporativa"
- **Casual amigável:** "Você é amigável e descontraído, usa linguagem informal"
- **Técnico:** "Você é técnico e preciso, fornece detalhes exatos"

## 4. Substituir Google Tasks por Outro Sistema

Se o cliente usa Asana, Trello, Monday.com, etc.:

1. **Remova os nós Google Tasks:**
   - `Criar Tarefa`
   - `Obter Tarefas`
   - `Obter Tarefa`
   - `Completar Tarefa`
   - `Eliminar Tarefa`

2. **Adicione nós do sistema escolhido:**
   - Procure no n8n por integrações nativas (ex: `n8n-nodes-base.asana`)
   - Configure como Tool nodes com `descriptionType: "manual"`
   - Conecte ao nó Jarvis via conexão `ai_tool`

3. **Atualize o system prompt:**
   Substitua a secção "Gestão de Tarefas" com referências ao novo sistema.

## 5. Adicionar CRM / Base de Dados de Vendas

### 5.1 Opções de CRM Suportadas no n8n
- HubSpot (`n8n-nodes-base.hubspot`)
- Salesforce (`n8n-nodes-base.salesforce`)
- Pipedrive (`n8n-nodes-base.pipedrive`)
- Airtable (`n8n-nodes-base.airtable`)
- Notion (`n8n-nodes-base.notion`)

### 5.2 Passos para Adicionar
1. **Crie um novo nó** do tipo CRM escolhido
2. **Configure como Tool:**
   ```json
   {
     "parameters": {
       "descriptionType": "manual",
       "toolDescription": "Descrição em pt-PT do que esta ferramenta faz",
       ...
     },
     "type": "n8n-nodes-base.hubspot",
     "typeVersion": X
   }
   ```

3. **Conecte ao Jarvis:**
   ```json
   "connections": {
     "Nome do Nó CRM": {
       "ai_tool": [
         [
           {
             "node": "Jarvis",
             "type": "ai_tool",
             "index": 0
           }
         ]
       ]
     }
   }
   ```

4. **Atualize o prompt do sistema:**
   Adicione uma secção descrevendo as capacidades do CRM.

## 6. Adicionar Suporte de Voz

### 6.1 Aviso Importante
O workflow atual **não inclui suporte de voz** porque:
- n8n não possui nó nativo gratuito de Speech-to-Text
- A referência usava ElevenLabs (serviço pago)
- Para manter o template acessível, voz foi marcada como TODO

### 6.2 Opções para Implementar Voz

**Opção A: OpenAI Whisper API** (pago, ~$0.006/min)
```json
{
  "parameters": {
    "resource": "audio",
    "operation": "transcribe",
    "binaryPropertyName": "data",
    "options": {
      "language": "pt",
      "temperature": 0
    }
  },
  "type": "@n8n/n8n-nodes-langchain.openAi",
  "name": "Transcrever Áudio"
}
```

**Opção B: Google Cloud Speech-to-Text** (grátis 60 min/mês)
Use um HTTP Request node para chamar a API Google Cloud STT.

**Opção C: Self-hosted Whisper**
Configure Whisper em servidor próprio e use HTTP Request.

### 6.3 Como Conectar Voice ao Workflow

1. **Obter URL do áudio:**
   Adicione nó após Switch path "Áudio":
   ```json
   {
     "parameters": {
       "resource": "media",
       "operation": "mediaUrlGet",
       "mediaGetId": "={{ $json.messages[0].audio.id }}"
     },
     "type": "n8n-nodes-base.whatsApp",
     "name": "Obter URL Áudio"
   }
   ```

2. **Download do áudio:**
   ```json
   {
     "parameters": {
       "url": "={{ $json.url }}",
       "authentication": "predefinedCredentialType",
       "nodeCredentialType": "whatsAppApi"
     },
     "type": "n8n-nodes-base.httpRequest",
     "name": "Download Áudio"
   }
   ```

3. **Transcrição:** Use um dos métodos acima

4. **Conecte ao Jarvis:** Output da transcrição → input do Jarvis

### 6.4 Sem Suporte de Voz
Se não quiser implementar voz:
1. Remova a condição "Áudio" do Switch
2. Ou adicione resposta automática: "Desculpe, áudio não é suportado"

## 7. Personalizar Resposta de Erro

No nó **Formatar Resposta**, altere a mensagem de erro padrão:
```json
{
  "value": "={{ $json.output || $json.error || 'Erro ao processar resposta' }}"
}
```

Sugestões:
- Português: `'Desculpe, ocorreu um erro. Tente novamente.'`
- Inglês: `'Sorry, an error occurred. Please try again.'`
- Com suporte: `'Erro ao processar. Contacte suporte@example.com'`

## 8. Webhook e Deployment

### 8.1 Webhook URL
O WhatsApp Business API precisa de um webhook público. Configure:

1. **URL base:** `https://n8n.descomplicador.pt/webhook/`
2. **Webhook ID:** Mude o `webhookId` no nó `WhatsApp Trigger` para um UUID único
3. **URL final:** `https://n8n.descomplicador.pt/webhook/YOUR_WEBHOOK_ID`

### 8.2 Configuração no Meta Business

1. Acesse [Meta Business Suite](https://business.facebook.com/)
2. Vá para **WhatsApp** > **Configuration**
3. Configure o webhook:
   - **Callback URL:** URL do passo anterior
   - **Verify Token:** Configure um token e adicione na configuração n8n
   - **Fields:** Marque `messages`

### 8.3 Phone Number ID
No nó `Enviar Resposta WhatsApp`, altere:
```json
"phoneNumberId": "1005307842661678"  // <- ID do WhatsApp Business do cliente
```

Encontre o Phone Number ID em: Meta Business > WhatsApp > API Setup

## 9. Dados Sensíveis / LGPD

### 9.1 Memória de Conversa
A memória usa o número de telefone como chave:
```json
"sessionKey": "={{ $json.messages[0].from }}"
```

**Atenção:** Dados são armazenados em memória temporária do n8n. Para conformidade LGPD:
- Configure retenção de dados no n8n
- Documente o tratamento de dados pessoais
- Implemente direito ao esquecimento (limpar sessões)

### 9.2 Logs
Desative logs sensíveis no n8n:
- **Settings** > **Log Level**: `error` apenas
- Não logue conteúdo de mensagens em produção

## 10. Testes Pré-Deploy

Antes de ativar o workflow:

1. **Valide JSON:**
   ```bash
   node scripts/validate-workflow.js
   ```

2. **Teste cada ferramenta individualmente:**
   - Execute cada nó manualmente no n8n
   - Verifique credenciais
   - Confirme permissões OAuth

3. **Teste fluxo completo:**
   - Use o número autorizado
   - Envie mensagens de teste
   - Verifique respostas

4. **Teste casos extremos:**
   - Mensagem muito longa
   - Pedido impossível de executar
   - Credenciais inválidas

## 11. Checklist de Personalização

- [ ] Todas as credenciais substituídas
- [ ] Número de telefone autorizado configurado
- [ ] Nome do utilizador alterado no prompt
- [ ] Fuso horário ajustado
- [ ] Email do calendário configurado
- [ ] Phone Number ID do WhatsApp configurado
- [ ] Webhook ID único gerado
- [ ] Idioma/tom ajustado conforme necessário
- [ ] System prompt personalizado
- [ ] Suporte de voz configurado ou desabilitado
- [ ] Ferramentas opcionais (CRM, etc.) adicionadas
- [ ] Testes realizados
- [ ] Documentação de dados sensíveis (LGPD)

## 12. Suporte e Manutenção

### 12.1 Logs e Debugging
- Acesse **Executions** no n8n para ver histórico
- Use `console.log()` em Code nodes para debug
- Ative modo de teste antes de deploy

### 12.2 Atualizações
- **Gemini model:** Altere `"model": "gemini-2.0-flash-exp"` para versões mais recentes
- **n8n nodes:** Verifique `typeVersion` para atualizações
- **API changes:** Monitore mudanças no WhatsApp Business API

### 12.3 Escalabilidade
- Use n8n Cloud para auto-scaling
- Configure rate limits nas APIs Google
- Monitore custos de API (especialmente Gemini)

## Contato
Para questões técnicas sobre esta implementação: andre@descomplicador.pt
