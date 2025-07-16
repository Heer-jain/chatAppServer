const corsOption = {
    origin: ["http://localhost:5173", "http://localhost:5174", "https://chat-app-client-zeta-sepia.vercel.app/"],
    credentials: true
}

const TOKEN = "chatting-setting-cookie"

export { corsOption, TOKEN }