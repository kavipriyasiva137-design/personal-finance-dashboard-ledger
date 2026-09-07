import React, { useState } from 'react';
import { Modal } from './Modal';
import { useFinance } from '../context/FinanceContext';
import { sendMoney, type PaymentRequest } from '../api/mockPayments';

interface SendPaymentProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendPayment: React.FC<SendPaymentProps> = ({ isOpen, onClose }) => {
  const { addTransaction, categories } = useFinance();

  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories.find(c => c !== 'Salary' && c !== 'Freelance') || 'Other');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();    
    setError('');
    const val = parseFloat(amount);
    if (!recipient.trim() || !phone.trim()) {
      setError('Recipient name and phone are required.');
      return;
    }
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setLoading(true);
    const req: PaymentRequest = { recipient: recipient.trim(), phone: phone.trim(), amount: val, category, note };
    try {
      const res = await sendMoney(req);
      if (!res.success) {
        setError(res.error || 'Payment failed');
        setLoading(false);
        return;
      }
      // Add resulting transaction to context
      if (res.transaction) addTransaction(res.transaction);
      alert(`Payment of ₹${val.toFixed(2)} sent to ${recipient} via GPay (simulated).`);
      onClose();
      setRecipient('');
      setPhone('');
      setAmount('');
      setNote('');
    } catch {
      setError('Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Send (GPay)">
      <form onSubmit={handleSend} className="send-payment-form">
        {error && <div className="form-alert alert-error">{error}</div>}
        {loading && <div className="form-alert alert-info">Processing payment...</div>}
        <div className="form-field">
          <label>Recipient Name</label>
          <input value={recipient} onChange={e => setRecipient(e.target.value)} />
        </div>

        <div className="form-field">
          <label>Phone / UPI</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        <div className="form-field">
          <label>Amount (INR)</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>

        <div className="form-field">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Send</button>
        </div>
      </form>
    </Modal>
  );
};
export default SendPayment;