
// Home.tsx
import { Link } from 'react-router-dom';
import { Award, Shield, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Decentralized Academic
          <span className="text-primary"> Verification</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Secure, transparent, and verifiable academic credentials powered by blockchain technology.
          Take control of your educational achievements.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/dashboard">
            <Button size="lg">
              Get Started
            </Button>
          </Link>
          <Link to="/verify">
            <Button size="lg" variant="outline">
              Verify Credential
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">
          Why Choose Academic Verify?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Secure</CardTitle>
              <CardDescription>
                Cryptographically secured credentials stored on blockchain
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Instant Verification</CardTitle>
              <CardDescription>
                Verify credentials in seconds without intermediaries
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Self-Sovereign</CardTitle>
              <CardDescription>
                You own and control your academic credentials
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Award className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Reputation System</CardTitle>
              <CardDescription>
                Transparent institution rankings and endorsements
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-accent/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your DID</h3>
            <p className="text-muted-foreground">
              Set up your decentralized identity to receive and manage credentials
            </p>
          </div>

          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Receive Credentials</h3>
            <p className="text-muted-foreground">
              Institutions issue verifiable credentials directly to your DID
            </p>
          </div>

          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Share & Verify</h3>
            <p className="text-muted-foreground">
              Share credentials with anyone who can instantly verify authenticity
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}