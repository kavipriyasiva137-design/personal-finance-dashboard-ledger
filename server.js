import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Helper relative dates
const getRelativeDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().split('T')[0];
};

// Default Budget Template
const DEFAULT_BUDGETS = {
  Food: 500,
  Housing: 1600,
  Utilities: 250,
  Transport: 200,
  Entertainment: 150,
  Health: 100,
  Education: 150,
  Travel: 600,
  Shopping: 300,
  Miscellaneous: 150
};

// Initial Mock Seed Data
const SEED_DATA = {
  users: [
    { 
      email: 'admin@finsphere.com', 
      password: '23231', 
      name: 'Alex Mercer',
      phone: '+1 650-555-0190',
      bankName: 'FinSphere Digital Bank',
      accountNumber: '•••• •••• 9876',
      gpayPin: '23231',
      appLockPin: '8899',
      appLockEnabled: false,
      appLockType: 'number',
      patternSequence: ''
    }
  ],
  transactions: [
    { id: '1', userEmail: 'admin@finsphere.com', date: getRelativeDate(0), description: 'Payment received from Needhika', category: 'Salary', type: 'income', amount: 5000, address: 'Anna Salai, Chennai' },
    { id: '2', userEmail: 'admin@finsphere.com', date: getRelativeDate(1), description: 'Sent to Mounika', category: 'Food', type: 'expense', amount: 184.50, address: 'Anna Nagar, Chennai' },
    { id: '3', userEmail: 'admin@finsphere.com', date: getRelativeDate(2), description: 'Transfer to Manju', category: 'Housing', type: 'expense', amount: 1500, address: 'T. Nagar, Chennai' },
    { id: '4', userEmail: 'admin@finsphere.com', date: getRelativeDate(3), description: 'Paid to Abi', category: 'Utilities', type: 'expense', amount: 115.40, address: 'Velachery, Chennai' },
    { id: '5', userEmail: 'admin@finsphere.com', date: getRelativeDate(4), description: 'Freelance Pay from Karthik', category: 'Freelance', type: 'income', amount: 1200, address: 'OMR IT Corridor, Chennai' },
    { id: '6', userEmail: 'admin@finsphere.com', date: getRelativeDate(6), description: 'Dinner with Anitha', category: 'Food', type: 'expense', amount: 76.00, address: 'Nungambakkam, Chennai' },
    { id: '7', userEmail: 'admin@finsphere.com', date: getRelativeDate(8), description: 'Sent to Dhivya', category: 'Transport', type: 'expense', amount: 48.00, address: 'Adyar, Chennai' },
    { id: '8', userEmail: 'admin@finsphere.com', date: getRelativeDate(10), description: 'Transfer to Koushik', category: 'Entertainment', type: 'expense', amount: 15.49, address: 'Phoenix Marketcity, Velachery' },
    { id: '9', userEmail: 'admin@finsphere.com', date: getRelativeDate(12), description: 'Received from Priya', category: 'Investments', type: 'income', amount: 145.20, address: 'Guindy Financial Center, Chennai' },
    { id: '10', userEmail: 'admin@finsphere.com', date: getRelativeDate(14), description: 'Paid to Vignesh', category: 'Health', type: 'expense', amount: 60.00, address: 'Mylapore, Chennai' },
    { id: '11', userEmail: 'admin@finsphere.com', date: getRelativeDate(15), description: 'Course Fee to Needhika', category: 'Education', type: 'expense', amount: 24.99, address: 'Online Class Hub' },
    { id: '12', userEmail: 'admin@finsphere.com', date: getRelativeDate(18), description: 'Travel Trip with Mounika', category: 'Travel', type: 'expense', amount: 420.00, address: 'Chennai International Airport' },
    { id: '13', userEmail: 'admin@finsphere.com', date: getRelativeDate(20), description: 'Shopping with Manju', category: 'Shopping', type: 'expense', amount: 129.99, address: 'Express Avenue Mall, Royapettah' },
    { id: '14', userEmail: 'admin@finsphere.com', date: getRelativeDate(22), description: 'Coffee with Abi', category: 'Food', type: 'expense', amount: 12.50, address: 'ECR Beach Cafe, Chennai' }
  ],
  budgets: {
    'admin@finsphere.com': { ...DEFAULT_BUDGETS }
  },
  goals: [
    { id: 'g1', userEmail: 'admin@finsphere.com', name: 'Emergency Fund', target: 10000, current: 7500, color: '#10b981' },
    { id: 'g2', userEmail: 'admin@finsphere.com', name: 'Europe Vacation', target: 5000, current: 2200, color: '#6366f1' },
    { id: 'g3', userEmail: 'admin@finsphere.com', name: 'Next-Gen Gaming PC', target: 2000, current: 850, color: '#f59e0b' }
  ],
  rewards: [
    { id: 'r1', userEmail: 'admin@finsphere.com', rewardAmount: 5.50, isScratched: false, scratchedAt: null },
    { id: 'r2', userEmail: 'admin@finsphere.com', rewardAmount: 0.00, isScratched: false, scratchedAt: null, message: 'Better luck next time!' },
    { id: 'r3', userEmail: 'admin@finsphere.com', rewardAmount: 15.00, isScratched: false, scratchedAt: null }
  ]
};

// Database utility helpers
const readDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(SEED_DATA);
      return SEED_DATA;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // Safety migrations
    if (!parsed.users) parsed.users = SEED_DATA.users;
    if (!parsed.transactions) parsed.transactions = SEED_DATA.transactions;
    if (!parsed.budgets) parsed.budgets = SEED_DATA.budgets;
    if (!parsed.goals) parsed.goals = SEED_DATA.goals;
    if (!parsed.rewards) parsed.rewards = SEED_DATA.rewards;

    // Migrate existing users to have phone, bankName, accountNumber, age, and gpayPin
    parsed.users.forEach(u => {
      if (!u.phone) u.phone = '+1 650-555-0190';
      if (!u.bankName) u.bankName = 'FinSphere Digital Bank';
      if (!u.accountNumber) u.accountNumber = '•••• •••• 9876';
      if (!u.gpayPin) u.gpayPin = '23231';
      if (!u.appLockPin) u.appLockPin = '8899';
      if (!u.age) u.age = 28;
      if (u.appLockEnabled === undefined) u.appLockEnabled = false;
      if (!u.appLockType) u.appLockType = 'number';
      if (!u.patternSequence) u.patternSequence = '';
    });
    
    return parsed;
  } catch (err) {
    console.error('Error reading DB file:', err);
    return SEED_DATA;
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to DB file:', err);
  }
};

// AUTHENTICATION MIDDLEWARE WITH USER ISOLATION SUPPORT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'mock-jwt-token-xyz') {
      req.userEmail = 'admin@finsphere.com';
      next();
    } else if (token.startsWith('mock-token-')) {
      const email = token.substring(11);
      req.userEmail = email;
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized: Session invalid' });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized: Missing credentials' });
  }
};

// --- ROUTES ---

// 1. Auth Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  
  // Allow login by email or phone contact number
  const user = db.users.find(u => 
    (u.email.toLowerCase() === email.toLowerCase() || u.phone.replace(/\s+/g, '') === email.replace(/\s+/g, '')) && 
    u.password === password
  );

  if (user) {
    const token = user.email === 'admin@finsphere.com' ? 'mock-jwt-token-xyz' : `mock-token-${user.email}`;
    res.json({
      token: token,
      user: {
        email: user.email,
        name: user.name,
        age: user.age || 25,
        phone: user.phone || '',
        bankName: user.bankName || '',
        accountNumber: user.accountNumber || '',
        gpayPin: user.gpayPin || '23231',
        appLockPin: user.appLockPin || '8899',
        appLockEnabled: user.appLockEnabled || false,
        appLockType: user.appLockType || 'number',
        patternSequence: user.patternSequence || ''
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid contact details/email or password' });
  }
});

// 1.5 Auth Login via GPay PIN
app.post('/api/auth/login-pin', (req, res) => {
  const { email, gpayPin } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.gpayPin === gpayPin);

  if (user) {
    const token = email === 'admin@finsphere.com' ? 'mock-jwt-token-xyz' : `mock-token-${email}`;
    res.json({
      token: token,
      user: {
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        bankName: user.bankName || '',
        accountNumber: user.accountNumber || '',
        gpayPin: user.gpayPin || '23231'
      }
    });
  } else {
    res.status(401).json({ error: 'Incorrect 4-digit GPay App PIN' });
  }
});

// 1.8 Auth Unified OTP Login & Register
app.post('/api/auth/otp-login', (req, res) => {
  const { name, age, phone, bankName, accountNumber } = req.body;
  if (!phone || !name) {
    return res.status(400).json({ error: 'Name and Phone number are required' });
  }

  const db = readDB();
  
  // Find user by Phone Contact
  let user = db.users.find(u => u.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));
  let isNewUser = false;

  if (user) {
    // Existing user: update their details
    user.name = name;
    if (age) user.age = parseInt(age);
    if (bankName) user.bankName = bankName;
    if (accountNumber) user.accountNumber = accountNumber;
  } else {
    // New user registration
    isNewUser = true;
    const generatedEmail = `${phone.replace(/[^a-zA-Z0-9]/g, '')}@finsphere.com`;
    user = {
      email: generatedEmail,
      password: '23231', // default placeholder
      name: name,
      age: parseInt(age) || 25,
      phone: phone,
      bankName: bankName || 'FinSphere Digital Bank',
      accountNumber: accountNumber || '•••• •••• 9876',
      gpayPin: '23231' // default secure app PIN
    };
    db.users.push(user);

    // Initialize defaults for the new user profile
    db.budgets[generatedEmail] = { ...DEFAULT_BUDGETS };

    // Seed two starter goals
    db.goals.push(
      { id: `g_seed1_${Date.now()}`, userEmail: generatedEmail, name: 'Emergency Fund', target: 5000, current: 500, color: '#10b981' },
      { id: `g_seed2_${Date.now()}`, userEmail: generatedEmail, name: 'Personal Savings', target: 2000, current: 150, color: '#6366f1' }
    );

    // Seed starter transaction
    db.transactions.push(
      { id: `t_seed1_${Date.now()}`, userEmail: generatedEmail, date: getRelativeDate(0), description: 'Welcome Bonus', category: 'Other Income', type: 'income', amount: 650 }
    );

    // Seed starter rewards scratch cards
    db.rewards.push(
      { id: `r_seed1_${Date.now()}`, userEmail: generatedEmail, rewardAmount: 5.00, isScratched: false, scratchedAt: null },
      { id: `r_seed2_${Date.now()}`, userEmail: generatedEmail, rewardAmount: 0.00, isScratched: false, scratchedAt: null, message: 'Better luck next time!' }
    );
  }

  writeDB(db);

  const token = user.email === 'admin@finsphere.com' ? 'mock-jwt-token-xyz' : `mock-token-${user.email}`;

  res.status(isNewUser ? 201 : 200).json({
    token: token,
    user: {
      email: user.email,
      name: user.name,
      age: user.age,
      phone: user.phone,
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      gpayPin: user.gpayPin
    }
  });
});

// 2. Auth Register Endpoint
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, phone, bankName, accountNumber, gpayPin, age } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    if (existingUser.password === password) {
      // Passwords match — return logged in user session
      return res.status(200).json({
        token: `mock-token-${email}`,
        user: {
          email: existingUser.email,
          name: existingUser.name,
          age: existingUser.age,
          phone: existingUser.phone,
          bankName: existingUser.bankName,
          accountNumber: existingUser.accountNumber,
          gpayPin: existingUser.gpayPin
        }
      });
    } else {
      return res.status(400).json({ error: 'This email is already registered with a different password.' });
    }
  }

  const newUser = { 
    email, 
    password, 
    name, 
    age: parseInt(age) || 25,
    phone: phone || '',
    bankName: bankName || 'FinSphere Digital Bank',
    accountNumber: accountNumber || '•••• •••• 9876',
    gpayPin: gpayPin || '23231'
  };
  db.users.push(newUser);

  // Initialize isolated defaults for new user
  db.budgets[email] = { ...DEFAULT_BUDGETS };
  
  // Seed two starter goals
  db.goals.push(
    { id: `g_seed1_${Date.now()}`, userEmail: email, name: 'Emergency Fund', target: 5000, current: 500, color: '#10b981' },
    { id: `g_seed2_${Date.now()}`, userEmail: email, name: 'Personal Savings', target: 2000, current: 150, color: '#6366f1' }
  );

  // Seed starter transaction
  db.transactions.push(
    { id: `t_seed1_${Date.now()}`, userEmail: email, date: getRelativeDate(0), description: 'Welcome Bonus', category: 'Other Income', type: 'income', amount: 650 }
  );

  // Seed starter rewards scratch cards
  db.rewards.push(
    { id: `r_seed1_${Date.now()}`, userEmail: email, rewardAmount: 5.00, isScratched: false, scratchedAt: null },
    { id: `r_seed2_${Date.now()}`, userEmail: email, rewardAmount: 0.00, isScratched: false, scratchedAt: null, message: 'Better luck next time!' }
  );

  writeDB(db);

  res.status(201).json({
    token: `mock-token-${email}`,
    user: {
      email: newUser.email,
      name: newUser.name,
      age: newUser.age,
      phone: newUser.phone,
      bankName: newUser.bankName,
      accountNumber: newUser.accountNumber,
      gpayPin: newUser.gpayPin
    }
  });
});

// 2.5 Auth Update Profile Endpoint
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { email, password, name } = req.body;
  const db = readDB();
  
  const userIndex = db.users.findIndex(u => u.email.toLowerCase() === req.userEmail.toLowerCase());
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  const oldEmail = req.userEmail.toLowerCase();
  const newEmail = email ? email.toLowerCase() : oldEmail;

  // Check if new email is already taken by someone else
  if (newEmail !== oldEmail) {
    const exists = db.users.some(u => u.email.toLowerCase() === newEmail);
    if (exists) {
      return res.status(400).json({ error: 'Email ID already in use' });
    }

    // Migrate budgets key
    if (db.budgets[oldEmail]) {
      db.budgets[newEmail] = db.budgets[oldEmail];
      delete db.budgets[oldEmail];
    } else {
      db.budgets[newEmail] = { ...DEFAULT_BUDGETS };
    }

    // Migrate goals userEmail
    db.goals.forEach(g => {
      if (g.userEmail && g.userEmail.toLowerCase() === oldEmail) {
        g.userEmail = newEmail;
      }
    });

    // Migrate transactions userEmail
    db.transactions.forEach(t => {
      if (t.userEmail && t.userEmail.toLowerCase() === oldEmail) {
        t.userEmail = newEmail;
      }
    });
  }

  // Update user profile details
  const { phone, bankName, accountNumber, gpayPin, age } = req.body;
  db.users[userIndex].email = newEmail;
  if (password) db.users[userIndex].password = password;
  if (name) db.users[userIndex].name = name;
  if (phone) db.users[userIndex].phone = phone;
  if (bankName) db.users[userIndex].bankName = bankName;
  if (accountNumber) db.users[userIndex].accountNumber = accountNumber;
  if (gpayPin) db.users[userIndex].gpayPin = gpayPin;
  if (age) db.users[userIndex].age = parseInt(age);
  if (req.body.appLockEnabled !== undefined) db.users[userIndex].appLockEnabled = req.body.appLockEnabled;
  if (req.body.appLockType) db.users[userIndex].appLockType = req.body.appLockType;
  if (req.body.patternSequence !== undefined) db.users[userIndex].patternSequence = req.body.patternSequence;

  writeDB(db);

  // Generate new token reflecting updated email ID
  const newToken = newEmail === 'admin@finsphere.com' ? 'mock-jwt-token-xyz' : `mock-token-${newEmail}`;

  res.json({
    token: newToken,
    user: {
      email: newEmail,
      name: db.users[userIndex].name,
      age: db.users[userIndex].age || 25,
      phone: db.users[userIndex].phone || '',
      bankName: db.users[userIndex].bankName || '',
      accountNumber: db.users[userIndex].accountNumber || '',
      gpayPin: db.users[userIndex].gpayPin || '23231',
      appLockPin: db.users[userIndex].appLockPin || '8899',
      appLockEnabled: db.users[userIndex].appLockEnabled || false,
      appLockType: db.users[userIndex].appLockType || 'number',
      patternSequence: db.users[userIndex].patternSequence || ''
    }
  });
});


// 3. Transactions APIs (Isolated)
app.get('/api/transactions', authMiddleware, (req, res) => {
  const db = readDB();
  const myTxs = db.transactions.filter(t => t.userEmail === req.userEmail);
  res.json(myTxs);
});

app.post('/api/transactions', authMiddleware, (req, res) => {
  const db = readDB();
  const tx = {
    id: Date.now().toString(),
    userEmail: req.userEmail,
    description: req.body.description,
    category: req.body.category,
    type: req.body.type,
    amount: parseFloat(req.body.amount),
    date: req.body.date,
    address: req.body.address || 'Online Transaction'
  };

  db.transactions.unshift(tx);

  // GPay feature: 60% chance to earn a scratch card on payment transactions (expenses)
  let earnedRewardCard = null;
  if (tx.type === 'expense' && Math.random() < 0.60) {
    const isWin = Math.random() > 0.30; // 70% win chance
    const amount = isWin ? parseFloat((Math.random() * 4.5 + 0.5).toFixed(2)) : 0.00;
    
    earnedRewardCard = {
      id: `r_${Date.now()}`,
      userEmail: req.userEmail,
      rewardAmount: amount,
      isScratched: false,
      scratchedAt: null,
      ...(amount === 0 ? { message: 'Better luck next time!' } : {})
    };

    if (!db.rewards) db.rewards = [];
    db.rewards.push(earnedRewardCard);
  }

  writeDB(db);
  res.status(201).json({ ...tx, earnedRewardCard });
});

app.put('/api/transactions/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const index = db.transactions.findIndex(t => t.id === req.params.id && t.userEmail === req.userEmail);

  if (index !== -1) {
    db.transactions[index] = {
      id: req.params.id,
      userEmail: req.userEmail,
      description: req.body.description,
      category: req.body.category,
      type: req.body.type,
      amount: parseFloat(req.body.amount),
      date: req.body.date,
      address: req.body.address || db.transactions[index].address || 'Online Transaction'
    };
    writeDB(db);
    res.json(db.transactions[index]);
  } else {
    res.status(404).json({ error: 'Transaction not found or unauthorized' });
  }
});

app.delete('/api/transactions/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const initialLength = db.transactions.length;
  db.transactions = db.transactions.filter(t => !(t.id === req.params.id && t.userEmail === req.userEmail));

  if (db.transactions.length < initialLength) {
    writeDB(db);
    res.json({ success: true, message: 'Transaction deleted' });
  } else {
    res.status(404).json({ error: 'Transaction not found or unauthorized' });
  }
});

// 4. Budgets APIs (Isolated)
app.get('/api/budgets', authMiddleware, (req, res) => {
  const db = readDB();
  const myBudgets = db.budgets[req.userEmail] || DEFAULT_BUDGETS;
  res.json(myBudgets);
});

app.put('/api/budgets', authMiddleware, (req, res) => {
  const db = readDB();
  const { category, limit } = req.body;
  
  if (!db.budgets[req.userEmail]) {
    db.budgets[req.userEmail] = { ...DEFAULT_BUDGETS };
  }

  if (db.budgets[req.userEmail].hasOwnProperty(category)) {
    db.budgets[req.userEmail][category] = parseFloat(limit);
    writeDB(db);
    res.json({ success: true, budgets: db.budgets[req.userEmail] });
  } else {
    res.status(400).json({ error: 'Invalid budget category' });
  }
});

// 5. Savings Goals APIs (Isolated)
app.get('/api/goals', authMiddleware, (req, res) => {
  const db = readDB();
  const myGoals = db.goals.filter(g => g.userEmail === req.userEmail);
  res.json(myGoals);
});

app.post('/api/goals', authMiddleware, (req, res) => {
  const db = readDB();
  const goal = {
    id: Date.now().toString(),
    userEmail: req.userEmail,
    name: req.body.name,
    target: parseFloat(req.body.target),
    current: parseFloat(req.body.current || 0),
    color: req.body.color || '#3b82f6'
  };

  db.goals.push(goal);
  writeDB(db);
  res.status(201).json(goal);
});

app.put('/api/goals/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const index = db.goals.findIndex(g => g.id === req.params.id && g.userEmail === req.userEmail);

  if (index !== -1) {
    db.goals[index].current = parseFloat(req.body.current);
    writeDB(db);
    res.json(db.goals[index]);
  } else {
    res.status(404).json({ error: 'Goal not found or unauthorized' });
  }
});

app.delete('/api/goals/:id', authMiddleware, (req, res) => {
  const db = readDB();
  const initialLength = db.goals.length;
  db.goals = db.goals.filter(g => !(g.id === req.params.id && g.userEmail === req.userEmail));

  if (db.goals.length < initialLength) {
    writeDB(db);
    res.json({ success: true, message: 'Goal deleted' });
  } else {
    res.status(404).json({ error: 'Goal not found or unauthorized' });
  }
});

// 6. Rewards APIs (Isolated)
app.get('/api/rewards', authMiddleware, (req, res) => {
  const db = readDB();
  if (!db.rewards) db.rewards = [];
  const myRewards = db.rewards.filter(r => r.userEmail === req.userEmail);
  res.json(myRewards);
});

app.post('/api/rewards/claim/:id', authMiddleware, (req, res) => {
  const db = readDB();
  if (!db.rewards) db.rewards = [];
  const index = db.rewards.findIndex(r => r.id === req.params.id && r.userEmail === req.userEmail);

  if (index !== -1) {
    if (db.rewards[index].isScratched) {
      return res.status(400).json({ error: 'Reward already claimed' });
    }

    db.rewards[index].isScratched = true;
    db.rewards[index].scratchedAt = new Date().toISOString().split('T')[0];

    // If there is a cashback amount, create a transaction for it
    const amount = db.rewards[index].rewardAmount;
    if (amount > 0) {
      const cashbackTx = {
        id: `tx_reward_${Date.now()}`,
        userEmail: req.userEmail,
        description: 'GPay Cashback Reward',
        category: 'Other Income',
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0]
      };
      db.transactions.unshift(cashbackTx);
    }

    writeDB(db);
    res.json(db.rewards[index]);
  } else {
    res.status(404).json({ error: 'Reward card not found or unauthorized' });
  }
});

// Start Express
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  // Seed / read DB file
  readDB();
});
