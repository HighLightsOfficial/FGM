const canvas = document.getElementById('perfChart');
const ctx = canvas.getContext('2d');

let chart = null;
let previousData = null;

function parseSnapshotCode(code) {
  const lines = code.trim().split('\n');
  let encoded = null;
  for (const line of lines) {
    if (line.startsWith("encoded: ")) {
      encoded = line.substring("encoded: ".length).trim();
      break;
    }
  }
  if (!encoded) return { error: "No se encontró el campo 'encoded' en el snapshot." };

  try {
    const parsed = JSON.parse(atob(encoded));
    return {
      memory: parsed.m,
      entities: parsed.e,
      players: parsed.p,
      tps: parsed.tps
    };
  } catch {
    return { error: "Error al decodificar o parsear el campo 'encoded'." };
  }
}

function validateData(data) {
  if (data.error) return data.error;
  const keys = ['memory', 'entities', 'players', 'tps'];
  for (const k of keys) {
    if (!(k in data) || typeof data[k] !== 'number' || isNaN(data[k])) {
      return `Error: falta o es inválido el campo "${k}"`;
    }
  }
  if (data.tps < 0 || data.tps > 20) return 'Error: TPS fuera de rango (0-20)';
  return null;
}

function createChart(data1, data2) {
  const labels = ['Memoria (MB)', 'Entidades', 'Jugadores', 'TPS'];

  const datasets = [{
    label: 'Snapshot Actual',
    data: [data1.memory, data1.entities, data1.players, data1.tps],
    backgroundColor: 'rgba(0, 170, 255, 0.75)',
    borderColor: 'rgba(0, 170, 255, 1)',
    borderWidth: 2,
    borderRadius: 6
  }];

  if (data2) {
    datasets.push({
      label: 'Snapshot Anterior',
      data: [data2.memory, data2.entities, data2.players, data2.tps],
      backgroundColor: 'rgba(0, 122, 204, 0.7)',
      borderColor: 'rgba(0, 122, 204, 1)',
      borderWidth: 2,
      borderRadius: 6
    });
  }

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      animation: { duration: 600, easing: 'easeInOutQuart' },
      scales: {
        y: {
          beginAtZero: true,
          grace: '10%',
          ticks: { color: '#004d99', font: { weight: '600', size: 13 } },
          grid: { color: 'rgba(0, 122, 204, 0.15)' }
        },
        x: {
          ticks: { color: '#004d99', font: { weight: '700', size: 14 } },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { position: 'top', labels: { font: { size: 15, weight: '700' }, color: '#004d99' } },
        tooltip: { enabled: true, backgroundColor: 'rgba(0, 122, 204, 0.85)', titleFont: { size: 16, weight: '700' }, bodyFont: { size: 14 } }
      }
    }
  });
}

document.getElementById('generateBtn').addEventListener('click', () => {
  const codeInput = document.getElementById('snapshotCode').value;
  if (!codeInput.trim()) return showError('Por favor, pega el código del snapshot');

  const parsedData = parseSnapshotCode(codeInput);
  const validationError = validateData(parsedData);
  if (validationError) return showError(validationError);

  clearError();
  createChart(parsedData, previousData);

  localStorage.setItem('latestSnapshot', codeInput);
  previousData = parsedData;
});

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.opacity = '1';
}

function clearError() {
  const el = document.getElementById('errorMsg');
  el.textContent = '';
  el.style.opacity = '0';
}

window.addEventListener('load', () => {
  const savedCode = localStorage.getItem('latestSnapshot');
  if (savedCode) {
    document.getElementById('snapshotCode').value = savedCode;
    const parsedData = parseSnapshotCode(savedCode);
    if (!validateData(parsedData)) {
      previousData = null;
      createChart(parsedData, null);
    }
  }
});

window.addEventListener('resize', () => {
  if (previousData) createChart(previousData, null);
});
