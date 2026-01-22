const express =require("express")
const {connect} = require("mongoose")
require("dotenv").config()

const cors= require("cors")
const upload = require("express-fileupload")
const { errorHandler, notFound } = require("./middleware/errorMiddleware")
const routes = require('./routes/routes')
const { server , app } = require("./socket/socket")




app.use(express.urlencoded({exteded:true}))
app.use(express.json({exteded: true}))
app.use(cors({credential:true,origin:["http://localhost:5173"]}))
app.use(upload())

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

connect(process.env.MONGO_URL).then(server.listen(process.env.PORT, ()=>console.log
(`server started on port ${process.env.PORT}`))).catch(err => console.log(err))