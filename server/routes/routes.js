const router = require("express").Router()

const {registerUser, loginUser, getUser,getUsers, editUser, followUnfollowUser, 
    changeUserAvatar } = require('../controller/userController')

const { createPost, updatePost, deletePost, 
    getPost, getPosts, getUserPosts, createBookmark, 
    getuserBookmarks,
    getFollowingPost, likeDislikePosts} = require('../controller/postController')  
    
const {createComment, getPostComment , deleteComment} = require("../controller/commentControllers")   
const  {createMessage, getMessage , getConversations} = require("../controller/messageControllers") 
const authMiddleware = require("../middleware/authMiddleware")

//USER ROUTES
router.post('/users/register',registerUser)
router.post('/users/login', loginUser)
router.get('/users/bookmarks', authMiddleware,getuserBookmarks)
//brought this here  to avoid conflict with get user
router.get('/users/:id', authMiddleware,getUser)
router.get('/users', authMiddleware,getUsers)
router.patch('/users/:id',authMiddleware, editUser)
router.get('/users/:id/follow-unfollow',authMiddleware, followUnfollowUser)
router.post('/users/avatar', authMiddleware,  changeUserAvatar)
router.get('/users/:id/posts',authMiddleware, getUserPosts)

//POST ROUTES

router.post('/posts', authMiddleware,createPost)
router.get('/posts/following',authMiddleware, getFollowingPost)

router.get('/posts/:id',authMiddleware, getPost)
router.get('/posts', authMiddleware,getPosts)
router.patch('/posts/:id', authMiddleware,updatePost)
router.delete('/posts/:id',authMiddleware, deletePost)
router.get('/posts/:id/like',authMiddleware,likeDislikePosts)
router.get('/posts/:id/bookmark',authMiddleware, createBookmark)

//  COMMENT ROUTES
router.post('/comments/:postId',authMiddleware,createComment)
router.get('/comments/:postId',authMiddleware,getPostComment)
router.delete('/comments/:commentId',authMiddleware,deleteComment)

//MESSAGE ROUTES
router.post('/messages/:receiverId',authMiddleware,createMessage)
router.get('/messages/:receiverId', authMiddleware,getMessage)
router.get('/conversations',authMiddleware,getConversations)



module.exports = router;

