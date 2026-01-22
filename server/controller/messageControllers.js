const HttpError = require("../models/errorModel")
const ConversationModel = require ("../models/ConversationModel")
const MessageModel = require("../models/messageModel");
const { io } = require("../socket/socket");


//==================CREATE MESSAGE
//POST : api/messages/:received
//PROTECTED
const createMessage = async (req, res, next) =>{
    try {
        const {receiverId} = req.params;
        const {messageBody} = req.body;
        //check if there's already a conversation between current user and receiver
        let conversation = await ConversationModel.findOne({participants: {$all: [req.user.id, receiverId]}})
        //create a new conversation if none was found
        if(!conversation){
            conversation = await ConversationModel.create({participants: [req.user.id, receiverId], lastMessage: {text: messageBody, senderId: req.user.id}})
        }
        //create a new message
        const newMessage = await MessageModel.create({conversationId: conversation._id,
            senderId: req.user.id , text: messageBody})
        await conversation.updateOne({lastMesssage:{text:messageBody, senderId: req.user.id}})

        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }
        
        res.json(newMessage)
    } catch (error) {
        return next(new HttpError)
    }
}



//==================GET MESSAGE
//GET : api/messages/:received
//PROTECTED
const getMessage = async (req, res, next) =>{
    try {
        const {receiverId} = req.params;
        const conversation = await ConversationModel.findOne({participants: {$all: [req.user.id, receiverId]}})
        if(!conversation){
            return next(new HttpError("you have no conversation with this user", 404))
        }
        const messages = await MessageModel.find({conversationId: conversation._id}).sort({createdAt: -1})
        res.json(messages)
    } catch (error) {
        return next(new HttpError(error))
    }
}




//==================CGET CONVERSATIONS
//GET : api/conversation
//PROTECTED
const getConversations = async (req, res, next) =>{
    try {
        let conversations = await ConversationModel.find({participants: req.user.id}).populate({path: "participants",
             select: "fullName profilePhoto"}).sort({createAt: -1});
        //remove logged in user from the participants array
        conversations.forEach((conversation) =>{
            conversation.participants = conversation.participants.filter(
                (participant) => participant._id.toString() !== req.user.id.toString()
            );


        });
        res.json(conversations)    
    } catch (error) {
        return next(new HttpError(error))
    }
}



module.exports = {createMessage, getMessage , getConversations}