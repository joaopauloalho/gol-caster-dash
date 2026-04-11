import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface CountryOption {
  displayName: string;
  logoUrl: string;
}

interface CountryComboboxProps {
  options: CountryOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CountryCombobox({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
}: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = options.filter((o) =>
    o.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find((o) => o.displayName === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-muted border-border text-sm font-medium h-11"
        >
          <span className="flex items-center gap-2 truncate">
            {selected?.logoUrl && (
              <img
                src={selected.logoUrl}
                alt=""
                className="w-5 h-4 object-contain shrink-0"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {value || placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 max-h-72 overflow-y-auto" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <div className="flex items-center border-b border-border px-3 py-2 gap-2 sticky top-0 bg-popover z-10">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            placeholder="Buscar seleção..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nenhuma seleção encontrada.
          </p>
        ) : (
          filtered.map((opt) => (
            <button
              key={opt.displayName}
              onClick={() => {
                onChange(opt.displayName);
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left",
                value === opt.displayName && "bg-primary/10 text-primary font-medium"
              )}
            >
              {opt.logoUrl && (
                <img
                  src={opt.logoUrl}
                  alt=""
                  className="w-6 h-4 object-contain shrink-0"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              <span className="flex-1 truncate">{opt.displayName}</span>
              {value === opt.displayName && (
                <Check className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
