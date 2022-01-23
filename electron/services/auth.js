const axios = require('axios');
const API_URL = "http://localhost:3000"; // "https://api.quickquery.co";
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

async function addHistoryItem (id, auth, action, table, old_value, new_value) {
    try {
        const response = await axios.post(API_URL + '/api/v1/modifications/new', {
            action,
            table,
            old_value,
            new_value
        }, {
            headers: { id, auth },
            httpsAgent: agent
        });

        console.log("response", response);
        return response.data;

    } catch (e) {
        console.log("error", e);
        return e.response.error;
    }
}

// Export auth's methods
module.exports = {
    login,
    verifyToken,
    addHistoryItem
};