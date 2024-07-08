
import { Next_Auth } from "@/utils/auth";
import { db } from "@/utils/db";
import { NextApiRequest, NextApiResponse } from "next";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

import { getServerSession } from "next-auth/next"
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const prisma = new PrismaClient();


// export async function GET(req:NextRequest){



// return NextResponse.json(
//     session
// )
// }
// pages/api/users.ts


// export async function GET(req: NextRequest, res: NextResponse) {
//   try {

//     const users = await db.user.findMany();
//     return NextResponse.json({ users });
//   } catch (error) {
//     console.error('Error querying users:', error);
//     return NextResponse.json({ error: 'Error fetching users' });
//   }
// }


export  async function GET(req: NextRequest, res: NextResponse) {
  
  const session = await getServerSession(Next_Auth)
  console.log(session)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' });
  }
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' });
  }
  const email = session.user.email;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' } 
  );

 return NextResponse.json({ token ,user});
}
