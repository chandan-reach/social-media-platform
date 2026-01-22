const HttpError = require('../models/errorModel')
const UserModel = require('../models/userModel')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const uuid = require("uuid").v4;
const fs = require("fs")
const path = require("path")
const cloudinary = require("../utils/cloudinary")

// ==========REGISTER USER
//POST :api/user/register
//UNPROTECTED
const registerUser = async (req, res, next) => {
    try{
       const {fullName, email, password, confirmPassword} = req.body;
       if(!fullName || !email || !password || !confirmPassword){
        return next(new HttpError("Fill in all Fields", 422))
       }
       //make email lowercase
       const lowerCaseEmail = email.toLowerCase();
       //check DB if email already exist 
       const emailExist = await UserModel.findOne({email:lowerCaseEmail})

       if(emailExist){
        return next(new HttpError("Email already exists",422))
       }

       //check if password and confirm password match
       if(password != confirmPassword){
        return next(new HttpError("passwords don't match",422))
       }

       //check password length
       if(password.length <6){
        return next(new HttpError("passwords must have atleast 6 character ",422))

       }
       //hash password 
       const salt = await bcrypt.genSalt(10);
       const hashPassword =await bcrypt.hash(password, salt);

       //add user to DB
       const newUser = await UserModel.create({fullName, email:lowerCaseEmail, password:hashPassword})
       res.json(newUser).status(201);
    }catch(error){
        return next(new HttpError(error))
    }
}

// ==========login USER
//POST :api/user/login
//UNPROTECTED
const loginUser = async (req, res, next) => {
    try{
       const {email, password} = req.body;
       if(!email || !password){
          return next(new HttpError("Fill both fields", 422))
       }

       //make email lowerCase
       const lowerCaseEmail = email.toLowerCase();
       //fetch user from db
       const user = await UserModel.findOne({email: lowerCaseEmail})
       if(!user){
        return next(new HttpError("Invalid Credential",422))
       }

       //const {uPassword, ...userInfo} = user;
       //compare password
       const comparedPass = await bcrypt.compare(password, user?.password);
       if(!comparedPass){
        return next(new HttpError("Invalid Credential", 422))
       }
       const token = await jwt.sign({id: user?._id}, process.env.JWT_SECRET, {expiresIn:"1h"})

       res.json({token, id:user?._id ,profilePhoto:user?.profilePhoto}).status(200)
       //res.json({token, id:user?._id, ...userInfo}).status(200)


    }catch(error){
        return next(new HttpError(error))
    }
}

// ==========GET USER
//GET :api/user/:id
//PROTECTED
const getUser = async (req, res, next) => {
    try{
        const {id} = req.params;
        const user = await UserModel.findById(id)
        if(!user){
            return next(new HttpError("User not found", 404))
        }
        res.json(user).status(200)
    }catch(error){
        return next(new HttpError(error))
    }
}


// ==========GET USER
//GET :api/users
//PROTECTED
const getUsers = async (req, res, next) => {
    try{
        const users = await UserModel.find().limit(10).sort({createdAt: -1})
        res.json(users);
    }catch(error){
        return next(new HttpError(error))
    }
}





// ==========EDIT USER
//PATCH :api/users/edit
//PROTECTED
const editUser = async (req, res, next) => {
    try{
        const {fullName , bio} = req.body;
        const editedUser = await UserModel.findByIdAndUpdate(req.user.id, {fullName, bio}, {new: true})
        res.json(editedUser).status(200);
    }catch(error){
        return next(new HttpError(error))
    }
}



// ==========FOLLOW/UNFOLLOW USER
//GET:api/users/:id/follow-unfollow
//PROTECTED
const followUnfollowUser = async (req, res, next) => {
    try{
        const userToFollowId = req.params.id;
        if(req.user.id  == userToFollowId){
            return next(new HttpError("You can't follow/unfollow yourself",422))

        }
        const currentUser = await UserModel.findById(req.user.id);
        const isFollowing = currentUser?.following?.includes(userToFollowId);
        //follow if not following , else unfollow if already following
        if(!isFollowing){
            const updatedUser = await UserModel.findByIdAndUpdate(userToFollowId, {$push: {followers: req.user.id}}, {new: true})
            await UserModel.findByIdAndUpdate(req.user.id, {$push: {following: userToFollowId}}, {new: true})
            res.json(updatedUser).status(200);
        }else{
            const updatedUser = await UserModel.findByIdAndUpdate(userToFollowId, {$pull: {followers: req.user.id}}, {new: true})
            await UserModel.findByIdAndUpdate(req.user.id, {$pull: {following: userToFollowId}}, {new: true})
            res.json(updatedUser).status(200); 
        }
    }catch(error){
        return next(new HttpError(error))
    }

}


// ==========CHANGE USER PROFILE PHOTO
//POST:api/users/avatar
//PROTECTED
const changeUserAvatar = async (req, res, next) => {
    try{
        if(!req.files.avatar){
            return next(new HttpError("Please provide a file",422))
        }
        const {avatar} = req.files;
       //check file size
       if(avatar.size > 500000){
        return next(new HttpError("File size is too large, should be less than 500kb",422))
       }

       let fileName = avatar.name;
       let splittedFilename = fileName.split(".")
       let newFilename = splittedFilename[0] + uuid() + "."+ splittedFilename[splittedFilename.length - 1]
       avatar.mv(path.join(__dirname, "..","uploads", newFilename), async (err) =>{
        if(err){
            return next(new HttpError(err))
       }
    // store image on the cloudinary
    const result = await cloudinary.uploader.upload(path.join(__dirname, "..", "uploads", newFilename),
{resource_type: "image"});

     if(!result.secure_url){
        return next(new HttpError("Failed to upload image",422))
     }
     const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, {profilePhoto: result?.secure_url},{new: true})
     res.json(updatedUser).status(200);
    })
    }catch(error){
        return next(new HttpError(error))
    }
}


module.exports = {registerUser, loginUser, getUser,getUsers, editUser, followUnfollowUser, 
    changeUserAvatar
 }