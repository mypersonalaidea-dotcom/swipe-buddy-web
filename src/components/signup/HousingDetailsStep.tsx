import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaUpload } from "@/components/ui/media-upload";
import { Home, Camera, Plus, Trash2, DoorOpen, Building2, Calendar } from "lucide-react";

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
}

interface RoomDetails {
  id: string;
  roomType: "private" | "shared" | "studio";
  quantity: string;
  rent: string;
  securityDeposit: string;
  brokerage: string;
  availableFrom: string;
  amenities: string[];
  media: MediaFile[];
}

interface HousingDetailsData {
  searchType: "flat" | "flatmate" | "both";
  propertyMoveInDate?: string;
  // For flat owners
  flatDetails: {
    address: string;
    city: string;
    state: string;
    flatType: string;
    flatFurnishing: string;
    rooms: RoomDetails[];
    commonAmenities: string[];
    description: string;
    commonMedia: MediaFile[];
  };
}

interface HousingDetailsStepProps {
  data: HousingDetailsData;
  onUpdate: (data: HousingDetailsData) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const roomAmenitiesList = [
  "Attached Bathroom", "AC", "WiFi", "Wardrobe", "Bed with Mattress",
  "Study Table", "Balcony", "Geyser", "TV", "Window"
];

const commonAmenitiesList = [
  "WiFi", "Parking", "Washing Machine", "Refrigerator", "Kitchen",
  "Gym", "Power Backup", "Security", "Lift", "Swimming Pool", "Balcony"
];

const roomTypeLabels = {
  "private": "Private Room",
  "shared": "Shared Room",
  "studio": "Studio"
};

export const HousingDetailsStep = ({ data, onUpdate, onSubmit, onBack, isSubmitting }: HousingDetailsStepProps) => {
  const handleInputChange = (field: keyof HousingDetailsData, value: any) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleFlatDetailsChange = (field: keyof HousingDetailsData['flatDetails'], value: any) => {
    onUpdate({
      ...data,
      flatDetails: { ...data.flatDetails, [field]: value }
    });
  };

  const handleCommonMediaChange = (mediaFiles: MediaFile[]) => {
    handleFlatDetailsChange('commonMedia', mediaFiles);
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = data.flatDetails.commonAmenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];

    onUpdate({
      ...data,
      flatDetails: { ...data.flatDetails, commonAmenities: updatedAmenities }
    });
  };

  // Room Management Functions
  const addRoom = () => {
    const newRoom: RoomDetails = {
      id: Date.now().toString(),
      roomType: "private",
      quantity: "1",
      rent: "",
      securityDeposit: "2 Month",
      brokerage: "15 Day",
      availableFrom: new Date().toISOString().split('T')[0],
      amenities: [],
      media: []
    };
    onUpdate({
      ...data,
      flatDetails: {
        ...data.flatDetails,
        rooms: [...(data.flatDetails.rooms || []), newRoom]
      }
    });
  };

  const removeRoom = (id: string) => {
    onUpdate({
      ...data,
      flatDetails: {
        ...data.flatDetails,
        rooms: (data.flatDetails.rooms || []).filter(room => room.id !== id)
      }
    });
  };

  const updateRoom = (id: string, field: keyof RoomDetails, value: any) => {
    const updatedRooms = (data.flatDetails.rooms || []).map(room => {
      if (room.id === id) {
        return { ...room, [field]: value };
      }
      return room;
    });

    onUpdate({
      ...data,
      flatDetails: { ...data.flatDetails, rooms: updatedRooms }
    });
  };

  const handleRoomMediaChange = (id: string, mediaFiles: MediaFile[]) => {
    updateRoom(id, 'media', mediaFiles);
  };

  const handleRoomAmenityToggle = (roomId: string, amenity: string) => {
    const room = (data.flatDetails.rooms || []).find(r => r.id === roomId);
    if (!room) return;

    const currentAmenities = room.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];

    updateRoom(roomId, 'amenities', updatedAmenities);
  };

  let isValid = !!data.searchType;

  // Custom Validation
  if (data.searchType === "flat" || data.searchType === "both") {
    isValid = isValid && !!data.propertyMoveInDate;
  }

  if (data.searchType === "flatmate" || data.searchType === "both") {
    if (!data.flatDetails) {
      isValid = false;
    } else {
      isValid = isValid &&
        !!data.flatDetails.address &&
        !!data.flatDetails.city &&
        !!data.flatDetails.state &&
        !!data.flatDetails.flatType &&
        !!data.flatDetails.flatFurnishing &&
        Array.isArray(data.flatDetails.commonMedia) &&
        data.flatDetails.commonMedia.length > 0;

      // Room validation: every room must have all mandatory fields filled
      const rooms = data.flatDetails.rooms || [];
      if (rooms.length > 0) {
        const allRoomsValid = rooms.every(room =>
          !!room.roomType &&
          !!room.quantity &&
          !!room.rent &&
          !!room.securityDeposit &&
          !!room.brokerage &&
          !!room.availableFrom &&
          Array.isArray(room.media) &&
          room.media.length > 0
        );
        isValid = isValid && allRoomsValid;
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Housing Preferences</h2>
        <p className="text-muted-foreground">Help us understand what you're looking for</p>
      </div>

      {/* Search Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            What are you looking for?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.searchType}
            onValueChange={(value) => handleInputChange('searchType', value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="flat" id="flat" />
              <div className="flex-1">
                <Label htmlFor="flat" className="font-medium">Looking for a flat</Label>
                <p className="text-sm text-muted-foreground">I need a place to live</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="flatmate" id="flatmate" />
              <div className="flex-1">
                <Label htmlFor="flatmate" className="font-medium">Looking for flatmates</Label>
                <p className="text-sm text-muted-foreground">I have a flat and need roommates</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="both" id="both" />
              <div className="flex-1">
                <Label htmlFor="both" className="font-medium">Open to both</Label>
                <p className="text-sm text-muted-foreground">I'm flexible with either option</p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {(data.searchType === "flat" || data.searchType === "both") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Looking for Flat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="property-move-in" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Property Move-in Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="property-move-in"
                type="date"
                className="w-fit"
                value={data.propertyMoveInDate || ''}
                onChange={(e) => onUpdate({ ...data, propertyMoveInDate: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {(data.searchType === "flatmate" || data.searchType === "both") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Your Flat Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="flat-address">Flat Address <span className="text-destructive">*</span></Label>
              <Input
                id="flat-address"
                placeholder="123 Main St, Sector 69"
                value={data.flatDetails.address}
                onChange={(e) => handleFlatDetailsChange('address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flat-city">City <span className="text-destructive">*</span></Label>
                <Input
                  id="flat-city"
                  placeholder="e.g. Gurugram"
                  value={data.flatDetails.city}
                  onChange={(e) => handleFlatDetailsChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flat-state">State <span className="text-destructive">*</span></Label>
                <Input
                  id="flat-state"
                  placeholder="e.g. Haryana"
                  value={data.flatDetails.state}
                  onChange={(e) => handleFlatDetailsChange('state', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Flat Type <span className="text-destructive">*</span>
                </Label>
                <Select value={data.flatDetails.flatType || ''} onValueChange={(value) => handleFlatDetailsChange('flatType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select flat type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1rk">1 RK</SelectItem>
                    <SelectItem value="1bhk">1 BHK</SelectItem>
                    <SelectItem value="2bhk">2 BHK</SelectItem>
                    <SelectItem value="3bhk">3 BHK</SelectItem>
                    <SelectItem value="4bhk">4 BHK</SelectItem>
                    <SelectItem value="4+bhk">4+ BHK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Furnishing <span className="text-destructive">*</span>
                </Label>
                <Select value={data.flatDetails.flatFurnishing || ''} onValueChange={(value) => handleFlatDetailsChange('flatFurnishing', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select furnishing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non-furnished">Non Furnished</SelectItem>
                    <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                    <SelectItem value="fully-furnished">Fully Furnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Room Details Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <DoorOpen className="w-5 h-5" />
                  Available Rooms
                </h3>
                <Button
                  type="button"
                  onClick={addRoom}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Room
                </Button>
              </div>

              {(data.flatDetails.rooms || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-accent/30">
                  <DoorOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No rooms added yet</p>
                  <p className="text-sm">Click "Add Room" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.flatDetails.rooms || []).map((room, index) => (
                    <div key={room.id} className="border rounded-lg p-4 space-y-4 bg-accent/30">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">Room #{index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removeRoom(room.id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Room Type <span className="text-destructive">*</span></Label>
                        <RadioGroup
                          value={room.roomType}
                          onValueChange={(value) => updateRoom(room.id, 'roomType', value)}
                          className="grid grid-cols-2 gap-2"
                        >
                          {Object.entries(roomTypeLabels).map(([value, label]) => (
                            <div key={value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                              <RadioGroupItem value={value} id={`${room.id}-${value}`} />
                              <Label htmlFor={`${room.id}-${value}`} className="text-sm cursor-pointer">{label}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`quantity-${room.id}`}>Available Quantity <span className="text-destructive">*</span></Label>
                          <Input
                            id={`quantity-${room.id}`}
                            type="number"
                            min={1}
                            placeholder="1"
                            value={room.quantity}
                            onChange={(e) => updateRoom(room.id, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`rent-${room.id}`}>Rent (₹/month) <span className="text-destructive">*</span></Label>
                          <Input
                            id={`rent-${room.id}`}
                            type="number"
                            placeholder="Ex: 15000"
                            value={room.rent}
                            onChange={(e) => updateRoom(room.id, 'rent', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Security Deposit <span className="text-destructive">*</span></Label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <span className="text-xs text-muted-foreground">No Deposit</span>
                              <Checkbox
                                checked={room.securityDeposit.startsWith('none|')}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    updateRoom(room.id, 'securityDeposit', `none|${room.securityDeposit || '2 Month'}`);
                                  } else {
                                    updateRoom(room.id, 'securityDeposit', room.securityDeposit.replace('none|', ''));
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div className={`flex gap-2 transition-opacity ${room.securityDeposit.startsWith('none|') ? 'opacity-40 pointer-events-none' : ''}`}>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Ex: 2"
                              value={(room.securityDeposit.replace('none|', ''))?.split(' ')[0] || ''}
                              onChange={(e) => {
                                const raw = room.securityDeposit.replace('none|', '');
                                const unit = raw?.split(' ')[1] || 'Month';
                                updateRoom(room.id, 'securityDeposit', e.target.value ? `${e.target.value} ${unit}` : '');
                              }}
                              className="flex-1"
                            />
                            <Select
                              value={(room.securityDeposit.replace('none|', ''))?.split(' ')[1] || 'Month'}
                              onValueChange={(unit) => {
                                const raw = room.securityDeposit.replace('none|', '');
                                const count = raw?.split(' ')[0] || '';
                                updateRoom(room.id, 'securityDeposit', count ? `${count} ${unit}` : '');
                              }}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Day">Day</SelectItem>
                                <SelectItem value="Month">Month</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Brokerage <span className="text-destructive">*</span></Label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <span className="text-xs text-muted-foreground">No Brokerage</span>
                              <Checkbox
                                checked={room.brokerage.startsWith('none|')}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    updateRoom(room.id, 'brokerage', `none|${room.brokerage || '15 Day'}`);
                                  } else {
                                    updateRoom(room.id, 'brokerage', room.brokerage.replace('none|', ''));
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div className={`flex gap-2 transition-opacity ${room.brokerage.startsWith('none|') ? 'opacity-40 pointer-events-none' : ''}`}>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Ex: 1"
                              value={(room.brokerage.replace('none|', ''))?.split(' ')[0] || ''}
                              onChange={(e) => {
                                const raw = room.brokerage.replace('none|', '');
                                const unit = raw?.split(' ')[1] || 'Month';
                                updateRoom(room.id, 'brokerage', e.target.value ? `${e.target.value} ${unit}` : '');
                              }}
                              className="flex-1"
                            />
                            <Select
                              value={(room.brokerage.replace('none|', ''))?.split(' ')[1] || 'Month'}
                              onValueChange={(unit) => {
                                const raw = room.brokerage.replace('none|', '');
                                const count = raw?.split(' ')[0] || '';
                                updateRoom(room.id, 'brokerage', count ? `${count} ${unit}` : '');
                              }}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Day">Day</SelectItem>
                                <SelectItem value="Month">Month</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`available-${room.id}`}>Available From <span className="text-destructive">*</span></Label>
                        <Input
                          id={`available-${room.id}`}
                          type="date"
                          className="w-fit"
                          value={room.availableFrom}
                          onChange={(e) => updateRoom(room.id, 'availableFrom', e.target.value)}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Room Amenities</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {roomAmenitiesList.map((amenity) => (
                            <div key={amenity} className="flex items-center space-x-2">
                              <Checkbox
                                id={`room-${room.id}-${amenity}`}
                                checked={room.amenities?.includes(amenity) || false}
                                onCheckedChange={() => handleRoomAmenityToggle(room.id, amenity)}
                              />
                              <Label htmlFor={`room-${room.id}-${amenity}`} className="text-sm">{amenity}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Room Photos & Videos <span className="text-destructive">*</span>
                        </Label>
                        <MediaUpload
                          value={room.media || []}
                          onChange={(mediaFiles) => handleRoomMediaChange(room.id, mediaFiles)}
                          maxFiles={5}
                          acceptedTypes={['image/*', 'video/*']}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Common Amenities Section */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-semibold text-foreground">Common Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {commonAmenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`common-${amenity}`}
                      checked={data.flatDetails.commonAmenities?.includes(amenity) || false}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={`common-${amenity}`} className="text-sm">{amenity}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Flat Description</Label>
              <Textarea
                id="description"
                placeholder="Tell potential flatmates about your place..."
                value={data.flatDetails.description}
                onChange={(e) => handleFlatDetailsChange('description', e.target.value)}
                rows={3}
                maxLength={800}
              />
              <p className="text-xs text-muted-foreground text-right">{data.flatDetails.description.length}/800</p>
            </div>

            {/* Common Photos & Videos */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Common Area Photos & Videos <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Add photos and videos of common areas (living room, kitchen, etc.)
              </p>
              <MediaUpload
                value={data.flatDetails.commonMedia || []}
                onChange={handleCommonMediaChange}
                maxFiles={10}
                acceptedTypes={['image/*', 'video/*']}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1 h-12"
          variant="gradient"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </div>
    </div>
  );
};