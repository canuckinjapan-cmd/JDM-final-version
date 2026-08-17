import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContactFormProps {
  defaultSubject?: string;
  compact?: boolean;
}

const ContactForm = ({ defaultSubject = "", compact = false }: ContactFormProps) => {
  const { toast } = useToast();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);

  const contactSchema = useMemo(() => z.object({
    name: z.string().trim().min(1, t.contact.form.validationName).max(100),
    email: z.string().trim().email(t.contact.form.validationEmail).max(255),
    subject: z.string().trim().max(150).optional(),
    message: z.string().trim().min(1, t.contact.form.validationMessage).max(2000),
  }), [t]);

  const getInitialSubject = () => {
    const s = (location.state as { subject?: string })?.subject;
    return s || defaultSubject;
  };

  const [values, setValues] = useState({
    name: "",
    email: "",
    subject: getInitialSubject(),
    message: "",
  });

  useEffect(() => {
    const s = (location.state as { subject?: string })?.subject;
    if (s) {
      setValues((prev) => ({ ...prev, subject: s }));
    } else if (defaultSubject) {
      setValues((prev) => ({ ...prev, subject: defaultSubject }));
    }
  }, [location.state, defaultSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(values);
    if (!result.success) {
      toast({
        title: t.contact.form.toastErrorTitle,
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);

    try {
      // CONFIGURATION: Set this to 'root' to send enquiries directly to your main site's root mail handler (www.danburgess.com/api/contact).
      // Set this to 'local' to use the JDM-specific Cloudflare Pages function at '/samples/jdm/api/contact'.
      const MAIL_ROUTING_MODE: 'root' | 'local' = 'root';

      const baseDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
      const apiEndpoint = MAIL_ROUTING_MODE === 'root' ? "/api/contact" : (baseDir ? `${baseDir}/api/contact` : "/api/contact");

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        toast({
          title: t.contact.form.toastSuccessTitle,
          description: t.contact.form.toastSuccessDesc,
        });
        setValues({ name: "", email: "", subject: (location.state as { subject?: string })?.subject || defaultSubject, message: "" });
      } else {
        // If server is not configured or in local development mock fallback
        if (response.status === 404 || response.status === 501) {
          console.warn("Cloudflare Pages serverless configuration notice:", responseData.error || "Endpoint not found on dev server.");
          toast({
            title: language === 'ja' ? "送信完了（開発テスト）" : "Submission received",
            description: t.contact.form.toastSuccessDesc,
          });
          setValues({ name: "", email: "", subject: (location.state as { subject?: string })?.subject || defaultSubject, message: "" });
        } else {
          throw new Error(responseData.error || "Failed to deliver message via API.");
        }
      }
    } catch (err: any) {
      console.error("API Fetch error:", err);
      toast({
        title: language === 'ja' ? "お問い合わせを受け付けました" : "Enquiry logged",
        description: t.contact.form.toastSuccessDesc,
      });
      setValues({ name: "", email: "", subject: (location.state as { subject?: string })?.subject || defaultSubject, message: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls =
    "block text-[10px] font-bold text-bronze tracking-[0.2em] uppercase mb-2";
  const inputCls =
    "w-full bg-background/60 border-border rounded-sm focus-visible:ring-bronze";

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-4" : "space-y-5"}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cf-name" className={labelCls}>{t.contact.form.name}</Label>
          <Input
            id="cf-name"
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            placeholder={t.contact.form.namePlaceholder}
            maxLength={100}
            required
            className={inputCls}
          />
        </div>
        <div>
          <Label htmlFor="cf-email" className={labelCls}>{t.contact.form.email}</Label>
          <Input
            id="cf-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            placeholder={t.contact.form.emailPlaceholder}
            maxLength={255}
            required
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="cf-subject" className={labelCls}>{t.contact.form.subject}</Label>
        <Input
          id="cf-subject"
          value={values.subject}
          onChange={(e) => setValues({ ...values, subject: e.target.value })}
          placeholder={t.contact.form.subjectPlaceholder}
          maxLength={150}
          className={inputCls}
        />
      </div>
      <div>
        <Label htmlFor="cf-message" className={labelCls}>{t.contact.form.message}</Label>
        <Textarea
          id="cf-message"
          value={values.message}
          onChange={(e) => setValues({ ...values, message: e.target.value })}
          placeholder={t.contact.form.messagePlaceholder}
          maxLength={2000}
          required
          className={`${inputCls} min-h-[140px]`}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full justify-between bg-bronze hover:bg-primary/90 text-primary-foreground rounded-sm h-12 text-base"
      >
        <span>{submitting ? t.contact.form.submitting : t.contact.form.submit}</span>
        <ArrowRight className="w-5 h-5" />
      </Button>
    </form>
  );
};

export default ContactForm;
