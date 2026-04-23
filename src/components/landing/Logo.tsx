import { cn } from "@/lib/utils";

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/logo-batuca.svg" alt="Batuca" className="h-14 w-14 rounded-2xl" />
    </div>
  );
};

export default Logo;
