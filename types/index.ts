import {z} from "zod";
import { cartITemSchema, insertCartSchema, insertProductSchema, shippingAddressSchema } from "@/lib/validator";
export type Product = z.infer<typeof insertProductSchema> &{
    id: string;
    rating: string;
    createdAt: Date;
}


export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = z.infer<typeof cartITemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>