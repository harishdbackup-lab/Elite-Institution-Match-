import { useState, type ReactNode, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  MapPin, 
  GraduationCap, 
  Search, 
  ExternalLink, 
  ArrowLeft,
  Sparkles,
  Loader2,
  Trophy,
  Star,
  ShieldCheck,
  Plus,
  Check,
  X,
  Columns,
  Compass,
  BrainCircuit,
  Clock,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  Code,
  FileText,
  Hammer,
  Briefcase,
  BookOpen,
  Users,
  Microscope,
  Lightbulb,
  CheckCircle2,
  Library,
  ArrowUpDown,
  Book as BookIcon,
  Pencil
} from "lucide-react";
import { Background } from "./components/Background";
import { FloatingObject } from "./components/FloatingObject";
import { GlassCard } from "./components/GlassCard";
import { StepContainer } from "./components/StepContainer";
import { 
  searchColleges, 
  recommendCourses, 
  generateRoadmap,
  generateSkillBasedRoadmap,
  analyzeAdmissionSystem,
  type College, 
  type TieredColleges, 
  type RecommendedCourse, 
  type CourseRecommendations,
  type CareerRoadmap,
  type SkillBasedCareerResponse,
  type AdmissionSystemResponse
} from "./services/geminiService";
import { cn } from "./lib/utils";
import { states, cities } from "./constants/locations";

type Step = "HOME" | "LOCATION" | "STREAM" | "ADMISSION_ANALYSIS" | "COURSE_GUIDANCE" | "RESULTS" | "COMPARE" | "ROADMAP" | "SKILL_INPUT" | "SKILL_ROADMAP";

type Stream = 
  | "Computer Science (PCM / Engineering)"
  | "Bio-Math (PCMB)"
  | "Pure Science (PCB)"
  | "Commerce"
  | "Arts";

const getActionIcon = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes("code") || a.includes("programming") || a.includes("software") || a.includes("dev")) return <Code className="w-4 h-4" />;
  if (a.includes("intern") || a.includes("job") || a.includes("work")) return <Briefcase className="w-4 h-4" />;
  if (a.includes("exam") || a.includes("test") || a.includes("admission") || a.includes("score")) return <FileText className="w-4 h-4" />;
  if (a.includes("project") || a.includes("build") || a.includes("hammer")) return <Hammer className="w-4 h-4" />;
  if (a.includes("book") || a.includes("read") || a.includes("theory") || a.includes("concept") || a.includes("study")) return <BookOpen className="w-4 h-4" />;
  if (a.includes("peer") || a.includes("club") || a.includes("group") || a.includes("team") || a.includes("users")) return <Users className="w-4 h-4" />;
  if (a.includes("research") || a.includes("lab")) return <Microscope className="w-4 h-4" />;
  if (a.includes("learn") || a.includes("skill") || a.includes("idea")) return <Lightbulb className="w-4 h-4" />;
  return <CheckCircle2 className="w-4 h-4" />;
};

export default function App() {
  const [step, setStep] = useState<Step>("HOME");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [stream, setStream] = useState<Stream | "">("");
  const [recommendations, setRecommendations] = useState<TieredColleges | null>(null);
  const [courseRecs, setCourseRecs] = useState<CourseRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [selectedColleges, setSelectedColleges] = useState<College[]>([]);
  const [guidanceMode, setGuidanceMode] = useState<"guided" | "ai_recommend" | "">("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [goal, setGoal] = useState("");
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillRoadmapResponse, setSkillRoadmapResponse] = useState<SkillBasedCareerResponse | null>(null);
  const [skillRoadmapLoading, setSkillRoadmapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [admissionSystem, setAdmissionSystem] = useState<AdmissionSystemResponse | null>(null);
  const [admissionLoading, setAdmissionLoading] = useState(false);
  const [studentScores, setStudentScores] = useState<Record<string, string>>({});
  
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const stateRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) {
        setShowStateDropdown(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    
    // Debug: Check if API key is present
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API Key is missing in the client environment.");
    } else {
      console.log("Gemini API Key is configured.");
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStates = states.filter(s =>
    s.toLowerCase().includes(state.toLowerCase())
  );

  const filteredCities = (cities[state] || []).filter(c =>
    c.toLowerCase().includes(city.toLowerCase())
  );

  const handleSearch = async (course?: string) => {
    if (!state || !city || !stream) return;
    const searchCourse = course || selectedCourse;
    setLoading(true);
    setError(null);
    setStep("RESULTS");
    setSelectedColleges([]);
    try {
      const results = await searchColleges(state, city, stream as string, searchCourse, studentScores);
      if (!results) throw new Error("No results found");
      setRecommendations(results);
    } catch (err: any) {
      const errorString = err instanceof Error ? err.message : JSON.stringify(err);
      const isRateLimit = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED") || errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED");
      
      setError(isRateLimit 
        ? "AI is currently busy (Rate limit reached). Please try again in a few minutes." 
        : "Failed to fetch colleges. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseGuidance = async (mode: "guided" | "ai_recommend") => {
    setGuidanceMode(mode);
    setSelectedCourse("");
    setCourseLoading(true);
    setError(null);
    try {
      const results = await recommendCourses(stream as string, mode);
      if (!results) throw new Error("Failed to get recommendations");
      setCourseRecs(results);
    } catch (err: any) {
      const errorString = err instanceof Error ? err.message : JSON.stringify(err);
      const isRateLimit = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED") || errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED");
      
      setError(isRateLimit 
        ? "AI is currently busy (Rate limit reached). Please try again in a few minutes." 
        : "Failed to get course recommendations. Please try again.");
    } finally {
      setCourseLoading(false);
    }
  };

  const handleAdmissionAnalysis = async () => {
    if (!state || !stream) return;
    setAdmissionLoading(true);
    setError(null);
    setStep("ADMISSION_ANALYSIS");
    try {
      const result = await analyzeAdmissionSystem(state, stream);
      if (!result) throw new Error("Failed to analyze admission system");
      setAdmissionSystem(result);
      // Initialize scores
      const initialScores: Record<string, string> = {};
      result.fields.forEach(f => initialScores[f.name] = "");
      setStudentScores(initialScores);
    } catch (err: any) {
      const errorString = err instanceof Error ? err.message : JSON.stringify(err);
      const isRateLimit = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED") || errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED");
      
      setError(isRateLimit 
        ? "AI is currently busy (Rate limit reached). Please try again in a few minutes." 
        : "Failed to analyze admission system. Please try again.");
      setStep("STREAM");
    } finally {
      setAdmissionLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!stream || !selectedCourse) return;
    setRoadmapLoading(true);
    setError(null);
    setStep("ROADMAP");
    try {
      const result = await generateRoadmap(stream as string, selectedCourse, goal);
      if (!result) throw new Error("Failed to generate roadmap");
      setRoadmap(result);
    } catch (err: any) {
      const errorString = err instanceof Error ? err.message : JSON.stringify(err);
      const isRateLimit = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED") || errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED");
      
      setError(isRateLimit
        ? "AI is currently busy (Rate limit reached). Please try again in a few minutes."
        : "Failed to generate roadmap. Please try again.");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleGenerateSkillRoadmap = async () => {
    if (skills.length === 0) return;
    setSkillRoadmapLoading(true);
    setError(null);
    setStep("SKILL_ROADMAP");
    try {
      const result = await generateSkillBasedRoadmap(skills, goal);
      if (!result) throw new Error("Failed to generate roadmap");
      setSkillRoadmapResponse(result);
    } catch (err: any) {
      const errorString = err instanceof Error ? err.message : JSON.stringify(err);
      const isRateLimit = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED") || errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED");
      
      setError(isRateLimit
        ? "AI is currently busy (Rate limit reached). Please try again in a few minutes."
        : "Failed to generate skill roadmap. Please try again.");
    } finally {
      setSkillRoadmapLoading(false);
    }
  };

  const toggleCollegeSelection = (college: College) => {
    setSelectedColleges(prev => {
      const isSelected = prev.some(c => c.name === college.name);
      if (isSelected) {
        return prev.filter(c => c.name !== college.name);
      } else {
        if (prev.length >= 4) return prev; // Limit to 4 for comparison
        return [...prev, college];
      }
    });
  };

  const nextStep = () => {
    setError(null);
    if (step === "HOME") setStep("LOCATION");
    else if (step === "LOCATION") {
      if (state && city) setStep("STREAM");
    }
    else if (step === "STREAM") {
      if (stream) handleAdmissionAnalysis();
    }
    else if (step === "ADMISSION_ANALYSIS") {
      setStep("COURSE_GUIDANCE");
    }
  };

  const prevStep = () => {
    setError(null);
    if (step === "LOCATION") setStep("HOME");
    else if (step === "STREAM") setStep("LOCATION");
    else if (step === "ADMISSION_ANALYSIS") setStep("STREAM");
    else if (step === "COURSE_GUIDANCE") setStep("ADMISSION_ANALYSIS");
    else if (step === "RESULTS") setStep("COURSE_GUIDANCE");
    else if (step === "COMPARE") setStep("RESULTS");
    else if (step === "ROADMAP") setStep("RESULTS");
    else if (step === "SKILL_INPUT") setStep("HOME");
    else if (step === "SKILL_ROADMAP") setStep("SKILL_INPUT");
  };

  const renderCollegeGrid = (colleges: College[], title: string, icon: ReactNode, colorClass: string, key: string) => {
    if (!colleges || colleges.length === 0) return null;
    return (
      <div key={key} className="space-y-6">
        <div className={cn("flex items-center gap-3 px-6 py-2.5 rounded-full w-fit border shadow-sm", colorClass)}>
          <div className="p-1 px-1.5 bg-white/20 rounded-lg">
            {icon}
          </div>
          <span className="font-black uppercase tracking-[0.2em] text-[10px]">{title}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {colleges.map((college, idx) => {
            const isSelected = selectedColleges.some(c => c.name === college.name);
            return (
              <motion.div 
                key={idx}
                whileHover={{ y: -8 }}
                className="relative"
              >
                <GlassCard className="flex flex-col h-full border-slate-200/60 shadow-[0_15px_50px_rgba(30,58,138,0.03)] hover:border-blue-200 transition-all group overflow-visible">
                  <button 
                    onClick={() => toggleCollegeSelection(college)}
                    className={cn(
                      "absolute -top-4 -right-4 px-4 py-3 rounded-2xl border transition-all z-20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl",
                      isSelected 
                        ? "bg-blue-900 border-blue-800 text-white" 
                        : "bg-white border-slate-200 text-slate-500 hover:border-blue-400 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        Tracking
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                        Compare
                      </>
                    )}
                  </button>

                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-blue-50 rounded-2xl group-hover:bg-blue-900 group-hover:text-white transition-all">
                        <GraduationCap className="w-7 h-7" strokeWidth={2.5} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-900 font-black text-[9px] uppercase tracking-widest">
                          <MapPin className="w-3 h-3" />
                          {college.city}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight line-clamp-2">{college.name}</h3>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Elite Program</span>
                        <span className="text-slate-900 font-bold">{college.best_course}</span>
                      </div>
                      <div className="h-px bg-slate-100" />
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Avg Fiscal Return</span>
                        <span className="text-blue-900 font-black">{college.avg_package}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                       <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-blue-900" />
                          {college.admission_mode}
                       </div>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 italic">
                      {college.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                     <a
                        href={college.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-blue-900 uppercase tracking-widest hover:underline flex items-center gap-1"
                      >
                        Portal Access <ExternalLink className="w-3 h-3" />
                     </a>
                     <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={cn("w-1 h-3 rounded-full", i <= 4 ? "bg-blue-900" : "bg-slate-200")} />
                        ))}
                     </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30">
      <Background />
      
      <main className="container mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen relative z-10">
        
        {/* Navigation / Back Button */}
        {step !== "HOME" && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={prevStep}
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-blue-900 transition-colors group z-50 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back</span>
          </motion.button>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-700 relative z-[100] shadow-sm"
            >
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <AlertCircle className="w-6 h-6 shrink-0" />
              </div>
              <p className="text-sm font-bold flex-1">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="p-2 hover:bg-white rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === "HOME" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-12"
            >
              <div className="flex flex-col items-center gap-12">
                <FloatingObject />
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm"
                  >
                    <Library className="w-3 h-3" />
                    Educational Excellence
                  </motion.div>
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9] font-serifitalic"
                  >
                    Academic <br />
                    <span className="text-blue-900 italic">navigator.</span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed"
                  >
                    Empowering students with AI-driven college matching and strategic career roadmaps for the modern era.
                  </motion.p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-8">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(30,58,138,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="px-10 py-6 bg-blue-900 rounded-[2rem] text-white text-xl font-bold flex items-center gap-5 group shadow-lg shadow-blue-900/10"
                >
                  <div className="p-3 bg-white text-blue-900 rounded-2xl shadow-sm">
                    <GraduationCap className="w-7 h-7" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] uppercase tracking-widest opacity-60 font-black">Phase 01</span>
                    <span>Institutional Match</span>
                  </div>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform ml-4 opacity-50" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(5,150,105,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("SKILL_INPUT")}
                  className="px-10 py-6 bg-white border border-slate-200 rounded-[2rem] text-slate-900 text-xl font-bold flex items-center gap-5 group shadow-sm hover:border-emerald-200"
                >
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <BrainCircuit className="w-7 h-7" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] uppercase tracking-widest opacity-60 font-black text-emerald-600">Phase 02</span>
                    <span>Skill Integration</span>
                  </div>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform ml-4 opacity-30" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === "SKILL_INPUT" && (
            <StepContainer stepKey="skill-input">
              <GlassCard className="space-y-8 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <BrainCircuit className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase tracking-widest">Skill Analysis</span>
                  </div>
                  <h2 className="text-3xl font-bold">What are your top skills?</h2>
                  <p className="text-slate-400">Enter your technical or soft skills to find matching career paths.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. Python, Design, Writing, Leadership"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && skillInput.trim()) {
                          setSkills([...skills, skillInput.trim()]);
                          setSkillInput("");
                        }
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 transition-all"
                    />
                    <button
                      onClick={() => {
                        if (skillInput.trim()) {
                          setSkills([...skills, skillInput.trim()]);
                          setSkillInput("");
                        }
                      }}
                      className="px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-white/5 rounded-2xl border border-white/5">
                    {skills.length === 0 && (
                      <span className="text-slate-500 text-sm italic">No skills added yet...</span>
                    )}
                    {skills.map((skill, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2"
                      >
                        {skill}
                        <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}>
                          <X className="w-4 h-4 hover:text-white transition-colors" />
                        </button>
                      </motion.span>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Optional: Enter your career goal (e.g. CTO, Freelancer)"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500/50 transition-all text-sm"
                      />
                    </div>
                    <button
                      disabled={skills.length === 0}
                      onClick={handleGenerateSkillRoadmap}
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate Skill Roadmap
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </StepContainer>
          )}

          {step === "SKILL_ROADMAP" && (
            <StepContainer stepKey="skill-roadmap">
              <div className="w-full max-w-5xl mx-auto space-y-12 pb-20">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 text-emerald-400 mb-2">
                    <Compass className="w-8 h-8" />
                    <span className="text-sm font-bold uppercase tracking-widest">Skill-Based Roadmap</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Your Career Trajectory</h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">
                    Based on your skills: {skills.join(", ")}
                  </p>
                </div>

                {skillRoadmapLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-slate-400 animate-pulse">AI is mapping your skills to high-demand careers...</p>
                  </div>
                ) : skillRoadmapResponse ? (
                  <div className="space-y-20">
                    {/* Career Suggestions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {skillRoadmapResponse.careers.map((career, idx) => (
                        <div key={idx}>
                          <GlassCard className="border-emerald-500/20 bg-emerald-500/5">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 text-emerald-400">
                                <Trophy className="w-6 h-6" />
                                <h3 className="text-2xl font-bold">{career.name}</h3>
                              </div>
                              <p className="text-slate-300 leading-relaxed">{career.reason}</p>
                            </div>
                          </GlassCard>
                        </div>
                      ))}
                    </div>

                    {/* Detailed Roadmaps */}
                    <div className="space-y-24">
                      {skillRoadmapResponse.roadmaps.map((roadmap, idx) => (
                        <div key={idx} className="space-y-10">
                          <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/30" />
                            <h3 className="text-3xl font-bold text-white px-6 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                              {roadmap.career} Path
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/30" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {roadmap.phases.map((phase, pIdx) => (
                              <div key={pIdx}>
                                <GlassCard delay={pIdx * 0.1} className="relative overflow-visible">
                                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                                    {pIdx + 1}
                                  </div>
                                  <div className="space-y-4 pt-2">
                                    <div className="space-y-1">
                                      <h4 className="text-xl font-bold text-white">{phase.phase}</h4>
                                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">{phase.focus}</p>
                                    </div>
                                    <ul className="space-y-3">
                                      {phase.actions.map((action, aIdx) => (
                                        <li key={aIdx} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                          {action}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </GlassCard>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => setStep("HOME")}
                        className="px-12 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-white/10 transition-all"
                      >
                        <ArrowLeft className="w-6 h-6" />
                        Start Over
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-6">
                    <p className="text-slate-400">Failed to generate skill roadmap. Please try again.</p>
                    <button
                      onClick={handleGenerateSkillRoadmap}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all"
                    >
                      Retry Generation
                    </button>
                  </div>
                )}
              </div>
            </StepContainer>
          )}

          {step === "LOCATION" && (
            <StepContainer stepKey="location">
              <GlassCard className="space-y-10 border-slate-200/60 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-blue-900">
                    <MapPin className="w-6 h-6" />
                    <span className="text-sm font-black uppercase tracking-widest">Regional Search</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Where would you like to study?</h2>
                  <p className="text-slate-500">We analyze regional admission trends and institutional reputations.</p>
                </div>

                <div className="space-y-6">
                  {/* State Select */}
                  <div className="space-y-3 relative" ref={stateRef}>
                    <label className="text-sm font-bold text-slate-600 ml-1">Select State</label>
                    <div 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between cursor-pointer hover:border-blue-400/50 transition-all group"
                      onClick={() => setShowStateDropdown(!showStateDropdown)}
                    >
                      <span className={state ? "text-slate-900 font-medium" : "text-slate-400"}>
                        {state || "Choose an Indian state..."}
                      </span>
                      <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", showStateDropdown ? "rotate-180" : "")} />
                    </div>
                    {showStateDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] max-h-64 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                        <div className="sticky top-0 bg-white p-2 border-b border-slate-50 mb-2">
                          <input 
                            type="text" 
                            placeholder="Filter states..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-300"
                            value={state}
                            onChange={(e) => {
                              setState(e.target.value);
                              setShowStateDropdown(true);
                              setCity("");
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {filteredStates.map((s) => (
                          <div
                            key={s}
                            className="px-4 py-3 hover:bg-blue-50 rounded-xl cursor-pointer text-sm font-medium transition-colors text-slate-700 hover:text-blue-900"
                            onClick={() => {
                              setState(s);
                              setCity("");
                              setShowStateDropdown(false);
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* City Select */}
                  <div className="space-y-3 relative" ref={cityRef}>
                    <label className="text-sm font-bold text-slate-600 ml-1">Select City</label>
                    <div 
                      className={cn(
                        "w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between transition-all group",
                        state ? "cursor-pointer hover:border-blue-400/50" : "opacity-50 grayscale cursor-not-allowed"
                      )}
                      onClick={() => state && setShowCityDropdown(!showCityDropdown)}
                    >
                      <span className={city ? "text-slate-900 font-medium" : "text-slate-400"}>
                        {city || "Select candidate city..."}
                      </span>
                      <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", showCityDropdown ? "rotate-180" : "")} />
                    </div>
                    {showCityDropdown && state && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] max-h-64 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                        <div className="sticky top-0 bg-white p-2 border-b border-slate-50 mb-2">
                          <input 
                            type="text" 
                            placeholder="Filter cities..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-300"
                            value={city}
                            onChange={(e) => {
                              setCity(e.target.value);
                              setShowCityDropdown(true);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {filteredCities.map((c) => (
                          <div
                            key={c}
                            className="px-4 py-3 hover:bg-blue-50 rounded-xl cursor-pointer text-sm font-medium transition-colors text-slate-700 hover:text-blue-900"
                            onClick={() => {
                              setCity(c);
                              setShowCityDropdown(false);
                            }}
                          >
                            {c}
                          </div>
                        ))}
                        {filteredCities.length === 0 && (
                          <div className="px-4 py-8 text-center text-slate-400 text-xs italic">
                            No cities found for search criteria.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={prevStep}
                    className="p-5 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!state || !city}
                    className="flex-1 py-5 bg-blue-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-50 disabled:grayscale group"
                  >
                    Next Department
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </GlassCard>
            </StepContainer>
          )}

          {step === "STREAM" && (
            <StepContainer stepKey="stream">
              <div className="space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold text-slate-900">Strategic Stream Selection</h2>
                  <p className="text-slate-500">Pick your current academic focus for precise analysis.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "Computer Science (PCM / Engineering)", icon: <Code className="w-6 h-6" />, color: "border-blue-200 text-blue-900 bg-blue-50/30" },
                    { id: "Bio-Math (PCMB)", icon: <Microscope className="w-6 h-6" />, color: "border-emerald-200 text-emerald-900 bg-emerald-50/30" },
                    { id: "Pure Science (PCB)", icon: <BookIcon className="w-6 h-6" />, color: "border-amber-200 text-amber-900 bg-amber-50/30" },
                    { id: "Commerce", icon: <Trophy className="w-6 h-6" />, color: "border-slate-200 text-slate-900 bg-slate-50/30" },
                    { id: "Arts", icon: <Pencil className="w-6 h-6" />, color: "border-rose-200 text-rose-900 bg-rose-50/30" }
                  ].map((s) => (
                    <div key={s.id}>
                      <GlassCard
                        onClick={() => setStream(s.id as Stream)}
                        className={cn(
                          "cursor-pointer p-6 flex items-center gap-5 transition-all text-left border-2",
                          stream === s.id 
                            ? cn("ring-2 ring-blue-900", s.color) 
                            : "border-slate-200 hover:border-slate-300 bg-white/20"
                        )}
                      >
                        <div className={cn(
                          "p-4 rounded-xl shadow-sm transition-colors",
                          stream === s.id ? "bg-white" : "bg-slate-50 text-slate-600"
                        )}>
                          {s.icon}
                        </div>
                        <span className={cn(
                          "font-bold text-lg transition-colors",
                          stream === s.id ? "" : "text-slate-700"
                        )}>
                          {s.id}
                        </span>
                      </GlassCard>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={prevStep}
                    className="p-5 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!stream}
                    className="flex-1 py-5 bg-blue-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-50"
                  >
                   Start Strategy Audit
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </StepContainer>
          )}

          {step === "ADMISSION_ANALYSIS" && (
            <StepContainer stepKey="admission_analysis">
              <GlassCard className="space-y-10 border-slate-200/60 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-blue-900">
                    <ShieldCheck className="w-6 h-6" />
                    <span className="text-sm font-black uppercase tracking-widest">Bureau of Admissions</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Admission Criteria</h2>
                  <p className="text-slate-500">We've identified the official requirements for {stream} in {state}.</p>
                </div>

                {admissionLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-6">
                    <Loader2 className="w-12 h-12 text-blue-800 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse text-center">Consulting state educational statutes...</p>
                  </div>
                ) : admissionSystem ? (
                  <div className="space-y-10">
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-black">System Category</span>
                        <span className="px-4 py-1.5 bg-blue-900 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">{admissionSystem.admission_type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-black">Primary Metric</span>
                        <span className="text-slate-900 font-black text-lg">{admissionSystem.input_type}</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {admissionSystem.fields.map((field, idx) => (
                        <div key={idx} className="space-y-3">
                          <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                            <Pencil className="w-3 h-3" />
                            {field.label}
                          </label>
                          <input
                            type="text"
                            placeholder={field.placeholder}
                            value={studentScores[field.name] || ""}
                            onChange={(e) => setStudentScores({ ...studentScores, [field.name]: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-900 focus:bg-white transition-all text-slate-900 font-medium"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={nextStep}
                      className="w-full py-5 bg-blue-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-xl shadow-blue-900/10"
                    >
                      Proceed to Course Selection
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-6">
                    <p className="text-slate-500 font-medium">Admission database connection timeout.</p>
                    <button onClick={handleAdmissionAnalysis} className="text-blue-900 font-black hover:underline underline-offset-4">RETRY AUDIT</button>
                  </div>
                )}
              </GlassCard>
            </StepContainer>
          )}

          {step === "COURSE_GUIDANCE" && (
            <StepContainer stepKey="course_guidance">
              <div className="w-full max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 text-blue-900">
                    <Library className="w-10 h-10" />
                    <span className="text-sm font-black uppercase tracking-widest">Guidance Bureau</span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900 font-serifitalic">Path Selection</h2>
                  <p className="text-slate-500 max-w-lg mx-auto">Strategically select your specialization pathway for 2026-2030.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <GlassCard 
                    onClick={() => handleCourseGuidance("guided")}
                    className={cn(
                      "cursor-pointer transition-all hover:-translate-y-2 border-2",
                      guidanceMode === "guided" ? "border-blue-900 bg-blue-50/30" : "border-slate-100"
                    )}
                  >
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-900/10 rounded-2xl w-fit">
                        <BookIcon className="w-8 h-8 text-blue-900" strokeWidth={2.5} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900">Standardized Path</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Traditional honors and degrees recognized by global accreditation boards.</p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard 
                    onClick={() => handleCourseGuidance("ai_recommend")}
                    className={cn(
                      "cursor-pointer transition-all hover:-translate-y-2 border-2",
                      guidanceMode === "ai_recommend" ? "border-emerald-600 bg-emerald-50/30" : "border-slate-100"
                    )}
                  >
                    <div className="space-y-6">
                      <div className="p-4 bg-emerald-600/10 rounded-2xl w-fit">
                        <BrainCircuit className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900">Emerging Trends</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Modern, interdisciplinary domains with high-growth employment projections.</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                <AnimatePresence>
                  {selectedCourse && (
                    <motion.div 
                      key="selected-course-badge"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-3 px-6 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-full w-fit mx-auto text-indigo-400 font-bold text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Selected: {selectedCourse}
                      <button 
                        onClick={() => setSelectedCourse("")}
                        className="ml-2 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {courseLoading && (
                    <motion.div 
                      key="course-loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 py-12"
                    >
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                      <p className="text-slate-400">AI is analyzing future trends and employability...</p>
                    </motion.div>
                  )}

                  {courseRecs && !courseLoading && (
                    <motion.div 
                      key="course-recommendations"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courseRecs.recommended_courses.map((course, idx) => (
                          <div key={idx}>
                            <GlassCard 
                              delay={idx * 0.05} 
                              className={cn(
                                "p-6 h-full cursor-pointer transition-all hover:border-indigo-500/50",
                                selectedCourse === course.course_name ? "border-indigo-500 bg-indigo-500/10" : ""
                              )}
                              onClick={() => {
                                setSelectedCourse(course.course_name);
                                handleSearch(course.course_name);
                              }}
                            >
                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-lg font-bold text-white">{course.course_name}</h4>
                                  <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-slate-400">
                                    {course.duration}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{course.reason}</p>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
                                  <ArrowRight className="w-3 h-3" />
                                  {course.category}
                                </div>
                              </div>
                            </GlassCard>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center pt-8">
                        <button
                          onClick={() => handleSearch()}
                          className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
                        >
                          Find Best Colleges
                          <Search className="w-6 h-6" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </StepContainer>
          )}

          {step === "RESULTS" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-7xl mx-auto space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 text-blue-900 mb-2">
                  <Library className="w-8 h-8" strokeWidth={2.5} />
                  <span className="text-sm font-black uppercase tracking-[0.3em]">Institutional Audit</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 font-serifitalic">Elite Institution Matches</h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                  Exploring the best institutions for {selectedCourse || stream} in {city}, {state}.
                </p>
                
                <div className="max-w-xl mx-auto space-y-6 pt-8">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Optional: Define your career objective (e.g. Cybersecurity Expert)"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full bg-white border-b-2 border-slate-100 px-6 py-5 outline-none focus:border-blue-900 focus:bg-slate-50 transition-all text-sm text-center font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <button
                    onClick={handleGenerateRoadmap}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-blue-900 text-white rounded-3xl font-black text-sm hover:bg-slate-900 transition-all shadow-2xl shadow-blue-900/20 group"
                  >
                    <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    CREATE ACADEMIC BLUEPRINT FOR {selectedCourse?.toUpperCase()}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-8">
                  <Loader2 className="w-16 h-16 text-blue-800 animate-spin" />
                  <p className="text-slate-500 font-black tracking-widest text-xs uppercase animate-pulse">Scanning state educational registers...</p>
                </div>
              ) : (
                <div className="space-y-32">
                  {recommendations ? (
                    <>
                      {renderCollegeGrid(recommendations.tier_1, "Distinguished Tier (Top 1%)", <Trophy className="w-4 h-4" />, "bg-blue-900 text-white border-blue-800", "tier-1")}
                      {renderCollegeGrid(recommendations.tier_2, "Merit Tier (State Accredited)", <Star className="w-4 h-4" />, "bg-slate-50 text-slate-900 border-slate-200", "tier-2")}
                      {renderCollegeGrid(recommendations.tier_3, "Standard Tier (Safe Selection)", <ShieldCheck className="w-4 h-4" />, "bg-slate-50 text-slate-500 border-slate-100", "tier-3")}
                    </>
                  ) : (
                    <div className="text-center py-32 space-y-8">
                      <Sparkles className="w-16 h-16 text-slate-200 mx-auto" />
                      <p className="text-slate-500 font-medium">No results met the strategic criteria. Modify search parameters.</p>
                      <button onClick={() => setStep("LOCATION")} className="px-10 py-4 border-2 border-blue-900 text-blue-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-900 hover:text-white transition-all">Restart Selection</button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {step === "COMPARE" && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-7xl mx-auto space-y-16"
            >
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 text-blue-900 mb-2">
                  <ArrowUpDown className="w-8 h-8" strokeWidth={2.5} />
                  <span className="text-sm font-black uppercase tracking-[0.3em]">Comparative Audit</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 font-serifitalic">Structural Comparison</h2>
                <p className="text-slate-500 max-w-2xl mx-auto">Cross-referencing institutional capabilities for your final selection.</p>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-[3rem] shadow-2xl overflow-hidden shadow-slate-200/50">
                <div className="overflow-x-auto">
                  <div 
                    className="inline-grid gap-px bg-slate-100 min-w-full"
                    style={{ 
                      gridTemplateColumns: `280px repeat(${selectedColleges.length}, minmax(320px, 1fr))` 
                    }}
                  >
                    {/* Headers */}
                    <div className="bg-slate-50/50 p-10 flex items-center font-black text-slate-400 uppercase tracking-widest text-[10px]">
                      Audited Parameters
                    </div>
                    {selectedColleges.map((college, idx) => (
                      <div key={`header-${idx}`} className="bg-white p-10 relative group">
                        <button 
                          onClick={() => {
                            toggleCollegeSelection(college);
                            if (selectedColleges.length <= 1) setStep("RESULTS");
                          }}
                          className="absolute top-6 right-6 p-2 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:text-white"
                          title="Remove from audit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="text-blue-900 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                           <MapPin className="w-3 h-3" />
                           {college.city}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 leading-tight">{college.name}</h3>
                      </div>
                    ))}

                    {/* Best Course */}
                    <div className="bg-slate-50/30 p-10 flex items-center gap-3 text-sm font-black text-slate-600 uppercase tracking-widest text-[10px]">
                      <GraduationCap className="w-4 h-4 text-blue-900" strokeWidth={3} />
                      Primary Discipline
                    </div>
                    {selectedColleges.map((college, idx) => (
                      <div key={`course-${idx}`} className="bg-white p-10 text-sm text-slate-900 flex items-center font-black">
                        {college.best_course}
                      </div>
                    ))}

                    {/* Salary Package */}
                    <div className="bg-slate-50/30 p-10 flex items-center gap-3 text-sm font-black text-slate-600 uppercase tracking-widest text-[10px]">
                      <Trophy className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                      Career ROI (Avg)
                    </div>
                    {selectedColleges.map((college, idx) => (
                      <div key={`package-${idx}`} className="bg-white p-10 text-xl text-emerald-700 font-black">
                        {college.avg_package}
                      </div>
                    ))}

                    {/* Admission Mode */}
                    <div className="bg-slate-50/30 p-10 flex items-center gap-3 text-sm font-black text-slate-600 uppercase tracking-widest text-[10px]">
                      <ShieldCheck className="w-4 h-4 text-blue-900" strokeWidth={3} />
                      Gateway Entry
                    </div>
                    {selectedColleges.map((college, idx) => (
                      <div key={`mode-${idx}`} className="bg-white p-10 text-xs text-slate-700 font-bold leading-relaxed">
                        <div className="font-black text-blue-900 text-sm mb-1">{college.admission_mode}</div>
                        {college.entrance_exam && (
                          <span className="px-2 py-1 bg-slate-100 rounded-md text-[9px] uppercase tracking-tighter">Exam: {college.entrance_exam}</span>
                        )}
                      </div>
                    ))}

                    {/* Admission Note */}
                    <div className="bg-slate-50/30 p-10 flex items-center gap-3 text-sm font-black text-slate-600 uppercase tracking-widest text-[10px]">
                      <Pencil className="w-4 h-4 text-blue-900" strokeWidth={3} />
                      Registrar Notes
                    </div>
                    {selectedColleges.map((college, idx) => (
                      <div key={`note-${idx}`} className="bg-white p-10 text-sm text-slate-500 italic leading-relaxed">
                        {college.admission_note}
                      </div>
                    ))}

                    {/* Description */}
                    <div className="bg-slate-50/30 p-10 flex items-center gap-3 text-sm font-black text-slate-600 uppercase tracking-widest text-[10px]">
                      <Library className="w-4 h-4 text-blue-900" strokeWidth={3} />
                      Academic Profile
                    </div>
                    {selectedColleges.map((college, idx) => (
                      <div key={`desc-${idx}`} className="bg-white p-10 text-xs text-slate-500 leading-relaxed font-medium">
                        {college.description}
                      </div>
                    ))}

                    {/* Website */}
                    <div className="bg-slate-50/30 p-10 flex items-center gap-3 text-sm font-black text-slate-600 uppercase tracking-widest text-[10px]">
                      <ExternalLink className="w-4 h-4 text-blue-900" strokeWidth={3} />
                      Final Action
                    </div>
                    {selectedColleges.map((college, idx) => (
                      <div key={`action-${idx}`} className="bg-white p-10 flex items-center">
                        <a
                          href={college.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-center px-6 py-4 bg-blue-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
                        >
                          Visit Official Portal
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => setStep("RESULTS")}
                  className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-blue-900 hover:text-blue-900 transition-all flex items-center gap-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Return to Audit Grid
                </button>
              </div>
            </motion.div>
          )}

          {step === "ROADMAP" && (
            <StepContainer stepKey="roadmap">
              <div className="w-full max-w-5xl mx-auto space-y-12 pb-32">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 text-blue-900 mb-2">
                    <Library className="w-10 h-10" />
                    <span className="text-sm font-bold uppercase tracking-widest">Academic Strategy</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 font-serifitalic">Your Professional Journey</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                    A personalized, step-by-step roadmap for {selectedCourse} {goal ? `to becoming a ${goal}` : ""}.
                  </p>
                </div>

                {roadmapLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-12 h-12 text-blue-800" />
                    </motion.div>
                    <p className="text-slate-500 font-medium animate-pulse">Generating your strategic path...</p>
                  </div>
                ) : roadmap ? (
                  <div className="space-y-24 mt-12 relative">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[31px] md:left-1/2 top-0 bottom-0 w-1 bg-slate-100 rounded-full -translate-x-1/2" />
                    
                    <div className="space-y-16">
                      {roadmap.roadmap.map((phase, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <div key={phase.phase} className="relative flex flex-col md:flex-row items-start md:items-center">
                            {/* Dot on timeline */}
                            <div className="absolute left-[31px] md:left-1/2 w-4 h-4 rounded-full border-4 border-white bg-blue-900 shadow-md transform -translate-x-1/2 z-10" />
                            
                            {/* Card Container */}
                            <div className={cn(
                              "w-full md:w-1/2 pl-16 md:pl-0",
                              isEven ? "md:pr-16 md:text-right" : "md:ml-auto md:pl-16"
                            )}>
                              <GlassCard 
                                delay={idx * 0.1} 
                                className="border-slate-200/60 shadow-[0_10px_40px_rgba(30,58,138,0.04)] hover:border-blue-200 transition-all group"
                              >
                                <div className="space-y-6">
                                  <div className={cn(
                                    "flex flex-col gap-2",
                                    isEven ? "md:items-end" : "md:items-start"
                                  )}>
                                    <span className="text-blue-900 font-black text-4xl opacity-10">{idx + 1}</span>
                                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">{phase.phase}</h3>
                                    <div className={cn(
                                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm mt-1",
                                      idx === 0 ? "bg-blue-900 text-white border-blue-800" : "bg-slate-50 text-slate-500 border-slate-100"
                                    )}>
                                      {phase.focus}
                                    </div>
                                  </div>

                                  {/* Progress bar for each phase */}
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      whileInView={{ width: "100%" }}
                                      viewport={{ once: true }}
                                      transition={{ duration: 1.5, delay: idx * 0.2 }}
                                      className="h-full bg-gradient-to-r from-blue-900 to-blue-600 rounded-full"
                                    />
                                  </div>

                                  <ul className={cn(
                                    "space-y-4",
                                    isEven ? "md:text-right" : "md:text-left"
                                  )}>
                                    {phase.actions.map((action, i) => (
                                      <motion.li 
                                        key={i} 
                                        initial={{ opacity: 0, x: isEven ? 10 : -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: (idx * 0.1) + (i * 0.1) }}
                                        className={cn(
                                          "flex items-center gap-3 text-slate-600 text-sm",
                                          isEven ? "md:flex-row-reverse" : "flex-row"
                                        )}
                                      >
                                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                          {getActionIcon(action)}
                                        </div>
                                        <span className="leading-relaxed flex-1">{action}</span>
                                      </motion.li>
                                    ))}
                                  </ul>
                                </div>
                              </GlassCard>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {roadmap.extra_recommendations.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <GlassCard className="bg-blue-50/30 border-blue-100/50 shadow-inner">
                          <div className="flex items-center gap-3 text-blue-900 mb-8 border-b border-blue-100 pb-4">
                            <Library className="w-6 h-6" strokeWidth={2.5} />
                            <h3 className="text-xl font-bold uppercase tracking-widest text-[10px]">Academic Repository & Guidelines</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roadmap.extra_recommendations.map((rec, i) => (
                              <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 text-sm text-slate-600 shadow-sm group hover:border-blue-200 transition-all">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                  <Sparkles className="w-3 h-3" />
                                </div>
                                <span className="flex-1 font-medium leading-relaxed">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </GlassCard>
                      </motion.div>
                    )}

                    <div className="flex justify-center pt-8">
                      <button
                        onClick={() => setStep("RESULTS")}
                        className="px-10 py-5 bg-blue-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl shadow-blue-900/10 group"
                      >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Institutions
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 space-y-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="p-6 bg-red-50 rounded-full w-fit mx-auto">
                      <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900">Roadmap Unavailable</h3>
                      <p className="text-slate-500">The academic server encountered a temporary synchronization issue.</p>
                    </div>
                    <button
                      onClick={handleGenerateRoadmap}
                      className="px-10 py-5 bg-blue-900 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg"
                    >
                      Restart Strategy Analysis
                    </button>
                  </div>
                )}
              </div>
            </StepContainer>
          )}
        </AnimatePresence>
      </main>

      {/* Comparison Bar */}
      <AnimatePresence>
        {selectedColleges.length > 0 && step === "RESULTS" && (
          <motion.div
            key="comparison-bar"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-6"
          >
            <div className="bg-indigo-600 rounded-2xl p-4 shadow-2xl shadow-indigo-500/40 flex items-center justify-between gap-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Columns className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold">{selectedColleges.length} Colleges Selected</p>
                  <p className={cn(
                    "text-xs transition-colors",
                    selectedColleges.length >= 4 ? "text-amber-300 font-bold" : "text-indigo-200"
                  )}>
                    {selectedColleges.length >= 4 
                      ? "Maximum limit of 4 reached" 
                      : "Compare up to 4 institutions side-by-side"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedColleges([])}
                  className="px-4 py-2 text-indigo-100 text-sm font-bold hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setStep("COMPARE")}
                  disabled={selectedColleges.length < 2}
                  className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Compare Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
