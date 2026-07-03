const express = require('express');
const cookieParser = require('cookie-parser');

/**Routes Required */
const authRouter = require('./routes/auth.routes');
const accountRouter = require('./routes/accounts.route');
const transactionRoutes = require('./routes/transaction.routes');

const app = express();


/**Use Routes */
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth' , authRouter);
app.use('/api/accounts' , accountRouter);
app.use('/api/transactions' , transactionRoutes);

module.exports = app;