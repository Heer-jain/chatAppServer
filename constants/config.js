const corsOption = {
    origin: ["http://localhost:5173", "http://localhost:5174", "https://chat-app-client-zeta-sepia.vercel.app/", process.env.CLIENT_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}

const TOKEN = "chatting-setting-cookie"

export { corsOption, TOKEN }