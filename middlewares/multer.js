import multer from 'multer'

const storage = multer.memoryStorage(); // store file in memory to access file.buffer

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB
  },
});

const singleAvatar = multerUpload.single("avatar")

const attachmentMulter = multerUpload.array("files", 5)

export { multerUpload, singleAvatar, attachmentMulter }