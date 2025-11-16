// Generated TypeScript types from Prisma schema

export enum QuizType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  SHORT_ANSWER = "SHORT_ANSWER",
}

export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  SHORT_ANSWER = "SHORT_ANSWER",
  FILL_IN_BLANK = "FILL_IN_BLANK",
}

export enum Difficulty {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export enum QuizStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
  topics?: Topic[]
  quizzes?: Quiz[]
  answers?: Answer[]
  progress?: Progress[]
}

export interface Topic {
  id: string
  name: string
  description: string | null
  createdAt: Date
  userId: string
  user?: User
  quizzes?: Quiz[]
  progress?: Progress[]
  suggestions?: Suggestion[]
}

export interface Quiz {
  id: string
  title: string
  type: QuizType
  difficulty: Difficulty
  createdAt: Date
  expiresAt: Date | null
  timer: number | null
  status: QuizStatus
  count: number
  topicId: string
  userId: string
  topic?: Topic
  user?: User
  questions?: Question[]
}

export interface Question {
  id: string
  text: string
  type: QuestionType
  options: any | null // JSON type for MCQ options
  correct: string | null
  createdAt: Date
  quizId: string
  quiz?: Quiz
  explanation?: Explanation
  answers?: Answer[]
}

export interface Answer {
  id: string
  userAnswer: string
  isCorrect: boolean
  createdAt: Date
  questionId: string
  userId: string
  question?: Question
  user?: User
}

export interface Explanation {
  id: string
  content: string
  createdAt: Date
  questionId: string
  question?: Question
}

export interface Progress {
  id: string
  score: number
  total: number
  streak: number
  lastActive: Date
  topicId: string
  userId: string
  topic?: Topic
  user?: User
}

export interface Suggestion {
  id: string
  suggestedTopic: string
  reason: string | null
  createdAt: Date
  topicId: string
  topic?: Topic
}
