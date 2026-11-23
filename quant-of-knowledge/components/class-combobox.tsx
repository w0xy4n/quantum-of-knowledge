"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ClassComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}

export function ClassCombobox({
  value,
  onValueChange,
  options,
  id,
  placeholder = "Выберите или введите предмет",
  invalid,
  describedBy,
}: ClassComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const typed = search.trim();
  const showCreate = typed.length > 0 && !options.some((option) => option.toLowerCase() === typed.toLowerCase());

  const commit = (next: string) => {
    onValueChange(next);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn("w-full justify-between font-normal", invalid && "border-destructive")}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск или добавление предмета..." value={search} onValueChange={setSearch} />
          <CommandList>
            {!showCreate && <CommandEmpty>Нет предметов — начните печатать, чтобы добавить.</CommandEmpty>}
            {options.length > 0 && (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option} value={option} onSelect={() => commit(option)}>
                    <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{option}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup>
                <CommandItem value={typed} onSelect={() => commit(typed)}>
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span className="truncate">
                    Использовать <span className="font-medium">"{typed}"</span>
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
