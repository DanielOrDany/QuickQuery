"use strict";
const glob = require("glob");
const tunnel = require('tunnel-ssh');
const Bluebird = require('bluebird');
const Sequelize = require('sequelize');
const getPort = require('get-port');
const _ = require('lodash');

class SequelizeTunnelService {
    constructor(dbConfig, tunnelConfig) {
        if (!dbConfig) {
            throw new Error('dbConfig was not provided.');
        }

        const _dbFields = ['database'];
        let missingDbFields = _.difference(_dbFields, _.keys(dbConfig));
        if (missingDbFields.length !== 0) {
            throw new Error('dbConfig missing fields: ' + missingDbFields.join(', '));
        }
        if (dbConfig.username === undefined) {
            dbConfig.username = null;
        }
        if (dbConfig.password === undefined) {
            dbConfig.password = null;
        }

        if (dbConfig.replication) {
            if (!dbConfig.replication.read) {
                throw new Error('dbConfig.replication missing read structure');
            }
            const _replicationReadFields = ['host', 'username'];
            let missingDbReadReplicationFields = _.difference(_replicationReadFields, _.keys(dbConfig.replication.read));
            if (missingDbReadReplicationFields.length !== 0) {
                throw new Error('dbConfig.replication.read missing fields: ' + missingDbReadReplicationFields.join(', '));
            }

            if (!dbConfig.replication.write) {
                throw new Error('dbConfig.replication missing write structure');
            }
            const _replicationWriteFields = ['host', 'username'];
            let missingDbWriteReplicationFields = _.difference(_replicationWriteFields, _.keys(dbConfig.replication.write));
            if (missingDbWriteReplicationFields.length !== 0) {
                throw new Error('dbConfig.replication.write missing fields: ' + missingDbWriteReplicationFields.join(', '));
            }
        }

        this.dbConfig = dbConfig;

        if (tunnelConfig) {
            const _tunnelFields = ['username', 'host', 'port'];
            let missingTunnelFields = _.difference(_tunnelFields, _.keys(tunnelConfig));
            if (missingTunnelFields.length !== 0) {
                throw new Error('tunnelConfig missing fields: ' + missingTunnelFields.join(', '));
            }
        }

        this.tunnelConfig = tunnelConfig;

        this.db = {
            Sequelize: Sequelize
        };
    }

    getConnection() {
        return new Bluebird((resolve, reject) => {
            if (this.db.sequelize) {
                return resolve(this.db);
            }

            let tunnelConfig = this.tunnelConfig;
            let dbConfig = this.dbConfig;

            if (!tunnelConfig) {
                this.establishSequelizeConnection(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
                this.loadModels();
                return resolve(this.db);
            }

            getPort().then((tunnelPort) => {
                let writeConfig = _.clone(tunnelConfig);
                writeConfig.dstHost = dbConfig.host;
                writeConfig.dstPort = dbConfig.port;
                writeConfig.localHost = '127.0.0.1';
                writeConfig.localPort = tunnelPort;
                writeConfig.keepAlive = true;
                writeConfig.keepaliveInterval = 5 * 60 * 1000;

                let server = tunnel(writeConfig, (err) => {
                    if (err) return reject(err);

                    if (!dbConfig.replication) {
                        dbConfig.host = '127.0.0.1';
                        dbConfig.port = tunnelPort;
                        this.establishSequelizeConnection(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
                        this.loadModels();
                        return resolve(this.db);
                    }

                    getPort().then((readTunnelPort) => {
                        let readConfig = _.clone(tunnelConfig);
                        readConfig.dstHost = dbConfig.replication.read.host;
                        readConfig.dstPort = dbConfig.replication.read.port;
                        readConfig.localHost = '127.0.0.1';
                        readConfig.localPort = readTunnelPort;
                        readConfig.keepAlive = true;
                        readConfig.keepaliveInterval = 5 * 60 * 1000;

                        let readServer = tunnel(readConfig, (err) => {
                            if (err) return reject(err);
                            dbConfig.replication.write.host = '127.0.0.1';
                            dbConfig.replication.write.port = tunnelPort;
                            dbConfig.replication.read.host = '127.0.0.1';
                            dbConfig.replication.read.port = readTunnelPort;
                            this.establishSequelizeConnection(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
                            this.loadModels();
                            return resolve(this.db);
                        });

                        readServer.on('error', (err) => {
                            console.error(err);
                            throw err;
                        });

                        readServer.on('close', () => {
                            this.db = {
                                Sequelize: Sequelize
                            };
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                });

                server.on('error', (err) => {
                    console.error(err);
                    throw err;
                });

                server.on('close', () => {
                    this.db = {
                        Sequelize: Sequelize
                    };
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }

    establishSequelizeConnection(database, username, password, sequelizeConfig) {
        this.db.sequelize = new Sequelize(database, username, password, sequelizeConfig);
    }

    loadModels() {
        if (!this.dbConfig.modelPattern || typeof this.dbConfig.modelPattern !== 'string' || this.dbConfig.modelPattern.trim().length === 0) {
            return;
        }
        glob.sync(this.dbConfig.modelPattern, {
            absolute: true
        }).forEach((file) => {
            const model = this.db.sequelize['import'](file);
            this.db[model.name] = model;
        });

        Object.keys(this.db).forEach((modelName) => {
            if (this.db[modelName].associate) {
                this.db[modelName].associate(this.db);
            }
        });
    }
}

module.exports = SequelizeTunnelService;