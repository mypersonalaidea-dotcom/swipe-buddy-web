import {
    Leaf, Egg, Drumstick,
    Cigarette, CircleSlash,
    Wine, GlassWater,
    Sun, Moon,
    Dumbbell, Sofa,
    Music, Home,
    Sparkles, SmilePlus,
    LucideIcon
} from "lucide-react";

export interface HabitOption {
    label: string;
    icon: LucideIcon;
}

export interface HabitCategory {
    name: string;
    key: string;
    options: HabitOption[];
}

export const habitCategories: HabitCategory[] = [
    {
        name: "Eating",
        key: "eating",
        options: [
            { label: "Vegetarian", icon: Leaf },
            { label: "Eggetarian", icon: Egg },
            { label: "Non-Vegetarian", icon: Drumstick },
        ],
    },
    {
        name: "Smoking",
        key: "smoking",
        options: [
            { label: "Smoker", icon: Cigarette },
            { label: "Non-Smoker", icon: CircleSlash },
        ],
    },
    {
        name: "Drinking",
        key: "drinking",
        options: [
            { label: "Drinker", icon: Wine },
            { label: "Non-Drinker", icon: GlassWater },
        ],
    },
    {
        name: "Schedule",
        key: "schedule",
        options: [
            { label: "Early Riser", icon: Sun },
            { label: "Night Owl", icon: Moon },
        ],
    },
    {
        name: "Fitness",
        key: "fitness",
        options: [
            { label: "Fitness Enthusiast", icon: Dumbbell },
            { label: "Not into Fitness", icon: Sofa },
        ],
    },
    {
        name: "Social",
        key: "social",
        options: [
            { label: "Party Lover", icon: Music },
            { label: "Homebody", icon: Home },
        ],
    },
    {
        name: "Cleanliness",
        key: "cleanliness",
        options: [
            { label: "Clean Freak", icon: Sparkles },
            { label: "Easy Going", icon: SmilePlus },
        ],
    },
];

// Get all habit labels flattened (useful for data storage)
export const allHabitLabels = habitCategories.flatMap(cat => cat.options.map(opt => opt.label));

// Find which category a habit belongs to
export const getCategoryForHabit = (habit: string): HabitCategory | undefined => {
    return habitCategories.find(cat => cat.options.some(opt => opt.label === habit));
};

// Get the icon for a specific habit label
export const getHabitIcon = (habit: string): LucideIcon | undefined => {
    for (const cat of habitCategories) {
        const option = cat.options.find(opt => opt.label === habit);
        if (option) return option.icon;
    }
    return undefined;
};
