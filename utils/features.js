import mongoose from "mongoose"
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import {v4 as uuid} from 'uuid'
import { getBase64, getSockets } from "../lib/helper.js"

const cookieOption = {
    maxAge: 15 * 60 * 60 * 24 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true
}

const connectDB = (uri) => {
    mongoose.connect(uri, {dbName: "Chatting-Setting"})
    .then((data)=>{
        console.log(`Connected to DB ${data.connection.host}`)
    })
    .catch((err)=>{
        console.log(err)
        throw err
    })
}

const sendToken = (res, user, code, message) => {

    try {
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET)

        return res.status(code).cookie(process.env.COOKIE_KEY, token, cookieOption).json({
            success: true, 
            user,
            message
        })        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Token generation failed" });
    }

}

const emitEvent = (req, event, users, data) => {
    const io = req.app.get("io")
    const usersSocket = getSockets(users)
    io.to(usersSocket).emit(event, data)
}

const uploadFilesToCloudinary = async (files = []) => {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: "auto",
            public_id: uuid(),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      });
    });
  
    try {
      const results = await Promise.all(uploadPromises);
  
      const formattedResults = results.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));
      return formattedResults;
    } catch (err) {
      throw new Error("Error uploading files to cloudinary", err);
    }
  };
  

const deleteFilesFromClodinary = async(public_ids) => {

}

export { connectDB, sendToken, cookieOption, emitEvent, uploadFilesToCloudinary, deleteFilesFromClodinary }