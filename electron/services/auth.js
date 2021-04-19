const axios = require('axios');
const API_URL = "http://3.123.154.190";

async function login (email, password) {
    try {
        const lowerEmail = email.toString().toLowerCase();
        const response = await axios.post(API_URL + '/api/v1/employees/sign-in', {
            email: lowerEmail, password: password
        });

        return response.data;

    } catch (e) {
        return e.response.data;
    }
}

async function verifyToken (id, auth) {
    try {
        const response = await axios.get(API_URL + '/api/v1/employees/verify', {
            headers: { id, auth }
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