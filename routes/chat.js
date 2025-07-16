import express from 'express'
import { isAuthenticted } from '../middlewares/auth.js'
import { addMembers, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, sendAttachments, getChatDetails, renameGroup, deleteChat, getMessages } from '../controllers/chat.js'
import { attachmentMulter } from '../middlewares/multer.js'
import { addMemberValidator, chatIdValidator, newGroupValidator, removeMemberValidator, renameGroupValidator, sendAttachmentsValidator, validateHandler } from '../lib/validators.js'

const app = express.Router()

app.use(isAuthenticted)

app.post('/new', newGroupValidator(), validateHandler, newGroupChat)
app.get('/me', getMyChats)
app.get('/me/groups', getMyGroups)
app.put('/addMembers', addMemberValidator(), validateHandler, addMembers)
app.put('/removeMember',removeMemberValidator(), validateHandler, removeMember)
app.delete('/leave/:id', chatIdValidator(), validateHandler, leaveGroup)
app.post('/message', attachmentMulter, sendAttachmentsValidator(), validateHandler, sendAttachments)
app.get('/message/:id', chatIdValidator(), validateHandler, getMessages)
app.route('/:id').get(chatIdValidator(), validateHandler, getChatDetails).put(renameGroupValidator(), validateHandler, renameGroup).delete(chatIdValidator(), validateHandler, deleteChat)

export default app 