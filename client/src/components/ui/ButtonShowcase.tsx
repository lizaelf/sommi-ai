import React from "react";
import Button from "./Button";
import { IconButton } from "./IconButton";
import { Play, Download, Settings, Heart, X, Mic } from "lucide-react";

/**
 * Button System Showcase
 * Demonstrates all standardized button variants and sizes
 * Use this component as a reference for consistent button styling across the app
 */
export default function ButtonShowcase() {
  return (
    <div className="p-8 space-y-8 bg-black text-white">
      <div>
        <h1 className="text-2xl font-bold mb-4">Standardized Button System</h1>
        <p className="text-gray-300 mb-8">
          All buttons in the wine exploration platform use these standardized variants for consistency.
        </p>
      </div>

      {/* Primary Buttons */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Primary Buttons</h2>
        <div className="flex gap-4 items-center">
          <Button variant="primary" size="sm">Small Primary</Button>
          <Button variant="primary" size="default">Default Primary</Button>
          <Button variant="primary" size="lg">Large Primary</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      {/* Secondary Buttons */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Secondary Buttons</h2>
        <div className="flex gap-4 items-center">
          <Button variant="secondary" size="sm">Small Secondary</Button>
          <Button variant="secondary" size="default">Default Secondary</Button>
          <Button variant="secondary" size="lg">Large Secondary</Button>
          <Button variant="secondary" disabled>Disabled</Button>
        </div>
      </section>

      {/* Additional Secondary Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Additional Secondary Examples</h2>
        <div className="flex gap-4 items-center">
          <Button variant="secondary" size="sm">Small Secondary</Button>
          <Button variant="secondary" size="default">Default Secondary</Button>
          <Button variant="secondary" size="lg">Large Secondary</Button>
          <Button variant="secondary" disabled>Disabled Secondary</Button>
        </div>
      </section>

      {/* Error Buttons */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Error/Destructive</h2>
        <div className="flex gap-4 items-center">
          <Button variant="error" size="sm">Delete Item</Button>
          <Button variant="error" size="default">Remove Account</Button>
          <Button variant="error" size="lg">Permanent Delete</Button>
        </div>
      </section>

      {/* Suggestion Pills */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Suggestion Pills</h2>
        <div className="flex gap-3 flex-wrap">
          <Button variant="suggestion">What does this taste like?</Button>
          <Button variant="suggestion">Food pairing suggestions?</Button>
          <Button variant="suggestion">Serving temperature?</Button>
          <Button variant="suggestion">How long to age?</Button>
        </div>
      </section>

      {/* Icon Buttons */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Icon Buttons</h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <h3 className="text-sm font-medium w-24">Header Icons:</h3>
            <IconButton icon={Settings} variant="headerIcon" />
            <IconButton icon={Heart} variant="headerIcon" />
            <IconButton icon={X} variant="headerIcon" />
          </div>
          
          <div className="flex gap-4 items-center">
            <h3 className="text-sm font-medium w-24">Primary:</h3>
            <IconButton icon={Play} variant="primary" size="iconSm" />
            <IconButton icon={Play} variant="primary" size="icon" />
            <IconButton icon={Play} variant="primary" size="iconLg" />
          </div>
          
          <div className="flex gap-4 items-center">
            <h3 className="text-sm font-medium w-24">Secondary:</h3>
            <IconButton icon={Download} variant="secondary" size="iconSm" />
            <IconButton icon={Download} variant="secondary" size="icon" />
            <IconButton icon={Download} variant="secondary" size="iconLg" />
          </div>
          
          <div className="flex gap-4 items-center">
            <h3 className="text-sm font-medium w-24">With Text:</h3>
            <IconButton icon={Mic} variant="secondaryFilled" size="default">
              Voice Assistant
            </IconButton>
            <IconButton icon={Settings} variant="tertiary" size="default">
              Settings
            </IconButton>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
        <div className="bg-gray-900 p-4 rounded-lg">
          <pre className="text-sm text-gray-300">
{`// Import standardized components
import Button from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Settings } from "lucide-react";

// Primary action (CTAs, submit buttons)
<Button variant="primary">Buy Wine</Button>

// Secondary actions (cancel, back, alternative actions)
<Button variant="secondary">View Details</Button>

// Filled secondary for emphasis without primary weight
<Button variant="secondaryFilled">Add to Collection</Button>

// Destructive actions
<Button variant="error">Delete Account</Button>

// Voice assistant suggestions
<Button variant="suggestion">What food pairs well?</Button>

// Header navigation icons
<IconButton icon={Settings} variant="headerIcon" />

// Action buttons with icons
<IconButton icon={Play} variant="primary" size="icon" />`}
          </pre>
        </div>
      </section>

      {/* Design Principles */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Design Principles</h2>
        <div className="bg-gray-900 p-4 rounded-lg space-y-2 text-sm">
          <p><strong>Hierarchy:</strong> Primary (white) → Secondary Filled → Secondary (outline) → Tertiary/Ghost</p>
          <p><strong>Consistency:</strong> All buttons use rounded-full corners and consistent hover/active states</p>
          <p><strong>Accessibility:</strong> Focus rings, proper contrast ratios, and disabled states included</p>
          <p><strong>Responsive:</strong> Three sizes (sm, default, lg) with appropriate icon sizes</p>
          <p><strong>Context:</strong> Specialized variants for suggestions, headers, and destructive actions</p>
        </div>
      </section>
    </div>
  );
}