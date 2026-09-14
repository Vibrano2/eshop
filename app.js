// ==============================================================================
// cPanel & CloudLinux Passenger Entry Point for eshopstore.shop
// ==============================================================================
import app from './server/index.js';

const PORT = process.env.PORT || 3001;

// Start server on the port assigned by cPanel Passenger or environment
const server = app.listen(PORT, () => {
  console.log(`🚀 eshopstore.shop cPanel Node.js app listening on port ${PORT}`);
});

export default server;
