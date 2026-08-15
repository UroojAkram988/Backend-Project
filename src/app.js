import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
 const app=express();
 app.use(cors(
    {
        origin:process.env.CROSS_ORIGIN,
        crdentials :true//cookies ke liya request ka sath behj sakka wesa browser aesa data ko block karta ha request ka sath behjne ka lia
    }
) );
    app.use(express.json({limit:"16kb"}))//express.json() middleware ko use karna zaruri ha taki hum json data ko request body se access kar saken and express json ko accept kar paya
    app.use(express.urlencoded({extended:true}))//urlencoded data ko accept karne ke liye
    app.use(express.static("public"))//static filesko serve karne ke liye
    //library setup import kafi nhi ha confing it
  // routes import their for seggregation of code
  import userRouter from "./routes/user.routes.js";

 app.use("/api/v1/users", userRouter);

 export {app}; 