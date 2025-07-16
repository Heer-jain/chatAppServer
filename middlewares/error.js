import { envMode } from "../app.js"

const errorMiddleware = (err, req, res, next) => {
    err.message ||= "Internal server error"
    err.statusCode ||= 500
    // console.log(err)

    if(err.code === 11000){
        err.message = `Duplicate field - ${Object.keys(err.keyPattern).join(", ")}`
        err.statusCode = 400
    }

    if(err.name === "CastError"){
        err.message = `Invalid format of ${err.path}`
        err.statusCode = 400 
    }

    const respone = {
        success: false,
        message: err.message
    }

    if(envMode === "DEVELOPMENT"){
        respone.error = err
    }

    return res.status(err.statusCode).json(respone)
}

const TryCatch = (passedFunction) => async(req, res, next) => {
    try {
        await passedFunction(req, res, next )
    } catch (error) {
        console.log(error)
        next(error)
    }
}

export { errorMiddleware, TryCatch }