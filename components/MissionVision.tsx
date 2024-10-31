import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function MissionVision() {
  const visionPoints = [
    "Una comunidad fuerte y cohesionada de entusiastas y constructores de Solana en toda Colombia, unidos por valores compartidos de descentralización, innovación y empoderamiento económico.",
    "Soluciones basadas en Solana abordando problemas del mundo real en Colombia, desde remesas y pagos transfronterizos hasta gestión de cadenas de suministro y transparencia gubernamental.",
    "Una red de programas educativos y recursos que hagan el desarrollo Web3 accesible para colombianos de todos los orígenes.",
    "Hackathons, conferencias y eventos regulares que muestren el talento colombiano y atraigan la atención internacional al ecosistema Solana en Colombia.",
    "Adopción generalizada de aplicaciones basadas en Solana entre los ciudadanos colombianos, impulsando la inclusión financiera y las oportunidades económicas para millones.",
    "Colombia convertida en un centro global para el desarrollo en Solana, con múltiples startups y proyectos exitosos que han logrado ajuste producto-mercado y obtenido financiación significativa.",
    "Un ecosistema próspero de más de 100,000 desarrolladores, emprendedores e innovadores construyendo en Solana en toda Colombia.",
    "Solana convirtiéndose en un motor clave de la economía digital de Colombia, contribuyendo al aumento del crecimiento del PIB y posicionando al país como líder en innovación blockchain en América Latina.",
    "Alianzas con universidades, empresas y entidades gubernamentales para integrar la tecnología Solana en varios sectores de la economía colombiana.",
    "Un entorno regulatorio favorable que fomente la innovación blockchain mientras protege a los consumidores y promueve el crecimiento responsable de la industria."
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="space-y-16">
        {/* Mission Section */}
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Nuestra Misión
          </h2>
          <Card className="p-8 bg-card/50 backdrop-blur-sm">
            <p className="text-lg text-muted-foreground leading-relaxed">
              La misión de Solana Colombia es empoderar a individuos y empresas en todo el país con las herramientas, el conocimiento y los recursos necesarios para construir productos Web3 innovadores en Solana, fomentando el crecimiento económico, la inclusión financiera y el avance tecnológico para todos los colombianos.
            </p>
          </Card>
        </div>

        {/* Vision Section */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Nuestra Visión para 2030
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visionPoints.map((point, index) => (
              <Card 
                key={index} 
                className="p-6 bg-card/50 backdrop-blur-sm flex gap-4 items-start transition-all duration-300 hover:shadow-lg hover:bg-card/80"
              >
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-muted-foreground leading-relaxed">
                  {point}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}