import React from "react";

const sections = [
  {
    title: "1. Introduction",
    content: `Welcome to Taskme. By using our platform, you agree to these Terms of Policy. Please read them carefully before proceeding.`
  },
  {
    title: "2. User Responsibilities",
    content: `You are responsible for maintaining the confidentiality of your account and password. You agree not to misuse the platform or attempt unauthorized access.`
  },
  {
    title: "3. Privacy",
    content: `We respect your privacy. Your data is handled according to our Privacy Policy. We do not share your personal information without consent.`
  },
  {
    title: "4. Intellectual Property",
    content: `All content, trademarks, and data on Taskme are the property of their respective owners. You may not copy or reuse content without permission.`
  },
  {
    title: "5. Changes to Terms",
    content: `We may update these terms from time to time. Continued use of Taskme means you accept any changes.`
  },
  {
    title: "6. Contact",
    content: `If you have questions about these terms, please contact us at support@taskme.com.`
  }
];

const TermsofPolicy = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
    <div className="max-w-2xl w-full bg-gray3 rounded-2xl shadow-2xl border border-gray4 p-8 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-pink2/30 to-transparent pointer-events-none rounded-t-2xl" />
      <h1 className="text-4xl font-bold text-pink2 mb-6 text-center font-radioCanada drop-shadow">Terms of Policy</h1>
      <div className="space-y-8 text-white2 text-base leading-relaxed z-10 relative">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-xl font-semibold text-pink mb-2">{section.title}</h2>
            <p className="text-white2">{section.content}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <a
          href="/register"
          className="inline-block px-6 py-2 rounded-lg bg-pink2 text-white font-bold shadow hover:bg-pink transition"
        >
          Back to Register
        </a>
      </div>
    </div>
  </div>
);

export default TermsofPolicy;
