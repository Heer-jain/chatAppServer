import { hash } from "bcrypt";
import pkg from "mongoose";
const { Schema, model, models } = pkg

const  schema = new Schema ({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    bio: {
        type: String
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }
},{
    timestamps: true
}
)

schema.pre("save", async function(next){
    if(!this.isModified("password")) return next()
    
    try {
        this.password = await hash(this.password, 10)
    } catch (error) {
        console.log(error)
        next(error)
    }
})

export const User = models.User || model("User", schema)