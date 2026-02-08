const axios = require('axios');

const initKeepAlive = () => {
    // 14 minutes in milliseconds
    const INTERVAL = 14 * 60 * 1000;
    
    // Configurable URL, default to localhost for internal check, 
    // but ideally needs public URL for Render to see traffic.
    // Render provides RENDER_EXTERNAL_URL.
    const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 4000}`;

    console.log(`Keep-alive service initialized. Pinging ${BACKEND_URL} every 14 minutes.`);

    // Initial ping
    setTimeout(async () => {
        try {
            await axios.get(`${BACKEND_URL}/health`);
            console.log(`Initial keep-alive ping successful`);
        } catch (error) {
            console.error(`Initial keep-alive ping failed: ${error.message}`);
        }
    }, 5000); // 5 seconds after startup

    setInterval(async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/health`);
            console.log(`Keep-alive ping successful: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.error(`Keep-alive ping failed: ${error.message}`);
        }
    }, INTERVAL);
};

module.exports = initKeepAlive;
