"use client";

import { MainLayout } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Wallet,
  Users,
  Clock,
  Building2,
  Vote,
  Shield,
  DollarSign,
  ArrowRight,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const faqCategories = [
  {
    title: "Getting Started",
    icon: <HelpCircle className="h-5 w-5" />,
    questions: [
      {
        question: "How do I get started on The Village platform?",
        answer: (
          <div className="space-y-2">
            <p>Getting started is easy! Follow these steps:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Connect your wallet (Petra, Nightly, or Privy)</li>
              <li>Request membership by selecting your role</li>
              <li>Wait for admin approval</li>
              <li>Start logging volunteer hours or contributing to projects</li>
            </ol>
            <Link href="/membership/request">
              <Button variant="outline" size="sm" className="mt-2">
                Request Membership
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        ),
      },
      {
        question: "Which wallet should I use?",
        answer: (
          <div className="space-y-2">
            <p>We support multiple wallet options:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Privy Wallet</strong> (Recommended): Email login, no installation needed, natively supports Movement Network
              </li>
              <li>
                <strong>Petra Wallet</strong>: Browser extension, requires manual Movement Network configuration
              </li>
              <li>
                <strong>Nightly Wallet</strong>: Browser extension, requires manual Movement Network configuration
              </li>
            </ul>
            <p className="text-sm text-text-muted mt-2">
              For the best experience, we recommend using Privy wallet as it works seamlessly with Movement Network without any configuration.
            </p>
          </div>
        ),
      },
      {
        question: "What are Time Dollars?",
        answer: (
          <div className="space-y-2">
            <p>
              Time Dollars are tokens that represent verified volunteer hours. For every approved hour of community service, you receive 1 Time Dollar.
            </p>
            <p>
              You can use Time Dollars to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Invest in community projects</li>
              <li>Stake in investment pools to earn rewards</li>
              <li>Transfer to other community members</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    title: "Membership & Roles",
    icon: <Users className="h-5 w-5" />,
    questions: [
      {
        question: "What are the different member roles?",
        answer: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Admin</Badge>
                <span className="text-sm">Full platform access and management</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Investor/Contributor</Badge>
                <span className="text-sm">Deposit funds, invest in projects, earn returns</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">Project Initiator</Badge>
                <span className="text-sm">Create projects, apply for loans, receive funding</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Validator/Staff</Badge>
                <span className="text-sm">Approve volunteer hours, validate requests</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        question: "How long does membership approval take?",
        answer: (
          <p>
            Membership requests are typically reviewed within 1-3 business days. You&apos;ll be able to see your request status in your dashboard. Once approved, you&apos;ll receive a notification and can start using all platform features.
          </p>
        ),
      },
      {
        question: "Can I change my role after joining?",
        answer: (
          <p>
            Role changes require admin approval. If you need to change your role, please contact an administrator through the platform or reach out to your community coordinator.
          </p>
        ),
      },
    ],
  },
  {
    title: "Volunteer Hours & Time Dollars",
    icon: <Clock className="h-5 w-5" />,
    questions: [
      {
        question: "How do I log volunteer hours?",
        answer: (
          <div className="space-y-2">
            <p>To log volunteer hours:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to the &quot;Log Hours&quot; page</li>
              <li>Select the activity type (Tutoring, Community Service, etc.)</li>
              <li>Enter the number of hours</li>
              <li>Submit your request</li>
              <li>Wait for validator approval</li>
            </ol>
            <p className="text-sm text-text-muted mt-2">
              Once approved, Time Dollars will be automatically minted to your account.
            </p>
            <Link href="/volunteer/log-hours">
              <Button variant="outline" size="sm" className="mt-2">
                Log Hours Now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        ),
      },
      {
        question: "How long does approval take?",
        answer: (
          <p>
            Volunteer hour requests are typically reviewed within 24-48 hours by validators or staff members. You can check the status of your requests in your dashboard.
          </p>
        ),
      },
      {
        question: "What activities qualify for Time Dollars?",
        answer: (
          <div className="space-y-2">
            <p>Qualifying activities include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Tutoring and academic support</li>
              <li>Mentoring and youth guidance</li>
              <li>Community service projects</li>
              <li>Home repair and maintenance</li>
              <li>Food distribution</li>
              <li>Transportation assistance</li>
              <li>Administrative support</li>
              <li>Event support</li>
            </ul>
            <p className="text-sm text-text-muted mt-2">
              All activities must be verified by a validator before Time Dollars are minted.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Projects & Investments",
    icon: <Building2 className="h-5 w-5" />,
    questions: [
      {
        question: "How do I contribute to a project?",
        answer: (
          <div className="space-y-2">
            <p>You can contribute to projects in two ways:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong>With Time Dollars:</strong> Use your earned Time Dollars to invest in projects</li>
              <li><strong>With MOV tokens:</strong> Deposit MOV tokens to the treasury and invest in projects</li>
            </ol>
            <p className="text-sm text-text-muted mt-2">
              Each contribution earns you fractional shares in the project, representing your stake in the project&apos;s success.
            </p>
            <Link href="/projects">
              <Button variant="outline" size="sm" className="mt-2">
                Browse Projects
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        ),
      },
      {
        question: "What are fractional shares?",
        answer: (
          <p>
            Fractional shares represent your ownership stake in a community project. When you contribute Time Dollars or MOV tokens to a project, you receive shares proportional to your contribution. These shares can appreciate in value as the project succeeds.
          </p>
        ),
      },
      {
        question: "How do I create a new project?",
        answer: (
          <div className="space-y-2">
            <p>
              To create a new project, you need to be a registered member with the &quot;Project Initiator&quot; (Borrower) role. Once you have this role:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Submit a project proposal through the platform</li>
              <li>Set funding goals and project milestones</li>
              <li>Wait for community approval through governance</li>
              <li>Start receiving contributions once approved</li>
            </ol>
            <p className="text-sm text-text-muted mt-2">
              Contact an administrator if you need the Project Initiator role.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Governance & Voting",
    icon: <Vote className="h-5 w-5" />,
    questions: [
      {
        question: "How does governance work?",
        answer: (
          <div className="space-y-2">
            <p>
              The Village uses on-chain governance where members can create and vote on proposals. Proposals can cover:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>New project approvals</li>
              <li>Platform parameter changes</li>
              <li>Community policy updates</li>
              <li>Fund allocation decisions</li>
            </ul>
            <p className="text-sm text-text-muted mt-2">
              Voting uses different mechanisms including simple majority, token-weighted, and quadratic voting depending on the proposal type.
            </p>
            <Link href="/governance">
              <Button variant="outline" size="sm" className="mt-2">
                View Proposals
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        ),
      },
      {
        question: "Who can create proposals?",
        answer: (
          <p>
            Any registered member can create a governance proposal. However, proposals require a certain threshold of votes to pass, ensuring community consensus on important decisions.
          </p>
        ),
      },
    ],
  },
  {
    title: "KYC & Compliance",
    icon: <Shield className="h-5 w-5" />,
    questions: [
      {
        question: "What is KYC and why do I need it?",
        answer: (
          <div className="space-y-2">
            <p>
              KYC (Know Your Customer) verification is required for certain financial operations on the platform, such as:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Depositing funds to the treasury</li>
              <li>Investing in projects with MOV tokens</li>
              <li>Receiving loans or large withdrawals</li>
            </ul>
            <p className="text-sm text-text-muted mt-2">
              KYC helps ensure platform security and regulatory compliance. Basic volunteer activities and Time Dollar operations don&apos;t require KYC.
            </p>
            <p className="text-sm font-medium mt-2">
              To get KYC verified, contact an administrator who can whitelist your address after verification.
            </p>
          </div>
        ),
      },
      {
        question: "How do I check my KYC status?",
        answer: (
          <p>
            Your KYC status is automatically checked when you attempt financial operations. If you&apos;re not whitelisted, you&apos;ll see a message directing you to contact an administrator. Admins can view and manage KYC status in the admin panel.
          </p>
        ),
      },
    ],
  },
  {
    title: "Troubleshooting",
    icon: <HelpCircle className="h-5 w-5" />,
    questions: [
      {
        question: "My transaction failed. What should I do?",
        answer: (
          <div className="space-y-2">
            <p>If a transaction fails, try these steps:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Check the error message - it will provide specific guidance</li>
              <li>Ensure you have sufficient balance for gas fees</li>
              <li>Verify you&apos;re a registered member (if required)</li>
              <li>Check if you need KYC verification</li>
              <li>Try refreshing the page and retrying</li>
            </ol>
            <p className="text-sm text-text-muted mt-2">
              All successful transactions include a link to view them on the blockchain explorer.
            </p>
          </div>
        ),
      },
      {
        question: "I&apos;m getting network errors with my wallet",
        answer: (
          <div className="space-y-2">
            <p>
              If you&apos;re using Petra or Nightly wallet and getting network errors, this is because these wallets require manual configuration for Movement Network. Solutions:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Recommended:</strong> Use Privy wallet (email login) which natively supports Movement Network
              </li>
              <li>Configure your wallet for Movement Network manually in wallet settings</li>
              <li>The system will automatically try Privy as a fallback if available</li>
            </ul>
            <a
              href="https://faucet.testnet.movementnetwork.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              Get Test Tokens
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ),
      },
      {
        question: "How do I get test tokens?",
        answer: (
          <div className="space-y-2">
            <p>
              For Movement Network testnet, you can get test tokens from the faucet:
            </p>
            <a
              href="https://faucet.testnet.movementnetwork.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Button variant="outline" size="sm">
                Visit Faucet
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </a>
            <p className="text-sm text-text-muted mt-2">
              Test tokens are needed for transaction fees (gas) on the blockchain.
            </p>
          </div>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Help & FAQ</h1>
          <p className="text-text-muted">
            Find answers to common questions about The Village platform
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-4 gap-4">
          <Link href="/membership/request">
            <Card hoverable className="h-full">
              <CardContent className="flex flex-col items-center text-center p-6">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Get Started</h3>
                <p className="text-sm text-text-muted">Request membership</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/volunteer/log-hours">
            <Card hoverable className="h-full">
              <CardContent className="flex flex-col items-center text-center p-6">
                <Clock className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Log Hours</h3>
                <p className="text-sm text-text-muted">Submit volunteer hours</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/projects">
            <Card hoverable className="h-full">
              <CardContent className="flex flex-col items-center text-center p-6">
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Browse Projects</h3>
                <p className="text-sm text-text-muted">Find projects to support</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/governance">
            <Card hoverable className="h-full">
              <CardContent className="flex flex-col items-center text-center p-6">
                <Vote className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Governance</h3>
                <p className="text-sm text-text-muted">Vote on proposals</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {faqCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.icon}
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-text-muted">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
            <CardDescription>
              Links to external resources and documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="https://explorer.movementnetwork.xyz/?network=bardock+testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Blockchain Explorer</p>
                  <p className="text-sm text-text-muted">View transactions on Movement Network</p>
                </div>
              </a>
              <a
                href="https://faucet.testnet.movementnetwork.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Testnet Faucet</p>
                  <p className="text-sm text-text-muted">Get test tokens for transactions</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Still Need Help?</h3>
            <p className="text-text-muted mb-4">
              If you can&apos;t find the answer you&apos;re looking for, contact your community administrator or reach out through your community coordinator.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline">Return Home</Button>
              </Link>
              <Link href="/volunteer/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
