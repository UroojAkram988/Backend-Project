import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //sorted b tree data structure
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchhistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
refreshToken
    : {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
console.log("NEW USER MODEL LOADED");
/*for password hashing we are using pre save hook of mongoose so that before saving the user document in database we can hash the password and then save it in database*/
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

/*is sa huma controll mila ga unnecessary comparison sa hum bach jaya ga yeh method banaya ha is liye kio k password ko compare karna ha login ke time pe user ka password jo input kia ha aur database me jo password ha usko compare karna ha agar match ho gya to user ko login karna ha warna error throw karna ha*/
userSchema.methods.isPasswordCorrect = async function (password) {
  /*yeh check karna ha methode banana kio zarori ha is ka ilawa yeh model ka part nhi ban sakta*/
  return await bcrypt.compare(password, this.password);
};
     /*generate access token and refresh token for user authentication and authorization*/
userSchema.methods.generateAccessToken = function () {
       return   jwt.sign({
            _id:this._id,
            username:this.username,
            email:this.email,
            fullname:this.fullname,
          }
        ,process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
          })
}
userSchema.methods.generateRefreshToken = function () {
       return   jwt.sign({
            _id:this._id,
          }
        ,process.env.REFRESH_TOKEN_SECRET,{
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
          })
}

export const User = mongoose.model('User', userSchema);
