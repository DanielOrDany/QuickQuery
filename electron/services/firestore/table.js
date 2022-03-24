const FireSQL = require("firesql").FireSQL;
const admin = require("firebase-admin");

const { isEmpty, sortByLength } = require('../helpers');

async function getFirestoreTableSize(connection, tableName) {
    admin.initializeApp({
        credential: admin.credential.cert(connection.firebaseConfig)
    });

    const firebase_db = admin.firestore();

    const result = await firebase_db.collection(tableName).get();

    return result.size;
}

async function loadFirestoreTable(connection, queryData, loadingOptions) {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(connection.firebaseConfig)
            });
        } else {
            admin.app(); // if already initialized, use that one
        }

        const firebase_db = admin.firestore();

        let query = firebase_db.collection(queryData.table);

        const offset = Number(loadingOptions.page) * Number(loadingOptions.pageSize);
        const tableColumns = loadingOptions.columns ? sortByLength(loadingOptions.columns) : [];
        const numberOfRecords = Number(loadingOptions.numberOfRecords);
        const limit = Number(loadingOptions.pageSize);

        if (loadingOptions.operationsOptions) {
            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;
                const search = option.search;

                // Join cases
                tableColumns.forEach(tableColumn => {
                    const regex = /\./g;
                    const fullColumn = column.replace(regex, '_');

                    if (fullColumn.match(tableColumn)) {
                        column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
                    }
                });

                let searchArray = [];
                for (let i = 0; i < search.length; i++) {
                    searchArray.push(search.slice(0, i + 1));
                }

                console.log(searchArray)
                if (searchArray.length > 0) {
                    query = query.where(column, '==', search)
                }
            });

            let order;
            let orderColumn;

            loadingOptions.operationsOptions.forEach((option) => {
                if (option.order) {
                    order = option.order;
                    orderColumn = option.column;
                }
            });

            if (orderColumn && order) {
                query = query.orderBy(orderColumn, order.toLowerCase())
            }
        }

        query = query.offset(offset).limit(limit)

        const snapshot = await query.get();

        const rows = await Promise.all(snapshot.docs.map(row => {
            return row.data();
        }));

        const number = numberOfRecords/limit;
        const one = Number(number).toFixed(0);

        let pages = 0;
        const records = numberOfRecords;

        if (number > one) {
            pages = one + 1;
        } else {
            pages = number;
        }

        return  {
            rows: rows,
            fields: rows.length > 0 ? Object.keys(rows[0]) : [],
            pages: Math.ceil(pages),
            records: records
        }
    } catch (e) {
        console.log(e);
    }
}

async function saveFirestoreTableResult(connection, queryData, loadingOptions) {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(connection.firebaseConfig)
            });
        } else {
            admin.app(); // if already initialized, use that one
        }

        const firebase_db = admin.firestore();

        let query = firebase_db.collection(queryData.table);
        const tableColumns = loadingOptions.columns ? sortByLength(loadingOptions.columns) : [];

        if (loadingOptions.operationsOptions) {
            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;
                const search = option.search;

                // Join cases
                tableColumns.forEach(tableColumn => {
                    const regex = /\./g;
                    const fullColumn = column.replace(regex, '_');

                    if (fullColumn.match(tableColumn)) {
                        column = fullColumn.replace(`${tableColumn}_`, `${tableColumn}.`);
                    }
                });

                let searchArray = [];
                for (let i = 0; i < search.length; i++) {
                    searchArray.push(search.slice(0, i + 1));
                }

                console.log(searchArray)
                if (searchArray.length > 0) {
                    query = query.where(column, '==', search)
                }
            });

            let order;
            let orderColumn;

            loadingOptions.operationsOptions.forEach((option) => {
                if (option.order) {
                    order = option.order;
                    orderColumn = option.column;
                }
            });

            if (orderColumn && order) {
                query = query.orderBy(orderColumn, order.toLowerCase())
            }
        }

        const snapshot = await query.get();

        const rows = await Promise.all(snapshot.docs.map(row => {
            return row.data();
        }));

        return {
            rows: rows,
            fields: rows.length > 0 ? Object.keys(rows[0]) : []
        }
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    loadFirestoreTable,
    getFirestoreTableSize,
    saveFirestoreTableResult
};