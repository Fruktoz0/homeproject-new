require("dotenv").config();
const express = require("express");
const server = express();
const PORT = process.env.PORT;

const dbHandler = require("./dbHandler");
const cors = require("cors");

server.use(cors());
server.use(express.json());
server.use('/api/users', require('./routes/usersRoutes'));
server.use('/api/transactions', require('./routes/transactionsRoutes'));
server.use('/api/households', require('./routes/householdRoutes'));
server.use('/api/recurring', require('./routes/recurringItemsRoutes'));
server.use('/api/savings', require('./routes/savingGoalsRoutes'));
server.use('/api/audit-logs', require('./routes/auditLogsRoutes'));
server.use('/api/stats', require('./routes/statsRoutes'));
server.use('/api/shopping', require('./routes/shoppingRoutes'));

(async () => {
    try {
        await dbHandler.dbConnection.sync();
        server.listen(PORT, () => {
            console.log(`\n Database connected at port ${PORT}`)
        })
    } catch (error) {
        console.log("Database connection error", error);
    }
})()



//csak teszt