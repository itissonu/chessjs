"use client"
import ChessBoard, { isPromoting } from '@/components/ChessBoard'
import ExitGameModel from '@/components/ExitGame'
import MovesTable from '@/components/Movetable'
import { ShareGame } from '@/components/ShareGame'
import { UserAvatar } from '@/components/UseAvatar'
import GameEndModal from '@/components/gameEndModal'
import { Button } from '@/components/ui/button'
import { useGameContext } from '@/hooks/moveContex'
import { useSocket } from '@/hooks/useSocket'
import { fetchUserToken } from '@/utils/fetchToken'
import { EXIT_GAME, FRIEND_GAME, FRIEND_START, GAME_ADDED, GAME_ENDED, GAME_JOINED, GAME_OVER, INIT_GAME, JOIN_GAME, JOIN_ROOM, MOVE } from '@/utils/message'
import { GameStatus } from '@prisma/client'
import { Chess, Move, SQUARES } from 'chess.js'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
export enum Result {
  WHITE_WINS = 'WHITE_WINS',
  BLACK_WINS = 'BLACK_WINS',
  DRAW = 'DRAW',
}
interface Metadata {
  blackPlayer: { id: string; name: string };
  whitePlayer: { id: string; name: string };
}
export interface GameResult {
  result: Result;
  by: string;
}
const GAME_TIME_MS = 10 * 60 * 1000;
const Page = () => {
  const socket = useSocket()
  const [chess, setChess] = useState(new Chess())
  const [board, setBoard] = useState(chess.board())
  const [turn, setTurn] = useState('w')
  const [startStatus, addStartStatus] = useState(false)
  const [gameMetadata, setGameMetadata] = useState<Metadata | null>(null);
  const [player1TimeConsumed, setPlayer1TimeConsumed] = useState(0);
  const [player2TimeConsumed, setPlayer2TimeConsumed] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [gameId, setGameID] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();
  const { moves, setMoves } = useGameContext()
  const [result, setResult] = useState<GameResult | null>(null);
  //const audio = new Audio('/move.wav');
  const [friendGame, setFriendGame] = useState(false)
  const { games } = useParams();
  console.log(games)
  console.log(gameId)

  useEffect(() => {
    if (games[0] === 'friends') {
      setFriendGame(true)
    }
  }, [])

  // useEffect(() => {
  //   if (status!=='authenticated') {
  //     router.push('/')
  //   }
  // }, [session?.user]);

  useEffect(() => {

    const fetchData = async () => {
      try {
        const data = await fetchUserToken();
        if(!data.user){
          router.push('/')
        }
        setUserId(data.user?.id || null);
      } catch (error) {
        console.error("Failed to fetch user token:", error);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    if (!socket) {
      return
    }


    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)

      switch (message.type) {

        case GAME_ADDED:
          setAdded(true);
          setGameID((p) => message.gameId);
          break;

        case INIT_GAME:
          setChess(new Chess())
          // setBoard(chess.board())
          addStartStatus(true)
          setGameID(() => message.payload.gameId)


          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          console.log(message.payload.whitePlayer)

          break;

        case GAME_JOINED:

          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          setPlayer1TimeConsumed(message.payload.player1TimeConsumed);
          setPlayer2TimeConsumed(message.payload.player2TimeConsumed);

          addStartStatus(true);

          message.payload.moves.map((x: Move) => {
            if (isPromoting(chess, x.from, x.to)) {
              chess.move({ ...x, promotion: 'q' });
            } else {
              chess.move({ from: x.from, to: x.to });
            }
          });
          setBoard(chess.board())
          setMoves(message.payload.moves);
          break;

        case MOVE:
          const { move, myturn, player1TimeConsumed, player2TimeConsumed } =
            message.payload;
          setChess(chess)
          setPlayer1TimeConsumed(player1TimeConsumed);
          setPlayer2TimeConsumed(player2TimeConsumed);

          console.log(chess);

          setTurn(myturn)

          try {
            if (isPromoting(chess, move.from, move.to)) {
              console.log("promoted")
              chess.move({
                from: move.from,
                to: move.to,
                promotion: 'q',
              });
            } else {
              chess.move({ from: move.from, to: move.to });
            }

            setMoves((moves) => [...moves, move]);

            setBoard(chess.board())

          } catch (error) {
            console.log(error)
          }

          break;
        case GAME_ENDED:
          let wonBy;
          switch (message.payload.status) {
            case 'COMPLETED':
              wonBy = message.payload.result !== 'DRAW' ? 'CheckMate' : 'Draw';
              break;
            case 'PLAYER_EXIT':
              wonBy = 'Player Exit';
              break;
            default:
              wonBy = 'Timeout';
          }
          setResult({
            result: message.payload.result,
            by: wonBy,
          });
          chess.reset();
          addStartStatus(false);
          setAdded(false);

          break;
        case GAME_OVER:

          break;

        default:
          break;
      }
      // if (games[0] !== 'random' && socket.readyState === WebSocket.OPEN ) {
      //   console.log('enetrerereer' + games[0])
      //   socket.send(
      //     JSON.stringify({
      //       type: JOIN_ROOM,
      //       payload: {
      //         gameId: games[0],
      //       },
      //     }),
      //   );
      //   console.log("ok got to the bottom")
      // }

    }

  }, [socket])


  // useEffect(() => {
  //   if (startStatus) {
  //     const interval = setInterval(() => {
  //       if (chess.turn() === 'w') {
  //         setPlayer1TimeConsumed((p) => p + 100);
  //       } else {
  //         setPlayer2TimeConsumed((p) => p + 100);
  //       }
  //     }, 100);
  //     return () => clearInterval(interval);
  //   }
  // }, [player1TimeConsumed,player2TimeConsumed]);

  const getTimer = (timeConsumed: number) => {
    const timeLeftMs = GAME_TIME_MS - timeConsumed;
    const minutes = Math.floor(timeLeftMs / (1000 * 60));
    const remainingSeconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    return (
      <div className="text-white h-max w-max shadow-md p-2 border-[1px] bg-black">
        Time Left: {minutes < 10 ? '0' : ''}
        {minutes}:{remainingSeconds < 10 ? '0' : ''}
        {remainingSeconds}
      </div>
    );
  };
  const handleExit = () => {
    socket?.send(
      JSON.stringify({
        type: EXIT_GAME,
        payload: {
          gameId,
        },
      }),
    );
    setMoves([]);
    router.push('/');
  };

  if (!socket) {
    return <>Connecting...</>
  }

  return (
    <div className='flex justify-center items-center h-auto  bg-[#483f35]  lg:pr-14 w-full '>
      {result && (
        <GameEndModal
          blackPlayer={gameMetadata?.blackPlayer}
          whitePlayer={gameMetadata?.whitePlayer}
          gameResult={result}
        ></GameEndModal>
      )}

      <div className='w-full flex flex-col lg:flex-row h-full justify-between p-2'>
        <div className='w-full lg:w-[60%] gap-3 flex flex-col justify-center items-center'>

          {startStatus && (
            <div className="mb-4 w-full lg:pl-32 lg:pr-32">
              <div className="flex w-full justify-between">
                <UserAvatar
                  name={
                    userId === gameMetadata?.whitePlayer?.id
                      ? gameMetadata?.blackPlayer?.name
                      : gameMetadata?.whitePlayer?.name ?? ''
                  }
                />
                {startStatus && (
                  <div className="justify-center items-center p-2 lg:text-base text-[10px] shadow-lg border-2  flex bg-white/20  text-white rounded-md">
                    {(userId === gameMetadata?.blackPlayer?.id ? 'b' : 'w') ===
                      chess.turn()
                      ? 'Your turn'
                      : "Opponent's turn"}
                  </div>
                )}

                {getTimer(
                  userId === gameMetadata?.whitePlayer?.id
                    ? player2TimeConsumed
                    : player1TimeConsumed,
                )}
              </div>
            </div>
          )}
          <div className='w-full p-3 lg:w-auto'>
            <ChessBoard
              setChess={setChess}
              myturn={turn}
              loggedInUserId={userId ?? ''}
              started={startStatus}
              gameId={gameId ?? ''}
              myColor={
                userId === gameMetadata?.blackPlayer?.id ? 'b' : 'w'
              } chess={chess}
              setBoard={setBoard}
              board={board}
              socket={socket} />
          </div>
          <div className="mb-4 w-full lg:pl-32 lg:pr-32">
            {startStatus && (
              <div className="mt-4 flex justify-between">
                <UserAvatar
                  name={
                    userId === gameMetadata?.blackPlayer?.id
                      ? gameMetadata?.blackPlayer?.name
                      : gameMetadata?.whitePlayer?.name ?? ''
                  }
                />
                {getTimer(
                  userId === gameMetadata?.blackPlayer?.id
                    ? player2TimeConsumed
                    : player1TimeConsumed,
                )}
              </div>
            )}
          </div>
        </div>
        <div className='w-full lg:w-[40%] bg-white/10 flex justify-center p-6'>
          <div className="rounded-md pt-2 bg-bgAuxiliary3 flex-1 overflow-auto h-[95vh] overflow-y-scroll ">
            {!startStatus ? (
              <div className="pt-8 flex justify-center w-full">
                {added || gameId ? (
                  <div className='flex flex-col items-center space-y-4 justify-center'>
                    <h5 className="mb-2 text-xl font-extrabold tracking-tight text-black opacity-40">
                      Wait opponent will join soon...
                    </h5>
                    <ShareGame gameId={gameId ?? ''} isFriendGame={friendGame ? true : false} />
                  </div>
                ) : (
                  friendGame ? (friendGame && games[0]==='friends' && games.length===2?( <Button
                    onClick={() => {
                      socket.send(
                        JSON.stringify({
                          type: FRIEND_START,
                        }),
                      );
                    }}
                  >
                    Play with your friend
                  </Button>): <Button
                    onClick={() => {
                      socket.send(
                        JSON.stringify({
                          type: FRIEND_GAME,
                        }),
                      );
                    }}
                  >
                    Play with a friend
                  </Button>) :
                    (
                      <Button
                        onClick={() => {
                          socket.send(
                            JSON.stringify({
                              type: INIT_GAME,
                            }),
                          );
                        }}
                      >
                        Play
                      </Button>
                    )
                )}
              </div>
            ) : (<>
              <div className="p-8 flex justify-center w-full">
                <ExitGameModel onClick={() => handleExit()} />
              </div>
              <div>

                <MovesTable />

              </div>
            </>
            )}

          </div>
        </div>
      </div>




    </div>
  )
}

export default Page