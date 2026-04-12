import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Briefcase, GraduationCap, Home, Send, Heart, Bookmark,
  ExternalLink, ChevronDown, DoorOpen, Calendar, Sofa, IndianRupee, Smile
} from "lucide-react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { MAPBOX_TOKEN, GOOGLE_MAPS_API_KEY, MAP_PROVIDER } from "@/lib/maps/config";
import { GoogleMapRenderer } from "@/components/map/GoogleMapRenderer";
import { MapboxMapRenderer } from "@/components/map/MapboxMapRenderer";
import { getHabitIcon } from "@/constants/habits";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { useSaveProfile } from "@/hooks/useSocial";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ─── Types ─── */

interface JobExperience {
  id: string;
  company: string;
  position: string;
  fromYear: string;
  tillYear: string;
  currentlyWorking: boolean;
  companyLogo?: string;
  companyWebsite?: string;
}

interface EducationExperience {
  id: string;
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
  institutionLogo?: string;
}

interface Room {
  id: string;
  name?: string;
  type: string;
  rent: string;
  available: number;
  brokerage?: string;
  securityDeposit: string;
  availableFrom: string;
  furnishingType: string;
  description?: string;
  amenities: string[];
  photos: string[];
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  city: string;
  state: string;
  profilePicture: string;
  searchType: "flat" | "flatmate";
  myHabits: string[];
  lookingForHabits: string[];
  jobExperiences: JobExperience[] | string[];
  educationExperiences: EducationExperience[] | string[];
  workExperience?: string[];
  education?: string[];
  flatDetails?: {
    address: string;
    coordinates?: [number, number];
    flatType?: string;
    furnishingType: string;
    description?: string;
    commonAmenities: string[];
    commonPhotos: string[];
    rooms: Room[];
  };
}

interface ProfileCardProps {
  profile: Profile;
  alreadyInConversation?: boolean;
  onSaveProfile?: (profileId: string, saved: boolean) => void;
  isSaved?: boolean;
}

const conversationProfileIds = ["1", "3"];

const flatTypeLabels: Record<string, string> = {
  '1rk': '1 RK', '1bhk': '1 BHK', '2bhk': '2 BHK',
  '3bhk': '3 BHK', '4bhk': '4 BHK', '4+bhk': '4+ BHK',
};

/** Returns true only for non-empty, real URLs */
const isValidPhoto = (url: string | undefined | null): url is string =>
  !!url && url.length > 0 && url !== "";

const OrganizationLogoPill = ({ icon: Icon, name, type, text }: { icon: any, name?: string, type: 'job' | 'education', text: React.ReactNode }) => {
  const [imgState, setImgState] = useState<'loading'|'loaded'|'error'>('loading');
  const domain = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') + (type === 'education' ? '.edu' : '.com') : '';
  const url = `https://logo.clearbit.com/${domain}`;
  
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-gray-100 bg-white text-[#71738B] font-medium shadow-sm">
      <div className="relative w-[14px] h-[14px] flex-shrink-0 flex items-center justify-center">
        {name && imgState !== 'error' && (
          <img 
              src={url} 
              alt={name}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${imgState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgState('loaded')}
              onError={() => setImgState('error')}
          />
        )}
        {(imgState !== 'loaded' || !name) && (
          <Icon className="w-[14px] h-[14px] text-[#A0A2B8] stroke-[2]" />
        )}
      </div>
      {text}
    </span>
  );
};

export const ProfileCard = ({ profile, alreadyInConversation, onSaveProfile, isSaved = false }: ProfileCardProps) => {
  const isLookingForFlatmate = profile.searchType === "flatmate";
  const { toast } = useToast();
  const [saved, setSaved] = useState(isSaved);

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved, profile.id]);

  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [activeRoomPhoto, setActiveRoomPhoto] = useState<Record<string, number>>({});

  const hasExistingConversation = alreadyInConversation ?? conversationProfileIds.includes(profile.id);

  const [message, setMessage] = useState(
    isLookingForFlatmate
      ? `Hey! ${profile.name}, I'm looking for a place and your listing looks great. Can we talk?`
      : `Hey! ${profile.name}, I've got a flat vacancy. Want to know the details?`
  );

  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        emojiPickerRef.current && !emojiPickerRef.current.contains(target) &&
        emojiBtnRef.current && !emojiBtnRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSendMessage = () => {
    navigate(`/dashboard?activeView=messages&newChat=${profile.id}`);
  };

  const { mutate: toggleSaveMutation } = useSaveProfile();

  const handleSaveProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSavedState = !saved;
    setSaved(newSavedState);
    toggleSaveMutation(profile.id, {
      onError: () => setSaved(!newSavedState),
      onSuccess: () => onSaveProfile?.(profile.id, newSavedState),
    });
  };

  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      next.has(roomId) ? next.delete(roomId) : next.add(roomId);
      return next;
    });
  };

  const getActiveIdx = (roomId: string) => activeRoomPhoto[roomId] ?? 0;

  /* helper: get only valid photos for a room */
  const getValidPhotos = (photos: string[]) => photos.filter(isValidPhoto);

  return (
    <Card className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg w-full">
      {/* ───── Soft pink header background ───── */}
      <div className="absolute inset-x-0 top-0 h-[200px] bg-rose-50 pointer-events-none" />

      {/* ╔══════════════════════════════════════════════════════════╗
          ║ HEADER & MESSAGE SECTION                                   ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <div className="relative z-10 px-6 pt-6 pb-6 w-full">
        <div className="flex items-stretch gap-6 w-full">
          {/* ── Left Col: Profile photo (large rounded square) ── */}
          <div className="relative flex-shrink-0">
            <div className="w-[148px] h-[148px] rounded-[32px] overflow-hidden border-[4px] border-white shadow-sm bg-white">
              {isValidPhoto(profile.profilePicture) ? (
                <img src={profile.profilePicture} alt={profile.name} className="w-full h-full object-cover rounded-[28px]" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-[28px]">
                  <Home className="w-10 h-10 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* ── Right Col: Info + Actions ── */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            {/* Top Info block */}
            <div className="flex flex-col flex-1">
              {/* Row: Name + Bookmark + Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-[#2A2B3D] leading-tight flex items-baseline gap-1">
                    {profile.name}<span className="text-[18px] font-semibold text-[#8C8D9E]">,{profile.age}</span>
                  </h2>
                  <p className="flex items-center gap-1.5 text-[12px] text-[#71738B] mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#F43F5E] flex-shrink-0 stroke-[2.5]" />
                    {profile.city}, {profile.state}
                  </p>
                </div>
                <div className="flex items-center gap-3.5 flex-shrink-0">
                  <button onClick={handleSaveProfile} className="hover:opacity-70 transition-opacity">
                    <Bookmark className={`w-[18px] h-[18px] ${saved ? "fill-[#71738B] text-[#71738B] stroke-[2]" : "text-[#A0A2B8] stroke-[2]"}`} />
                  </button>
                  <Badge className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-lg border-0 shadow-sm ${
                    isLookingForFlatmate
                      ? "bg-[#E11D48] text-white hover:bg-[#E11D48]"
                      : "bg-blue-600 text-white hover:bg-blue-600"
                  }`}>
                    {isLookingForFlatmate ? "Has Flat" : "Looking for Flat"}
                  </Badge>
                </div>
              </div>

              {/* Pills: Job + Education */}
              <div className="flex flex-wrap gap-2.5 mt-2.5">
                {profile.jobExperiences.length > 0 && (() => {
                  const job = profile.jobExperiences[0];
                  const isString = typeof job === 'string';
                  const jobText = isString ? job : `${job.position} at ${job.company}`;
                  const jobName = isString ? job.split(' at ')[1] || job : job.company;
                  return <OrganizationLogoPill type="job" icon={Briefcase} name={jobName} text={jobText} />;
                })()}
                {profile.educationExperiences.length > 0 && (() => {
                  const edu = profile.educationExperiences[0];
                  const isString = typeof edu === 'string';
                  const eduText = isString ? edu : `${edu.degree || 'Degree'} from ${edu.institution}`;
                  const eduName = isString ? edu.split(' from ')[1] || edu : edu.institution;
                  return <OrganizationLogoPill type="education" icon={GraduationCap} name={eduName} text={eduText} />;
                })()}
              </div>
            </div>

            {/* Conversation / Message Input block */}
            <div className="mt-3">
              {hasExistingConversation ? (
                <div className="rounded-lg px-4 py-3 flex items-center gap-2.5 bg-rose-50/80 border border-rose-100/80 w-full h-[40px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />
                  <p className="text-[12px] text-gray-600 truncate">
                    In conversation with <span className="font-bold text-gray-900">{profile.name}</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-stretch gap-2.5 w-full h-[40px]">
                  <div className="flex-1 min-w-0 relative">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full h-full rounded-lg border border-gray-200 bg-white pl-3 pr-10 text-[12px] text-[#2A2B3D] placeholder:text-[#A0A2B8] focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-shadow shadow-sm"
                      placeholder="Type your message..."
                    />
                    <button
                      ref={emojiBtnRef}
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A0A2B8] hover:text-[#71738B] transition-colors"
                    >
                      <Smile className="w-[18px] h-[18px] stroke-[1.5]" />
                    </button>
                    {showEmojiPicker && createPortal(
                      <div
                        ref={emojiPickerRef}
                        className="fixed z-[9999] shadow-xl rounded-xl overflow-hidden bg-white border border-gray-200"
                        style={{
                          top: (emojiBtnRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
                          left: Math.max(8, (emojiBtnRef.current?.getBoundingClientRect().right ?? 0) - 352),
                        }}
                      >
                        <Picker
                          data={data}
                          onEmojiSelect={(emoji: any) => {
                            setMessage((prev) => prev + emoji.native);
                            setShowEmojiPicker(false);
                          }}
                          theme="light"
                          previewPosition="none"
                          skinTonePosition="none"
                          set="native"
                        />
                      </div>,
                      document.body
                    )}
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    className="w-[40px] h-[40px] rounded-lg flex items-center justify-center bg-[#E11D48] hover:bg-rose-700 text-white shadow-sm shrink-0 p-0"
                  >
                    <Send className="h-[18px] w-[18px] stroke-[2]" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-6" />

      {/* ╔══════════════════════════════════════════════════════════╗
          ║ SCROLLABLE CONTENT                                     ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <CardContent className="relative z-10 space-y-7 pt-5 pb-6 px-6 max-h-[calc(100vh-340px)] overflow-y-auto">
        {/* ──────── FLAT DETAILS ──────── */}
        {isLookingForFlatmate && profile.flatDetails && (
          <div className="space-y-7">
            {/* Flat info card */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2.5 text-[14px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                <Home className="w-5 h-5 text-rose-500" />
                FLAT DETAILS
              </h3>
              <div className="rounded-xl border border-gray-200/70 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Left: address + pills + description */}
                  <div className="flex-1 p-5 space-y-3">
                    <p className="flex items-start gap-2 text-[13px] text-gray-700 leading-snug">
                      <MapPin className="w-4 h-4 mt-0.5 text-rose-500 flex-shrink-0" />
                      {profile.flatDetails.address}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {profile.flatDetails.flatType && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-[5px] rounded-full border border-gray-200 text-gray-700 font-medium">
                          <Home className="w-3.5 h-3.5 text-gray-400" />
                          {flatTypeLabels[profile.flatDetails.flatType] || profile.flatDetails.flatType}
                        </span>
                      )}
                      {profile.flatDetails.furnishingType && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-[5px] rounded-full border border-gray-200 text-gray-700 font-medium capitalize">
                          <Sofa className="w-3.5 h-3.5 text-gray-400" />
                          {profile.flatDetails.furnishingType}
                        </span>
                      )}
                    </div>
                    {profile.flatDetails.description && (
                      <p className="text-[13px] text-gray-500 leading-relaxed">
                        {profile.flatDetails.description}
                      </p>
                    )}
                  </div>
                  {/* Right: Map (50% width) */}
                  <div className="w-full md:flex-1 h-48 md:h-auto min-h-[180px] bg-rose-50/30 border-t md:border-t-0 md:border-l border-gray-200/70 flex items-center justify-center overflow-hidden relative">
                    {(() => {
                      const coords = profile.flatDetails.coordinates;
                      if (!coords) {
                        return (
                          <div className="flex flex-col items-center gap-1.5">
                            <MapPin className="w-6 h-6 text-gray-300" />
                            <p className="text-[11px] text-gray-400 font-medium">Map View</p>
                          </div>
                        );
                      }
                      const [lng, lat] = coords;
                      const hasGoogle = MAP_PROVIDER === 'google' && !!GOOGLE_MAPS_API_KEY;
                      const hasMapbox = MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.');
                      if (!hasGoogle && !hasMapbox) {
                        return (
                          <div className="flex flex-col items-center gap-1.5">
                            <MapPin className="w-6 h-6 text-gray-300" />
                            <p className="text-[11px] text-gray-400 font-medium">Map View</p>
                          </div>
                        );
                      }
                      return (
                        <>
                          {hasGoogle ? (
                            <GoogleMapRenderer center={coords} zoom={14} height="100%" readonly className="w-full h-full" />
                          ) : (
                            <MapboxMapRenderer center={coords} zoom={14} height="100%" readonly className="w-full h-full" />
                          )}
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-white/90 px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 z-10 shadow-sm"
                          >
                            Open <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* ──────── AVAILABLE ROOMS ──────── */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2.5 text-[14px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                <DoorOpen className="w-5 h-5 text-rose-500" />
                AVAILABLE ROOMS
              </h3>
              <div className="space-y-3">
                {profile.flatDetails.rooms.map((room) => {
                  const isExpanded = expandedRooms.has(room.id);
                  const roomName = room.name || `Room ${room.id}`;
                  const roomType = room.type.charAt(0).toUpperCase() + room.type.slice(1);
                  const validPhotos = getValidPhotos(room.photos);
                  const activeIdx = getActiveIdx(room.id);
                  const safeIdx = activeIdx < validPhotos.length ? activeIdx : 0;

                  return (
                    <div
                      key={room.id}
                      className="rounded-xl border border-gray-200/70 overflow-hidden cursor-pointer hover:bg-gray-50/30 transition-colors"
                      onClick={() => toggleRoom(room.id)}
                    >
                      <div className="p-4 sm:px-5">
                        <div className="flex gap-4" style={{ alignItems: isExpanded ? 'flex-start' : 'center' }}>
                          {/* Image: morphs from 68px square to 240px tall */}
                          <div
                            className="rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out"
                            style={{
                              width: isExpanded ? 240 : 68,
                              height: isExpanded ? 180 : 68,
                            }}
                          >
                            {validPhotos[safeIdx] ? (
                              <img src={validPhotos[safeIdx]} alt={roomName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                <Home className={`text-gray-300 transition-all duration-300 ${isExpanded ? 'w-10 h-10' : 'w-5 h-5'}`} />
                                {isExpanded && <span className="text-[11px] text-gray-300">No photos</span>}
                              </div>
                            )}
                          </div>

                          {/* Content area */}
                          <div className="flex-1 min-w-0">
                            {/* Header row: always visible */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className={`font-bold text-gray-900 leading-tight transition-all duration-300 ${isExpanded ? 'text-[18px]' : 'text-[15px]'}`}>
                                  {roomName}
                                </h4>
                                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-[3px] rounded-full bg-gray-100 text-gray-600 font-medium mt-1.5">
                                  <DoorOpen className="w-3 h-3 text-gray-400" />
                                  {roomType}
                                </span>
                                {/* Rent line: hides smoothly when expanded */}
                                <div
                                  className="grid transition-[grid-template-rows] duration-500 ease-in-out"
                                  style={{ gridTemplateRows: isExpanded ? '0fr' : '1fr' }}
                                >
                                  <div className="overflow-hidden">
                                    <p className="text-[12px] text-gray-500 font-medium mt-1">
                                      <span className="text-gray-700 font-semibold">Rent:</span> {room.rent}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {/* Badge + Chevron */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className="bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold px-3 py-1 rounded-full hover:bg-rose-50">
                                  {room.available} Available
                                </Badge>
                                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>

                            {/* Expandable details: animated via grid */}
                            <div
                              className="grid transition-[grid-template-rows] duration-500 ease-in-out"
                              style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                            >
                              <div className="overflow-hidden">
                                <div className="pt-4 space-y-4">
                                  {/* 4-column grid: Rent | Deposit | Brokerage | Available From */}
                                  <div className="grid grid-cols-4 gap-x-4 gap-y-3">
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold flex items-center gap-1">
                                        <IndianRupee className="w-3 h-3" /> RENT
                                      </p>
                                      <p className="text-[14px] font-bold text-gray-900 mt-0.5">{room.rent}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">DEPOSIT</p>
                                      <p className={`text-[14px] font-bold mt-0.5 ${room.securityDeposit ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {room.securityDeposit || 'No Deposit'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold">BROKERAGE</p>
                                      <p className={`text-[14px] font-bold mt-0.5 ${room.brokerage ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {room.brokerage || 'No Brokerage'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> AVAILABLE FROM
                                      </p>
                                      <p className="text-[14px] font-bold text-gray-900 mt-0.5">{room.availableFrom || 'Immediately'}</p>
                                    </div>
                                  </div>

                                  {/* Room Amenities */}
                                  {room.amenities.length > 0 && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-2">ROOM AMENITIES</p>
                                      <div className="flex flex-wrap gap-2">
                                        {room.amenities.map((a) => (
                                          <span key={a} className="text-[12px] font-medium rounded-full px-3 py-[5px] bg-gray-100 text-gray-700 border border-gray-200/80">
                                            {a}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Room Description */}
                                  {room.description && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-1.5">ROOM DESCRIPTION</p>
                                      <p className="text-[13px] text-gray-500 leading-relaxed">{room.description}</p>
                                    </div>
                                  )}

                                  {/* Photo thumbnails */}
                                  {validPhotos.length > 1 && (
                                    <div className="flex gap-2">
                                      {validPhotos.map((photo, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); setActiveRoomPhoto((p) => ({ ...p, [room.id]: idx })); }}
                                          className={`w-[72px] h-[52px] rounded-md flex-shrink-0 overflow-hidden border-2 transition-all ${
                                            idx === safeIdx ? 'border-rose-500' : 'border-transparent hover:border-gray-300'
                                          }`}
                                        >
                                          <img src={photo} alt="" className="w-full h-full object-cover" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ──────── COMMON AREA ──────── */}
            {(profile.flatDetails.commonAmenities.length > 0 || (profile.flatDetails.commonPhotos && profile.flatDetails.commonPhotos.filter(p => p && p.trim()).length > 0)) && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2.5 text-[14px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                  <Home className="w-5 h-5 text-rose-500" />
                  COMMON AREA
                </h3>
                {profile.flatDetails.commonAmenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.flatDetails.commonAmenities.map((a) => (
                      <span key={a} className="text-[12px] font-medium rounded-full px-3 py-[5px] bg-gray-50 text-gray-700 border border-gray-200">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {profile.flatDetails.commonPhotos && profile.flatDetails.commonPhotos.filter(p => p && p.trim()).length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {profile.flatDetails.commonPhotos.filter(p => p && p.trim()).map((photo, idx) => (
                      <div key={idx} className="w-[240px] h-[180px] rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={photo} alt={`Common area ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-gray-100" />
          </div>
        )}

        {/* ──────── MY HABITS ──────── */}
        {profile.myHabits.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2.5 text-[14px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              <Heart className="w-5 h-5 text-rose-500" />
              MY HABITS
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.myHabits.map((habit) => {
                const Icon = getHabitIcon(habit);
                return (
                  <span key={habit} className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3 py-[5px] bg-gray-50 text-gray-700 border border-gray-200">
                    {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
                    {habit}
                  </span>
                );
              })}
            </div>
          </div>
        )}

          {/* Looking For Habits */}
          <div className="space-y-3 mt-4">
            <h3 className="flex items-center gap-2.5 text-[14px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              <Heart className="w-5 h-5 text-rose-500" />
              LOOKING FOR
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.lookingForHabits.map((habit) => {
                const Icon = getHabitIcon(habit);
                return (
                  <span key={habit} className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3 py-[5px] bg-gray-50 text-gray-700 border border-gray-200">
                    {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
                    {habit}
                  </span>
                );
              })}
            </div>
          </div>

        {/* ──────── EXPERIENCE + EDUCATION (side by side) ──────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Experience */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2.5 text-[14px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              <Briefcase className="w-5 h-5 text-rose-500" />
              EXPERIENCE
            </h3>
            {profile.jobExperiences.length === 0 ? (
              <p className="text-[12px] text-gray-400 italic">Not provided</p>
            ) : (
              <div className="space-y-3">
                {profile.jobExperiences.map((exp, idx) =>
                  typeof exp === 'string' ? (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-[7px] h-[7px] rounded-full bg-rose-400 mt-[7px] flex-shrink-0" />
                      <p className="text-[13px] font-medium text-gray-700">{exp}</p>
                    </div>
                  ) : (
                    <div key={exp.id} className="flex items-start gap-2.5">
                      <div className="w-[7px] h-[7px] rounded-full bg-rose-400 mt-[7px] flex-shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">{exp.position}</p>
                        <p className="text-[12px] text-gray-500">{exp.company}</p>
                        <p className="text-[11px] text-gray-400">{exp.fromYear} – {exp.currentlyWorking ? 'Present' : exp.tillYear}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2.5 text-[14px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              <GraduationCap className="w-5 h-5 text-rose-500" />
              EDUCATION
            </h3>
            {profile.educationExperiences.length === 0 ? (
              <p className="text-[12px] text-gray-400 italic">Not provided</p>
            ) : (
              <div className="space-y-3">
                {profile.educationExperiences.map((edu, idx) =>
                  typeof edu === 'string' ? (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-[7px] h-[7px] rounded-full bg-rose-400 mt-[7px] flex-shrink-0" />
                      <p className="text-[13px] font-medium text-gray-700">{edu}</p>
                    </div>
                  ) : (
                    <div key={edu.id} className="flex items-start gap-2.5">
                      <div className="w-[7px] h-[7px] rounded-full bg-rose-400 mt-[7px] flex-shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">{edu.degree}</p>
                        <p className="text-[12px] text-gray-500">{edu.institution}</p>
                        <p className="text-[11px] text-gray-400">{edu.startYear} – {edu.endYear}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
