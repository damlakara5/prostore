import { APP_NAME } from "@/lib/constants";

const Footer = () => {

    const currentYear = new Date().getFullYear();

    return ( <footer className="border-t bg-sky-950">
        <div className="p-5 flex-center text-white">
            {currentYear} {APP_NAME}. All rights reserved.
        </div>
    </footer> );
}
 
export default Footer;