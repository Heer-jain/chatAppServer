import express from 'express'
import { adminLogin, adminLogout, allChats, allMessages, allUsers, getadminData, getDashboardStats } from '../controllers/admin.js'
import { adminLoginValidator, validateHandler } from '../lib/validators.js'
import { adminOnly } from '../middlewares/auth.js'

const app = express.Router()

app.post('/verify', adminLoginValidator(), validateHandler, adminLogin)
app.get('/logout', adminLogout)

app.use(adminOnly)

app.get('/', getadminData)
app.get('/users', allUsers)
app.get('/chats', allChats)
app.get('/messages', allMessages)
app.get('/stats', getDashboardStats)

export default app