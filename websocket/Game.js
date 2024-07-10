import { Chess } from "chess.js";
import { GAME_ENDED, GAME_OVER, INIT_GAME, MOVE } from "./message.js";
import { socketManager } from "./socketMAnager.js";
import { randomUUID } from "crypto";
import prisma from "./db.js";
import GameManager from "./GlobalObject.js";

const GAME_TIME_MS = 10 * 60 * 1000;

export function isPromoting(chess, from, to) {
  if (!from) {
      return false;
  }

  const piece = chess.get(from);

  if (piece?.type !== 'p') {
      return false;
  }

  if (piece.color !== chess.turn()) {
      return false;
  }

  // Check if the destination square is on the last rank for promotion
  if (!['1', '8'].some((rank) => to.endsWith(rank))) {
      return false;
  }

  return true;
}

class Game {

  constructor(player1UserId, player2UserId, gameId, startTime,friendgame) {
    this.player1UserId = player1UserId;
    this.player2UserId = player2UserId;
    this.board = new Chess();
    this.moveCount = 0;
    this.result = null
    this.player1TimeConsumed = 0;
    this.player2TimeConsumed = 0;
    this.gameId = gameId ?? randomUUID();
    this.moveTimer = null;
    this.friendgame=friendgame;

    this.timer = null;
    if (startTime) {
      this.startTime = startTime;
      this.lastMoveTime = startTime;
    }

  }
  async addMoveToDb(move, moveTimestamp) {

    await prisma.$transaction([

      prisma.move.create({
        data: {
          gameId: this.gameId,
          moveNumber: this.moveCount + 1,
          from: move.from,
          to: move.to,
          before: move.before,
          after: move.after,
          createdAt: moveTimestamp,
          timeTaken: moveTimestamp.getTime() - this.lastMoveTime.getTime(),

        },
      }),
      prisma.game.update({
        data: {
          currentFen: move.after,
        },
        where: {
          id: this.gameId,
        },
      }),
    ]);
  }
  async updateSecondPlayer(userId) {
    this.player2UserId = userId

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: [this.player1UserId, this.player2UserId ?? ''],
        },
      },
    });


    try {
      await this.createGameInDb();
    } catch (e) {
      console.error(e);
      return;
    }
    socketManager.broadcast(this.gameId,
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId: this.gameId,
          whitePlayer: {
            name: users.find((user) => user.id === this.player1UserId)?.name,
            id: this.player1UserId
          },
          blackPlayer: {
            name: users.find((user) => user.id === this.player2UserId)?.name,
            id: this.player2UserId
          },
          fen: this.board.fen(),
          moves: [],
          myturn: this.board.turn(),
        },

      })
    );
   

  }

  seedMoves(moves) {
    console.log(moves);
    moves.forEach((move) => {
      if (
        isPromoting(this.board, move.from, move.to)
      ) {
        this.board.move({
          from: move.from,
          to: move.to,
          promotion: 'q',
        });
      } else {
        this.board.move({
          from: move.from,
          to: move.to,
        });
      }
    });
    this.moveCount = moves.length;
    if (moves[moves.length - 1]) {
      this.lastMoveTime = moves[moves.length - 1].createdAt;
    }

    moves.map((move, index) => {
      if (move.timeTaken) {
        if (index % 2 === 0) {
          this.player1TimeConsumed += move.timeTaken;
        } else {
          this.player2TimeConsumed += move.timeTaken;
        }
      }
    });
    this.resetAbandonTimer();
    this.resetMoveTimer();
  }
  async createGameInDb() {
    this.startTime = new Date(Date.now());
    this.lastMoveTime = this.startTime;

    const game = await prisma.game.create({
      data: {
        id: this.gameId,
        timeControl: "CLASSICAL",
        status: 'IN_PROGRESS',
        startAt: this.startTime,
        currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        whitePlayer: {
          connect: {
            id: this.player1UserId
          }
        },
        blackPlayer: {
          connect: {
            id: this.player2UserId
          }
        },
      },
      include: {
        whitePlayer: true,
        blackPlayer: true
      }
    });
    this.gameId = game.id;
  }


  async makeMove(user, move,chess) {
    this.chess=chess;
    if (this.board.turn() === 'w' && user.userId !== this.player1UserId) {
      console.log("not your turn w")
      return;
    }

    if (this.board.turn() === 'b' && user.userId !== this.player2UserId) {
      console.log("not your turn b")
      return;
    }
    if (this.result) {
      console.error(`User ${user.userId} is making a move post game completion`);
      return;
    }
    const moveTimestamp = new Date(Date.now());


    try {

      if (isPromoting(this.board, move.from, move.to,)) {
        console.log("prom......")
        this.board.move({
          from: move.from,
          to: move.to,
          promotion: 'q'
        })
        console.log(this.board.board())
      } else {
        this.board.move({
          from: move.from,
          to: move.to,
        });
        console.log(`Made the move: ${JSON.stringify(move)}`);
      }

    } catch (error) {
      console.error("Move error:", error);
      return;
    }

    if (this.board.turn() === 'b') {
      this.player1TimeConsumed = this.player1TimeConsumed + (moveTimestamp.getTime() - this.lastMoveTime.getTime())

    }
    if (this.board.turn() === 'w') {
      this.player2TimeConsumed = this.player2TimeConsumed + (moveTimestamp.getTime() - this.lastMoveTime.getTime())

    }


    await this.addMoveToDb(move, moveTimestamp);
    this.resetAbandonTimer()
    this.resetMoveTimer();
    this.lastMoveTime = moveTimestamp;     //asign the current time for last move and (so the last time will will be from where the 2nd player start the move an d when 2nd player makes move curr-last than ....)
   
    socketManager.broadcast(this.gameId,
      JSON.stringify({
        type: MOVE,
        payload: ({
          newchess:this.chess,
          myturn: this.board.turn(),
          updatedBoard:this.board.board(),
          move,
          player1TimeConsumed: this.player1TimeConsumed,
          player2TimeConsumed: this.player2TimeConsumed,
        })
      })
    )

    if (this.board.isGameOver()) {
      console.log("gameover")
      const result = this.board.isDraw()
        ? 'DRAW' : this.board.turn() === 'b' ? 'WHITE_WINS' : 'BLACK_WINS'
      this.endGame("COMPLETED", result);

    }
    

    this.moveCount++;

  }
  getPlayer1TimeConsumed() {
    if (this.board.turn() === 'w') {
      return this.player1TimeConsumed + (new Date(Date.now()).getTime() - this.lastMoveTime.getTime());
    }
    return this.player1TimeConsumed;
  }

  getPlayer2TimeConsumed() {
    if (this.board.turn() === 'b') {
      return this.player2TimeConsumed + (new Date(Date.now()).getTime() - this.lastMoveTime.getTime());
    }
    return this.player2TimeConsumed;
  }
  async exitGame(user) {
    this.endGame('PLAYER_EXIT', user.userId === this.player2UserId ? 'WHITE_WINS' : 'BLACK_WINS');
   
  }
  //this like for after 3 min if no move occured than suspend the game
  async resetAbandonTimer() {
    if (this.timer) {
      clearTimeout(this.timer); //This step is necessary to avoid multiple timers running simultaneously.
    }

    this.timer = setTimeout(() => {
      this.endGame("ABANDONED", this.board.turn() === 'b' ? 'WHITE_WINS' : 'BLACK_WINS')

    }, 8 * 60 * 1000)
  }


  async resetMoveTimer() {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer)
    }
    const turn = this.board.turn();
    const timeleft = GAME_TIME_MS - (turn === 'w' ? this.player1TimeConsumed : this.player2TimeConsumed);
    console.log(timeleft)
    this.moveTimer = setTimeout(() => {
      console.log("time out ")
      this.endGame("TIME_UP", turn === 'b' ? 'WHITE_WINS' : 'BLACK_WINS');
    }, timeleft)
  }
  async endGame(status, result) {
    const updatedGame = await prisma.game.update({
      data: {
        status,
        result: result,
      },
      where: {
        id: this.gameId,
      },
      include: {
        moves: {
          orderBy: {
            moveNumber: 'asc',
          },
        },
        blackPlayer: true,
        whitePlayer: true,
      }
    });
    //update game in the db

    socketManager.broadcast(this.gameId,
      JSON.stringify({
        type: GAME_ENDED,
        payload: {
          result,
          status,
          moves: [],
          blackPlayer: {

            id: updatedGame.blackPlayer.id,
            name: updatedGame.blackPlayer.name,
          },
          whitePlayer: {

            id: updatedGame.whitePlayer.id,
            name: updatedGame.whitePlayer.name,
          },
        }
      })
    )
    this.clearTimer();
    this.clearMoveTimer();
    this.gameId=null;
    this.player1UserId=null;
    this.player2UserId=null;

  }

  clearMoveTimer() {
    if (this.moveTimer) clearTimeout(this.moveTimer);
  }

  setTimer(timer) {
    this.timer = timer;
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
  }
}

export default Game;
