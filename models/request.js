import pkg from "mongoose";
const { Schema, model, models, Types } = pkg

const  schema = new Schema ({
    status:{
        type: String,
        default: "pending",
        enum: ["pending", "accepted", "rejected"]
    },
    sender: {
        type: Types.ObjectId,
        ref: "User", 
        required: true
    },
    receiver: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    }
},{
    timestamps: true
}
)

export const Request = models.Request || model("Request", schema)