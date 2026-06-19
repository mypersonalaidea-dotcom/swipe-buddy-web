import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface SearchableSelectProps {
    options: string[]
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    alwaysShowOther?: boolean
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyText = "No option found.",
    alwaysShowOther = false,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const sortedOptions = React.useMemo(() => {
        const hasOther = options.includes("Other");
        const listToSort = options.filter(opt => opt !== "Other");
        const sorted = [...listToSort].sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
        if (hasOther && !alwaysShowOther) {
            sorted.push("Other");
        }
        return sorted;
    }, [options, alwaysShowOther]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between px-3 h-10 font-normal"
                >
                    {value ? value : <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput 
                        placeholder={searchPlaceholder} 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && searchQuery.trim() && alwaysShowOther) {
                                const hasMatch = options.some(opt => 
                                    opt.toLowerCase() === searchQuery.trim().toLowerCase()
                                );
                                if (!hasMatch) {
                                    e.preventDefault();
                                    onValueChange("Other");
                                    setOpen(false);
                                }
                            }
                        }}
                    />
                    <div className="max-h-[260px] overflow-y-auto">
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {sortedOptions.filter(opt => !alwaysShowOther || opt !== "Other").map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                        const originalOption = options.find((opt) => opt.toLowerCase() === currentValue.toLowerCase()) || currentValue
                                        onValueChange(originalOption === value ? "" : originalOption)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    </div>
                    {alwaysShowOther && (
                        <div className="p-1.5 bg-background border-t border-border/50 flex justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    onValueChange(value === "Other" ? "" : "Other")
                                    setOpen(false)
                                }}
                                className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground font-normal flex items-center justify-between transition-colors cursor-pointer"
                            >
                                <span className="flex items-center">
                                    <span className="font-semibold text-primary">Other</span>
                                    <span className="ml-1.5 text-xs text-primary/60">(Add in list)</span>
                                </span>
                                <Plus className="w-4 h-4 text-primary opacity-60" />
                            </button>
                        </div>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    )
}
