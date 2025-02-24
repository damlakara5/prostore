import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import ProductPrice from "./product-price";
import { Product } from "@/types";
import Rating from "./rating";

const ProductCard = ({product}: {product:Product}) => {
    console.log(product);

    
    return ( <Card className="w-full max-q-sm">
        <CardHeader className="items-center p-0">
            <Link href={`/product/${product.slug}`}>
                <Image src={product.images[0]} alt={product.name} height={300} width={300} priority>
                </Image>
            </Link>
        </CardHeader>
        <CardContent className="p-4 grid gap-4">
            <div className="text-xs">{product.brand}</div>
            <Link href={`/product/${product.slug}`}>
                <h2 className="text-sm font-medium">{product.name} </h2>
            </Link>
            <div className="flex-between gap-4">
                <Rating value={Number(product.rating)} />
                {product.stock > 0 ? (
                    <ProductPrice value={Number(product.price)} />
                ) : (
                    <p className="text-destructive">Out of the stock</p>
                )}
            </div>
        </CardContent>
    </Card> );
}
 
export default ProductCard;