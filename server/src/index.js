import dotenv from "dotenv"
import connectDB from "./config/db.js"
import { app } from "./app.js"

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERRR: ",error);
        throw error
    })
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is running at port : ${process.env.PORT || 8000}`);
        console.log(`http://localhost:${process.env.PORT || 8000}`);
        
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed !!",err);
})