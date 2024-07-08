
import { v4 as uuidv4 } from 'uuid';





export class User {




    constructor(socket, userId) {
        this.socket = socket
        this.userId = userId;
        this.id = uuidv4();
    }
}

class SocketManager {

    static instance = null;


    constructor() {
        if (SocketManager.instance) {
            return SocketManager.instance;
        }

        this.interestedSockets = new Map();  //roomid to users
        this.userRoomMapping = new Map();  // user to roomid

        SocketManager.instance = this;
    }

    static getInstance() {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }
    addUser(user, roomId) {
        this.interestedSockets.set(roomId, [
            ...(this.interestedSockets.get(roomId) || []), user    //we will check if any user is present at give roomid if yes spread 
        ])
        this.userRoomMapping.set(user.userId, roomId)  //will map the added user's room
    }
    broadcast(roomId, message) {    //roomid as in gameid
        const users = this.interestedSockets.get(roomId)
        if (!users) {
            console.error("no user present here")
        }
        users.forEach((user, index) => {
            user.socket.send(message)
        })

    }
    removeUser(user) {

        const roomid = this.userRoomMapping.get(user.userId)
        if (!roomid) {
            console.error('User was not interested in any room?');
            return;
        }
        const room = this.interestedSockets.get(roomid)
        const userRemained = room.filter(roomuser => roomuser.userId !== user.userId);
        this.interestedSockets.set(roomid, userRemained);
        if (this.interestedSockets.get(roomid)?.length === 0) {  //if no user present delete this
            this.interestedSockets.delete(roomid);
        }
        this.userRoomMapping.delete(user.userId);  //same delete the room
    }
}
export const socketManager = SocketManager.getInstance()


