import { Nav } from "@/components/Nav";

const LandingPageLayout = ({ children }: {children: React.ReactNode}) => {
    return (
        <div className="">
            <Nav> 

            </Nav>
            {children}
        </div>
    )
}

export default LandingPageLayout 