"use client"
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react"
import img from '../public/chesshome.jpeg'
import img2 from '../public/startgame.svg'
import img3 from '../public/friendship.png'

import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  console.log(session)

  const handleLogin = () => {
    signIn()

  };
  const handleLogout = () => {
    signOut()

  };

  const handelGameStart = () => {
    if (status !== "authenticated") {
      signIn()
    }
    router.push('/game/random')
  }
  const handelGameStartWithFriends = () => {
    if (status !== "authenticated") {
      signIn()
    }
    router.push('/game/friends')
  }

  return (
    <div className=" grid-cols-1 h-screen flex gap-8 w-full mx-auto bg-black py-12 px-4 md:px-6">
      <div className="overflow-hidden w-[60%] rounded-xl">
        <Image src={img} alt="Chess" className="w-full h-full object-cover " />
      </div>
      <div className="flex flex-col justify-center gap-6">
        <div className="space-y-2">
          <h1 className=" text-[100px] font-bold text-white">Play Chess Online on the #1 Site!</h1>
          <p className="text-muted-foreground text-lg">
            Explore the world of chess and challenge players from around the globe.
          </p>
        </div>
        <div className="flex  justify-between w-1/2  gap-2">
          <Button onClick={handelGameStart} className="w-full h-max bg-[#5d9948] flex justify-center gap-3"><Image src={img2} alt="image" className="h-24 w-24" />
            <div className="flex flex-col gap-4 text-2xl font-bold text-white ">
              <span>PlayOnline</span>
              <span className="text-xs">play wiyh your level</span>
            </div></Button>
          {status === "authenticated" ? <div className="ml-6 flex w-full justify-end">
            <Button onClick={handleLogout} className="h-28 w-full bg-[#5d9948] text-xl">Logout</Button>
          </div> : <div className="ml-6 flex w-full justify-end">
            <Button onClick={handleLogin} className="h-28 bg-[#5d9948] w-full text-xl">Login</Button>
          </div>}
        </div>
        <div className="flex items-center flex-col w-1/2 gap-4">
          <Image className="h-12 w-12" src={img3} alt="hjhj" />
          <Button onClick={handelGameStartWithFriends} className="shrink-0 bg-[#5d9948]">Play with friends Room</Button>
        </div>
        <div className="flex items-center flex-col w-1/2 gap-4">
          <Textarea
            placeholder="Enter room code"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button className="shrink-0 bg-[#5d9948]">Join Room</Button>
        </div>
      </div>
    </div>
  );
}

