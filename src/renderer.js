const { ipcRenderer } = require('electron');
const Chart = require('chart.js/auto');

// DOM Elements
const portSelect = document.getElementById('port-select');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const xAxisSelect = document.getElementById('x-axis');
const yAxisSelect = document.getElementById('y-axis');
const clearGraphBtn = document.getElementById('clear-graph');
const exportBtn = document.getElementById('export-btn');
const v1Value = document.getElementById('v1-value');
const i1Value = document.getElementById('i1-value');
const v2Value = document.getElementById('v2-value');
const i2Value = document.getElementById('i2-value');

// Chart setup
const ctx = document.getElementById('data-chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Historical Data',
        data: [],
        borderColor: '#4a6fa5',
        backgroundColor: 'rgba(74, 111, 165, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#4a6fa5',
        pointBorderColor: '#4a6fa5',
        tension: 0.1,
        showLine: true
      },
      {
        label: 'Current Point',
        data: [],
        borderColor: '#28a745',
        backgroundColor: '#28a745',
        borderWidth: 0,
        pointRadius: 6,
        pointBackgroundColor: '#28a745',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        showLine: false,
        pointHoverRadius: 8
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeInOutQuart'
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'V1',
          color: '#6c757d',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: function(context) {
            // Highlight the zero line
            if (context.tick.value === 0) {
              return 'rgba(0, 0, 0, 0.3)';
            }
            return 'rgba(0, 0, 0, 0.05)';
          },
          lineWidth: function(context) {
            // Make zero line thicker
            if (context.tick.value === 0) {
              return 2;
            }
            return 1;
          }
        },
        ticks: {
          color: '#6c757d'
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'I1',
          color: '#6c757d',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: function(context) {
            // Highlight the zero line
            if (context.tick.value === 0) {
              return 'rgba(0, 0, 0, 0.3)';
            }
            return 'rgba(0, 0, 0, 0.05)';
          },
          lineWidth: function(context) {
            // Make zero line thicker
            if (context.tick.value === 0) {
              return 2;
            }
            return 1;
          }
        },
        ticks: {
          color: '#6c757d'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#212529',
        bodyColor: '#212529',
        borderColor: '#dee2e6',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        displayColors: false,
        titleFont: {
          weight: 'bold'
        },
        callbacks: {
          title: function(context) {
            return context[0].datasetIndex === 1 ? 'Current Point' : 'Data Point';
          },
          label: function(context) {
            const xAxis = xAxisSelect.value;
            const yAxis = yAxisSelect.value;
            return `${xAxis}: ${context.parsed.x.toFixed(3)}, ${yAxis}: ${context.parsed.y.toFixed(3)}`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: false
    }
  }
});

// Data storage - stores full data objects {V1, I1, V2, I2}
const dataPoints = [];
const maxDataPoints = 100;
let currentPoint = null;
let lastRawData = null; // keeps the last received packet for display refresh

// Helper function to get value (handles negative axis selection)
function getValue(dataPoint, axis) {
  if (axis.startsWith('-')) {
    const actualAxis = axis.substring(1); // Remove the '-' prefix
    return -dataPoint[actualAxis]; // Return negative value
  }
  return dataPoint[axis]; // Return positive value
}

// Auto-scaling function with dynamic ranges
function updateScale() {
  // Get the current axis selections
  const xAxis = xAxisSelect.value;
  const yAxis = yAxisSelect.value;
  
  // Get all data points including current point
  const allPoints = [...dataPoints];
  if (currentPoint) {
    allPoints.push(currentPoint);
  }
  
  if (allPoints.length === 0) {
    // No data, use default ranges
    chart.options.scales.x.min = undefined;
    chart.options.scales.x.max = undefined;
    chart.options.scales.y.min = undefined;
    chart.options.scales.y.max = undefined;
    chart.update('none');
    return;
  }
  
  // Calculate min/max for X axis
  const xValues = allPoints.map(point => getValue(point, xAxis));
  let xMin = Math.min(...xValues);
  let xMax = Math.max(...xValues);
  
  // Calculate min/max for Y axis
  const yValues = allPoints.map(point => getValue(point, yAxis));
  let yMin = Math.min(...yValues);
  let yMax = Math.max(...yValues);
  
  // Add 10% padding to make the graph more readable
  const xPadding = Math.max(0.1, Math.abs(xMax - xMin) * 0.1);
  const yPadding = Math.max(0.1, Math.abs(yMax - yMin) * 0.1);
  
  // Apply padding (allow negative values)
  xMin = xMin - xPadding;
  xMax = xMax + xPadding;
  yMin = yMin - yPadding;
  yMax = yMax + yPadding;
  
  // Handle case where min equals max (single point or all points have same value)
  if (xMin === xMax) {
    xMin = Math.max(0, xMin - 1);
    xMax = xMax + 1;
  }
  if (yMin === yMax) {
    yMin = Math.max(0, yMin - 1);
    yMax = yMax + 1;
  }
  
  // Set the calculated ranges
  chart.options.scales.x.min = xMin;
  chart.options.scales.x.max = xMax;
  chart.options.scales.y.min = yMin;
  chart.options.scales.y.max = yMax;
  
  // Update the chart to reflect the new scale
  chart.update('none'); // Update without animation to prevent flickering
}

// Recalculate scaling bounds based on remaining data points
function recalculateScaling() {
  updateScale();
}

// Load available COM ports
async function loadPorts() {
  try {
    const ports = await ipcRenderer.invoke('get-ports');
    portSelect.innerHTML = '<option value="">Select a port...</option>';
    
    ports.forEach(port => {
      const option = document.createElement('option');
      option.value = port;
      option.textContent = port;
      portSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading ports:', err);
  }
}

// Connect to COM port
function connectPort() {
  const selectedPort = portSelect.value;
  if (!selectedPort) {
    alert('Please select a COM port');
    return;
  }
  
  ipcRenderer.send('connect-port', selectedPort);
  connectBtn.disabled = true;
  disconnectBtn.disabled = false;
}

// Disconnect from COM port
function disconnectPort() {
  ipcRenderer.send('disconnect-port');
  connectBtn.disabled = false;
  disconnectBtn.disabled = true;
}

// Update connection status
ipcRenderer.on('connection-status', (event, status) => {
  if (status.connected) {
    statusIndicator.classList.add('connected');
    statusText.textContent = `Connected to ${portSelect.value}`;
  } else {
    statusIndicator.classList.remove('connected');
    statusText.textContent = status.error ? `Error: ${status.error}` : 'Disconnected';
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
  }
});

// Update the 4 data-display boxes to reflect sign based on selected axes
function updateValueDisplays(data) {
  const xAxis = xAxisSelect.value;
  const yAxis = yAxisSelect.value;

  // For each channel, negate if that channel is selected as a negative axis
  const v1Sign = (xAxis === '-V1' || yAxis === '-V1') ? -1 : 1;
  const i1Sign = (xAxis === '-I1' || yAxis === '-I1') ? -1 : 1;
  const v2Sign = (xAxis === '-V2' || yAxis === '-V2') ? -1 : 1;
  const i2Sign = (xAxis === '-I2' || yAxis === '-I2') ? -1 : 1;

  v1Value.textContent = (v1Sign * data.V1).toFixed(3);
  i1Value.textContent = (i1Sign * data.I1).toFixed(3);
  v2Value.textContent = (v2Sign * data.V2).toFixed(3);
  i2Value.textContent = (i2Sign * data.I2).toFixed(3);
}

// Handle incoming data - stores all four values
ipcRenderer.on('serial-data', (event, data) => {
  // Cache raw data so display can refresh when axes change
  lastRawData = data;

  // Update value displays (respects negative axis selection)
  updateValueDisplays(data);
  
  // Get selected axes
  const xAxis = xAxisSelect.value;
  const yAxis = yAxisSelect.value;
  
  // Get the base axis names (without minus sign)
  const baseXAxis = xAxis.startsWith('-') ? xAxis.substring(1) : xAxis;
  const baseYAxis = yAxis.startsWith('-') ? yAxis.substring(1) : yAxis;
  
  // Get current X and Y values (using getValue to handle negative axes)
  const currentX = getValue(data, xAxis);
  const currentY = getValue(data, yAxis);
  
  // Check if we're going backward (decreasing X value based on RAW data, not negated)
  if (currentPoint) {
    const prevRawX = currentPoint[baseXAxis]; // Get RAW X value from previous point
    const currentRawX = data[baseXAxis]; // Get RAW X value from current data
    
    if (currentRawX < prevRawX) {
      // Going backward - remove all points with X values greater than current X
      for (let i = dataPoints.length - 1; i >= 0; i--) {
        if (dataPoints[i][baseXAxis] > currentRawX) {
          dataPoints.splice(i, 1);
        }
      }
      
      // Update the scaling bounds
      recalculateScaling();
    }
  }
  
  // Move current point to historical data if it exists
  if (currentPoint) {
    dataPoints.push(currentPoint);
    
    // Limit data points (only when not going backward)
    if (dataPoints.length > maxDataPoints) {
      dataPoints.shift();
    }
  }
  
  // Set new current point - store full data object
  currentPoint = data;
  
  // Update scaling with auto-calculated ranges
  updateScale();
  
  // Update chart datasets - extract x,y from full data objects using getValue
  chart.data.datasets[0].data = dataPoints.map(point => ({
    x: getValue(point, xAxis),
    y: getValue(point, yAxis)
  }));
  chart.data.datasets[1].data = [{
    x: getValue(currentPoint, xAxis),
    y: getValue(currentPoint, yAxis)
  }];
  
  // Update axis labels
  chart.options.scales.x.title.text = xAxis;
  chart.options.scales.y.title.text = yAxis;
  
  // Update chart with smooth animation
  chart.update('active');
});

// Update chart when axes change
function updateChartAxes() {
  // Clear all data when axes change
  dataPoints.length = 0;
  currentPoint = null;

  // Clear chart data
  chart.data.datasets[0].data = [];
  chart.data.datasets[1].data = [];

  // Update axis labels
  chart.options.scales.x.title.text = xAxisSelect.value;
  chart.options.scales.y.title.text = yAxisSelect.value;

  // Refresh displayed values immediately using last received raw data
  if (lastRawData) {
    updateValueDisplays(lastRawData);
  }

  // Update scaling with auto-calculated ranges
  updateScale();

  chart.update();
}

// Clear graph data
function clearGraph() {
  dataPoints.length = 0;
  currentPoint = null;
  
  // Clear chart data
  chart.data.datasets[0].data = [];
  chart.data.datasets[1].data = [];
  
  // Update scaling with auto-calculated ranges
  updateScale();
  
  chart.update();
}

// Export data to CSV with all four values
function exportDataToCSV() {
  if (dataPoints.length === 0 && !currentPoint) {
    alert('No data to export');
    return;
  }

  // Create CSV content with headers
  let csvContent = 'V1,I1,V2,I2\n';
  
  // Add historical data points
  dataPoints.forEach(point => {
    csvContent += `${point.V1},${point.I1},${point.V2},${point.I2}\n`;
  });
  
  // Add current point if exists
  if (currentPoint) {
    csvContent += `${currentPoint.V1},${currentPoint.I1},${currentPoint.V2},${currentPoint.I2}\n`;
  }

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `data_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Reset all connections and data
function resetAll() {
  // Disconnect from COM port if connected
  if (!disconnectBtn.disabled) {
    disconnectPort();
  }
  
  // Reset connection status
  statusIndicator.classList.remove('connected');
  statusText.textContent = 'Disconnected';
  
  // Reset COM port selection
  portSelect.selectedIndex = 0;
  
  // Clear graph data
  dataPoints.length = 0;
  currentPoint = null;
  lastRawData = null;
  
  // Clear chart data
  chart.data.datasets[0].data = [];
  chart.data.datasets[1].data = [];
  
  // Reset scales to auto
  delete chart.options.scales.x.min;
  delete chart.options.scales.x.max;
  delete chart.options.scales.y.min;
  delete chart.options.scales.y.max;
  
  // Update axis labels to default
  chart.options.scales.x.title.text = 'V1';
  chart.options.scales.y.title.text = 'I1';
  
  // Reset axis selectors to default
  xAxisSelect.selectedIndex = 0;
  yAxisSelect.selectedIndex = 1; // I1 is selected by default
  
  // Reset value displays
  v1Value.textContent = '--';
  i1Value.textContent = '--';
  v2Value.textContent = '--';
  i2Value.textContent = '--';
  
  // Update chart
  chart.update();
  
  // Reload ports to refresh the list
  loadPorts();
}

// Add event listener for reset button
document.getElementById('reset-btn').addEventListener('click', resetAll);

// Event listeners
connectBtn.addEventListener('click', connectPort);
disconnectBtn.addEventListener('click', disconnectPort);
xAxisSelect.addEventListener('change', updateChartAxes);
yAxisSelect.addEventListener('change', updateChartAxes);
clearGraphBtn.addEventListener('click', clearGraph);
exportBtn.addEventListener('click', exportDataToCSV);

// Initialize
loadPorts();