import Image from "next/image.js";
import Link from "next/link.js";
import logo from "@/public/logo.png";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-4 z-10">
      {/* <Image src="/logo.png" alt="logo" height="60" width="60" /> */}
      <Image src={logo} alt="logo" height="60" quality={80} width="60" />
      <span className="hidden sm:inline text-xl font-semibold text-primary-100">
        The Wild Oasis
      </span>
    </Link>
  );
}

export default Logo;
