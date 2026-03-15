export function Atmosphere() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-ember/25 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 animate-drift rounded-full bg-parchment/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-wine/20 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_0_40%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.38))]" />
    </>
  );
}
