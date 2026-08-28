import logo from "@/assets/logo-badge.png";

export const Logo = () => (
  <div className="flex items-center gap-2">
    <img
      src={logo}
      alt="CampusMart"
      className="h-8 w-8 shrink-0 rounded-full bg-white object-cover shadow-sm sm:h-9 sm:w-9"
    />
    <div className="flex flex-col justify-center leading-none">
      <span className="text-[15px] font-extrabold tracking-tight text-primary sm:text-base">
        CAMPUS<span className="text-[#7CB342]">MART</span>
      </span>
      <span className="mt-[3px] whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[8px] sm:tracking-[0.15em]">
        Shop Local. Live Better.
      </span>
    </div>
  </div>
);
