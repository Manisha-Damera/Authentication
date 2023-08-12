const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};
//api1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  const userData = await db.get(checkTheUsername);
  if (userData === undefined) {
    const postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    //if (validatePassword(password)) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const dbResponse = await db.run(postNewUserQuery);
      const newUserId = dbResponse.lastID;
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkTheUser = `
            SELECT *
            FROM user
            WHERE 
            username = '${username}';`;
  const userData = await db.get(checkTheUser);
  if (userData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, userData.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Api3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const checkThePassword = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  const userData = await db.get(checkThePassword);
  if (userData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      userData.password
    );

    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
            UPDATE 
             user
            SET
            password='${encryptedPassword}'
            WHERE
            username='${username}';`;
        const user = await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
