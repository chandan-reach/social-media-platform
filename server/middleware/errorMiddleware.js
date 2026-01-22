//UNSUPPORTED ENDPOINTS

const notFound = (req, res, next) =>{
    const error = new Error(`Not found - ${req.originalUrl}`)
    res.status(400)
    next(error);

}

//ERROR MIDDLEWARE

const errorHandler = (error, req, next) =>{
    if(res.headSent){
        return next(error);
    }

    res.status(error.code || 500).json({message:error.message || "An unknown error occured."})
}

module.exports = {notFound, errorHandler}