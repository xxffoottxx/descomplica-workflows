# Google Sheets Content Calendar Template
## Descomplicador.pt Social Media Scheduler

**Version:** 1.0
**Date:** 2026-03-04

---

## Sheet Name
`Descomplicador - Content Calendar`

---

## Tab 1: Calendario (Main Content Calendar)

### Column Structure

| Column | Header | Type | Validation | Notes |
|--------|--------|------|-----------|-------|
| A | `id` | Number | Auto-increment formula | Row identifier (formula: `=ROW()-1`) |
| B | `data_publicacao` | Date | Format: DD/MM/YYYY | Date when content should be published |
| C | `pilar_conteudo` | Text | Dropdown list | Content pillar (see options below) |
| D | `texto_principal` | Long Text | Max 2000 chars | Main content text to be adapted per platform |
| E | `imagem_url` | URL | Must start with https:// | Public URL to image file |
| F | `instagram` | Checkbox | TRUE/FALSE | Post to Instagram if checked |
| G | `linkedin` | Checkbox | TRUE/FALSE | Post to LinkedIn if checked |
| H | `facebook` | Checkbox | TRUE/FALSE | Post to Facebook if checked |
| I | `youtube` | Checkbox | TRUE/FALSE | Generate YouTube content (manual posting) |
| J | `status` | Text | Dropdown list | Post status (see options below) |

### Header Row (Row 1)

```
A1: id
B1: data_publicacao
C1: pilar_conteudo
D1: texto_principal
E1: imagem_url
F1: instagram
G1: linkedin
H1: facebook
I1: youtube
J1: status
```

**Header Row Formatting:**
- Bold text
- Background: `#4285F4` (Google Blue)
- Text color: White
- Freeze row (View → Freeze → 1 row)

---

## Data Validation Rules

### Column A: id (Auto-Increment)
**Formula in A2:** `=ROW()-1`
**Copy down to all rows**

### Column B: data_publicacao (Date)
**Criteria:** Date is valid date
**Custom error message:** "Insira uma data válida no formato DD/MM/YYYY"

**Conditional Formatting:**
- **Past dates** (< TODAY): Light red background `#F4CCCC`
- **Today** (= TODAY): Light green background `#D9EAD3`
- **Future dates** (> TODAY): White background (default)

**Rule:**
1. Select column B (from B2 downward)
2. Format → Conditional formatting
3. Rule 1: Custom formula `=B2<TODAY()` → Background red
4. Rule 2: Custom formula `=B2=TODAY()` → Background green

### Column C: pilar_conteudo (Dropdown)
**Criteria:** List from a range

**Options (create in Tab "Config", cells A2:A5):**
```
Educação
Vendas
Bastidores
Resultados
```

**Validation Setup:**
1. Select column C (from C2 downward)
2. Data → Data validation
3. Criteria: "List from a range"
4. Range: `Config!A2:A5`
5. On invalid data: Reject input
6. Show dropdown list in cell: Yes

### Column D: texto_principal (Text)
**Criteria:** Text length is less than or equal to 2000

**Validation Setup:**
1. Select column D (from D2 downward)
2. Data → Data validation
3. Criteria: "Text length" → "Less than or equal to" → 2000
4. Custom error message: "O texto não pode ter mais de 2000 caracteres"

### Column E: imagem_url (URL)
**Criteria:** Text contains `https://`

**Validation Setup:**
1. Select column E (from E2 downward)
2. Data → Data validation
3. Criteria: "Text contains" → `https://`
4. Custom error message: "Insira um URL válido começando com https://"

**Note:** URL must be publicly accessible (no authentication required)

**Accepted formats:**
- Google Drive (public share link converted to direct link)
- Cloudflare R2 public URL
- Imgur, Dropbox public links
- Any HTTPS image URL

### Columns F-I: Platform Checkboxes
**Type:** Checkbox (TRUE/FALSE)

**Setup:**
1. Select columns F, G, H, I (from row 2 downward)
2. Insert → Checkbox

**Default state:** Unchecked (FALSE)

### Column J: status (Dropdown)
**Criteria:** List of items

**Options:**
```
Agendado
Publicado
Erro
Manual Pendente
Cancelado
```

**Validation Setup:**
1. Select column J (from J2 downward)
2. Data → Data validation
3. Criteria: "List of items" → Enter options (comma-separated)
4. On invalid data: Reject input
5. Show dropdown list in cell: Yes

**Conditional Formatting:**
1. **Agendado:** Light blue `#CFE2F3`
2. **Publicado:** Light green `#D9EAD3`
3. **Erro:** Light red `#F4CCCC`
4. **Manual Pendente:** Light orange `#FCE5CD`
5. **Cancelado:** Light gray `#EFEFEF`

**Rules:**
1. Select column J (from J2 downward)
2. Format → Conditional formatting
3. Rule 1: Custom formula `=J2="Publicado"` → Background green
4. Rule 2: Custom formula `=J2="Erro"` → Background red
5. Rule 3: Custom formula `=J2="Agendado"` → Background blue
6. Rule 4: Custom formula `=J2="Manual Pendente"` → Background orange
7. Rule 5: Custom formula `=J2="Cancelado"` → Background gray

---

## Tab 2: Config (Configuration Data)

**Purpose:** Store dropdown options and reference data

### Content Pillars (A1:A5)
```
A1: Pilar de Conteúdo
A2: Educação
A3: Vendas
A4: Bastidores
A5: Resultados
```

### Status Options (B1:B6)
```
B1: Status
B2: Agendado
B3: Publicado
B4: Erro
B5: Manual Pendente
B6: Cancelado
```

### Platform Notes (C1:D6)
```
C1: Plataforma
D1: Automação Disponível

C2: Instagram
D2: ✅ Sim (imagens e carrosséis)

C3: LinkedIn
D3: ✅ Sim (apenas texto)

C4: Facebook
D4: ✅ Sim (fotos com texto)

C5: YouTube
D5: ❌ Não (publicação manual)

C6: Google Business
D6: ❌ Não (publicação manual)
```

---

## Tab 3: Guia de Utilização (Instructions Tab)

**Tab Name:** `Guia`

### Content (in Portuguese - pt-PT)

```
=================================================================================
            GUIA DE UTILIZAÇÃO — CALENDÁRIO DE CONTEÚDO
=================================================================================

COMO AGENDAR UMA PUBLICAÇÃO:

1. Vá para o separador "Calendario"

2. Preencha uma nova linha com:
   - Data de publicação (coluna B)
   - Pilar de conteúdo (coluna C): Educação, Vendas, Bastidores, ou Resultados
   - Texto principal (coluna D): Máximo 2000 caracteres
   - URL da imagem (coluna E): Link público começando com https://
   - Plataformas (colunas F-I): Marque as checkboxes das plataformas onde quer publicar
   - Status (coluna J): Selecione "Agendado"

3. IMPORTANTE:
   - A imagem deve estar num URL público (sem login)
   - Para imagens do Google Drive: clique direito → Obter link → "Qualquer pessoa com o link"
   - O workflow executa todos os dias às 09:00 (Açores)
   - Apenas posts com data = hoje serão publicados

4. APÓS A PUBLICAÇÃO:
   - O status muda automaticamente para "Publicado" (verde)
   - Se houver erro, muda para "Erro" (vermelho)
   - Receberá um email com o resumo da publicação

5. PUBLICAÇÃO MANUAL (YouTube e Google Business):
   - Estas plataformas NÃO têm automação disponível
   - O workflow gera o conteúdo adaptado e envia por email
   - Tem de copiar e colar manualmente na plataforma

=================================================================================

PILARES DE CONTEÚDO:

📚 EDUCAÇÃO
   - Dicas, tutoriais, explicações técnicas
   - "Como fazer", "Sabia que..."
   - Objetivo: Educar a audiência sobre automação e IA

💰 VENDAS
   - Promoções, casos de sucesso, testimoniais
   - "Experimente gratuitamente", demonstrações
   - Objetivo: Converter leads em clientes

🎬 BASTIDORES
   - Dia-a-dia, equipa, processo de trabalho
   - "Veja como fazemos", histórias pessoais
   - Objetivo: Humanizar a marca

📊 RESULTADOS
   - Métricas, antes/depois, impacto
   - "Poupámos X horas", "Aumentámos Y vendas"
   - Objetivo: Provar o valor com dados

=================================================================================

BOAS PRÁTICAS:

✅ Escreva o texto em linguagem natural — o AI adapta automaticamente para cada plataforma
✅ Use imagens de alta qualidade (mínimo 1080x1080px para Instagram)
✅ Planeie com antecedência (pelo menos 1 semana)
✅ Varie os pilares de conteúdo (não publique só vendas)
✅ Teste a imagem URL antes de agendar (abra o link num browser)

❌ Não use mais de 2000 caracteres no texto principal
❌ Não use links privados (Google Drive sem partilha pública)
❌ Não agende posts para o passado (use datas futuras ou hoje)
❌ Não confie apenas em YouTube/Google Business automáticos (são manuais)

=================================================================================

RESOLUÇÃO DE PROBLEMAS:

PROBLEMA: Status mudou para "Erro"
SOLUÇÃO: Verifique o email de notificação para detalhes do erro. Causas comuns:
   - URL de imagem inválido ou inacessível
   - Texto muito longo para a plataforma
   - Credenciais da plataforma expiradas (contacte o administrador)

PROBLEMA: Post não apareceu na plataforma
SOLUÇÃO:
   - Instagram/LinkedIn: Pode estar em revisão (demora até 24h)
   - Facebook: Verifique a página de publicações agendadas
   - Verifique se a data é hoje (apenas posts de hoje são publicados)

PROBLEMA: Quero cancelar um post agendado
SOLUÇÃO: Mude o status para "Cancelado" antes das 09:00 do dia da publicação

=================================================================================

SUPORTE: andrefloresbrasil@gmail.com
```

---

## Example Rows (Pre-filled)

### Row 2 (Example 1 - Educational Post)
```
A2: 1
B2: 06/03/2026
C2: Educação
D2: Sabia que 67% dos restaurantes em Portugal ainda não usam automação para reservas? Com um chatbot inteligente, pode gerir todas as reservas 24/7, sem perder nenhum cliente. Deixe a tecnologia trabalhar por si enquanto se foca no que faz melhor: servir os seus clientes. Quer saber como implementar isto no seu negócio? Fale connosco.
E2: https://exemplo.com/imagem-chatbot.jpg
F2: TRUE (checked)
G2: TRUE (checked)
H2: TRUE (checked)
I2: FALSE
J2: Agendado
```

### Row 3 (Example 2 - Sales Post)
```
A3: 2
B3: 08/03/2026
C3: Vendas
D3: OFERTA ESPECIAL MARÇO: Configure o seu assistente de voz para agendamento automático de consultas — GRÁTIS até 31 de março. Ideal para clínicas, cabeleireiros, e serviços de saúde. Reduza faltas e melhore a experiência dos seus clientes com confirmações automáticas por SMS. Vagas limitadas a 5 negócios. Contacte-nos hoje.
E3: https://exemplo.com/imagem-oferta-marco.jpg
F3: TRUE
G3: TRUE
H3: TRUE
I3: TRUE
J3: Agendado
```

### Row 4 (Example 3 - Behind-the-Scenes Post)
```
A4: 3
B4: 10/03/2026
C4: Bastidores
D4: Hoje estive a configurar um sistema de automação para um hotel aqui nos Açores. Ver a cara do gerente quando testámos o check-in automático e funcionou na perfeição foi impagável! É por momentos assim que adoro o que faço. A tecnologia deve simplificar, não complicar. E quando funciona bem, muda vidas.
E4: https://exemplo.com/imagem-bastidores-hotel.jpg
F4: TRUE
G4: FALSE
H4: TRUE
I4: FALSE
J4: Agendado
```

### Row 5 (Example 4 - Results Post)
```
A5: 4
B5: 12/03/2026
C5: Resultados
D5: CASO DE SUCESSO: Restaurante O Atlântico reduziu 40% das faltas em reservas depois de implementar o sistema de confirmação automática por WhatsApp. Resultado? Mais mesas ocupadas, menos desperdício, mais receita. A automação não é o futuro — é o presente. Quer resultados como estes no seu negócio?
E5: https://exemplo.com/imagem-caso-sucesso.jpg
F5: TRUE
G5: TRUE
H5: TRUE
I5: TRUE
J5: Agendado
```

---

## Google Sheets Setup Checklist

### Step 1: Create New Spreadsheet
1. Go to Google Sheets (https://sheets.google.com)
2. Click "Blank" to create new spreadsheet
3. Rename to: `Descomplicador - Content Calendar`

### Step 2: Create Tabs
1. Rename "Sheet1" to `Calendario`
2. Add tab: `Config`
3. Add tab: `Guia`

### Step 3: Set Up Headers (Calendario Tab)
1. Enter all column headers in row 1 (A1:J1)
2. Format row 1:
   - Bold
   - Background: `#4285F4`
   - Text color: White
3. Freeze row 1 (View → Freeze → 1 row)

### Step 4: Add Formulas
1. In A2: Enter `=ROW()-1`
2. Copy A2 down to A100 (or more)

### Step 5: Set Up Data Validation
1. **Column B (Date):** Select B2:B1000 → Data validation → Date is valid date
2. **Column C (Pillar):** Select C2:C1000 → Data validation → List from range → `Config!A2:A5`
3. **Column D (Text):** Select D2:D1000 → Data validation → Text length ≤ 2000
4. **Column E (URL):** Select E2:E1000 → Data validation → Text contains `https://`
5. **Columns F-I (Checkboxes):** Select F2:I1000 → Insert → Checkbox
6. **Column J (Status):** Select J2:J1000 → Data validation → List of items → `Agendado,Publicado,Erro,Manual Pendente,Cancelado`

### Step 6: Set Up Conditional Formatting
1. **Column B (Dates):**
   - Past: Custom formula `=B2<TODAY()` → Background `#F4CCCC`
   - Today: Custom formula `=B2=TODAY()` → Background `#D9EAD3`

2. **Column J (Status):**
   - Agendado: `=J2="Agendado"` → Background `#CFE2F3`
   - Publicado: `=J2="Publicado"` → Background `#D9EAD3`
   - Erro: `=J2="Erro"` → Background `#F4CCCC`
   - Manual Pendente: `=J2="Manual Pendente"` → Background `#FCE5CD`
   - Cancelado: `=J2="Cancelado"` → Background `#EFEFEF`

### Step 7: Fill Config Tab
1. Switch to `Config` tab
2. Enter column headers and options as specified above
3. Format headers with bold + background color

### Step 8: Fill Guia Tab
1. Switch to `Guia` tab
2. Copy entire guide text (see above)
3. Format with monospace font (Courier New) for better readability
4. Optionally: merge cells A1:F1 for full-width text block

### Step 9: Add Example Rows
1. Switch back to `Calendario` tab
2. Fill rows 2-5 with example posts (see above)
3. Use real or placeholder image URLs

### Step 10: Share with n8n Service Account
1. Click "Share" button (top right)
2. Add email: `n8n-automation@n8n-resumo-dia.iam.gserviceaccount.com` (or your SA email)
3. Set permission: **Editor** (n8n needs write access to update status)
4. Uncheck "Notify people"
5. Click "Share"

### Step 11: Get Spreadsheet ID
1. Look at the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
2. Copy the `{SPREADSHEET_ID}` part
3. Save it — you'll need this for n8n configuration

---

## Image Hosting Options

Since workflow requires publicly accessible image URLs, here are recommended hosting options:

### Option 1: Google Drive (Free, 15GB)
1. Upload image to Google Drive
2. Right-click → Get link → "Anyone with the link"
3. Copy link (format: `https://drive.google.com/file/d/{FILE_ID}/view`)
4. Convert to direct link: `https://drive.google.com/uc?export=view&id={FILE_ID}`

### Option 2: Cloudflare R2 (Recommended, Paid)
- $0.015/GB/month storage
- Free egress (no bandwidth charges)
- Public bucket URL: `https://pub-{bucket-id}.r2.dev/{file-name}`
- Set up custom domain for branded URLs

### Option 3: Imgur (Free, but has ads)
- Upload at https://imgur.com/upload
- Copy "Direct Link" (ends with `.jpg`, `.png`, etc.)
- Free up to 1250 uploads/day
- Images may be deleted if inactive for 6+ months

### Option 4: Self-Hosted (Caddy Static Path)
- Upload to VM: `/home/andrefloresbrasil/static/social-media-images/`
- Add Caddy route: `hub.descomplicador.pt/media/*`
- URL format: `https://hub.descomplicador.pt/media/image-name.jpg`
- No storage costs, full control

**Recommended:** Use Cloudflare R2 with custom domain for professional, reliable hosting.

---

## Maintenance Schedule

### Weekly
- Review upcoming posts (next 7 days)
- Verify all image URLs are accessible
- Check for any "Erro" status posts and retry

### Monthly
- Export sheet to backup (File → Download → Excel)
- Clean up old rows (>90 days) to keep sheet fast
- Review content performance (manually or via analytics)

### Quarterly
- Review content pillar balance (check distribution)
- Update example rows with new templates
- Audit image hosting (delete unused images)

---

## Template Download Link

**Google Sheets Template (View-Only):**
`[TO BE CREATED]`

**To use:**
1. Open link above
2. File → Make a copy
3. Rename to: `Descomplicador - Content Calendar`
4. Follow setup checklist to configure validation + sharing

---

**End of Content Calendar Template**
