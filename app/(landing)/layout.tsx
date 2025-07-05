import { Navbar } from "./_components/navbar";

const LandingPageLayout = ({ children }: {children: React.ReactNode}) => {
    return (
        <div className="">
            <Navbar />
            <div className="pt-20">
                {children}
            </div>
        </div>
    )
}

export default LandingPageLayout 