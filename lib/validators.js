import { body, validationResult, check, param } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";


const validateHandler = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) return next();

    const errorMessages = errors.array().map((error) => error.msg).join(", ");
    next(new ErrorHandler(errorMessages, 400));
};

const registerValidator = () => [
    body("name", "Please enter name").notEmpty(),
    body("username", "Please enter username").notEmpty(),
    body("bio", "Please enter bio").notEmpty(),
    body("password", "Please enter password").notEmpty(),
    body("email", "Please enter email").notEmpty().isEmail()
]

const loginValidator = () => [
    body("username", "Please enter username").notEmpty(),
    body("password", "Please enter password").notEmpty()
]

const newGroupValidator = () => [
    body("name", "Please enter name").notEmpty(),
    body("members").notEmpty().withMessage("Please enter members").isArray({min: 2, max: 100}).withMessage("Members should be between 2-100")
]

const addMemberValidator = () => [
    body("chatId", "Please enter chat ID").notEmpty(),
    body("members").notEmpty().withMessage("Please enter members").isArray({min: 1, max: 97}).withMessage("Members should be between 1-97")
]

const removeMemberValidator = () => [
    body("chatId", "Please enter chat ID").notEmpty(),
    body("userId", "Please enter user ID").notEmpty(),
]

const sendAttachmentsValidator = () => [
    body("chatId", "Please enter chat ID").notEmpty()
]

const chatIdValidator = () => [
    param("id", "Please enter chat ID").notEmpty(),
]

const renameGroupValidator = () => [
    param("id", "Please enter chat ID").notEmpty(),
    body("name", "Please enter new group name").notEmpty()
]

const sendRequestValidator = () => [
    body("userId", "Please enter user Id").notEmpty()
]

const acceptRequestValidator = () => [
    body("requestId", "Please enter request Id").notEmpty(),
    body("accept").notEmpty().withMessage("Please add accept").isBoolean().withMessage("Accept must be boolean")
]

const adminLoginValidator = () => [
    body("secretKey", "Please enter secret key").notEmpty(),
]


export { registerValidator, validateHandler, loginValidator, newGroupValidator, addMemberValidator, removeMemberValidator, sendAttachmentsValidator, chatIdValidator, renameGroupValidator, sendRequestValidator, acceptRequestValidator, adminLoginValidator }