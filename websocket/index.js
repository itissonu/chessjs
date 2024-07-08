import { WebSocketServer } from "ws"
import globalGameFunction from "./GlobalObject.js"
import GameManager from "./GlobalObject.js";
import { User } from "./socketMAnager.js";
import prisma from "./db.js";
import url from 'url';
import { extractUserId } from "./auth.js";


const wss = new WebSocketServer({ port: 8081 })

const gameManager = new GameManager();

wss.on('connection', async function connection(ws, req) {
    console.log('Client connected');

    const token = url.parse(req.url, true).query.token;
    const email = extractUserId(token);

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            ws.close(1008, 'User not found');
            return;
        }
        const userId = user.id
        const newUser = new User(ws, userId);
        //console.log(newUser)
        gameManager.addUser(newUser);
        

        ws.on('close', () => {
            gameManager.removeUser(ws);
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        ws.close(1011, 'Internal server error');
    }
})