import pkg from "mongoose";
const { Schema, model, models, Types } = pkg

const  schema = new Schema ({
    content: String,
    sender: {
        type: Types.ObjectId,
        ref: "User", 
        required: true
    },
    chat: {
        type: Types.ObjectId,
        ref: "Chat",
        required: true
    },
    attachment: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },]
},{
    timestamps: true
}
)

export const Message = models.Message || model("Message", schema)