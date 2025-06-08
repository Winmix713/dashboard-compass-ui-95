import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Palette, 
  Code, 
  Eye, 
  Download,
  Share,
  Zap,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CssPreviewProps {
  cssCode: string;
  componentName?: string;
  onCopy?: (text: string) => void;
  onShare?: (shareData: any) => void;
}

interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  usage: string[];
}

export const InteractiveCssPreview: React.FC<CssPreviewProps> = ({
  cssCode,
  componentName = 'Component',
  onCopy,
  onShare
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [extractedColors, setExtractedColors] = useState<ColorInfo[]>([]);
  const [syntaxHighlightedCss, setSyntaxHighlightedCss] = useState('');
  const { toast } = useToast();

  // Extract colors from CSS code
  const extractColorsFromCss = useMemo(() => {
    const colors: ColorInfo[] = [];
    const colorMap = new Map<string, string[]>();
    
    // Extract HEX colors
    const hexMatches = cssCode.match(/#[0-9a-fA-F]{3,8}/g) || [];
    hexMatches.forEach(hex => {
      const normalizedHex = hex.toLowerCase();
      if (!colorMap.has(normalizedHex)) {
        colorMap.set(normalizedHex, []);
      }
      const context = extractColorContext(cssCode, hex);
      colorMap.get(normalizedHex)?.push(context);
    });

    // Extract RGB colors
    const rgbMatches = cssCode.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g) || [];
    rgbMatches.forEach(rgb => {
      const hex = rgbToHex(rgb);
      if (!colorMap.has(hex)) {
        colorMap.set(hex, []);
      }
      const context = extractColorContext(cssCode, rgb);
      colorMap.get(hex)?.push(context);
    });

    // Extract RGBA colors
    const rgbaMatches = cssCode.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g) || [];
    rgbaMatches.forEach(rgba => {
      const hex = rgbaToHex(rgba);
      if (!colorMap.has(hex)) {
        colorMap.set(hex, []);
      }
      const context = extractColorContext(cssCode, rgba);
      colorMap.get(hex)?.push(context);
    });

    // Convert to ColorInfo objects
    colorMap.forEach((usage, hex) => {
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      colors.push({
        hex,
        rgb,
        hsl,
        usage: Array.from(new Set(usage)) // Remove duplicates
      });
    });

    return colors;
  }, [cssCode]);

  // Apply syntax highlighting
  useEffect(() => {
    const highlightedCss = applySyntaxHighlighting(cssCode);
    setSyntaxHighlightedCss(highlightedCss);
    setExtractedColors(extractColorsFromCss);
  }, [cssCode, extractColorsFromCss]);

  const extractColorContext = (css: string, color: string): string => {
    const lines = css.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(color)) {
        const property = lines[i].trim().split(':')[0].trim();
        return property || 'unknown property';
      }
    }
    return 'unknown context';
  };

  const rgbToHex = (rgb: string): string => {
    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return '#000000';
    const r = parseInt(matches[0]);
    const g = parseInt(matches[1]);
    const b = parseInt(matches[2]);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const rgbaToHex = (rgba: string): string => {
    const matches = rgba.match(/[\d.]+/g);
    if (!matches || matches.length < 4) return '#000000';
    const r = parseInt(matches[0]);
    const g = parseInt(matches[1]);
    const b = parseInt(matches[2]);
    const a = parseFloat(matches[3]);
    const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alpha}`;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const applySyntaxHighlighting = (css: string): string => {
    return css
      .replace(/([.#][\w-]+)/g, '<span class="text-blue-600 font-semibold">$1</span>')
      .replace(/([\w-]+)(?=\s*:)/g, '<span class="text-purple-600">$1</span>')
      .replace(/(#[0-9a-fA-F]{3,8})/g, '<span class="text-green-600 font-mono">$1</span>')
      .replace(/(\d+px|\d+rem|\d+em|\d+%)/g, '<span class="text-orange-600">$1</span>')
      .replace(/({|})/g, '<span class="text-gray-600 font-bold">$1</span>');
  };

  const handleCopyColor = (color: ColorInfo) => {
    navigator.clipboard.writeText(color.hex);
    toast({
      title: "Color Copied",
      description: `${color.hex} copied to clipboard`,
    });
    onCopy?.(color.hex);
  };

  const handleCopyCss = () => {
    navigator.clipboard.writeText(cssCode);
    toast({
      title: "CSS Copied",
      description: "CSS code copied to clipboard",
    });
    onCopy?.(cssCode);
  };

  const handleShare = () => {
    const shareData = {
      title: `${componentName} CSS`,
      text: `Check out this CSS component: ${componentName}`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      });
    }
    onShare?.(shareData);
  };

  const generateColorPalette = () => {
    const paletteText = extractedColors
      .map(color => `${color.hex} /* ${color.usage.join(', ')} */`)
      .join('\n');
    
    navigator.clipboard.writeText(paletteText);
    toast({
      title: "Color Palette Exported",
      description: `${extractedColors.length} colors copied to clipboard`,
    });
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {componentName} Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              {extractedColors.length} colors
            </Badge>
            <Button size="sm" variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
            <TabsTrigger value="code">Syntax Highlighted Code</TabsTrigger>
            <TabsTrigger value="colors">Color Palette</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Live CSS Preview</h4>
                  <Button size="sm" variant="outline" onClick={handleCopyCss}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy CSS
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white">
                  <style dangerouslySetInnerHTML={{ __html: cssCode }} />
                  <div className="preview-container">
                    <div className="w-full h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                      <p className="text-slate-600">Component preview will render here with applied styles</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Syntax Highlighted CSS</h4>
                  <Button size="sm" variant="outline" onClick={handleCopyCss}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-50 border rounded-lg p-4 overflow-x-auto text-sm font-mono">
                  <code dangerouslySetInnerHTML={{ __html: syntaxHighlightedCss }} />
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Extracted Color Palette</h4>
                  <Button size="sm" variant="outline" onClick={generateColorPalette}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Palette
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {extractedColors.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Palette className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>No colors found in CSS</p>
                    <p className="text-sm">Add some colors to see the palette</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {extractedColors.map((color, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleCopyColor(color)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-8 h-8 rounded border shadow-sm"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div>
                            <div className="font-mono text-sm font-semibold">{color.hex}</div>
                            <div className="text-xs text-slate-500">Click to copy</div>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">RGB:</span>
                            <span className="font-mono">
                              {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">HSL:</span>
                            <span className="font-mono">
                              {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs text-slate-500 mb-1">Used in:</div>
                          <div className="flex flex-wrap gap-1">
                            {color.usage.slice(0, 3).map((usage, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {usage}
                              </Badge>
                            ))}
                            {color.usage.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{color.usage.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {extractedColors.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">Color Palette Features</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Click any color to copy HEX value to clipboard</li>
                      <li>• Export complete palette with CSS custom properties</li>
                      <li>• View RGB and HSL values for each color</li>
                      <li>• See where each color is used in your CSS</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};