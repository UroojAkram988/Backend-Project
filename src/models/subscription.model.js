import mongoose,{Schema} from "mongoose";
import { User } from "./user.model";

const subscriptionschema=new Schema({
    subscriber:{                           //jo subscribe kar raha ha
        type:Schema.Types.ObjectId,
        ref:User
    },
    channel:{
         type:Schema.Types.ObjectId,
        ref:User
    }
    
},
{
    timestamps:true
} 
)
export const Subscription=mongoose.model(Subscription,subscriptionschema)