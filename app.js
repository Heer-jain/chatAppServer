import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { errorMiddleware } from './middlewares/error.js'
import chat from './routes/chat.js'
import user from './routes/user.js'
import admin from './routes/admin.js'
import { connectDB } from './utils/features.js'
import { Server } from 'socket.io'
import { createServer } from "http";
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from './constants/events.js'
import { v4 as uuid } from 'uuid'
import { getSockets } from './lib/helper.js'
import { Message } from './models/message.js'
import {v2 as cloudinary} from 'cloudinary'
import { corsOption } from './constants/config.js'
import { socketAuthenticator } from './middlewares/auth.js'

dotenv.config({
    path: "./.env"
})

const app = express()
const server = createServer(app)
const io = new Server(server, {cors: corsOption})
app.set("io", io)
app.use(cors(corsOption))
app.use(express.json())
app.use(cookieParser())


const PORT = process.env.PORT
const adminSecretKey = process.env.ADMIN_SECRET_KEY
const envMode = process.env.ENV_MODE || "PRODUCTION"

const userSocketIDs = new Map()
const onlineUsers = new Set()

connectDB(process.env.MONGO_URI)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

app.use("/user", user)
app.use("/chat", chat)
app.use("/admin", admin)

app.get('/', (req, res) => {
    res.send("Hello World")
})

io.use((socket, next) => {
    cookieParser()(
        socket.request,
        socket.request.res,
        async(err) => await socketAuthenticator(err, socket, next))
})

io.on("connection", (socket) => {
    const user = socket.user
    userSocketIDs.set(user._id.toString(), socket.id)

    socket.on(NEW_MESSAGE, async({chatId, members, message})=>{

        const messageForRealTime = {
            content: message,
            _id: uuid(),
            sender:{
                _id: user._id,
                name: user.name
            },
            chat: chatId,
            createdAt: new Date().toISOString()
        }

        const messageForDB = {
            chat: chatId,
            content: message,
            sender: user._id
        }

        const membersSocket = getSockets(members)
        io.to(membersSocket).emit(NEW_MESSAGE, {
            chatId, message: messageForRealTime
        })
        io.to(membersSocket).emit(NEW_MESSAGE_ALERT, {chatId})

        try {
            await Message.create(messageForDB)   
        } catch (error) {
            throw new Error(error)
        }
    })

    socket.on(START_TYPING, ({members, chatId}) => {
        const membersSocket = getSockets(members)
        socket.to(membersSocket).emit(START_TYPING, {chatId})
    })

    socket.on(STOP_TYPING, ({members, chatId}) => {
        const membersSocket = getSockets(members)
        socket.to(membersSocket).emit(STOP_TYPING, {chatId})
    })

    socket.on(CHAT_JOINED, ({userId, members}) => {
        onlineUsers.add(userId.toString())
        const membersSocket = getSockets(members)
        io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers))
    })

    socket.on(CHAT_LEAVED, ({userId, members}) => {
        onlineUsers.delete(userId.toString())
        const membersSocket = getSockets(members)
        io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers))
    })

    socket.on("disconnect", () =>{
        userSocketIDs.delete(user._id.toString())
        onlineUsers.delete(user._id.toString())
        socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers))
    })
})

app.use(errorMiddleware)

server.listen(PORT, () => {
    console.log(`App is running on PORT ${PORT} in ${envMode} Mode`)
})

export { adminSecretKey, envMode, userSocketIDs }