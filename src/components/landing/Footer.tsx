import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-white/10 py-6 bg-[#0A0A0A]">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
        <div className="flex items-center gap-3">
          <Logo />
          <span>© {new Date().getFullYear()} Batuca</span>
        </div>
        <p>
          Foto:{" "}
          <a
            href="https://www.pexels.com/pt-br/foto/guitarrista-se-apresentando-na-calcada-20185314/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Pexels
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
