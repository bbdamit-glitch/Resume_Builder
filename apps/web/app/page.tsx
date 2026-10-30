"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Experience = { company: string; role: string; dates: string; bullets: string[] };
type Education = { school: string; degree: string; dates: string };

type ResumeData = {
  profile: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    summary: string;
    photo?: string;
  };
  design: {
    color: string;
    font: string;
    visibleSections: { summary: boolean; experience: boolean; skills: boolean; education: boolean };
  };
  skills: string[];
  experience: Experience[];
  education: Education[];
};

type Resume = {
  id: string;
  name: string;
  template: string;
  data: ResumeData;
  updatedAt: string;
};

const emptyData: ResumeData = {
  profile: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    summary: "",
    photo: "",
  },
  design: { color: "#3156a6", font: "Arial", visibleSections: { summary: true, experience: true, skills: true, education: true } },
  skills: [],
  experience: [],
  education: [],
};

function normalizeData(raw: any): ResumeData {
  const profile = raw?.profile || raw?.personal || {};
  return {
    profile: {
      fullName: profile.fullName || profile.name || "",
      title: profile.title || "",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
      linkedin: profile.linkedin || "",
      summary: raw?.summary || profile.summary || "",
      photo: profile.photo || "",
    },
    design: {
      color: raw?.design?.color || "#3156a6",
      font: raw?.design?.font || "Arial",
      visibleSections: {
        summary: raw?.design?.visibleSections?.summary !== false,
        experience: raw?.design?.visibleSections?.experience !== false,
        skills: raw?.design?.visibleSections?.skills !== false,
        education: raw?.design?.visibleSections?.education !== false,
      },
    },
    skills: Array.isArray(raw?.skills) ? raw.skills : [],
    experience: Array.isArray(raw?.experience) ? raw.experience : [],
    education: Array.isArray(raw?.education) ? raw.education : [],
  };
}

async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("rf_access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [token, setToken] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selected, setSelected] = useState<Resume | null>(null);
  const [draft, setDraft] = useState<ResumeData>(emptyData);
  const [skillsInput, setSkillsInput] = useState("");
  const [resumeName, setResumeName] = useState("My Resume");
  const [template, setTemplate] = useState("classic");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [showAtsAnalysis, setShowAtsAnalysis] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLetterCompany, setCoverLetterCompany] = useState("");
  const [coverLetterRole, setCoverLetterRole] = useState("");
  const [coverLetterStatus, setCoverLetterStatus] = useState("");
  const [pageCount, setPageCount] = useState<1 | 2 | 3>(2);
  const [uploadingResume, setUploadingResume] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const t = localStorage.getItem("rf_access_token");
        const storedUser = localStorage.getItem("rf_user");

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem("rf_user");
          }
        }

        if (t) {
          setToken(t);
          await loadResumes(t);

          const resumeId = new URLSearchParams(window.location.search).get("resumeId");
          if (resumeId) {
            await openResume(resumeId);
          }
        }
      } catch {
        localStorage.removeItem("rf_access_token");
        localStorage.removeItem("rf_user");
        if (!cancelled) {
          setToken("");
          setUser(null);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadResumes(t = token) {
    try {
      const data = await api("/resumes", {
        headers: { Authorization: `Bearer ${t}` },
      });
      setResumes(data);
    } catch {
      localStorage.removeItem("rf_access_token");
      setToken("");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      const data = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          mode === "register" ? { email, password, fullName } : { email, password },
        ),
      });
      localStorage.setItem("rf_access_token", data.accessToken);
      localStorage.setItem("rf_user", JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      await loadResumes(data.accessToken);
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  async function createResume() {
    setMessage("");
    try {
      const created = await api("/resumes", {
        method: "POST",
        body: JSON.stringify({
          name: "My New Resume",
          template: "classic",
          data: {
            ...emptyData,
            profile: {
              ...emptyData.profile,
              fullName: user?.fullName || "",
              email: user?.email || "",
            },
          },
        }),
      });
      await loadResumes();
      openResume(created.id);
    } catch (err: any) {
      setMessage(err.message);
    }
  }


  function parseImportedResume(text: string, filename: string): ResumeData {
    const lines = text
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const allText = lines.join("\n");
    const data: ResumeData = {
      ...emptyData,
      profile: { ...emptyData.profile },
      design: { ...emptyData.design, visibleSections: { ...emptyData.design.visibleSections } },
      skills: [],
      experience: [],
      education: [],
    };

    const email = allText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
    const phone = allText.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.replace(/\s+/g, " ").trim() || "";
    const linkedin = allText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Z0-9_-]+\/?/i)?.[0] || "";
    data.profile.email = email;
    data.profile.phone = phone;
    data.profile.linkedin = linkedin;

    const headingLike = (line: string) =>
      /^(professional\s+summary|summary|profile|objective|career\s+objective|work\s+experience|professional\s+experience|experience|employment\s+history|employment|work\s+history|skills|technical\s+skills|core\s+competencies|key\s+skills|education|academic\s+background|qualifications|certifications|projects|achievements|awards|languages|references|curriculum\s+vitae|resume|cv)$/i.test(line.replace(/[:|]/g, "").trim());
    const sectionNames: Record<string, string> = {
      "professional summary": "summary", summary: "summary", profile: "summary", objective: "summary", "career objective": "summary",
      "work experience": "experience", "professional experience": "experience", experience: "experience", employment: "experience", "employment history": "experience", "work history": "experience",
      skills: "skills", "technical skills": "skills", "core competencies": "skills", "key skills": "skills",
      education: "education", "academic background": "education", qualifications: "education",
    };
    const sections: Record<string, string[]> = { intro: [], summary: [], experience: [], skills: [], education: [], other: [] };
    let active = "intro";
    for (const line of lines) {
      const key = line.replace(/[:|]/g, "").trim().toLowerCase();
      if (headingLike(line)) {
        active = sectionNames[key] || "other";
        continue;
      }
      sections[active] = sections[active] || [];
      sections[active].push(line);
    }

    const firstNameLine = lines.find((line) =>
      line.length > 2 &&
      line.length < 70 &&
      !/@/.test(line) &&
      !/\d{5,}/.test(line) &&
      !headingLike(line) &&
      !/^(https?:\/\/|linkedin|phone|mobile|email|address|resume|curriculum vitae)/i.test(line)
    );
    if (firstNameLine) data.profile.fullName = firstNameLine;
    const titleCandidate = lines.slice(0, 8).find((line) =>
      line !== firstNameLine &&
      line.length > 2 &&
      line.length < 85 &&
      !/@/.test(line) &&
      !/\d{5,}/.test(line) &&
      !headingLike(line) &&
      !/linkedin\.com|https?:\/\//i.test(line) &&
      !/(?:\+?\d[\d\s().-]{7,}\d)/.test(line)
    );
    if (titleCandidate) data.profile.title = titleCandidate;

    const locationCandidate = lines.find((line) =>
      /(?:,\s*[A-Z]{2,}|india|united states|united kingdom|remote|hybrid)/i.test(line) &&
      line.length < 100 &&
      !/@/.test(line) &&
      !/linkedin\.com/i.test(line)
    );
    if (locationCandidate) data.profile.location = locationCandidate;

    const summaryLines = sections.summary.length ? sections.summary : sections.intro.slice(1, 5);
    data.profile.summary = summaryLines
      .filter((line) => line !== data.profile.title && line !== data.profile.fullName && !/@/.test(line) && !/linkedin\.com/i.test(line))
      .join(" ")
      .slice(0, 1800);

    const skillSource = sections.skills.join("\n");
    data.skills = Array.from(new Set(
      skillSource
        .split(/[,;|•●▪\n]+/)
        .map((skill) => skill.replace(/^[\s\-–—*]+|[\s\-–—*]+$/g, "").trim())
        .filter((skill) => skill.length > 1 && skill.length < 60 && !headingLike(skill))
    )).slice(0, 40);

    const datePattern = /(?:\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}\b|\b(?:19|20)\d{2}\b)\s*(?:[-–—to]+\s*(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}|\b(?:19|20)\d{2}\b|present|current))?/i;
    const experienceLines = sections.experience;
    if (experienceLines.length) {
      const groups: string[][] = [];
      for (const line of experienceLines) {
        if (!groups.length || (datePattern.test(line) && groups[groups.length - 1].some((x) => datePattern.test(x)))) groups.push([line]);
        else groups[groups.length - 1].push(line);
      }
      const cleanedGroups = groups.filter((group) => group.some((line) => line.length > 2));
      for (const group of cleanedGroups.slice(0, 8)) {
        const dateLine = group.find((line) => datePattern.test(line)) || "";
        const bullets = group
          .filter((line) => line !== dateLine)
          .map((line) => line.replace(/^[•●▪\-–—*]+\s*/, "").trim())
          .filter((line) => line.length > 2);
        const headerLines = bullets.filter((line) => line.length < 120 && !/[.!?]$/.test(line));
        const role = headerLines[0] || "Role";
        const company = headerLines[1] || "";
        const detailLines = bullets.filter((line) => line !== role && line !== company);
        data.experience.push({ role, company, dates: dateLine, bullets: detailLines.length ? detailLines : (bullets.length ? bullets.slice(1) : []) });
      }
      if (!data.experience.length) {
        data.experience.push({ role: "Imported experience — review details", company: "", dates: "", bullets: experienceLines.map((line) => line.replace(/^[•●▪\-–—*]+\s*/, "")) });
      }
    }

    const educationLines = sections.education;
    if (educationLines.length) {
      const dateLine = educationLines.find((line) => datePattern.test(line)) || "";
      const degreeLine = educationLines.find((line) => /bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|ph\.?d|diploma|degree|university|college|school|mba|bca|mca|certification/i.test(line)) || educationLines[0];
      const schoolLine = educationLines.find((line) => line !== degreeLine && line !== dateLine) || "";
      data.education.push({ school: schoolLine, degree: degreeLine, dates: dateLine });
      if (educationLines.length > 3) {
        for (const line of educationLines.slice(3, 8)) {
          if (line !== dateLine) data.education.push({ school: line, degree: "", dates: "" });
        }
      }
    }

    // Keep extracted information editable; don't pretend this heuristic parser is perfect.
    if (!data.profile.fullName) data.profile.fullName = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    return data;
  }

  async function uploadAndImportResume(file?: File) {
    if (!file) return;
    setMessage("");
    setUploadingResume(true);
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File is larger than 10 MB. Please upload a smaller resume.");
      }
      const extension = file.name.split(".").pop()?.toLowerCase();
      let extractedText = "";

      if (extension === "txt") {
        extractedText = await file.text();
      } else if (extension === "docx") {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        extractedText = result.value || "";
      } else if (extension === "pdf") {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        const pdf = await loadingTask.promise;
        const pageTexts: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const pdfPage = await pdf.getPage(pageNumber);
          const content = await pdfPage.getTextContent();
          pageTexts.push(content.items.map((item: any) => "str" in item ? item.str : "").join(" "));
        }
        extractedText = pageTexts.join("\n");
      } else {
        throw new Error("Please upload a PDF, DOCX, or TXT resume.");
      }

      if (!extractedText.trim()) {
        throw new Error("No selectable text found. If this is a scanned PDF or image, save it as a text-based PDF or DOCX and try again.");
      }
      const importedData = parseImportedResume(extractedText, file.name);
      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Imported Resume";
      const created = await api("/resumes", {
        method: "POST",
        body: JSON.stringify({
          name: `${baseName} (Imported)`.slice(0, 120),
          template: "classic",
          data: importedData,
        }),
      });
      await loadResumes();
      setMessage("Resume imported. Please review the extracted fields, correct anything inaccurate, choose a template, and save your new resume.");
      if (created?.id) await openResume(created.id);
    } catch (err: any) {
      setMessage(err?.message || "Could not import this resume. Please try another file.");
    } finally {
      setUploadingResume(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  }

  async function openResume(id: string) {
    setMessage("");
    try {
      const data = await api(`/resumes/${id}`);
      setSelected(data);
      setResumeName(data.name);
      setTemplate(data.template || "classic");
      const normalized = normalizeData(data.data);
      setDraft(normalized);
      setSkillsInput(normalized.skills.join(", "));
      window.history.replaceState(
        {},
        "",
        `/?resumeId=${encodeURIComponent(id)}`,
      );
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  async function saveResume() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      const skills = Array.from(new Set(skillsInput.split(",").map((skill) => skill.trim()).filter(Boolean)));
      const draftToSave = { ...draft, skills };
      await api(`/resumes/${selected.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: resumeName,
          template,
          data: draftToSave,
        }),
      });
      setDraft(draftToSave);
      setSkillsInput(skills.join(", "));
      await loadResumes();
      setSelected({ ...selected, name: resumeName, template, data: draftToSave });
      setMessage("Resume saved successfully.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function renameResume(r: Resume) {
    const nextName = prompt("Enter a new name for this resume:", r.name)?.trim();
    if (!nextName || nextName === r.name) return;
    try {
      await api(`/resumes/${r.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: nextName, template: r.template, data: r.data }),
      });
      if (selected?.id === r.id) setResumeName(nextName);
      await loadResumes();
      setMessage(`Resume renamed to "${nextName}".`);
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  async function duplicateResume(r: Resume) {
    try {
      const copyName = `${r.name} (Copy)`;
      const created = await api("/resumes", {
        method: "POST",
        body: JSON.stringify({ name: copyName, template: r.template, data: r.data }),
      });
      await loadResumes();
      setMessage(`Created "${copyName}".`);
      if (created?.id) await openResume(created.id);
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  async function deleteResume(id: string) {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    try {
      await api(`/resumes/${id}`, { method: "DELETE" });
      if (selected?.id === id) setSelected(null);
      await loadResumes();
      setMessage("Resume deleted.");
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  function generateCoverLetter() {
    const name = draft.profile.fullName || "Your Name";
    const role = coverLetterRole.trim() || draft.profile.title || "the advertised position";
    const company = coverLetterCompany.trim() || "your organization";
    const skills = draft.skills.slice(0, 5).join(", ");
    const experience = draft.experience.slice(0, 2).map((item) => `${item.role || "professional"} at ${item.company || "my previous organization"}`).join("; ");
    const summary = draft.profile.summary.trim();
    const paragraphs = [
      `${name}${draft.profile.email ? `\n${draft.profile.email}` : ""}${draft.profile.phone ? `\n${draft.profile.phone}` : ""}`,
      `Dear Hiring Manager,`,
      `I am writing to express my interest in the ${role} position at ${company}. I believe my background and skills could help me contribute to your team.`,
      summary ? summary : `My experience includes ${experience || "working on professional responsibilities and collaborating with teams"}.${skills ? ` My relevant skills include ${skills}.` : ""}`,
      `I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your time and consideration.`,
      `Sincerely,\n${name}`,
    ];
    setCoverLetter(paragraphs.join("\n\n"));
    setCoverLetterStatus("Draft generated. Review and personalize it before sending.");
  }

  async function copyCoverLetter() {
    const textToCopy = coverLetter.trim();
    if (!textToCopy) {
      setCoverLetterStatus("Generate a cover letter draft first, then click Copy Letter.");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        setCoverLetterStatus("Cover letter copied to clipboard.");
        return;
      }
    } catch {
      // Continue to the browser-compatible fallback below.
    }

    try {
      const temporaryTextarea = document.createElement("textarea");
      temporaryTextarea.value = textToCopy;
      temporaryTextarea.setAttribute("readonly", "");
      temporaryTextarea.style.position = "fixed";
      temporaryTextarea.style.opacity = "0";
      temporaryTextarea.style.pointerEvents = "none";
      document.body.appendChild(temporaryTextarea);
      temporaryTextarea.focus();
      temporaryTextarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(temporaryTextarea);
      setCoverLetterStatus(
        copied
          ? "Cover letter copied to clipboard."
          : "Automatic copy is blocked by this browser. Select the draft text and press Ctrl+C."
      );
    } catch {
      setCoverLetterStatus("Automatic copy is blocked by this browser. Select the draft text and press Ctrl+C.");
    }
  }

  function logout() {
    localStorage.removeItem("rf_access_token");
    localStorage.removeItem("rf_user");
    window.history.replaceState({}, "", "/");
    setToken("");
    setUser(null);
    setResumes([]);
    setSelected(null);
  }

  function updateProfile(field: keyof ResumeData["profile"], value: string) {
    setDraft((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  }

  function addExperience() {
    setDraft((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: "", role: "", dates: "", bullets: [""] },
      ],
    }));
  }

  function addEducation() {
    setDraft((prev) => ({
      ...prev,
      education: [...prev.education, { school: "", degree: "", dates: "" }],
    }));
  }

  function removeExperience(index: number) {
    setDraft((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  }

  function removeEducation(index: number) {
    setDraft((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  }

  const atsScore = useMemo(() => {
    let score = 0;
    if (draft.profile.fullName.trim()) score += 15;
    if (draft.profile.email.trim()) score += 10;
    if (draft.profile.title.trim()) score += 10;
    if (draft.profile.summary.trim().length >= 80) score += 15;
    else if (draft.profile.summary.trim()) score += 8;
    if (draft.skills.length >= 5) score += 15;
    else if (draft.skills.length) score += 8;
    if (draft.experience.length) score += 20;
    if (draft.education.length) score += 10;
    if (draft.profile.linkedin.trim()) score += 5;
    return Math.min(score, 100);
  }, [draft]);

  const atsAnalysis = useMemo(() => {
    const resumeText = [
      draft.profile.title,
      draft.profile.summary,
      ...draft.skills,
      ...draft.experience.flatMap((item) => [item.role, item.company, ...item.bullets]),
      ...draft.education.flatMap((item) => [item.school, item.degree]),
    ].join(" ").toLowerCase();
    const stopWords = new Set(["about", "above", "after", "again", "against", "also", "among", "and", "are", "based", "been", "being", "below", "between", "both", "but", "can", "could", "each", "for", "from", "have", "into", "its", "more", "most", "must", "not", "our", "over", "role", "should", "such", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "those", "through", "under", "using", "very", "was", "were", "what", "when", "where", "which", "while", "will", "with", "work", "you", "your", "years"]);
    const keywords = Array.from(new Set((jobDescription.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) || []).filter((word) => !stopWords.has(word))));
    const matched = keywords.filter((word) => resumeText.includes(word));
    const missing = keywords.filter((word) => !resumeText.includes(word)).slice(0, 20);
    const score = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;
    const suggestions: string[] = [];
    if (!draft.profile.summary.trim()) suggestions.push("Add a short professional summary tailored to this role.");
    if (draft.skills.length < 5) suggestions.push("Add relevant skills that you genuinely have and that appear in the job description.");
    if (!draft.experience.some((item) => item.bullets.some((bullet) => /\d/.test(bullet)))) suggestions.push("Where accurate, include measurable outcomes in experience bullets (time saved, delivery, quality, or scale).");
    if (missing.length) suggestions.push("Review the missing keywords and include only those that accurately describe your experience.");
    if (!suggestions.length) suggestions.push("Good coverage. Review the wording and make sure every claim is accurate and easy to verify.");
    return { total: keywords.length, matched, missing, score, suggestions };
  }, [draft, jobDescription]);

  if (!authReady) {
    return (
      <main className="shell">
        <section className="card auth-card" aria-live="polite">
          <div className="brand">ResumeForge</div>
          <p className="sub">Loading your workspace...</p>
        </section>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="shell">
        <section className="card auth-card">
          <div className="brand">ResumeForge</div>
          <p className="sub">Build a polished resume, your way.</p>
          <div className="tabs">
            <button type="button" aria-pressed={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Login</button>
            <button type="button" aria-pressed={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Register</button>
          </div>
          <form onSubmit={submit}>
            {mode === "register" && <label className="field">Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>}
            <label className="field">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="field">Password<input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <button type="submit" className="submit">{mode === "login" ? "Login" : "Create account"}</button>
          </form>
          {message && <div className="message">{message}</div>}
        </section>
      </main>
    );
  }

  if (selected) {
    return (
      <main className="editor-page">
        <header className="top">
          <strong>ResumeForge</strong>
          <div className="top-actions">
            <button onClick={() => {
              setSelected(null);
              window.history.replaceState({}, "", "/");
            }}>← Dashboard</button>
            <button type="button" className="save-button" onClick={saveResume} disabled={saving}>{saving ? "Saving..." : "Save Resume"}</button>
            <button type="button" onClick={() => window.print()}>Export PDF</button>
            <button onClick={logout}>Logout</button>
          </div>
        </header>

        <div className="editor-layout">
          <section className="editor-panel">
            <div className="editor-heading">
              <div>
                <h1>Resume Editor</h1>
                <p>Edit on the left and see the live preview on the right.</p>
              </div>
              <div className="score-box"><span>ATS Score</span><strong>{atsScore}/100</strong></div>
            </div>

            <label className="field">Resume name<input value={resumeName} onChange={(e) => setResumeName(e.target.value)} /></label>
            <label className="field">Resume template
              <select className="template-select" value={template} onChange={(e) => setTemplate(e.target.value)}>
                <option value="classic">01 · Classic ATS</option>
                <option value="modern">02 · Modern Blue</option>
                <option value="minimal">03 · Minimal Clean</option>
                <option value="professional">04 · Professional</option>
                <option value="executive">05 · Executive</option>
                <option value="creative">06 · Creative Accent</option>
                <option value="elegant">07 · Elegant Serif</option>
                <option value="compact">08 · Compact</option>
                <option value="sidebar">09 · Sidebar Style</option>
                <option value="bold">10 · Bold Header</option>
                <option value="tech">11 · Tech Specialist</option>
                <option value="academic">12 · Academic</option>
                <option value="corporate">13 · Corporate</option>
                <option value="simple">14 · Simple Mono</option>
                <option value="photo">15 · Profile Photo</option>
              </select>
            </label>

            <div className="section-title">Design customization</div>
            <div className="form-grid">
              <label className="field">Accent color
                <input type="color" value={draft.design.color} onChange={(e) => setDraft((prev) => ({ ...prev, design: { ...prev.design, color: e.target.value } }))} />
              </label>
              <label className="field">Font
                <select className="template-select" value={draft.design.font} onChange={(e) => setDraft((prev) => ({ ...prev, design: { ...prev.design, font: e.target.value } }))}>
                  <option value="Arial">Arial</option><option value="Helvetica">Helvetica</option><option value="Georgia">Georgia</option><option value="Verdana">Verdana</option><option value="Tahoma">Tahoma</option><option value="Trebuchet MS">Trebuchet MS</option>
                </select>
              </label>
            </div>
            <label className="field">Optional profile photo (JPG/PNG)
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { setMessage("Please choose a photo smaller than 5 MB."); e.currentTarget.value = ""; return; }
                const reader = new FileReader();
                reader.onload = () => {
                  const image = new Image();
                  image.onload = () => {
                    const canvas = document.createElement("canvas");
                    const maxSide = 320;
                    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
                    canvas.width = Math.max(1, Math.round(image.width * scale));
                    canvas.height = Math.max(1, Math.round(image.height * scale));
                    const context = canvas.getContext("2d");
                    if (!context) { setMessage("Could not process this photo. Please try another image."); return; }
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    const compressed = canvas.toDataURL("image/jpeg", 0.65);
                    if (compressed.length > 110000) { setMessage("This photo is still too large. Please choose a smaller image."); return; }
                    setDraft((prev) => ({ ...prev, profile: { ...prev.profile, photo: compressed } }));
                    setMessage("Profile photo added. Save the resume to keep it.");
                  };
                  image.onerror = () => setMessage("Could not read this photo. Please try another image.");
                  image.src = String(reader.result || "");
                };
                reader.readAsDataURL(file);
              }} />
            </label>
            {draft.profile.photo && <div className="photo-control"><img src={draft.profile.photo} alt="Profile preview" /><button type="button" className="small-button" onClick={() => setDraft((prev) => ({ ...prev, profile: { ...prev.profile, photo: "" } }))}>Remove photo</button></div>}
            <div className="section-title">Show / hide resume sections</div>
            <div className="section-toggles">
              {([{key:"summary",label:"Professional summary"},{key:"experience",label:"Experience"},{key:"skills",label:"Skills"},{key:"education",label:"Education"}] as const).map((item) => (
                <label className="toggle-label" key={item.key}><input type="checkbox" checked={draft.design.visibleSections[item.key]} onChange={(e) => setDraft((prev) => ({ ...prev, design: { ...prev.design, visibleSections: { ...prev.design.visibleSections, [item.key]: e.target.checked } } }))} />{item.label}</label>
              ))}
            </div>

            <div className="section-title">Personal Information</div>
            <div className="form-grid">
              <label className="field">Full name<input value={draft.profile.fullName} onChange={(e) => updateProfile("fullName", e.target.value)} /></label>
              <label className="field">Job title<input value={draft.profile.title} onChange={(e) => updateProfile("title", e.target.value)} /></label>
              <label className="field">Email<input value={draft.profile.email} onChange={(e) => updateProfile("email", e.target.value)} /></label>
              <label className="field">Phone<input value={draft.profile.phone} onChange={(e) => updateProfile("phone", e.target.value)} /></label>
              <label className="field">Location<input value={draft.profile.location} onChange={(e) => updateProfile("location", e.target.value)} /></label>
              <label className="field">LinkedIn<input value={draft.profile.linkedin} onChange={(e) => updateProfile("linkedin", e.target.value)} /></label>
            </div>

            <div className="section-title">Professional Summary</div>
            <label className="field"><textarea rows={6} value={draft.profile.summary} onChange={(e) => updateProfile("summary", e.target.value)} placeholder="Write a concise professional summary..." /></label>

            <div className="section-title">Skills</div>
            <label className="field"><input value={skillsInput} onChange={(e) => {
              const value = e.target.value;
              setSkillsInput(value);
              setDraft((prev) => ({
                ...prev,
                skills: Array.from(new Set(value.split(",").map((skill) => skill.trim()).filter(Boolean))),
              }));
            }} onBlur={() => setSkillsInput((value) => Array.from(new Set(value.split(",").map((skill) => skill.trim()).filter(Boolean))).join(", "))} placeholder="Azure, Terraform, Scrum, DevOps" /></label>

            <div className="section-title row-between"><span>Experience</span><button type="button" className="small-button" onClick={addExperience}>+ Add experience</button></div>
            {draft.experience.map((exp, index) => (
              <div className="nested-card" key={index}>
                <div className="row-between"><strong>Experience {index + 1}</strong><button type="button" className="danger-button" onClick={() => removeExperience(index)}>Remove</button></div>
                <div className="form-grid">
                  <label className="field">Company<input value={exp.company} onChange={(e) => setDraft((prev) => ({ ...prev, experience: prev.experience.map((item, i) => i === index ? { ...item, company: e.target.value } : item) }))} /></label>
                  <label className="field">Role<input value={exp.role} onChange={(e) => setDraft((prev) => ({ ...prev, experience: prev.experience.map((item, i) => i === index ? { ...item, role: e.target.value } : item) }))} /></label>
                  <label className="field">Dates<input value={exp.dates} onChange={(e) => setDraft((prev) => ({ ...prev, experience: prev.experience.map((item, i) => i === index ? { ...item, dates: e.target.value } : item) }))} /></label>
                </div>
                <label className="field">Responsibilities / achievements<textarea rows={4} value={exp.bullets.join("\n")} onChange={(e) => setDraft((prev) => ({ ...prev, experience: prev.experience.map((item, i) => i === index ? { ...item, bullets: e.target.value.split("\n") } : item) }))} placeholder="One achievement per line" /></label>
              </div>
            ))}

            <div className="section-title row-between"><span>Education</span><button type="button" className="small-button" onClick={addEducation}>+ Add education</button></div>
            {draft.education.map((edu, index) => (
              <div className="nested-card" key={index}>
                <div className="row-between"><strong>Education {index + 1}</strong><button type="button" className="danger-button" onClick={() => removeEducation(index)}>Remove</button></div>
                <div className="form-grid">
                  <label className="field">School<input value={edu.school} onChange={(e) => setDraft((prev) => ({ ...prev, education: prev.education.map((item, i) => i === index ? { ...item, school: e.target.value } : item) }))} /></label>
                  <label className="field">Degree<input value={edu.degree} onChange={(e) => setDraft((prev) => ({ ...prev, education: prev.education.map((item, i) => i === index ? { ...item, degree: e.target.value } : item) }))} /></label>
                  <label className="field">Dates<input value={edu.dates} onChange={(e) => setDraft((prev) => ({ ...prev, education: prev.education.map((item, i) => i === index ? { ...item, dates: e.target.value } : item) }))} /></label>
                </div>
              </div>
            ))}

            <section className="ats-analyzer">
              <div className="section-title">Phase 3 · ATS Job Match Analyzer</div>
              <p className="ats-help">Paste the job description to compare its keywords with your resume. This is a simple local estimate, not a guarantee of an employer's ATS score.</p>
              <label className="field">Job description<textarea rows={7} value={jobDescription} onChange={(e) => { setJobDescription(e.target.value); setShowAtsAnalysis(false); }} placeholder="Paste the job description here..." /></label>
              <button type="button" className="save-button" onClick={() => setShowAtsAnalysis(true)} disabled={!jobDescription.trim()}>Analyze Job Match</button>
              {showAtsAnalysis && (
                <div className="ats-results" aria-live="polite">
                  <div className="ats-result-head"><div><span>Keyword match estimate</span><strong>{atsAnalysis.score}%</strong></div><div><span>Keywords found</span><strong>{atsAnalysis.matched.length}/{atsAnalysis.total}</strong></div></div>
                  <div className="ats-progress"><div style={{ width: `${atsAnalysis.score}%` }} /></div>
                  <h4>Matched keywords</h4>
                  {atsAnalysis.matched.length ? <div className="keyword-list">{atsAnalysis.matched.map((word) => <span className="keyword matched" key={word}>{word}</span>)}</div> : <p>No matching keywords found yet.</p>}
                  <h4>Potentially missing keywords</h4>
                  {atsAnalysis.missing.length ? <div className="keyword-list">{atsAnalysis.missing.map((word) => <span className="keyword missing" key={word}>{word}</span>)}</div> : <p>No missing keywords from the extracted list.</p>}
                  <h4>Suggestions</h4><ul className="ats-suggestions">{atsAnalysis.suggestions.map((tip) => <li key={tip}>{tip}</li>)}</ul>
                  <p className="ats-disclaimer">Use only relevant keywords that truthfully reflect your skills and experience. This analyzer checks simple word matches; it does not use an external ATS system or AI service.</p>
                </div>
              )}
            </section>

            <section className="cover-letter-panel">
              <div className="section-title">Phase 5 · Cover Letter Builder</div>
              <p className="ats-help">Create a first-draft cover letter using details from this resume. This runs locally in your browser and does not send your information to an AI service.</p>
              <div className="form-grid">
                <label className="field">Target role<input value={coverLetterRole} onChange={(e) => setCoverLetterRole(e.target.value)} placeholder="e.g. Scrum Master" /></label>
                <label className="field">Company name<input value={coverLetterCompany} onChange={(e) => setCoverLetterCompany(e.target.value)} placeholder="e.g. Example Ltd." /></label>
              </div>
              <div className="cover-letter-actions">
                <button type="button" className="save-button" onClick={generateCoverLetter}>Generate Draft</button>
                <button type="button" className="small-button" onClick={copyCoverLetter}>Copy Letter</button>
              </div>
              <label className="field">Cover letter draft<textarea className="cover-letter-text" rows={12} value={coverLetter} onChange={(e) => { setCoverLetter(e.target.value); setCoverLetterStatus(""); }} placeholder="Your generated cover letter will appear here. You can edit it before copying." /></label>
              {coverLetterStatus && <p className="cover-letter-status" aria-live="polite">{coverLetterStatus}</p>}
              <p className="ats-disclaimer">Review every detail for accuracy. Add genuine achievements and tailor the letter to the actual job description before sending.</p>
            </section>

            {message && <div className="message">{message}</div>}
          </section>

          <aside className="preview-panel">
            <style>{`@media print { .resume-preview-scroll { max-height: none !important; height: auto !important; overflow: visible !important; } .resume-sheet { width: 100% !important; min-height: 0 !important; margin: 0 !important; box-shadow: none !important; border: 0 !important; break-after: page; page-break-after: always; } .resume-sheet:last-child { break-after: auto; page-break-after: auto; } .resume-page-number { display: block !important; } }`}</style>
            <div className="preview-header">
              <strong>Live Preview</strong>
              <span>Template: {template}</span>
              <label className="preview-page-control" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>Pages
                <select aria-label="Resume page count" value={pageCount} onChange={(e) => setPageCount(Number(e.target.value) as 1 | 2 | 3)} style={{ padding: "6px 8px", border: "1px solid #cfd6e4", borderRadius: 8, background: "white" }}>
                  <option value={1}>1 page</option>
                  <option value={2}>2 pages</option>
                  <option value={3}>3 pages</option>
                </select>
              </label>
            </div>
            {(() => {
              const experiences = draft.design.visibleSections.experience ? draft.experience : [];
              const splitAt = Math.ceil(experiences.length / pageCount);
              const splitAt2 = Math.ceil((experiences.length - splitAt) / Math.max(1, pageCount - 1)) + splitAt;
              const chunks = pageCount === 1
                ? [experiences]
                : pageCount === 2
                  ? [experiences.slice(0, splitAt), experiences.slice(splitAt)]
                  : [experiences.slice(0, splitAt), experiences.slice(splitAt, splitAt2), experiences.slice(splitAt2)];
              const visible = draft.design.visibleSections;
              const showSummary = visible.summary && Boolean(draft.profile.summary);
              const showSkills = visible.skills && draft.skills.length > 0;
              const showEducation = visible.education && draft.education.length > 0;
              const renderExperience = (items: Experience[]) => items.length > 0 && <section><h3>EXPERIENCE</h3>{items.map((exp, i) => <div className="preview-item" key={`${exp.company}-${exp.role}-${i}`}><div className="item-head"><strong>{exp.role || "Role"}</strong><span>{exp.dates}</span></div><div className="company">{exp.company}</div><ul>{exp.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}</ul></div>)}</section>;
              const renderSkills = () => showSkills && <section><h3>SKILLS</h3><p>{draft.skills.join(" • ")}</p></section>;
              const renderEducation = () => showEducation && <section><h3>EDUCATION</h3>{draft.education.map((edu, i) => <div className="preview-item" key={`${edu.school}-${edu.degree}-${i}`}><div className="item-head"><strong>{edu.degree || "Degree"}</strong><span>{edu.dates}</span></div><div className="company">{edu.school}</div></div>)}</section>;
              const sheet = (pageIndex: number, children: any) => <div className={`resume-paper resume-sheet template-${template}`} key={pageIndex} style={{ ["--resume-accent" as any]: draft.design.color, fontFamily: draft.design.font, width: "794px", minHeight: "1123px", boxSizing: "border-box", marginBottom: "18px", position: "relative", breakAfter: pageIndex < pageCount - 1 ? "page" : "auto", pageBreakAfter: pageIndex < pageCount - 1 ? "always" : "auto" }}><div className="resume-page-number" style={{ position: "absolute", bottom: 16, right: 22, fontSize: 11, color: "#667085" }}>Page {pageIndex + 1} of {pageCount}</div>{children}</div>;
              const identity = <><div className="resume-identity">{draft.profile.photo && <img className="resume-photo" src={draft.profile.photo} alt="Profile" />}<div className="resume-identity-text"><h1>{draft.profile.fullName || "Your Name"}</h1><h2>{draft.profile.title || "Professional Title"}</h2></div></div><div className="contact-line">{[draft.profile.email, draft.profile.phone, draft.profile.location, draft.profile.linkedin].filter(Boolean).join("  •  ") || "Email • Phone • Location"}</div></>;
              if (pageCount === 1) {
                return <div className="resume-preview-scroll" style={{ maxHeight: "75vh", overflowY: "auto", overflowX: "auto", overscrollBehavior: "contain", borderRadius: 8 }}>{sheet(0, <>{identity}{showSummary && <section><h3>SUMMARY</h3><p>{draft.profile.summary}</p></section>}{renderExperience(experiences)}{renderSkills()}{renderEducation()}</>)}</div>;
              }
              if (pageCount === 2) {
                return <div className="resume-preview-scroll" style={{ maxHeight: "75vh", overflowY: "auto", overflowX: "auto", overscrollBehavior: "contain", borderRadius: 8 }}>{sheet(0, <>{identity}{showSummary && <section><h3>SUMMARY</h3><p>{draft.profile.summary}</p></section>}{renderExperience(chunks[0])}</>)}{sheet(1, <>{renderExperience(chunks[1])}{renderSkills()}{renderEducation()}</>)}</div>;
              }
              return <div className="resume-preview-scroll" style={{ maxHeight: "75vh", overflowY: "auto", overflowX: "auto", overscrollBehavior: "contain", borderRadius: 8 }}>{sheet(0, <>{identity}{showSummary && <section><h3>SUMMARY</h3><p>{draft.profile.summary}</p></section>}{renderExperience(chunks[0])}</>)}{sheet(1, <>{renderExperience(chunks[1])}{renderSkills()}</>)}{sheet(2, <>{renderExperience(chunks[2])}{renderEducation()}</>)}</div>;
            })()}
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="top"><strong>ResumeForge</strong><button onClick={logout}>Logout</button></header>
      <section className="main">
        <div className="hero">
          <div><h1>Welcome{user?.fullName ? `, ${user.fullName}` : ""}.</h1><p>Create a resume from scratch or upload an existing one to edit and redesign it.</p></div>
          <div className="hero-actions">
            <button className="hero-secondary" type="button" onClick={() => uploadInputRef.current?.click()} disabled={uploadingResume}>{uploadingResume ? "Importing resume..." : "↑ Upload existing resume"}</button>
            <button className="primary" onClick={createResume}>+ New resume</button>
            <input
              ref={uploadInputRef}
              className="resume-upload-input"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => uploadAndImportResume(event.target.files?.[0])}
              aria-label="Upload an existing resume"
            />
          </div>
        </div>
        <div className="grid">
          {resumes.map((r) => <article className="resume" key={r.id}>
            <h3>{r.name}</h3>
            <p>Template: {r.template}</p>
            <p>Updated: {new Date(r.updatedAt).toLocaleString()}</p>
            <div className="card-actions phase4-actions">
              <button className="small-button" onClick={() => openResume(r.id)}>Open & Edit</button>
              <button className="small-button" onClick={() => renameResume(r)}>Rename</button>
              <button className="small-button" onClick={() => duplicateResume(r)}>Duplicate</button>
              <button className="danger-button" onClick={() => deleteResume(r.id)}>Delete</button>
            </div>
          </article>)}
          {!resumes.length && <article className="resume"><h3>No resumes yet</h3><p>Create your first resume.</p></article>}
        </div>
        {message && <div className="message">{message}</div>}
      </section>
    </main>
  );
}
