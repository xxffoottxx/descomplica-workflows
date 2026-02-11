"""
Generate realistic test data for Ralph's Hardware Store dashboard.
Business: Loja de Ferragens Ralph (Portuguese hardware store)
Period: 3 months (December 2025 - February 2026)
"""

import csv
import random
import os
from datetime import datetime, timedelta, date

random.seed(42)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "test-data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Constants ---
START_DATE = date(2025, 12, 1)
END_DATE = date(2026, 2, 10)

CUSTOMERS = [
    "João Silva", "Maria Santos", "António Ferreira", "Ana Costa", "Manuel Oliveira",
    "Teresa Rodrigues", "Carlos Almeida", "Isabel Pereira", "Francisco Sousa", "Luísa Martins",
    "Pedro Gonçalves", "Helena Fernandes", "Rui Lopes", "Beatriz Ribeiro", "José Mendes",
    "Catarina Gomes", "Miguel Carvalho", "Sara Teixeira", "Tiago Marques", "Inês Correia",
    "Nuno Pinto", "Sofia Cardoso", "André Moreira", "Rita Araújo", "Filipe Nunes",
    "Marta Vieira", "Paulo Monteiro", "Cláudia Duarte", "Bruno Barbosa", "Joana Cunha",
    "Ricardo Matos", "Patrícia Reis", "Diogo Tavares", "Raquel Lourenço", "Sérgio Fonseca",
    "Vera Machado", "Daniel Coelho", "Lúcia Rocha", "Hugo Azevedo", "Susana Borges",
    "Empresa MegaConstruções Lda.", "Construções Silva & Filhos", "Encanamentos Rápidos Lda.",
    "Electricista Pinto", "Pinturas Modernas Lda.", "Carpintaria São José",
    "Empreiteira do Norte S.A.", "Obras & Reformas Lda.", "Serralharia Central",
    "Imobiliária Atlântico", "Condomínio Bela Vista", "Junta de Freguesia Local",
    "Câmara Municipal", "Hotel Praia Azul", "Restaurante O Marinheiro",
]

PRODUCTS = [
    # Ferramentas manuais
    {"name": "Martelo de Carpinteiro 500g", "sku": "FER-001", "price": 12.90, "cat": "ferramentas", "min": 15},
    {"name": "Chave de Fendas Phillips PH2", "sku": "FER-002", "price": 4.50, "cat": "ferramentas", "min": 25},
    {"name": "Alicate Universal 200mm", "sku": "FER-003", "price": 8.90, "cat": "ferramentas", "min": 12},
    {"name": "Chave Inglesa Ajustável 250mm", "sku": "FER-004", "price": 14.50, "cat": "ferramentas", "min": 10},
    {"name": "Serrote Manual 500mm", "sku": "FER-005", "price": 11.90, "cat": "ferramentas", "min": 8},
    {"name": "Fita Métrica 5m", "sku": "FER-006", "price": 6.90, "cat": "ferramentas", "min": 20},
    {"name": "Nível de Bolha 60cm", "sku": "FER-007", "price": 9.50, "cat": "ferramentas", "min": 10},
    {"name": "Conjunto Chaves Allen 9pcs", "sku": "FER-008", "price": 7.90, "cat": "ferramentas", "min": 15},
    {"name": "Esquadro Metálico 300mm", "sku": "FER-009", "price": 5.50, "cat": "ferramentas", "min": 10},
    {"name": "X-ato Profissional", "sku": "FER-010", "price": 3.90, "cat": "ferramentas", "min": 20},
    # Ferramentas elétricas
    {"name": "Berbequim Aparafusador 18V", "sku": "ELE-001", "price": 89.90, "cat": "eletrica", "min": 5},
    {"name": "Rebarbadora 125mm 750W", "sku": "ELE-002", "price": 49.90, "cat": "eletrica", "min": 4},
    {"name": "Serra Circular 185mm", "sku": "ELE-003", "price": 79.90, "cat": "eletrica", "min": 3},
    {"name": "Lixadora Orbital 240W", "sku": "ELE-004", "price": 39.90, "cat": "eletrica", "min": 4},
    {"name": "Pistola de Calor 2000W", "sku": "ELE-005", "price": 34.90, "cat": "eletrica", "min": 3},
    # Tintas e acabamentos
    {"name": "Tinta Plástica Branca 15L", "sku": "TIN-001", "price": 42.90, "cat": "tintas", "min": 10},
    {"name": "Tinta Plástica Branca 5L", "sku": "TIN-002", "price": 18.90, "cat": "tintas", "min": 15},
    {"name": "Esmalte Sintético 0.75L", "sku": "TIN-003", "price": 12.50, "cat": "tintas", "min": 12},
    {"name": "Primário Aderente 5L", "sku": "TIN-004", "price": 24.90, "cat": "tintas", "min": 8},
    {"name": "Verniz Marítimo 0.75L", "sku": "TIN-005", "price": 15.90, "cat": "tintas", "min": 10},
    {"name": "Rolo de Pintura 220mm", "sku": "TIN-006", "price": 4.90, "cat": "tintas", "min": 25},
    {"name": "Trincha Plana 70mm", "sku": "TIN-007", "price": 3.50, "cat": "tintas", "min": 20},
    {"name": "Fita de Mascarar 50m", "sku": "TIN-008", "price": 2.90, "cat": "tintas", "min": 30},
    {"name": "Diluente Celuloso 1L", "sku": "TIN-009", "price": 5.90, "cat": "tintas", "min": 15},
    {"name": "Massa de Reparação 1kg", "sku": "TIN-010", "price": 6.50, "cat": "tintas", "min": 15},
    # Canalização
    {"name": "Tubo PVC 50mm 3m", "sku": "CAN-001", "price": 8.90, "cat": "canalizacao", "min": 15},
    {"name": "Tubo PVC 110mm 3m", "sku": "CAN-002", "price": 14.90, "cat": "canalizacao", "min": 10},
    {"name": "Torneira Lavatório Monocomando", "sku": "CAN-003", "price": 29.90, "cat": "canalizacao", "min": 6},
    {"name": "Sifão Lavatório Cromado", "sku": "CAN-004", "price": 7.50, "cat": "canalizacao", "min": 10},
    {"name": "Vedante Teflon 12m", "sku": "CAN-005", "price": 1.90, "cat": "canalizacao", "min": 40},
    {"name": "Cola PVC 250ml", "sku": "CAN-006", "price": 6.90, "cat": "canalizacao", "min": 15},
    {"name": "Joelho PVC 90° 50mm", "sku": "CAN-007", "price": 1.50, "cat": "canalizacao", "min": 30},
    {"name": "Válvula de Esfera 1/2\"", "sku": "CAN-008", "price": 8.90, "cat": "canalizacao", "min": 12},
    # Eletricidade
    {"name": "Cabo Elétrico H05VV 3x1.5 100m", "sku": "ELC-001", "price": 45.90, "cat": "eletricidade", "min": 5},
    {"name": "Cabo Elétrico H05VV 3x2.5 100m", "sku": "ELC-002", "price": 69.90, "cat": "eletricidade", "min": 4},
    {"name": "Tomada Dupla Encastrar", "sku": "ELC-003", "price": 5.90, "cat": "eletricidade", "min": 20},
    {"name": "Interruptor Simples Encastrar", "sku": "ELC-004", "price": 4.50, "cat": "eletricidade", "min": 20},
    {"name": "Quadro Elétrico 12 Módulos", "sku": "ELC-005", "price": 18.90, "cat": "eletricidade", "min": 5},
    {"name": "Disjuntor 16A", "sku": "ELC-006", "price": 8.90, "cat": "eletricidade", "min": 15},
    {"name": "Lâmpada LED E27 10W", "sku": "ELC-007", "price": 3.90, "cat": "eletricidade", "min": 30},
    {"name": "Fita Isoladora Preta 20m", "sku": "ELC-008", "price": 1.90, "cat": "eletricidade", "min": 30},
    # Construção
    {"name": "Cimento Portland 25kg", "sku": "CON-001", "price": 5.90, "cat": "construcao", "min": 20},
    {"name": "Argamassa Cola 25kg", "sku": "CON-002", "price": 7.90, "cat": "construcao", "min": 15},
    {"name": "Betumadeira Inox 200mm", "sku": "CON-003", "price": 6.90, "cat": "construcao", "min": 10},
    {"name": "Balde Pedreiro 12L", "sku": "CON-004", "price": 4.50, "cat": "construcao", "min": 10},
    {"name": "Colher de Pedreiro 200mm", "sku": "CON-005", "price": 5.90, "cat": "construcao", "min": 10},
    {"name": "Reboco Projetável 25kg", "sku": "CON-006", "price": 9.90, "cat": "construcao", "min": 10},
    # Fixação e parafusaria
    {"name": "Parafusos Madeira 4x40 cx200", "sku": "FIX-001", "price": 5.90, "cat": "fixacao", "min": 20},
    {"name": "Parafusos Madeira 5x60 cx100", "sku": "FIX-002", "price": 6.50, "cat": "fixacao", "min": 20},
    {"name": "Buchas Nylon 8mm cx100", "sku": "FIX-003", "price": 4.90, "cat": "fixacao", "min": 25},
    {"name": "Pregos Aço 50mm 1kg", "sku": "FIX-004", "price": 3.90, "cat": "fixacao", "min": 15},
    {"name": "Silicone Transparente 280ml", "sku": "FIX-005", "price": 5.50, "cat": "fixacao", "min": 20},
    {"name": "Espuma Poliuretano 750ml", "sku": "FIX-006", "price": 7.90, "cat": "fixacao", "min": 12},
    {"name": "Fita Adesiva Dupla Face 19mm", "sku": "FIX-007", "price": 4.50, "cat": "fixacao", "min": 15},
    {"name": "Abraçadeiras Plástico cx100", "sku": "FIX-008", "price": 3.50, "cat": "fixacao", "min": 20},
    # Segurança e EPI
    {"name": "Luvas de Trabalho Couro", "sku": "SEG-001", "price": 6.90, "cat": "seguranca", "min": 15},
    {"name": "Óculos de Proteção", "sku": "SEG-002", "price": 4.50, "cat": "seguranca", "min": 12},
    {"name": "Máscara Anti-Poeira FFP2 cx10", "sku": "SEG-003", "price": 8.90, "cat": "seguranca", "min": 15},
    {"name": "Capacete de Obra Branco", "sku": "SEG-004", "price": 7.90, "cat": "seguranca", "min": 8},
    {"name": "Botas de Segurança S3 nº42", "sku": "SEG-005", "price": 39.90, "cat": "seguranca", "min": 4},
    # Jardim
    {"name": "Mangueira 25m 1/2\"", "sku": "JAR-001", "price": 19.90, "cat": "jardim", "min": 6},
    {"name": "Tesoura de Poda", "sku": "JAR-002", "price": 9.90, "cat": "jardim", "min": 8},
    {"name": "Pá de Jardim", "sku": "JAR-003", "price": 12.90, "cat": "jardim", "min": 6},
    {"name": "Luvas de Jardim", "sku": "JAR-004", "price": 4.90, "cat": "jardim", "min": 10},
    {"name": "Adubo Universal 5kg", "sku": "JAR-005", "price": 8.90, "cat": "jardim", "min": 10},
]

SUPPLIERS = [
    "Wurth Portugal", "Stanley Black & Decker", "Bosch Portugal",
    "CIN Tintas", "Robbialac", "Barbot",
    "Tigre Portugal", "Geberit", "Grohe",
    "Legrand", "Schneider Electric", "Philips Iluminação",
    "Secil", "Cimpor", "Weber Saint-Gobain",
    "Fischer Portugal", "Hilti Portugal", "Sika Portugal",
    "3M Portugal", "Bellota", "Bahco",
    "Gardena", "Husqvarna", "STIHL Portugal",
]

# Map categories to supplier subsets
CAT_SUPPLIERS = {
    "ferramentas": ["Wurth Portugal", "Stanley Black & Decker", "Bahco", "Bellota"],
    "eletrica": ["Bosch Portugal", "Stanley Black & Decker", "Hilti Portugal"],
    "tintas": ["CIN Tintas", "Robbialac", "Barbot"],
    "canalizacao": ["Tigre Portugal", "Geberit", "Grohe"],
    "eletricidade": ["Legrand", "Schneider Electric", "Philips Iluminação"],
    "construcao": ["Secil", "Cimpor", "Weber Saint-Gobain", "Sika Portugal"],
    "fixacao": ["Fischer Portugal", "Hilti Portugal", "Sika Portugal", "Wurth Portugal", "3M Portugal"],
    "seguranca": ["3M Portugal", "Wurth Portugal"],
    "jardim": ["Gardena", "Husqvarna", "STIHL Portugal", "Bellota"],
}

TEAM = [
    {"name": "Ralph Medeiros", "role": "Proprietário / Gerente"},
    {"name": "Carla Figueiredo", "role": "Subgerente"},
    {"name": "Bruno Tavares", "role": "Vendedor Sénior"},
    {"name": "Ana Beatriz Sousa", "role": "Vendedora"},
    {"name": "Tiago Mendes", "role": "Vendedor"},
    {"name": "Sérgio Pinto", "role": "Armazém / Stock"},
    {"name": "Marta Coelho", "role": "Caixa / Atendimento"},
    {"name": "Fernando Lopes", "role": "Entregas / Motorista"},
]

TASK_TEMPLATES = [
    # Recurring
    ("Verificar stock mínimo e fazer encomendas", "Sérgio Pinto", "high"),
    ("Organizar montra da loja", "Ana Beatriz Sousa", "medium"),
    ("Limpar e arrumar armazém", "Sérgio Pinto", "medium"),
    ("Atualizar preços no sistema", "Carla Figueiredo", "high"),
    ("Verificar prazos de validade (tintas/colas)", "Sérgio Pinto", "medium"),
    ("Conferir caixa do dia", "Marta Coelho", "high"),
    ("Responder a orçamentos pendentes", "Bruno Tavares", "high"),
    ("Contactar fornecedores para reposição", "Carla Figueiredo", "high"),
    ("Preparar encomendas para entrega", "Fernando Lopes", "high"),
    ("Fazer inventário da secção de tintas", "Sérgio Pinto", "medium"),
    ("Rever catálogo de promoções", "Carla Figueiredo", "medium"),
    ("Atualizar redes sociais da loja", "Ana Beatriz Sousa", "low"),
    ("Treinar novo colaborador na secção elétrica", "Bruno Tavares", "medium"),
    ("Verificar equipamento de segurança da loja", "Ralph Medeiros", "high"),
    ("Contactar cliente sobre encomenda especial", "Bruno Tavares", "high"),
    ("Organizar secção de canalização", "Tiago Mendes", "medium"),
    ("Fazer balanço mensal de vendas", "Ralph Medeiros", "high"),
    ("Preparar campanha de Natal", "Carla Figueiredo", "high"),
    ("Rever contrato com fornecedor Wurth", "Ralph Medeiros", "medium"),
    ("Reparar prateleira danificada corredor 3", "Sérgio Pinto", "low"),
    ("Calibrar balança de pesagem", "Sérgio Pinto", "low"),
    ("Substituir iluminação secção jardim", "Tiago Mendes", "medium"),
    ("Encomendar sacos para clientes", "Marta Coelho", "low"),
    ("Verificar sistema de alarme", "Ralph Medeiros", "high"),
    ("Atualizar website com novos produtos", "Ana Beatriz Sousa", "medium"),
    ("Recolher devoluções de clientes", "Marta Coelho", "medium"),
    ("Preparar orçamento para Câmara Municipal", "Bruno Tavares", "high"),
    ("Reorganizar corredor de ferramentas elétricas", "Tiago Mendes", "medium"),
    ("Fazer limpeza geral da loja", "Sérgio Pinto", "low"),
    ("Contactar seguradora sobre renovação", "Ralph Medeiros", "medium"),
]


def is_sunday(d):
    return d.weekday() == 6


def is_saturday(d):
    return d.weekday() == 5


HOLIDAYS_PT = [
    date(2025, 12, 1),   # Restauração da Independência
    date(2025, 12, 8),   # Imaculada Conceição
    date(2025, 12, 25),  # Natal
    date(2026, 1, 1),    # Ano Novo
]


def is_closed(d):
    return is_sunday(d) or d in HOLIDAYS_PT


def daily_order_count(d):
    """Realistic order count based on day/season."""
    if is_closed(d):
        return 0
    base = 14
    # Saturday boost
    if is_saturday(d):
        base = 22
    # December pre-Christmas boost
    if d.month == 12 and d.day <= 24:
        base = int(base * 1.3)
    # January slump
    if d.month == 1 and d.day <= 15:
        base = int(base * 0.7)
    # Add randomness
    return max(3, base + random.randint(-5, 6))


def generate_vendas():
    """Generate sales data."""
    rows = []
    order_counter = 1
    current = START_DATE
    while current <= END_DATE:
        count = daily_order_count(current)
        for _ in range(count):
            # Pick 1-5 products for this order
            num_items = random.choices([1, 2, 3, 4, 5, 6], weights=[30, 30, 20, 10, 7, 3])[0]
            selected = random.sample(PRODUCTS, num_items)
            quantities = [random.randint(1, 4) for _ in selected]
            total = sum(p["price"] * q for p, q in zip(selected, quantities))
            total = round(total * random.uniform(0.95, 1.05), 2)  # slight variation for discounts etc

            customer = random.choice(CUSTOMERS)
            # Most orders completed, some pending/cancelled
            status = random.choices(
                ["completed", "completed", "completed", "pending", "cancelled"],
                weights=[70, 15, 5, 8, 2]
            )[0]

            rows.append({
                "Date": current.strftime("%Y-%m-%d"),
                "OrderID": f"ORD-{order_counter:04d}",
                "Amount": f"{total:.2f}",
                "Items": str(sum(quantities)),
                "Customer": customer,
                "Status": status,
            })
            order_counter += 1
        current += timedelta(days=1)

    with open(os.path.join(OUTPUT_DIR, "vendas.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Date", "OrderID", "Amount", "Items", "Customer", "Status"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Vendas: {len(rows)} orders generated")
    return rows


def generate_tarefas():
    """Generate tasks data spanning the period."""
    rows = []
    current = START_DATE
    while current <= END_DATE:
        if is_closed(current):
            current += timedelta(days=1)
            continue
        # 2-5 tasks created per day
        daily_tasks = random.randint(2, 5)
        selected = random.sample(TASK_TEMPLATES, min(daily_tasks, len(TASK_TEMPLATES)))
        for task_name, assignee, priority in selected:
            due = current + timedelta(days=random.randint(0, 5))
            # Determine status based on whether due date has passed
            if due < END_DATE - timedelta(days=3):
                status = random.choices(["completed", "completed", "open", "overdue"], weights=[55, 25, 10, 10])[0]
            elif due < END_DATE:
                status = random.choices(["completed", "open", "open", "overdue"], weights=[30, 35, 25, 10])[0]
            else:
                status = random.choices(["open", "open", "pending"], weights=[50, 30, 20])[0]

            rows.append({
                "Task": task_name,
                "Assignee": assignee,
                "Status": status,
                "DueDate": due.strftime("%Y-%m-%d"),
                "Priority": priority,
            })
        current += timedelta(days=1)

    with open(os.path.join(OUTPUT_DIR, "tarefas.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Task", "Assignee", "Status", "DueDate", "Priority"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Tarefas: {len(rows)} tasks generated")
    return rows


def generate_stock():
    """Generate current stock snapshot."""
    rows = []
    for p in PRODUCTS:
        # Simulate stock levels - some below minimum to trigger alerts
        if random.random() < 0.15:
            qty = random.randint(0, p["min"] - 1)  # Low stock
        elif random.random() < 0.05:
            qty = 0  # Out of stock
        else:
            qty = random.randint(p["min"], p["min"] * 4)

        supplier = random.choice(CAT_SUPPLIERS.get(p["cat"], SUPPLIERS))

        rows.append({
            "Product": p["name"],
            "SKU": p["sku"],
            "Quantity": str(qty),
            "MinQuantity": str(p["min"]),
            "UnitPrice": f"{p['price']:.2f}",
            "Supplier": supplier,
        })

    with open(os.path.join(OUTPUT_DIR, "stock.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Product", "SKU", "Quantity", "MinQuantity", "UnitPrice", "Supplier"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Stock: {len(rows)} products generated")
    return rows


def generate_equipa():
    """Generate team attendance data."""
    rows = []
    current = START_DATE
    while current <= END_DATE:
        if is_closed(current):
            current += timedelta(days=1)
            continue

        for member in TEAM:
            # Owner almost always present, others have some variation
            if member["name"] == "Ralph Medeiros":
                present = random.random() < 0.92
            elif member["name"] == "Fernando Lopes":
                # Delivery driver not always in-store
                present = random.random() < 0.75
            else:
                present = random.random() < 0.85

            # Saturdays: reduced team
            if is_saturday(current) and random.random() < 0.3:
                present = False

            if present:
                # Normal hours with variation
                if member["role"] == "Proprietário / Gerente":
                    check_in_h = random.choice([7, 7, 8, 8, 8])
                    check_in_m = random.randint(0, 30)
                    check_out_h = random.choice([18, 18, 19, 19, 20])
                    check_out_m = random.randint(0, 45)
                elif member["role"] == "Entregas / Motorista":
                    check_in_h = random.choice([8, 8, 9])
                    check_in_m = random.randint(0, 30)
                    check_out_h = random.choice([16, 17, 17])
                    check_out_m = random.randint(0, 45)
                else:
                    check_in_h = random.choice([8, 8, 9, 9])
                    check_in_m = random.randint(0, 45)
                    if is_saturday(current):
                        check_out_h = random.choice([13, 14])
                    else:
                        check_out_h = random.choice([17, 18, 18])
                    check_out_m = random.randint(0, 45)

                check_in = f"{check_in_h:02d}:{check_in_m:02d}"
                check_out = f"{check_out_h:02d}:{check_out_m:02d}"
                status = "present"
            else:
                check_in = ""
                check_out = ""
                # Distinguish between day off, sick, vacation
                if current.month == 12 and current.day >= 26:
                    status = random.choice(["absent", "vacation", "vacation"])
                elif current.month == 1 and current.day <= 3:
                    status = random.choice(["absent", "vacation", "vacation"])
                else:
                    status = random.choices(["absent", "sick", "day_off"], weights=[30, 20, 50])[0]

            rows.append({
                "Name": member["name"],
                "Role": member["role"],
                "Date": current.strftime("%Y-%m-%d"),
                "CheckIn": check_in,
                "CheckOut": check_out,
                "Status": status,
            })
        current += timedelta(days=1)

    with open(os.path.join(OUTPUT_DIR, "equipa.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Name", "Role", "Date", "CheckIn", "CheckOut", "Status"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Equipa: {len(rows)} attendance records generated")
    return rows


def generate_email():
    """Generate daily email metrics."""
    rows = []
    current = START_DATE
    while current <= END_DATE:
        if is_closed(current):
            current += timedelta(days=1)
            continue

        # Base email volume varies by day
        if is_saturday(current):
            base_unread = random.randint(3, 10)
        elif current.weekday() == 0:  # Monday - more emails
            base_unread = random.randint(15, 35)
        else:
            base_unread = random.randint(8, 22)

        # December has more emails (orders, inquiries)
        if current.month == 12:
            base_unread = int(base_unread * 1.2)

        important = random.randint(1, min(8, base_unread))
        sent = random.randint(5, 20)
        response_rate = random.randint(55, 95)

        rows.append({
            "Date": current.strftime("%Y-%m-%d"),
            "Unread": str(base_unread),
            "Important": str(important),
            "Sent": str(sent),
            "ResponseRate": str(response_rate),
        })
        current += timedelta(days=1)

    with open(os.path.join(OUTPUT_DIR, "email_metrics.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Date", "Unread", "Important", "Sent", "ResponseRate"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Email Metrics: {len(rows)} daily records generated")
    return rows


if __name__ == "__main__":
    print("=" * 60)
    print("Generating test data for Ralph's Hardware Store Dashboard")
    print(f"Period: {START_DATE} to {END_DATE}")
    print("=" * 60)
    print()

    vendas = generate_vendas()
    tarefas = generate_tarefas()
    stock = generate_stock()
    equipa = generate_equipa()
    email = generate_email()

    print()
    print("=" * 60)
    print(f"All CSV files saved to: {OUTPUT_DIR}")
    print()
    print("Next steps:")
    print("1. Open Google Sheet: https://docs.google.com/spreadsheets/d/1diu6_GrHGwPChIn89VEIfMqrGBL8rAPHt-N55LpgWhs/")
    print("2. Create 5 tabs: Vendas, Tarefas, Stock, Equipa, Email Metrics")
    print("3. Import each CSV into its corresponding tab")
    print("   (File > Import > Upload > select CSV > 'Insert new sheet')")
    print("=" * 60)
