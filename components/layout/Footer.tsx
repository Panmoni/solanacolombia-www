import Link from 'next/link';
import { FaXTwitter } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { FaTelegram } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Solana Colombia</h3>
            <p className="text-sm text-muted-foreground">
              Construyendo futuro con Web3 en Colombia
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold mb-4">Comunidad</h4>
            <ul className="space-y-2">
              <li><a href="https://www.meetup.com/solanamedellin/" className="text-sm text-muted-foreground hover:text-primary">Medellín</a></li>
              <li><a href="https://www.meetup.com/solanabogota/" className="text-sm text-muted-foreground hover:text-primary">Bogotá</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2">
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold mb-4">Síguenos</h4>
            <div className="flex space-x-4">
              <Link href="https://x.com/Solana_Colombia" className="text-muted-foreground hover:text-primary transition-colors">
                <FaXTwitter size={20} />
              </Link>
              <Link href="https://github.com/Panmoni/solanacolombia-www" className="text-muted-foreground hover:text-primary transition-colors">
                <FaGithub size={20} />
              </Link>
              <Link href="https://t.me/Solana_Colombia" className="text-muted-foreground hover:text-primary transition-colors">
                <FaTelegram size={20} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            ¿Dudas? Escríbenos a <a href="mailto:hello@panmoni.com" className="text-primary hover:text-primary/80 transition-colors">hello@panmoni.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}