import pkg from "mongoose";
const { Schema, model, models, Types } = pkg

const  schema = new Schema ({
    name: {
        type: String,
        required: true
    },
    groupChat: {
        type: Boolean,
        default: false
    },
    creator: {
        type: Types.ObjectId,
        ref: "User"
    },
    members: [{
        type: Types.ObjectId,
        ref: "User"
    },]
},{
    timestamps: true
}
)

export const Chat = models.Chat || model("Chat", schema)