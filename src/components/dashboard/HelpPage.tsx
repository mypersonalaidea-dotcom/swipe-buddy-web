import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  HeadphonesIcon,
  Phone,
  Mail,
  FileText,
  AlignLeft,
  Paperclip,
  Send,
  CheckCircle2,
  Loader2,
  X,
  ChevronDown,
  RotateCcw,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type IssueType,
  uploadSupportFile,
  submitSupportForm,
} from "@/lib/support";

// ─── Validation Schema ────────────────────────────────────────────────────────

const ISSUE_OPTIONS: { label: IssueType; emoji: string }[] = [
  { label: "Issue",      emoji: "⚠️" },
  { label: "Suggestion", emoji: "💡" },
  { label: "Other",      emoji: "💬" },
];

const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const schema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[\d\s\-()]{7,15}$/, "Enter a valid phone number"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  issue_types: z
    .array(z.enum(["Issue", "Suggestion", "Other"]))
    .min(1, "Select at least one issue type"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject must be under 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be under 1000 characters"),
});

type FormValues = z.infer<typeof schema>;

// ─── Issue Type Toggle Chip ───────────────────────────────────────────────────

const IssueChip = ({
  label,
  emoji,
  selected,
  onClick,
}: {
  label: IssueType;
  emoji: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium
      border transition-all duration-200 select-none
      ${
        selected
          ? "bg-rose-50 text-rose-700 border-rose-300 shadow-sm ring-1 ring-rose-200"
          : "bg-white text-gray-600 border-gray-200 hover:border-rose-200 hover:text-rose-600"
      }
    `}
  >
    <span className="text-[15px] leading-none">{emoji}</span>
    {label}
    {selected && (
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
    )}
  </button>
);

// ─── Field Wrapper ────────────────────────────────────────────────────────────

const Field = ({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) => (
  <div className="space-y-1.5">
    <Label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
      {label}
      {required && <span className="text-rose-500">*</span>}
    </Label>
    {children}
    {hint && !error && (
      <p className="text-[11px] text-gray-400">{hint}</p>
    )}
    {error && (
      <p className="text-[11px] text-rose-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

// ─── Success Screen ───────────────────────────────────────────────────────────

const SuccessScreen = ({ onReset }: { onReset: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="w-20 h-20 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center">
      <CheckCircle2 className="w-10 h-10 text-rose-500" strokeWidth={1.5} />
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-bold text-gray-900">Request Received!</h3>
      <p className="text-[14px] text-gray-500 max-w-xs leading-relaxed">
        We've got your message and our team will get back to you as soon as
        possible. Thank you for reaching out!
      </p>
    </div>
    <button
      onClick={onReset}
      className="inline-flex items-center gap-2 text-[13px] text-rose-600 font-medium hover:underline transition-all"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      Submit another request
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const HelpPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [selectedIssues, setSelectedIssues] = useState<IssueType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      issue_types: [],
      subject: "",
      description: "",
    },
  });

  const description = watch("description");

  // ── Issue type toggle ──────────────────────────────────────────────────────
  const toggleIssue = (type: IssueType) => {
    const updated = selectedIssues.includes(type)
      ? selectedIssues.filter((i) => i !== type)
      : [...selectedIssues, type];
    setSelectedIssues(updated);
    setValue("issue_types", updated, { shouldValidate: true });
  };

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a JPG, PNG, GIF, WEBP, or PDF file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB.`,
        variant: "destructive",
      });
      return;
    }
    setUploadedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null); // PDF — no image preview
    }
  }, [toast]);

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Upload file if attached
      let doc_url = "";
      if (uploadedFile) {
        try {
          doc_url = await uploadSupportFile(uploadedFile);
        } catch {
          // File upload failure is non-blocking — we still submit the form
          doc_url = "Upload failed — file could not be attached";
          toast({
            title: "File upload failed",
            description:
              "Your request will be submitted without the attachment.",
            variant: "destructive",
          });
        }
      }

      // 2. Submit to Google Apps Script
      const result = await submitSupportForm({
        user_id: user?.id ?? "anonymous",
        user_name: user?.name ?? "Unknown",
        phone: values.phone,
        email: values.email,
        issue_types: values.issue_types as IssueType[],
        subject: values.subject,
        description: values.description,
        doc_url,
      });

      if (!result.success) {
        throw new Error(result.error ?? "Submission failed");
      }

      setSubmitSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset form after success ───────────────────────────────────────────────
  const handleReset = () => {
    reset({
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      issue_types: [],
      subject: "",
      description: "",
    });
    setSelectedIssues([]);
    removeFile();
    setSubmitSuccess(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full py-8 px-4"
      style={{
        background:
          "linear-gradient(160deg, #fff5f5 0%, #fef2f2 30%, #fce4ec 70%, #fbe9e7 100%)",
      }}
    >
      {/* Dot pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(225, 29, 72, 0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto">
        {/* ── Page Header ── */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200/80 shadow-sm mb-3">
            <HeadphonesIcon className="w-7 h-7 text-rose-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Help &amp; Support
          </h1>
          <p className="text-[14px] text-gray-500 max-w-sm mx-auto leading-relaxed">
            We're here to help. Tell us what's going on and we'll get back to
            you as soon as possible.
          </p>
        </div>

        {/* ── Form Card ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-100/70 shadow-[0_8px_40px_-8px_rgba(225,29,72,0.12)] overflow-hidden">
          {submitSuccess ? (
            <SuccessScreen onReset={handleReset} />
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="divide-y divide-gray-100/80"
            >
              {/* ── Contact Details ── */}
              <div className="px-6 pt-6 pb-5 space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-400 flex items-center gap-2">
                  <span className="flex-1 h-px bg-gradient-to-r from-rose-100 to-transparent" />
                  Contact Details
                  <span className="flex-1 h-px bg-gradient-to-l from-rose-100 to-transparent" />
                </p>

                {/* Phone */}
                <Field
                  label="Phone Number"
                  required
                  error={errors.phone?.message}
                >
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      {...register("phone")}
                      type="tel"
                      placeholder="+91 98765 43210"
                      className={`pl-9 h-10 text-[13px] rounded-xl border-gray-200 bg-white/70 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all ${
                        errors.phone ? "border-rose-400 focus:ring-rose-300" : ""
                      }`}
                    />
                  </div>
                </Field>

                {/* Email */}
                <Field
                  label="Email Address"
                  required
                  error={errors.email?.message}
                >
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="you@example.com"
                      className={`pl-9 h-10 text-[13px] rounded-xl border-gray-200 bg-white/70 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all ${
                        errors.email ? "border-rose-400 focus:ring-rose-300" : ""
                      }`}
                    />
                  </div>
                </Field>
              </div>

              {/* ── Request Details ── */}
              <div className="px-6 pt-5 pb-6 space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-400 flex items-center gap-2">
                  <span className="flex-1 h-px bg-gradient-to-r from-rose-100 to-transparent" />
                  Request Details
                  <span className="flex-1 h-px bg-gradient-to-l from-rose-100 to-transparent" />
                </p>

                {/* Issue Type */}
                <Field
                  label="Issue Type"
                  required
                  error={errors.issue_types?.message}
                  hint="Select all that apply"
                >
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {ISSUE_OPTIONS.map(({ label, emoji }) => (
                      <IssueChip
                        key={label}
                        label={label}
                        emoji={emoji}
                        selected={selectedIssues.includes(label)}
                        onClick={() => toggleIssue(label)}
                      />
                    ))}
                  </div>
                </Field>

                {/* Subject */}
                <Field
                  label="Subject"
                  required
                  error={errors.subject?.message}
                  hint="Brief summary — what's the core issue?"
                >
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      {...register("subject")}
                      type="text"
                      placeholder="e.g. Profile not showing in search results"
                      className={`pl-9 h-10 text-[13px] rounded-xl border-gray-200 bg-white/70 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all ${
                        errors.subject ? "border-rose-400 focus:ring-rose-300" : ""
                      }`}
                    />
                  </div>
                </Field>

                {/* Description */}
                <Field
                  label="Description"
                  required
                  error={errors.description?.message}
                >
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Textarea
                      {...register("description")}
                      rows={5}
                      placeholder="Describe your issue in detail. Include what you were doing, what you expected, and what actually happened..."
                      className={`pl-9 text-[13px] rounded-xl border-gray-200 bg-white/70 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all resize-none ${
                        errors.description ? "border-rose-400 focus:ring-rose-300" : ""
                      }`}
                    />
                    {/* Character counter */}
                    <span
                      className={`absolute bottom-2 right-3 text-[10px] tabular-nums ${
                        (description?.length ?? 0) >= 950
                          ? "text-rose-500"
                          : "text-gray-300"
                      }`}
                    >
                      {description?.length ?? 0}/1000
                    </span>
                  </div>
                </Field>

                {/* File Upload */}
                <Field
                  label="Supporting Document"
                  error={undefined}
                  hint="Optional — JPG, PNG, GIF, WEBP, PDF · max 5 MB"
                >
                  {uploadedFile ? (
                    /* ── File Preview ── */
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-rose-200 bg-rose-50/60">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {filePreview ? (
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-rose-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-800 truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {(uploadedFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 rounded-full hover:bg-rose-100 text-gray-400 hover:text-rose-500 transition-colors flex-shrink-0"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* ── Drop Zone ── */
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        fileInputRef.current?.click()
                      }
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}
                      className={`
                        flex flex-col items-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed
                        cursor-pointer transition-all duration-200 select-none
                        ${
                          isDragging
                            ? "border-rose-400 bg-rose-50"
                            : "border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 bg-gray-50/40"
                        }
                      `}
                    >
                      <Paperclip
                        className={`w-5 h-5 transition-colors ${
                          isDragging ? "text-rose-500" : "text-gray-400"
                        }`}
                      />
                      <p className="text-[12px] text-gray-500 text-center leading-snug">
                        <span className="font-medium text-rose-500">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                    </div>
                  )}
                  {/* Hidden input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </Field>
              </div>

              {/* ── Footer ── */}
              <div className="px-6 py-4 bg-gray-50/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <ChevronDown className="w-3 h-3 opacity-60" />
                  Your data is handled securely
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold shadow-sm active:scale-[0.97] transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-gray-400 mt-5">
          We typically respond within 24–48 hours on working days.
        </p>
      </div>
    </div>
  );
};
