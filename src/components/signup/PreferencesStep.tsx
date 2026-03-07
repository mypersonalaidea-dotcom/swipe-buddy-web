import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Users, MapPin, Briefcase, GraduationCap, Heart, Clock, Plus, X, Star } from "lucide-react";

interface PreferencesData {
  prioritizedPreferences: Array<{
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    isCustom?: boolean;
  }>;
}

interface PreferencesStepProps {
  data: PreferencesData;
  onUpdate: (data: PreferencesData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const defaultPreferences = [
  {
    id: "college",
    label: "Same College/University",
    description: "Match with people from your educational institution",
    icon: <GraduationCap className="w-4 h-4" />
  },
  {
    id: "age",
    label: "Similar Age Group",
    description: "Match with people within 3-5 years of your age",
    icon: <Users className="w-4 h-4" />
  },
  {
    id: "profession",
    label: "Same Profession Field",
    description: "Match with people in similar career paths",
    icon: <Briefcase className="w-4 h-4" />
  },
  {
    id: "location",
    label: "Close to Work/Study",
    description: "Prioritize locations near your workplace or university",
    icon: <MapPin className="w-4 h-4" />
  },
  {
    id: "lifestyle",
    label: "Similar Lifestyle",
    description: "Match based on habits like smoking, partying, cleanliness",
    icon: <Heart className="w-4 h-4" />
  },
  {
    id: "schedule",
    label: "Compatible Schedule",
    description: "Match with people who have similar daily routines",
    icon: <Clock className="w-4 h-4" />
  }
];

export const PreferencesStep = ({ data, onUpdate, onSubmit, onBack }: PreferencesStepProps) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  const preferences = data.prioritizedPreferences.length > 0 
    ? data.prioritizedPreferences 
    : defaultPreferences;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(preferences);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onUpdate({ prioritizedPreferences: items });
  };

  const handleAddCustomPreference = () => {
    if (!customLabel.trim() || !customDescription.trim()) return;

    const newPreference = {
      id: `custom-${Date.now()}`,
      label: customLabel.trim(),
      description: customDescription.trim(),
      icon: <Star className="w-4 h-4" />,
      isCustom: true
    };

    const updatedPreferences = [...preferences, newPreference];
    onUpdate({ prioritizedPreferences: updatedPreferences });

    // Reset form
    setCustomLabel("");
    setCustomDescription("");
    setIsAddingCustom(false);
  };

  const handleRemoveCustomPreference = (preferenceId: string) => {
    const updatedPreferences = preferences.filter(pref => pref.id !== preferenceId);
    onUpdate({ prioritizedPreferences: updatedPreferences });
  };

  const handleCancelAdd = () => {
    setCustomLabel("");
    setCustomDescription("");
    setIsAddingCustom(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Set Your Priorities</h2>
        <p className="text-muted-foreground">
          Drag and drop to rank what matters most to you in a flatmate match
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matching Preferences</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your top preferences will be given more weight when showing potential matches
          </p>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="preferences">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {preferences.map((preference, index) => (
                    <Draggable key={preference.id} draggableId={preference.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors
                            ${snapshot.isDragging ? 'shadow-lg scale-105' : 'shadow-sm'}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <div {...provided.dragHandleProps} className="cursor-grab hover:text-primary">
                              <GripVertical className="w-5 h-5" />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                              {preference.icon}
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{preference.label}</h4>
                              <p className="text-sm text-muted-foreground">{preference.description}</p>
                            </div>
                          </div>

                          {preference.isCustom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCustomPreference(preference.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add Custom Preference Section */}
          <div className="mt-6">
            {!isAddingCustom ? (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingCustom(true)}
                  className="flex items-center gap-2 border-dashed border-2 hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Preference
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-foreground">Add Your Own Preference</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="custom-label">Preference Name</Label>
                    <Input
                      id="custom-label"
                      placeholder="e.g., Similar Music Taste"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="custom-description">Description</Label>
                    <Textarea
                      id="custom-description"
                      placeholder="e.g., Match with people who enjoy similar music genres"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCustomPreference}
                    disabled={!customLabel.trim() || !customDescription.trim()}
                    size="sm"
                  >
                    Add Preference
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelAdd}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-accent/30 p-4 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">💡 How this works</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Your #1 priority gets the highest weight in our matching algorithm</li>
          <li>• You can change these preferences anytime in your profile settings</li>
          <li>• We'll show you the most compatible matches first based on your ranking</li>
          <li>• Custom preferences help us understand what's uniquely important to you</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button 
          onClick={onSubmit}
          className="flex-1 h-12 text-base"
          variant="gradient"
        >
          Complete Profile & Start Matching
        </Button>
      </div>
    </div>
  );
};
