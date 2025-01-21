const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");

const app = express();
app.use(express.json());

const connection = mysql.createConnection({
    host: "svc-3482219c-a389-4079-b18b-d50662524e8a-shared-dml.aws-virginia-6.svc.singlestore.com",
    port: 3333,
    user: "Tima-29a20",
    password: "OP7eeUq3fbKZOppqF1JIsCMlDJHNMD17",
    database: "tanks",
    ssl: {
        ca: fs.readFileSync("./singlestore_bundle.pem"),
    },
});

// Проверка подключения
connection.connect((err) => {
    if (err) {
        console.error("Ошибка подключения к базе данных:", err);
    } else {
        console.log("Подключение успешно установлено.");
    }
});

console.log(connection);

app.get("/api/create-table", (req, res) => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            PRIMARY KEY (id, email),
            SHARD KEY (id, email)
        );
    `;
    connection.query(query, (err) => {
        if (err) {
            console.error("Ошибка создания таблицы:", err);
            return res.status(500).send("Ошибка сервера");
        }
        res.send("Таблица пользователей создана.");
    });
});

// 2. Заполнение таблицы 10 пользователями
app.get("/api/populate-table", (req, res) => {
    const users = [
        { name: "Alice", email: "alice@example.com" },
        { name: "Bob", email: "bob@example.com" },
        { name: "Charlie", email: "charlie@example.com" },
        { name: "Diana", email: "diana@example.com" },
        { name: "Eve", email: "eve@example.com" },
        { name: "Frank", email: "frank@example.com" },
        { name: "Grace", email: "grace@example.com" },
        { name: "Hank", email: "hank@example.com" },
        { name: "Ivy", email: "ivy@example.com" },
        { name: "Jack", email: "jack@example.com" },
    ];

    const query = `INSERT INTO users (name, email) VALUES ?`;
    const values = users.map((user) => [user.name, user.email]);

    connection.query(query, [values], (err, results) => {
        if (err) {
            console.error("Ошибка вставки данных:", err.message);
            return res.status(500).send("Ошибка вставки данных: " + err.message);
        }
        res.send("Таблица заполнена данными!");
    });
});

// 3. Получение всех пользователей
app.get("/api/users", (req, res) => {
    const query = `SELECT * FROM users`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Ошибка выполнения запроса:", err.message);
            return res.status(500).send("Ошибка сервера");
        }
        res.json(results);
    });
});

// 4. Получение конкретного пользователя
app.get("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    const query = `SELECT * FROM users WHERE id = ?`;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Ошибка получения пользователя:", err);
            return res.status(500).send("Ошибка сервера");
        }

        if (results.length === 0) {
            return res.status(404).send("Пользователь не найден");
        }

        res.json(results[0]);
    });
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
