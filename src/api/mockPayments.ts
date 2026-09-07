import { Lollipop } from 'lucide-react';

export type PaymentRequest = {
  recipient: string;
  phone: string;
  amount: number;
  category: string;
  note?: string;
};

export type PaymentResponse = {
  success: boolean;
  error?: string;
  transaction?: Omit<import('../types').Transaction, 'id'>;
};

// Simulate a network payment call with random success/failure
export const sendMoney = async (req: PaymentRequest): Promise<PaymentResponse> => {
  // simulate network delay
  await new Promise(res => setTimeout(res, 1200));


  // basic validation
  if (!req.recipient || !req.phone || !req.amount || req.amount <= 0) {
    return { success: false, error: 'Invalid payment details' };
  }

  // simulate occasional failure
  const failChance = Math.random();
  if (failChance < 0.08) {
    return { success: false, error: 'Network error. Please try again.' };
  }

  const tx: Omit<import('../types').Transaction, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    description: `Sent to ${req.recipient} via GPay`,
    amount: req.amount,
    type: 'expense',
    category: req.category,
    note: req.note || undefined,
    paymentMethod: 'gpay',
    transferType: 'send',
    personName: req.recipient,
    status: 'completed'
  };

  return { success: true, transaction: tx };       
};