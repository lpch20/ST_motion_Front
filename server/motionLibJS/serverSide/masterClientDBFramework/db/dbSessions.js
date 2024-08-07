/*
 *
 * Copyright (C) MotionSoft Consulting S.R.L. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Ing. Pablo Rivero <privero@motionsoft.com.uy>
 *
 */
var jwt = require("jsonwebtoken");
var config = require('../../../config/config');

function DBSessions(dbMasterConnection) {
    // sessions table fields names
    this.fieldNameUserName = 'user_name';
    this.fieldNameAccountId = 'account_id';
    this.fieldNameLoginDate = 'login_date';
    this.fieldNameTokenId = 'token_id';
    this.fieldNameUserId = 'user_id';
    this.fieldNameDBName = 'database_name';
    this.tableDBName = 'sessions';

    this.dbMasterConnection = dbMasterConnection;
}

DBSessions.prototype.createSession = function (loginResponse, callback) {
    var accountId = null;
    var dbName = null;

    var tableDBName = this.tableDBName;
    var fieldNameUserNameAux = this.fieldNameUserName;
    var fieldNameAccountIdAux = this.fieldNameAccountId;
    var fieldNameLoginDateAux = this.fieldNameLoginDate;
    var fieldNameTokenIdAux = this.fieldNameTokenId;
    var fieldNameDBNameAux = this.fieldNameDBName;
    var fieldNameUserId = this.fieldNameUserId;

    if ((!loginResponse.multiAccount) && (loginResponse.accounts.length === 1)) {
        accountId = loginResponse.accounts[0].id;
        dbName = this.dbMasterConnection.databaseName;
        var clientDBName = loginResponse.accounts[0].databaseName;
        var masterConnection = this.dbMasterConnection;

        // if only an account for the user, delete the current session for the  account.

        this.deleteSession(loginResponse.user.userName, accountId, function (err, res) {
            if (err) {
                callback(err);
            } else {
                loginResponse.existPreviousLogout = false;
                loginResponse.previousSession = res;
                insertSession(loginResponse,
                    dbName, tableDBName, fieldNameUserNameAux, fieldNameUserId, fieldNameAccountIdAux, fieldNameLoginDateAux, fieldNameTokenIdAux, fieldNameDBNameAux,
                    masterConnection, accountId, clientDBName, callback);
            }
        });
    } else {
        loginResponse.existPreviousLogout = true;
        insertSession(loginResponse,
            dbName, tableDBName, fieldNameUserNameAux, fieldNameUserId, fieldNameAccountIdAux, fieldNameLoginDateAux, fieldNameTokenIdAux, fieldNameDBNameAux,
            masterConnection, accountId, clientDBName, callback);
    }
};

DBSessions.prototype.deleteSession = function (user, accountId, callback) {
    var mainThis = this;
    this.dbMasterConnection.connection.query(
        'select * from ' + this.dbMasterConnection.databaseName +
        '.sessions where user_name = "' + user +
        '" and account_id = ' + accountId,
        function (err, res) {
            mainThis.dbMasterConnection.connection.query(
                'delete from ' + mainThis.dbMasterConnection.databaseName +
                '.sessions where user_name = "' + user +
                '" and account_id = ' + accountId,
                function (err2, res2) {
                    callback(err2, res.length && res.length > 0 ? res[0] : null);
                }
            );
        }
    );
}

DBSessions.prototype.verifySession = function (user, tokenId, accountId, callback) {

    if ((!user) || (user === '')) {
        callback('user not defined in header request', true);
        return;
    }

    if ((!tokenId) || (tokenId === '')) {
        callback('tokenId not defined in header request', true);
        return;
    }

    if ((!accountId) || (accountId === 0)) {
        callback('accountId not defined in header request', true);
        return;
    }


    this.dbMasterConnection.connection.query(
        'SELECT * FROM ' + this.dbMasterConnection.databaseName +
        '.sessions WHERE user_name = ? and account_id = ?', [user, accountId],
        function (err, rows, fields) {

            if (err) {
                callback(err, false);
            } else if ((!rows) || (rows.length === 0) || (rows[0].token_id !== tokenId)) {
                callback('session not found', true);
            } else {
                callback(err, false, true, rows[0].database_name, rows[0].timestamp);
            }
        }
    );
};

DBSessions.prototype.updateSessionTimestamp = function (user, tokenId, accountId, callback) {
    var query = 'UPDATE ' + this.dbMasterConnection.databaseName + '.sessions ' +
        'SET timestamp = ? ' +
        'WHERE user_name = ? and account_id = ? and token_id = ?';

    this.dbMasterConnection.connection.query(query, [new Date(), user, accountId, tokenId],
        function (err, rows, fields) {
            callback(err)
        }
    );
};

module.exports = DBSessions;

function insertSession(loginResponse, dbName, tableDBName, fieldNameUserNameAux, fieldNameUserId, fieldNameAccountIdAux, fieldNameLoginDateAux, fieldNameTokenIdAux, fieldNameDBNameAux, masterConnection, accountId, clientDBName, callback) {
    // generate the token id          
    var tokenId = jwt.sign({
        user: loginResponse.user,
        date: new Date()
    }, config.TOKEN_SECRET);
    loginResponse.tokenId = tokenId;
    // store the session in the database
    var sqlInsertBuilder = require('../../database/SQLInsertBuilder');
    var sqlInsert = sqlInsertBuilder(dbName, tableDBName, {
        fieldNames: [fieldNameUserNameAux, fieldNameUserId, fieldNameAccountIdAux,
            fieldNameLoginDateAux, fieldNameTokenIdAux, fieldNameDBNameAux
        ]
    });
    masterConnection.connection.query(sqlInsert, [loginResponse.user.userName, loginResponse.user.id, accountId, new Date(),
        tokenId, clientDBName
    ], function (err, rows, fields) {
        callback(err, loginResponse);
        return;
    });
}