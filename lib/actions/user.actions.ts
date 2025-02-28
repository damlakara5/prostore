'use server'

import { paymentMethodSchema, shippingAddressSchema, signInFormSchema, signUpFormSchema, updateUserSchema } from "../validator";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/db/prisma";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { formatErrors } from "../utils";
import { ShippingAddress } from "@/types";
import { z } from "zod";
import { PAGE_SIZE } from "../constants";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {hash} from "../encrypt";

//Sign in user with credentials (using credentials ptovider)

export async function signInWithCredentials(prevState:unknown, formData: FormData) {
    try{

        const user = signInFormSchema.parse({
            email: formData.get("email"),
            password: formData.get("password")
        });

        console.log(user)
        await signIn('credentials', user);

        return {
            success: true,
            message: "Signed in successfully"
        }
    }catch(error)
    {
        if(isRedirectError(error)){
            throw error
        }

        console.log(error)
        return {
            success: false,
            message: "Invalid email or password"
        }
    }
}


//sign out the user
export async function signOutUser() {
    await signOut()
}

export async function signUpUser(prevState: unknown, formData: FormData) {  //useAction ile kullanacağımız için ilk parametre prevState
    try {
        //validate the user brought with action
        const user = signUpFormSchema.parse({
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            confirmPassword: formData.get("confirmPassword"),
        } );

        const plainPassword = user.password;
        //hash the password before putting in db
        user.password = await hash(user.password);

        //add to the db
        await prisma.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: user.password
            }
        });


        await signIn('credentials',{
            email: user.email,
            password: plainPassword
        })

        return {
            success: true,
            message: 'User registered successfully'
        }
    } catch (error) {
        
        if(isRedirectError(error)){
            throw error
        }

        return {
            success: false,
            message: formatErrors(error)
        }
    }
}



//Get user by the ID
export async function getUserById(userId:string) {
    const user = await prisma.user.findFirst({
        where: {id: userId}
    });

    if(!user) throw new Error('User not found')

    return user;
}


//Update users address
export  async function updateUserAddress(data: ShippingAddress){
    try {
        const session = await auth()
        const currentUser = await prisma.user.findFirst({
            where: { id: session?.user?.id}
        })

        if(!currentUser) throw new Error('User not found!')
        const address = shippingAddressSchema.parse(data);

        await prisma.user.update({
            where: {id : currentUser.id},
            data: {address}
        })


        return{
            success: true,
            message: 'User updated successfully'
        }
    } catch (error) {
        return {
            success: false,
            message: formatErrors(error)
        }
    }
}


//Update users payment method
export async function updateUserPaymentMethod(data: z.infer<typeof paymentMethodSchema>) {
    try {
        const session = await auth();
        const currentUser = await prisma.user.findFirst({
            where: {id: session?.user?.id}
        });

        if(!currentUser) throw new Error('User not found.');

        const paymentMethod = paymentMethodSchema.parse(data);

        await prisma.user.update({
            where: {id: currentUser.id},
            data: { paymentMethod: paymentMethod.type}
        });


        return  {
            success: true,
            message: 'User updated successfully'
        };
        
    } catch (error) {
        return {
            success: false,
            message: formatErrors(error)
        }
    }
}



//Uodate the user profile
export async function updateProfile(user: {
    name: string,
    email: string
}) {
    try {


        const session = await auth();
        const currentUSer = await prisma.user.findFirst({
            where: {id: session?.user?.id}
        })


        if(!currentUSer) throw new Error('User not found');

        await prisma.user.update({
            where: {id: currentUSer.id},
            data: {name: user.name}
        });


        return {
            success: true,
            message: 'User updated successfully'
        }
        
    } catch (error) {
        return {
            success: false,
            message: formatErrors(error)
        }
    }
}

//Get all users
export async function getAllUsers({
    limit= PAGE_SIZE,
    page,
    query
}:{
    limit?: number,
    page: number,
    query:string
}) {

      const queryFilter: Prisma.UserWhereInput = query && query !== 'all' ? {
              name: {
                contains: query,
                mode: 'insensitive'
              } as Prisma.StringFilter
            
          } : {}

    const data = await prisma.user.findMany({
        where: {
            ...queryFilter
        },
        orderBy: {createdAt: 'desc'},
        take: limit,
        skip: (page-1) * limit
    })

    const dataCount = await prisma.user.count()

    return {
        data,
        totalPages: Math.ceil(dataCount / limit)
    }
    
}



//Delete a user
export async function deleteUser(id:string) {
    try {
        await prisma.user.delete({where: {id}});

        revalidatePath('/admin/users');

        return {
            success: true,
            message: 'User deleted successfully'
        }
    } catch (error) {
        return {
            success: false,
            message: formatErrors(error)
        }
    }
}


//Update a user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
    try {
        await prisma.user.update({
            where: {id: user.id},
            data: {
                name: user.name,
                role:user.role
            }
        })


        revalidatePath('/admin/users')

        return {
            success: true,
            message: 'User updated successfully'
        }
        
    } catch (error) {
        return {
            success: false,
            message: formatErrors(error)
        }
    }
}