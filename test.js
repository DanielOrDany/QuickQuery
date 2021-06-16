

// with host and pattern to match model files
// const dbConfig = {
//     database: 'dbName',
//     username: 'root',
//     password: '',
//     host: 'localhost',
//     modelPattern: './**/*.model.js'
// };

const SequelizeTunnelService = require('./electron/services/sequalize');

// basic connection to a database
const dbConfig = {
    database: 'public',
    username: 'postgres',
    password: 'Rs83501rv',
    dialect: 'postgres'
};

// ssh tunnel configuration
const tunnelConfig = {
    username: 'ubuntu',
    host: '3.65.50.81',
    port: 22,
    privateKey: require("fs").readFileSync('/users/admin/root.pem')
};

// initialize service
const sequelizeTunnelService = new SequelizeTunnelService(dbConfig, tunnelConfig);


(async () => {
    try {
        const SequelizeTunnelService = require('./electron/services/sequalize');

// basic connection to a database
        const dbConfig = {
            database: 'public',
            username: 'postgres',
            password: 'Rs83501rv',
            dialect: 'postgres'
        };

        // ssh tunnel configuration
        const tunnelConfig = {
            username: 'ubuntu',
            host: '3.65.50.81',
            port: 22,
            privateKey: require("fs").readFileSync('/users/admin/root.pem')
        };

        // initialize service
        const sequelizeTunnelService = new SequelizeTunnelService(dbConfig, tunnelConfig);

        const s = await sequelizeTunnelService.getConnection();
        const tokens = await s.sequelize.query("select * from tokens", {});
        console.log("query", tokens);
    } catch (e) {
        console.log(e);
    }
});

// sequelize config
// const Sequelize = require('sequelize');
// const port = 5432;
//
// // tunnel config
//
// const config = {
//     username: 'ubuntu',
//     host: '3.65.50.81',
//     port: 22,
//     dstHost: '127.0.0.1',
//     dstPort: port,
//     srcHost: '127.0.0.1',
//     srcPort: port,
//     localhost: '127.0.0.1',
//     localport: port,
//     privatekey: require("fs").readFileSync('/users/admin/root.pem')
// };
//
// const tunnel = require('tunnel-ssh');
// // initiate tunnel
//
// tunnel(config, async function (error, server) {
//     //....
//     if(error) {
//         console.error(error);
//     } else {
//         console.log('server:', server);
//         // test sequelize connection
//         //await sequelize.authenticate();
//
//         const sequelize = new Sequelize('public', 'postgres', 'Rs83501rv', {
//             host: '127.0.0.1',
//             dialect: 'postgres',
//             port,
//             pool: {
//                 max: 10,
//                 min: 0,
//                 idle: 20000
//             }
//         });
//
//        console.log(await sequelize.authenticate());
//        //await sequelize.query("select * from tokens");
//     }
// });