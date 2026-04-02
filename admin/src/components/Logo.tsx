export function LogoIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 200 290" fill="none" className={className} {...props}>
            <rect x="4" y="28" width="192" height="258" rx="3" fill="none" stroke="currentColor" strokeWidth="13" />
            <rect x="68" y="16" width="64" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="11" />
            <path d="M80 16 C80 4 120 4 120 16" fill="none" stroke="currentColor" strokeWidth="11" />
            <path d="M48 158 L86 198 L158 108" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

