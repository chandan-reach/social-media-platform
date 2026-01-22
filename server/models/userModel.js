const {Schema , model} = require("mongoose")


const userSchema = new Schema({
    fullName:{type:String, required:true},
    email:{type:String, required:true},
    password: {type:String,required:true},
    profilePhoto:{type: String,default:"https://res.cloudinary.com/dlenuill2/image/upload/v1746034034/xorkea8rjmwje9qx2nfs.png"},
    bio:{type: String,default:"No bio yet"},
    followers:[{type:Schema.Types.ObjectId, ref: "User"}],
    following:[{type:Schema.Types.ObjectId, ref: "User"}],
    bookmarks:[{type:Schema.Types.ObjectId, ref: "Post"}],
    post:[{type:Schema.Types.ObjectId, ref: "Post"}],
    
},{timestamps:true})

module.exports = model("User", userSchema)