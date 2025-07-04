import { Navbar } from "./_components/navbar";

const LandingPageLayout = ({ children }: {children: React.ReactNode}) => {
    return (
        <div className="">
            <Navbar> 

            </Navbar>
            {children}
        </div>
    )
}

export default LandingPageLayout 