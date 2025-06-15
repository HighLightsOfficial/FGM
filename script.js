const ctx = document.getElementById('perfChart').getContext('2d');

let chart = null;
let previousData = null;

function parseSnapshotCode(code) {
  // Buscamos la línea que contiene el campo encoded:
  const lines = code.trim().split('\n');
  let encoded = null;
  for (const line of lines) {
    if (line.startsWith("encoded: ")) {
      encoded = line.substring("encoded: ".length).trim();
      break;
    }
  }
  if (!encoded) {
    return { error: "No se encontró el campo 'encoded' en el snapshot." };
  }

  // Decodificamos base64 y parseamos JSON
  let parsed = null;
  try {
    const jsonString = atob(encoded);
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { error: "Error al decodificar o parsear el campo 'encoded'." };
  }

  // Mapear claves cortas a completas
  const data = {
    memory: parsed.m,
    entities: parsed.e,
    players: parsed.p,
    tps: parsed.tps
  };

  return data;
}

function validateData(data) {
  if (data.error) return data.error;

  const requiredKeys = ['memory', 'entities', 'players', 'tps'];
  for (const key of requiredKeys) {
    if (!(key in data) || typeof data[key] !== 'number' || isNaN(data[key])) {
      return `Error: falta o es inválido el campo "${key}"`;
    }
  }
  if (data.tps < 0 || data.tps > 20) {
    return 'Error: TPS fuera de rango (0-20)';
  }
  return null;
}

function createChart(data1, data2) {
  const labels = ['Memoria (MB)', 'Entidades', 'Jugadores', 'TPS'];

  const dataset1 = {
    label: 'Snapshot Actual',
    data: [data1.memory, data1.entities, data1.players, data1.tps],
    backgroundColor: 'rgba(0, 170, 255, 0.75)',
    borderColor: 'rgba(0, 170, 255, 1)',
    borderWidth: 2,
    borderRadius: 6
  };

  const datasets = [dataset1];

  if (data2) {
    const dataset2 = {
      label: 'Snapshot Anterior',
      data: [data2.memory, data2.entities, data2.players, data2.tps],
      backgroundColor: 'rgba(0, 122, 204, 0.7)',
      borderColor: 'rgba(0, 122, 204, 1)',
      borderWidth: 2,
      borderRadius: 6
    };
    datasets.push(dataset2);
  }

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      animation: {
        duration: 600,
        easing: 'easeInOutQuart'
      },
      scales: {
        y: {
          beginAtZero: true,
          grace: '10%',
          ticks: {
            color: '#004d99',
            font: { weight: '600', size: 13 }
          },
          grid: {
            color: 'rgba(0, 122, 204, 0.15)'
          }
        },
        x: {
          ticks: {
            color: '#004d99',
            font: { weight: '700', size: 14 }
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 15, weight: '700' },
            color: '#004d99'
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 122, 204, 0.85)',
          titleFont: { size: 16, weight: '700' },
          bodyFont: { size: 14 }
        }
      }
    }
  });
}

document.getElementById('generateBtn').addEventListener('click', () => {
  const codeInput = document.getElementById('snapshotCode').value;
  if (!codeInput.trim()) {
    showError('Por favor, pega el código del snapshot');
    return;
  }

  const parsedData = parseSnapshotCode(codeInput);
  const validationError = validateData(parsedData);
  if (validationError) {
    showError(validationError);
    return;
  }

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