const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CrucibleAI Production Server...');

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://otolo_user:VZbD1KG96JFcuQrvTGGLEu5fYxRrlDRa@dpg-d2lnfpripnbc738fdv5g-a.oregon-postgres.render.com/otolo?sslmode=require';

console.log('✅ Environment configured');
console.log('✅ Database URL set');

// Start the server
const serverProcess = spawn('npx', ['tsx', 'src/simple-server.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    FORCE_COLOR: '1'
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
});
