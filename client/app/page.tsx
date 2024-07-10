"use client"
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import img from '../public/chesshome.jpeg';
import img2 from '../public/startgame.svg';
import img3 from '../public/friendship.png';

import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [roomid,setRoomId]=useState('')

  

  const handleLogin = () => {
    signIn();
  };

  const handleLogout = () => {
    signOut();
  };

  const handelGameStart = () => {
    if (status !== "authenticated") {
      signIn();
    }
    router.push('/game/random');
  };

  const handelGameStartWithFriends = () => {
    if (status !== "authenticated") {
      signIn();
    }
    router.push('/game/friends');
  };

  return (
    <div className="h-auto flex flex-col lg:flex-row gap-8 mx-auto bg-black py-12 px-4 md:px-6 overflow-hidden">
      <div className="overflow-hidden w-full lg:w-[60%] rounded-xl">
        <Image src={img} alt="Chess" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col justify-center gap-[4rem] lg:gap-8 w-full lg:w-[40%]">
        <div className="flex gap-[3rem] flex-col  lg:max-w-[80%] mx-auto lg:mx-0">
          <p className="text-4xl flex justify-center lg:text-[50px] whitespace-normal font-bold text-white leading-tight lg:leading-[1.2]">Play Chess Online on the #1 Site!</p>
          <p className="text-muted-foreground lg:text-base">
            Explore the world of chess and challenge players from around the globe.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row lg:justify-between items-center justify-center gap-6">
          <Button onClick={handelGameStart} className="lg:w-full h-max bg-[#5d9948] flex justify-center gap-3">
            <Image src={img2} alt="image" className="h-20 w-28" />
            <div className="flex flex-col gap-4 text-xl font-bold text-white">
              <span>PlayOnline</span>
              <span className="text-xs">Play with your level</span>
            </div>
          </Button>
          {status === "authenticated" ? (
            <div className="w-full flex justify-center lg:justify-end">
              <Button onClick={handleLogout} className="h-24 w-full bg-[#5d9948] text-xl">Logout</Button>
            </div>
          ) : (
            <div className="w-full flex justify-center lg:justify-end">
              <Button onClick={handleLogin} className="h-28 bg-[#5d9948] lg:w-full text-xl">Login</Button>
            </div>
          )}
        </div>
        <div className="flex items-center flex-col lg:w-1/2 gap-4">
          <Image className="h-12 w-12" src={img3} alt="Friends" />
          <Button onClick={handelGameStartWithFriends} className="shrink-0 bg-[#5d9948]">Play with Friends Room</Button>
        </div>
        <div className="flex items-center flex-col lg:w-1/2 gap-4">
          <Textarea
          onChange={(e)=>setRoomId(e.target.value)}
            placeholder="Enter room code"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button onClick={()=>router.push(`game/friends/${roomid}`)}  className="shrink-0 bg-[#5d9948]" disabled={!roomid}>Join Room</Button>
        </div>
      </div>
    </div>
  );
}
