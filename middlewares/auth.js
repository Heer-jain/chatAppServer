import jwt from 'jsonwebtoken'
import { TryCatch } from '../middlewares/error.js'
import { ErrorHandler } from '../utils/utility.js'
import { adminSecretKey } from '../app.js'
import { TOKEN } from '../constants/config.js'
import { User } from '../models/user.js'

const isAuthenticted = TryCatch((req, res, next) => {
    const token = req.cookies[TOKEN]
    if(!token){
        return next(new ErrorHandler("Please login to access this route", 401))
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decodedData._id
    next()
})

const adminOnly = (req, res, next) => {
    const token = req.cookies["chatting-setting-admin-token"]
    if(!token){
        return next(new ErrorHandler("Only admin can access this route", 401))
    }
    const secretKey = jwt.verify(token, process.env.JWT_SECRET)
    const isMatched = adminSecretKey === secretKey
    if(!isMatched){
        return next(new ErrorHandler("Only admin can access this route", 401))
    }
    next()
}

const socketAuthenticator = async(err, socket, next) => {
    try {
        if(err) return next(err)
        const authToken = socket.request.cookies[TOKEN]
        if(!authToken) return next(new ErrorHandler("Please login to access this route", 401))
        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET)
        const user = await User.findById(decodedData._id)
        if(!user) return next(new ErrorHandler("Please login to access this route", 401))
        socket.user = user
        return next()
    } catch (error) {
        console.log(error)
        return next(new ErrorHandler("Please login to access this route", 401))
    }
}

export { isAuthenticted, adminOnly, socketAuthenticator }