import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, CheckCircle, Loader2 } from "lucide-react";

// Convert Arabic numerals to English
function convertArabicToEnglish(str: string): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let result = str;
  arabicNumerals.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, "g"), index.toString());
  });
  return result;
}

// Compress image to reduce upload time
async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function Home() {
  const [universityId, setUniversityId] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = trpc.achievements.submit.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      setUniversityId("");
      setDescription("");
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress("");
      toast.success("تم إرسال طلبك بنجاح!");
      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "حدث خطأ أثناء الإرسال");
      setUploadProgress("");
    },
  });

  const handleUniversityIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = convertArabicToEnglish(e.target.value);
    // Only allow numbers
    const numbersOnly = converted.replace(/[^0-9]/g, "");
    setUniversityId(numbersOnly);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!universityId || !description || !imageFile) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }

    setIsSubmitting(true);

    try {
      // Compress image before upload
      setUploadProgress("جاري ضغط الصورة...");
      const compressedBase64 = await compressImage(imageFile);
      
      setUploadProgress("جاري رفع الصورة...");
      await submitMutation.mutateAsync({
        universityId,
        description,
        imageBase64: compressedBase64,
        fileName: imageFile.name,
      });
    } catch {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">تم إرسال طلبك بنجاح</h2>
          <p className="text-muted-foreground">
            سيتم مراجعة طلبك من قبل فريق الموارد البشرية
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b py-4">
        <div className="container">
          <h1 className="text-lg font-medium">تسجيل الساعات التطوعية</h1>
          <p className="text-sm text-muted-foreground">
            نادي نظم المعلومات الإدارية
          </p>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          {/* University ID */}
          <div className="space-y-2">
            <Label htmlFor="universityId">الرقم الجامعي</Label>
            <Input
              id="universityId"
              type="text"
              inputMode="numeric"
              placeholder="مثال: 445101413"
              value={universityId}
              onChange={handleUniversityIdChange}
              className="text-left"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              يمكنك كتابة الرقم بالعربي أو الإنجليزي
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">وصف الإنجاز</Label>
            <Textarea
              id="description"
              placeholder="اكتب وصف لما قمت به، مثال: حضرت اليوم التعريفي للنادي"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              اشرح بإيجاز ما قمت به للحصول على الساعات التطوعية
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>صورة الإثبات</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-foreground/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded"
                  />
                  <p className="text-sm text-muted-foreground">
                    اضغط لتغيير الصورة
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    اضغط لرفع صورة الإثبات
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !universityId || !description || !imageFile}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                {uploadProgress || "جاري الإرسال..."}
              </>
            ) : (
              "إرسال الطلب"
            )}
          </Button>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          نادي نظم المعلومات الإدارية © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
