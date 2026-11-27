import React from 'react';
import { Database, Lock, Shield } from 'lucide-react';

export default function FooterBar() {
  return (
    <footer className="border-t border-[#E6E2F0] bg-[#FFFFFF] mt-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-[#6D6A7C]">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#8B7CC8]" />
          <span className="font-medium text-[#22202B]">CyberBloom</span>
          <span>· Client-Side PII Sanitization Workspace</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#8B7CC8]" />
            Browser-Only Execution
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#8B7CC8]" />
            IndexedDB (Zero-PII Metadata)
          </span>
        </div>
      </div>
    </footer>
  );
}
