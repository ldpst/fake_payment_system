const mysql = require("mysql2");

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'hihihaha net parolya',
    database: 'bank_system'
}).promise();

const mysqlExecute = async (sql, params = []) => {
    try {
        return await pool.execute(sql, params);
    } catch (err) {
        console.error(`Возникла ошибка при ${sql}`, err.message);
        throw err;
    }
}

class User {
    constructor(new_user_id) {
        this.user_id = new_user_id;
        this.user_name = null;
        this.user_value = null;
    }

    async updateData() {
        const user_data = await mysqlExecute('SELECT * FROM users WHERE user_id = ?', [this.user_id]);
        this.user_name = user_data[0][0]?.user_name;
        const user_account_data = await mysqlExecute('SELECT * FROM user_account WHERE user_id = ?', [this.user_id]);
        this.user_value = user_account_data[0][0]?.user_value;
    }

    toString() {
        return this.user_id + " " + this.user_name;
    }
}

class Bank {
    static async transfer(user_from, user_to, value) {
        const transfer_data = await mysqlExecute('INSERT INTO transfers VALUES (null, ?, ?, ?, null);', [user_from.user_id, user_to.user_id, value]);
        const transfer_id = transfer_data[0]?.insertId;
        try {
            await user_from.updateData();
            if (user_from.user_value >= value) {
                await mysqlExecute('UPDATE user_account SET user_value = user_value - ? WHERE user_id = ?;', [value, user_from.user_id]);
                await user_from.updateData();
                await mysqlExecute('UPDATE transfers SET transfer_status = ? WHERE transfer_id = ?', [1, transfer_id]);
            } else {
                console.log(`У ${user_from.toString()} недостаточно средств.`);
                await mysqlExecute('UPDATE transfers SET transfer_status = ? WHERE transfer_id = ?', [0, transfer_id]);
                return;
            }
            await mysqlExecute('UPDATE user_account SET user_value = user_value + ? WHERE user_id = ?;', [value, user_to.user_id]);
            await user_from.updateData();
        }
        catch (err) {
            console.error(`Ошибка в transfer ${user_from.toString()} ${user_to.toString()} ${value}`);
            await mysqlExecute('UPDATE transfers SET transfer_status = ? WHERE transfer_id = ?', [2, transfer_id]);
        }
    }
}

(async () => {
    const first_user = new User(3);
    const second_user = new User(2);
    await first_user.updateData();
    await second_user.updateData();
    await Bank.transfer(second_user, first_user, 600);
})();
