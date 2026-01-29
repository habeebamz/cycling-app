import Link from "next/link";
import { Zap, Map, Activity, Share2, Moon } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-600">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="text-orange-600 fill-orange-600" size={24} />
          <span className="text-xl font-bold tracking-tight">CycleTrack</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="#features" className="hover:text-gray-900 transition">Features</Link>
          <Link href="#pricing" className="hover:text-gray-900 transition">Pricing</Link>
          <button className="text-gray-400 hover:text-gray-900 transition">
            <Moon size={20} />
          </button>
          <div className="h-4 w-px bg-gray-200"></div>
          <Link href="/login" className="hover:text-gray-900 transition">Log In</Link>
          <Link href="/register" className="bg-orange-600 text-white px-5 py-2.5 rounded-lg hover:bg-orange-700 transition shadow-lg shadow-orange-600/20">
            Sign Up Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative pt-20 pb-32 flex items-center min-h-[80vh]">
          {/* Hero Background */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1920&auto=format&fit=crop')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold mb-8 border border-orange-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                New: Live Heart Rate Sync
              </div>

              <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-gray-900">
                Track Rides.<br />
                <span className="text-orange-600">Analyze Limits.</span>
              </h1>

              <p className="text-xl text-gray-800 mb-10 max-w-xl leading-relaxed font-medium">
                The advanced cycling platform for data-driven athletes. Sync seamlessly
                with Strava, visualize your progress, and crush your goals.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="inline-flex items-center justify-center bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-700 transition shadow-xl shadow-orange-600/20">
                  Start Riding Free
                </Link>
                <Link href="/demo" className="inline-flex items-center justify-center bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white transition">
                  Live Demo
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">Everything you need to ride faster</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-500/5 transition duration-300">
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                <Map size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">GPS Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                High-precision recording with auto-pause and elevation correction.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-500/5 transition duration-300">
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Advanced Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Deep dive into power curves, heart rate zones, and seasonal trends.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-500/5 transition duration-300">
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                <Share2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Strava Sync</h3>
              <p className="text-gray-600 leading-relaxed">
                Automatically push your rides to Strava with photos and rich metadata.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="text-orange-500 fill-orange-500" size={24} />
                <span className="text-xl font-bold tracking-tight">CycleTrack</span>
              </div>
              <p className="text-gray-400 max-w-sm mb-8">
                The most advanced platform for cyclists to track, analyze, and improve their performance.
                Join our community today.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-orange-600 hover:text-white transition">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-orange-600 hover:text-white transition">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-orange-600 hover:text-white transition">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465 1.067-.047 1.409-.06 3.809-.06h.63zm1.418 2.003l-.31 6.216 6.379-.222-.608-5.994zM12 7c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5zm0 2c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm6.536-2.827a1.038 1.038 0 10.001 2.076 1.038 1.038 0 00-.001-2.076z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">Download</Link></li>
                <li><Link href="#" className="hover:text-white transition">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Get the App</h4>
              <div className="flex flex-col gap-3">
                <button className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 rounded-xl px-4 py-2 flex items-center gap-3 transition">
                  <span className="text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold text-gray-400 leading-none">Download on the</div>
                    <div className="text-sm font-bold text-white">App Store</div>
                  </div>
                </button>
                <button className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 rounded-xl px-4 py-2 flex items-center gap-3 transition">
                  <span className="text-2xl">🤖</span>
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold text-gray-400 leading-none">Get it on</div>
                    <div className="text-sm font-bold text-white">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; 2026 CycleTrack Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
