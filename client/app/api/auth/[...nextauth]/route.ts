
import NextAuth from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import CredentialsProvider from 'next-auth/providers/credentials';
import { Next_Auth } from "@/utils/auth";


// export function GET(req:NextRequest,{params}:{params:{
//     authRoutes:string[]
// }}){

//     return NextResponse.json({
//         message:params.authRoutes
 
//   })
// }

const handler=  NextAuth(Next_Auth)


export const GET=handler;

export const POST=handler;