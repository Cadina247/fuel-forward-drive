import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  FileText,
  AlertCircle,
  Banknote,
  Calculator
} from 'lucide-react';

interface SoftLoanScreenProps {
  onBack: () => void;
}

const SoftLoanScreen: React.FC<SoftLoanScreenProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    income: '',
    employment: '',
    phone: '',
    email: '',
    bvn: ''
  });

  const loanPackages = [
    {
      id: 'basic',
      name: 'Basic Fuel Loan',
      amount: '₦5,000 - ₦25,000',
      duration: '30 days',
      interest: '5%',
      description: 'Quick fuel financing for individuals'
    },
    {
      id: 'premium',
      name: 'Premium Fuel Loan',
      amount: '₦25,000 - ₦100,000',
      duration: '60 days',
      interest: '7%',
      description: 'Larger loans for businesses and frequent users'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Fuel Loan',
      amount: '₦100,000 - ₦500,000',
      duration: '90 days',
      interest: '10%',
      description: 'Corporate fuel financing solutions'
    }
  ];

  const calculateRepayment = (amount: number, interest: number) => {
    return amount + (amount * interest / 100);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (currentStep === 1) {
    return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Fuel Soft Loan</h1>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step 1 of 3</span>
            <span>Choose Package</span>
          </div>
          <Progress value={33} className="h-2" />
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Banknote className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-green-800">Quick Fuel Financing</h3>
              <p className="text-sm text-green-700 mt-1">
                Get instant access to fuel with our soft loan program. 
                No collateral required, fast approval process.
              </p>
            </div>
          </div>
        </Card>

        {/* Loan Packages */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select Loan Package</h2>
          {loanPackages.map((pkg) => (
            <Card key={pkg.id} className="p-4 hover:shadow-soft transition-all cursor-pointer border-2 hover:border-primary/50">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{pkg.amount}</div>
                    <div className="text-sm text-muted-foreground">{pkg.duration}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Interest Rate: <span className="font-semibold">{pkg.interest}</span></span>
                  <Button variant="outline" size="sm" onClick={nextStep}>
                    Select Package
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Why Choose Our Soft Loan?</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">No collateral required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Fast approval (within 2 hours)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Flexible repayment terms</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Direct fuel credit to wallet</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={prevStep}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Loan Application</h1>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step 2 of 3</span>
            <span>Application Form</span>
          </div>
          <Progress value={66} className="h-2" />
        </div>

        {/* Application Form */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Loan Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Loan Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10,000"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="purpose">Purpose of Loan</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe why you need this loan..."
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="income">Monthly Income (₦)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="150,000"
                  value={formData.income}
                  onChange={(e) => handleInputChange('income', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="employment">Employment Status</Label>
                <Input
                  id="employment"
                  placeholder="Full-time Employee"
                  value={formData.employment}
                  onChange={(e) => handleInputChange('employment', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+234 801 234 5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bvn">BVN (Bank Verification Number)</Label>
                <Input
                  id="bvn"
                  placeholder="12345678901"
                  value={formData.bvn}
                  onChange={(e) => handleInputChange('bvn', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Loan Calculator */}
          {formData.amount && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Loan Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Loan Amount:</span>
                  <span className="font-semibold">₦{parseInt(formData.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest (5%):</span>
                  <span>₦{(parseInt(formData.amount) * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-blue-800">
                  <span>Total Repayment:</span>
                  <span>₦{calculateRepayment(parseInt(formData.amount), 5).toLocaleString()}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Button variant="energy" size="lg" className="w-full" onClick={nextStep}>
          Continue to Review
        </Button>
      </div>
    );
  }

  // Step 3 - Review and Submit
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={prevStep}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Review Application</h1>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 3 of 3</span>
          <span>Review & Submit</span>
        </div>
        <Progress value={100} className="h-2" />
      </div>

      {/* Review Summary */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Application Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Loan Amount:</span>
            <span className="font-semibold">₦{parseInt(formData.amount || '0').toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Income:</span>
            <span>₦{parseInt(formData.income || '0').toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Employment:</span>
            <span>{formData.employment}</span>
          </div>
          <div className="flex justify-between">
            <span>Repayment Amount:</span>
            <span className="font-semibold text-primary">
              ₦{calculateRepayment(parseInt(formData.amount || '0'), 5).toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Documents Required */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <FileText className="h-6 w-6 text-yellow-600 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-800">Documents Required</h3>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• Valid government-issued ID</li>
              <li>• Bank statement (last 3 months)</li>
              <li>• Proof of income/employment</li>
              <li>• Utility bill (proof of address)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Terms and Conditions */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-1" />
          <div className="text-sm">
            <p className="mb-2">By submitting this application, you agree to:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Our terms and conditions</li>
              <li>• Credit check and verification process</li>
              <li>• Repayment schedule as agreed</li>
              <li>• Late payment fees if applicable</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <Button variant="fuel" size="xl" className="w-full">
        <FileText className="h-5 w-5 mr-2" />
        Submit Application
      </Button>

      {/* Processing Time */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Processing time: 1-2 hours</span>
        </div>
      </div>
    </div>
  );
};

export default SoftLoanScreen;