const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");

var isValid = require('date-fns/isValid')
const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());
let db = null;
const initializeDbAndServer = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Running at localhost:3000"));
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDbAndServer();

const checkRequestsQueries = async (request,response,next) =>{
    const {search_q,category,priority,status,date} = request.query;
    const {todoId} =request.params;
    if (category !== undefined){
        const categoryArray =["WORK","HOME","LEARNING"];
        const categoryIsArray = categoryArray.includes(category);
        if (categoryIsArray === true){
            request.category=category;
        } else{
            response.status(400);
            response.send("Invalid Todo Category");
            return;
        }
    }
    if (priority !== undefined){
        const priorityArray =["HIGH","MEDIUM","LOW"];
        const priorityIsArray = priorityArray.includes(priority);
        if (priorityIsArray === true){
            request.priority=priority;
        } else{
            response.status(400);
            response.send("Invalid Todo Priority");
            return;
        }
    }
    if (status !== undefined){
        const statusArray =["TO DO","IN PROGRESS","DONE"];
        const statusIsArray = statusArray.includes(status);
        if (statusIsArray === true){
            request.status=status;
        }
        else{
            response.status(400);
            response.send("Invalid Todo Status");
            return;
        }
    }
    if (date !== undefined){
        try{
            const myDate = new Date(date);

            const formatedDate =format (new Date(date), "yyyy-MM-dd");
            console.log(formatedDate,"f");
            const result = toDate(
                new Date(`${myDate.getFullYear()}-${myDate.getMonth() +1}-${myDate.getDate()}`)
            );
            console.log(result,"r");
            console.log(new Date(),"new");

            const isValidDate =await isValid(result);
            console.log(isValidDate,"V");
            if (isValidDate=== true){
                request.date=formatedDate
            }
            else{
                request.status(400);
                request.response("Invalid Due Date");
                return;
            }
        }
        catch (e){
                request.status(400);
                request.response("Invalid Due Date");
                return;

        request.todoId=todoId;
        request.search_q=search_q;

        next();
    }
}

const checkRequestsBody=(request,response,next) =>{
    const {id,todo,category,priority,status,dueDate}=request.body;
    const {todoId} =request.params;
    if (category !==undefined){
        categoryArray = ["WORK", "HOME", "LEARNING"];
        categoryIsInArray = categoryArray.includes(category);

        if (categoryIsInArray === true) {
        request.category = category;
        }
        else {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
        }
    }

    if (priority !== undefined) {
        priorityArray = ["HIGH", "MEDIUM", "LOW"];
        priorityIsInArray = priorityArray.includes(priority);
        if (priorityIsInArray === true) {
        request.priority = priority;
        }
        else {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
        }
    }

    if (status !== undefined) {
        statusArray = ["TO DO", "IN PROGRESS", "DONE"];
        statusIsInArray = statusArray.includes(status);
        if (statusIsInArray === true) {
        request.status = status;
        }
        else {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
        }
    }
    if (dueDate !== undefined){
        try{
            const myDate = new Date(dueDate);
            const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
            console.log(formatedDate);
            const result =toDate(new Date(formatedDate));
            const isValidDate =isValid(result);
            console.log(isValidDate);
            if (isValidDate === true){
                request.dueDate = formatedDate;
            }
            else{
                response.status(400);
                response.send("Invalid Due Date");
                return;
            } 
        }catch (e) {
                response.status(400);
                response.send("Invalid Due Date");
                return;
            }

    }
    request.todo =todo;
    request.id =id;
    request.todoId=todoId
    next()
};
app.get("/todos/", checkRequestsQueries, async (request, response) => {
  const {search_q="",category="",priority="",status=""} = request.query;
  console.log(status,search_q,priority,category);
  const getTodosQuery=`
  SELECT id,todo,priority,status,category,due_date AS dueDate
  FROM todo
  WHERE todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%'AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;
  const getTodo = await db.all(getTodosQuery);
  response.send(getTodo);
});
app.get("/todos/:todoId/", checkRequestsQueries, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT id,todo,priority,status,category,due_date AS dueDate 
    FROM todo WHERE id=${todoId};`;
  const todo1 = await db.get(getTodoQuery);
  response.send(todo1);
});

app.get("/agenda/",checkRequestsQueries, async (request, response) => {
  const { date } = request.query;
  console.log(date,"a");
  const d1 = format(new Date(2021 - 1 - 12), "yyyy-mm-dd");
  console.log(d1);
  console.log(date);
  const getDueDateQuery = `
    SELECT id,todo,priority,status,category,due_date AS dueDate 
    FROM todo WHERE due_date=${date};`;
  const todoArray = await db.all(getDueDateQuery);

  if(todoArray === undefined){
      response.status(400);
      response.send("Invalid Due Date");
  }
  else{
      response.send(todoArray);
  }
  
});

app.post("/todos/",checkRequestsBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const insertQuery = `
    INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  const createUser=await db.run(insertQuery);
  console.log(createUser);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/",checkRequestsQueries, async (request, response) => {
  const { todoId } = request.params;
  let text = null;
  let updateQuery = null;
  const { status, priority, todo, category, dueDate } = request.body;
  switch (true) {
    case status !== undefined:
      updateQuery = `
            UPDATE todo
            SET status='${status}'
            WHERE id=${todoId};`;
      text = "Status Updated";
    case priority !== undefined:
      updateQuery = `
            UPDATE todo
            SET priority='${priority}'
            WHERE id=${todoId};`;
      text = "Priority Updated";
    case todo !== undefined:
      updateQuery = `
            UPDATE todo
            SET todo='${todo}'
            WHERE id=${todoId};`;
      text = "Todo Updated";
    case category !== undefined:
      updateQuery = `
            UPDATE todo
            SET category='${category}'
            WHERE id=${todoId};`;
      text = "Category Updated";
    case dueDate !== undefined:
      updateQuery = `
            UPDATE todo
            SET due_date='${dueDate}'
            WHERE id=${todoId};`;
      text = "Due Date Updated";
  }
  await db.run(updateQuery);
  response.send(text);
});

app.delete("/todos/:todoId/",async(request,response)=>{
    const {todoId} =request.params;
    const deleteQuery=`
    DELETE FROM todo
    WHERE id=${todoId};`;
    await db.run(deleteQuery);
    response.send("Todo Deleted");

});
module.exports=app;
