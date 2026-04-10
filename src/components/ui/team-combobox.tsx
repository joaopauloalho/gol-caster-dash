import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { teams, Team } from "@/data/teams";

interface TeamComboboxProps {
  value: string;
  onChange: (value: string) => void;
  dark?: boolean;
}

const TeamLogo = ({ logo, name, size = 20 }: { logo: string; name: string; size?: number }) => {
  if (!logo) return (
    <div
      className="rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {name.charAt(0)}
    </div>
  );
  return (
    <img
      src={logo}
      alt={name}
      width={size}
      height={size}
      className="object-contain flex-shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
};

export function TeamCombobox({ value, onChange, dark = false }: TeamComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => teams.find((t) => t.id === value), [value]);

  const triggerClass = dark
    ? cn(
        "w-full flex items-center gap-2.5 bg-transparent border-b-2 pb-2 text-left transition-colors duration-200 text-base outline-none",
        value && value !== "nenhum" ? "border-emerald-500/60" : "border-white/20"
      )
    : cn(
        "w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm bg-background transition-colors text-left",
        open ? "border-primary/60" : "border-border hover:border-border/80"
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerClass} aria-expanded={open}>
          {selected && (
            <TeamLogo logo={selected.logo} name={selected.name} size={22} />
          )}
          <span className={cn("flex-1 truncate", dark ? (value ? "text-white" : "text-white/30") : (value ? "text-foreground" : "text-muted-foreground"))}>
            {selected?.name ?? "Selecione seu time..."}
          </span>
          {dark
            ? value && value !== "nenhum" && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            : <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-50" />
          }
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]"
        align="start"
        sideOffset={8}
      >
        <Command>
          <div className="flex items-center border-b px-3 gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <CommandInput
              placeholder="Digite o nome do time..."
              className="h-10 text-sm flex-1 bg-transparent outline-none border-none ring-0 focus:ring-0 placeholder:text-muted-foreground"
            />
          </div>
          <CommandList className="max-h-60 overflow-y-auto overscroll-contain">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              Nenhum time encontrado.
            </CommandEmpty>
            <CommandGroup>
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.name}
                  onSelect={() => {
                    onChange(team.id === value ? "" : team.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2.5 cursor-pointer py-2"
                >
                  <TeamLogo logo={team.logo} name={team.name} size={20} />
                  <span className={cn("flex-1 text-sm", team.id === "nenhum" ? "text-muted-foreground italic" : "")}>
                    {team.name}
                  </span>
                  <Check className={cn("w-3.5 h-3.5 flex-shrink-0 text-primary", value === team.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
