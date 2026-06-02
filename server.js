import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 4000;
const SECRET = 'change-this-secret';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const DIST_DIR = path.join(__dirname, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');

const SEEDED_PASSWORD = bcrypt.hashSync('barangay420', 10);
const seededAccounts = [
  {
    id: 'seed-secretary-1',
    username: 'sec.miranda',
    firstName: 'Elena',
    middleName: 'Ramos',
    lastName: 'Miranda',
    email: 'elena.miranda@barangay420.local',
    contactNumber: '09170000001',
    address: 'Barangay Hall, Zone 43',
    password: SEEDED_PASSWORD,
    role: 'secretary',
  },
  {
    id: 'seed-admin-1',
    username: 'admin',
    firstName: 'Admin',
    middleName: '',
    lastName: 'Account',
    email: 'admin@barangay420.local',
    contactNumber: '09170000100',
    address: 'Barangay Hall, Zone 43',
    password: SEEDED_PASSWORD,
    role: 'secretary',
  },
  {
    id: 'seed-staff-1',
    username: 'staff.lopez',
    firstName: 'Marco',
    middleName: 'Diaz',
    lastName: 'Lopez',
    email: 'marco.lopez@barangay420.local',
    contactNumber: '09170000002',
    address: 'Purok 1, Barangay 420',
    password: SEEDED_PASSWORD,
    role: 'staff',
  },
  {
    id: 'seed-resident-1',
    username: 'rosa.santos',
    firstName: 'Rosa',
    middleName: 'Flores',
    lastName: 'Santos',
    email: 'rosa.santos@barangay420.local',
    contactNumber: '09170000003',
    address: '22 Campupot Street, Roxas District',
    password: SEEDED_PASSWORD,
    role: 'resident',
  },
  {
    id: 'seed-resident-2',
    username: 'victor.cruz',
    firstName: 'Victor',
    middleName: 'Luna',
    lastName: 'Cruz',
    email: 'victor.cruz@barangay420.local',
    contactNumber: '09170000004',
    address: '18 Sevilla Street, Sampaloc',
    password: SEEDED_PASSWORD,
    role: 'resident',
  },
  {
    id: 'seed-resident-3',
    username: 'maria.garcia',
    firstName: 'Maria',
    middleName: 'Reyes',
    lastName: 'Garcia',
    email: 'maria.garcia@barangay420.local',
    contactNumber: '09170000005',
    address: '5 Lerma Street, Sampaloc',
    password: SEEDED_PASSWORD,
    role: 'resident',
  },
  {
    id: 'seed-resident-4',
    username: 'andres.navarro',
    firstName: 'Andres',
    middleName: 'Tolentino',
    lastName: 'Navarro',
    email: 'andres.navarro@barangay420.local',
    contactNumber: '09170000006',
    address: '12 Dapitan Street, Sampaloc',
    password: SEEDED_PASSWORD,
    role: 'resident',
  },
  {
    id: 'seed-resident-5',
    username: 'liza.rivera',
    firstName: 'Liza',
    middleName: 'Torres',
    lastName: 'Rivera',
    email: 'liza.rivera@barangay420.local',
    contactNumber: '09170000007',
    address: '34 Piy Margal Street, Sampaloc',
    password: SEEDED_PASSWORD,
    role: 'resident',
  },
  {
    id: 'seed-resident-6',
    username: 'noel.castillo',
    firstName: 'Noel',
    middleName: 'Santos',
    lastName: 'Castillo',
    email: 'noel.castillo@barangay420.local',
    contactNumber: '09170000008',
    address: '19 Bustillos Street, Sampaloc',
    password: SEEDED_PASSWORD,
    role: 'resident',
  },
  {
    id: 'seed-resident-7',
    username: 'grace.mendoza',
    firstName: 'Grace',
    middleName: 'Perez',
    lastName: 'Mendoza',
    email: 'grace.mendoza@barangay420.local',
    contactNumber: '09170000009',
    address: '8 P. Noval Street, Sampaloc',
    password: SEEDED_PASSWORD,
    role: 'resident',
  },
  {
    id: 'seed-resident-8',
    username: 'ramon.deleon',
    firstName: 'Ramon',
    middleName: 'Aquino',
    lastName: 'De Leon',
    email: 'ramon.deleon@barangay420.local',
    contactNumber: '09170000010',
    address: '42 Galicia Street, Sampaloc',
    password: SEEDED_PASSWORD,
    role: 'resident',
  },
];
const seedUsers = seededAccounts;
const seedResidents = [
  {
    id: 'seed-resident-record-1',
    userId: 'seed-resident-1',
    name: 'Rosa Flores Santos',
    email: 'rosa.santos@barangay420.local',
    contactNumber: '09170000003',
    address: '22 Campupot Street, Roxas District',
    household: 'HH-420-001',
    membersCount: 4,
    age: 67,
    birthDate: '1958-08-14',
    gender: 'Female',
    civilStatus: 'Widowed',
    occupation: 'Retired Vendor',
    is_pwd: false,
    citizenship: 'Filipino',
    notes: 'Senior citizen beneficiary.',
    status: 'Claimed',
    beneficiarySelectionCount: 3,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    householdMembers: [
      { id: 'seed-r1-m1', fullName: 'Rosa Flores Santos', relationship: 'Head', age: 67, gender: 'Female', occupation: 'Retired Vendor', civilStatus: 'Widowed' },
      { id: 'seed-r1-m2', fullName: 'Joel Santos', relationship: 'Son', age: 39, gender: 'Male', occupation: 'Driver', civilStatus: 'Married' },
      { id: 'seed-r1-m3', fullName: 'Mila Santos', relationship: 'Daughter-in-law', age: 36, gender: 'Female', occupation: 'Cashier', civilStatus: 'Married' },
      { id: 'seed-r1-m4', fullName: 'Ella Santos', relationship: 'Grandchild', age: 11, gender: 'Female', occupation: 'Student', civilStatus: 'Single' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-resident-record-2',
    userId: 'seed-resident-2',
    name: 'Victor Luna Cruz',
    email: 'victor.cruz@barangay420.local',
    contactNumber: '09170000004',
    address: '18 Sevilla Street, Sampaloc',
    household: 'HH-420-002',
    membersCount: 3,
    age: 61,
    birthDate: '1964-02-03',
    gender: 'Male',
    civilStatus: 'Married',
    occupation: 'Security Guard',
    is_pwd: true,
    citizenship: 'Filipino',
    notes: 'PWD and senior monitoring needed.',
    status: 'Pending',
    beneficiarySelectionCount: 5,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    householdMembers: [
      { id: 'seed-r2-m1', fullName: 'Victor Luna Cruz', relationship: 'Head', age: 61, gender: 'Male', occupation: 'Security Guard', civilStatus: 'Married' },
      { id: 'seed-r2-m2', fullName: 'Lina Cruz', relationship: 'Spouse', age: 58, gender: 'Female', occupation: 'Seamstress', civilStatus: 'Married' },
      { id: 'seed-r2-m3', fullName: 'Paolo Cruz', relationship: 'Son', age: 22, gender: 'Male', occupation: 'Student', civilStatus: 'Single' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-resident-record-3',
    userId: 'seed-resident-3',
    name: 'Maria Reyes Garcia',
    email: 'maria.garcia@barangay420.local',
    contactNumber: '09170000005',
    address: '5 Lerma Street, Sampaloc',
    household: 'HH-420-003',
    membersCount: 5,
    age: 34,
    birthDate: '1991-01-24',
    gender: 'Female',
    civilStatus: 'Married',
    occupation: 'Online Seller',
    is_pwd: false,
    citizenship: 'Filipino',
    notes: 'Household with one senior dependent.',
    status: 'Pending',
    beneficiarySelectionCount: 1,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    householdMembers: [
      { id: 'seed-r3-m1', fullName: 'Maria Reyes Garcia', relationship: 'Head', age: 34, gender: 'Female', occupation: 'Online Seller', civilStatus: 'Married' },
      { id: 'seed-r3-m2', fullName: 'Carlo Garcia', relationship: 'Spouse', age: 35, gender: 'Male', occupation: 'Mechanic', civilStatus: 'Married' },
      { id: 'seed-r3-m3', fullName: 'Lolo Ernesto Reyes', relationship: 'Father', age: 72, gender: 'Male', occupation: 'Retired', civilStatus: 'Widowed' },
      { id: 'seed-r3-m4', fullName: 'Celine Garcia', relationship: 'Child', age: 10, gender: 'Female', occupation: 'Student', civilStatus: 'Single' },
      { id: 'seed-r3-m5', fullName: 'Kyle Garcia', relationship: 'Child', age: 7, gender: 'Male', occupation: 'Student', civilStatus: 'Single' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-resident-record-4',
    userId: 'seed-resident-4',
    name: 'Andres Tolentino Navarro',
    email: 'andres.navarro@barangay420.local',
    contactNumber: '09170000006',
    address: '12 Dapitan Street, Sampaloc',
    household: 'HH-420-004',
    membersCount: 2,
    age: 46,
    birthDate: '1979-06-17',
    gender: 'Male',
    civilStatus: 'Separated',
    occupation: 'Tricycle Driver',
    is_pwd: true,
    citizenship: 'Filipino',
    notes: 'PWD assistance follow-up.',
    status: 'Claimed',
    beneficiarySelectionCount: 4,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    householdMembers: [
      { id: 'seed-r4-m1', fullName: 'Andres Tolentino Navarro', relationship: 'Head', age: 46, gender: 'Male', occupation: 'Tricycle Driver', civilStatus: 'Separated' },
      { id: 'seed-r4-m2', fullName: 'Anne Navarro', relationship: 'Daughter', age: 16, gender: 'Female', occupation: 'Student', civilStatus: 'Single' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-resident-record-5',
    userId: 'seed-resident-5',
    name: 'Liza Torres Rivera',
    email: 'liza.rivera@barangay420.local',
    contactNumber: '09170000007',
    address: '34 Piy Margal Street, Sampaloc',
    household: 'HH-420-005',
    membersCount: 6,
    age: 58,
    birthDate: '1968-03-22',
    gender: 'Female',
    civilStatus: 'Married',
    occupation: 'Market Vendor',
    is_pwd: false,
    citizenship: 'Filipino',
    notes: 'Household includes two school-age dependents.',
    status: 'Pending',
    beneficiarySelectionCount: 2,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    householdMembers: [
      { id: 'seed-r5-m1', fullName: 'Liza Torres Rivera', relationship: 'Head', age: 58, gender: 'Female', occupation: 'Market Vendor', civilStatus: 'Married' },
      { id: 'seed-r5-m2', fullName: 'Mario Rivera', relationship: 'Spouse', age: 60, gender: 'Male', occupation: 'Construction Worker', civilStatus: 'Married' },
      { id: 'seed-r5-m3', fullName: 'Nica Rivera', relationship: 'Daughter', age: 18, gender: 'Female', occupation: 'Student', civilStatus: 'Single' },
      { id: 'seed-r5-m4', fullName: 'Jules Rivera', relationship: 'Son', age: 15, gender: 'Male', occupation: 'Student', civilStatus: 'Single' },
      { id: 'seed-r5-m5', fullName: 'Aida Torres', relationship: 'Mother', age: 79, gender: 'Female', occupation: 'Retired', civilStatus: 'Widowed' },
      { id: 'seed-r5-m6', fullName: 'Ben Torres', relationship: 'Brother', age: 49, gender: 'Male', occupation: 'Driver', civilStatus: 'Single' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-resident-record-6',
    userId: 'seed-resident-6',
    name: 'Noel Santos Castillo',
    email: 'noel.castillo@barangay420.local',
    contactNumber: '09170000008',
    address: '19 Bustillos Street, Sampaloc',
    household: 'HH-420-006',
    membersCount: 4,
    age: 63,
    birthDate: '1963-11-09',
    gender: 'Male',
    civilStatus: 'Married',
    occupation: 'Retired Messenger',
    is_pwd: false,
    citizenship: 'Filipino',
    notes: 'Senior citizen for assistance review.',
    status: 'Claimed',
    beneficiarySelectionCount: 6,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    householdMembers: [
      { id: 'seed-r6-m1', fullName: 'Noel Santos Castillo', relationship: 'Head', age: 63, gender: 'Male', occupation: 'Retired Messenger', civilStatus: 'Married' },
      { id: 'seed-r6-m2', fullName: 'Teresita Castillo', relationship: 'Spouse', age: 61, gender: 'Female', occupation: 'Homemaker', civilStatus: 'Married' },
      { id: 'seed-r6-m3', fullName: 'Nolan Castillo', relationship: 'Son', age: 28, gender: 'Male', occupation: 'Crew Member', civilStatus: 'Single' },
      { id: 'seed-r6-m4', fullName: 'Rica Castillo', relationship: 'Daughter', age: 24, gender: 'Female', occupation: 'Office Clerk', civilStatus: 'Single' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-resident-record-7',
    userId: 'seed-resident-7',
    name: 'Grace Perez Mendoza',
    email: 'grace.mendoza@barangay420.local',
    contactNumber: '09170000009',
    address: '8 P. Noval Street, Sampaloc',
    household: 'HH-420-007',
    membersCount: 3,
    age: 42,
    birthDate: '1984-07-05',
    gender: 'Female',
    civilStatus: 'Single',
    occupation: 'Laundry Shop Attendant',
    is_pwd: true,
    citizenship: 'Filipino',
    notes: 'PWD support and medical follow-up.',
    status: 'Pending',
    beneficiarySelectionCount: 3,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    householdMembers: [
      { id: 'seed-r7-m1', fullName: 'Grace Perez Mendoza', relationship: 'Head', age: 42, gender: 'Female', occupation: 'Laundry Shop Attendant', civilStatus: 'Single' },
      { id: 'seed-r7-m2', fullName: 'Letty Mendoza', relationship: 'Mother', age: 69, gender: 'Female', occupation: 'Retired', civilStatus: 'Widowed' },
      { id: 'seed-r7-m3', fullName: 'Mika Mendoza', relationship: 'Niece', age: 13, gender: 'Female', occupation: 'Student', civilStatus: 'Single' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-resident-record-8',
    userId: 'seed-resident-8',
    name: 'Ramon Aquino De Leon',
    email: 'ramon.deleon@barangay420.local',
    contactNumber: '09170000010',
    address: '42 Galicia Street, Sampaloc',
    household: 'HH-420-008',
    membersCount: 5,
    age: 51,
    birthDate: '1975-01-13',
    gender: 'Male',
    civilStatus: 'Married',
    occupation: 'Jeepney Driver',
    is_pwd: false,
    citizenship: 'Filipino',
    notes: 'Claimed beneficiary under household assistance.',
    status: 'Claimed',
    beneficiarySelectionCount: 2,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    householdMembers: [
      { id: 'seed-r8-m1', fullName: 'Ramon Aquino De Leon', relationship: 'Head', age: 51, gender: 'Male', occupation: 'Jeepney Driver', civilStatus: 'Married' },
      { id: 'seed-r8-m2', fullName: 'Helen De Leon', relationship: 'Spouse', age: 47, gender: 'Female', occupation: 'Sari-sari Store Owner', civilStatus: 'Married' },
      { id: 'seed-r8-m3', fullName: 'Mark De Leon', relationship: 'Son', age: 21, gender: 'Male', occupation: 'Student', civilStatus: 'Single' },
      { id: 'seed-r8-m4', fullName: 'Maine De Leon', relationship: 'Daughter', age: 17, gender: 'Female', occupation: 'Student', civilStatus: 'Single' },
      { id: 'seed-r8-m5', fullName: 'Ruel Aquino', relationship: 'Brother-in-law', age: 44, gender: 'Male', occupation: 'Mechanic', civilStatus: 'Married' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
const seedEvents = [
  {
    id: uuidv4(),
    title: 'Barangay Assembly Day',
    date: '2026-05-06',
    location: 'Barangay Hall',
    description: 'Monthly assembly covering community concerns, open forum, and service updates.',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Medical Mission',
    date: '2026-05-18',
    location: 'Covered Court',
    description: 'Free checkups, blood pressure screening, and medicine distribution for residents.',
    imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

app.use(cors());
app.use(express.json());

function loadStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = { users: seedUsers, residents: [], programs: [], events: seedEvents, logs: [], backups: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : seedUsers,
      residents: Array.isArray(parsed.residents) ? parsed.residents : [],
      programs: Array.isArray(parsed.programs) ? parsed.programs : [],
      events: Array.isArray(parsed.events) ? parsed.events : seedEvents,
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      backups: Array.isArray(parsed.backups) ? parsed.backups : [],
    };
  } catch {
    const fallbackData = { users: seedUsers, residents: [], programs: [], events: seedEvents, logs: [], backups: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallbackData, null, 2));
    return fallbackData;
  }
}

function saveStore() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ users, residents, programs, events, logs, backups }, null, 2)
  );
}

function ensureSeedData() {
  let changed = false;

  for (const account of seededAccounts) {
    const existing = users.find(
      (user) =>
        (user.id && user.id === account.id) ||
        ((user.username || '').toLowerCase() === account.username.toLowerCase()) ||
        ((user.email || '').toLowerCase() === account.email.toLowerCase())
    );
    if (!existing) {
      users.push({ ...account });
      changed = true;
    }
  }

  for (const resident of seedResidents) {
    const existingIndex = residents.findIndex(
      (item) =>
        item.id === resident.id ||
        ((item.userId || '') && item.userId === resident.userId) ||
        ((item.household || '').toLowerCase() === resident.household.toLowerCase())
    );
    if (existingIndex === -1) {
      residents.push({ ...resident });
      changed = true;
      continue;
    }

    const current = residents[existingIndex];
    const mergedResident = {
      ...current,
      beneficiarySelectionCount:
        current.beneficiarySelectionCount == null ? resident.beneficiarySelectionCount || 0 : current.beneficiarySelectionCount,
      lastBeneficiarySelectedAt:
        cleanText(current.lastBeneficiarySelectedAt) || resident.lastBeneficiarySelectedAt || '',
    };

    if (
      mergedResident.beneficiarySelectionCount !== current.beneficiarySelectionCount ||
      mergedResident.lastBeneficiarySelectedAt !== current.lastBeneficiarySelectedAt
    ) {
      residents[existingIndex] = normalizeResidentRecord(mergedResident);
      changed = true;
    }
  }

  if (changed) saveStore();
}

const store = loadStore();
let users = store.users;
let residents = [];
let programs = [];
let events = [];
let logs = [];
let backups = [];

residents = store.residents.map((resident) => normalizeResidentRecord(resident));
programs = store.programs;
events = store.events;
logs = store.logs;
backups = store.backups;
ensureSeedData();

function log(action, userId = '', details = '') {
  logs.push({ id: uuidv4(), action, userId, details, timestamp: new Date().toISOString() });
  saveStore();
}

function cleanText(value) {
  return (value || "").toString().trim();
}

function getRequestUser(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeHouseholdMembers(value) {
  if (!Array.isArray(value)) return [];
  return value.map((member, index) => ({
    id: cleanText(member?.id) || uuidv4(),
    fullName: cleanText(member?.fullName) || `Member ${index + 1}`,
    relationship: cleanText(member?.relationship),
    age: toNumber(member?.age),
    gender: cleanText(member?.gender),
    occupation: cleanText(member?.occupation),
    civilStatus: cleanText(member?.civilStatus),
  }));
}

function normalizeResidentInput(body = {}, user = null) {
  return {
    userId: cleanText(body.userId) || user?.id || '',
    name: cleanText(body.name),
    email: cleanText(body.email).toLowerCase(),
    contactNumber: cleanText(body.contactNumber),
    address: cleanText(body.address),
    household: cleanText(body.household),
    membersCount: toNumber(body.membersCount),
    age: toNumber(body.age),
    birthDate: cleanText(body.birthDate),
    gender: cleanText(body.gender),
    civilStatus: cleanText(body.civilStatus),
    occupation: cleanText(body.occupation),
    is_pwd: Boolean(body.is_pwd),
    citizenship: cleanText(body.citizenship),
    notes: cleanText(body.notes),
    status: cleanText(body.status) || 'Pending',
    beneficiarySelectionCount: toNumber(body.beneficiarySelectionCount),
    lastBeneficiarySelectedAt: cleanText(body.lastBeneficiarySelectedAt),
    householdMembers: normalizeHouseholdMembers(body.householdMembers),
  };
}

function normalizeResidentRecord(resident = {}) {
  return {
    ...resident,
    userId: cleanText(resident.userId),
    name: cleanText(resident.name),
    email: cleanText(resident.email).toLowerCase(),
    contactNumber: cleanText(resident.contactNumber),
    address: cleanText(resident.address),
    household: cleanText(resident.household),
    membersCount: toNumber(resident.membersCount, 1),
    age: toNumber(resident.age),
    birthDate: cleanText(resident.birthDate),
    gender: cleanText(resident.gender),
    civilStatus: cleanText(resident.civilStatus),
    occupation: cleanText(resident.occupation),
    is_pwd: Boolean(resident.is_pwd),
    citizenship: cleanText(resident.citizenship),
    notes: cleanText(resident.notes),
    status: cleanText(resident.status) || 'Pending',
    beneficiarySelectionCount: toNumber(resident.beneficiarySelectionCount),
    lastBeneficiarySelectedAt: cleanText(resident.lastBeneficiarySelectedAt),
    householdMembers: normalizeHouseholdMembers(resident.householdMembers),
  };
}

function normalizeEventInput(body = {}, user = null) {
  return {
    title: cleanText(body.title),
    date: cleanText(body.date),
    location: cleanText(body.location) || 'Barangay Hall',
    description: cleanText(body.description),
    imageUrl: cleanText(body.imageUrl),
    createdBy: cleanText(body.createdBy) || user?.id || '',
  };
}

app.post('/api/register', async (req, res) => {
  try {
    const username = cleanText(req.body.username);
    const firstName = cleanText(req.body.firstName);
    const middleName = cleanText(req.body.middleName);
    const lastName = cleanText(req.body.lastName);
    const email = cleanText(req.body.email).toLowerCase();
    const contactNumber = cleanText(req.body.contactNumber);
    const address = cleanText(req.body.address);
    const password = cleanText(req.body.password);
    const role = cleanText(req.body.role).toLowerCase();
    const portal = cleanText(req.body.portal).toLowerCase() || 'resident';

    if (!firstName || !lastName || !email || !password || !username) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }
    if (!['staff', 'secretary', 'resident'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (!['resident', 'staff'].includes(portal)) {
      return res.status(400).json({ error: 'Invalid registration panel' });
    }
    if (portal === 'resident' && role !== 'resident') {
      return res.status(403).json({ error: 'Resident registration cannot create staff/admin accounts' });
    }
    if (portal === 'staff') {
      const requestUser = getRequestUser(req);
      if (!requestUser || requestUser.role !== 'secretary') {
        return res.status(403).json({ error: 'Only admin accounts can create staff/admin accounts' });
      }
      if (!['staff', 'secretary'].includes(role)) {
        return res.status(403).json({ error: 'Staff/admin registration cannot create resident accounts' });
      }
    }
    if (users.find(u => (u.username || "").toString().trim().toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Username exists' });
    }
    if (users.find(u => (u.email || "").toString().trim().toLowerCase() === email)) {
      return res.status(400).json({ error: 'Email exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      username,
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
      address,
      password: hash,
      role,
    };
    users.push(user);
    log(`register (${user.username})`, user.id);
    saveStore();
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        contactNumber: user.contactNumber,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const name = (username || "").toString().trim().toLowerCase();
  const portal = cleanText(req.body.portal).toLowerCase() || 'resident';
  if (!['resident', 'staff'].includes(portal)) {
    return res.status(400).json({ error: 'Invalid login panel' });
  }
  const user = users.find(u => (u.username || "").toString().trim().toLowerCase() === name || (u.email || "").toString().trim().toLowerCase() === name);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Wrong password' });
  if (portal === 'resident' && user.role !== 'resident') {
    return res.status(403).json({ error: 'Staff/admin accounts must use the staff/admin login' });
  }
  if (portal === 'staff' && !['staff', 'secretary'].includes(user.role)) {
    return res.status(403).json({ error: 'Resident accounts cannot login to the staff/admin panel' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, username: user.username, email: user.email }, SECRET, { expiresIn: '1h' });
  log(`login (${user.username} - ${user.role})`, user.id);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

function authenticate(req, res, next) {
  const data = getRequestUser(req);
  if (!data) return res.status(401).json({ error: 'Unauthorized' });
  // @ts-ignore
  req.user = data;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.get('/api/users', authenticate, requireRole('secretary'), (req, res) => {
  res.json(
    users.map(({ password, ...user }) => ({
      ...user,
      isActive: true,
    }))
  );
});

app.get('/api/residents', authenticate, requireRole('secretary'), (req, res) => {
  res.json(residents);
});

app.get('/api/residents/me', authenticate, (req, res) => {
  const resident = residents.find(r => r.userId === req.user.id) || null;
  res.json(resident);
});

app.post('/api/residents', authenticate, requireRole('secretary'), (req, res) => {
  const now = new Date().toISOString();
  const r = { id: uuidv4(), ...normalizeResidentInput(req.body), createdAt: now, updatedAt: now };
  residents.push(r);
  log('create_resident', req.user.id);
  saveStore();
  res.json(r);
});

app.post('/api/residents/me', authenticate, (req, res) => {
  const now = new Date().toISOString();
  const normalized = normalizeResidentInput(req.body, req.user);
  const idx = residents.findIndex(r => r.userId === req.user.id);

  if (idx === -1) {
    const resident = { id: uuidv4(), ...normalized, createdAt: now, updatedAt: now };
    residents.push(resident);
    log('create_resident_self', req.user.id);
    saveStore();
    return res.json(resident);
  }

  residents[idx] = {
    ...residents[idx],
    ...normalized,
    updatedAt: now,
  };
  log('update_resident_self', req.user.id);
  saveStore();
  res.json(residents[idx]);
});

app.put('/api/residents/:id', authenticate, requireRole('secretary'), (req, res) => {
  const idx = residents.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  residents[idx] = { ...residents[idx], ...normalizeResidentInput(req.body), updatedAt: new Date().toISOString() };
  log('update_resident', req.user.id);
  saveStore();
  res.json(residents[idx]);
});

app.delete('/api/residents/:id', authenticate, requireRole('secretary'), (req, res) => {
  residents = residents.filter(r => r.id !== req.params.id);
  log('delete_resident', req.user.id);
  saveStore();
  res.json({ success: true });
});

app.get('/api/programs', authenticate, (req, res) => {
  res.json(programs);
});

app.get('/api/events', authenticate, (req, res) => {
  const sortedEvents = [...events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  res.json(sortedEvents);
});

app.get('/api/dashboard/overview', authenticate, (req, res) => {
  const seniorResidents = residents.filter((resident) => resident.age >= 60).length;
  const pwdResidents = residents.filter((resident) => resident.is_pwd).length;
  const pendingBeneficiaries = residents.filter((resident) => resident.status === 'Pending').length;
  const claimedBeneficiaries = residents.filter((resident) => resident.status === 'Claimed').length;

  res.json({
    barangayName: 'Barangay 420 Zone 43',
    district: 'District IV, Sampaloc',
    city: 'City of Manila',
    totalResidents: residents.length,
    seniorResidents,
    pwdResidents,
    pendingBeneficiaries,
    claimedBeneficiaries,
    publishedEvents: events.length,
  });
});

app.post('/api/events', authenticate, requireRole('staff', 'secretary'), (req, res) => {
  const normalized = normalizeEventInput(req.body, req.user);
  if (!normalized.title || !normalized.date || !normalized.location) {
    return res.status(400).json({ error: 'Title, date, and location are required' });
  }

  const now = new Date().toISOString();
  const event = {
    id: uuidv4(),
    ...normalized,
    createdAt: now,
    updatedAt: now,
  };

  events.push(event);
  log('create_event', req.user.id, event.title);
  saveStore();
  res.json(event);
});

app.put('/api/events/:id', authenticate, requireRole('staff', 'secretary'), (req, res) => {
  const idx = events.findIndex(event => event.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found' });

  const normalized = normalizeEventInput(req.body, req.user);
  if (!normalized.title || !normalized.date || !normalized.location) {
    return res.status(400).json({ error: 'Title, date, and location are required' });
  }

  events[idx] = {
    ...events[idx],
    ...normalized,
    updatedAt: new Date().toISOString(),
  };
  log('update_event', req.user.id, events[idx].title);
  saveStore();
  res.json(events[idx]);
});

app.delete('/api/events/:id', authenticate, requireRole('staff', 'secretary'), (req, res) => {
  const existingEvent = events.find(event => event.id === req.params.id);
  if (!existingEvent) return res.status(404).json({ error: 'Event not found' });

  events = events.filter(event => event.id !== req.params.id);
  log('delete_event', req.user.id, existingEvent.title);
  saveStore();
  res.json({ success: true });
});

app.post('/api/programs', authenticate, requireRole('secretary'), (req, res) => {
  const p = { id: uuidv4(), ...req.body };
  programs.push(p);
  log('create_program', req.user.id);
  saveStore();
  res.json(p);
});

app.put('/api/programs/:id', authenticate, requireRole('secretary'), (req, res) => {
  const idx = programs.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  programs[idx] = { ...programs[idx], ...req.body };
  log('update_program', req.user.id);
  saveStore();
  res.json(programs[idx]);
});

app.delete('/api/programs/:id', authenticate, requireRole('secretary'), (req, res) => {
  programs = programs.filter(p => p.id !== req.params.id);
  log('delete_program', req.user.id);
  saveStore();
  res.json({ success: true });
});

app.get('/api/beneficiaries', authenticate, (req, res) => {
  // naive: all residents with age>=60 or is_pwd
  const filtered = residents.filter(r => r.age >= 60 || r.is_pwd);
  res.json(filtered);
});

app.post('/api/beneficiaries/:id/select', authenticate, requireRole('secretary'), (req, res) => {
  const idx = residents.findIndex((resident) => resident.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  residents[idx] = normalizeResidentRecord({
    ...residents[idx],
    beneficiarySelectionCount: toNumber(residents[idx].beneficiarySelectionCount) + 1,
    lastBeneficiarySelectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  log('select_beneficiary', req.user.id, residents[idx].id);
  saveStore();
  res.json(residents[idx]);
});

app.get('/api/logs', authenticate, requireRole('secretary'), (req, res) => {
  res.json(logs);
});

// Backup export and restore
app.get('/api/backup', authenticate, requireRole('secretary'), (req, res) => {
  const payload = { residents, programs, events, users, logs, timestamp: new Date().toISOString() };
  backups.push({ id: uuidv4(), data: payload, timestamp: new Date().toISOString() });
  log('backup_export', req.user.id);
  saveStore();
  res.json(payload);
});

app.post('/api/restore', authenticate, requireRole('secretary'), (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'No data provided' });
  residents = data.residents || [];
  programs = data.programs || [];
  events = data.events || [];
  users = data.users || users;
  logs = data.logs || logs;
  log('backup_restore', req.user.id);
  saveStore();
  res.json({ success: true });
});

if (fs.existsSync(DIST_DIR) && fs.existsSync(DIST_INDEX)) {
  app.use(express.static(DIST_DIR));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(DIST_INDEX);
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled API error:', err);
  if (res.headersSent) return next(err);
  const status = err.statusCode || err.status || 500;
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: err.type === 'entity.parse.failed' ? 'Invalid JSON body' : err.message || 'Bad request' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('API listening on', PORT);
  console.log('Registered users:', users.map(u => ({ username: u.username, role: u.role })));
});
