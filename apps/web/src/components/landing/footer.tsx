import Link from "next/link";
import { Zap } from "lucide-react";

const links = {
  Produto: ["Funcionalidades", "Preços", "Marketplaces", "Roadmap", "Changelog"],
  Recursos: ["Documentação API", "Blog", "Tutoriais", "Status"],
  Empresa: ["Sobre", "Contato", "Privacidade", "Termos"],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">MineraçãoPro</span>
            </Link>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              A plataforma mais completa de mineração de produtos para dropshipping, afiliados e e-commerce no Brasil.
            </p>
          </div>
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-white text-sm mb-4">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">© 2024 MineraçãoProdutos. Todos os direitos reservados.</p>
          <p className="text-sm text-white/30">Feito com ❤️ no Brasil</p>
        </div>
      </div>
    </footer>
  );
}
