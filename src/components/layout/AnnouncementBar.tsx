import React from 'react';

export default function AnnouncementBar() {
  return (
    <div className="bg-black text-white text-xs tracking-widest uppercase py-2 px-4 text-center font-light">
      <div className="container mx-auto flex justify-between items-center text-[10px] md:text-xs">
        <span className="hidden sm:inline-block">IDEAL BEAUTY OFFICIAL &bull; LUXURY COUTURE</span>
        <span className="mx-auto sm:mx-0">
          COMPLIMENTARY EXPRESS SHIPPING ACROSS INDONESIA &bull; RENTAL & BESPOKE TAILORING AVAILABLE
        </span>
        <span className="hidden md:inline-block font-mono">IDR (Rp)</span>
      </div>
    </div>
  );
}
