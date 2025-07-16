import { ALERT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js"
import { getOtherMember } from "../lib/helper.js"
import { TryCatch } from "../middlewares/error.js"
import { Chat } from '../models/chat.js'
import { Message } from "../models/message.js"
import { User } from "../models/user.js"
import { deleteFilesFromClodinary, emitEvent, uploadFilesToCloudinary } from "../utils/features.js"
import { ErrorHandler } from "../utils/utility.js"

const newGroupChat = TryCatch(async(req, res, next) => {
    const { name, members } = req.body

    const allMembers = [...members, req.user]

    await Chat.create({
        name,
        creator: req.user,
        groupChat: true,
        members: allMembers 
    })

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`)
    emitEvent(req, REFETCH_CHATS, members)

    return res.status(201).json({
        success: true,
        message: "Group created successfully"
    })
})

const getMyChats = TryCatch(async(req, res, next) => {

    const chats = await Chat.find({members: req.user}).populate("members", "name avatar")

    const transformedChats = chats.map(({_id, name, members, groupChat}) => {
        const otherMember = getOtherMember(members, req.user)
         
        return{
            _id, 
            groupChat,
            avatar: groupChat ? members.slice(0, 3).map(({avatar}) => avatar.url) : [otherMember.avatar.url],
            name: groupChat ? name : otherMember.name,
            members: members.reduce((prev, curr) => {
                if(curr._id.toString() !== req.user.toString()){
                    prev.push(curr._id)
                }
                return prev
            }, [])
        }
    })

    return res.status(200).json({
        success: true,
        message: transformedChats
    })
})

const getMyGroups = TryCatch(async(req, res, next) => {
    const chats = await Chat.find({members: req.user, groupChat: true, creator: req.user}).populate("members", "name avatar")

    const groups = chats.map(({members, _id, groupChat, name}) => ({
        _id,
        name,
        groupChat,
        avatar: members.slice(0, 3).map(({avatar}) => avatar.url)
    }))

    return res.status(200).json({
        success: true,
        message: groups
    })
})

const addMembers = TryCatch(async(req, res, next) => {

    const { chatId, members } = req.body

    const chat = await Chat.findById(chatId)

    if(!chat) return next(new ErrorHandler("Chat not found", 404))

    if(!chat.groupChat) return next(new ErrorHandler("Not a group chat", 400))

    if(chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler("You are not allowed to add members in this group", 403))

    const allNewMembersPromise = members.map((i) => User.findById(i, "name"))

    const allNewMembers = await Promise.all(allNewMembersPromise)

    const uniqueMembers = allNewMembers.filter((i) => !chat.members.includes(i._id.toString())).map((i) => i._id)

    chat.members.push(...uniqueMembers)

    if(chat.members.length > 100) return next(new ErrorHandler("Group members limit reached", 400))

    await chat.save()

    const allUserName = allNewMembers.map((i) => i.name).join(",")

    emitEvent(req, ALERT, chat.members, `${allUserName} has been added in the group`)

    emitEvent(req, REFETCH_CHATS, chat.members)

    return res.status(200).json({
        success: true,
        message: "Members added successfully"
    })
})

const removeMember = TryCatch(async(req, res, next) => {
    const { userId, chatId } = req.body

    const [chat, userThatWillBeRemoved] = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId, "name"),
    ])

    if(!chat) return next(new ErrorHandler("Chat not found", 404))

    if(!chat.groupChat) return next(new ErrorHandler("Not a group chat", 400))

    if(chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler("You are not allowed to remove members in this group", 403))

    if(chat.members.length <= 3) return next(new ErrorHandler("Group must have 3 members", 400))

    const allChatMembers = chat.members.map((i) => i.toString())

    chat.members = chat.members.filter((member) => member.toString() !== userId.toString())

    await chat.save()

    emitEvent(req, ALERT, chat.members, {message: `${userThatWillBeRemoved.name} has been removed in the group`, chatId})

    emitEvent(req, REFETCH_CHATS, allChatMembers)

    return res.status(200).json({
        success: true,
        message: "Member removed successfully"
    })
})

const leaveGroup = TryCatch(async(req, res, next) => {
    const chatId = req.params.id

    const chat = await Chat.findById(chatId)

    if(!chat) return next(new ErrorHandler("Group not found", 404))

    if(!chat.groupChat) return next(new ErrorHandler("Not a group chat", 400))

    const remainingMember = chat.members.filter((member) => member.toString() !== req.user.toString())

    if(remainingMember.legth < 3) return next(new ErrorHandler("Group must have 3 members"), 403)

    if(chat.creator.toString() === req.user.toString()){
        const newCreator = remainingMember[0]
        chat.creator = newCreator
    }

    chat.members = remainingMember

    const [user] = await Promise.all([User.findById(req.user, "name"), chat.save()])

    emitEvent(req, ALERT, chat.members,{chatId, message: `User ${user.name} left the group`})

    return res.status(200).json({
        success: true,
        message: "Left the group"
    })
})

const sendAttachments = TryCatch(async (req, res, next) => {
    const { chatId } = req.body;
  
    const files = req.files || [];

    if (files.length < 1)
      return next(new ErrorHandler("Please Upload Attachments", 400));
  
    if (files.length > 5)
      return next(new ErrorHandler("Files Can't be more than 5", 400));
  
    const [chat, me] = await Promise.all([
      Chat.findById(chatId),
      User.findById(req.user, "name"),
    ]);
  
    if (!chat) return next(new ErrorHandler("Chat not found", 404));
  
    if (files.length < 1)
      return next(new ErrorHandler("Please provide attachments", 400));
  
    const attachment = await uploadFilesToCloudinary(files);
  
    const messageForDB = {
      content: "",
      attachment,
      sender: req.user,
      chat: chatId,
    };
  
    const messageForRealTime = {
      ...messageForDB,
      sender: {
        _id: me._id,
        name: me.name,
      },
    };
  
    const message = await Message.create(messageForDB);
  
    emitEvent(req, NEW_MESSAGE, chat.members, {
      message: messageForRealTime,
      chatId,
    });
  
    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });
  
    return res.status(200).json({
      success: true,
      message,
    });
  });

const getMessages = TryCatch(async(req, res, next) => {
  const chatId = req.params.id
  const { page = 1} = req.query
  
  const limit = 20
  const skip = (page - 1) * limit

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.members.includes(req.user.toString()))
    return next(
      new ErrorHandler("You are not allowed to access this chat", 403)
    );

  const [ messages, totalMessageCount ] = await Promise.all([
    Message.find({chat: chatId})
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)
    .populate("sender", "name")
    .lean(),
    Message.countDocuments({chat: chatId})
    ])

    const totalPages = Math.ceil(totalMessageCount / limit)

    return res.status(200).json({
        success: true,
        message: messages.reverse(), totalPages
    })
})

const getChatDetails = TryCatch(async(req, res, next) => {
    if(req.query.populate === "true"){
        const chat = await Chat.findById(req.params.id).populate("members", "name avatar").lean()

        if(!chat) return next(new ErrorHandler("Chat not found", 404))

        chat.members = chat.members.map(({_id, name, avatar}) => ({
            _id,
            name,
            avatar: avatar.url
        }))

        return res.status(200).json({
            success: true,
            chat
        })
    }
    else{
        const chat = await Chat.findById(req.params.id)

        if(!chat) return next(new ErrorHandler("Chat not found", 404))

        return res.status(200).json({
            success: true,
            chat
        })
    }
})

const renameGroup = TryCatch(async(req, res, next) => {
    const chatId = req.params.id
    const { name } = req.body

    const chat = await Chat.findById(chatId) 

    if(!chat) return next(new ErrorHandler("Chat not gound", 404))

    if(!chat.groupChat) return next(new ErrorHandler("This is not group chat", 400))

    if(chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler("You are not allowed to rename group", 403))

    chat.name = name
    chat.save()

    emitEvent(req, REFETCH_CHATS, chat.members)  

    return res.status(200).json({
        success: true,
        message: "Group renamed successfully"
    })
})

const deleteChat = TryCatch(async(req, res, next) => {
    const chatId = req.params.id

    const chat = await Chat.findById(chatId)

    if(!chat) return next(new ErrorHandler("Chat not found", 404))

    if(chat.groupChat && chat.creator.toString() !== req.user.toString()) return next(new ErrorHandler("You are not allowed to delete the chat", 403))

    if(!chat.groupChat && !chat.members.includes(req.user.toString())) return next(new ErrorHandler("You are not allowed to delete the chat", 403))

    const messageWithAttachments = await Message.find({
        chat: chatId, 
        attachments: {$exists: true, $ne: []}
    })

    const public_ids = []

    messageWithAttachments.forEach(({attachments}) => {
        attachments.forEach(({public_id}) => public_ids.push(public_id))
    })

    await Promise.all([
        deleteFilesFromClodinary(public_ids),
        chat.deleteOne(),
        Message.deleteMany({chat: chatId})
    ])

    emitEvent(req, REFETCH_CHATS, chat.members)

    return res.status(200).json({
        success: true,
        message: "Chat deleted successfully"
    })
})


export { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMember, renameGroup, sendAttachments }
