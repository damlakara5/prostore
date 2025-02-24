import Link from "next/link";
import { Button } from "./ui/button";

const ViewAllPRoductsBtn = () => {
    return ( <div className="flex justify-center items-center my-8">
        <Button asChild className="px-8 py-4 font-semibold text-lg ">
            <Link href='/search'>View All Products</Link>
        </Button>
    </div> );
}
 
export default ViewAllPRoductsBtn;