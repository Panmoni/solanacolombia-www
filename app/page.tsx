import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Zap, Globe, GraduationCap, Heart, Code, ExternalLink } from "lucide-react";
import { MissionVision } from "@/components/MissionVision";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              Solana Colombia
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto font-light">
              Tu comunidad Solana en Colombia. Comparte, aprende y construye en un espacio abierto y colaborativo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="group">
                <a href="https://t.me/Solana_Colombia" target="_blank">Únete a Telegram</a>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <Users className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Comunidad Vibrante</h3>
            <p className="text-muted-foreground">Conéctate con desarrolladores, creadores y emprendedores construyendo en Solana.</p>
          </div>
          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <Zap className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Velocidad Ultrarrápida</h3>
            <p className="text-muted-foreground">Experimenta la velocidad y eficiencia de la tecnología blockchain de Solana.</p>
          </div>
          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <Globe className="h-12 w-12 text-cyan-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Impacto Global</h3>
            <p className="text-muted-foreground">Sé parte de un movimiento mundial que revoluciona las finanzas digitales.</p>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <Heart className="h-12 w-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Todos Son Bienvenidos</h3>
            <p className="text-muted-foreground">Sin importar tu experiencia, aquí encontrarás un espacio acogedor para crecer y aprender juntos.</p>
          </div>
          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <GraduationCap className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Desarrollo Profesional</h3>
            <p className="text-muted-foreground">Descubre nuevas oportunidades laborales y rutas de crecimiento en la industria blockchain.</p>
          </div>
          <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm">
            <Code className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aprende a Programar</h3>
            <p className="text-muted-foreground">Inicia tu camino como desarrollador con recursos gratuitos y mentorías de la comunidad.</p>
          </div>
        </div>
      </section>

      {/* Meetup Groups Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Próximos Eventos
          </h2>
          <p className="text-lg text-muted-foreground">
            Únete a nuestros grupos y mantente al día con los próximos eventos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <a 
              href="https://www.meetup.com/solanamedellin/" 
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">

                <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Solana Medellín</h3>
              <p className="text-sm text-muted-foreground">
                Eventos presenciales y virtuales en Medellín
              </p>
            </a>

            <a 
              href="https://www.meetup.com/solanabogota/" 
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Solana Bogotá</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra eventos en la capital
              </p>
            </a>

            <a 
              href="https://lu.ma/solanacolombia" 
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Solana Colombia</h3>
              <p className="text-sm text-muted-foreground">
                Eventos para toda Colombia
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Eventos Pasados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div key={num} className="group relative overflow-hidden rounded-xl">
              <Image
                src={`/img/${num}.jpg`}
                alt={`Foto ${num}`}
                width={400}
                height={300}
                className="object-cover w-full h-[300px] transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-semibold">Foto {num}</h3>
                  
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <MissionVision />
    </div>
  );
};

export default Home;