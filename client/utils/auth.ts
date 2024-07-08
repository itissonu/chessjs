import { PrismaClient } from '@prisma/client';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from '@next-auth/prisma-adapter';
const prisma = new PrismaClient();

export const Next_Auth = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Email", type: "text", placeholder: "Enter the user name" },
                password: { label: "Password", type: "password", placeholder: "Enter the password" }
            },
            async authorize(credentials: any) {

                return {
                    id: credentials.username,
                    name: credentials.username,
                    email: `${credentials.username}@example.com`,
                    type: "user"
                };
            },
        }),

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        })

    ],
  
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile }:any) {
            // console.log('SignIn Callback:', user, account, profile);

            if (account.provider === 'google') {
                
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name,
                            provider:  (account.provider).toUpperCase(),
                           
                           
                        },
                    });
                }
            }
            return true;
          },
        jwt: ({ token, user }: any) => {
           // console.log(user)
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.type = user.type;
            }
            return token;

        },
        session: ({ session, token, user }: any) => {

            if (session && session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.type = token.type;
            }
            //console.log(session)
            return session;

        }
    },
    pages: {
        signIn: '/signin',
    },

}


