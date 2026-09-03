import { asynchandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadoncloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";

//method for generating access token and referesh token
const generateAccessandRefereshtoken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const Accesstoken = user.generateAccessToken();
    const Refereshtoken = user.generateRefreshToken();
    user.refreshToken = Refereshtoken;
    await user.save({ validateBeforeSave: false }); //validation skip
    return { Accesstoken, Refereshtoken };
  } catch (error) {
    console.error('Token generation failed:', error);
    throw new ApiError(
      500,
      'Something went wrong while generating access and refresh tokens'
    );
  }
};

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

  const { username, email, fullname, password } = req.body;

  if (
    [username, email, fullname, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  } //Array mein se agar ANY ONE field callback ki condition ko true
  //banati hai, .some() immediately true return karega.

  //for existed users
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }

  //req.body by default express na da diya ha req.files huma multer middletware run hona ka baad deta ha
  //img ka local path la raha ha
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  //check if avatar image is provided and local path exists
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar image is required');
  }

  const avatar = await uploadoncloudinary(avatarLocalPath);
  const coverImage = await uploadoncloudinary(coverImageLocalPath);

  // after upload to cloudinary again check if avatar image is uploaded successfully on cloudinary
  if (!avatar) {
    throw new ApiError(500, 'Error while uploading avatar image');
  }

  //create user obj and push to db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  ); //user ka password aur refresh token hum frontend ko nahi bhejna chahte is
  //liye select method ka use kia ha sara kuch aaya ga but jo select ma ha wo nhi aaya ga

  if (!createdUser) {
    throw new ApiError(500, 'Error while creating user');
  }

  //send response back to frontend
  res
    .status(201)
    .json(new ApiResponse(201, 'User registered successfully', createdUser));
});
const loginUser = asynchandler(async (req, res) => {
  //fetching data
  const { username, email, password } = req.body;
  //validation
  if (!username && !email) {
    throw new ApiError(404, 'username or email is required');
  }
  //finding user with that username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  //checking user exist with the username and email that user passes

  if (!user) {
    throw new ApiError(404, 'user doesnot exist');
  }
  //password checking

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new ApiError(401, 'user enter wrong credentials');
  }

  //CALLING METHOD FOR REFERESH AND ACCESS TOKEN
  const { Accesstoken, Refereshtoken } = await generateAccessandRefereshtoken(
    user._id
  );
  //user upar wala us ma referresh abhi bhi empty ha tu updated doc fetch
  const loggedinUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  const options = {
    httpOnly: true,
    secure: true,
    path: '/',
  };
  return res
    .status(200)
    .cookie('AccessToken', Accesstoken, options)
    .cookie('RefereshToken', Refereshtoken, options)
    .json(
      new ApiResponse(200, 'user loggedin successfully', {
        user: loggedinUser,
        Accesstoken,
        Refereshtoken,
      })
    );
});
//putting auth middleware so that we have an access to user who request for logout
const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, //for new updated response
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
    path: '/',
  };
  return res
    .status(200)
    .clearCookie('AccessToken', options)
    .clearCookie('RefereshToken', options)
    .json(new ApiResponse(200, 'USER loggedout successfully', {}));
});

//refresh access token using refresh token
const refereshaccesstoken=asynchandler(async (req,res)=>{
  const incomingrefreshtoken=req.cookies?.Refereshtoken || req.body?.Refereshtoken;

 if(!incomingrefreshtoken){
  throw new ApiError(401,"unathorized request");
 }

const decodedtoken=jwt.verify(incomingrefreshtoken,process.env.REFRESH_TOKEN_SECRET)//encrypted and raw token searching
const user=await User.findById(decodedtoken?._id)
if(!user)
{
  throw new ApiError(401,"invalid refresh token")
}
  if(incomingrefreshtoken!==user?.refreshToken)
   {
  throw new ApiError(401,"refresh token is expired and invalid")
}

const options={
  httpOnly:true,
  secure:true
}
const {accesstoken,newrefreshtoken}=await generateAccessandRefereshtoken(user._id)

return res.status(200)
.cookie("accesstoken",accesstoken,options)
.cookie("refreshtoken",newrefreshtoken,options)
.json(new ApiResponse(200,"access token refreshed",{
  accesstoken,
  refreshToken:newrefreshtoken
}))

 
})



//change password controller

const changeUserpassword=asynchandler(async(req,res)=>{
     const [oldpass,newpass]=req.body
     
     const user=await User.findById(req.user?._id)

     const ispasswordcorrect=user.isPasswordCorrect(oldpass)

     if(!ispasswordcorrect)
     {
      throw new ApiError(400,"wrong password is entered")
     }


     user.password=newpass

     await user.save({validateBeforeSave:false})


     return res.status(200).json(new ApiResponse(200,"password changed succesfully",{}))



})

//getting current user
const getCurrentUser=asynchandler(async (req,res)=>{
   
  return res.status(200).json(new ApiResponse(200,"current user fetched successfully",req.user))

})
//updating text fields isko modify karna ha
const updateAccountdetails=asynchandler(async(req,res)=>{
  const [fullname,email]=req.body
  if(!fullname || !email){
    throw new ApiError(400,"all fields are required")
  }

  const user=await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        fullname,
        email
      }
    },
    {
      new:true
    }.select("-password")
  )
  return res.status(200)
  .json(new ApiResponse(200,"accounts details are updated successfully",user))

})
//update avatar file
const updateavatarfile=asynchandler(async(req,res)=>{
  const avatarlocalpath=req.file?.path
  if(!avatarlocalpath){
    throw new ApiError(400,"avatar file is missing")
  }
  const avatar=await uploadoncloudinary(avatarlocalpath)

  if(!avatar.url)
  {
     throw new ApiError(400,"error while uploading on cloudinary")
  }
const user=await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {
      new:true
    }.select("-password")
  )
  return res.status(200)
  .json(new ApiResponse(200,"avatar updated successfully",user))
  




})
//update coverimage file
const updatecoverimagefile=asynchandler(async(req,res)=>{
  const  coverImagelocalpath=req.file?.path
  if(! coverImagelocalpath){
    throw new ApiError(400," coverImage file is missing")
  }
  const coverImage=await uploadoncloudinary(coverImagelocalpath)

  if(!coverImage.url)
  {
     throw new ApiError(400,"error while uploading on cloudinary")
  }
const user=await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
      coverImage:coverImage.url
      }
    },
    {
      new:true
    }.select("-password")
  )
  return res.status(200)
  .json(new ApiResponse(200,"coverimage updated successfully",user))

})


const getuserchannelprofile=asynchandler(async(req,res)=>{
   const {username}=req.params
   if(!username.trim()){
    throw new ApiError(400,"username is required")
   }
//aggreagate return array

  const channel= await User.aggregate([
    {
    $match:{
      username:username?.toLowerCase()
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedto"
    }
  },
  {
    $addFields:{
      subscribersCount:{$size:"$subscribers"},
      subscribedtoCount:{$size:"$subscribedto"},
      isSubscribed:{
        $cond:{
              if:{ $in:[req.user?._id,"$subscribers.subscriber"] ,
                then:true,
                else:false
              }
        }
      }
    }
  },
  {
     $project:{
      fullname:1,
      username:1,
      avatar:1,
      subscribersCount:1,
      subscribedtoCount:1,
      isSubscribed:1,

  }
  }
   ])

   if(!channel?.length){
    throw new ApiError(404,"channel not found")
   }

   return res.status(200)
   .json(new ApiResponse(200,"channel profile fetched successfully",channel[0]))

})


const getuserwatchhistory=asynchandler(async(req,res)=>{
   
  const user=await User.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchhistory",
        foreignField:"_id",
        as:"watchhistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res.status(200)
  .json(new ApiResponse(200,"user watch history fetched successfully",user[0].watchhistory))

})





export { 
  registerUser, 
  loginUser, 
  logoutUser ,
  refereshaccesstoken,
  changeUserpassword,
  getCurrentUser,
updateAccountdetails,
updateavatarfile,
updatecoverimagefile,
getuserchannelprofile,
getuserwatchhistory
};
