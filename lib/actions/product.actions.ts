'use server'
import { convertToPlainObject, formatErrors } from "../utils";
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "../constants";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { insertProductSchema, updateProductSchema } from "../validator";

//Get latest products

export async function getLatestProducts() {
    const data = await prisma.product.findMany({
        take: LATEST_PRODUCTS_LIMIT,
        orderBy: {createdAt: 'desc'}
    });

    return convertToPlainObject(data);
}


//get single product by its slug
export async function getProductBySlug(slug: string) {
    return await prisma.product.findFirst({
        where: {slug: slug}
    })
}   

//get single product by its id
export async function getProductById(id: string) {
    const data = await prisma.product.findFirst({
        where: {id}
    })

    return convertToPlainObject(data)
}   





//get all products 
export async function getAllProducts({
    query,
    limit = PAGE_SIZE,
    page,
    category
}: {
    query: string,
    limit?: number,
    page:number,
    category? :string
}) {
    
    const data = await prisma.product.findMany({
        orderBy: {createdAt: 'desc'},
        skip: (page -1) * limit,
        take: limit
    })


    const dataCount = await prisma.product.count();


    return {
        data,
        totalPages: Math.ceil(dataCount / limit)
    }
}



//delete a product
export async function deleteProduct(id:string) {
    try {
        

        const productExist = await prisma.product.findFirst({
            where: {id}
        })

        if(!productExist) throw new Error('Product not found')


        await prisma.product.delete({
            where: {id}
        })

        revalidatePath('/admin/products')

        return {success: true, message: 'Product deleted successfully'}


    } catch (error) {
        return {success: false, message: formatErrors(error)}
    }
}


//create a product

export async function createProduct(data: z.infer<typeof insertProductSchema>) {
    try {
       const product = insertProductSchema.parse(data);

       await prisma.product.create({
        data: product
       })

        revalidatePath('/admin/products')

        return {success: true, message: 'Product created successfully'}


    } catch (error) {
        return {success: false, message: formatErrors(error)}
    }
}


//update a product
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
    try {
       const product = updateProductSchema.parse(data);

        const productExists = await prisma.product.findFirst({
            where: {id: product.id}
        })

        if(!productExists) throw new Error('Product not found  ')

        await prisma.product.update({
            where: {id: product.id},
            data: product
        });

        revalidatePath('/admin/products')

        return {success: true, message: 'Product updated successfully'}

    } catch (error) {
        return {success: false, message: formatErrors(error)}
    }
}