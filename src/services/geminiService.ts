import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is missing. Please configure it in the Secrets panel or .env file.");
} else {
  console.log("GEMINI_API_KEY detected (starts with):", GEMINI_API_KEY.substring(0, 6) + "...");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 3000
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const errorString = error instanceof Error ? error.message : JSON.stringify(error);
      const errorCode = error?.status || error?.code || error?.error?.code || error?.error?.status;
      
      const isRateLimit = 
        errorCode === 429 || 
        errorCode === "RESOURCE_EXHAUSTED" ||
        errorString.includes("429") || 
        errorString.includes("RESOURCE_EXHAUSTED") ||
        errorString.includes("quota");
      
      if (isRateLimit && retries < maxRetries) {
        const delay = initialDelay * Math.pow(2, retries);
        console.warn(`Rate limit reached (Code: ${errorCode}). Retrying in ${delay}ms... (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        console.error("Gemini API Error details:", {
          message: error?.message,
          status: error?.status,
          code: error?.code,
          errorObj: error?.error,
          fullError: error
        });
        throw error;
      }
    }
  }
}

export interface College {
  name: string;
  city: string;
  best_course: string;
  avg_package: string;
  description: string;
  website: string;
  admission_mode: string;
  entrance_exam: string | null;
  admission_note: string;
}

export interface TieredColleges {
  tier_1: College[];
  tier_2: College[];
  tier_3: College[];
}

export interface RecommendedCourse {
  course_name: string;
  category: string;
  duration: string;
  reason: string;
}

export interface CourseRecommendations {
  recommended_courses: RecommendedCourse[];
}

export interface RoadmapPhase {
  phase: string;
  focus: string;
  actions: string[];
}

export interface CareerRoadmap {
  course: string;
  duration: string;
  roadmap: RoadmapPhase[];
  extra_recommendations: string[];
}

export interface SkillCareer {
  name: string;
  reason: string;
}

export interface SkillRoadmapPhase {
  phase: string;
  focus: string;
  actions: string[];
}

export interface SkillRoadmap {
  career: string;
  phases: SkillRoadmapPhase[];
}

export interface SkillBasedCareerResponse {
  careers: SkillCareer[];
  roadmaps: SkillRoadmap[];
}

export interface AdmissionField {
  name: string;
  label: string;
  placeholder: string;
}

export interface AdmissionSystemResponse {
  admission_type: string;
  input_type: string;
  fields: AdmissionField[];
}

const admissionCache: Record<string, AdmissionSystemResponse> = {};
const courseCache: Record<string, CourseRecommendations> = {};

export async function searchColleges(
  state: string,
  city: string,
  stream: string,
  specificCourse?: string,
  studentScores?: Record<string, string>
): Promise<TieredColleges | null> {
  const input = {
    state,
    city,
    stream,
    specific_course: specificCourse,
    student_scores: studentScores
  };

  const prompt = `You are a fast AI college recommender for Indian students.

INPUT:
${JSON.stringify(input)}

TASK:
1. Recommend colleges based on ${specificCourse ? `specific course: ${specificCourse}` : `stream: ${stream}`} and location (${city}, ${state}).
2. Use the provided student scores (${JSON.stringify(studentScores)}) to suggest colleges where the student has a realistic chance of admission.
3. Group into 3 tiers:
   - Tier 1: Top/Highly Competitive
   - Tier 2: Mid/Moderately Competitive
   - Tier 3: Safe/Less Competitive
3. Include admission process for each.

RULES:
- Keep output SHORT and concise.
- Provide MAX 8 colleges per tier.
- Use known admission systems:
  * IIT → JEE Advanced (after JEE Main)
  * NIT → JEE Main
  * VIT → VITEEE
  * TN Engineering → TNEA Counseling
  * KA Engineering → KCET / COMEDK
  * Medical → NEET
  * Others: State counseling or specific entrance exams.
- DATA: Real colleges only, 1-line description, approx package (e.g. "6-12 LPA"), official website.

OUTPUT (JSON ONLY):
{
  "tier_1": [
    {
      "name": "", 
      "city": "", 
      "best_course": "", 
      "avg_package": "", 
      "description": "", 
      "website": "",
      "admission_mode": "Entrance Exam / Counseling / Merit / Mixed",
      "entrance_exam": "Name of exam or null",
      "admission_note": "Short 1-line explanation"
    }
  ],
  "tier_2": [],
  "tier_3": []
}

STRICT: No explanations, ONLY JSON.`;

  const collegeSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      city: { type: Type.STRING },
      best_course: { type: Type.STRING },
      avg_package: { type: Type.STRING },
      description: { type: Type.STRING },
      website: { type: Type.STRING },
      admission_mode: { type: Type.STRING },
      entrance_exam: { type: Type.STRING, nullable: true },
      admission_note: { type: Type.STRING },
    },
    required: ["name", "city", "best_course", "avg_package", "description", "website", "admission_mode", "entrance_exam", "admission_note"],
  };

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tier_1: { type: Type.ARRAY, items: collegeSchema },
            tier_2: { type: Type.ARRAY, items: collegeSchema },
            tier_3: { type: Type.ARRAY, items: collegeSchema },
          },
          required: ["tier_1", "tier_2", "tier_3"],
        },
      },
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching colleges:", error);
    throw error;
  }
}

export async function recommendCourses(
  stream: string,
  mode: "guided" | "ai_recommend",
  startYear: number = 2026
): Promise<CourseRecommendations | null> {
  const cacheKey = `${stream}_${mode}`;
  if (courseCache[cacheKey]) return courseCache[cacheKey];

  const input = {
    stream,
    mode,
    start_year: startYear
  };

  const prompt = `You are an AI career guidance system.
Your job is to recommend suitable courses for a student based on the following input:
${JSON.stringify(input)}

Follow these steps:
1. CHECK STREAM TYPE: Engineering (CS, Bio-Math engineering path) vs Non-engineering (Pure Science, Commerce, Arts).
2. IF MODE = "guided": Recommend standard courses strictly based on ${stream}.
3. IF MODE = "ai_recommend": 
   - For Engineering streams: Apply FUTURE TREND ANALYSIS for the next 4 years from ${startYear}. Identify high-growth domains (AI, Data Science, Cyber Security, etc.).
   - For Non-engineering streams: Recommend safe, high-employability courses without future prediction.
4. DATA RULES: Provide 12-15 courses, short 1-line reasons, correct duration (3/4/5 years).

Return ONLY JSON in this format:
{
  "recommended_courses": [
    {
      "course_name": "",
      "category": "Engineering / Medical / Commerce / Arts",
      "duration": "",
      "reason": ""
    }
  ]
}

STRICT: No explanations, no reasoning, ONLY JSON.`;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommended_courses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  course_name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["course_name", "category", "duration", "reason"],
              },
            },
          },
          required: ["recommended_courses"],
        },
      },
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    const result = JSON.parse(text);
    courseCache[cacheKey] = result;
    return result;
  } catch (error) {
    console.error("Error fetching course recommendations:", error);
    throw error;
  }
}

export async function generateRoadmap(
  stream: string,
  course: string,
  goal?: string
): Promise<CareerRoadmap | null> {
  const input = { stream, course, goal };

  const prompt = `You are an AI Career Roadmap Generator.

INPUT:
${JSON.stringify(input)}

TASK:
Generate a structured, practical roadmap for the student based on the selected course and optional goal.

The roadmap MUST:
- Be aligned with the course duration
- Be broken into phases (Year-wise or Semester-wise)
- Focus on what the student should DO during college

STREAM HANDLING RULES:
1. Computer Science (CSE / IT / AI): 4 years. Include: Programming, Projects, Internships, Open-source, Competitive coding (optional), Placement prep.
2. Bio-Maths (Engineering or Medical-related): Engineering (4 years), Medical (5+ years). Include: Core subject mastery, Lab work / clinical exposure, Entrance exam prep (if needed), Internships / hospital training.
3. Pure Science (B.Sc.): 3 years. Include: Concept clarity, Research basics, Lab skills, Higher studies prep (M.Sc., research).
4. Commerce: 3 years. Include: Accounting & finance skills, Internships, Certifications (CA, CMA, CFA basics), Business skills.
5. Arts: 3 years. Include: Subject expertise, Communication skills, Portfolio building, Career specialization.

ROADMAP STRUCTURE:
Return in this format (STRICT JSON):
{
  "course": "",
  "duration": "",
  "roadmap": [
    {
      "phase": "Year 1",
      "focus": "",
      "actions": ["", "", ""]
    }
  ],
  "extra_recommendations": ["", ""]
}

RULES:
- Keep it practical, not theoretical
- Actions should be clear and doable
- Max 4–5 actions per phase
- If "goal" is given, slightly tailor roadmap toward it
- Keep response concise but valuable.`;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            course: { type: Type.STRING },
            duration: { type: Type.STRING },
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["phase", "focus", "actions"],
              },
            },
            extra_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["course", "duration", "roadmap", "extra_recommendations"],
        },
      },
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating roadmap:", error);
    throw error;
  }
}

export async function generateSkillBasedRoadmap(
  skills: string[],
  goal?: string
): Promise<SkillBasedCareerResponse | null> {
  const input = { skills, goal };

  const prompt = `You are an AI Skill-Based Career Roadmap Generator.

INPUT:
${JSON.stringify(input)}

TASK:
1. Analyze the given skills
2. Identify 2–4 suitable career paths based on those skills
3. Select the most relevant 1–2 careers
4. Generate a detailed roadmap for each selected career

CAREER SELECTION RULES:
- Careers must directly match the given skills
- Prefer high-demand and future-relevant careers
- Avoid generic suggestions
- If "goal" is provided, align results toward it

ROADMAP REQUIREMENTS:
- The roadmap must be SKILL-BASED (not course-based)
- Divide into 3 phases: Beginner, Intermediate, Advanced

For EACH phase include:
- "focus": what to concentrate on
- "actions": 3–5 clear, practical steps

OUTPUT FORMAT (STRICT JSON):
{
  "careers": [
    {
      "name": "",
      "reason": ""
    }
  ],
  "roadmaps": [
    {
      "career": "",
      "phases": [
        {
          "phase": "Beginner",
          "focus": "",
          "actions": ["", "", ""]
        },
        {
          "phase": "Intermediate",
          "focus": "",
          "actions": []
        },
        {
          "phase": "Advanced",
          "focus": "",
          "actions": []
        }
      ]
    }
  ]
}

RULES:
- Keep output concise but meaningful
- Do NOT include theory or long explanations
- Actions must be practical and actionable
- Avoid repeating the same actions across phases.`;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            careers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["name", "reason"],
              },
            },
            roadmaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  career: { type: Type.STRING },
                  phases: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        phase: { type: Type.STRING },
                        focus: { type: Type.STRING },
                        actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ["phase", "focus", "actions"],
                    },
                  },
                },
                required: ["career", "phases"],
              },
            },
          },
          required: ["careers", "roadmaps"],
        },
      },
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating skill-based roadmap:", error);
    throw error;
  }
}

export async function analyzeAdmissionSystem(
  state: string,
  stream: string
): Promise<AdmissionSystemResponse | null> {
  const cacheKey = `${state}_${stream}`;
  if (admissionCache[cacheKey]) return admissionCache[cacheKey];

  const input = { state, stream };

  const prompt = `You are an AI Admission System Analyzer for India.

INPUT:
${JSON.stringify(input)}

TASK:
Determine the correct admission system used in the given state and stream.

---

YOU MUST IDENTIFY:
1. Admission type:
   - National Entrance Exam
   - State Counseling
   - Private University Exam
   - Merit-Based

2. Required input from student:
   - Rank / Marks / Percentage

---

GUIDELINES:
- Engineering:
  * National → JEE Main / Advanced
  * State → State counseling (varies by state, e.g., TNEA for TN, KCET for KA)
- Medical:
  * NEET (All India)
- Arts / Commerce:
  * Mostly merit-based (percentage)
- If unsure:
  * Choose most common real-world system

---

OUTPUT FORMAT (STRICT JSON):
{
  "admission_type": "",
  "input_type": "",
  "fields": [
    {
      "name": "",
      "label": "",
      "placeholder": ""
    }
  ]
}

---

GOAL:
Make the system work for ANY Indian state without hardcoding specific rules.`;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            admission_type: { type: Type.STRING },
            input_type: { type: Type.STRING },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  label: { type: Type.STRING },
                  placeholder: { type: Type.STRING },
                },
                required: ["name", "label", "placeholder"],
              },
            },
          },
          required: ["admission_type", "input_type", "fields"],
        },
      },
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    const result = JSON.parse(text);
    admissionCache[cacheKey] = result;
    return result;
  } catch (error) {
    console.error("Error analyzing admission system:", error);
    throw error;
  }
}
