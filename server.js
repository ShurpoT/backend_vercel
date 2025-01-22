require("dotenv").config(); // Подключаем переменные окружения
const express = require("express");
const cors = require("cors");
const corsConfig = {
    origin: "*",
    credential: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
};
const mysql = require("mysql2");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors(corsConfig));
app.use("/", express.static("public"));

// Настройки подключения
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    queueLimit: 0,
    ssl: {
        // ca: process.env.SSL_CERTIFICATE, // SSL сертификат из переменной
        ca: fs.readFileSync("./singlestore_bundle.pem"),
    },
});

// Проверка подключения
connection.connect((err) => {
    if (err) {
        console.error("Ошибка подключения к базе данных:", err);
        process.exit(1); // Завершаем процесс при ошибке
    } else {
        console.log("Подключение успешно установлено.");
    }
});

// Маршруты API
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
            console.error("Ошибка создания таблицы:", err.message);
            return res.status(500).send("Ошибка сервера: " + err.message);
        }
        res.send("Таблица пользователей создана.");
    });
});

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

    connection.query(query, [values], (err) => {
        if (err) {
            console.error("Ошибка вставки данных:", err.message);
            return res.status(500).send("Ошибка вставки данных: " + err.message);
        }
        res.send("Таблица заполнена данными!");
    });
});

app.get("/api/users", (req, res) => {
    const query = `SELECT * FROM users`;
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Ошибка выполнения запроса:", err.message);
            return res.status(500).send("Ошибка сервера: " + err.message);
        }
        res.json(results);
    });
});

app.get("/api/users/:id", (req, res) => {
    const userId = req.params.id;
    const query = `SELECT * FROM users WHERE id = ?`;
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Ошибка получения пользователя:", err.message);
            return res.status(500).send("Ошибка сервера: " + err.message);
        }

        if (results.length === 0) {
            return res.status(404).send("Пользователь не найден.");
        }

        res.json(results[0]);
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3171;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
