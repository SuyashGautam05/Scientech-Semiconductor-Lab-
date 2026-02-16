const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');

let mainWindow;
let serialPort;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'Assets', 'logo.ico'),
    title: 'Scientech 2612A',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false
    },
    show: false
  });

  // Load the welcome screen first instead of index.html
  mainWindow.loadFile('src/welcome.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// List available COM ports
ipcMain.handle('get-ports', async () => {
  try {
    const ports = await SerialPort.list();
    return ports.map(port => port.path);
  } catch (err) {
    console.error('Error listing ports:', err);
    return [];
  }
});

// Connect to COM port
ipcMain.on('connect-port', (event, portPath) => {
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }

  serialPort = new SerialPort({
    path: portPath,
    baudRate: 9600
  }, (err) => {
    if (err) {
      mainWindow.webContents.send('connection-status', { 
        connected: false, 
        error: err.message 
      });
      return;
    }
    
    mainWindow.webContents.send('connection-status', { 
      connected: true 
    });
  });

  // Read data from COM port
  let buffer = '';
  serialPort.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    lines.forEach(line => {
      if (line.trim()) {
        const values = line.split(',').map(val => parseFloat(val.trim()));
        if (values.length === 4 && !values.some(isNaN)) {
          mainWindow.webContents.send('serial-data', {
            V1: values[0],
            I1: values[1],
            V2: values[2],
            I2: values[3]
          });
        }
      }
    });
  });

  serialPort.on('error', (err) => {
    mainWindow.webContents.send('connection-status', { 
      connected: false, 
      error: err.message 
    });
  });
});

// Disconnect from COM port
ipcMain.on('disconnect-port', () => {
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
    mainWindow.webContents.send('connection-status', { 
      connected: false 
    });
  }
});