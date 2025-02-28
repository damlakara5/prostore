import DealCountdown from "@/components/deal-countdown";
import IconBoxes from "@/components/icon-boxes";
import ProductList from "@/components/shared/product/product-list";
import ProductCarousel from "@/components/shared/product/product.carousel";
import ViewAllPRoductsBtn from "@/components/view-all-products-btn";
import { getFeaturedProducts, getLatestProducts } from "@/lib/actions/product.actions";


const HomePage = async() => {
  const latestProducts = await getLatestProducts();
  const featuredProducts= await getFeaturedProducts();
  
  return ( <>
    { featuredProducts.length>0 && <ProductCarousel data={featuredProducts} />}
    <ProductList 
      data={latestProducts} 
      title="Newest Arrivals" 
      limit={4} 
    />
   <ViewAllPRoductsBtn />
   <DealCountdown />
   <IconBoxes />
  </> );
}
 
export default HomePage;