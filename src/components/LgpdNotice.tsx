/**
 * LgpdNotice — aviso de uso de dados pessoais (CPF/WhatsApp)
 * Exibido no step "document" do OnboardingWizard antes de coletar CPF.
 */
const LgpdNotice = () => (
  <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
    <p className="font-semibold text-foreground">Por que pedimos esses dados?</p>
    <p>
      <strong>CPF</strong> é exigido para emissão de nota fiscal e verificação de identidade
      do ganhador do prêmio, conforme legislação fiscal brasileira.
    </p>
    <p>
      <strong>WhatsApp</strong> é usado exclusivamente para comunicação sobre premiação e
      atualização do bolão. Não compartilhamos com terceiros.
    </p>
    <p>
      Seus dados são tratados conforme a{" "}
      <a href="/privacidade" className="underline text-primary hover:text-primary/80">
        Política de Privacidade
      </a>{" "}
      (LGPD — Lei 13.709/2018).
    </p>
  </div>
);

export default LgpdNotice;
