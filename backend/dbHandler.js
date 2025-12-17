const { Sequelize, DataTypes, DATE } = require("sequelize");
require("dotenv").config();

const dbConnection = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
    })

const users = dbConnection.define("user", {
    'id': {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    'displayName': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'email': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    'password': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'membershipStatus': {
        type: DataTypes.ENUM("approved", "pending"),
        defaultValue: "pending",
    }
})

const transactions = dbConnection.define("transaction", {
    'id': {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    'amount': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'type': {
        type: DataTypes.ENUM("INCOME", "EXPENSE"),
        allowNull: false,
    },
    'category': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'date': {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    'description': {
        type: DataTypes.STRING,
        allowNull: true,
    },
    'isRecurringInstance': {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    paranoid: true,
})

const households = dbConnection.define("household", {
    'id': {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'inviteCode': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    'currency': {
        type: DataTypes.ENUM("HUF", 'EUR', 'USD'),
        defaultValue: "HUF",
    },
    'ownerId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
})

const invitations = dbConnection.define("invitation", {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    'email': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'status': {
        type: DataTypes.ENUM("pending", "accepted", "revoked"),
        defaultValue: "pending",
    },
    'code': {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    'householdId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
})

const recurringItems = dbConnection.define("recurringItem", {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'amount': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'frequency': {
        type: DataTypes.ENUM("MONTHLY", "BIMONTHLY", "QUARTERLY", "HALF-YEARLY", "YEARLY"),
        defaultValue: "MONTHLY",
        allowNull: false,
    },
    'active': {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    'autoPay': {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    'startDate': {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    'payDay': {
        type: DataTypes.INTEGER,
    },
    'householdId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
})
const auditLogs = dbConnection.define("auditLog", {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    'actionType': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'originalData': {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    'timestamp': {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    'performedByUserId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
    'householdId': {
        type: DataTypes.UUID,
        allowNull: false,
    }
})

const savingGoals = dbConnection.define("savingGoal", {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false,
    },
    'currentAmount': {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    'targetAmount': {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    'householdId': {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    paranoid: true,
})

const shoppingLists = dbConnection.define('shoppingList', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'status': {
        type: DataTypes.ENUM('ACTIVE', 'COMPLETED'),
        defaultValue: 'ACTIVE'
    },
    'householdId': {
        type: DataTypes.UUID,
        allowNull: false
    },
    'purchased': {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    'createdBy': {
        type: DataTypes.UUID,
        allowNull: false
    }
});

const shoppingItems = dbConnection.define('shoppingItem', {
    'id': {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    'list_id': {
        type: DataTypes.UUID,
        allowNull: false
    },
    'name': {
        type: DataTypes.STRING,
        allowNull: false
    },
    'unit': {
        type: DataTypes.ENUM('db', 'kg', 'l'),
        defaultValue: 'db'
    },
    'quantity': {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1
    },
    'purchased': {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    'added_by': {
        type: DataTypes.UUID,
        allowNull: true
    }
});


// Egy háztartásnak sok tagja van
households.hasMany(users, { foreignKey: 'householdId', as: 'members' });
users.belongsTo(households, { foreignKey: 'householdId', as: 'household' });

// Egy tranzakciót egy felhasználó hoz létre
users.hasMany(transactions, { foreignKey: 'createdBy' });
transactions.belongsTo(users, { foreignKey: 'createdBy', as: 'creator' });

// Egy tranzakció tartozhat egy fix tételhez (RecurringItem)
recurringItems.hasMany(transactions, { foreignKey: 'recurringItemId' });
transactions.belongsTo(recurringItems, { foreignKey: 'recurringItemId' });

// Fix tételek és Megtakarítások a háztartáshoz tartoznak
households.hasMany(recurringItems, { foreignKey: 'householdId' });
recurringItems.belongsTo(households, { foreignKey: 'householdId' });

// Egy felhasználóhoz tartozhat több megtakarítás
users.hasMany(savingGoals, { foreignKey: 'userId' });
savingGoals.belongsTo(users, { foreignKey: 'userId' });

// Egy háztartásnak több megtakarítása is lehet
households.hasMany(savingGoals, { foreignKey: 'householdId' });
savingGoals.belongsTo(households, { foreignKey: 'householdId' });

// AuditLog relációk
households.hasMany(auditLogs, { foreignKey: 'householdId' });
auditLogs.belongsTo(households, { foreignKey: 'householdId' });
users.hasMany(auditLogs, { foreignKey: 'performedByUserId' });
auditLogs.belongsTo(users, { foreignKey: 'performedByUserId', as: 'actor' });

// shoppingList és shoppingItem kapcsolatok
shoppingLists.hasMany(shoppingItems, { foreignKey: 'list_id', onDelete: 'CASCADE' });
shoppingItems.belongsTo(shoppingLists, { foreignKey: 'list_id' });
shoppingItems.belongsTo(users, { foreignKey: 'added_by', as: 'creator', });

module.exports = {
    dbConnection,
    Sequelize,
    transactions,
    users,
    households,
    recurringItems,
    invitations,
    auditLogs,
    savingGoals,
    shoppingLists,
    shoppingItems
}