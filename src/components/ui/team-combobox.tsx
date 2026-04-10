import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { teams, Team } from "@/data/teams";

interface TeamComboboxProps {
  value: string;
  onChange: (value: string) => void;
  /** Dark mode override — used inside the onboarding wizard */
  dark?: boolean;
}

export function TeamCombobox({ value, onChange, dark = false }: TeamComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => teams.find((t) => t.id === value), [value]);

  const triggerClass = dark
    ? cn(
        "w-full flex items-center justify-between gap-2 bg-transparent border-b-2 pb-2 text-left transition-colors duration-200 text-lg outline-none",
        value ? "border-emerald-500/60 text-white" : "border-white/20 text-white/30"
      )
    : cn(
        "w-full flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm bg-background transition-colors",
        open ? "border-primary/50" : "border-border hover:border-border/80",
        value ? "text-foreground" : "text-muted-foreground"
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerClass} aria-expanded={open}>
          <span className="truncate">{selected?.name ?? "Selecione seu time..."}</span>
          {dark
            ? value && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            : <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-60" />
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
          <CommandList className="max-h-56 overflow-y-auto overscroll-contain">
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
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Check className={cn("w-3.5 h-3.5 flex-shrink-0", value === team.id ? "opacity-100 text-primary" : "opacity-0")} />
                  <span className={cn("text-sm", team.id === "nenhum" ? "text-muted-foreground italic" : "")}>
                    {team.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
