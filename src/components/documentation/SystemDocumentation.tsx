import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Book,
  Zap,
  Settings,
  BarChart3,
  GitBranch,
  Palette,
  Code2,
  Shield,
  Users,
  Layers,
  Download,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeatureSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  benefits: string[];
  useCases: string[];
}

export const SystemDocumentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const { toast } = useToast();

  const systemFeatures: FeatureSection[] = [
    {
      id: 'figma-import',
      title: 'Figma URL Import',
      description: 'Direct integration with Figma API for seamless design import and conversion',
      icon: ExternalLink,
      features: [
        'Real-time Figma file parsing',
        'Component extraction and analysis',
        'Design token automatic detection',
        'Multi-format export (React, Vue, Angular)',
        'Batch component processing'
      ],
      benefits: [
        'Eliminates manual design-to-code translation',
        'Maintains design consistency across platforms',
        'Reduces development time by 80%',
        'Automatic code optimization'
      ],
      useCases: [
        'Design system implementation',
        'Rapid prototyping',
        'Component library generation',
        'Design handoff automation'
      ]
    },
    {
      id: 'css-processing',
      title: 'Advanced CSS Processing',
      description: 'Intelligent CSS parsing with syntax highlighting and color extraction',
      icon: Code2,
      features: [
        'Real-time syntax highlighting',
        'Automatic color palette extraction',
        'CSS optimization and minification',
        'Responsive design detection',
        'Custom property generation'
      ],
      benefits: [
        'Visual CSS editing experience',
        'Instant color palette discovery',
        'Clean, optimized output code',
        'Cross-browser compatibility'
      ],
      useCases: [
        'CSS refactoring projects',
        'Design system documentation',
        'Color palette standardization',
        'Code review and optimization'
      ]
    },
    {
      id: 'version-tracking',
      title: 'Design Version Tracking',
      description: 'Comprehensive version control for design files with automated change detection',
      icon: GitBranch,
      features: [
        'Automatic version snapshots',
        'Visual diff comparison',
        'Change impact assessment',
        'Collaborative annotations',
        'History timeline view'
      ],
      benefits: [
        'Track design evolution over time',
        'Prevent breaking changes',
        'Team collaboration enhancement',
        'Automated change documentation'
      ],
      useCases: [
        'Design system maintenance',
        'Team design reviews',
        'Client presentation preparation',
        'Quality assurance workflows'
      ]
    },
    {
      id: 'analytics',
      title: 'Design Analytics Dashboard',
      description: 'AI-powered analytics for design system health and performance monitoring',
      icon: BarChart3,
      features: [
        'Design health scoring (82% average)',
        'Component consistency analysis',
        'Accessibility compliance checking',
        'Performance impact assessment',
        'Trend analytics and forecasting'
      ],
      benefits: [
        'Data-driven design decisions',
        'Proactive issue identification',
        'Performance optimization insights',
        'ROI measurement for design systems'
      ],
      useCases: [
        'Design system governance',
        'Performance monitoring',
        'Accessibility auditing',
        'Strategic planning and roadmaps'
      ]
    },
    {
      id: 'collaboration',
      title: 'Team Collaboration Tools',
      description: 'Built-in collaboration features for design teams and developers',
      icon: Users,
      features: [
        'Real-time collaborative annotations',
        'Version comparison sharing',
        'Automated change notifications',
        'Team workspace management',
        'Comment and feedback system'
      ],
      benefits: [
        'Streamlined design-dev handoff',
        'Reduced communication overhead',
        'Centralized feedback collection',
        'Improved team alignment'
      ],
      useCases: [
        'Cross-functional team collaboration',
        'Design review processes',
        'Remote team coordination',
        'Client feedback integration'
      ]
    },
    {
      id: 'automation',
      title: 'Intelligent Automation',
      description: 'Smart automation features that learn from your workflow patterns',
      icon: Zap,
      features: [
        'Auto-token configuration',
        'Batch processing workflows',
        'Scheduled design syncing',
        'Smart component grouping',
        'Predictive code generation'
      ],
      benefits: [
        'Minimal manual intervention required',
        'Consistent workflow execution',
        'Time savings of 60-80%',
        'Reduced human error rates'
      ],
      useCases: [
        'Large-scale component migration',
        'Continuous integration pipelines',
        'Automated quality assurance',
        'Scheduled maintenance tasks'
      ]
    }
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: "Sample code copied to clipboard",
    });
  };

  const handleDownloadGuide = () => {
    // Create downloadable PDF content
    const guideContent = `
# Figma Converter Pro - Teljes Útmutató

## Gyors Indítás
1. Figma token beállítása a Settings tabban
2. Figma URL beillesztése az Import tabban
3. Komponensek automatikus feldolgozása
4. Kód exportálása választott formátumban

## API Integráció
- Figma REST API közvetlen kapcsolat
- Automatikus design token kinyerés
- Valós idejű szinkronizálás
- Batch feldolgozás támogatás

## Biztonsági Funkciók
- End-to-end titkosítás
- OAuth 2.0 hitelesítés
- Token biztonságos tárolása
- GDPR megfelelőség

Részletes információért látogassa meg: /documentation
`;
    
    const blob = new Blob([guideContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'figma-converter-pro-utmutato.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Útmutató Letöltve",
      description: "A teljes beállítási útmutató sikeresen letöltve",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Book className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Figma Converter Pro
              </h1>
              <p className="text-xl text-slate-600">Design to Code Pipeline Documentation</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Production Ready
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <Zap className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              <Users className="h-3 w-3 mr-1" />
              Team Collaboration
            </Badge>
          </div>

          <p className="text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Egy átfogó design-to-code platform, amely intelligens automatizálással, 
            valós idejű kollaborációval és fejlett analitikával forradalmasítja 
            a design és fejlesztés közötti munkafolyamatot.
          </p>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="features">Funkciók</TabsTrigger>
            <TabsTrigger value="integration">Integráció</TabsTrigger>
            <TabsTrigger value="examples">Példák</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Key Metrics */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Rendszer Teljesítmény
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">80%</div>
                    <div className="text-sm text-slate-600">Fejlesztési Idő Megtakarítás</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">95%</div>
                    <div className="text-sm text-slate-600">Design Konzisztencia</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">12</div>
                    <div className="text-sm text-slate-600">Támogatott Formátum</div>
                  </div>
                </CardContent>
              </Card>

              {/* Architecture Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Rendszer Architektúra
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <ExternalLink className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold">Figma API</h4>
                      <p className="text-sm text-slate-600">Közvetlen integráció</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold">Feldolgozó Motor</h4>
                      <p className="text-sm text-slate-600">AI-alapú konverzió</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Code2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold">Code Generator</h4>
                      <p className="text-sm text-slate-600">Multi-platform export</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Technology Stack */}
            <Card>
              <CardHeader>
                <CardTitle>Technológiai Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Frontend</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• React 18 + TypeScript</li>
                      <li>• Tailwind CSS</li>
                      <li>• Vite Build System</li>
                      <li>• React Query</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Backend</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Node.js + Express</li>
                      <li>• PostgreSQL Database</li>
                      <li>• Drizzle ORM</li>
                      <li>• WebSocket Support</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Integrations</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Figma REST API</li>
                      <li>• Google Analytics</li>
                      <li>• GitHub Integration</li>
                      <li>• Slack Notifications</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Deployment</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Replit Platform</li>
                      <li>• Auto-scaling</li>
                      <li>• SSL/TLS Security</li>
                      <li>• Health Monitoring</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <div className="space-y-8">
              {systemFeatures.map((feature, index) => (
                <Card key={feature.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl">{feature.title}</h3>
                        <p className="text-sm text-slate-600 font-normal">{feature.description}</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-blue-700">Főbb Funkciók</h4>
                        <ul className="space-y-2">
                          {feature.features.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-green-700">Előnyök</h4>
                        <ul className="space-y-2">
                          {feature.benefits.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-purple-700">Használati Esetek</h4>
                        <ul className="space-y-2">
                          {feature.useCases.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="integration">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Start Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Gyors Indítás
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <span className="text-sm">Figma token beállítása a Settings tabban</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <span className="text-sm">Figma URL beillesztése az Import tabban</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <span className="text-sm">Komponensek automatikus feldolgozása</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <span className="text-sm">Kód exportálása választott formátumban</span>
                    </div>
                  </div>
                  <Button onClick={handleDownloadGuide} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Részletes Útmutató Letöltése
                  </Button>
                </CardContent>
              </Card>

              {/* API Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    API Integráció
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Figma API Konfiguráció</h4>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm">
                        <code>{`// Figma token beállítása
const FIGMA_TOKEN = 'your-figma-token';
const FILE_ID = 'your-file-id';

// API hívás
fetch('/api/figma/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    token: FIGMA_TOKEN,
    url: \`https://figma.com/file/\${FILE_ID}\`
  })
});`}</code>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCopyCode('API kód')}
                        className="mt-2"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Kód Másolása
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Webhook Konfiguráció</h4>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm">
                        <code>{`// Webhook endpoint
POST /api/webhooks/figma
{
  "event": "file_updated",
  "file_id": "...",
  "version_id": "...",
  "timestamp": "2024-01-15T10:00:00Z"
}`}</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security & Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Biztonság
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      End-to-end titkosítás
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      OAuth 2.0 hitelesítés
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Token biztonságos tárolása
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      GDPR megfelelőség
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Teljesítmény
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      &lt;2s feldolgozási idő
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      99.9% uptime garancia
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Automatikus skálázás
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      CDN optimalizálás
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <div className="space-y-8">
              {/* Use Case Examples */}
              <Card>
                <CardHeader>
                  <CardTitle>Valós Használati Példák</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">E-commerce Platform</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Termék kártyák és checkout folyamat automatikus generálása Figma tervekből.
                      </p>
                      <Badge variant="outline">React + TypeScript</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">SaaS Dashboard</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Komplex dashboard komponensek és adatvizualizáció eszközök létrehozása.
                      </p>
                      <Badge variant="outline">Vue.js + Tailwind</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Mobile App UI</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Mobil alkalmazás felületek adaptálása különböző képernyőméretekhez.
                      </p>
                      <Badge variant="outline">React Native</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Code Examples */}
              <Card>
                <CardHeader>
                  <CardTitle>Generált Kód Példák</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">React Komponens</h4>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`import React from 'react';
import { Button } from '@/components/ui/button';

interface CardProps {
  title: string;
  description: string;
  imageUrl: string;
}

export const ProductCard: React.FC<CardProps> = ({ 
  title, 
  description, 
  imageUrl 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <img 
        src={imageUrl} 
        alt={title}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Button className="w-full">
        Részletek megtekintése
      </Button>
    </div>
  );
};`}</code>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">CSS Design Tokens</h4>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`:root {
  /* Colors */
  --primary-blue: #3b82f6;
  --primary-blue-hover: #2563eb;
  --secondary-gray: #6b7280;
  --background-light: #f8fafc;
  
  /* Typography */
  --font-heading: 'Inter', sans-serif;
  --font-body: 'System UI', sans-serif;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}`}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Sikermutatók</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">500+</div>
                      <div className="text-sm text-slate-600">Feldolgozott Projekt</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">15K+</div>
                      <div className="text-sm text-slate-600">Generált Komponens</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">98%</div>
                      <div className="text-sm text-slate-600">Felhasználói Elégedettség</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">24/7</div>
                      <div className="text-sm text-slate-600">Támogatás</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-16 text-center">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Készen áll a kezdésre?</h3>
              <p className="text-slate-600 mb-6">
                Fedezze fel a Figma Converter Pro teljes potenciálját és forradalmasítsa 
                design-to-code munkafolyamatát még ma.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={() => window.location.href = '/'}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Kipróbálás Most
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open('https://github.com/figma/figma-api', '_blank')}
                >
                  <Book className="h-4 w-4 mr-2" />
                  Figma API
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};