import { Navbar } from "./_components/navbar";
import { ScrollToTop } from "./_components/scroll-to-top";

const LandingPageLayout = ({ children }: {children: React.ReactNode}) => {
    return (
        <div className="">
            <Navbar />
            <div className="pt-20">
                {children}
            </div>
            <ScrollToTop />
        </div>
    )
}

export default LandingPageLayout 