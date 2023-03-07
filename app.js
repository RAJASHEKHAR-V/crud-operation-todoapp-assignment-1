// import express js  core path

const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

// import sqlite, sqlite3, date formate, toDate, isValid

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const toDate = require("date-fns/toDate");
const isValid = require("date-fns/isValid");

// Initialize Database And Server
let db = null;

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDatabaseAndServer();

// Check for Invalid API Query parameters using middleWare function

const checkQueryParameters = async (request, response, next) => {
  const { category, priority, status, date, search_q } = request.query;
  const { todoId } = request.params;
  // category parameter

  if (category !== undefined) {
    const isCategoryInPossibleValues = ["WORK", "HOME", "LEARNING"].includes(
      category
    );
    if (isCategoryInPossibleValues) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  // priority parameter
  if (priority !== undefined) {
    const isPriorityInPossibleValues = ["HIGH", "MEDIUM", "LOW"].includes(
      priority
    );
    if (isPriorityInPossibleValues) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  // status parameter
  if (status !== undefined) {
    const isStatusInPossibleValues = ["TO DO", "IN PROGRESS", "DONE"].includes(
      status
    );
    if (isStatusInPossibleValues) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  // due date parameter

  if (date !== undefined) {
    const stampDate = await toDate(new Date(date));
    const isValidDate = await isValid(stampDate);
    if (isValidDate) {
      const formatDate = format(new Date(date), "yyyy-MM-dd");
      request.date = formatDate;
    } else {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todoId = todoId;
  //   console.log(todoId);
  request.search_q = search_q;
  next();
};

// Check for Invalid API body parameters using middleWare function

const checkBodyParameters = async (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  // category parameter
  if (category !== undefined) {
    const isCategoryInPossibleValues = ["WORK", "HOME", "LEARNING"].includes(
      category
    );
    if (isCategoryInPossibleValues) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  // priority parameter
  if (priority !== undefined) {
    const isPriorityInPossibleValues = ["HIGH", "MEDIUM", "LOW"].includes(
      priority
    );
    if (isPriorityInPossibleValues) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  // status parameter
  if (status !== undefined) {
    const isStatusInPossibleValues = ["TO DO", "IN PROGRESS", "DONE"].includes(
      status
    );
    if (isStatusInPossibleValues) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  // due date parameter
  if (dueDate !== undefined) {
    const stampDate = await toDate(new Date(dueDate));
    const isValidDate = await isValid(stampDate);
    if (isValidDate) {
      const formatDate = format(new Date(dueDate), "yyyy-MM-dd");
      request.dueDate = formatDate;
    } else {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.id = id;
  request.todo = todo;
  request.todoId = todoId;
  next();
};

//API-1 to satisfy seven scenarios;

app.get("/todos/", checkQueryParameters, async (request, response) => {
  const { category = "", priority = "", status = "", search_q = "" } = request;

  //   const { todoId = "HI" } = request;
  //   console.log(todoId);

  const searchQueryForAllScenarios = `
    SELECT id, todo, category, priority, status, due_date AS dueDate
    FROM todo WHERE category LIKE '%${category}%' AND priority LIKE '%${priority}%'
    AND status LIKE '%${status}%' AND todo LIKE '%${search_q}%';`;
  const todoDetails = await db.all(searchQueryForAllScenarios);
  response.send(todoDetails);
});

// API-2 get the todo details based on the specific todoId;

app.get("/todos/:todoId/", checkBodyParameters, async (request, response) => {
  const { todoId } = request;
  const getIdTodoQuery = `
    SELECT id AS id,todo AS todo, category AS category, priority AS priority, status AS status, due_date AS dueDate
    FROM todo WHERE id =${todoId};`;
  const idTodo = await db.get(getIdTodoQuery);
  response.send(idTodo);
});

//API-3 get the todo based on the specific due date

app.get("/agenda/", checkQueryParameters, async (request, response) => {
  const { date } = request;
  const getDateTodoQuery = `
    SELECT id, todo, category, priority, status, due_date AS dueDate
    FROM todo WHERE due_date = '${date}';`;
  const dateTodo = await db.all(getDateTodoQuery);
  response.send(dateTodo);
});

//API-4 create todo details

app.post("/todos/", checkBodyParameters, async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request;
  const createTodoQuery = `
  INSERT INTO todo (id, todo, category, priority, status, due_date)
  VALUES ('${id}', '${todo}', '${category}', '${priority}', '${status}', '${dueDate}');`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API-5 update todo details

app.put("/todos/:todoId/", checkBodyParameters, async (request, response) => {
  const { todo, category, priority, status, dueDate } = request;
  const { todoId } = request;
  let todoQuery = null;
  switch (true) {
    case todo !== undefined:
      todoQuery = `
            UPDATE todo 
            SET todo = '${todo}'
            WHERE id =${todoId};`;
      await db.run(todoQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      todoQuery = `
            UPDATE todo 
            SET category = '${category}' 
            WHERE id =${todoId};`;
      await db.run(todoQuery);
      response.send("Category Updated");
      break;
    case priority !== undefined:
      todoQuery = `
            UPDATE todo 
            SET priority = '${priority}'
            WHERE id =${todoId};`;
      await db.run(todoQuery);
      response.send("Priority Updated");
      break;
    case status !== undefined:
      todoQuery = `
            UPDATE todo 
            SET status = '${status}'
            WHERE id =${todoId};`;
      await db.run(todoQuery);
      response.send("Status Updated");
      break;
    default:
      todoQuery = `
            UPDATE todo 
            SET due_date = '${dueDate}'
            WHERE id =${todoId};`;
      await db.run(todoQuery);
      response.send("Due Date Updated");
      break;
  }
});

//API-6 Delete the specific todo based on id

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo WHERE id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
