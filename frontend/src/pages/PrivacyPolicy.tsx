import React from 'react';
import { MinimalHeader } from '../components/MinimalHeader';

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = "February 28, 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      <MinimalHeader />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Privacy Policy for Pairfect
          </h1>

          <p className="text-gray-600 mb-6">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-gray max-w-none">

            {/* Introduction */}
            <section className="mb-8">
              <p className="text-gray-600 mb-4">
                Pairfect ("we", "our", or "us") operates the Pairfect mobile application (the "Service").
                This Privacy Policy explains how we collect, use, and protect your information when you use our app.
                By using Pairfect, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
              <p className="text-gray-600 mb-4">
                When you create an account, we collect information such as your username, email address,
                and password. Passwords are stored securely using encryption. We also collect profile
                information you choose to provide, including your bio, interests, photos, gender, and date of birth.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Usage Information</h3>
              <p className="text-gray-600 mb-4">
                We collect information about how you use the app, including interactions with other users,
                swipe activity, chat messages, and other in-app actions.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Location Information</h3>
              <p className="text-gray-600 mb-4">
                We may collect approximate location data to help you find matches near you.
                You can control location permissions in your device settings.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Camera Access</h3>
              <p className="text-gray-600 mb-4">
                Pairfect uses your device’s camera to allow you to upload or capture profile photos and other content.
                We do not access your camera without your permission and only store images that you choose to upload.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Payment and Subscription Information</h3>
              <p className="text-gray-600 mb-4">
                If you purchase premium features or subscriptions, payments are processed by third-party
                payment providers. We do not store your credit card or banking details.
              </p>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>To create and manage your account</li>
                <li>To provide and maintain our dating service</li>
                <li>To match you with compatible users</li>
                <li>To enable communication between users</li>
                <li>To process subscriptions and payments</li>
                <li>To improve features and user experience</li>
                <li>To ensure security and prevent fraud</li>
                <li>To send service-related notifications</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">With Other Users</h3>
              <p className="text-gray-600 mb-4">
                Your profile information (such as name, age, bio, photos, and interests) is visible to other users.
                Your private messages are only visible to you and the recipient.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Service Providers</h3>
              <p className="text-gray-600 mb-4">
                We may share information with trusted third-party service providers who help operate our service,
                including hosting, analytics, and payment processing services.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Legal Requirements</h3>
              <p className="text-gray-600 mb-4">
                We may disclose your information if required by law or to protect the rights, safety,
                and property of Pairfect and its users.
              </p>
            </section>

            {/* Third Party Services */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Services</h2>
              <p className="text-gray-600 mb-4">
                Pairfect uses third-party services to operate and improve the app, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Brevo – for email and communication services</li>
                <li>Expo – for app development and analytics</li>
                <li>Payment processors for subscriptions and in-app purchases</li>
              </ul>
              <p className="text-gray-600 mt-4">
                These services may collect information according to their own privacy policies.
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We use appropriate technical and organizational measures to protect your personal information.
                However, no method of transmission over the internet or electronic storage is 100% secure.
              </p>
            </section>

            {/* User Rights */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Access and update your personal information</li>
                <li>Request deletion of your account and data</li>
                <li>Control your privacy settings</li>
                <li>Request a copy of your personal data</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your information only for as long as necessary to provide our services and
                comply with legal obligations. When you delete your account, your data will be removed
                within a reasonable timeframe unless required by law.
              </p>
            </section>

            {/* Children */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children’s Privacy</h2>
              <p className="text-gray-600 mb-4">
                Pairfect is not intended for individuals under the age of 18.
                We do not knowingly collect personal information from children under 18.
                If we discover such data, it will be deleted immediately.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Data Transfers</h2>
              <p className="text-gray-600 mb-4">
                Your information may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place in accordance with applicable data protection laws.
              </p>
            </section>

            {/* Policy Changes */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-600 mb-4">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page
                with an updated "Last updated" date.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our data practices, contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@pairfect.com
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;