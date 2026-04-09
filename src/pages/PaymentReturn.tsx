import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);

  const status = searchParams.get("status");
  const paymentId = searchParams.get("payment_id");
  const externalRef = searchParams.get("external_reference");

  useEffect(() => {
    if (status !== "approved" || !user) {
      setChecking(false);
      return;
    }

    // Aguarda o webhook processar e faz polling na subscription
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from("subscriptions")
        .select("payment_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.payment_status === "active" || attempts >= 8) {
        clearInterval(interval);
        setChecking(false);
        if (data?.payment_status === "active") {
          setTimeout(() => navigate("/jogos"), 2000);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [status, user, navigate]);

  if (status === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          {checking ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <h1 className="text-xl font-black text-foreground">Confirmando pagamento...</h1>
              <p className="text-sm text-muted-foreground">Aguarde um instante.</p>
            </>
          ) : (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <h1 className="text-xl font-black text-foreground">Pagamento aprovado!</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo ao Super Bolão da Copa 2026. Redirecionando...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <Clock className="w-12 h-12 mx-auto text-yellow-500" />
          <h1 className="text-xl font-black text-foreground">Pagamento em análise</h1>
          <p className="text-sm text-muted-foreground">
            Seu pagamento está sendo processado. Você receberá uma confirmação em breve.
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn-gold w-full py-3 rounded-xl font-bold text-sm"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <XCircle className="w-12 h-12 mx-auto text-red-500" />
        <h1 className="text-xl font-black text-foreground">Pagamento não concluído</h1>
        <p className="text-sm text-muted-foreground">
          Houve um problema com seu pagamento. Tente novamente.
        </p>
        <button
          onClick={() => navigate("/planos")}
          className="btn-gold w-full py-3 rounded-xl font-bold text-sm"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
};

export default PaymentReturn;
