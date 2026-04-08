import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen" style={{ background: '#030303' }}>
            <Sidebar />
            {/* Main content - offset by sidebar on desktop, padded on mobile */}
            <main className="flex-1 ml-0 md:ml-[232px] pt-16 md:pt-0 min-h-screen overflow-auto w-full">
                {children}
            </main>
        </div>
    )
}
