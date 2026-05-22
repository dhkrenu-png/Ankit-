/**
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct answer
}

export interface Chapter {
  id: string;
  name: string;
  notesPdfName: string;
  notesSize: string;
  hasHandwritten: boolean;
  hasFormulas: boolean;
  hasImportantQs: boolean;
  mcqs: MCQ[];
  completed: boolean;
  isWeak: boolean;
}

export interface Lecture {
  id: string;
  title: string;
  duration: string;
  teacher: string;
  ytEmbed?: string;
  progress: number; // percentage completed
  saved: boolean;
  views: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  iconName: string;
  bgGradient: string;
  chapters: Chapter[];
  lectures: Lecture[];
}

export const CLASS10_SUBJECTS: Subject[] = [
  {
    id: 'science',
    name: 'Science',
    color: 'text-cyan-400',
    iconName: 'Atom',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
    chapters: [
      {
        id: 'sci-ch1',
        name: 'Chemical Reactions and Equations',
        notesPdfName: 'sci_ch1_chemical_notes_final.pdf',
        notesSize: '2.4 MB',
        hasHandwritten: true,
        hasFormulas: true,
        hasImportantQs: true,
        completed: true,
        isWeak: false,
        mcqs: [
          {
            question: "Which of the following is a displacement reaction?",
            options: ["CaCO3 -> CaO + CO2", "2H2 + O2 -> 2H2O", "Fe + CuSO4 -> FeSO4 + Cu", "NaOH + HCl -> NaCl + H2O"],
            correctAnswer: 2
          },
          {
            question: "What is the color of FeSO4 crystals?",
            options: ["White", "Light Green", "Blue", "Brown"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'sci-ch2',
        name: 'Acids, Bases and Salts',
        notesPdfName: 'sci_ch2_acids_bases_handwritten.pdf',
        notesSize: '3.1 MB',
        hasHandwritten: true,
        hasFormulas: false,
        hasImportantQs: true,
        completed: false,
        isWeak: true,
        mcqs: [
          {
            question: "Which gas is released when acids react with metals?",
            options: ["Oxygen", "Hydrogen", "Carbon dioxide", "Nitrogen"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'sci-ch3',
        name: 'Metals and Non-metals',
        notesPdfName: 'sci_ch3_metals_quick_rev.pdf',
        notesSize: '1.8 MB',
        hasHandwritten: false,
        hasFormulas: true,
        hasImportantQs: true,
        completed: false,
        isWeak: true,
        mcqs: [
          {
            question: "Which metal exists in liquid state at room temperature?",
            options: ["Sodium", "Mercury", "Gallium", "Calcium"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'sci-ch4',
        name: 'Carbon and its Compounds',
        notesPdfName: 'sci_ch4_carbon_full_reactions.pdf',
        notesSize: '4.2 MB',
        hasHandwritten: true,
        hasFormulas: true,
        hasImportantQs: true,
        completed: false,
        isWeak: false,
        mcqs: [
          {
            question: "What is the general formula of Alkanes?",
            options: ["CnH2n+2", "CnH2n", "CnH2n-2", "CnHn"],
            correctAnswer: 0
          }
        ]
      }
    ],
    lectures: [
      { id: 'sci-lec1', title: 'Carbon & Its Compounds: Full One-Shot Class', duration: '1h 45m', teacher: 'Alok Sir (Aura Lectures)', progress: 80, saved: true, views: '12K views' },
      { id: 'sci-lec2', title: 'All Chemical Reacations & Equations Map', duration: '55m', teacher: 'Megha Ma\'am', progress: 0, saved: false, views: '8.4K views' },
      { id: 'sci-lec3', title: 'Top 50 Numericals of Light & Electricity', duration: '1h 12m', teacher: 'Prabhat Sir', progress: 30, saved: false, views: '15K views' }
    ]
  },
  {
    id: 'maths',
    name: 'Mathematics',
    color: 'text-purple-400',
    iconName: 'Calculator',
    bgGradient: 'from-purple-500/10 to-indigo-500/10',
    chapters: [
      {
        id: 'math-ch1',
        name: 'Real Numbers',
        notesPdfName: 'math_ch1_real_numbers_formula_sheet.pdf',
        notesSize: '1.2 MB',
        hasHandwritten: false,
        hasFormulas: true,
        hasImportantQs: true,
        completed: true,
        isWeak: false,
        mcqs: [
          {
            question: "For any two positive integers a and b, HCF(a,b) x LCM(a,b) is equal to:",
            options: ["a + b", "a / b", "a x b", "a^b"],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'math-ch2',
        name: 'Polynomials',
        notesPdfName: 'math_ch2_polynomials_short_notes.pdf',
        notesSize: '1.5 MB',
        hasHandwritten: true,
        hasFormulas: true,
        hasImportantQs: true,
        completed: true,
        isWeak: false,
        mcqs: [
          {
            question: "What is the maximum number of zeroes a quadratic polynomial can have?",
            options: ["1", "2", "3", "0"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'math-ch3',
        name: 'Quadratic Equations',
        notesPdfName: 'math_ch3_quadratic_roots_formula.pdf',
        notesSize: '2.0 MB',
        hasHandwritten: true,
        hasFormulas: true,
        hasImportantQs: true,
        completed: false,
        isWeak: true,
        mcqs: [
          {
            question: "If discriminant D > 0, the roots of the quadratic equation are:",
            options: ["Real and Equal", "Real and Distinct", "Complex/No Real Roots", "Imaginary"],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'math-ch4',
        name: 'Introduction to Trigonometry',
        notesPdfName: 'math_ch4_trigo_identities_cheat_sheet.pdf',
        notesSize: '3.5 MB',
        hasHandwritten: true,
        hasFormulas: true,
        hasImportantQs: true,
        completed: false,
        isWeak: true,
        mcqs: [
          {
            question: "What is the value of sin^2(A) + cos^2(A)?",
            options: ["0", "1", "-1", "2"],
            correctAnswer: 1
          }
        ]
      }
    ],
    lectures: [
      { id: 'math-lec1', title: 'Trigonometry Super Cheat Sheet & Tricks', duration: '45m', teacher: 'VP Sir (Mathematics Aura)', progress: 95, saved: true, views: '18K views' },
      { id: 'math-lec2', title: 'Quadratic Equations: Complete Formula Proofs', duration: '1h 5m', teacher: 'VP Sir', progress: 10, saved: false, views: '9K views' },
      { id: 'math-lec3', title: 'Class 10 Triangles Theorem Revision', duration: '1h 30m', teacher: 'Neha Ma\'am', progress: 0, saved: true, views: '11K views' }
    ]
  },
  {
    id: 'social',
    name: 'Social Science',
    color: 'text-teal-400',
    iconName: 'Globe',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
    chapters: [
      {
        id: 'sst-ch1',
        name: 'Rise of Nationalism in Europe',
        notesPdfName: 'sst_ch1_nationalism_europe_dates.pdf',
        notesSize: '2.8 MB',
        hasHandwritten: true,
        hasFormulas: false,
        hasImportantQs: true,
        completed: false,
        isWeak: false,
        mcqs: [
          {
            question: "Who was proclaimed the first German Emperor in 1871?",
            options: ["William I", "William II", "Friedrich Wilhelm IV", "Napoleon Bonaparte"],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 'sst-ch2',
        name: 'Nationalism in India',
        notesPdfName: 'sst_ch2_nationalism_india_timeline.pdf',
        notesSize: '3.2 MB',
        hasHandwritten: true,
        hasFormulas: false,
        hasImportantQs: true,
        completed: true,
        isWeak: false,
        mcqs: [
          {
            question: "In which year did the Jallianwala Bagh incident take place?",
            options: ["1918", "1919", "1920", "1921"],
            correctAnswer: 1
          }
        ]
      }
    ],
    lectures: [
      { id: 'sst-lec1', title: 'Nationalism in India: Complete Timeline Rev', duration: '1h 10m', teacher: 'Sanjay Sir', progress: 50, saved: false, views: '14K views' },
      { id: 'sst-lec2', title: 'Top 25 Map Work Questions Class 10 Board', duration: '35m', teacher: 'Simran Ma\'am', progress: 0, saved: true, views: '22K views' }
    ]
  },
  {
    id: 'english',
    name: 'English Literature',
    color: 'text-amber-400',
    iconName: 'BookOpen',
    bgGradient: 'from-amber-500/10 to-orange-500/10',
    chapters: [
      {
        id: 'eng-ch1',
        name: 'A Letter to God',
        notesPdfName: 'eng_ch1_letter_to_god_summaries.pdf',
        notesSize: '1.1 MB',
        hasHandwritten: false,
        hasFormulas: false,
        hasImportantQs: true,
        completed: true,
        isWeak: false,
        mcqs: [
          {
            question: "What did Lencho hope for?",
            options: ["A good shower of rain for his crop", "A new tractor", "A monetary gift", "A letters answer"],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 'eng-ch2',
        name: 'Nelson Mandela: Long Walk to Freedom',
        notesPdfName: 'eng_ch2_mandela_character_sketches.pdf',
        notesSize: '1.7 MB',
        hasHandwritten: true,
        hasFormulas: false,
        hasImportantQs: true,
        completed: false,
        isWeak: false,
        mcqs: [
          {
            question: "How many years did Mandela spend behind bars?",
            options: ["20 years", "30 years", "10 years", "40 years"],
            correctAnswer: 1
          }
        ]
      }
    ],
    lectures: [
      { id: 'eng-lec1', title: 'Class 10 Board English Writing Formats One-Shot', duration: '40m', teacher: 'Ritu Ma\'am', progress: 0, saved: false, views: '20K views' }
    ]
  },
  {
    id: 'hindi',
    name: 'Hindi (Sparsh/Kshitij)',
    color: 'text-pink-400',
    iconName: 'Languages',
    bgGradient: 'from-pink-500/10 to-rose-500/10',
    chapters: [
      {
        id: 'hin-ch1',
        name: 'Netaji Ka Chashma (नेताजी का चश्मा)',
        notesPdfName: 'hin_ch1_netaji_vyakhya.pdf',
        notesSize: '1.4 MB',
        hasHandwritten: false,
        hasFormulas: false,
        hasImportantQs: true,
        completed: true,
        isWeak: false,
        mcqs: [
          {
            question: "नेताजी की मूर्ति पर चश्मा कौन लगाता था?",
            options: ["हलदार साहब", "पानवाला", "कैप्टन चश्मेवाला", "लेखक स्वयं"],
            correctAnswer: 2
          }
        ]
      }
    ],
    lectures: [
      { id: 'hin-lec1', title: 'Hindi Class 10 Board Grammar Crash Course', duration: '1h 15m', teacher: 'Vyas Ji', progress: 100, saved: false, views: '10K views' }
    ]
  },
  {
    id: 'it',
    name: 'Information Technology (402)',
    color: 'text-emerald-400',
    iconName: 'Layout',
    bgGradient: 'from-emerald-500/10 to-cyan-500/10',
    chapters: [
      {
        id: 'it-ch1',
        name: 'Web Applications and Security',
        notesPdfName: 'it_ch1_web_security_board_notes.pdf',
        notesSize: '2.1 MB',
        hasHandwritten: false,
        hasFormulas: false,
        hasImportantQs: true,
        completed: false,
        isWeak: false,
        mcqs: [
          {
            question: "Which of the following is a strong password requirement?",
            options: ["Only numbers", "Contains caps, numbers, and symbols", "Your birth year", "Same as username"],
            correctAnswer: 1
          }
        ]
      }
    ],
    lectures: [
      { id: 'it-lec1', title: 'Class 10 IT (402) - Complete Database Revision', duration: '1h 0m', teacher: 'Divya Ma\'am', progress: 15, saved: true, views: '6.5K views' }
    ]
  }
];

export const GENERAL_REVISION_PAPERS = [
  { id: 'pap-1', title: 'CBSE Science Class 10 Sample Board Paper - Year 2026/2027', category: 'Sample Paper', size: '3.4 MB', countDownloads: '4.5K' },
  { id: 'pap-2', title: 'Mathematics Standard PYQ Board Solutions (2025)', category: 'Previous Year Papers', size: '4.8 MB', countDownloads: '8.2K' },
  { id: 'pap-3', title: 'Social Science Topper Answer Sheet Scans', category: 'Sample Paper', size: '12.0 MB', countDownloads: '15K' },
  { id: 'pap-4', title: 'English Core Grammar Cheat Booklet (All Rules)', category: 'Short Summary', size: '1.1 MB', countDownloads: '6.4K' }
];
