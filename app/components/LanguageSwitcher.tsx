'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
    const pathname = usePathname();
    const router = useRouter();

    const toggleLanguage = () => {
        if (!pathname) return;

        const segments = pathname.split('/');
        // segments[0] is empty string because pathname starts with /
        // segments[1] is the locale (e.g., 'en' or 'fr')
        const currentLocale = segments[1];

        // Default to 'fr' if current is 'en', otherwise 'en'
        const newLocale = currentLocale === 'en' ? 'fr' : 'en';

        // Replace the locale segment
        segments[1] = newLocale;
        const newPath = segments.join('/');

        router.push(newPath);
    };

    // Get current locale directly inside component for render
    const currentLocale = pathname?.split('/')[1] || 'en';

    return (
        <button
            onClick={toggleLanguage}
            className="p-2 text-gray-500 hover:text-[#E60000] transition-colors relative group"
            title={`Switch to ${currentLocale === 'en' ? 'French' : 'English'}`}
        >
            <Languages size={20} />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {currentLocale.toUpperCase()}
            </span>
        </button>
    );
}
