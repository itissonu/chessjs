"use client";

import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Move } from 'chess.js';

interface GameContextType {
  moves: Move[];
  setMoves: React.Dispatch<React.SetStateAction<Move[]>>;
  isFlipped: boolean;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const GameProvider = ({ children }: Readonly<{
    children: React.ReactNode;
}>) => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);

 

  return (
    <GameContext.Provider value={{ moves, setMoves ,isFlipped, setIsFlipped}}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

export default GameProvider;
