
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Settings, HelpCircle, Shield, Key, Book } from "lucide-react";
import { Link } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
  hasValidToken?: boolean;
}

export default function AppLayout({ children, hasValidToken = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-code text-white text-sm"></i>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Figma Converter Pro</h1>
                  <p className="text-xs text-slate-500">Design to Code Pipeline</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>System Active</span>
                </div>
                {hasValidToken ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Token Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    <Key className="h-3 w-3 mr-1" />
                    Configure Token
                  </Badge>
                )}
              </div>
              <Link href="/documentation">
                <Button variant="outline" size="sm">
                  <Book className="h-4 w-4 mr-2" />
                  Documentation
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
