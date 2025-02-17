import { getOrderByID } from "@/lib/actions/order.actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderDetailsTable from "./order-details-table";
import { ShippingAddress } from "@/types";



export const metadata : Metadata = {
    title: 'Order'
}


const OrderDetailsPage = async (props: {
    params: Promise<{
        id: string
    }>
}) => {
    const {id} = await props.params;

    const order = await getOrderByID(id);
    if(!order) notFound();


    return ( <OrderDetailsTable order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress
    }} /> );
}
 
export default OrderDetailsPage;