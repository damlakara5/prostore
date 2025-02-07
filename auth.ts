import NextAuth from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import {prisma} from "./db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";

export const config = {
    pages: {
        signIn :"/sign-in",
        error :"/sign-in",
    },
    session : {
        strategy : 'jwt',
        maxAge: 30 * 24 * 60 * 60, //30 days
    },
    adapter : PrismaAdapter(prisma),
    providers: [CredentialsProvider({
        credentials: {  //fields we want
            email: { type : 'email'},
            password: { type : 'password'},
        },
        async authorize(credentials) {
            if (credentials === null) return null;

            //Find user in db
            const user = await prisma.user.findFirst({
                where: {
                    email: credentials.email as string
                }
            });

            //check if user exists and password matches
            if(user && user.password){
                const isMatched = compareSync(credentials.password as string, user.password)  //password that we get from the user and the password from the db
                
                //If password is correct return user
                if(isMatched){
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                }

                
            }
            //IF user doesn't exist or password doesn't match return null
            return null;
        }
    })
    ],
    callbacks: {  // run certain times, for example this runs when a session is accessed
        async session ({session, user, trigger, token}: any){

            //Set the user id from the token
            session.user.id = token.sub;

            //If there is update set the user name
            //user can change their name, when they change it in the db change it on the session too
            if(trigger === 'update'){
                session.user.name = user.name
            }
            return session
        }
    }
} satisfies NextAuthConfig;

export const {handlers, auth, signIn, signOut} = NextAuth(config);