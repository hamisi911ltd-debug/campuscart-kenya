import logo from "@/assets/logo-badge.png";

export const Logo = () => (
  <div className="flex items-center gap-2 font-extrabold text-primary">
    <div className="relative flex h-9 w-9 items-center justify-center rounded-full overflow-hidden bg-white shadow-elevated">
      <img src={logo} alt="Urban Store" className="h-full w-full object-cover" />
    </div>
    <div className="leading-none">
      <div className="text-base tracking-tight">
        URBAN <span className="text-[#7CB342]">STORE</span>
      </div>
      <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Shop Local. Live Better.
      </div>
    </div>
  </div>
);
