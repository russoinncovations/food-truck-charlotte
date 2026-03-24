import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#1E1E1E]/10 bg-[#f8f2ea]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="space-y-3">
          <p className="text-[1.15rem] font-semibold text-[#1E1E1E]">
            <span className="text-[#D97A2B]">Food Truck</span> Charlotte
          </p>
          <p className="max-w-md text-[15px] leading-7 text-[#1E1E1E]/75">
            A community-rooted Charlotte guide for discovering food trucks, finding local events, and sending booking inquiries.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-[15px]">
          <Link href="/community" className="text-[#1E1E1E]/75 hover:text-[#1E1E1E]">
            About
          </Link>
          <Link href="/book-a-truck" className="text-[#1E1E1E]/75 hover:text-[#1E1E1E]">
            Contact
          </Link>
          <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="text-[#1E1E1E]/75 hover:text-[#1E1E1E]">
            Instagram
          </a>
          <a href={site.facebookGroupUrl} target="_blank" rel="noreferrer" className="text-[#1E1E1E]/75 hover:text-[#1E1E1E]">
            Facebook Group
          </a>
          <p className="col-span-2 text-[13px] leading-5 text-[#1E1E1E]/55">
            Disclaimer: Food Truck Charlotte is a discovery and inquiry platform. Submitting a form does not guarantee a booking.
          </p>
        </div>
      </div>
    </footer>
  );
}
