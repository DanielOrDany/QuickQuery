const FireSQL = require("firesql").FireSQL;
const admin = require("firebase-admin");
const auth = require('../auth');

const { isEmpty, sortByLength } = require('../helpers');

async function getFirestoreTableSize(connection, tableName) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(connection.firebaseConfig)
        });
    } else {
        admin.app(); // if already initialized, use that one
    }

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

async function updateDefaultFirestoreTableRow(id, token, connection, table, columnsAndValues) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(connection.firebaseConfig)
        });
    } else {
        admin.app(); // if already initialized, use that one
    }

    const firebase_db = admin.firestore();

    let query = firebase_db.collection(table.table);

    const updateColumns = columnsAndValues.filter((rc) => rc.length > 2);
    const oldColumns = columnsAndValues.filter((rc) => rc.length < 3);

    const newColumnValues = updateColumns.map((uc) => {
        return ` ${uc[1]}`;
    });
    const oldColumnValues = updateColumns.map((uc) => {
        return ` ${uc[2]}`;
    });

    oldColumns.forEach((cAndV) => {
        if (typeof cAndV[1] !== 'object') {
            query = query.where(cAndV[0], '==', cAndV[1]);
        }
    });

    const snapshot = await query.get();

    if (snapshot.docs.length > 0) {
        let updateQuery = firebase_db.collection(table.table);

        const entries = updateColumns.map(c => [c[0], c[1]]);
        const obj = Object.fromEntries(entries);

        updateQuery.doc(snapshot.docs[0].id).update(obj);
    }

    auth.addHistoryItem(id, token, 'update', table.table, oldColumnValues.join(), newColumnValues.join());
    return { status: 'updated' };
}

async function deleteDefaultFirestoreTableRow(id, token, connection, table, columnsAndValues) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(connection.firebaseConfig)
        });
    } else {
        admin.app(); // if already initialized, use that one
    }

    const firebase_db = admin.firestore();

    let query = firebase_db.collection(table.table);

    const oldColumnsLen = columnsAndValues.length;
    let where = columnsAndValues.map((cAndV, index) => {
        if (index === oldColumnsLen - 1) {
            return ` ${cAndV[0]} ${typeof cAndV[1] === 'string' ? `= '${cAndV[1]}'` : `is ${cAndV[1]}`}`;
        } else {
            return ` ${cAndV[0]} ${typeof cAndV[1] === 'string' ? `= '${cAndV[1]}'` : `is ${cAndV[1]}`} and`;
        }
    });

    columnsAndValues.map((cAndV) => {
        if (typeof cAndV[1] !== 'object') {
            query = query.where(cAndV[0], '==', cAndV[1]);
        }
    });

    const snapshot = await query.get();

    if (snapshot.docs.length > 0) {
        let deleteQuery = firebase_db.collection(table.table);

        deleteQuery.doc(snapshot.docs[0].id).delete();
    }

    auth.addHistoryItem(id, token, 'delete', table.table, where.join().replace(/,/g, ''));

    return { status: 'deleted' };
}

module.exports = {
    loadFirestoreTable,
    getFirestoreTableSize,
    saveFirestoreTableResult,
    updateDefaultFirestoreTableRow,
    deleteDefaultFirestoreTableRow
};