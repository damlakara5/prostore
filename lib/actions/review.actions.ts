'use server';

import { z } from "zod";
import { insertReviewSchema } from "../validator";
import { formatErrors } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";

//Create & Update review

export async function createUpdateReview(data:z.infer<typeof insertReviewSchema>) {
    try {
        const session = await auth();
        
        if(!session) throw new Error('User is not authenticated!')

        //Validate& store the review
        const review= insertReviewSchema.parse({
            ...data,
            userId: session?.user?.id
        })

        //Get product being reviewd
        const product = await prisma.product.findFirst({
            where: {id: review.productId}
        })

        if(!product) throw new Error('Product not found')

        //Check if user already reviewed
        const reviewExists = await prisma.review.findFirst({
            where: { 
                productId: review.productId,
                userId: review.userId
            }
        })

        await prisma.$transaction(async(tx) => {
            if(reviewExists) {
                //Update review
                await tx.review.update({
                    where: { id: reviewExists.id},
                    data: {
                        title: review.title, 
                        description: review.description,
                        rating: review.rating
                    }
                })
            }else{
                //create review
                await tx.review.create({
                    data: review
                })
            }

            //Get avg rating
            const avgRating = await tx.review.aggregate({
                _avg: {
                    rating: true
                },
                where: { productId: review.productId}
            })


            //Get num of the reviews
            const numReviews= await tx.review.count({
                where: {productId: review.productId}
            });

            //Update rating and num reviews in teh product table
            await tx.product.update({
                where: {id: review.productId},
                data: {
                    rating: avgRating._avg.rating || 0,
                    numReviews
                }
            })
        })

        revalidatePath(`/product/${product.slug}`)
        return{
            success: true,
            message: 'Review updated successfully!'
        }
        
    } catch (error) {
        return {
            success: false,
            message: formatErrors(error)
        }
    }
}


// Get all reviews for a product
export async function getReviews({productId}:{productId: string}) {
    const data = await prisma.review.findMany({
        where: {productId: productId},
        include: {
            user:{
                select: {name: true}
            }
        },
        orderBy: {
            createdAt:'desc'
        }
    })

    return {data}
}


//Get a review written by current user
export async function getReviewByProductId({productId}: {productId: string}) {
    const session= await auth();

    if(!session) throw new Error('User is not authenticates')

    return await prisma.review.findFirst({
        where: {
            productId: productId,
            userId: session?.user?.id
        }
    })
}