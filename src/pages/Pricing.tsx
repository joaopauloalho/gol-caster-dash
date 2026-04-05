import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Zap, Crown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    id: "pro-avista",
    name: "Pro à Vista",
    price: "R$ 250",
    priceDetail: "pagamento único",
    amount: 25000,
    highlight: true,
    badge: "MELHOR PREÇO",
    features: [
      "Acesso a 104 jogos",
      "8 palpites por jogo",
      "Ranking em tempo real",
      "Concorra à Hilux 0km",
      "Multiplicadores até 10x",
    ],
  },
  {
    id: "pro-parcelado",
    name: "Pro Parcelado",
    price: "3x R$ 100",
    priceDetail: "total R$ 300",
    amount: 30000,
    highlight: false,
    badge: null,
    features: [
      "Acesso a 104 jogos",
      "8 palpites por jogo",
      "Ranking em tempo real",
      "Concorra à Hilux 0km",
      "Multiplicadores até 10x",
    ],
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive, simulatePayment } = useSubscription();

  const handleSelect = async (plan: typeof plans[0]) => {
    if (!user) {
      toast.error("Faça login primeiro para assinar o plano.");
      navigate("/auth");
      return;
    }
    if (isActive) {
      toast.info("Você já possui um plano ativo!");
      navigate("/jogos");
      return;
    }
    // Simulate payment for now
    const error = await simulatePayment(plan.id, plan.amount);
    if (error) {
      toast.error("Erro ao processar pagamento.");
    } else {
      toast.success("Pagamento confirmado! Bem-vindo ao Bolão!");
      navigate("/jogos");
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-4 px-4">
      <button
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Crown className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-2xl font-black text-foreground">Escolha seu Plano</h1>
          <p className="text-sm text-muted-foreground">
            Assine e concorra a uma <strong className="text-primary">Hilux 0km</strong>
          </p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all ${
                plan.highlight
                  ? "ring-2 ring-primary shadow-[var(--shadow-gold)]"
                  : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-bl-lg">
                  {plan.badge}
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {plan.highlight ? (
                    <Zap className="w-5 h-5 text-primary" />
                  ) : (
                    <Crown className="w-5 h-5 text-muted-foreground" />
                  )}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.priceDetail}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-black text-foreground">{plan.price}</div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelect(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    plan.highlight
                      ? "btn-gold"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {isActive ? "Plano Ativo ✓" : "Simular Pagamento Concluído"}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          Integração com Stripe em breve. Botão simula confirmação para testes.
        </p>
      </div>
    </div>
  );
};

export default Pricing;
