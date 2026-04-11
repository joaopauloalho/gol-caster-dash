import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-24 pt-4 px-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h1 className="text-2xl font-black text-foreground mb-4">Política de Privacidade</h1>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p><strong className="text-foreground">Última atualização:</strong> Abril de 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Dados coletados</h2>
          <p>Coletamos nome completo, e-mail, CPF, data de nascimento, WhatsApp, estado e cidade para participação no Super Bolão da Copa 2026.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Finalidade</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Identificação e comunicação com o participante</li>
            <li>Emissão de nota fiscal e entrega de prêmios ao ganhador</li>
            <li>Prevenção de fraudes e integridade do bolão</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Compartilhamento</h2>
          <p>Seus dados <strong>não são vendidos ou cedidos</strong> a terceiros. CPF é compartilhado apenas com a autoridade fiscal competente em caso de premiação acima do limite legal.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Seus direitos (LGPD)</h2>
          <p>Você pode solicitar acesso, correção ou exclusão dos seus dados pelo e-mail <strong className="text-foreground">contato@bolao.app</strong> a qualquer momento.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Segurança</h2>
          <p>Os dados são armazenados de forma criptografada no Supabase (infraestrutura AWS) com controle de acesso por RLS (Row Level Security).</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
