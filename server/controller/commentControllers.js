const HttpError = require("../models/errorModel")
const CommentModel = require("../models/commentModel")
const PostModel = require("../models/postModel")
const userModel = require("../models/userModel")
const commentModel = require("../models/commentModel")

//...............create comment 

//post :api/comment/:postId
//protected
const createComment = async (req, res,next) =>{
    try {
        const {postId} = req.params;
        const {comment} = req.body;
        if(!comment){
            return next(new HttpError("Please write a comment", 422))
        }
        //get comment creator from DB
        const commentCreator = await userModel.findById(req.user.id)
        const newComment = await CommentModel.create({creator: {creatorId: req.user.id,
            creatorName: commentCreator?.fullName, creatorPhoto: commentCreator?.profilePhoto},comment, postId
        })
        await PostModel.findByIdAndUpdate(postId, {$push:{comments:newComment?._id}},{new: true})
        res.json(newComment)
    } catch (error) {
        return next(new HttpError)
    }
}



//...............GET POST    comment 

//  GET :api/comment/:postId
//protected
const getPostComment = async (req, res,next) =>{
    try {
        const {postId} = req.params;
          
        const comments = await PostModel.findById(postId).populate({path: "comments", options: {sort: {createdAt: -1}}})
        res.json(comments)
    } catch (error) {
        return next(new HttpError(error))
    }
}




//...............delete comment 

//DELETE :api/comment/:CommentId
//protected
const deleteComment = async (req, res,next) =>{
    try {
        const {commentId} = req.params;
        //get the comment from db
        const comment = await CommentModel.findById(commentId)
        const commentCreator = await userModel.findById(comment?.creator?.creatorId);
        //check if the the one performing the deletion
        if(commentCreator?._id != req.user.id){
            return next(new HttpError("You can only delete your comments , not other's", 403))
        }
        //remove the comment id from post comment array
        await PostModel.findByIdAndUpdate(comment?.postId, {$pull:{comments:commentId}},{new:true})
        const deletedComment = await CommentModel.findByIdAndDelete(commentId);

        res.json(deletedComment);
    } catch (error) {
        return next(new HttpError(error))
    }
}


module.exports = {createComment, getPostComment , deleteComment}