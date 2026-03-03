import React from 'react';
import { MinimalHeader } from '../components/MinimalHeader';

const ChildSafety: React.FC = () => {
  const lastUpdated = "March 3, 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      <MinimalHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Child Safety Policy
          </h1>
          
          <p className="text-gray-600 mb-6">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-gray max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <p className="text-gray-600 mb-4">
                At Pairfect, we are committed to creating a safe environment for all users. 
                This Child Safety Policy explains our approach to protecting minors and ensuring 
                that our platform remains exclusively for adults aged 18 and above.
              </p>
            </section>

            {/* Age Requirements */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Age Requirements</h2>
              <p className="text-gray-600 mb-4">
                Pairfect is strictly intended for adults aged 18 years and older. We do not permit 
                minors to create accounts or use our service under any circumstances.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">Strict Age Policy</h3>
                <ul className="list-disc pl-6 space-y-2 text-red-700">
                  <li>Users must be at least 18 years old to create an account</li>
                  <li>Age verification is required during registration</li>
                  <li>False age information will result in immediate account termination</li>
                  <li>Parents/guardians cannot create accounts on behalf of minors</li>
                </ul>
              </div>
            </section>

            {/* Prevention Measures */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Prevention Measures</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">During Registration</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Age verification through date of birth confirmation</li>
                <li>Clear age requirement disclosure before account creation</li>
                <li>Terms of Service agreement acknowledging age requirements</li>
                <li>Automated age verification systems where applicable</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Ongoing Monitoring</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Regular profile reviews for age inconsistencies</li>
                <li>User reporting systems for suspected underage users</li>
                <li>AI-powered content moderation for age-appropriate content</li>
                <li>Manual review of reported accounts</li>
              </ul>
            </section>

            {/* For Parents and Guardians */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">For Parents and Guardians</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">How to Protect Your Child</h3>
                <ul className="list-disc pl-6 space-y-2 text-blue-700">
                  <li>Educate children about online safety and dating app risks</li>
                  <li>Monitor your child's online activities and app usage</li>
                  <li>Use parental controls on devices</li>
                  <li>Have open conversations about appropriate online behavior</li>
                  <li>Report any suspicious accounts immediately</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Warning Signs</h3>
              <p className="text-gray-600 mb-4">
                Be alert if your child shows signs of using adult dating apps:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Unusual secrecy about phone or computer usage</li>
                <li>Multiple dating apps installed on devices</li>
                <li>Receiving inappropriate messages or content</li>
                <li>Unexplained meetings with online contacts</li>
                <li>Changes in behavior or school performance</li>
              </ul>
            </section>

            {/* Reporting Mechanisms */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Reporting Underage Users</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">How to Report</h3>
              <p className="text-gray-600 mb-4">
                If you suspect someone underage is using Pairfect, please report immediately:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@pairfect.com<br />
                  <strong>Subject:</strong> Underage User Report<br />
                  <strong>Include:</strong> Username, profile details, and reason for concern
                </p>
              </div>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Our Response</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Immediate investigation of all reports</li>
                <li>Temporary suspension pending verification</li>
                <li>Permanent account termination if underage confirmed</li>
                <li>Report to appropriate authorities if necessary</li>
                <li>Follow-up with reporting party</li>
              </ul>
            </section>

            {/* Educational Resources */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Educational Resources</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">For Teens</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Understanding online dating risks and dangers</li>
                <li>Recognizing grooming and predatory behavior</li>
                <li>Safe online communication practices</li>
                <li>Importance of waiting until legal age for dating apps</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">For Parents</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Digital parenting best practices</li>
                <li>Online safety education resources</li>
                <li>Recognizing warning signs of online exploitation</li>
                <li>How to report online safety concerns</li>
              </ul>
            </section>

            {/* Legal Compliance */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Legal Compliance</h2>
              <p className="text-gray-600 mb-4">
                Pairfect complies with all applicable laws and regulations regarding child protection, 
                including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Children's Online Privacy Protection Act (COPPA)</li>
                <li>Child Online Protection Act (COPA)</li>
                <li>International child protection laws</li>
                <li>Mandatory reporting requirements</li>
              </ul>
            </section>

            {/* Technology and Safety Features */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Safety Features</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Automated Protection</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Age verification systems</li>
                <li>Content filtering and moderation</li>
                <li>Behavioral analysis for suspicious patterns</li>
                <li>Automated blocking of inappropriate content</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">User Controls</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Block and report functionality</li>
                <li>Privacy settings control</li>
                <li>Content sharing preferences</li>
                <li>Interaction filters</li>
              </ul>
            </section>

            {/* Partnership with Authorities */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Partnership with Authorities</h2>
              <p className="text-gray-600 mb-4">
                Pairfect actively collaborates with law enforcement, child protection agencies, 
                and safety organizations to maintain a secure platform. We:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Cooperate fully with law enforcement investigations</li>
                <li>Share information with child protection agencies when required</li>
                <li>Participate in industry safety initiatives</li>
                <li>Regular consultation with child safety experts</li>
              </ul>
            </section>

            {/* Contact for Safety Concerns */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Safety Concerns</h2>
              <p className="text-gray-600 mb-4">
                For immediate safety concerns or reports involving minors, contact us:
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Urgent Safety Report:</strong> support@pairfect.com<br />
                  <strong>General Inquiries:</strong> support@pairfect.com
                </p>
              </div>
              
              <p className="text-gray-600 mt-4">
                For emergency situations involving immediate danger to a child, 
                contact your local law enforcement or child protective services immediately.
              </p>
            </section>

            {/* Policy Updates */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Policy Updates</h2>
              <p className="text-gray-600">
                This Child Safety Policy may be updated periodically to reflect new safety measures, 
                legal requirements, or industry best practices. Changes will be posted on this page 
                with an updated "Last updated" date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildSafety;
