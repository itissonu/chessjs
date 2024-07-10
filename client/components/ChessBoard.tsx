"use client"
import { MOVE } from '@/utils/message';
import { Chess, Color, PieceSymbol, Square, Piece } from 'chess.js'
import React, { useEffect, useState } from 'react'
import bp from '../public/bp.png'
import br from '../public/br.png'
import bn from '../public/bn.png'
import bb from '../public/bb.png'
import bq from '../public/bq.png'
import bk from '../public/bk.png'

import wp from '../public/wp.png'
import wr from '../public/wr.png'
import wn from '../public/wn.png'
import wb from '../public/wb.png'
import wq from '../public/wq.png'
import wk from '../public/wk.png'
import Image from 'next/image'
import { useGameContext } from '@/hooks/moveContex';



const pieceImages: { [key: string]: any } = {
    'wp': wp,
    'wr': wr,
    'wn': wn,
    'wb': wb,
    'wq': wq,
    'wk': wk,
    'bp': bp,
    'br': br,
    'bn': bn,
    'bb': bb,
    'bq': bq,
    'bk': bk,
};
type Turn = 'w' | 'b';


export function isPromoting(chess: Chess, from: Square, to: Square) {
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
const ChessBoard = ({ myturn, chess, board, socket, setBoard, gameId,
    started,
    myColor, setChess }: {
        myturn: string;
        setChess: any;
        loggedInUserId: string;
        myColor: Color;
        gameId: string;
        started: boolean;
        chess: any
        board: ({
            square: Square;
            type: PieceSymbol;
            color: Color;
        } | null)[][];
        socket: WebSocket;
        setBoard: any
    }) => {

    const [from, setFrom] = useState<Square | null>()
    console.log(myColor+'my color ......')
   

    const isMyTurn = myColor === chess.turn();
    const [isFlipped, setIsFlipped] = useState(false);
    const moveAudio = new Audio('/move.wav');
    const captureAudio = new Audio('/game.wav');
    const CheckMateAudion = new Audio('/checkmate.wav')
    const checkonly = new Audio('/check.wav')
    const [gameOver, setGameOver] = useState(false);
    const { setMoves, moves } = useGameContext()
    const [check, setCheck] = useState<Boolean | false>(chess.isCheck())
    const [kingSquare, setKingSquare] = useState(null);
    console.log(isFlipped+"is flipped ...bcz i must be black")
    useEffect(() => {
        if (myColor === 'b') {
            console.log(myColor+'is my color'+'')
            setIsFlipped(true);
            console.log(myColor+' my color'+'sp fliped')
        }
    }, [myColor]);
 

    useEffect(() => {

        setBoard(board);
        //setChess(chess);
        setCheck(chess.isCheck())
        if (chess.isCheck()) {
            const kingPosition = chess.board().flat().find((piece: Piece) => piece && piece.type === 'k' && piece.color === chess.turn());
            if (kingPosition) {
                setKingSquare(kingPosition.square);
            }
        } else {
            setKingSquare(null);
        }

    }, [moves, myturn]);

    const handleClick = (squareRepresent: Square, square: any) => {
        if (!started || gameOver) return;
        if (!from && square?.color !== chess.turn()) {
            console.log({
                mycolor: myColor,
                turn: chess.turn(),
                color: square?.color
            })
            return;
        }
        if (!isMyTurn) {
            console.log("invcalid move")
            return;
        }

        if (!from) {
            setFrom(squareRepresent);
        } else {
            try {

                let moveResult;
                if (isPromoting(chess, from, squareRepresent)) {
                    console.log("promoted ......")
                    moveResult = chess.move({
                        from,
                        to: squareRepresent,
                        promotion: 'q',
                    });
                } else {
                    console.log(chess)
                    try {
                        moveResult = chess.move({
                            from,
                            to: squareRepresent,
                        });

                        moveAudio.play()
                        if (chess.isCheck()) {
                            checkonly.play()
                        }
                    } catch (error) {
                        setFrom(null);
                    }

                }
                if (moveResult) {

                    if (moveResult?.captured) {
                        captureAudio.play();
                    }

                    setBoard(chess.board())
                    setMoves((prev) => [...prev, moveResult])
                    setFrom(null);

                    if (moveResult.san.includes('#')) {
                        CheckMateAudion.play()
                        setGameOver(true);
                    }


                    socket.send(
                        JSON.stringify({
                            type: MOVE,
                            payload: {
                                gameId,
                                move: moveResult,
                                chess
                            },
                        })
                    );
                }
            } catch (error) {
                console.error('Move error:', error);
            }
        }
    };

    const renderSquare = (square: any, i: number, j: number) => {
        const squareRepresent = (String.fromCharCode(97 + j) + '' + i)
        const isKingInCheck = squareRepresent === kingSquare;
        // const squareRepresent = String.fromCodePoint(97 + (j % 8)) + '' + (8 - i);
        return (
            <div
                onClick={() => handleClick(squareRepresent as Square, square)}
                key={j}

                className={`lg:w-[76px] w-[60px] flex text-center ${isKingInCheck ? 'bg-pink-200' : ''} justify-center items-center  hover:bg-green-200 lg:h-[70px]  h-[45px] ${(i + j) % 2 === 0 ? 'bg-[#739552]' : 'bg-green-100'
                    }`}
            >
                {square && (
                    <Image
                        className='hover:cursor-grab h-8 w-8  lg:h-12 lg:w-12'
                        src={pieceImages[`${square.color}${square.type}`]}
                        alt={`${square.color}${square.type}`}
                       
                    />
                )}
            </div>
        );
    };

    return (
        <div>
            {(isFlipped ? board.slice().reverse() : board).map((row, i) => {
                i = isFlipped ? i + 1 : 8 - i;
                return (

                    <div className='flex' key={i}>
                        {(isFlipped ? row.slice().reverse() : row).map((square, j) => {
                            // const rowIdx = isFlipped ? 7 - i : i;
                            // const colIdx = isFlipped ? 7 - j : j;
                            j = isFlipped ? 7 - (j % 8) : j % 8;
                            return renderSquare(square, i, j);
                        }
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default ChessBoard