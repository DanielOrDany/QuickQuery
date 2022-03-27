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
        const numberOfRecords = Number(loadingOptions.numberOfRecords);
        const limit = Number(loadingOptions.pageSize);

        // Options
        if (loadingOptions.operationsOptions) {

            // Searches
            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;
                const search = option.search;

                let searchArray = [];
                for (let i = 0; i < search.length; i++) {
                    searchArray.push(search.slice(0, i + 1));
                }

                if (searchArray.length > 0) {
                    query = query.where(column, '==', search)
                }
            });

            // Filters
            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;

                const filter1 = option.filter1;
                const filter2 = option.filter2;

                if (!isEmpty(filter1) && !isEmpty(filter2)) {
                    const filter1IsDate = (new Date(filter1) !== "Invalid Date") && !isNaN(new Date(filter1));
                    const filter1IsNumber = /^-?\d+$/.test(filter1);
                    const filter2IsDate = (new Date(filter2) !== "Invalid Date") && !isNaN(new Date(filter2));
                    const filter2IsNumber = /^-?\d+$/.test(filter2);

                    // Date
                    if (
                        filter1IsDate &&
                        filter2IsDate &&
                        !filter1IsNumber &&
                        !filter2IsNumber
                    ) {
                        const newFilter1 = filter1.split("/");
                        const newFilter2 = filter2.split("/");
                        const d1 = newFilter1[2] + newFilter1[0] + newFilter1[1];
                        const d2 = newFilter2[2] + newFilter2[0] + newFilter2[1];

                        const d1Timestamp = new Date(newFilter1[2], newFilter1[0] - 1, newFilter1[1]);
                        const d2Timestamp = new Date(newFilter2[2], newFilter2[0] - 1, newFilter2[1]);

                        if (d2 < d1) {
                            query = query
                                .where(column, '>', d2Timestamp)
                                .where(column, '<', d1Timestamp)

                        } else {
                            query = query
                                .where(column, '>', d1Timestamp)
                                .where(column, '<', d2Timestamp)
                        }

                    // Numbers
                    } else {
                        let n1, n2;

                        if (
                            !filter1IsNumber &&
                            !filter2IsNumber
                        ) {
                            n1 = parseInt(filter1);
                            n2 = parseInt(filter2);
                        } else {
                            n1 = filter1;
                            n2 = filter2;
                        }

                        if (n2 < n1) {
                            query = query
                                .where(column, '>=', n2)
                                .where(column, '<=', n1)

                        } else {
                            query = query
                                .where(column, '>=', n1)
                                .where(column, '<=', n2)

                        }
                    }
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

        // Options
        if (loadingOptions.operationsOptions) {

            // Searches
            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;
                const search = option.search;

                let searchArray = [];
                for (let i = 0; i < search.length; i++) {
                    searchArray.push(search.slice(0, i + 1));
                }

                if (searchArray.length > 0) {
                    query = query.where(column, '==', search)
                }
            });

            // Filters
            loadingOptions.operationsOptions.forEach((option) => {
                let column = option.column;

                const filter1 = option.filter1;
                const filter2 = option.filter2;

                if (!isEmpty(filter1) && !isEmpty(filter2)) {
                    const filter1IsDate = (new Date(filter1) !== "Invalid Date") && !isNaN(new Date(filter1));
                    const filter1IsNumber = /^-?\d+$/.test(filter1);
                    const filter2IsDate = (new Date(filter2) !== "Invalid Date") && !isNaN(new Date(filter2));
                    const filter2IsNumber = /^-?\d+$/.test(filter2);

                    // Date
                    if (
                        filter1IsDate &&
                        filter2IsDate &&
                        !filter1IsNumber &&
                        !filter2IsNumber
                    ) {
                        const newFilter1 = filter1.split("/");
                        const newFilter2 = filter2.split("/");
                        const d1 = newFilter1[2] + newFilter1[0] + newFilter1[1];
                        const d2 = newFilter2[2] + newFilter2[0] + newFilter2[1];

                        const d1Timestamp = new Date(newFilter1[2], newFilter1[0] - 1, newFilter1[1]);
                        const d2Timestamp = new Date(newFilter2[2], newFilter2[0] - 1, newFilter2[1]);

                        if (d2 < d1) {
                            query = query
                                .where(column, '>', d2Timestamp)
                                .where(column, '<', d1Timestamp)

                        } else {
                            query = query
                                .where(column, '>', d1Timestamp)
                                .where(column, '<', d2Timestamp)
                        }

                        // Numbers
                    } else {
                        let n1, n2;

                        if (
                            !filter1IsNumber &&
                            !filter2IsNumber
                        ) {
                            n1 = parseInt(filter1);
                            n2 = parseInt(filter2);
                        } else {
                            n1 = filter1;
                            n2 = filter2;
                        }

                        if (n2 < n1) {
                            query = query
                                .where(column, '>=', n2)
                                .where(column, '<=', n1)

                        } else {
                            query = query
                                .where(column, '>=', n1)
                                .where(column, '<=', n2)

                        }
                    }
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

        const entries = updateColumns.map(c => {
            const column = c[0];
            let value = c[1];

            if (JSON.parse(value)) {
                value = JSON.parse(value);
            }

            return [column, value];
        });
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

async function getFirestoreTableColumns(connection, table) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(connection.firebaseConfig)
        });
    } else {
        admin.app(); // if already initialized, use that one
    }

    const firebase_db = admin.firestore();

    let query = firebase_db.collection(table);

    const snapshot = await query.get();

    const rows = await Promise.all(snapshot.docs.map(row => {
        return row.data();
    }));

    const columns = Object.keys(rows[0]);

    return columns.map(column => {
        return {
            column_name: column
        }
    });
}

/*
*  IN DEVELOPING
*/

async function runFirestoreQuery(connection, query) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(connection.firebaseConfig)
        });
    } else {
        admin.app(); // if already initialized, use that one
    }

    const firebase_db = admin.firestore();

    const joins = query.split("#");

    joins.forEach(join => {
       if (join.length > 0) {
           const params = join.split("=");
           const firstTable = params[0].split(".")[0];
           const firstColumn = params[0].split(".")[1];
           const secondTable = params[1].split(".")[0];
           const secondColumn = params[1].split(".")[1];
            // console.log({
            //     firstTable,
            //     firstColumn,
            //     secondTable,
            //     secondColumn
            // })
       }
    });
    // console.log(joins);
    // console.log("QUERY", query);
    // query = query.replace(';', ' ');
    // query += ' LIMIT 3 OFFSET 0';
    //
    // return {
    //     "rows": results,
    //     "fields": metadata.fields
    // }
}

module.exports = {
    loadFirestoreTable,
    getFirestoreTableSize,
    saveFirestoreTableResult,
    updateDefaultFirestoreTableRow,
    deleteDefaultFirestoreTableRow,
    getFirestoreTableColumns,
    runFirestoreQuery
};