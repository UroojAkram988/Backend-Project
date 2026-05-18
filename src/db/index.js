import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";
  
const connectToDatabase=async ()=>{
    try{
    const connectinstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    console.log(`db is connected !! db host:${connectinstance.connection.host}`);
    }
    catch(error){
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}
export default connectToDatabase;








