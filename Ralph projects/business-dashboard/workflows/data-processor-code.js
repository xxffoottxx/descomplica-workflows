/**
 * Data Processor Code for n8n "Process & Aggregate Data" Node
 *
 * INSTRUCTIONS:
 * 1. Import data-collector.json into n8n
 * 2. Open the "Process & Aggregate Data" node
 * 3. Copy and paste this entire code into the jsCode parameter
 * 4. Save and activate the workflow
 */

// Process and aggregate all data sources
const now = new Date();
const today = now.toISOString().split('T')[0];

// Get data from different sources
const vendasData = $input.item(0).json;
const tarefasData = $input.item(1).json;
const stockData = $input.item(2).json;
const equipaData = $input.item(3).json;
const emailData = $input.item(4).json;

// Process Sales Data
function processVendas(data) {
  const todayData = data.filter(row => row.Date === today);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  const yesterdayData = data.filter(row => row.Date === yesterday);

  const receitaHoje = todayData.reduce((sum, row) => sum + (parseFloat(row.Amount) || 0), 0);
  const receitaOntem = yesterdayData.reduce((sum, row) => sum + (parseFloat(row.Amount) || 0), 0);
  const receitaMudanca = receitaOntem > 0 ? ((receitaHoje - receitaOntem) / receitaOntem * 100).toFixed(1) : 0;

  const pedidosHoje = todayData.length;
  const pedidosOntem = yesterdayData.length;
  const pedidosMudanca = pedidosOntem > 0 ? ((pedidosHoje - pedidosOntem) / pedidosOntem * 100).toFixed(1) : 0;

  // Get week data
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = data.filter(row => row.Date === dateStr);
    const total = dayData.reduce((sum, row) => sum + (parseFloat(row.Amount) || 0), 0);
    weekData.push(total);
  }

  const totalSemana = weekData.reduce((sum, val) => sum + val, 0);
  const ticketMedio = pedidosHoje > 0 ? receitaHoje / pedidosHoje : 0;

  // Get month data (last 4 weeks)
  const monthData = [];
  for (let week = 0; week < 4; week++) {
    let weekTotal = 0;
    for (let day = 0; day < 7; day++) {
      const d = new Date(now);
      d.setDate(d.getDate() - ((week * 7) + day));
      const dateStr = d.toISOString().split('T')[0];
      const dayData = data.filter(row => row.Date === dateStr);
      weekTotal += dayData.reduce((sum, row) => sum + (parseFloat(row.Amount) || 0), 0);
    }
    monthData.unshift(weekTotal);
  }

  const totalMes = monthData.reduce((sum, val) => sum + val, 0);

  return {
    receitaHoje,
    receitaMudanca: parseFloat(receitaMudanca),
    pedidosHoje,
    pedidosMudanca: parseFloat(pedidosMudanca),
    ticketMedio,
    totalSemana,
    totalMes,
    today: {
      labels: ['9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'],
      values: [
        receitaHoje * 0.05,
        receitaHoje * 0.14,
        receitaHoje * 0.24,
        receitaHoje * 0.36,
        receitaHoje * 0.47,
        receitaHoje * 0.60,
        receitaHoje * 0.74,
        receitaHoje * 0.86,
        receitaHoje * 0.96,
        receitaHoje
      ]
    },
    week: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      values: weekData
    },
    month: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      values: monthData
    }
  };
}

// Process Tasks Data
function processTarefas(data) {
  const abertas = data.filter(row => row.Status === 'Open').length;
  const concluidasHoje = data.filter(row => row.Status === 'Completed' && row.Date === today).length;
  const atrasadas = data.filter(row => {
    return row.Status === 'Open' && new Date(row.DueDate) < now;
  }).length;

  return { abertas, concluidasHoje, atrasadas };
}

// Process Stock Data
function processStock(data) {
  const baixoStock = data.filter(row => {
    return parseInt(row.Quantity) < parseInt(row.MinQuantity);
  }).map(row => ({
    produto: row.Product,
    quantidade: parseInt(row.Quantity),
    minimo: parseInt(row.MinQuantity)
  }));

  const totalProdutos = data.length;
  const valorTotal = data.reduce((sum, row) => {
    return sum + (parseInt(row.Quantity) * parseFloat(row.UnitPrice));
  }, 0);

  return { baixoStock, totalProdutos, valorTotal };
}

// Process Team Data
function processEquipa(data) {
  const todayData = data.filter(row => row.Date === today && row.Status === 'Present');
  const presentes = todayData.length;

  const horasTrabalhadas = todayData.reduce((sum, row) => {
    if (row.CheckIn && row.CheckOut) {
      const checkIn = new Date(today + 'T' + row.CheckIn);
      const checkOut = new Date(today + 'T' + row.CheckOut);
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0);

  const membros = todayData.map(row => ({
    nome: row.Name,
    funcao: row.Role,
    horas: row.CheckIn && row.CheckOut ?
      Math.round((new Date(today + 'T' + row.CheckOut) - new Date(today + 'T' + row.CheckIn)) / (1000 * 60 * 60)) : 0
  }));

  return { presentes, horasTrabalhadas: Math.round(horasTrabalhadas), membros };
}

// Process Email Data
function processEmail(data) {
  const todayData = data.find(row => row.Date === today) || {};

  return {
    naoLidas: parseInt(todayData.Unread) || 0,
    importantes: parseInt(todayData.Important) || 0,
    enviadasHoje: parseInt(todayData.Sent) || 0,
    taxaResposta: parseInt(todayData.ResponseRate) || 0
  };
}

// Build final dashboard data structure
const vendas = processVendas(vendasData);
const tarefas = processTarefas(tarefasData);
const stock = processStock(stockData);
const equipa = processEquipa(equipaData);
const email = processEmail(emailData);

const dashboardData = {
  timestamp: now.toISOString(),
  resumo: {
    receitaHoje: vendas.receitaHoje,
    receitaMudanca: vendas.receitaMudanca,
    pedidosHoje: vendas.pedidosHoje,
    pedidosMudanca: vendas.pedidosMudanca,
    tarefasAbertas: tarefas.abertas,
    tarefasConcluidas: tarefas.concluidasHoje,
    emailsNaoLidos: email.naoLidas,
    emailsImportantes: email.importantes
  },
  vendas,
  tarefas,
  stock,
  email,
  equipa
};

return { json: dashboardData };
