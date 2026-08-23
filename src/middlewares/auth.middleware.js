import { asynchandler } from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


export const verifyJWT=asynchandler(async (req,_,next)=>{
   try{
           const token=req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","")
    
    if(!token){
    throw new ApiError(401,"Access token is required")
    }

   const decodedtoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
   const user=await User.findById(decodedtoken?._id) 
   if(!user)
   {
    throw new ApiError(401,"invalid access token!!!!!!!")
   }
      
   req.user=user
   next()

   }
   catch(error)
   
   
   {
      throw new ApiError(401, error?.message || "Invalid access token");
   }
   
})