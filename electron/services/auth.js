const axios = require('axios');
const API_URL = "https://api.quickquery.co";
const https = require('https');

// At request level
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function login (email, password) {
    try {
        const lowerEmail = email.toString().toLowerCase();

        const response = await axios.post(API_URL + '/api/v1/employees/sign-in', {
            email: lowerEmail, password: password
        }, { httpsAgent: agent });

        return response.data;

    } catch (e) {
        console.log("response", e);
        return e.response.data;
    }
}

async function verifyToken (id, auth) {
    try {
        const response = await axios.get(API_URL + '/api/v1/employees/verify', {
            headers: { id, auth },
            httpsAgent: agent
        });

        return response.data;

    } catch (e) {
        return e.response.error;
    }
}

// Export auth's methods
module.exports = {
    login,
    verifyToken
};