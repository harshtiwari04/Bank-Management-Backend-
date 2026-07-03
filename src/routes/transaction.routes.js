const { Router } = require('express');
const { authMiddleware, authSystemUserMiddleware } = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

const transactionRoutes = Router();

/**
 * - POST api/transactions/
 * - Create a new transaction
 */
// FIXED: Changed authMiddleware.authMiddleware to just authMiddleware
transactionRoutes.post('/', authMiddleware, transactionController.createTransaction); 

/**
 * - POST api/transactions/system/initial-fund
 * - Create initial ledger entries for a transaction
 */
transactionRoutes.post('/system/initial-fund', authSystemUserMiddleware, transactionController.createInitialFundTransaction);

module.exports = transactionRoutes;