import { Chat } from '../models/chat.js'
import { Message } from '../models/message.js'
import { User } from '../models/user.js'
import { faker, simpleFaker } from '@faker-js/faker'

const createSingleChats = async(numChats) => {
    try{
        const users = await User.find().select("_id")

        const chatsPromise = []

        for (let i = 0; i < users.length; i++) {
            for (let j = i+1; j < users.length; j++) {
                chatsPromise.push(
                    Chat.create({
                        name: faker.lorem.words(2),
                        members: [users[i], users[j]]
                    })
                )                
            }
            
        }
        await Promise.all(chatsPromise)

        console.log("Chats created successfully")
        process.exit(1)
    }catch(error){
        console.error(error)
        process.exit(1)
    }
}

const createGroupChats = async (numChats) => {
    try {
        const users = await User.find().select("_id");
        const chatsPromise = [];

        for (let i = 0; i < numChats; i++) {
            const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
            const members = [];

            while (members.length < numMembers) {
                const randomIndex = Math.floor(Math.random() * users.length);
                const randomUser = users[randomIndex];

                // Ensure no duplicates by comparing _id strings
                if (!members.some(member => member._id.toString() === randomUser._id.toString())) {
                    members.push(randomUser);
                }
            }

            const chat = Chat.create({
                groupChat: true,
                name: faker.lorem.words(1),
                members,
                creator: members[0]
            });

            chatsPromise.push(chat);
        }

        await Promise.all(chatsPromise);

        console.log("Chats created successfully");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const createMessages = async (numMessages) => {
    try {
        const users = await User.find().select("_id");
        const chats = await Chat.find().select("_id");

        const messagePromise = [];

        for (let i = 0; i < numMessages; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomChat = chats[Math.floor(Math.random() * chats.length)];

            messagePromise.push(
                Message.create({
                    chat: randomChat._id,       // Use _id
                    sender: randomUser._id,     // Use _id
                    content: faker.lorem.sentence()
                })
            );
        }

        await Promise.all(messagePromise);

        console.log("Messages created successfully");
        process.exit(0); // 0 for success
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};


const createMessagesInChat = async (chatId, numMessages) => {
    try {
        const users = await User.find().select("_id");

        const messagePromise = [];

        for (let i = 0; i < numMessages; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];

            messagePromise.push(
                Message.create({
                    chat: chatId,
                    sender: randomUser._id, // you need to send the _id
                    content: faker.lorem.sentence()
                })
            );
        }

        await Promise.all(messagePromise);

        console.log("Messages created successfully");
        process.exit(0); // use 0 for success
    } catch (error) {
        console.error(error);
        process.exit(1); // 1 for error
    }
};


export { createGroupChats, createSingleChats, createMessages, createMessagesInChat }