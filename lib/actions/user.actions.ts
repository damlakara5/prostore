'use server'

import { shippingAddressSchema, signInFormSchema, signUpFormSchema } from "../validator";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/db/prisma";
import { hashSync } from "bcrypt-ts-edge";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { formatErrors } from "../utils";
import { ShippingAddress } from "@/types";


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
        user.password = hashSync(user.password, 10);

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