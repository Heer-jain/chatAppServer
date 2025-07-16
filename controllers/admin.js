import jwt from "jsonwebtoken";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { ErrorHandler } from "../utils/utility.js";
import { cookieOption } from '../utils/features.js'
import { adminSecretKey } from "../app.js";

const adminLogin = TryCatch(async(req, res, next) => {
    const { secretKey } = req.body

    const isMatched = adminSecretKey === secretKey

    if (!isMatched) return next(new ErrorHandler("Invalid Secret Key", 401))

    const token = jwt.sign(secretKey, process.env.JWT_SECRET)

    res.status(200)
    .cookie("chatting-setting-admin-token", token, {...cookieOption, maxAge: 1000 * 60 * 15})
    .json({
        success: true,
        message: "Authenticated Successfully, Welcome BOSS!"
    })
})

const getadminData = TryCatch(async(req, res, next) => {
    return res.status(200).json({
        admin: true 
    })
})

const allUsers = TryCatch(async(req, res, next) => {
    const users = await User.find({})

    const transformedUser = await Promise.all(users.map(async({name, avatar, email, _id}) => {
        const [groups, friends] = await Promise.all([
            Chat.countDocuments({groupChat: true, members: _id}),
            Chat.countDocuments({groupChat: false, members: _id}),
        ])

        return {
            name, _id, groups, friends, avatar: avatar.url, email
        }
    }))

    return res.status(200).json({
        success: true,
        transformedUser
    })
})

const allChats = TryCatch(async(req, res, next) => {
    const chats = await Chat.find({})
    .populate("members", "name, avatar")
    .populate("creator", "name, avatar")

    const transformedChats = await Promise.all(chats.map(async({members, _id, groupChat, creator, name}) => {

        const totalMessages = await Message.countDocuments({chat: _id})

        return {
            _id, name, groupChat,
            avatar: members.slice(0, 3).map((member) => member.avatar.url),
            members: members.map(({_id, name, avatar}) => ({ _id, name, avatar: avatar.url })),
            creator: { name: creator?.name || "None", avatar: creator?.avatar.url || "" },
            totalMembers: members.length,
            totalMessages
        }
    }))

    return res.status(200).json({
        success: true,
        transformedChats
    })
})

const allMessages = TryCatch(async (req, res, next) => {
    const messages = await Message.find({})
      .populate("sender", "name avatar")
      .populate("chat", "groupChat");
  
    const transformedMessages = messages.map((msg) => {
      const {
        content,
        attachment,
        _id,
        createdAt,
        sender,
        chat
      } = msg;
  
      return {
        content,
        _id,
        attachment,
        createdAt,
        chat: chat?._id || null,
        groupChat: chat?.groupChat || false,
        sender: sender ? {
          _id: sender._id || null,
          name: sender.name || "Unknown",
          avatar: sender.avatar?.url || ""
        } : null
      };
    });
  
    return res.status(200).json({
      success: true,
      transformedMessages
    });
  });
  

const getDashboardStats = TryCatch(async(req, res, next) => {
    const [groupsCount, usersCount, messagesCount, totalChatCounts] = await Promise.all([
        Chat.countDocuments({groupChat: true}),
        User.countDocuments(),
        Message.countDocuments(),
        Chat.countDocuments()
    ])

    const today = new Date()

    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const last7DaysMessages = await Message.find({
        createdAt:{
            $gte: last7Days
        }
    }).select("createdAt")

    const messages = new Array(7).fill(0)
    const daysInMilliSecond = 1000 * 60 * 60 * 24

    last7DaysMessages.forEach((message) => {
        const index = Math.floor((today.getTime() - message.createdAt.getTime())/daysInMilliSecond)
        messages[6 - index]++
    })

    const stats = {
        groupsCount, usersCount, messagesCount, totalChatCounts, messages 
    }

    return res.status(200).json({
        success: true,
        stats
    })
})

const adminLogout = TryCatch(async(req, res, next) => {
    res.status(200)
    .cookie("chatting-setting-admin-token", "", {...cookieOption, maxAge: 0})
    .json({
        success: true,
        message: "Logout Successfully"
    })
})

export { adminLogin, allUsers, allChats, allMessages, getDashboardStats, adminLogout, getadminData }