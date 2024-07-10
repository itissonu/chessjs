
import { GameStatus } from "@prisma/client";
import Game from "./Game.js";
import prisma from "./db.js";
import { EXIT_GAME, FRIEND_GAME, FRIEND_START, GAME_ADDED, GAME_ALERT, GAME_ENDED, GAME_JOINED, GAME_NOT_FOUND, INIT_GAME, JOIN_GAME, JOIN_ROOM, MOVE } from "./message.js";
import { socketManager } from "./socketMAnager.js";

class GameManager {
    constructor() {
        this.games = [];
        this.users = [];
        this.pendingGamesId = null;
        this.pendingFriendGamesId = null;

    }

    addUser(user) {

        this.users.push(user);
        this.handler(user);

        console.log(this.users.length + "-after adding user");
    }

    removeUser(socketToRemove) {
        console.log(this.games)
        let userToRemove = this.users.find(user => user.socket === socketToRemove);
        if (userToRemove) {
            let gameToUpdate = this.games.find(game =>
                game.player1UserId === userToRemove.userId || game.player2UserId === userToRemove.userId
            );
            if (gameToUpdate) {

                if (gameToUpdate.player1UserId === userToRemove.userId && gameToUpdate.player2UserId === null) {
                    this.games = this.games.filter((g) => g.gameId !== gameToUpdate.gameId);
                    console.log(userToRemove.userId + " removed from pending game");
                    gameToUpdate.player1UserId = null;
                    this.pendingGamesId = null;
                }
            }
        }

        this.users = this.users.filter(user => user.socket !== socketToRemove);

        console.log(this.users.length + "-user after removed ");
    }

    removeGame(gameId) {
        this.games = this.games.filter((g) => g.gameId !== gameId);
    }
    handler(user) {
        console.log('Handler attached for user:', user.ws);
        user.socket.on("message", async (data) => {

            const message = JSON.parse(data);

            console.log(message.type)

            if (message.type === FRIEND_GAME) {

                console.log("1st user for friend game")
                const game = new Game(user.userId, null, null, null, true)

                this.games.push(game)

                socketManager.addUser(user, game.gameId)
                this.pendingFriendGamesId = game.gameId

                socketManager.broadcast(game.gameId,
                    JSON.stringify({
                        gameId: game.gameId,
                        type: GAME_ADDED,

                    })
                )
            }

            if (message.type === FRIEND_START) {

                console.log("entered to be the second a game")
                if (this.pendingFriendGamesId) {
                    const game = this.games.find((game => game.gameId === this.pendingFriendGamesId))
                    if (!game) {
                        this.pendingFriendGamesId = null;
                        console.error('Pending game not found?');
                        return;
                    }
                    if (user.userId === game.player1UserId) {
                        socketManager.broadcast(game.gameId,
                            JSON.stringify({
                                type: GAME_ALERT,
                                payload: {
                                    message: "can not connect with yourself"
                                }
                            })
                        )
                    }
                    socketManager.addUser(user, game.gameId)
                    game.updateSecondPlayer(user.userId)

                    this.pendingFriendGamesId = null;

                }

            }

            if (message.type === INIT_GAME) {

                if (this.pendingGamesId) {
                    console.log(this.pendingGamesId)
                    console.log("entered to create a game")
                    const game = this.games.find((game => game.gameId === this.pendingGamesId))
                    if (!game) {
                        this.pendingGamesId = null;
                        console.error('Pending game not found?');
                        return;
                    }
                    if (user.userId === game.player1UserId) {
                        socketManager.broadcast(game.gameId,
                            JSON.stringify({
                                type: GAME_ALERT,
                                payload: {
                                    message: "can not connect with yourself"
                                }
                            })
                        )
                        return;

                    }
                    socketManager.addUser(user, game.gameId)
                    game.updateSecondPlayer(user.userId)

                    this.pendingGameId = null;
                }

                else {
                    // const availgame = this.games.find((game => game.gameId === this))
                    console.log("new user")
                    const game = new Game(user.userId, null)
                    this.games.push(game)

                    this.pendingGamesId = game.gameId;
                    socketManager.addUser(user, game.gameId)
                    socketManager.broadcast(game.gameId,
                        JSON.stringify({
                            gameId: game.gameId,
                            type: GAME_ADDED,

                        })
                    )

                }
            }

            if (message.type === MOVE) {
                const gameId = message.payload.gameId;
                const game = this.games.find(game => game.gameId === gameId);
                if (game) {
                    try {
                        game.makeMove(user, message.payload.move, message.payload.chess);
                    } catch (error) {
                        console.log(error);
                        socket.send(JSON.stringify({ error: error.message }));
                    }
                    if (game.result) {
                        this.removeGame(game.gameId);
                    }
                }
            }
            if (message.type === EXIT_GAME) {
                const gameId = message.payload.gameId;
                const game = this.games.find((game) => game.gameId === gameId);

                if (game) {
                    game.exitGame(user);
                    this.removeGame(game.gameId)
                    this.pendingGamesId = null;
                }
            }
            if (message.type === JOIN_ROOM) {
                const gameId = message.payload?.gameId;
                if (!gameId) {
                    console.log("no game id found")
                    return;
                }
                let availableGame = this.games.find(g => g.gameId === gameId)
                if (!availableGame) {
                    console.log("dod not found the game")
                }
                //find game from db
                const gameFromDB = await prisma.game.findUnique({
                    where: { id: gameId },
                    include: {
                        moves: {
                            orderBy: {
                                moveNumber: 'asc'
                            }
                        },
                        blackPlayer: true,
                        whitePlayer: true,
                    },

                })
                if (availableGame && !availableGame.player2UserId) {
                    socketManager.addUser(user, availableGame.gameId)
                    await availableGame.updateSecondPlayer(user.userId)
                    return;
                }
                if (!gameFromDB) {
                    user.socket.send(
                        JSON.stringify({
                            type: GAME_NOT_FOUND,
                        }),
                    );
                    return;
                }

                if (gameFromDB.status !== GameStatus.IN_PROGRESS) {
                    user.socket.send(JSON.stringify({
                        type: GAME_ENDED,
                        payload: {
                            result: gameFromDB.result,
                            status: gameFromDB.status,
                            moves: gameFromDB.moves,
                            blackPlayer: {
                                id: gameFromDB.blackPlayerId,
                                name: gameFromDB.blackPlayer.name
                            },
                            whitePlayer: {
                                id: gameFromDB.whitePlayer.id,
                                name: gameFromDB.whitePlayer.name,
                            },
                        }
                    }));
                    return;
                }

                //if no such game present in local create one game weather with the database data
                if (!availableGame) {
                    const game = new Game(
                        gameFromDB?.whitePlayerId,
                        gameFromDB?.blackPlayerId,
                        gameFromDB.id,
                        gameFromDB.startAt
                    );
                    game.seedMoves(gameFromDB?.moves || [])
                    this.games.push(game);
                    availableGame = game;

                }

                user.socket.send(
                    JSON.stringify({
                        type: GAME_JOINED,
                        payload: {
                            gameId,
                            moves: gameFromDB.moves,
                            blackPlayer: {
                                id: gameFromDB.blackPlayer.id,
                                name: gameFromDB.blackPlayer.name,
                            },
                            whitePlayer: {
                                id: gameFromDB.whitePlayer.id,
                                name: gameFromDB.whitePlayer.name,
                            },
                            player1TimeConsumed: availableGame.getPlayer1TimeConsumed(),
                            player2TimeConsumed: availableGame.getPlayer2TimeConsumed(),

                        },
                    }),
                );

                socketManager.addUser(user, gameId);
            }


        });
    }
}

export default GameManager;