import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { 
  FaCreditCard, FaHistory, FaMoneyBillWave, FaCheckCircle, 
  FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal, FaUniversity,
  FaApplePay, FaGooglePay
} from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe with public key (using test key for now)
const stripePromise = loadStripe('pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// Card Payment Form Component
const CardPaymentForm = ({ amount, onSuccess, onError, processing, setProcessing }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setCardError('Stripe not initialized');
      return;
    }

    if (!cardComplete) {
      setCardError('Please enter complete card details');
      return;
    }

    setProcessing(true);
    
    try {
      const response = await api.post('/payments/create-intent', { 
        amount: parseFloat(amount) 
      });
      
      const { clientSecret } = response.data;
      
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Customer',
          },
        }
      });
      
      if (result.error) {
        setCardError(result.error.message);
        onError(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          const confirmResponse = await api.post('/payments/confirm', {
            amount: parseFloat(amount),
            paymentMethod: 'credit_card',
            transactionId: result.paymentIntent.id,
            description: `Payment of $${amount} via Credit Card`
          });
          
          if (confirmResponse.data.success) {
            onSuccess(confirmResponse.data.payment);
          }
        }
      }
    } catch (error) {
      console.error('Payment failed:', error);
      onError(error.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <p className="text-red-500 text-xs mt-1">{cardError}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-3 text-xs text-gray-500">
        <FaCcVisa className="text-blue-600 text-xl" />
        <FaCcMastercard className="text-orange-600 text-xl" />
        <FaCcAmex className="text-blue-400 text-xl" />
        <span>We accept all major credit cards</span>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || !cardComplete || processing}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        {processing ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          <>
            <FaCreditCard />
            <span>Pay ${parseFloat(amount).toFixed(2)} with Card</span>
          </>
        )}
      </button>
    </form>
  );
};

// Main Payments Component
const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState(99.99);
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankAccount, setBankAccount] = useState({
    accountNumber: '',
    routingNumber: '',
    accountName: ''
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments/my-payments');
      setPayments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment) => {
    setLastPayment(payment);
    setShowSuccess(true);
    fetchPayments();
    setTimeout(() => setShowSuccess(false), 5000);
    alert(`✅ Payment successful! Amount: $${payment.amount} via ${getMethodName(selectedMethod)}`);
    setAmount(99.99);
    setPaypalEmail('');
    setBankAccount({ accountNumber: '', routingNumber: '', accountName: '' });
  };

  const handlePaymentError = (error) => {
    alert('Payment failed: ' + error);
  };

  const getMethodName = (method) => {
    switch(method) {
      case 'credit_card': return 'Credit Card';
      case 'paypal': return 'PayPal';
      case 'bank_transfer': return 'Bank Transfer';
      default: return 'Unknown';
    }
  };

  const processPayment = async () => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Validate based on payment method
    if (selectedMethod === 'paypal' && !paypalEmail) {
      alert('Please enter your PayPal email');
      return;
    }

    if (selectedMethod === 'bank_transfer') {
      if (!bankAccount.accountNumber || !bankAccount.routingNumber || !bankAccount.accountName) {
        alert('Please enter complete bank account details');
        return;
      }
    }

    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await api.post('/payments/confirm', {
        amount: parseFloat(amount),
        paymentMethod: selectedMethod,
        description: `Payment of $${amount} via ${getMethodName(selectedMethod)}`,
        details: selectedMethod === 'paypal' ? { email: paypalEmail } : 
                 selectedMethod === 'bank_transfer' ? bankAccount : {}
      });
      
      if (response.data.success) {
        handlePaymentSuccess(response.data.payment);
      }
    } catch (error) {
      handlePaymentError(error.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const calculateTotalSpent = () => {
    if (!Array.isArray(payments)) return 0;
    const completedPayments = payments.filter(p => p.status === 'completed');
    if (completedPayments.length === 0) return 0;
    const total = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    return total;
  };

  const totalSpent = calculateTotalSpent();
  const completedCount = Array.isArray(payments) ? payments.filter(p => p.status === 'completed').length : 0;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Payments</h1>

          {showSuccess && lastPayment && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <FaCheckCircle className="mr-2" />
                <span>Payment of ${lastPayment.amount} completed successfully!</span>
              </div>
              <button onClick={() => setShowSuccess(false)} className="text-green-700">×</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Make Payment Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <FaMoneyBillWave className="text-green-500 text-2xl" />
                  <h2 className="text-xl font-semibold">Make a Payment</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.01"
                      min="0.01"
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('credit_card')}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition ${
                          selectedMethod === 'credit_card'
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <FaCreditCard className="text-blue-600 text-2xl" />
                        <span className="text-sm font-medium">Credit Card</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('paypal')}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition ${
                          selectedMethod === 'paypal'
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <FaPaypal className="text-blue-600 text-2xl" />
                        <span className="text-sm font-medium">PayPal</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('bank_transfer')}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition ${
                          selectedMethod === 'bank_transfer'
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <FaUniversity className="text-blue-600 text-2xl" />
                        <span className="text-sm font-medium">Bank Transfer</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Specific Forms */}
                  {selectedMethod === 'credit_card' && (
                    <Elements stripe={stripePromise}>
                      <CardPaymentForm
                        amount={amount}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        processing={processing}
                        setProcessing={setProcessing}
                      />
                    </Elements>
                  )}

                  {selectedMethod === 'paypal' && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PayPal Email Address
                        </label>
                        <input
                          type="email"
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          placeholder="your-email@paypal.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={processPayment}
                        disabled={processing}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {processing ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <FaPaypal />
                            <span>Pay ${amount.toFixed(2)} with PayPal</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {selectedMethod === 'bank_transfer' && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={bankAccount.accountName}
                          onChange={(e) => setBankAccount({...bankAccount, accountName: e.target.value})}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={bankAccount.accountNumber}
                          onChange={(e) => setBankAccount({...bankAccount, accountNumber: e.target.value})}
                          placeholder="1234567890"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Routing Number
                        </label>
                        <input
                          type="text"
                          value={bankAccount.routingNumber}
                          onChange={(e) => setBankAccount({...bankAccount, routingNumber: e.target.value})}
                          placeholder="021000021"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={processPayment}
                        disabled={processing}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {processing ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <FaUniversity />
                            <span>Pay ${amount.toFixed(2)} via Bank Transfer</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Quick Amount Buttons */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-3">Quick Amounts:</p>
                    <div className="flex flex-wrap gap-3">
                      {[9.99, 49.99, 99.99, 199.99].map((presetAmount) => (
                        <button
                          key={presetAmount}
                          onClick={() => setAmount(presetAmount)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          ${presetAmount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <FaCcVisa className="text-blue-600 text-2xl mb-2" />
                  <p className="text-xs text-blue-800">Test Card: 4242 4242 4242 4242</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <FaPaypal className="text-blue-600 text-2xl mb-2" />
                  <p className="text-xs text-blue-800">Use any PayPal email for test</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <FaUniversity className="text-blue-600 text-2xl mb-2" />
                  <p className="text-xs text-blue-800">Any bank details work in test mode</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <FaHistory className="text-blue-500 text-2xl" />
                  <h2 className="text-xl font-semibold">Payment History</h2>
                </div>

                {loading ? (
                  <p className="text-gray-500 text-center py-8">Loading payments...</p>
                ) : !Array.isArray(payments) || payments.length === 0 ? (
                  <div className="text-center py-8">
                    <FaCreditCard className="text-gray-300 text-4xl mx-auto mb-3" />
                    <p className="text-gray-500">No payments yet</p>
                    <p className="text-sm text-gray-400">Make your first payment above</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-lg">
                              ${payment.amount ? parseFloat(payment.amount).toFixed(2) : '0.00'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(payment.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              payment.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status || 'pending'}
                            </span>
                            <p className="text-xs text-gray-400 mt-1 capitalize">
                              {payment.payment_method?.replace('_', ' ') || 'card'}
                            </p>
                          </div>
                        </div>
                        {payment.transaction_id && (
                          <p className="text-xs text-gray-400 font-mono">
                            ID: {payment.transaction_id.slice(-8)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 mt-6 text-white">
                <h3 className="text-sm font-semibold mb-2">Total Spent</h3>
                <p className="text-3xl font-bold">
                  ${totalSpent.toFixed(2)}
                </p>
                <p className="text-xs mt-2 opacity-75">
                  Across {completedCount} completed transactions
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Payments;