export interface TeacherRecord {
  classId: number;
  date: string;
  unpaidStudents?: Array<{
    id: number;
    amount: number;
    paidBy: string;
    hasPaid: boolean;
    date: string;
  }>;
  paidStudents?: Array<{
    id: number;
    amount: number;
    paidBy: string;
    hasPaid: boolean;
    date: string;
  }>;
  absentStudents?: Array<{
    id: number;
    amount_owing: number;
    paidBy: string;
    hasPaid: boolean;
    date: string;
  }>;
  submittedBy: number;
  teacher?: {
    id: number;
    name: string;
  };
  class?: {
    id: number;
    name: string;
  };
}
