const express = require('express');

const authMiddleware = require('../middleware/auth.middleware');
const accountController = require('../controllers/account.controller')

const router = express.Router();

/* -POST /api/accounts
-create a new account for the authenticated user. The request body should contain the currency of the account. The account will be created with a default status of "Active". */


router.post('/', authMiddleware.authMiddleware , accountController.createAccountController);


router.get("balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController);


module.exports = router;