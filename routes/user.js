import express from 'express'
import { acceptRequest, getMyFriends, getMyProfile, getNotifications, login, logout, newUser, searchUser, sendRequest } from '../controllers/user.js'
import { singleAvatar } from '../middlewares/multer.js'
import { isAuthenticted } from '../middlewares/auth.js'
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from '../lib/validators.js'

const app = express.Router()

app.post("/new", singleAvatar, registerValidator(), validateHandler, newUser)
app.post("/login",loginValidator(), validateHandler, login)

app.use(isAuthenticted)

app.get('/me',  getMyProfile)
app.get('/logout',  logout)
app.get('/search', searchUser)
app.put('/sendrequest', sendRequestValidator(), validateHandler, sendRequest)
app.put('/acceptrequest', acceptRequestValidator(), validateHandler, acceptRequest)
app.get('/notifications', getNotifications)
app.get('/friends', getMyFriends)

export default app