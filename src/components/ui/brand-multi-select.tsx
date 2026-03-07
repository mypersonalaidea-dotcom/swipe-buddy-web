import React, { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/ui/media-upload";
import { useToast } from "@/components/ui/use-toast";

export interface BrandOption {
    id: string;
    name: string;
    logo?: string;
    aliases?: string[];
}

interface BrandMultiSelectProps {
    label: string;
    icon?: React.ReactNode;
    placeholder?: string;
    options: BrandOption[];
    selectedValues: string[];
    onSelectedValuesChange: (values: string[]) => void;
    onAddNewBrand: (brand: Omit<BrandOption, "id">) => void;
    mode?: "single" | "multiple";
}

export function BrandMultiSelect({
    label,
    icon,
    placeholder = "Search...",
    options,
    selectedValues,
    onSelectedValuesChange,
    onAddNewBrand,
    mode = "multiple",
}: BrandMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { toast } = useToast();

    // Add form state
    const [addName, setAddName] = useState("");
    const [addAliases, setAddAliases] = useState("");
    const [addMedia, setAddMedia] = useState<any[]>([]);
    const [nameError, setNameError] = useState("");
    const [mediaError, setMediaError] = useState("");

    const handleSelect = (id: string) => {
        if (mode === "single") {
            if (selectedValues.includes(id)) {
                onSelectedValuesChange([]);
            } else {
                onSelectedValuesChange([id]);
            }
            setOpen(false);
        } else {
            if (selectedValues.includes(id)) {
                onSelectedValuesChange(selectedValues.filter((v) => v !== id));
            } else {
                onSelectedValuesChange([...selectedValues, id]);
            }
        }
    };

    const handleRemove = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onSelectedValuesChange(selectedValues.filter((v) => v !== id));
    };

    const openAddModal = (query: string) => {
        // Validate if query meets the regex (only alphabets and spaces)
        const isValid = /^[A-Za-z\s]+$/.test(query);
        setAddName(isValid ? query : "");
        setNameError("");
        setAddMedia([]);
        setMediaError("");
        setOpen(false); // close combobox
        setIsAddModalOpen(true);
    };

    const handleAddSubmit = () => {
        // Validation
        let hasError = false;

        if (addMedia.length === 0) {
            setMediaError("Please upload a logo.");
            hasError = true;
        } else {
            setMediaError("");
        }

        if (!addName.trim()) {
            setNameError("Name is required");
            hasError = true;
        } else if (!/^[A-Za-z\s]+$/.test(addName)) {
            setNameError("Only space and alphabets allowed, no special characters or numbers.");
            hasError = true;
        } else {
            setNameError("");
        }

        if (hasError) return;


        const aliasesArray = addAliases
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);

        // Mock ID creation for local state
        const newBrand = {
            name: addName.trim(),
            aliases: aliasesArray,
            logo: addMedia.length > 0 ? addMedia[0].url : undefined,
        };

        onAddNewBrand(newBrand);
        toast({
            title: "✨ Added to DB!",
            description: (
                <>
                    Sweet, you just added {newBrand.name}.<br />
                    Thanks for keeping our community updated!
                </>
            ),
        });
        setIsAddModalOpen(false);
    };

    return (
        <div className="space-y-2">
            {label && (
                <Label className="flex items-center gap-2 h-5">
                    {icon}
                    {label}
                </Label>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between px-3 py-2 hover:bg-transparent font-normal",
                            mode === "single" ? "h-10" : "min-h-10 h-auto"
                        )}
                    >
                        <div className={cn("flex gap-1 w-full max-w-full overflow-hidden text-left font-normal items-center", mode === "multiple" ? "flex-wrap" : "flex-nowrap truncate")}>
                            {selectedValues.length === 0 ? (
                                <span className="text-muted-foreground truncate">{placeholder}</span>
                            ) : mode === "single" ? (
                                (() => {
                                    const val = selectedValues[0];
                                    const option = options.find((o) => o.id === val);
                                    return (
                                        <div className="flex items-center gap-2 truncate">
                                            {option?.logo && (
                                                <img
                                                    src={option.logo}
                                                    alt={`${option.name} logo`}
                                                    className="w-5 h-5 object-contain bg-white rounded-sm shrink-0"
                                                />
                                            )}
                                            <span className="truncate">{option ? option.name : val}</span>
                                        </div>
                                    );
                                })()
                            ) : (
                                selectedValues.map((val) => {
                                    const option = options.find((o) => o.id === val);
                                    return (
                                        <Badge
                                            key={val}
                                            variant="secondary"
                                            className="mr-1 mb-1 font-normal select-none"
                                        >
                                            {option?.logo && (
                                                <img
                                                    src={option.logo}
                                                    alt={`${option.name} logo`}
                                                    className="w-4 h-4 mr-1.5 object-contain bg-white rounded-sm"
                                                />
                                            )}
                                            {option ? option.name : val}
                                            <span
                                                className="ml-1 rounded-full p-0.5 hover:bg-accent hover:text-foreground inline-flex cursor-pointer"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleRemove(e as any, val);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </span>
                                        </Badge>
                                    );
                                })
                            )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder={placeholder}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty className="p-4 text-center space-y-3">
                                <p className="text-sm text-muted-foreground">No matching results found.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() => openAddModal(searchQuery)}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add "{searchQuery}" to DB
                                </Button>
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={[option.name, ...(option.aliases || [])].join(" ")}
                                        onSelect={() => handleSelect(option.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedValues.includes(option.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex items-center gap-2">
                                            {option.logo && (
                                                <img
                                                    src={option.logo}
                                                    alt={`${option.name} logo`}
                                                    className="w-5 h-5 object-contain bg-white rounded-sm border border-border/50"
                                                />
                                            )}
                                            <span>{option.name}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* ADD NEW BRAND MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New {label} to DB</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>
                                Logo Image <span className="text-destructive">*</span>
                            </Label>
                            <MediaUpload
                                value={addMedia}
                                onChange={(val) => {
                                    setAddMedia(val);
                                    if (mediaError && val.length > 0) setMediaError("");
                                }}
                                maxFiles={1}
                                acceptedTypes={["image/*"]}
                            />
                            {mediaError && <p className="text-xs text-destructive">{mediaError}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-name">
                                Full Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="add-name"
                                value={addName}
                                onChange={(e) => {
                                    setAddName(e.target.value);
                                    if (nameError) setNameError("");
                                }}
                                placeholder="Google"
                            />
                            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                            <p className="text-xs text-muted-foreground">
                                Only space and alphabets allowed, no special characters or numbers.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-aliases">Other Common Names (Optional)</Label>
                            <Input
                                id="add-aliases"
                                value={addAliases}
                                onChange={(e) => setAddAliases(e.target.value)}
                                placeholder="Ex: Google India, Alphabet"
                            />
                            <p className="text-xs text-muted-foreground">
                                Separate multiple names with commas.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="gradient" onClick={handleAddSubmit}>
                            Save to DB
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
