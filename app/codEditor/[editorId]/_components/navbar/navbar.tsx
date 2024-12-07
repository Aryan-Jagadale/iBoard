import Image from "next/image"
import Link from "next/link"
import Logo from "@/public/logo.svg"

const Navbar = () => {
  return (
    <div className="h-14 px-2 w-full border-b border-border flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link
          href={"/"}
          className="ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none rounded-sm"
        >
          <Image src={Logo} alt="Logo" width={36} height={36} />
        </Link>
        <div className="text-sm font-medium flex items-center">Sandbox</div>
      </div>
      <div className="flex items-center space-x-4">
        Search
      </div>
    </div>
  )
}

export default Navbar