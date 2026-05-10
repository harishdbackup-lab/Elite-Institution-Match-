// src/constants/admissionData.ts

export type AdmissionMode = 'percentage_12th' | 'rank_based' | 'entrance_exam' | 'hybrid' | 'cuet' | 'jee_neet';

export interface Reservation {
  category: string;
  percentage: number;
  description?: string;
}

export interface StateAdmissionRule {
  state: string;
  primaryMode: AdmissionMode;
  primaryExam: string;
  counselingAuthority: string;
  weightage: string;
  inputField: 'percentage' | 'rank' | 'score' | 'percentile' | 'marks';
  exampleMessage: string;
  reservations: Reservation[];
  notes?: string;
}

// Comprehensive Data for Major States
export const admissionRules: StateAdmissionRule[] = [
  {
    state: "Tamil Nadu",
    primaryMode: "percentage_12th",
    primaryExam: "TNEA",
    counselingAuthority: "Directorate of Technical Education (DoTE)",
    weightage: "100% Class 12 Marks",
    inputField: "percentage",
    exampleMessage: "Enter your 12th PCM aggregate percentage (e.g., 92.5)",
    reservations: [
      { category: "BC", percentage: 30 },
      { category: "MBC / DNC", percentage: 20 },
      { category: "SC", percentage: 18 },
      { category: "ST", percentage: 1 },
      { category: "General", percentage: 31 },
    ],
    notes: "Very strong domicile preference. Government school quota also available."
  },
  {
    state: "Karnataka",
    primaryMode: "hybrid",
    primaryExam: "KCET",
    counselingAuthority: "Karnataka Examinations Authority (KEA)",
    weightage: "50% KCET + 50% 12th Marks",
    inputField: "rank",
    exampleMessage: "Enter your KCET Rank (e.g., 12450)",
    reservations: [
      { category: "SC", percentage: 15 },
      { category: "ST", percentage: 3 },
      { category: "Category I", percentage: 4 },
      { category: "2A", percentage: 15 },
      { category: "2B", percentage: 4 },
      { category: "3A", percentage: 4 },
      { category: "3B", percentage: 4 },
      { category: "General", percentage: 51 },
    ],
    notes: "Hyderabad-Karnataka (371J) quota also available."
  },
  {
    state: "Maharashtra",
    primaryMode: "rank_based",
    primaryExam: "MHT-CET",
    counselingAuthority: "State CET Cell",
    weightage: "100% MHT-CET + Class 12 for eligibility",
    inputField: "rank",
    exampleMessage: "Enter your MHT-CET Rank",
    reservations: [
      { category: "SC", percentage: 13 },
      { category: "ST", percentage: 7 },
      { category: "OBC", percentage: 19 },
      { category: "EWS", percentage: 10 },
      { category: "General", percentage: 51 },
    ],
    notes: "Maratha (SEBC) quota may apply in some cases."
  },
  {
    state: "Andhra Pradesh",
    primaryMode: "rank_based",
    primaryExam: "AP EAMCET",
    counselingAuthority: "APSCHE",
    weightage: "100% EAMCET",
    inputField: "rank",
    exampleMessage: "Enter your AP EAMCET Rank",
    reservations: [
      { category: "SC", percentage: 15 },
      { category: "ST", percentage: 6 },
      { category: "BC-A", percentage: 7 },
      { category: "BC-B", percentage: 10 },
      { category: "BC-C", percentage: 1 },
      { category: "BC-D", percentage: 7 },
      { category: "BC-E", percentage: 4 },
      { category: "EWS", percentage: 10 },
    ]
  },
  {
    state: "Telangana",
    primaryMode: "rank_based",
    primaryExam: "TS EAMCET",
    counselingAuthority: "TSCHE",
    weightage: "100% EAMCET",
    inputField: "rank",
    exampleMessage: "Enter your TS EAMCET Rank",
    reservations: [
      { category: "SC", percentage: 15 },
      { category: "ST", percentage: 6 },
      { category: "BC", percentage: 29 },
      { category: "EWS", percentage: 10 },
    ]
  },
  {
    state: "Uttar Pradesh",
    primaryMode: "hybrid",
    primaryExam: "JEE Main / CUET",
    counselingAuthority: "UPTAC / University Level",
    weightage: "JEE Main + 12th Marks / CUET",
    inputField: "rank",
    exampleMessage: "Enter your JEE Main Rank or CUET Score",
    reservations: [
      { category: "SC", percentage: 21 },
      { category: "ST", percentage: 2 },
      { category: "OBC", percentage: 27 },
      { category: "EWS", percentage: 10 },
    ]
  },
  {
    state: "Delhi",
    primaryMode: "hybrid",
    primaryExam: "JEE Main / CUET / DUCS",
    counselingAuthority: "Joint Admission Council / University of Delhi",
    weightage: "JEE / CUET + 12th",
    inputField: "rank",
    exampleMessage: "Enter your JEE Rank or CUET Score",
    reservations: [
      { category: "SC", percentage: 15 },
      { category: "ST", percentage: 7.5 },
      { category: "OBC", percentage: 27 },
      { category: "EWS", percentage: 10 },
    ]
  },
  {
    state: "West Bengal",
    primaryMode: "rank_based",
    primaryExam: "WBJEE",
    counselingAuthority: "WBJEEB",
    weightage: "100% WBJEE",
    inputField: "rank",
    exampleMessage: "Enter your WBJEE Rank",
    reservations: [
      { category: "SC", percentage: 22 },
      { category: "ST", percentage: 6 },
      { category: "OBC-A", percentage: 10 },
      { category: "OBC-B", percentage: 7 },
    ]
  }
];

export const getStateRules = (stateName: string): StateAdmissionRule | undefined => {
  return admissionRules.find(
    rule => rule.state.toLowerCase() === stateName.toLowerCase()
  );
};

export const getAllStates = () => admissionRules.map(rule => rule.state);
