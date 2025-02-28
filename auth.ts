/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import {prisma} from "./db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import {cookies} from "next/headers";
import { NextResponse } from "next/server";
import { compare } from "./lib/encrypt";

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
                const isMatched = await compare(credentials.password as string, user.password)  //password that we get from the user and the password from the db
                
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
            session.user.role = token.role; 
            session.user.name = token.name;

            //If there is update set the user name
            //user can change their name, when they change it in the db change it on the session too
            if(trigger === 'update'){
                session.user.name = user.name
            }
            return session
        },
        async jwt({token, user, trigger, session}: any){
            //Assign user fields to the token
            if(user){
                token.role = user.role;
                token.id = user.id;

                console.log(token,"token")
                //If user has no name use the email
                if(user.name === 'NO_NAME'){
                    token.name = user.email!.split("@")[0]

                    //Update the db to reflect the token name
                    await prisma.user.update({
                        where: {id: user.id},
                        data: {name: token.name}
                    })
                }
                if(trigger === 'signIn' || trigger === 'signUp'){
                    const cookiesObject = await cookies();
                    const sessionCartId = cookiesObject.get('sessionCartId')?.value;

                    if(sessionCartId){
                        const sessionCart = await prisma.cart.findFirst({
                            where: {sessionCartId: sessionCartId}
                        });

                        if(sessionCart){
                            //delete current user cart
                            await prisma.cart.deleteMany({
                                where: {userId: user.id}
                            });

                            //assing new cart
                            await prisma.cart.update({
                                where: {id: sessionCart.id},
                                data: {userId: user.id}
                            })
                        }
                    }
                }
            }

            //Handle session updates
            if(session?.user.name && trigger === 'update'){
                token.name= session.user.name
            }
            return token
        },
        authorized( {request, auth}:any){
            //Array of regex patterns of paths we want to protect
            const protectedPaths =  [
                /\/shipping-address/,
                /\/payment-method/,
                /\/place-order/,
                /\/profile/,
                /\/user\/(.*)/,
                /\/order\/(.*)/,
                /\/admin/,
            ]

            //Get pathname from req url object
            const {pathname} = request?.nextUrl;

            //check if user is not authenticated and accessing a protected path
            if(!auth && protectedPaths.some((p) => p.test(pathname) )) return false;
            
            
            //Check for session cart cookie
            if(!request.cookies.get('sessionCartId')){
                //Generate new session cart id cookie
                const sessionCartId = crypto.randomUUID();

                // Clone request headers
                const newRequestHeaders= new Headers(request.headers);

                //create new response add the new headers
                const response = NextResponse.next({
                    request: {
                        headers: newRequestHeaders
                    }
                });

                //Set newly generated sessionCartId in the response cookies
                response.cookies.set('sessionCartId', sessionCartId);

                return response
            }else{
                return true
            }
        }
    }
} satisfies NextAuthConfig;

export const {handlers, auth, signIn, signOut} = NextAuth(config);