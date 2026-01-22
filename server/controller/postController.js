const HttpError = require('../models/errorModel')
const PostModel = require('../models/postModel')
const UserModel = require('../models/userModel')

const {v4: uuid} = require('uuid')
const cloudinary = require('../utils/cloudinary')
const fs = require('fs')
const path = require('path')


//...............CREATE POST 

//POST :api/post 
//protected
const createPost = async (req, res,next) =>{
    try {
        const {body} = req.body;
        if(!body){
            return next(new HttpError('Please provide a post body',422))
        }
        if(!req.files.image){
            return next(new HttpError('Please choose an image',422))
        }else{
            const {image} = req.files;
            //image should be less then 1MB
            if(image.size > 1000000){
                return next(new HttpError('Image should be less than 1MB',422))
            }
            //image should rename
            let fileName = image.name;
            fileName = fileName.split(".");
            fileName = fileName[0] + uuid() + "." + fileName[fileName.length - 1];
            await image.mv(path.join(__dirname, '..', 'uploads',fileName),async (err) =>{
                if(err){
                    return next(new HttpError(err))
                }
                //store image to cloudinary
                const result = await cloudinary.uploader.upload(path.join(__dirname, '..', 'uploads',fileName),{resouce_type:"image"})
                if(!result.secure_url){
                    return next(new HttpError('Failed to upload image to cloudinary',500))
                }
               //save post to database
               const newPost = await PostModel.create({creator: req.user.id,body, image:result.secure_url})
               await UserModel.findByIdAndUpdate(newPost?.creator,{$push:{posts:newPost?._id}})
              res.json(newPost)
            })
        }
    } catch (error) {
        return next(new HttpError(error))
}
}





//...............GET POST 

//GET:api/posts/:id
//protected
const getPost = async (req, res,next) =>{
    try {
       const {id} = req.params;
    
    const post = await PostModel.findById(id).populate("creator").populate({path:"comments", options: {sort: {createdAt: -1}}})
       res.json(post)
    } catch (error) {
        return next(new HttpError(error))
}
}





//..............    GET POSTS

//GET:api/postS
//protected
const getPosts = async (req, res,next) =>{
    try {
        const posts = await PostModel.find().sort({creatAt: -1})
        res.json(posts)
    } catch (error) {
        return next(new HttpError(error))
}
}






//..............UPDATE POST 

//PATCH :api/posts/:id
//protected
const  updatePost = async (req, res,next) =>{
    try {
        const PostId = req.params.id;
        const {body} = req.body;
        //get post from database
        const post = await PostModel.findById(PostId)
        //check if creator of the post is the looged In  user
        if(post?.creator != req.user.id){
            return next(new HttpError("You are not the creator of this post",403))
        }
        const updatedPost = await PostModel.findByIdAndUpdate(PostId, {body}, {new: true})
        res.json(updatedPost).status(200)

    } catch (error) {
        return next(new HttpError(error))
}
}




//..............DELETE POST 

//DELETE :api/posts/:id 
//protected
const deletePost = async (req, res,next) =>{
    try {
        const PostId = req.params.id;
        //get post from database
        const post = await PostModel.findById(PostId)
        //check if creator of the post is the looged In  user
        if(post?.creator != req.user.id){
            return next(new HttpError("You are not the creator of this post",403))
        }
        //delete post from database
        const deletedPost = await PostModel.findByIdAndDelete(PostId);
        await UserModel.findByIdAndUpdate(post?.creator, {posts:post?._id})
        res.json(deletedPost)

    } catch (error) {
        return next(new HttpError(error))
}
}




//...............GET FOLLOWINGS POST 

//get:api/posts/following
//protected
const getFollowingPost = async (req, res,next) =>{
    try {
        const user = await UserModel.findById(req.user.id);
        const posts = await PostModel.find({creator: {$in: user?.following}})
        res.json(posts)
       

    } catch (error) {
        return next(new HttpError(error))
}
}



//...............likean dislike POST 

//get:api/posts/like
//protected
const likeDislikePosts = async (req, res,next) =>{
    try {
       const {id} = req.params;
       const post = await PostModel.findById(id)
       //check if the logged in user already liked post 
       let updatedPost;
       if(post?.likes.includes(req.user.id)){
        updatedPost = await PostModel.findByIdAndUpdate(id, { $pull: { likes: req.user.id}},{new: true})
       }else{
        updatedPost = await PostModel.findByIdAndUpdate(id, { $push: { likes: req.user.id}},{new: true})

       }
       res.json(updatedPost)

    } catch (error) {
        return next(new HttpError(error))
}
}




//...............GET USER POST 

//get:api/users/:id/post
//protected
const getUserPosts = async (req, res,next) =>{
    try {
        const userId = req.params.id;
        const posts = await UserModel.findById(userId).populate({path: "posts",options: {sort:{createAt: -1}}})
        res.json(posts)
    } catch (error) {
        return next(new HttpError(error))
}
}




//............... CREATE BOOKMARK POST 

//post:api/posts/:id/bookmark
//protected
const createBookmark = async (req, res,next) =>{
    try {
        const {id} = req.params;
        //get user and check if post if already bookmarked. if so then remove post 
        //otherwise add post to user bookmarks
        const user = await UserModel.findById(req.user.id);
        const postsBookmarked =user?.bookmarks?.includes(id)
        if(postsBookmarked){
            const userBookmarks = await UserModel.findByIdAndUpdate(req.user.id, {$pull:{bookmarks: id}},
                {new: true})
            res.json(userBookmarks)
        }else{
           const userBookmarks = await UserModel.findByIdAndUpdate(req.user.id, {$push:{bookmarks: id}},
                {new: true})
            res.json(userBookmarks) 
        }


    } catch (error) {
        return next(new HttpError(error))
}
}





//...............GET BOOKMARK POST 

//get:api/bookmarks
//protected
const getuserBookmarks = async (req, res,next) =>{
    try {
        const userBookmarks = await UserModel.findById(req.user.id).populate({path: "bookmarks", options:{sort:{createdAt: -1}}})
        res.json(userBookmarks)

    } catch (error) {
        return next(new HttpError(error))
}
}



module.exports ={ createPost, updatePost, deletePost, 
     getPost, getPosts, getUserPosts, createBookmark, 
     getuserBookmarks,
     getFollowingPost, likeDislikePosts}
