import { Platform } from 'react-native';

export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:5000', // Standard Android emulator loopback to host
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const SKILL_CATEGORIES = [
  'All',
  'Programming',
  'Mobile Dev',
  'Web Dev',
  'Design & UI/UX',
  'Academic',
  'Data Science',
  'Cloud & DevOps',
  'Communication',
  'Business',
  'General',
];

export const SKILL_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const TASK_PRIORITIES = ['All', 'High', 'Medium', 'Low'];
export const TASK_STATUSES = ['All', 'Pending', 'In Progress', 'Completed'];

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const INTERNAL_EXAM_TYPES = [
  'All',
  'Unit Test 1',
  'Unit Test 2',
  'Mid-Term Exam',
  'Model Exam',
  'Internal Practical',
  'Assignment Quiz',
];

export const EXTERNAL_EXAM_TYPES = [
  'All',
  'University Theory',
  'University Practical',
  'Viva Voce',
  'Semester Final',
  'Certification Exam',
];

export const EXPENSE_CATEGORIES = [
  'All',
  'Academic & Books',
  'Software & Tools',
  'Stationery',
  'Courses & Certs',
  'Food & Cafeteria',
  'Travel & Transport',
  'Gadgets & Hardware',
  'General',
];

export const CLIENT_STATUSES = [
  'All',
  'Lead',
  'Contacted',
  'Discussion',
  'Proposal Sent',
  'Active',
  'Completed',
  'Cancelled',
];

export const MEMBER_ROLES = [
  'All',
  'Founder',
  'Co-Founder',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'Project Manager',
  'Marketing',
  'Business Development',
];

export const PROJECT_STATUSES = [
  'All',
  'Planning',
  'Development',
  'Testing',
  'Review',
  'Completed',
  'On Hold',
];
