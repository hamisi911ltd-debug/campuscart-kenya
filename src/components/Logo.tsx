import logo from "@/assets/logo1.png";

export const Logo = () => (
  <div className="flex items-center gap-2 font-extrabold text-primary">
    <div className="relative flex h-9 w-9 items-center justify-center rounded-full overflow-hidden shadow-elevated">
      <img src={logo} alt="CampusMart" className="h-full w-full object-cover" />
    </div>
    <div className="leading-none">
      <div className="text-base tracking-tight">
        CAMPUS<span className="text-[#7CB342]">MART</span>
      </div>
    </div>
  </div>
);
