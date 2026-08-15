import {asynchandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadoncloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asynchandler(async (req, res) => {
  //get user detail from frontend
  //validate user detail
  //check if user already exists
  //check for images especially avatar image bcuz that is required field in models
  //upload image to cloudinary
  //create user obj and push to db
  //db gave everything back to us so we can send it back to frontend
  //but we remove password and refresh token from the response before sending it back to frontend
   //send response back to frontend
 

   const{username, email, fullname, password} = req.body
   console.log("email", email)

   if([username, email, fullname, password].some((field)=> field?.trim() === "")){
    throw new ApiError(400, "All fields are required")
   }//Array mein se agar ANY ONE field callback ki condition ko true 
   //banati hai, .some() immediately true return karega.

  //for existed users
  const existedUser =await User.findOne({
    $or:[{email}, {username}]
  })

  if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
  }

  //req.body by default express na da diya ha req.files huma multer middletware run hona ka baad deta ha
  //img ka local path la raha ha
  const avatarLocalPath =req.files?.avatar?.[0]?.path;
  const coverImageLocalPath =req.files?.coverImage?.[0]?.path;
 //check if avatar image is provided and local path exists
 if(!avatarLocalPath){
  throw new ApiError(400, "Avatar image is required");
 }

 const avatar=await uploadoncloudinary(avatarLocalPath);
 const coverImage=await uploadoncloudinary(coverImageLocalPath);

// after upload to cloudinary again check if avatar image is uploaded successfully on cloudinary 
if(!avatar){
  throw new ApiError(500, "Error while uploading avatar image");
}

//create user obj and push to db
const user=     await User.create({
  fullname,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username:username.toLowerCase()
})

const createdUser = await User.findById(user._id).select("-password -refreshToken");//user ka password aur refresh token hum frontend ko nahi bhejna chahte is 
//liye select method ka use kia ha sara kuch aaya ga but jo select ma ha wo nhi aaya ga

if(!createdUser){
  throw new ApiError(500, "Error while creating user");
}

//send response back to frontend
res.status(201).json(
  new ApiResponse(201, "User registered successfully", createdUser)
)















});


export {registerUser};